// cursor capture
window.addEventListener("mousedown" , function (e) {
    window.cursor = {
        x: e.clientX,
        y: e.clientY,
    };
});
window.addEventListener("mousemove" , function (e) {
    window.cursor = {
        x: e.clientX,
        y: e.clientY,
    };
});
window.addEventListener("touchstart" , function (e) {
    window.cursor = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
    };
});
window.addEventListener("touchmove" , function (e) {
    window.cursor = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
    };
});

// custom events
var touchDown = new CustomEvent("touchdown" , {bubbles: true});
var touchUp = new CustomEvent("touchup" , {bubbles: true});
window.addEventListener("touchstart" , function (e) {
    var touch = e.touches[0];
    var element = document.elementFromPoint(touch.clientX , touch.clientY);
    element.dispatchEvent(touchDown);
});
window.addEventListener("touchend" , function (e) {
    var touch = e.changedTouches[e.changedTouches.length - 1];
    var element = document.elementFromPoint(touch.clientX , touch.clientY);
    element.dispatchEvent(touchUp);
});

// reload preventer
window.RELOAD_FLAG = false;
window.addEventListener('keydown', function (e) {
    if (e.key == "F5") window.RELOAD_FLAG = true;
    if (e.ctrlKey && e.key == "r") window.RELOAD_FLAG = true;
});

window.addEventListener('keyup', function (e) {
    window.RELOAD_FLAG = false;
});

window.addEventListener('beforeunload', function (e) {
    if (window.RELOAD_FLAG) {
        e.returnValue = true;
    } else {
        window.close();
    }
});