$(function () {
    $('body').append(
        '<style>' +
        '<!--' +
        'table#my_console_window {' +
          'width : 100%' +
          'border: solid 1px;' +
        '}' +
        'table#my_console_window th {' +
          'border: solid 1px #eeeeee;' +
          'background-color: #eeffee;' +
          'font-size: 10px;' +
        '}' +
        'table#my_console_window td {' +
          'border: solid 1px #eeeeee;' +
          'background-color: #ffffff;' +
          'font-size: 10px;' +
        '}' +
        '-->' +
        '</style>'
    );
    $('body').append('<table id="my_console_window"><tr><th colspan=2>console.log() Output</th></tr></table>');
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
