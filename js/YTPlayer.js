var tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var YTPlayer = class YTPlayer {
	constructor(endCallback) {
		this.player = null;
		this.videoId = null;
		this.playerVars = {
			autoplay: 1,
			controls: 1,
			disablekb: 0,
			enablejsapi: 1,
			fs: 1,
			iv_load_policy: 1,
			playsinline: 1,
			rel: 0,
		};
		this.endCallback = endCallback;
	}

	load(videoId) {
		if (this.player) {
			this.player.loadVideoById(videoId);
		} else {
			this.videoId = videoId;
			this.player = new YT.Player("player", {
				height: "100%",
				width: "100%",
				videoId: videoId,
				playerVars: this.playerVars,
				events: {
					onReady: this.onPlayerReady,
					onStateChange: this.onPlayerStateChange.bind(this),
				},
			});
		}
	}

	onPlayerReady(event) {
		event.target.playVideo();
	}

	onPlayerStateChange(event) {
		if (event.data === YT.PlayerState.ENDED) {
			this.endCallback();
		} else if (event.data === YT.PlayerState.UNSTARTED) {
			// alert("Play failed");
			// this.endCallback();
		}
	}
};
