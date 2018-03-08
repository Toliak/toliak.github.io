class IPicture {
	constructor(url, width, height, onloadHandle) {
		if (!(typeof(url)==="string")) throw "TypeError: Expected String at argument 1, got "+typeof(url);
		if (!(typeof(width)==="number")) throw "TypeError: Expected Number at argument 2, got "+typeof(width);
		if (!(typeof(height)==="number")) throw "TypeError: Expected Number at argument 3, got "+typeof(height);
		if (!(typeof(onloadHandle)==="undefined" || typeof(onloadHandle)==="function")) throw "TypeError: Expected Function at argument 4, got "+typeof(onloadHandle);
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
		c.ct = c.getContext("2d");
		c.width = img.width;
		c.height = img.height;
		this.width = img.width;
		this.height = img.height;
		this.ipicture = img;
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
	rotate(angle, offsetX, offsetY) {				//slow
		if (!(typeof(angle)==="number")) throw "TypeError: Expected Number at argument 1, got "+typeof(angle);
		offsetX = offsetX || this.width/2;
		offsetY = offsetY || this.height/2;

		let c = document.createElement("canvas");
		c.width = this.width;
		c.height = this.height;
		c.ct = c.getContext("2d");
		c.ct.drawImage(this.canvas, 0, 0);

		let ct = this.canvas.ct;
		ct.clearRect(0,0,this.canvas.width, this.canvas.height);
		ct.save();
		ct.translate(offsetX, offsetY);
		ct.rotate(angle);
		ct.translate(-offsetX, -offsetY);
		ct.drawImage(c, 0, 0, this.width, this.height);
		ct.restore();
		
	}
	HELP() {
		let text = "";
		text += "new CPicture(img) : creates CPicture object. img - IPicture object\r\n";
		text += ".multiply(color) : multiply every pixel of current picture on color (color : 0xAARRGGBB)\r\n";
		return text;
	}
}

class SVGPicture {
	constructor(svg, width, height, manualUpdate) {
		if (!((HTMLElement.prototype.isPrototypeOf(svg) && svg.tagName.toUpperCase()==="SVG") || SVGSVGElement.prototype.isPrototypeOf(svg) || typeof(svg)==="string")) throw "TypeError: Expected <svg> or string at argument 1, got "+typeof(svg);
		this.manualUpdate = manualUpdate || false;
		return this.updateSVG(svg, width, height);
	}
	updateSVG(svg, width, height) {
		if (!((HTMLElement.prototype.isPrototypeOf(svg) && svg.tagName.toUpperCase()==="SVG") || SVGSVGElement.prototype.isPrototypeOf(svg) || typeof(svg)==="string")) throw "TypeError: Expected <svg> or string at argument 1, got "+typeof(svg);
		if (typeof(svg)==="string") {
			let div = document.createElement("div");
			div.innerHTML = svg;
			svg = div.querySelector("svg")
		}
		if (!((HTMLElement.prototype.isPrototypeOf(svg) && svg.tagName.toUpperCase()==="SVG") || SVGSVGElement.prototype.isPrototypeOf(svg))) throw "Error: Cannot create <svg> from string";
		
		this.svgElement = svg;
		if (parseInt(width)) svg.setAttribute("width",parseInt(width)+"px");
		if (parseInt(height)) svg.setAttribute("height",parseInt(height)+"px");
		
		this.width = svg.width.baseVal.value;
		this.height = svg.height.baseVal.value;

		if (!this.manualUpdate) this.updateIPicture();
		
		return this;
	}
	updateIPicture() {
		let fOnIPictureLoad = function() {
			this.ipicture.svgpicture.ipicture = this.ipicture;
		};
		let ipicture = new IPicture("data:image/svg+xml;utf8,"+this.svgElement.outerHTML, this.width, this.height, fOnIPictureLoad);
		ipicture.svgpicture = this;
		return true;
	}
	rotate(deg, x=0, y=0) {
		let len = this.svgElement.transform.baseVal.numberOfItems;
		let exists = false;
		for (let i=0; i<len; i++) {
			let t = this.svgElement.transform.baseVal.getItem(i);
			if (t.type === SVGTransform.SVG_TRANSFORM_ROTATE) {
				t.setRotate(deg,x,y);
				exists = true;
				break;
			}
		}
		if (!exists) {
			let t = this.svgElement.createSVGTransform();
			t.setRotate(deg, x, y);
			this.svgElement.transform.baseVal.appendItem(t);
		}

		if (!this.manualUpdate) this.updateIPicture();

		return true;
	}
	HELP() {
		let text = "";
		text += "new SVGPicture(svg, width, height, manualUpdate) : creates SVGPicture object. svg - <svg> element or string; width,height - size; manualUpdate - IPicture (inside SVGPicture) will not update automatic\r\n";
		text += ".updateSVG(svg, width, height) : like constructor (prevent blinking)\r\n";
		text += ".updateIPicture() : update IPicture inside";
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
	toMap() {
		return {"x":this.x, "y":this.y};
	}
	toList() {
		return [this.x, this.y];
	}
	HELP() {
		let text = "";
		text += "new Vector2D(x,y) : creates Vector2D object. x,y - position\r\n";
		text += ".plus(vct) : like self+vct. vct - Vector2D object\r\n";
		text += ".minus(vct) : like self-vct. vct - Vector2D object\r\n";
		text += ".multiply(n) : like self*n. n - number\r\n";
		text += ".divide(n) : like self/n. n - number\r\n";
		text += ".toMap() : returns map from vector\r\n";
		text += ".toList() : returns list from vector\r\n";
		return text;
	}
}