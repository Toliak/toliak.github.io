class IPicture {
	constructor(url, width, height, onloadHandle) {
		if (!(typeof(url)==="string")) throw "TypeError: Expected String at argument 1, got "+typeof(url);
		if (!(typeof(width)==="number")) throw "TypeError: Expected Number at argument 2, got "+typeof(width);
		if (!(typeof(height)==="number")) throw "TypeError: Expected Number at argument 3, got "+typeof(height);
		if (typeof(onloadHandle)!=="undefined" && typeof(onloadHandle)==="function") throw "TypeError: Expected Function at argument 4, got "+typeof(pos);
		this.loaded = false;
		let p = new Image();
		p.ipicture = this;
		p.src = url;
		p.onload = onloadHandle;
		if (typeof(onloadHandle)!=="undefined") p.addEventListener("load", onloadHandle);
		p.addEventListener("load", function() {
			p.ipicture.loaded = true;
		});
		p.width = width;
		p.height = height;
		this.image = p;
		this.width = width;
		this.height = height;
		return this;
	}
	HELP() {
		let text = "";
		text += "new IPicture(url, width, height, [onloadHandle]) : creates IPicture object. url - url to picture (it's better to use base64 data); width, height - image size; onloadHandle - function that executes on image load\r\n"
		return text;
	}
}

class CPicture {
	constructor(img) {
		if (!(IPicture.prototype.isPrototypeOf(img) || HTMLCanvasElement.prototype.isPrototypeOf(img))) throw "TypeError: Expected IPicture at argument 1, got "+typeof(img);
		let isCanvas = HTMLCanvasElement.prototype.isPrototypeOf(img);
		let c = document.createElement("canvas");
		c.cpicture = this;
		c.ct = c.getContext("2d")
		c.width = img.width;
		c.height = img.height;
		this.width = img.width;
		this.height = img.height;
		this.canvas = c;
		this.loaded = false;
		if (!isCanvas && img.loaded!==true) {
			img.image.addEventListener("load", function() {
				c.ct.drawImage(img.image, 0, 0, img.width, img.width);
				c.cpicture.loaded = true;
			});
		} else {
			c.ct.drawImage(((isCanvas) ? img : img.image), 0, 0, img.width, img.width);
			this.loaded = true;
		}
		return this;
	}
	multiply(color) {
		if (!(typeof(color)==="number")) throw "TypeError: Expected Number at argument 1, got "+typeof(color);
		if (!(color>=0 && color<=0xffffffff)) throw "TypeError: Expected Number from 0x0 to 0xFFFFFFFF at argument 1";

		let a=color>>24, r=color<<8>>24, g = color<<16>>24, b=color<<24>>24;
		a = a & 0xFF; r = r & 0xFF; g = g & 0xFF; b = b & 0xFF;			//make it unsigned
		console.log(a,r,g,b);
		let ct = this.canvas.ct;
		let data = ct.getImageData(0,0,this.width, this.height);
		for (let i=0; i<data.data.length; i+=4) {
			data.data[i] = data.data[i]*r/255;
			data.data[i+1] = data.data[i+1]*g/255;
			data.data[i+2] = data.data[i+2]*b/255;
			data.data[i+3] = data.data[i+3]*a/255;					//зули палишь в исходник а? а? а? а?
		}
		ct.putImageData(data, 0, 0);
	}
	HELP() {
		let text = "";
		text += "new CPicture(img) : creates CPicture object. img - IPicture object\r\n"
		text += ".multiply(color) : multiply every pixel of current picture on color (color : 0xAARRGGBB)\r\n"
		return text;
	}
}

class Vector2D {
	constructor(x,y) {
		if (!(typeof(x)==="number")) throw "TypeError: Expected number at argument 1, got "+typeof(x);
		if (!(typeof(y)==="number")) throw "TypeError: Expected number at argument 2, got "+typeof(y);
		this.x = x;
		this.y = y;
		return this;
	}
	plus(pos) {
		if (!Vector2D.prototype.isPrototypeOf(pos)) throw "TypeError: Expected Vector2D at argument 1, got "+typeof(pos);
		return new Vector2D(this.x+pos.x, this.y+pos.y);
	}
	minus(pos) {
		if (!Vector2D.prototype.isPrototypeOf(pos)) throw "TypeError: Expected Vector2D at argument 1, got "+typeof(pos);
		return new Vector2D(this.x-pos.x, this.y-pos.y);
	}
	multiply(number) {
		if (!(typeof(number)==="number")) throw "TypeError: Expected Number at argument 1, got "+typeof(number);
		return new Vector2D(this.x*number, this.y*number);
	}
	divide(number) {
		if (!(typeof(number)==="number")) throw "TypeError: Expected Number at argument 1, got "+typeof(number);
		return new Vector2D(this.x/number, this.y/number);
	}
	length() {
		return Math.sqrt(this.x*this.x+this.y*this.y);
	}
	HELP() {
		let text = "";
		text += "new Vector2D(x,y) : creates Vector2D object. x,y - position\r\n"
		text += ".plus(vct) : like self+vct. vct - Vector2D object\r\n"
		text += ".minus(vct) : like self-vct. vct - Vector2D object\r\n"
		text += ".multiply(n) : like self*n. n - number\r\n"
		text += ".divide(n) : like self/n. n - number"
		return text;
	}
}