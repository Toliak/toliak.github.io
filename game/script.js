let $ = (x) => document.querySelector(x);
let $$ = (x) => document.querySelectorAll(x);

let CANVAS, CTX;

window.onload = function(e,t,w=6,h=6) {
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
};

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
    ajax_loader([
            ["src/corner_pattern.svg", "corner_pattern"],
            ["src/line_pattern.svg", "line_pattern"],
            ["src/empty_pattern.svg", "empty_pattern"],
            ["src/active_line.svg", "active_line"],
            ["src/wall_pattern.svg", "wall_pattern"],
        ],
        function(file_url, key, response) {
            data.svgs[key] = new SVGPicture(response, data.pattern.width, data.pattern.height);
        },
        function() {
            requestAnimationFrame(game_render);
        }
    );

    CANVAS.game_data = {};
    let data = CANVAS.game_data;        //pointer
    data.level_complete = false;
    data.width = w;
    data.height = h;
    data.start = Math.round(Math.random()*(h-1));
    data.stop = Math.round(Math.random()*(h-1));
    data.right_panel = {};
    data.right_panel.width = 120;
    data.right_panel.height = CANVAS.height;
    data.svgs = {};
    data.pattern = {};
    data.pattern.width = 80;           //SQUARE ALWAYS
    data.pattern.height = 80;
    data.pattern.selected = 0;
    data.pattern.list = {};         //не совсем list
    data.pattern.list["l-h"] = 0;
    data.pattern.list["l-v"] = 0;
    data.pattern.list["c-ur"] = 0;
    data.pattern.list["c-lu"] = 0;
    data.pattern.list["c-dl"] = 0;
    data.pattern.list["c-rd"] = 0;
    data.position_over = {"x":-1,"y":-1};
    data.positions = [];
    game_setField(data.positions, data);

    data.events = {};
    data.events.wheel = function() {
        if (event.wheelDelta < 0) {
            data.pattern.selected++;
            if (data.pattern.selected >= Object.keys(data.pattern.list).length) data.pattern.selected = 0;
        } else {
            data.pattern.selected--;
            if (data.pattern.selected < 0) data.pattern.selected = Object.keys(data.pattern.list).length-1;
        }
    };
    data.events.mousemove = function () {
        let cx = event.clientX;
        let cy = event.clientY;
        for (let y=0; y<data.height; y++) {
            let localy = data.positions[y][0].position.y;
            if (cy >= localy && cy <= localy+data.pattern.render_size) {
                for (let x = 0; x < data.width; x++) {
                    let localx = data.positions[y][x].position.x;
                    if (cx >= localx && cx <= localx+data.pattern.render_size) {
                        data.position_over = {"x":x, "y":y};
                        break;
                    }
                }
                break;
            }
        }
    };
    data.events.click = function() {
        if (event.which===1) {
            //place
            if (data.position_over.x===-1 || data.position_over.y === -1) return false;
            let p_data = data.positions[data.position_over.y][data.position_over.x];        //pointer, i guess
            if (p_data.pattern === "w") return false;
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
            if (p_data.pattern !== "e") data.pattern.list[p_data.pattern]++;
            p_data.pattern = iter;
        } else if (event.which===2) {

        }
    };
    data.events.contextmenu = function() {
        event.preventDefault();
        //remove
        if (data.position_over.x===-1 || data.position_over.y === -1) return false;
        let p_data = data.positions[data.position_over.y][data.position_over.x];        //pointer, i guess
        if (p_data.pattern === "e") return true;
        if (p_data.pattern === "w") return false;
        data.pattern.list[p_data.pattern]++;
        p_data.pattern = "e";
    };
    window.addEventListener("wheel", data.events.wheel);                    //select pattern
    CANVAS.addEventListener("mousemove", data.events.mousemove);            //highlight
    CANVAS.addEventListener("click", data.events.click);                    //place pattern
    CANVAS.addEventListener('contextmenu', data.events.contextmenu);        //prevent RMB menu
}

function game_reload() {
    let data = CANVAS.game_data;        //pointer
    data.level_complete = false;
    data.start = Math.round(Math.random()*(data.height-1));
    data.stop = Math.round(Math.random()*(data.height-1));
    data.pattern.selected = 0;
    data.pattern.list = {};         //не совсем list
    data.pattern.list["l-h"] = 0;
    data.pattern.list["l-v"] = 0;
    data.pattern.list["c-ur"] = 0;
    data.pattern.list["c-lu"] = 0;
    data.pattern.list["c-dl"] = 0;
    data.pattern.list["c-rd"] = 0;
    data.position_over = {"x":-1,"y":-1};
    data.positions = [];
    game_setField(data.positions, data);


    window.removeEventListener("wheel", data.events.wheel);
    CANVAS.removeEventListener("mousemove", data.events.mousemove);
    CANVAS.removeEventListener("click", data.events.click);
    CANVAS.removeEventListener('contextmenu', data.events.contextmenu);
    window.addEventListener("wheel", data.events.wheel);
    CANVAS.addEventListener("mousemove", data.events.mousemove);
    CANVAS.addEventListener("click", data.events.click);
    CANVAS.addEventListener('contextmenu', data.events.contextmenu);
}

function game_setField(field, data) {
    //create path
    for (let y=0; y<data.height; y++) {
        field[y] = [];
        for (let x=0; x<data.width; x++) {
            let obj = {};
            obj.active = false;
            obj.path = false;
            obj.position = {"x":0, "y":0};
            field[y][x] = obj;
        }
    }
    let px=0, py=data.start;
    //field[py][0].path = true;
    let line = "right";
    let h=0, v=0, ur=0, lu=0, dl=0, rd=0;
    while (px!==data.width-1) {
        let dx = (Math.round(Math.random()) === 0) ? 0 : 1;
        if (py===0 && (field[1][px].path || line==="up")) dx=1;
        else if (py===data.height-1 && (field[data.height-2][px].path || line==="down")) dx=1;
        else if ((py>0 && py<data.height-1) && field[py-1][px].path && field[py+1][px].path) dx=1;
        if (dx===1) {
            if (!field[py]) throw py;
            field[py][px].path = true;
            px+=dx;
            if (px>=data.width) break;
            if (line==="right") {
                data.pattern.list["l-h"]++;
            } else if (line==="up") {
                data.pattern.list["c-rd"]++;
            } else if (line==="down") {
                data.pattern.list["c-ur"]++;
            }
            line = "right";
        } else {
            let dy = (Math.round(Math.random()) === 0) ? 1 : -1;
            if (!field[py]) throw py;
            field[py][px].path = true;
            if (line==="up" || line==="down") {
                data.pattern.list["l-v"]++;
                py += (line==="up") ? -1 : +1;
            } else if (line==="right") {
                if (py===0) {
                    dy = +1;
                } else if (py===data.height-1) {
                    dy = -1;
                }
                if (dy===-1) {
                    line="up";
                    data.pattern.list["c-lu"]++;
                    py--;
                } else {
                    line="down";
                    data.pattern.list["c-dl"]++;
                    py++;
                }
            }

        }
    }
    if (py!==data.stop) {
        while (py!==data.stop) {
            let dy = (py<data.stop) ? 1 : -1;
            field[py][px].path = true;
            py+=dy;
            if (line==="up" || line==="down") {
                data.pattern.list["l-v"]++;
            } else {
                if (dy===-1) {
                    line="up";
                    data.pattern.list["c-lu"]++;
                } else {
                    line="down";
                    data.pattern.list["c-dl"]++;
                }
            }
        }
    }
    if (line==="right") {
        data.pattern.list["l-h"]++;
    } else if (line==="up") {
        data.pattern.list["c-rd"]++;
    } else if (line==="down") {
        data.pattern.list["c-ur"]++;
    }
    field[data.stop][px].path = true;

    for (let y=0; y<data.height; y++) {
        for (let x=0; x<data.width; x++) {
            if (field[y][x].path) {
                field[y][x].pattern="e";
                continue;
            }
            field[y][x].pattern = (Math.round(Math.random()*(100)) < 35) ? "w" : "e";
        }
    }

    for (let i in data.pattern.list){
        if (data.pattern.list.hasOwnProperty(i) && data.pattern.list[i]===0) delete data.pattern.list[i];
    }

}

function game_level_complete() {
    let data = CANVAS.game_data;
    window.removeEventListener("wheel", data.events.wheel);
    //CANVAS.removeEventListener("mousemove", data.events.mousemove);
    CANVAS.removeEventListener("click", data.events.click);
    CANVAS.removeEventListener('contextmenu', data.events.contextmenu);

    data.level_complete = true;

    //data.svgs.active_line.svgElement.querySelectorAll("*").forEach(function(item) {item.setAttribute("stroke", "#00ff03");});
    //data.svgs.active_line.updateIPicture();

    //TODO: load new level
    game_reload();
}

function game_render() {
    let data = CANVAS.game_data;
    //main check
    for (let i in data.svgs) {
        if (data.svgs.hasOwnProperty(i) && ((typeof(data.svgs[i].ipicture) === "undefined") || (typeof(data.svgs[i].ipicture.image) === "undefined")))
            return requestAnimationFrame(game_render);
    }

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
                "rd": Math.PI/2,
                "lu": -Math.PI/2,
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
            CTX.font = "bold 15px Arial";
            CTX.fillStyle = "#000000";
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
    data.pattern.render_size = patternh;
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
            } else if (data.positions[y][x].pattern === "w") {
                CTX.drawImage(data.svgs.wall_pattern.ipicture.image, px, py, patternh, patternh);
            } else {
                let props = data.positions[y][x].pattern.match(/([^-]+)-([^$]+)$/);
                let img = (props[1]==="l") ? data.svgs.line_pattern.ipicture.image : data.svgs.corner_pattern.ipicture.image;
                let rotation = {
                    "h": 0,
                    "v": Math.PI/2,
                    "ur": 0,
                    "rd": Math.PI/2,
                    "lu": -Math.PI/2,
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

    //drawing active line
    let ax = 0, ay = data.start;
    let line_type="right";
    let prevx=-1, prevy=data.start;
    while (true) {
        if ((0<=ax && ax<data.width) && (0<=ay && ay<data.height) && data.positions[ay][ax].active === true) break;
        //if ((0<=prevx && prevx<data.width) && (0<=prevy && prevy<data.height) && data.positions[prevy][prevx].pattern === "e") break;
        let localx, localy;
        if (prevx < 0) {          //if x<0, then 0<=y<data.height
            localx = data.positions[prevy][0].position.x - data.pattern.render_size;
            localy = data.positions[prevy][0].position.y;
        }
        else if (prevx >= data.width) {
            localx = data.positions[prevy][data.width-1].position.x;
            localy = data.positions[prevy][0].position.y;
        }
        else {
            if (prevy < 0) {
                localx = data.positions[0][prevx].position.x;
                localy = data.positions[0][prevx].position.y;
            } else if (prevy >= data.height) {
                localx = data.positions[0][prevx].position.x;
                localy = data.positions[data.height-1][prevx].position.y + data.pattern.render_size;
            } else {
                localx = data.positions[prevy][prevx].position.x;
                localy = data.positions[prevy][prevx].position.y;
            }
        }
        if (line_type==="right") localx+=data.pattern.render_size/2;
        else if (line_type==="left") localx-=data.pattern.render_size/2;
        else if (line_type==="up") localy-=data.pattern.render_size/2;
        else if (line_type==="down") localy+=data.pattern.render_size/2;

        CTX.save();
        let tmpx = localx + data.pattern.render_size/2;
        let tmpy = localy + data.pattern.render_size/2;
        CTX.translate(tmpx, tmpy);
        if (line_type==="up" || line_type==="down") {
            CTX.rotate((line_type==="up") ? -Math.PI/2 : +Math.PI/2);
        } else if (line_type==="left") {
            CTX.rotate(Math.PI);
        }
        CTX.translate(-tmpx, -tmpy);
        CTX.drawImage(data.svgs.active_line.ipicture.image, localx, localy, data.pattern.render_size, data.pattern.render_size);
        CTX.restore();

        prevx = ax;
        prevy = ay;
        if (ax>=data.width && ay===data.stop) {
            game_level_complete();
            break;
        } else if (typeof(data.positions[ay])==="undefined" || typeof(data.positions[ay][ax])==="undefined") break;
        let pattern = data.positions[ay][ax].pattern;
        if (pattern==="e" || pattern==="w") break;
        let props = pattern.match(/([^-]+)-([^$]+)$/);
        if (props[2]==="h" && (line_type==="left" || line_type==="right")) {
            ax += (line_type==="left") ? -1 : +1;
        } else if (props[2]==="v" && (line_type==="up" || line_type==="down")) {
            ay += (line_type==="down") ? +1 : -1
        } else if (props[2]==="lu" && (line_type==="down" || line_type==="right")) {
            if (line_type === "down") {
                line_type = "left";
                ax--;
            } else {
                line_type = "up";
                ay--;
            }
        } else if (props[2]==="ur" && (line_type==="down" || line_type==="left")) {
            if (line_type === "down") {
                line_type = "right";
                ax++;
            } else {
                line_type = "up";
                ay--;
            }
        } else if (props[2]==="rd" && (line_type==="up" || line_type==="left")) {
            if (line_type === "up") {
                line_type = "right";
                ax++;
            } else {
                line_type = "down";
                ay++;
            }
        } else if (props[2]==="dl" && (line_type==="up" || line_type==="right")) {
            if (line_type === "up") {
                line_type = "left";
                ax--;
            } else {
                line_type = "down";
                ay++;
            }
        } else break;
    }

    if (!data.level_complete) {
        let localx = data.positions[data.stop][data.width-1].position.x + data.pattern.render_size/2;
        let localy = data.positions[data.stop][data.width-1].position.y;
        CTX.drawImage(data.svgs.active_line.ipicture.image, localx, localy, data.pattern.render_size, data.pattern.render_size);
    }

    requestAnimationFrame(game_render);
}