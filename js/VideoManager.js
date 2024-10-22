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

		this.playerWidth = 360;
		this.playerHeight = (this.playerWidth / 4) * 3;
		this.initUI();

		// check if the URL contains information
		if (window.location.search) {
			this.loadURL(window.location.search);
		}
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

		// split to left and right
		{
			var leftContainer = document.createElement("div");
			this.leftContainer = leftContainer;
			leftContainer.style = `
            position: absolute;
            top: 0;
            left: 0;
            right: ${this.playerWidth}px;
            bottom: 0;
            overflow: hidden;
        `;
			this.container.appendChild(leftContainer);

			var rightContainer = document.createElement("div");
			this.rightContainer = rightContainer;
			rightContainer.style = `
			position: absolute;
			top: 0;
			right: 0;
			width: ${this.playerWidth}px;
			bottom: 0;
			overflow: hidden;
		`;
			this.container.appendChild(rightContainer);

			// thin line between left and right to make it draggable
			var line = document.createElement("div");
			line.style = `
			position: absolute;
			top: 0;
			right: ${this.playerWidth}px;
			width: 5px;
			height: 100%;
			background: #000;
			cursor: col-resize;
		`;
			this.container.appendChild(line);

			// make the line draggable
			var isResizing = false;
			line.addEventListener("mousedown", (e) => {
				isResizing = true;
			});
			document.addEventListener("mousemove", (e) => {
				if (isResizing) {
					line.style.right = `${window.innerWidth - e.clientX - 2}px`;
					this.updatePlayerWidth(window.innerWidth - e.clientX);
				}
			});
			document.addEventListener("mouseup", (e) => {
				isResizing = false;
			});
		}

		// add blueprint at the top left
		{
			leftContainer.appendChild(this.blueprint.ui.container);

			// add reset button at the top right
			var resetButton = document.createElement("button");
			resetButton.innerText = "Sort";
			resetButton.style = `
				position: absolute;
				top: 10px;
				right: 10px;
			`;
			resetButton.addEventListener("click", () => {
				this.resetModulePosition();
			});
			leftContainer.appendChild(resetButton);
		}

		// add playlist at the top right
		{
			this.playlistContainer = document.createElement("div");
			this.playlistContainer.style = `
            position: absolute;
            top: 0;
            width: 100%;
            bottom: ${this.playerHeight}px;
            overflow: auto;
            background: #333;
            color: white;
        `;
			this.rightContainer.appendChild(this.playlistContainer);
		}

		// add video player at the bottom right
		{
			this.player = new YTPlayer(this.nextSong.bind(this));
			let playerContainer = document.createElement("div");
			playerContainer.id = "player";
			playerContainer.style = `
            position: absolute;
            bottom: 0;
            width: 100%;
            height: ${this.playerHeight}px;
        `;
			this.rightContainer.appendChild(playerContainer);
		}

		// add Save, Copy as URL, Load button at the top left
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
				var element = document.createElement("a");
				element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(saveStr));
				element.setAttribute("download", "PlayGraph.json");

				element.style.display = "none";
				document.body.appendChild(element);

				element.click();

				document.body.removeChild(element);
			});
			document.body.appendChild(saveButton);

			let copyButton = document.createElement("button");
			copyButton.innerText = "Copy as URL";
			copyButton.style = `
			position: absolute;
			top: 10px;
			left: 60px;
		`;
			copyButton.addEventListener("click", () => {
				let url = window.location.origin + window.location.pathname + "?" + this.encode2URL();
				if (url.length > 2000) {
					alert("URL is too long to copy");
				} else {
					navigator.clipboard.writeText(url);

					alert("URL copied to clipboard");
				}
			});
			document.body.appendChild(copyButton);

			let loadButton = document.createElement("form");
			this.loadButton = loadButton;
			loadButton.action = "/action_page.php";
			loadButton.style = `
				position: absolute;
				top: 10px;
				left: 160px;
			`;

			let fileInput = document.createElement("input");
			fileInput.type = "file";
			fileInput.id = "myFile";
			fileInput.name = "filename";
			fileInput.addEventListener("change", (e) => {
				var file = fileInput.files[0];
				var reader = new FileReader();
				reader.onload = function (e) {
					videoManager.load(e.target.result);
				};
				reader.readAsText(file);
			});
			loadButton.appendChild(fileInput);
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
				right: 10px;
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
			this.toggleButton = toggleButton;
			toggleButton.innerText = "Hide";
			toggleButton.style = `
				position: absolute;
				bottom: 10px;
				right: 10px;
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
			this.leftContainer.appendChild(guideContainer);
			this.leftContainer.appendChild(toggleButton);
		}
	}

	updatePlayerWidth(width) {
		this.playerWidth = width;
		this.playerHeight = (this.playerWidth / 4) * 3;

		this.leftContainer.style.right = `${this.playerWidth}px`;
		this.rightContainer.style.width = `${this.playerWidth}px`;

		this.playlistContainer.style.width = `${this.playerWidth}px`;
		this.playlistContainer.style.bottom = `${this.playerHeight}px`;

		document.getElementById("player").style.width = `${this.playerWidth}px`;
		document.getElementById("player").style.height = `${this.playerHeight}px`;
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
						}, 600);
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
					}, 600);
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
				}, 600);
			});
		}
		return module;
	}

	encode2URL() {
		// reserve v: video, a: author, l: video list
		const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZbcdefghijkmnopqrstuwxyz";
		const base = chars.length;
		const num2str = (num) => {
			var result = "";
			while (num > 0) {
				result = chars[num % base] + result;
				num = Math.floor(num / base);
			}
			return result.length === 0 ? "0" : result;
		};

		var result = "";

		var videos = {};
		var authors = {};
		var videoLists = {};
		this.blueprint.get_modules("Video").forEach((module, index) => {
			result += `v${module.videoId}`;
			videos[module.videoId] = index;

			if (!(module.author in authors)) {
				authors[module.author] = Object.keys(authors).length;
			}
		});

		this.blueprint.get_modules("VideoList").forEach((module, index) => {
			videoLists[module.title] = index;
		});

		for (let module of this.blueprint.get_modules("VideoList")) {
			result += `l`;

			for (let data of module.get_data()) {
				if (data.name === "Video") {
					result += `v${num2str(videos[data.videoId])}`;
				} else if (data.name === "Author") {
					result += `a${num2str(authors[data.author])}`;
				} else if (data.name === "VideoList") {
					result += `l${num2str(videoLists[data.title])}`;
				}
			}
			result += `-`;
		}

		return result;
	}

	async loadURL(url) {
		this.blueprint.clear();

		// remove char until ?
		url = url.slice(url.indexOf("?") + 1);

		const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZbcdefghijkmnopqrstuwxyz";
		const base = chars.length;
		const str2num = (str) => {
			var result = 0;
			for (let i = 0; i < str.length; i++) {
				result = result * base + chars.indexOf(str[i]);
			}
			return result;
		};

		var videos = [];
		var authors = [];
		var videoLists = [];

		var state = 0; // 0: video, 1: video list, 2: reading video list
		var currentVideoList = null;
		var currentData = null;

		for (let index = 0; index < url.length; index++) {
			let c = url[index];
			if (state === 0) {
				if (c === "v") {
					let videoId = url.slice(index + 1, index + 12);
					videos.push(videoId);
					let module = this.addVideoModule(videoId);
					await module.preparePromise;

					if (!authors.includes(module.author)) {
						authors.push(module.author);
					}

					index += 11;
				} else if (c === "l") {
					state = 2;
					currentVideoList = [];
				}
			} else if (state === 1) {
				if (c === "l") {
					state = 2;
					currentVideoList = [];
				}
			} else if (state === 2) {
				if (c === "v" || c === "a" || c === "l") {
					currentData = "";
					index++;
					while (url[index] !== "-" && url[index] !== "v" && url[index] !== "a" && url[index] !== "l") {
						currentData += url[index];
						index++;
					}
					if (c === "v") currentVideoList.push({ name: "Video", videoId: videos[str2num(currentData)] });
					else if (c === "a") currentVideoList.push({ name: "Author", author: authors[str2num(currentData)] });
					else if (c === "l") currentVideoList.push({ name: "VideoList", title: "" + str2num(currentData) });

					index--;
				} else if (c === "-") {
					state = 1;
					this.createVideoListModule(videoLists.length);
					videoLists.push(currentVideoList);
				}
			}
		}

		let videoListModules = this.blueprint.get_modules("VideoList");
		videoLists.forEach((videoList, index) => {
			videoListModules[index].set_data(videoList);
		});

		this.resetModulePosition();

		return true;
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

			mostLeft = Math.min(mostLeft, parseInt(videoList.left, 10));
			mostTop = Math.min(mostTop, parseInt(videoList.top, 10));
		}
		for (let videoList of saveData.videoLists) {
			let videoListModule = this.blueprint.get_modules("VideoList").find((module) => module.title === videoList.title);
			videoListModule.set_data(videoList.list);
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
		this.blueprint.ui.board.style.top = `0px`;

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
		if (this.blueprint.get_modules("VideoList").length > 0) this.blueprint.ui.board.style.top = `${-finalY}px`;

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
