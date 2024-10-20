// Video Manager using adapted Blueprint.js structure

var VideoManager = class {
	constructor() {
		this.container = null;

		// Blueprint initialization
		this.blueprint = new Blueprint("Video Manager");

		this.songList = [];
		this.nowIndex = 0;

		this.playlistContainer = null;
		this.player = null;

		// Video manager specific components
		this.playlist = [];
		this.initUI();
	}

	initUI() {
		this.container = document.getElementById("blueprint-container");
		this.container.style = `
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            overflow: hidden;
        `;

		const playerWidth = 360;
		const playerHeight = (playerWidth / 4) * 3;

		// add blueprint at the top left
		{
			var blueprintContainer = document.createElement("div");
			blueprintContainer.style = `
            position: absolute;
            top: 0;
            left: 0;
            right: ${playerWidth}px;
            bottom: 0;
            overflow: hidden;
        `;
			blueprintContainer.appendChild(this.blueprint.ui.container);
			this.container.appendChild(blueprintContainer);

			// add reset button at the top right
			var resetButton = document.createElement("button");
			resetButton.innerText = "Sort";
			resetButton.style = `
				position: absolute;
				top: 10px;
				right: ${playerWidth + 10}px;
			`;
			resetButton.addEventListener("click", () => {
				this.resetModulePosition();
			});
			document.body.appendChild(resetButton);
		}

		// add playlist at the top right
		{
			this.playlistContainer = document.createElement("div");
			this.playlistContainer.style = `
            position: absolute;
            top: 0;
            right: 0;
            width: ${playerWidth}px;
            bottom: ${playerHeight}px;
            overflow: auto;
            background: #333;
            color: white;
        `;
			this.container.appendChild(this.playlistContainer);
		}

		// add video player at the bottom right
		{
			this.player = new YTPlayer(this.nextSong.bind(this));
			let playerContainer = document.createElement("div");
			playerContainer.id = "player";
			playerContainer.style = `
            position: absolute;
            bottom: 0;
            right: 0;
            width: ${playerWidth}px;
            height: ${playerHeight}px;
        `;
			this.container.appendChild(playerContainer);
		}

		// add Save Load button at the top left
		{
			let saveButton = document.createElement("button");
			saveButton.innerText = "Save";
			saveButton.style = `
			position: absolute;
			top: 10px;
			left: 10px;
		`;
			saveButton.addEventListener("click", () => {
				let saveStr = this.save();
				window
					.showSaveFilePicker({
						types: [
							{
								description: "Text file",
								accept: { "text/plain": [".json"] },
							},
						],
					})
					.then((fileHandle) => {
						return fileHandle.createWritable();
					})
					.then((writable) => {
						return Promise.all([writable.write(saveStr), writable.close()]);
					});
			});
			document.body.appendChild(saveButton);

			let loadButton = document.createElement("button");
			loadButton.innerText = "Load";
			loadButton.style = `
			position: absolute;
			top: 10px;
			left: 60px;
		`;
			loadButton.addEventListener("click", () => {
				window
					.showOpenFilePicker({
						description: "Text file",
						accept: { "text/plain": [".json"] },
					})
					.then(([fileHandle]) => {
						return fileHandle.getFile().then((file) => {
							return file.text().then((text) => {
								this.load(text);
							});
						});
					});
			});
			document.body.appendChild(loadButton);
		}

		// Create a textbox and button for adding YouTube videos
		{
			let urlInputContainer = document.createElement("div");
			urlInputContainer.style = `
            position: absolute;
            top: 40px;
            left: 10px;
            z-index: 10;
            background: #333;
            padding: 10px;
            color: white;
        `;

			let submitFunc = () => {
				let url = input.value;
				let videoIds = this.extractVideoIds(url);
				for (let videoId of videoIds) {
					this.addVideoModule(videoId);
				}
				if (videoIds.length === 0) {
					alert("No video found in the URL");
				}
			};

			let input = document.createElement("input");
			input.type = "text";
			input.placeholder = "Enter YouTube video URL";
			input.style = "width: 300px;";
			input.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					submitFunc();
				}
			});

			let button = document.createElement("button");
			button.innerText = "Add Video";
			button.style = "margin-left: 10px;";
			button.addEventListener("click", submitFunc);

			urlInputContainer.appendChild(input);
			urlInputContainer.appendChild(button);
			document.body.appendChild(urlInputContainer);
		}

		// Create a button for creating a video list with name
		{
			let nameInputContainer = document.createElement("div");
			nameInputContainer.style = `
                position: absolute;
                bottom: 10px;
                left: 10px;
                z-index: 10;
                background: #333;
                padding: 10px;
                color: white;
            `;

			let submitFunc = () => {
				let name = input.value;
				this.createVideoListModule(name);
			};

			let input = document.createElement("input");
			input.type = "text";
			input.placeholder = "Enter video list name";
			input.style = "width: 300px;";
			input.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					submitFunc();
				}
			});

			let button = document.createElement("button");
			button.innerText = "Create Video List";
			button.style = "margin-left: 10px;";
			button.addEventListener("click", submitFunc);

			nameInputContainer.appendChild(input);
			nameInputContainer.appendChild(button);
			document.body.appendChild(nameInputContainer);
		}

		// Create a simple guide with show/hide button
		{
			let guideContainer = document.createElement("div");
			guideContainer.style = `
				position: absolute;
				bottom: 10px;
				right: ${playerWidth + 10}px;
				z-index: 10;
				background: #333;
				padding: 10px;
				color: white;
			`;

			let guideText = document.createElement("div");
			guideText.innerText = `- To add a Youtube playlist, enter the element of the YT playlist page with F12 which contains the video links
- Drag and drop the videos, authors, playlists in playlist to insert them
- Click on the sort button to reset the positions
- Double Click on the video, author, video list to play it`;

			let toggleButton = document.createElement("button");
			toggleButton.innerText = "Hide";
			toggleButton.style = `
				position: absolute;
				bottom: 10px;
				right: ${playerWidth + 10}px;
				z-index: 10;
				margin-top: 10px;
			`;
			toggleButton.addEventListener("click", () => {
				if (guideContainer.style.display === "none") {
					guideContainer.style.display = "block";
					toggleButton.innerText = "Hide";
				} else {
					guideContainer.style.display = "none";
					toggleButton.innerText = "Show";
				}
			});

			guideContainer.appendChild(guideText);
			document.body.appendChild(guideContainer);
			document.body.appendChild(toggleButton);
		}
	}

	extractVideoIds(url) {
		const regex = /[\?&]v=([^&#]*)/;

		var ids = [];
		var match = url.match(regex);
		while (match) {
			ids.push(match[1]);
			url = url.slice(match.index + match[0].length);
			match = url.match(regex);
		}
		return ids;
	}

	addVideoModule(videoId) {
		// Check if the video is already in the pool
		let module = this.blueprint.get_modules("Video").find((module) => module.videoId === videoId);
		if (!module) {
			module = this.blueprint.add_module("Video", videoId);

			module.preparePromise.then(() => {
				if (module.authorModule.songModules.length === 1) {
					module.authorModule.waiting = false;
					module.authorModule.ui.container.addEventListener("mousedown", () => {
						if (module.authorModule.waiting) {
							this.playModule(module.authorModule);
						}

						module.authorModule.waiting = true;
						setTimeout(() => {
							module.authorModule.waiting = false;
						}, 400);
					});
				}

				module.waiting = false;
				module.ui.container.addEventListener("mousedown", () => {
					if (module.waiting) {
						this.playModule(module);
					}

					module.waiting = true;
					setTimeout(() => {
						module.waiting = false;
					}, 400);
				});
			});
		}
		return module;
	}

	createVideoListModule(title) {
		// Check if the video is already in the pool
		let module = this.blueprint.get_modules("VideoList").find((module) => module.title === title);
		if (!module) {
			module = this.blueprint.add_module("VideoList", title);
			module.waiting = false;
			module.ui.container.addEventListener("mousedown", () => {
				if (module.waiting) {
					this.playModule(module);
				}

				module.waiting = true;
				setTimeout(() => {
					module.waiting = false;
				}, 400);
			});
		}
		return module;
	}

	save() {
		// data
		var saveData = {
			videos: [],
			authors: [],
			videoLists: [],
		};

		for (let module of this.blueprint.modules) {
			if (module instanceof Module["Video"]) {
				saveData.videos.push({
					videoId: module.videoId,
					left: module.ui.container.style.left,
					top: module.ui.container.style.top,
				});
			} else if (module instanceof Module["Author"]) {
				saveData.authors.push({
					name: module.author,
					left: module.ui.container.style.left,
					top: module.ui.container.style.top,
				});
			} else if (module instanceof Module["VideoList"]) {
				saveData.videoLists.push({
					title: module.title,
					list: module.get_data(),
					left: module.ui.container.style.left,
					top: module.ui.container.style.top,
				});
			}
		}
		return JSON.stringify(saveData);
	}

	load(json) {
		// data
		var saveData = JSON.parse(json);

		// clear all
		this.blueprint.clear();

		var mostLeft = 1e9;
		var mostTop = 1e9;

		// load authors since videos depend on them
		for (let author of saveData.authors) {
			let authorModule = this.blueprint.add_module("Author", author.name);
			authorModule.ui.container.style.left = author.left;
			authorModule.ui.container.style.top = author.top;

			mostLeft = Math.min(mostLeft, parseInt(author.left, 10));
			mostTop = Math.min(mostTop, parseInt(author.top, 10));
		}

		// load videos
		for (let video of saveData.videos) {
			let videoModule = this.addVideoModule(video.videoId);
			videoModule.ui.container.style.left = video.left;
			videoModule.ui.container.style.top = video.top;

			mostLeft = Math.min(mostLeft, parseInt(video.left, 10));
			mostTop = Math.min(mostTop, parseInt(video.top, 10));
		}

		// load video lists
		for (let videoList of saveData.videoLists) {
			let videoListModule = this.createVideoListModule(videoList.title);
			videoListModule.ui.container.style.left = videoList.left;
			videoListModule.ui.container.style.top = videoList.top;
			videoListModule.set_data(videoList.list);

			mostLeft = Math.min(mostLeft, parseInt(videoList.left, 10));
			mostTop = Math.min(mostTop, parseInt(videoList.top, 10));
		}

		// reset blueprint positions
		this.blueprint.ui.board.style.left = `${-mostLeft + 80}px`;
		this.blueprint.ui.board.style.top = `${-mostTop + 100}px`;

		return true;
	}

	playModule(module, index = 0) {
		console.log("Play module");
		console.log(module);
		this.nowIndex = index;
		if (module instanceof Module["Video"]) {
			this.playlist = [module];
			this.player.load(module.videoId);
		} else if (module instanceof Module["Author"]) {
			this.playlist = module.songModules;
			this.player.load(this.playlist[index].videoId);
		} else if (module instanceof Module["VideoList"]) {
			this.playlist = module.getPlaylist();
			if (this.playlist.length > 0) {
				this.player.load(this.playlist[index].videoId);
			}
		}
		this.refreshPlayList();
	}

	refreshPlayList() {
		while (this.playlistContainer.lastElementChild) {
			this.playlistContainer.removeChild(this.playlistContainer.lastElementChild);
		}

		this.playlist.forEach((songModule, index) => {
			let songDiv = document.createElement("div");
			songDiv.songIndex = index;
			songDiv.style = `
				padding: 10px;
				cursor: pointer;
				border-bottom: 1px solid #666;
			`;
			songDiv.innerText = songModule.title;
			songDiv.addEventListener("click", () => {
				this.nowIndex = songDiv.songIndex;
				this.player.load(songModule.videoId);
			});
			this.playlistContainer.appendChild(songDiv);
		});
	}

	resetModulePosition() {
		this.blueprint.ui.board.style.left = "0px";
		this.blueprint.ui.board.style.top = "0px";

		let finalY = 100;
		this.blueprint.get_modules("Author").forEach((module, index) => {
			module.ui.container.style.left = "80px";
			module.ui.container.style.top = `${finalY}px`;

			let currentRight = 0;
			let mostRight = 0;
			module.songModules.forEach((songModule, index) => {
				if (index % 5 == 0) {
					currentRight = mostRight + 20;
				}

				songModule.ui.container.style.left = `${640 + currentRight}px`;
				songModule.ui.container.style.top = `${finalY + (index % 5) * 180}px`;
				let rect = songModule.ui.container.getBoundingClientRect();
				mostRight = Math.max(mostRight, rect.left + rect.width - 640);
			});
			finalY += 180 * Math.min(module.songModules.length, 5);
		});

		finalY += 200;
		this.blueprint.get_modules("VideoList").forEach((module, index) => {
			module.ui.container.style.left = "80px";
			module.ui.container.style.top = `${finalY + index * 200}px`;
		});
	}

	nextSong() {
		if (this.playlist.length > 0) {
			this.nowIndex = (this.nowIndex + 1) % this.playlist.length;
			this.player.load(this.playlist[this.nowIndex].videoId);
		}
	}
};

var videoManager = null;

window.onload = function () {
	// Initialize the Video Manager when the page loads
	videoManager = new VideoManager();
};
