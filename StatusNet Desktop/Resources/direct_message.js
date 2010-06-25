$LAB
    .script("statusnet.js").wait()
    .script("model/statusnet_account.js")
    .script("view/statusnet_direct_messageview.js")
    .script("view/statusnet_infobar.js")
    .wait(function() {
    $(function() {
        var dmv = new StatusNet.DirectMessageView();
        dmv.init();
    });
});
