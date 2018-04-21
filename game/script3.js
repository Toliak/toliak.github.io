let $ = (x) => document.querySelector(x);
let $$ = (x) => document.querySelectorAll(x);

let CANVAS, CTX;

const WIDTH = 10, HEIGHT = 10;

const WEIGHT = {
    "icon_carrot": 0.11,
    "icon_grass": 0.05,
    "icon_potato": 0.13,
    "icon_wheat": 0.08,
};

window.onload = function (e, t) {
    t = this || t;
    e = event || e;

    CANVAS = $("#canvas");
    CTX = CANVAS.getContext("2d");

    window.addEventListener("resize", function () {
        CANVAS.width = document.body.offsetWidth;
        CANVAS.height = document.body.offsetHeight;
    });
    CANVAS.width = document.body.offsetWidth;
    CANVAS.height = document.body.offsetHeight;

    game_init();
};

function game_init() {
    CANVAS.game_data = {};
    let data = CANVAS.game_data;        //pointer
    data.svgs = {};
    data.pattern = {"width":100, "height":100};

    ajax_loader([
            ["src3/icon_carrot.svg", "icon_carrot"],
            ["src3/icon_grass.svg", "icon_grass"],
            ["src3/icon_potato.svg", "icon_potato"],
            ["src3/icon_wheat.svg", "icon_wheat"],
            ["src3/active_line.svg", "active_line"],
        ],
        function (file_url, key, response) {
            data.svgs[key] = new SVGPicture(response, data.pattern.width, data.pattern.height);
        },
        function () {
            requestAnimationFrame(game_render);
        }
    );

    data.path = [];
    data.drawing_path = false;
    data.field = generateField(WIDTH, HEIGHT);
    data.points = 0;

    data.events = {};
    data.events.mousemove = function () {
        if (!data.drawing_path) return false;

        let cx = event.offsetX;
        let cy = event.offsetY;
        let x = Math.floor((cx - data.draw_coords.x0) / data.draw_coords.part_size);
        let y = Math.floor((cy - data.draw_coords.y0) / data.draw_coords.part_size);
        if (!(x>=0 && y>=0 && x<=WIDTH && y<=HEIGHT)) return false;

        let last = data.path[data.path.length - 1];
        let already = (function() {
            for (let i = 0; i < data.path.length; i++) {
                if (data.path[i].x === x && data.path[i].y === y) return i;
            }
            return false;
        })();
        if (last && !(Math.abs(last.x - x) <= 1 && Math.abs(last.y - y) <= 1)) return false;
        if (already === data.path.length-2) return data.path.pop();
        if (already !== false) return false;


        if (!(!(last) || data.field[x][y] === data.field[last.x][last.y])) return false;
        data.path.push({"x":x, "y":y});
    };
    data.events.mousedown = function () {
        if (event.which !== 1) return false;

        data.path = [];
        data.drawing_path = true;
    };
    data.events.mouseup = function () {
        if (event.which !== 1) return false;

        if (data.path.length>=3) {
            for (let i=0; i<data.path.length; i++) {
                let c = data.path[i];
                console.log(data.field[c.x][c.y]);
                data.points += WEIGHT[data.field[c.x][c.y]];
            }
            data.field = clearField(data.field, data.path);
        }
        data.path = [];
        data.drawing_path = false;
    };

    CANVAS.addEventListener("mousemove", data.events.mousemove);            //highlight
    CANVAS.addEventListener("mousedown", data.events.mousedown);
    window.addEventListener("mouseup", data.events.mouseup);
}

function generateField(w, h) {
    let t = [];
    for (let x=0; x<w; x++) {
        t[x] = [];
        for (let y=0; y<h; y++) {
            t[x][y] = (["icon_grass", "icon_wheat", "icon_potato", "icon_carrot"])[Math.floor(Math.random()*4)];
        }
    }
    return t;
}

function clearField(field, path) {
    for (let i=0; i<path.length; i++) {
        let c = path[i];
        field[c.x][c.y] = null;
    }
    for (let x=0; x<field.length; x++) {
        for (let y=0; y<field[x].length; y++) {
            if (field[x][y]===null) {
                field[x].splice(y, 1);
                y--;
            }
        }
    }
    for (let x=0; x<field.length; x++) {
        while (field[x].length < HEIGHT) {
            field[x].unshift((["icon_grass", "icon_wheat", "icon_potato", "icon_carrot"])[Math.floor(Math.random()*4)]);
        }
    }
    return field;
}


function game_render() {
    let data = CANVAS.game_data;
    //main check
    for (let i in data.svgs) {
        if (data.svgs.hasOwnProperty(i) && ((typeof (data.svgs[i].ipicture) === "undefined") || (typeof (data.svgs[i].ipicture.image) === "undefined")))
            return requestAnimationFrame(game_render);
    }
    CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);

    let progress_margin = 5;
    let progress_text = 50;
    let progress_height = 10;

    let empty_height = CANVAS.height - progress_height - 2*progress_margin;

    let part_height = empty_height/HEIGHT;
    let part_width = CANVAS.width/WIDTH;
    let part_size = Math.min(part_height, part_width);

    let x0 = (CANVAS.width - part_size*WIDTH)/2;
    let y0 = (CANVAS.height-empty_height);

    let progress_width = part_size*WIDTH-progress_text;
    CTX.font = "bold 24px Arial";
    CTX.fillStyle = "#000000";
    CTX.textAlign = "left";
    CTX.fillText(Math.floor(data.points), x0+progress_text/2, y0);

    let percent = (data.points - Math.floor(data.points));
    CTX.fillStyle = "#f0daff";
    CTX.beginPath();
    CTX.rect(x0+progress_text, y0-2*progress_margin-progress_height, progress_width*percent, progress_height);
    CTX.closePath();
    CTX.fill();

    CTX.beginPath();
    CTX.rect(x0+progress_text, y0-2*progress_margin-progress_height, progress_width, progress_height);
    CTX.closePath();
    CTX.stroke();


    //background
    for (let i=0; i<data.path.length; i++) {
        let c = data.path[i];
        CTX.fillStyle = "#f0daff";
        CTX.beginPath();
        CTX.rect(x0+part_size*c.x, y0+part_size*c.y, part_size, part_size);
        CTX.closePath();
        CTX.fill();
    }

    // Save
    data.draw_coords = {};
    data.draw_coords.x0 = x0;
    data.draw_coords.y0 = y0;
    data.draw_coords.part_size = part_size;

    for (let x=0; x<WIDTH; x++){
        for (let y=0; y<HEIGHT; y++){
            CTX.drawImage(data.svgs[data.field[x][y]].ipicture.image, x0+part_size*x, y0+part_size*y, part_size, part_size);
        }
    }

    let angle = [];
    angle[1] = [];
    angle[0] = [];
    angle[-1] = [];
    angle[0][1] = Math.PI/2;
    angle[0][-1] = -Math.PI/2;
    angle[1][1] = Math.PI/4;
    angle[1][0] = 0;
    angle[1][-1] = -Math.PI/4;
    angle[-1][1] = 3*Math.PI/4;
    angle[-1][0] = Math.PI;
    angle[-1][-1] = -3*Math.PI/4;
    for (let i=1; i<data.path.length; i++) {
        let c = data.path[i];
        let c0 = data.path[i-1];
        let x = x0+part_size*(c0.x + 0.5);
        let y = y0+part_size*(c0.y);
        let tx = x0+part_size*(c0.x + 0.5);
        let ty =y0+part_size*(c0.y + 0.5);

        let a = angle[c.x-c0.x][c.y-c0.y];
        CTX.save();
        CTX.translate(tx, ty);
        CTX.rotate(a);

        let dx=0;
        if (a === Math.PI/4) dx=part_size*(Math.sqrt(2)-1)/2;
        else if (a === -Math.PI/4) dx=part_size*(Math.sqrt(2)-1)/2;
        else if (a === 3*Math.PI/4) dx=part_size*(Math.sqrt(2)-1)/2;
        else if (a === -3*Math.PI/4) dx=part_size*(Math.sqrt(2)-1)/2;

        CTX.translate(-tx+dx, -ty);
        CTX.drawImage(data.svgs["active_line"].ipicture.image, x, y, part_size, part_size);
        CTX.restore();
    }

    requestAnimationFrame(game_render);
}