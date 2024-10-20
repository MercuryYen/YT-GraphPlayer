// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
//                          Module.js                          //
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

var Module = {};

Module.MODULE_EXECUTE_FLAG = false;
Module.MODULE_EXECUTE_HOLD_FLAG = false;
Module.MODULE_LOOP_STACK = [];
Module.MODULE_EXECUTE_QUEUE = [];

Module.typeToColor = function (type) {
	if (type == "number") {
		return "#0055ff";
	} else if (type == "string") {
		return "#ee0033";
	} else if (type == "boolean") {
		return "#44dd00";
	} else if (type == "any") {
		return "#808080";
	} else {
		return "#000000";
	}
};

Module.createSocket = function (type = "input", data = "any", name = "", hasInputField = false) {
	// float direction
	var float, radius;
	switch (type) {
		case "input":
			float = "left";
			radius = "50%";
			break;
		case "output":
			float = "right";
			radius = "50%";
			break;
		default:
			console.error("invalid module socket type");
			return socket;
	}

	// container
	var socket = document.createElement("div");
	socket.style = `
    width: 100%;
    height: 100%;
    `;

	// icon
	let icon = document.createElement("div");
	icon.style =
		`
    float: ` +
		float +
		`;
    width: 8px;
    height: 8px;
    border: 4px solid;
    border-radius: ` +
		radius +
		`;
    margin: 4px;
    color: ` +
		Module.typeToColor(data) +
		`;
    `;
	socket.appendChild(icon);

	if (hasInputField) {
		// input
		let input = document.createElement("input");
		input.style =
			`
        float: ` +
			float +
			`;
        height: 24px;
        width: 72px;
        font-size: 16px;
        line-height: 24px;
        text-align: center;
        margin-left: 8px;
        margin-right: 8px;
        border: 0px;
        padding: 0px;
        background: #505050;
        `;
		socket.appendChild(input);
	} else {
		// text
		let text = document.createElement("div");
		text.style =
			`
        float: ` +
			float +
			`;
        height: 24px;
        font-size: 16px;
        line-height: 24px;
        text-align: center;
        margin-left: 8px;
        margin-right: 8px;
        `;
		text.innerText = name;
		socket.appendChild(text);
	}

	// return socket
	return socket;
};

Module["Module"] = class {
	// constructor
	constructor(name = "", blueprint = null) {
		this.name = name;
		this.blueprint = blueprint;

		// i/o
		this.inputCount = 0;
		this.hasOutput = false;
		this.hasStaticOutput = false;
		this.type = "number";
		this.inputs = [];

		// ui
		this.ui = {
			container: document.createElement("div"),
			head: {},
			body: {
				left: {},
				right: {},
			},
			content: {},
			inputs: [],
			output: {},
			outputText: {},
		};

		// initialize container
		this.ui.container.style = `
        position: absolute;
        border-radius: 14px 14px 14px 14px;
        background: #222222;
        cursor: pointer;
        z-index: 2;
        user-select: none;
        `;

		// delete method
		// let deleteMethod = function (e) {
		// 	window.clearTimeout(window.timer);
		// 	window.timer = setTimeout(
		// 		function () {
		// 			if (this.hasOutput) this.ui.outputText.parentElement.removeChild(this.ui.outputText);
		// 			/*if (confirm("Delete this module?"))*/ this.blueprint.delete_module(this);
		// 		}.bind(this),
		// 		400
		// 	);
		// }.bind(this);
		// this.ui.container.addEventListener("mousedown", deleteMethod, false);
		// this.ui.container.addEventListener("touchstart", deleteMethod, false);

		// let cancelMethod = function (e) {
		// 	window.clearTimeout(window.timer);
		// }.bind(this);
		// this.ui.container.addEventListener("mouseup", cancelMethod, false);
		// this.ui.container.addEventListener("mousemove", cancelMethod, false);
		// this.ui.container.addEventListener("touchup", cancelMethod, false);
		// this.ui.container.addEventListener("touchmove", cancelMethod, false);

		// drag method
		var container = this.ui.container;
		this.ui.container.dragMethod = null;
		this.ui.container.createDragMethod = function (type, pivotX, pivotY) {
			// 'origin' must be declared outside of the function below, or a
			// recursion may occur and cause modules to move at exponetial speed
			var origin = {
				x: parseFloat(container.style.left.substr(0, container.style.left.length - 2)),
				y: parseFloat(container.style.top.substr(0, container.style.top.length - 2)),
			};
			return function (e) {
				if (!e) {
					// reset position
					container.style.left = origin.x + "px";
					container.style.top = origin.y + "px";
				} else {
					if (type == "mouse") {
						container.style.left = origin.x + e.clientX - pivotX + "px";
						container.style.top = origin.y + e.clientY - pivotY + "px";
					} else if (type == "touch") {
						container.style.left = origin.x + e.touches[0].clientX - pivotX + "px";
						container.style.top = origin.y + e.touches[0].clientY - pivotY + "px";
					}
				}
			};
		};

		const thisModule = this;
		this.ui.container.addEventListener(
			"mousedown",
			function (e) {
				// stack the module on the top
				// container.parentElement.insertBefore(container, null);
				container.parentNode.appendChild(container);
				container.style.pointerEvents = "none";
				// drag method
				if (container.dragMethod == null) {
					container.dragMethod = this.createDragMethod("mouse", window.cursor.x, window.cursor.y);
					window.addEventListener("mousemove", container.dragMethod);
					blueprint.currentModule = thisModule;
				}
				e.stopPropagation();
			},
			false
		);
		window.addEventListener(
			"mouseup",
			function (e) {
				container.style.pointerEvents = "auto";
				if (container.dragMethod && blueprint.currentHoverModules.length > 0) {
					container.dragMethod(null);
				}
				window.removeEventListener("mousemove", container.dragMethod);
				container.dragMethod = null;
				if (blueprint.currentModule == thisModule) {
					blueprint.currentModule = null;
				}
			},
			false
		);
		this.ui.container.addEventListener(
			"touchdown",
			function (e) {
				// stack the module on the top
				container.parentNode.appendChild(container);
				container.style.pointerEvents = "none";
				// drag method
				if (container.dragMethod == null) {
					container.dragMethod = this.createDragMethod("touch", window.cursor.x, window.cursor.y);
					window.addEventListener("touchmove", container.dragMethod);
					blueprint.currentModule = thisModule;
				}
				e.stopPropagation();
			},
			false
		);
		window.addEventListener(
			"touchup",
			function (e) {
				container.style.pointerEvents = "auto";
				if (container.dragMethod && blueprint.currentHoverModules.length > 0) {
					container.dragMethod(null);
				}
				window.removeEventListener("touchmove", container.dragMethod);
				container.dragMethod = null;
				if (blueprint.currentModule == thisModule) {
					blueprint.currentModule = null;
				}
			},
			false
		);
	}

	// i/o
	set inputCount(number) {
		this.inputs = [];
		for (let i = 0; i < number; i++) {
			this.inputs.push({
				module: null,
				name: "",
				type: "number",
			});
		}
	}

	get inputCount() {
		return this.inputs.length;
	}

	setInputType(...types) {
		for (let i = 0; i < this.inputs.length; i++) {
			// "number" is assigned if types[i] is undefined
			this.inputs[i].type = types[i] || "number";
		}
	}

	setInputName(...names) {
		for (let i = 0; i < this.inputs.length; i++) {
			// "" is assigned if names[i] is undefined
			this.inputs[i].name = names[i] || "";
		}
	}

	input(index) {
		return this.inputs[index].module.output();
	}

	output() {
		return null;
	}

	execute() {
		return null;
	}

	// wiring
	connect(type, module, socket) {
		if (type == "io") {
			if (module == this) {
				// error
				return false;
			} else if (module.inputs[socket].type == "any") {
				module.inputs[socket].module = this;
			} else if (module.inputs[socket].type == this.type) {
				module.inputs[socket].module = this;
			} else {
				// error
				return false;
			}
		} else {
			// error
			return false;
		}
	}

	disconnect(type, socket) {
		if (type == "io") {
			this.inputs[socket].module = null;
		} else {
			// error
			return false;
		}
	}

	// get module key name
	getKeyName() {
		return "Module_" + this.blueprint.modules.indexOf(this);
	}

	// get module output expression
	getExpression() {
		return null;
	}

	// get latex expression
	toLatex() {
		return {
			latex: this.getExpression(),
			EOP: false,
		};
	}

	// get args
	get_args() {
		return [];
	}

	// get data
	get_data() {
		return [];
	}

	// set data
	set_data(data) {
		return;
	}

	// ui
	updateUI() {
		this.removeUI();
		this.createUI();
	}

	removeUI() {
		// clear elements
		while (this.ui.container.lastElementChild) {
			this.ui.container.removeChild(this.ui.container.lastElementChild);
		}
	}

	createUI() {
		// reference to self
		var module = this;

		// head
		this.ui.head = document.createElement("div");
		this.ui.head.style = `
        color: gray;
        text-align: center;
        height: 28px;
        font-size: 16px;
        line-height: 28px;
        background: #3a3a3a;
        border-radius: 14px 14px 0px 0px;
        `;
		this.ui.head.innerText = "\xa0\xa0" + this.name + "\xa0\xa0";
		this.ui.container.appendChild(this.ui.head);

		// left
		this.ui.left = document.createElement("div");
		this.ui.left.style = `
        display: flex;
        flex-direction: column;
        float: left;
        padding: 6px;
        `;
		this.ui.container.appendChild(this.ui.left);

		// right
		this.ui.right = document.createElement("div");
		this.ui.right.style = `
        display: flex;
        flex-direction: column;
        float: right;
        padding: 6px;
        `;
		this.ui.container.appendChild(this.ui.right);

		// content
		this.ui.content = document.createElement("div");
		this.ui.content.style = `
        color: white;
        float: center;
        height: fit-content;
        font-size: 20px;
        line-height: 24px;
        text-align: center;
        margin-left: 8px;
        margin-right: 8px;
        margin-top: 8px;
        margin-bottom: 8px;
        white-space: nowrap;
        border-radius:0px 0px 14px 14px;
        `;
		this.ui.content.innerText = "Thumbnail";
		this.ui.container.appendChild(this.ui.content);

		// inputs
		this.ui.inputs = [];
		for (let i = 0; i < this.inputCount; i++) {
			let socket = Module.createSocket("input", this.inputs[i].type, this.inputs[i].name);

			// input
			this.ui.inputs[i] = socket;
			this.ui.left.appendChild(this.ui.inputs[i]);

			// wiring
			let startMethod = function (e) {
				if (module.inputs[i].module) {
					window.wiringData = {
						type: "io",
						socket: i,
						module: module.inputs[i].module,
					};
					module.disconnect("io", i);
				}
				e.stopPropagation();
			};
			let endMethod = function (e) {
				if (window.wiringData) {
					if (window.wiringData.type == "io") {
						window.wiringData.module.connect("io", module, i);
					}
				}
				window.wiringData = null;
			};
			socket.children[0].addEventListener("mousedown", startMethod, false);
			socket.children[0].addEventListener("touchdown", startMethod, false);
			socket.children[0].addEventListener("mouseup", endMethod, false);
			socket.children[0].addEventListener("touchup", endMethod, false);
		}

		// output
		if (this.hasOutput) {
			let socket = Module.createSocket("output", this.type, "", this.hasStaticOutput);

			this.ui.outputText = document.createElement("div");
			this.ui.outputText.style = `
            background: rgba(255, 255, 255, 0.3);
            position: absolute;
            left: 67px;
            text-align: left;
            top: -5px;
            `;
			this.blueprint.ui.board.append(this.ui.outputText);

			// output
			this.ui.output = socket;
			this.ui.right.appendChild(this.ui.output);

			if (this.hasStaticOutput) {
				// initialize input value
				socket.children[1].value = this.value;

				// input method
				let InputMethod = function (e) {
					let value = socket.children[1].value;
					// value parse/check
					switch (module.type) {
						case "number":
							isNaN(Number(value)) ? (module.value = 0) : (module.value = Number(value));
							break;
						case "string":
							module.value = socket.children[1].value;
							break;
					}
					socket.children[1].value = module.value;
					e.stopPropagation();
				};
				socket.children[1].addEventListener("change", InputMethod, false);
			}

			// wiring
			let startMethod = function (e) {
				window.wiringData = {
					type: "io",
					socket: 0,
					module: module,
				};

				window.addEventListener(
					"mouseup",
					function (e) {
						window.wiringData = null;
					},
					false
				);
				window.addEventListener(
					"touchup",
					function (e) {
						window.wiringData = null;
					},
					false
				);

				e.stopPropagation();
			};
			let endMethod = function (e) {
				window.wiringData = null;
			};
			socket.children[0].addEventListener("mousedown", startMethod, false);
			socket.children[0].addEventListener("touchdown", startMethod, false);
			socket.children[0].addEventListener("mouseup", endMethod, false);
			socket.children[0].addEventListener("touchup", endMethod, false);
		}
	}

	getSummary() {
		return "";
	}

	showOutput(text) {
		if (this.hasOutput) {
			this.ui.outputText.style.left = parseInt(this.ui.container.style.left) + this.ui.container.offsetWidth + 10 + "px";
			this.ui.outputText.style.top = parseInt(this.ui.container.style.top) + this.ui.output.offsetTop + "px";
			this.ui.outputText.innerText = text;
		}
	}

	hideOutput() {
		if (this.hasOutput) {
			this.ui.outputText.innerText = "";
		}
	}

	setActive(active) {
		this.ui.head.style.background = active ? "rgb(200, 200, 200)" : "rgb(58, 58, 58)";
	}
};
