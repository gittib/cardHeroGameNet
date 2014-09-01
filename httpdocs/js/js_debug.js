$(function () {
    $('body').append('<table class="sql_debug" id="my_console_window" style="width:100%"><tr><th colspan=2>Debug Window</th></tr></table>');
    console.log_bk = console.log;
    console.log = function (dbg_msg) {
        console.log_bk(dbg_msg);
        $('#my_console_window').append(
            '<tr><td>' +
                $('#my_console_window tr').size() +
            '</td><td>' +
                JSON.stringify(dbg_msg).replace(/[\r\n]+/g, '<br />').replace(/\\n/g, '<br />').replace(/,"/g, ', "') +
            '</td></tr>'
        );
    };
});

