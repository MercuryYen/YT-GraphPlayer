// Video Manager using adapted Blueprint.js structure

var VideoManager = class {
	constructor() {
		this.container = null;

		// Blueprint initialization
		this.blueprint = new Blueprint("Video Manager");

		this.songList = [];
		this.nowIndex = 0;

		this.songListContainer = null;
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

		var blueprintContainer = document.createElement("div");
		blueprintContainer.style = `
            position: absolute;
            top: 0;
            left: 0;
            right: 640px;
            bottom: 0;
            overflow: hidden;
        `;
		blueprintContainer.appendChild(this.blueprint.ui.container);
		this.container.appendChild(blueprintContainer);

		this.songListContainer = document.createElement("div");
		this.songListContainer.style = `
            position: absolute;
            top: 0;
            right: 0;
            width: 640px;
            bottom: 480px;
            overflow: auto;
            background: #333;
            color: white;
        `;
		this.container.appendChild(this.songListContainer);

		// add video player at the bottom right
		this.player = new YTPlayer(this.nextSong.bind(this));
		let playerContainer = document.createElement("div");
		playerContainer.id = "player";
		playerContainer.style = `
            position: absolute;
            bottom: 0;
            right: 0;
            width: 640px;
            height: 480px;
        `;
		this.container.appendChild(playerContainer);

		// Create a textbox and button for adding YouTube videos
		{
			let urlInputContainer = document.createElement("div");
			urlInputContainer.style = `
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 10;
            background: #333;
            padding: 10px;
            color: white;
        `;

			let input = document.createElement("input");
			input.type = "text";
			input.placeholder = "Enter YouTube video URL";
			input.style = "width: 300px;";

			let button = document.createElement("button");
			button.innerText = "Add Video";
			button.style = "margin-left: 10px;";
			button.addEventListener("click", () => {
				let url = input.value;
				let videoId = this.extractVideoId(url);
				if (videoId) {
					this.addVideoModule(videoId);
				} else {
					alert("Invalid YouTube URL");
				}
			});

			urlInputContainer.appendChild(input);
			urlInputContainer.appendChild(button);
			document.body.appendChild(urlInputContainer);
		}

		// Create a button for creating a video list with name
		{
			let nameInputContainer = document.createElement("div");
			nameInputContainer.style = `
                position: absolute;
                bottom: 50px;
                left: 10px;
                z-index: 10;
                background: #333;
                padding: 10px;
                color: white;
            `;

			let input = document.createElement("input");
			input.type = "text";
			input.placeholder = "Enter video list name";
			input.style = "width: 300px;";

			let button = document.createElement("button");
			button.innerText = "Create Video List";
			button.style = "margin-left: 10px;";
			button.addEventListener("click", () => {
				let name = input.value;
				this.createVideoListModule(name);
			});

			nameInputContainer.appendChild(input);
			nameInputContainer.appendChild(button);
			document.body.appendChild(nameInputContainer);
		}
	}

	extractVideoId(url) {
		const regex = /[\?&]v=([^&#]*)/;
		const match = url.match(regex);
		return match ? match[1] : null;
	}

	addVideoModule(videoId) {
		// Check if the video is already in the pool
		let videoModule = this.blueprint.get_modules("Video").find((module) => module.videoId === videoId);
		if (videoModule) {
			return;
		} else {
			var module = this.blueprint.add_module("Video", videoId, () => {
				if (module.authorModule.songModules.length === 1) {
					module.authorModule.waiting = false;
					module.authorModule.ui.container.addEventListener("mousedown", () => {
						if (module.authorModule.waiting.waiting) {
							this.playModule(module.authorModule);
						}

						module.authorModule.waiting = true;
						setTimeout(() => {
							module.authorModule.waiting = false;
						}, 400);
					});
				}
			});

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
	}

	createVideoListModule(title) {
		// Check if the video is already in the pool
		let videoListModule = this.blueprint.get_modules("VideoList").find((module) => module.title === title);
		if (videoListModule) {
			return;
		} else {
			var module = this.blueprint.add_module("VideoList", title);
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
	}

	playModule(module, index = 0) {
		console.log("Play module");
		console.log(module);
		this.nowIndex = index;
		if (module instanceof Module["Video"]) {
			this.player.load(module.videoId);
		} else if (module instanceof Module["Author"]) {
			this.playlist = module.songModules;
			this.player.load(this.playlist[index].videoId);
		} else if (module instanceof Module["VideoList"]) {
			this.playlist = module.modules;
			this.player.load(this.playlist[index].videoId);
		}
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
