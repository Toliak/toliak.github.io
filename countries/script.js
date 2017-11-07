document.onload = function() {
	generate()
}

let was = [];

function $(str) {return document.querySelector(str);}
function $$(str) {return document.querySelectorAll(str);}

function miss() {
	let minput = $("#input");
	if (!minput) alert("error 1");
	if (minput.cId) {
		$("#result").innerHTML = C_BASE_ID[minput.cId]+ " - " + C_BASE[C_BASE_ID[minput.cId]];
	}
	return generate();
}

function generate() {
	if ($("#input").cId) was[$("#input").cId]=true;
	let f = function() {
		let id = Math.round(Math.random()*C_BASE_ID.length);
		return (was[id] ? f() : id);
	}
	let id = f();
	$("#input").value = null;
	$("#input").cId = id;
	$("#question").innerHTML = "Столица страны " + C_BASE_ID[id];
	return true;
}

function checkAnswer() {
	if (C_BASE[C_BASE_ID[$("#input").cId]].toLowerCase()==$("#input").value.toLowerCase()) {
		$("#result").innerHTML = "правильно!";
		return generate();
	} else {
		$("#result").innerHTML = "нет!";
	}
}
