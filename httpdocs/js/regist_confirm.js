$(function() {
    $(".submit>input").click(function() {
        var form1 = $("form[name=regist_form]");
        form1.attr("action", $(this).attr("to_page"));
        form1.submit();
    })
});
