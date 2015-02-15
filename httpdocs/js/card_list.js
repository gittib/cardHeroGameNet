function narrowCards () {
    var sArranged = '';
    switch ($('select.arranged_disp_switch').val()) {
        case 'only_arranged':
            sArranged = '.arranged';
            break;
        case 'only_original':
            sArranged = '.original';
            break;
    }

    var sCategory = '';
    switch ($('select.category_disp_switch').val()) {
        case 'only_front':
            sCategory = '.monster_front';
            break;
        case 'only_back':
            sCategory = '.monster_back';
            break;
        case 'only_magic':
            sCategory = '.magic';
            break;
        case 'only_super':
            sCategory = '.super';
            break;
    }

    $('.card_data').hide();
    $('.card_data' + sArranged + sCategory).show();
}

$(function () {
    $('select.arranged_disp_switch').on('change', function() {
        narrowCards();
    });
    $('select.category_disp_switch').on('change', function() {
        narrowCards();
    });
});
