let $ = (x) => document.querySelector(x);
let $$ = (x) => document.querySelectorAll(x);

let SVG = [];

function onLoad() {
	let id = 0;
	let xhr = new XMLHttpRequest();
	xhr.open("GET","graph_1.svg");
	xhr.onreadystatechange = function() {
		if (this.readyState !== 4) return false;
		let outer = this.responseText;
		SVG[id] = outer;
		id++;
		if (id===2) return true;
		xhr.open("GET", "graph_2.svg");
		xhr.send();
	}
	xhr.send();

	window.getEmptySize = function(exeptElement) {
		let empty = {"x": window.innerWidth, "y": window.innerHeight};
		let children = document.body.children;
		for (let i=0; i<children.length; i++) {
			let child = children[i];
			if (child===exeptElement) continue;
			empty.x -= child.offsetWidth;
			empty.y -= child.offsetHeight;
		}
		return empty;
	};
	$("#links>select").addEventListener("change", function() {
		if ($("#graph-div").firstElementChild) $("#graph-div").removeChild($("#graph-div").firstElementChild);
		let option = this.options[this.selectedIndex];
		$("#graph-div").innerHTML = SVG[option.attributes["svg-id"].value];
		let svg = $("#graph-div>svg");
		svg.width.baseVal.valueAsString = window.innerWidth+"px";
		svg.height.baseVal.valueAsString = window.getEmptySize(svg.parentElement).y+"px";
		$("#graph-div>svg>#"+option.attributes["open-id"].value).style.display = "inline";

		//console.log(this.options[this.selectedIndex].attributes["svg-id"].value);
	});
	window.addEventListener("resize", function() {
		let svg = $("#graph-div>svg");
		svg.width.baseVal.valueAsString = window.innerWidth+"px";
		svg.height.baseVal.valueAsString = window.getEmptySize(svg.parentElement).y+"px";
	});
	/*let links = $("#links").children;
	for (let i=0; i<links.length; i++) {
		let link = links[i];
		link.addEventListener("click", function() {
			if ($("#graph-div").firstElementChild) $("#graph-div").removeChild($("#graph-div").firstElementChild);
			$("#graph-div").innerHTML = SVG[this.attributes["svg-id"].value];
			let svg = $("#graph-div>svg");
			svg.width.baseVal.valueAsString = window.innerWidth+"px";
			svg.height.baseVal.valueAsString = window.innerHeight+"px";
			$("#graph-div>svg>#"+this.attributes["open-id"].value).style.display = "inline";
		});
	}*/

	
}