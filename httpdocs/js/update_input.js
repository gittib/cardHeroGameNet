$(function() {
    $(".submit>input").click(function() {
        var form1 = $("form[name=regist_form]");
        var re = /[^a-zA-Z0-9]/;
        var sError = "";

        inStr = $("[name=nick_name]").val();
        if (inStr.length < 1) {
            sError += "ユーザー名は1文字以上にして下さい。<br />\n";
        }
        $("#message").html(sError);
        if (sError.length === 0) {
            form1.submit();
        }
    })
});
