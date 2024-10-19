// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
//                      Module-VideoInfo.js                     //
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

Module["VideoList"] = class VideoList extends Module["Module"] {
	constructor(title = "", blueprint = null) {
		super("VideoList", blueprint);

		this.title = title;
		this.loop = true;
		this.shuffle = true;
		this.modules = [];
		this.indices = [];

		this.ui.container.addEventListener("mousemove", (e) => {
			if (this.blueprint.currentModule && this.blueprint.currentModule !== this) {
				// preview of adding module
			}
		});

		this.ui.container.addEventListener("touchmove", (e) => {
			if (this.blueprint.currentModule && this.blueprint.currentModule !== this) {
				// preview of adding module
			}
		});

		this.ui.container.addEventListener("mouseup", (e) => {
			console.log("mouseup");
			if (this.blueprint.currentModule && this.blueprint.currentModule !== this && !this.modules.includes(this.blueprint.currentModule)) {
				var bestIndex = 0;
				for (let i = 0; i < this.ui.content.children.length; i++) {
					const rect = this.ui.content.children[i].getBoundingClientRect();
					if (e.clientX > rect.left + rect.width / 2) {
						bestIndex = i;
					} else {
						break;
					}
				}

				this.modules.splice(bestIndex, 0, this.blueprint.currentModule);
				this.updateUI();
			}
		});
	}

	createUI() {
		super.createUI();

		this.ui.head.style.textAlign = "left";
		this.ui.head.innerText = "\xa0\xa0" + this.title + "\xa0\xa0";

		this.ui.content.style.height = "120px";
		this.ui.content.style.width = "fit-content";
		this.ui.content.style.display = "flex";
		this.ui.content.style.flexDirection = "row";

		this.ui.content.innerText = "";

		for (let module of this.modules) {
			const summary = module.getSummary();
			if (summary) {
				const target = document.createElement("div");
				target.style = `
                    height: 94px;
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    border-bottom: 1px solid #333;
                    cursor: pointer;
                    border-style: double;
                    border-radius: 8px;
                    border-width: 1px;
                    border-color: #fff;
                `;
				target.innerHTML = summary;
				this.ui.content.appendChild(target);
			}
		}
	}

	getSummary() {
		return this.title;
	}
};
