let CANVAS;
const MAXFPS = 60;

class Npc {
	constructor(pos, cpicture, name) {
		this.position = pos;
		this.cpicture = cpicture;
		this.name = name;
		this.velocity = new Vector2D(4,4);
		CANVAS.npcs.push(this);
		return this;
	}
	draw() {

		if (this.position.plus(this.velocity).x<0) {
			this.position.x = 0
			this.velocity = new Vector2D(Math.floor(Math.random()*10), Math.floor(Math.random()*20-10));
		} else if (this.position.plus(this.velocity).y<0) {
			this.position.y = 0
			this.velocity = new Vector2D(Math.floor(Math.random()*20-10), Math.floor(Math.random()*10));
		} else if (this.position.plus(this.velocity).x+this.cpicture.width>CANVAS.width) {
			this.position.x = CANVAS.width-this.cpicture.width
			this.velocity = new Vector2D(Math.floor(Math.random()*10-20), Math.floor(Math.random()*10));
		} else if (this.position.plus(this.velocity).y+this.cpicture.height>CANVAS.height) {
			this.position.y = CANVAS.height-this.cpicture.height
			this.velocity = new Vector2D(Math.floor(Math.random()*10), Math.floor(Math.random()*10-20));
		}
		this.position = this.position.plus(this.velocity);



		CANVAS.ct.drawImage(this.cpicture.canvas, this.position.x, this.position.y, this.cpicture.width, this.cpicture.height);
		//CANVAS.ct.fillRect(this.position.x, this.position.y, this.cpicture.width, this.cpicture.height);
	}
};


function main(e, t) {
	CANVAS = document.getElementById("canvas");
	CANVAS.npcs = [];
	CANVAS.blocks = [];
	CANVAS.ct = CANVAS.getContext("2d");
	CANVAS.prevAnim = Date.now();
	CANVAS.fpsInterval = 1000/MAXFPS;
	

	CANVAS.draw = function() {
		requestAnimationFrame(CANVAS.draw);


		if (Date.now() - CANVAS.prevAnim >= CANVAS.fpsInterval) {
			CANVAS.ct.clearRect(0,0,CANVAS.width,CANVAS.height);
			for (let i in CANVAS.blocks) {
				CANVAS.blocks[i].draw();
			}
			for (let i in CANVAS.npcs) {
				CANVAS.npcs[i].draw();
			}

			CANVAS.prevAnim = Date.now();
		}

		
	};



	test();
	return 0;
}

function test() {
	var c = document.createElement("canvas");
	c.width = 32;
	c.height = 32;
	var ctx = c.getContext("2d");
	ctx.fillStyle = "#000000";
	ctx.fillRect(0,0,32,32);
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(2,2,28,28);

	var cp = new CPicture(c);

	new Npc(new Vector2D(0,0), cp, "a");
	CANVAS.draw();
}