$(function() {
    $(".card_info").hide();

    $("#game_field td").on('click', function() {
        var id = $(this).attr('id');
        $(".card_info").hide();
        $("[ref="+id+"]").show();
    });

    $("div.close_button").on("click", function() {
        $(".card_info").hide();
    });
})
