$(function() {
    $(".game_row").on("click", function() {
        document.location = $(this).closest('div.game_field_info').find('div.field_title').find('a').attr('href');
    })
})
