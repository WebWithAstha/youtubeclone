function videoMouseEnterHandle(elem) {
    if (elem.querySelector('.thumbnail')) {
        elem.querySelector('.thumbnail').style.display = 'none';
    }
    elem.querySelector('video');
    elem.querySelector('video').play();
}
function videoMouseLeaveHandle(elem) {
    
    if (elem.querySelector('.thumbnail')) {
        elem.querySelector('.thumbnail').style.display = 'block';
    }
    elem.querySelector('video').currentTime = 0;
    elem.querySelector('video').pause();
}

function pauseVideo(elem) {
    if (elem.currentTime > 10) {
        elem.pause();
    }
}
