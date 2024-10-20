// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
//                      Module-VideoInfo.js                     //
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

// video
Module["Video"] = class Video extends Module["Module"] {
	constructor(videoId = null, blueprint = null) {
		super("Video", blueprint);
		this.hasOutput = false;
		this.hasBranchIn = false;

		this.videoId = videoId;
		this.author = null;
		this.authorModule = null;
		this.preparePromise = this.fetchVideoInfo();
	}

	createUI() {
		super.createUI();
		this.ui.head.innerText = "\xa0\xa0" + this.title + "\xa0\xa0";
		this.ui.content.innerHTML = `<img src="https://img.youtube.com/vi/${this.videoId}/hqdefault.jpg" height="120" style="pointer-events: none;">`;
	}

	// Fetch video information
	fetchVideoInfo() {
		const url = `https://youtube.com/oembed?url=https://www.youtube.com/watch?v=${this.videoId}&format=json`;

		const thisModule = this;

		return fetch(url)
			.then((response) => response.json())
			.then((data) => {
				if (data?.title && data?.author_name) {
					this.title = data.title;
					this.author = data.author_name;

					// Try to create author module
					// If it already exists, update the author name
					let authorModules = this.blueprint.get_modules("Author");
					let authorModule = authorModules.find((module) => module.author === this.author);
					if (authorModule) {
						this.authorModule = authorModule;
					} else {
						this.authorModule = this.blueprint.add_module("Author", this.author);
					}
					this.authorModule.songModules.push(this);

					// Try to create provider module only if it is not youtube
					// if (data.provider_name !== "YouTube") {
					// 	let providerModules = this.blueprint.get_modules("Provider");
					// 	let providerModule = providerModules.find((module) => module.provider === data.provider_name);
					// 	if (providerModule) {
					// 		providerModule.name = data.provider_name;
					// 	} else {
					// 		this.blueprint.add_module("Provider", data.provider_name);
					// 	}
					// }

					this.updateUI();
				} else {
					console.error("No video found");
				}
			})
			.catch((error) => console.error("Error fetching video info:", error));
	}

	get_args() {
		return [this.videoId];
	}

	getSummary() {
		return `<img src="https://img.youtube.com/vi/${this.videoId}/hqdefault.jpg" height="120" style="pointer-events: none;">`;
	}
};

Module["Author"] = class Author extends Module["Module"] {
	constructor(author = null, blueprint = null) {
		super("Author", blueprint);
		this.hasOutput = false;
		this.hasBranchIn = false;

		this.songModules = [];

		this.author = author;
	}

	get_args() {
		return [this.author];
	}

	createUI() {
		super.createUI();
		this.ui.content.innerText = "\xa0\xa0" + this.author + "\xa0\xa0";
	}

	getSummary() {
		return this.author;
	}
};

// Module["Provider"] = class Provider extends Module["Module"] {
// 	constructor(provider = null, blueprint = null) {
// 		super("Provider", blueprint);
// 		this.hasOutput = false;
// 		this.hasBranchIn = false;

// 		this.provider = provider;
// 	}

// 	createUI() {
// 		super.createUI();
// 		this.ui.content.innerText = "\xa0\xa0" + this.provider + "\xa0\xa0";
// 	}

// 	getSummary() {
// 		return this.provider;
// 	}
// };
