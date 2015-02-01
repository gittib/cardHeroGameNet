$(function () {
    $('#update_history a.more').on('click', function(e) {
        $('#update_history li').css('display', 'block');
        $('#update_history a.more').hide();
    });
});
