// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
//                      Module-VideoInfo.js                     //
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

var doneVideoList = [];
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
				if (!this.blueprint.currentHoverModules.includes(this)) {
					this.blueprint.currentHoverModules.push(this);
				}
			}
		});

		this.ui.container.addEventListener("touchmove", (e) => {
			if (this.blueprint.currentModule && this.blueprint.currentModule !== this) {
				if (!this.blueprint.currentHoverModules.includes(this)) {
					this.blueprint.currentHoverModules.push(this);
				}
			}
		});

		this.ui.container.addEventListener("mouseout", (e) => {
			if (this.blueprint.currentHoverModules.includes(this)) {
				this.blueprint.currentHoverModules.splice(this.blueprint.currentHoverModules.indexOf(this), 1);
			}
		});
		this.ui.container.addEventListener("touchend", (e) => {
			if (this.blueprint.currentHoverModules.includes(this)) {
				this.blueprint.currentHoverModules.splice(this.blueprint.currentHoverModules.indexOf(this), 1);
			}
		});

		this.ui.container.addEventListener("mouseup", (e) => {
			if (this.blueprint.currentModule && this.blueprint.currentModule !== this && !this.modules.includes(this.blueprint.currentModule)) {
				var bestIndex = 0;
				for (let i = 0; i < this.ui.content.children.length; i++) {
					const rect = this.ui.content.children[i].getBoundingClientRect();
					if (e.clientX > rect.left + rect.width / 2) {
						bestIndex = i + 1;
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

	getPlaylist() {
		doneVideoList = [];
		return this._getPlaylist();
	}

	_getPlaylist() {
		var playlist = [];

		doneVideoList.push(this);

		for (let module of this.modules) {
			if (module instanceof Module["Video"]) {
				playlist.push(module);
			} else if (module instanceof Module["Author"]) {
				playlist = playlist.concat(module.songModules);
			} else if (module instanceof Module["VideoList"]) {
				if (!doneVideoList.includes(module)) {
					playlist = playlist.concat(module._getPlaylist());
				}
			}
		}
		playlist = [...new Set(playlist)];

		if (this.shuffle) {
			for (let i = playlist.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[playlist[i], playlist[j]] = [playlist[j], playlist[i]];
			}
		}

		return playlist;
	}

	get_args() {
		return [this.title];
	}

	get_data() {
		var data = [];

		for (let module of this.modules) {
			let refData = {
				name: module.name,
			};
			if (module instanceof Module["Video"]) {
				refData.videoId = module.videoId;
			} else if (module instanceof Module["Author"]) {
				refData.author = module.author;
			} else if (module instanceof Module["VideoList"]) {
				refData.modules = module.title;
			}
			data.push(refData);
		}

		return data;
	}

	set_data(data) {
		var videoModules = this.blueprint.get_modules("Video");
		var authorModules = this.blueprint.get_modules("Author");
		var videoListModules = this.blueprint.get_modules("VideoList");

		for (let refData of data) {
			if (refData.videoId) {
				let videoModule = videoModules.find((module) => module.videoId === refData.videoId);
				if (videoModule) {
					this.modules.push(videoModule);
				}
			} else if (refData.author) {
				let authorModule = authorModules.find((module) => module.author === refData.author);
				if (authorModule) {
					this.modules.push(authorModule);
				}
			} else if (refData.modules) {
				let videoListModule = videoListModules.find((module) => module.title === refData.modules);
				if (videoListModule) {
					this.modules.push(videoListModule);
				}
			}
		}
		this.updateUI();
	}

	getSummary() {
		return this.title;
	}
};
