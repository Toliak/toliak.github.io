let $ = (x) => document.querySelector(x);
let $$ = (x) => document.querySelectorAll(x);

let CANVAS, CTX;

const WIDTH = 3, HEIGHT = 2;
const DIFFICULTY = 20;

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
		["src2/speck1.svg", "speck1"],
		["src2/speck2.svg", "speck2"],
		["src2/speck3.svg", "speck3"],
		["src2/speck4.svg", "speck4"],
		["src2/speck5.svg", "speck5"],
	],
		function (file_url, key, response) {
			data.svgs[key] = new SVGPicture(response, data.pattern.width, data.pattern.height);
		},
		function () {
			requestAnimationFrame(game_render);
		}
	);

	CANVAS.getNearSpecks = function(p) {
		let h = Math.floor(p / WIDTH);
		let w = p % WIDTH;
		if (h % 2 == 1) w = WIDTH - w - 1;
		let check = [];
		if (h % 2 === 0) {
			if (w === 0) {
				if (h === 0) {
					check.push(1);
					check.push(WIDTH * 2 - 1);
				} else if (h === HEIGHT) {
					check.push(p - 1);
					check.push(p + 1);
				} else {
					check.push(p + 2 * WIDTH - 1);
					check.push(p - 1);
					check.push(p + 1);
				}
			} else if (w === WIDTH - 1) {
				if (h === 0) {
					check.push(p - 1);
					check.push(p + 1);
				} else if (h === HEIGHT - 1) {
					check.push(p - 1);
					check.push(p - 2 * WIDTH + 1);
				} else {
					check.push(p - 1);
					check.push(p + 1);
					check.push(p - 2 * WIDTH + 1);
				}
			} else {
				if (h === 0) {
					check.push(p - 1);
					check.push(p + 1);
					check.push(p + (WIDTH - w) * 2 - 1);
				} else if (h === HEIGHT - 1) {
					check.push(p - 1);
					check.push(p + 1);
					check.push(p + (w) * 2 - 1);
				} else {
					check.push(p - 1);
					check.push(p + 1);
					check.push(p + (WIDTH - w) * 2 - 1);
					check.push(p + (w) * 2 - 1);
				}
			}
		} else {
			if (w === 0) {
				if (h === HEIGHT) {
					check.push(p - 1);
					check.push(p - 2 * WIDTH + 1);
				} else {
					check.push(p - 1);
					check.push(p - 2 * WIDTH + 1);
					check.push(p + 1);
				}
			} else if (w === WIDTH - 1) {
				if (h === HEIGHT - 1) {
					check.push(p - 1);
					check.push(p + 1);
				} else {
					check.push(p - 1);
					check.push(p + 1);
					check.push(p + 2 * WIDTH - 1);
				}
			} else {
				if (h === HEIGHT - 1) {
					check.push(p - 1);
					check.push(p + 1);
					check.push(p - (WIDTH - w) * 2 + 1);
				} else {
					check.push(p - 1);
					check.push(p + 1);
					check.push(p - (WIDTH - w) * 2 + 1);
					check.push(p + (w) * 2 + 1);
				}
			}
		}
		return check;
	};
	CANVAS.moveSpeck = function(p) {
		let check = CANVAS.getNearSpecks(p);
		for (let i = 0; i < check.length; i++) {
			let c = check[i];
			if (data.specks[c] === 0) {
				let current_speck = data.specks[p];
				data.specks[p] = 0;
				data.specks[c] = current_speck;
				return true;
			}
		}
		return false;
	};
	CANVAS.generateLevel = function(dif=DIFFICULTY) {
		while (dif >= 0 || JSON.stringify(data.specks) == JSON.stringify(data.specks_default)) {
			if ( CANVAS.moveSpeck(Math.floor(Math.random() * data.specks.length)) ) {
				dif--;
			}
		}
	};

	data.specks = [1,2,3,4,5,0];
	data.specks_default = [1,2,3,4,5,0];
	data.mouse_position = { "x": -1, "y": -1 };
	data.mouse_pattern = 0;

	data.events = {};
	data.events.mousemove = function () {
		let cx = event.offsetX;
		let cy = event.offsetY;
		data.mouse_position = {"x":cx, "y":cy};
	};
	data.events.click = function () {
		let p = data.mouse_pattern;
		if (typeof(p)==="undefined" || p===-1) return false;
		if ( CANVAS.moveSpeck(p) ) {
			if (JSON.stringify(data.specks) == JSON.stringify(data.specks_default)) {
				alert("Level complete");
				CANVAS.generateLevel();
			}
		}
	};

	CANVAS.addEventListener("mousemove", data.events.mousemove);            //highlight
	CANVAS.addEventListener("click", data.events.click);

	CANVAS.generateLevel();
}

function game_render() {
	let data = CANVAS.game_data;
	//main check
	for (let i in data.svgs) {
		if (data.svgs.hasOwnProperty(i) && ((typeof (data.svgs[i].ipicture) === "undefined") || (typeof (data.svgs[i].ipicture.image) === "undefined")))
			return requestAnimationFrame(game_render);
	}
	CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);

	let part_height = CANVAS.height/HEIGHT;
	let part_width = CANVAS.width/WIDTH;
	let part_size = Math.min(part_height, part_width);

	let x0 = (CANVAS.width - part_size*WIDTH)/2;
	let y0 = (CANVAS.height - part_size * HEIGHT)/2;
	let current_pattern = -1
	for (let i = 0; i < data.specks.length; i++) {
		let s = data.specks[i];
		if (s==0) continue;
		let h = Math.floor(i/WIDTH);
		let w = i%WIDTH;
		if (h%2 == 1) w = WIDTH - w - 1;
		let x = x0 + w * part_size;
		let y = y0 + h * part_size;
		if (data.mouse_position.x >= x && data.mouse_position.x < x+part_size &&
		data.mouse_position.y >= y && data.mouse_position.y < y + part_size) {	//mouse over
			CTX.fillStyle = "#f0daff";
			CTX.beginPath();
			CTX.rect(x, y, part_size, part_size);
			CTX.closePath();
			CTX.fill();
			current_pattern = i;
		}
		CTX.drawImage(data.svgs[`speck${s}`].ipicture.image, x, y, part_size, part_size);
	}
	data.mouse_pattern = current_pattern
	requestAnimationFrame(game_render);
}