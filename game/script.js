let $ = (x) => document.querySelector(x);
let $$ = (x) => document.querySelectorAll(x);

let CANVAS, CTX;

function onLoad(e,t,w,h) {
    t = this || t;
    e = event || e;

    CANVAS = $("#canvas");
    CTX = CANVAS.getContext("2d");

    window.addEventListener("resize", function() {
        CANVAS.width = document.body.offsetWidth;
        CANVAS.height = document.body.offsetHeight;
    });
    CANVAS.width = document.body.offsetWidth;
    CANVAS.height = document.body.offsetHeight;

    game_init(w,h);
}

function ajax_loader(data_list, addFunction, readyFunction) {
    /*
    data_list = [["file_url", "key"], ...]
    addFunction(file_url, key, response) : function to add response
    readyFunction() : will call after getting all files
    */
    if (!Function.prototype.isPrototypeOf(addFunction)) throw "Expected Function at argument 2, got"+typeof(addFunction);
    if (!Function.prototype.isPrototypeOf(readyFunction)) throw "Expected Function at argument 3, got"+typeof(readyFunction);

    let xhr = new XMLHttpRequest();

    let d = data_list.pop();
    xhr.open("GET", d[0]);
    xhr.data_file_url = d[0];
    xhr.data_key = d[1];
    xhr.onreadystatechange = function () {
        if (this.readyState !== 4) return false;
        addFunction(xhr.data_file_url, xhr.data_key, this.response);
        if (data_list.length>0) {
            let d = data_list.pop();
            xhr.open("GET", d[0]);
            xhr.data_file_url = d[0];
            xhr.data_key = d[1];
            xhr.send();
        } else {
            return readyFunction();
        }
    };
    xhr.send();
}

function game_init(w,h) {
    CANVAS.game_data = {};
    let data = CANVAS.game_data;        //pointer
    data.width = w;
    data.height = h;
    data.right_panel = {};
    data.right_panel.width = 120;
    data.right_panel.height = CANVAS.height;
    data.svgs = {};
    data.pattern = {};
    data.pattern.width = 80;           //SQUARE ALWAYS
    data.pattern.height = 80;
    data.pattern.selected = 0;
    data.pattern.list = {};         //не совсем list
    data.pattern.list["l-h"] = 10;
    data.pattern.list["l-v"] = 15;
    data.pattern.list["c-ur"] = 8;
    data.position_over = {"x":-1,"y":-1};
    data.positions = [];
    for (let y=0; y<data.height; y++) {
        data.positions[y] = [];
        for (let x=0; x<data.width; x++) {
            let obj = {};
            obj.pattern = "e";
            obj.position = {"x":0, "y":0};
            data.positions[y][x] = obj;
        }
    }
    window.addEventListener("wheel", function() {
        if (event.wheelDelta < 0) {
            data.pattern.selected++;
            if (data.pattern.selected >= Object.keys(data.pattern.list).length) data.pattern.selected = 0;
        } else {
            data.pattern.selected--;
            if (data.pattern.selected < 0) data.pattern.selected = Object.keys(data.pattern.list).length-1;
        }
    });
    CANVAS.addEventListener("mousemove", function () {
        let cx = event.clientX;
        let cy = event.clientY;
        for (let y=0; y<data.height; y++) {
            let localy = data.positions[y][0].position.y;
            if (cy >= localy && cy <= localy+data.pattern.renger_size) {
                for (let x = 0; x < data.width; x++) {
                    let localx = data.positions[y][x].position.x;
                    if (cx >= localx && cx <= localx+data.pattern.renger_size) {
                        data.position_over = {"x":x, "y":y};
                        break;
                    }
                }
                break;
            }
        }
    });
    CANVAS.addEventListener("click", function() {
        if (event.which===1) {
            //place
            if (data.position_over.x===-1 || data.position_over.y === -1) return false;
            let p_data = data.positions[data.position_over.y][data.position_over.x];        //pointer, i guess
            let iter = (function() {
                let counter = 0;
                for (let i in data.pattern.list) {
                    if (data.pattern.list.hasOwnProperty(i) && counter===data.pattern.selected) return i;
                    counter++;
                }
            })();
            if (p_data.pattern === iter) return true;
            if (data.pattern.list[iter]<=0) {
                //TODO: warning player
                return false;
            }
            data.pattern.list[iter]--;
            if (p_data.pattern!=="e") data.pattern.list[p_data.pattern]++;
            p_data.pattern = iter;
        } else if (event.which===2) {
            //remove
            if (data.position_over.x===-1 || data.position_over.y === -1) return false;

        }
    });
    if (CANVAS.addEventListener) { // IE >= 9; other browsers
        CANVAS.addEventListener('contextmenu', function(e) {      //prever RMB menu
            e.preventDefault();
        }, false);
    } else { // IE < 9
        CANVAS.attachEvent('oncontextmenu', function() {
            window.event.returnValue = false;
        });
    }

    ajax_loader([
            ["src/corner_pattern.svg", "corner_pattern"],
            ["src/line_pattern.svg", "line_pattern"],
            ["src/empty_pattern.svg", "empty_pattern"],
        ],
        function(file_url, key, response) {
            data.svgs[key] = new SVGPicture(response, data.pattern.width, data.pattern.height);
        },
        function() {
            requestAnimationFrame(game_render);
        }
    );
}

function game_render() {
    let data = CANVAS.game_data;
    CTX.clearRect(0,0, CANVAS.width, CANVAS.height);

    //drawing select (right) panel
    let part_height = CANVAS.height / Object.keys(data.pattern.list).length;
    let counter = 0;
    for (let i in data.pattern.list) {
        if (data.pattern.list.hasOwnProperty(i) && !Function.prototype.isPrototypeOf(data.pattern.list[i])) {
            let p = data.pattern.list[i];
            let props = i.match(/([^-]+)-([^$]+)$/);
            CTX.fillStyle = (data.pattern.selected === counter) ? "#f0daff" : "#FFFFFF";
            CTX.strokeStyle = "#000";
            CTX.beginPath();
            CTX.rect(CANVAS.width - data.right_panel.width, part_height * counter, data.right_panel.width, part_height);
            CTX.closePath();
            CTX.fill();
            CTX.stroke();

            CTX.save();
            let img = (props[1]==="l") ? data.svgs.line_pattern.ipicture.image : data.svgs.corner_pattern.ipicture.image;
            let patternh = (data.pattern.height >= part_height) ? part_height-4 : data.pattern.height;
            let patternx = CANVAS.width - data.right_panel.width + (2);
            let patterny = part_height * counter + (part_height - patternh) / 2;
            let rotation = {
                "h": 0,
                "v": Math.PI/2,
                "ur": 0,
                "rd": -Math.PI/2,
                "lu": Math.PI/2,
                "dl": Math.PI,
            }[props[2]];

            let tx = patternx + patternh / 2;
            let ty = patterny + patternh / 2;

            CTX.translate(tx, ty);
            CTX.rotate(rotation);
            CTX.translate(-tx, -ty);
            CTX.drawImage(img, patternx, patterny, patternh, patternh);
            CTX.restore();

            CANVAS.style.letterSpacing = "-1px";
            CTX.font = "15px Arial";
            CTX.fillStyle = "#376471";
            CTX.textAlign = "left";
            CTX.fillText(p, patternx + patternh-2, patterny + patternh);
            counter++;
        }
    }

    //drawing то, где мышкой тыкаем
    let margin_side = 30;       //for start and end pointer
    let empty_width = CANVAS.width - data.right_panel.width - margin_side*2;
    let patternw = empty_width/data.width;
    let patternh = Math.min(patternw, CANVAS.height/data.height);
    data.pattern.renger_size = patternh;
    let play_width = Math.min(empty_width, patternh*data.width);
    let playh = Math.min(CANVAS.height, patternh*data.height);
    for (let y=0; y<data.height; y++) {
        for (let x=0; x<data.width; x++) {
            let px = patternh * x + (empty_width - play_width)/2 + margin_side;
            let py = patternh * y + (CANVAS.height - playh)/2;
            if (data.position_over.x === x && data.position_over.y === y) {
                //if mouse over
                CTX.fillStyle = "#f0daff";
                CTX.beginPath();
                CTX.rect(px, py, patternh, patternh);
                CTX.closePath();
                CTX.fill();
            }
            if (data.positions[y][x].pattern === "e") {
                CTX.drawImage(data.svgs.empty_pattern.ipicture.image, px, py, patternh, patternh);
            } else {
                let props = data.positions[y][x].pattern.match(/([^-]+)-([^$]+)$/);
                let img = (props[1]==="l") ? data.svgs.line_pattern.ipicture.image : data.svgs.corner_pattern.ipicture.image;
                let rotation = {
                    "h": 0,
                    "v": Math.PI/2,
                    "ur": 0,
                    "rd": -Math.PI/2,
                    "lu": Math.PI/2,
                    "dl": Math.PI,
                }[props[2]];
                CTX.save();
                CTX.translate(px+patternh/2, py+patternh/2);
                CTX.rotate(rotation);
                CTX.translate(-(px+patternh/2), -(py+patternh/2));
                CTX.drawImage(img, px, py, patternh, patternh);
                CTX.restore();
            }
            data.positions[y][x].position = {"x":px, "y":py};
        }
    }

    requestAnimationFrame(game_render);
}