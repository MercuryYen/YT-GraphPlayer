// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
//                        Blueprint.js                         //
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

var Blueprint = class {
	// constructor
	constructor(name = "") {
		this.name = name;

		// modules
		this.modules = [];
		this.currentModule = null;
		this.currentHoverModules = [];

		// ui
		this.ui = {
			width: window.innerWidth,
			height: window.innerHeight,
		};

		// container
		this.ui.container = document.createElement("div");
		this.ui.container.style =
			`
        position: absolute;
        top: 0px;
        left: 0px;
        width: ` +
			this.ui.width +
			`px;
        height: ` +
			this.ui.height +
			`px;
        background: #666666;
        background-repeat: repeat;
        overflow: hidden;
        z-index: 0;
        `;

		// board
		this.ui.board = document.createElement("div");
		this.ui.board.style = `
        position: absolute;
        top: 0px;
        left: 0px;
        width: 99999px;
        height: 99999px;
        `;
		// Issue: if module exists on the outer-right side of the board, then wrapping will occur on the
		// module UI. Setting the width and height to 99999px is just a quick fix and shouldn't be final.
		this.ui.container.appendChild(this.ui.board);

		// drag methods
		var board = this.ui.board;
		var container = this.ui.container;
		this.ui.container.dragMethod = null;
		this.ui.container.createDragMethod = function (type, pivotX, pivotY) {
			// Warning : 'origin' must be declared outside of the function below, or
			// a recursion may occur and cause modules to move at exponetial speed
			var origin = {
				x: parseFloat(board.style.left.substr(0, board.style.left.length - 2)),
				y: parseFloat(board.style.top.substr(0, board.style.top.length - 2)),
			};
			return function (e) {
				if (type == "mouse") {
					board.style.left = origin.x + e.clientX - pivotX + "px";
					board.style.top = origin.y + e.clientY - pivotY + "px";
				} else if (type == "touch") {
					board.style.left = origin.x + e.touches[0].clientX - pivotX + "px";
					board.style.top = origin.y + e.touches[0].clientY - pivotY + "px";
				}
			};
		};
		this.ui.container.addEventListener(
			"mousedown",
			function (e) {
				if (container.dragMethod == null) {
					container.dragMethod = this.createDragMethod("mouse", window.cursor.x, window.cursor.y);
					window.addEventListener("mousemove", container.dragMethod);
				}
				e.stopPropagation();
			},
			false
		);
		window.addEventListener(
			"mouseup",
			function (e) {
				window.removeEventListener("mousemove", container.dragMethod);
				container.dragMethod = null;
			},
			false
		);
		this.ui.container.addEventListener(
			"touchdown",
			function (e) {
				if (container.dragMethod == null) {
					container.dragMethod = this.createDragMethod("touch", window.cursor.x, window.cursor.y);
					window.addEventListener("touchmove", container.dragMethod);
				}
				e.stopPropagation();
			},
			false
		);
		window.addEventListener(
			"touchup",
			function (e) {
				window.removeEventListener("touchmove", container.dragMethod);
				container.dragMethod = null;
			},
			false
		);

		// wires
		this.ui.wires = document.createElement("canvas");
		this.ui.wires.width = this.ui.width;
		this.ui.wires.height = this.ui.height;
		this.ui.wires.style =
			`
        position: absolute;
        top: 0px;
        left: 0px;
        width: ` +
			this.ui.width +
			`px;
        height: ` +
			this.ui.height +
			`px;
        z-index: 0;
        `;
		this.ui.container.appendChild(this.ui.wires);

		// update loop
		var update_loop = function () {
			this.update_wires();
			requestAnimationFrame(update_loop);
		}.bind(this);
		update_loop();

		// editor
		// this.editor = new Editor(this);
		// this.ui.container.appendChild(this.editor.ui.container);

		// console
		// this.console = this.editor.console;

		// console
		// this.console = new Console(this);
		// this.ui.console = this.console.ui;
		// this.ui.container.appendChild(this.ui.console.container);

		// resizer
		var blueprint = this;
		window.addEventListener("resize", function () {
			// data update
			blueprint.ui.width = window.innerWidth;
			blueprint.ui.height = window.innerHeight;

			// container resize
			blueprint.ui.container.style.width = blueprint.ui.width + "px";
			blueprint.ui.container.style.height = blueprint.ui.height + "px";

			// wire canvas resize
			blueprint.ui.wires.width = blueprint.ui.width;
			blueprint.ui.wires.height = blueprint.ui.height;
			blueprint.ui.wires.style.width = blueprint.ui.width + "px";
			blueprint.ui.wires.style.height = blueprint.ui.height + "px";
		});
	}

	update_wires() {
		var canvas = this.ui.wires;
		var brush = canvas.getContext("2d");

		// clear canvas
		brush.clearRect(0, 0, canvas.width, canvas.height);

		// adjustments
		var origin = canvas.getBoundingClientRect();

		// icon reset
		this.modules.forEach(function (module) {
			// output socket
			if (module.hasOutput) {
				module.ui.output.children[0].style.background = "rgba(0 , 0 , 0 , 0)";
			}
			// input socket
			for (var i = 0; i < module.inputCount; i++) {
				module.ui.inputs[i].children[0].style.background = "rgba(0 , 0 , 0 , 0)";
			}
			// branch in socket
			if (module.hasBranchIn) {
				module.ui.branchIn.children[0].style.background = "rgba(0 , 0 , 0 , 0)";
			}
			// branch out socket
			for (var i = 0; i < module.branchCount; i++) {
				module.ui.branchOuts[i].children[0].style.background = "rgba(0 , 0 , 0 , 0)";
			}
		});

		// wire drawing
		this.modules.forEach(function (module) {
			// i/o wiring
			for (var i = 0; i < module.inputCount; i++) {
				// stop if no module
				if (module.inputs[i].module == null) continue;
				// sockets
				let sourceSocket = module.inputs[i].module.ui.output.children[0];
				let targetSocket = module.ui.inputs[i].children[0];
				// update icon color
				sourceSocket.style.background = sourceSocket.style.color;
				targetSocket.style.background = sourceSocket.style.color;
				// coordinates
				let source = sourceSocket.getBoundingClientRect();
				let start = {
					x: source.x + source.width - origin.x,
					y: source.y + source.height / 2 - origin.y,
				};
				let target = targetSocket.getBoundingClientRect();
				let end = {
					x: target.x - origin.x,
					y: target.y + target.height / 2 - origin.y,
				};
				// curve
				let focus = Math.abs(end.x - start.x) * 0.6;
				brush.beginPath();
				brush.moveTo(start.x, start.y);
				brush.bezierCurveTo(start.x + focus, start.y, end.x - focus, end.y, end.x, end.y);
				// style
				brush.lineWidth = 2;
				brush.strokeStyle = Module.typeToColor(module.inputs[i].module.type);
				brush.stroke();
			}

			// branch wiring
			for (var i = 0; i < module.branchCount; i++) {
				// stop if no module
				if (module.branchOuts[i].module == null) continue;
				// sockets
				let sourceSocket = module.ui.branchOuts[i].children[0];
				let targetSocket = module.branchOuts[i].module.ui.branchIn.children[0];
				// update icon color
				sourceSocket.style.background = sourceSocket.style.color;
				targetSocket.style.background = targetSocket.style.color;
				// coordinates
				let source = sourceSocket.getBoundingClientRect();
				let start = {
					x: source.x + source.width - origin.x,
					y: source.y + source.height / 2 - origin.y,
				};
				let target = targetSocket.getBoundingClientRect();
				let end = {
					x: target.x - origin.x,
					y: target.y + target.height / 2 - origin.y,
				};
				// curve
				let focus = Math.abs(end.x - start.x) * 0.6;
				brush.beginPath();
				brush.moveTo(start.x, start.y);
				brush.bezierCurveTo(start.x + focus, start.y, end.x - focus, end.y, end.x, end.y);
				// style
				brush.lineWidth = 4;
				brush.strokeStyle = Module.typeToColor("branch");
				brush.stroke();
			}
		});

		// dragging wire
		// Todo : add board follow wire method
		if (window.wiringData) {
			let sourceSocket, color, lineWidth;
			if (window.wiringData.type == "io") {
				sourceSocket = window.wiringData.module.ui.output.children[0];
				color = Module.typeToColor(window.wiringData.module.type);
				lineWidth = 2;
			} else if (window.wiringData.type == "branch") {
				sourceSocket = window.wiringData.module.ui.branchOuts[window.wiringData.socket].children[0];
				color = Module.typeToColor("branch");
				lineWidth = 4;
			} else {
				// error
			}
			// update icon color
			sourceSocket.style.background = sourceSocket.style.color;
			// coordinates
			let source = sourceSocket.getBoundingClientRect();
			let start = {
				x: source.x + source.width - origin.x,
				y: source.y + source.height / 2 - origin.y,
			};
			let end = {
				x: window.cursor.x - origin.x,
				y: window.cursor.y - origin.y,
			};
			// curve
			let focus = Math.abs(end.x - start.x) * 0.6;
			brush.beginPath();
			brush.moveTo(start.x, start.y);
			brush.bezierCurveTo(start.x + focus, start.y, end.x - focus, end.y, end.x, end.y);
			// style
			brush.lineWidth = lineWidth;
			brush.strokeStyle = color;
			brush.stroke();
		}
	}

	add_module(name = "Module", ...args) {
		// create module
		var module = new Module[name](...args.concat([this]));
		module.updateUI();

		// add module to blueprint
		this.modules.push(module); // data
		this.ui.board.appendChild(module.ui.container); // ui

		// positioning
		var origin = {
			x: parseFloat(this.ui.board.style.left.substr(0, this.ui.board.style.left.length - 2)),
			y: parseFloat(this.ui.board.style.top.substr(0, this.ui.board.style.top.length - 2)),
		};
		var box = module.ui.container.getBoundingClientRect();
		module.ui.container.style.left = this.ui.width * 0.5 - box.width / 2 - origin.x + "px";
		module.ui.container.style.top = this.ui.height * 0.5 - box.height / 2 - origin.y + "px";

		return module;
	}

	delete_module(module) {
		// unwire
		// this.modules.forEach(function (m) {
		// 	for (let i = 0; i < m.inputs.length; i++) {
		// 		if (m.inputs[i].module == module) m.disconnect("io", i);
		// 	}
		// 	for (let i = 0; i < m.branchOuts.length; i++) {
		// 		if (m.branchOuts[i].module == module) m.disconnect("branch", i);
		// 	}
		// });

		// UI
		module.removeUI();
		this.ui.board.removeChild(module.ui.container);

		// data
		this.modules = this.modules.filter(function (value) {
			return value != module;
		});
	}

	clear() {
		this.modules.forEach(
			function (module) {
				this.delete_module(module);
			}.bind(this)
		);
	}

	validate_structure() {
		var result = {
			ok: true,
			message: "",
		};
		var hasStart = false;
		for (let module of this.modules) {
			// there must be a start module
			if (module instanceof Module["Start"]) {
				// there must only be 1 start module
				if (hasStart == true) {
					result["ok"] = false;
					result["message"] = "Multiple 'Start' modules detected. Program execution cancelled. (There can only be one)";
					return result;
				} else {
					hasStart = true;
				}
			}
			// all input sockets must be connected
			for (let input of module.inputs) {
				if (input.module == null) {
					result["ok"] = false;
					result["message"] = "All input sockets must be connected.";
					return result;
				}
			}
			// all branch out sockets must be connected
			for (let branchOut of module.branchOuts) {
				if (branchOut.module == null) {
					result["ok"] = false;
					result["message"] = "All branch out sockets must be connected.";
					return result;
				}
			}
			// all input sockets must not include self.
			var dependentModules = [];
			var dependentQueue = [
				{
					module: module,
					order: 0,
				},
			];
			while (dependentQueue.length > 0) {
				if (
					dependentModules.find(function (dependentModule) {
						return dependentModule["module"] == dependentQueue[0]["module"] && dependentModule["order"] < dependentQueue[0]["order"];
					}) != undefined
				) {
					result["ok"] = false;
					result["message"] = "All input sockets must not include self.";
					return result;
				}
				dependentModules.push({
					module: dependentQueue[0],
					order: dependentQueue[0]["order"],
				});
				if (dependentQueue[0].inputCount > 0)
					dependentQueue[0].inputs.forEach((input) => {
						dependentQueue.push({
							module: input.module,
							order: dependentQueue[0]["order"] + 1,
						});
					});
				dependentQueue.splice(0, 1);
			}
		}
		if (!hasStart) {
			result["ok"] = false;
			result["message"] = "No 'Start' module detected. Program execution cancelled. (There shall be one)";
			return result;
		}
		return result;
	}
	get_modules(type) {
		return this.modules.filter(function (module) {
			return module instanceof Module[type];
		});
	}

	clear() {
		// modules
		for (let module of this.modules) {
			this.delete_module(module);
		}
	}

	// save(commitStorage = false) {
	// 	// data
	// 	var saveData = {
	// 		modules: [],
	// 	};

	// 	// modules
	// 	for (let module of this.modules) {
	// 		let data = {
	// 			name: module.constructor.name,
	// 			position: {
	// 				top: module.ui.container.style.top,
	// 				left: module.ui.container.style.left,
	// 			},
	// 			args: module.get_args(),
	// 			data: module.get_data(),
	// 		};
	// 		// io wiring
	// 		// for (let input of module.inputs) {
	// 		// 	data.inputs.push(this.modules.indexOf(input.module));
	// 		// }
	// 		// branch wiring
	// 		// for (let branchOut of module.branchOuts) {
	// 		// 	data.branchOuts.push(this.modules.indexOf(branchOut.module));
	// 		// }
	// 		saveData.modules.push(data);
	// 	}

	// 	// store json in local storage
	// 	if (commitStorage) {
	// 		let blueprints = localStorage.getItem("blueprints");
	// 		if (blueprints == null) {
	// 			blueprints = [];
	// 		} else {
	// 			blueprints = JSON.parse(blueprints);
	// 		}
	// 		blueprints.push({
	// 			date: new Date(),
	// 			saveData: saveData,
	// 		});
	// 		localStorage.setItem("blueprints", JSON.stringify(blueprints));
	// 	}

	// 	// return json
	// 	return JSON.stringify(saveData);
	// }

	// load(json) {
	// 	// data
	// 	var saveData = JSON.parse(json);

	// 	// clear all
	// 	this.clear();

	// 	// modules
	// 	var modules = [];
	// 	for (let data of saveData.modules) {
	// 		// create module
	// 		let module = this.add_module(data.name, ...data.args);
	// 		module.set_data(data.data);
	// 		module.updateUI();
	// 		modules.push(module);
	// 		// position module
	// 		module.ui.container.style.top = data.position.top;
	// 		module.ui.container.style.left = data.position.left;
	// 	}

	// 	// wiring
	// 	// for (let i = 0; i < modules.length; i++) {
	// 	// 	// io wiring
	// 	// 	for (let j = 0; j < saveData.modules[i].inputs.length; j++) {
	// 	// 		if (modules[saveData.modules[i].inputs[j]] == undefined) continue;
	// 	// 		modules[saveData.modules[i].inputs[j]].connect("io", modules[i], j);
	// 	// 	}
	// 	// 	// branch wiring
	// 	// 	for (let j = 0; j < saveData.modules[i].branchOuts.length; j++) {
	// 	// 		if (modules[saveData.modules[i].branchOuts[j]] == undefined) continue;
	// 	// 		modules[i].connect("branch", modules[saveData.modules[i].branchOuts[j]], j);
	// 	// 	}
	// 	// }

	// 	// update editor UI
	// 	// this.editor.updateUI();

	// 	return true;
	// }

	list() {
		let blueprint = this;
		let modules = [];
		let types = ["Event", "Flow", "Function", "Operator"];
		Object.keys(Module).forEach(function (key) {
			let success = true;
			try {
				let count = 0;
				let module = new Module[key](blueprint);
				types.forEach(function (type) {
					if (module instanceof Module[type]) count = count + 1;
					if (module.constructor.name == type) success = false;
				});
				if (count != 1) success = false;
			} catch {
				success = false;
			}
			if (success)
				modules.push({
					className: key,
					args: [],
				});
		});
		return modules;
	}
};
