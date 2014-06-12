function oneImageLoad(imgTag) {
    imgTag.removeClass("yet");
    imgTag.attr("src", imgTag.attr("ref"));
}
$(function() {
    $(".catalog img").load(function() {
        oneImageLoad($("img.yet:first"));
    });

    oneImageLoad($("img.yet:first"));
})
