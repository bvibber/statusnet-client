$LAB
    .script("statusnet.js").wait()
    .script("model/statusnet_account.js")
    .script("view/statusnet_newnoticeview.js")
    .script("view/statusnet_infobar.js")
    .wait(function() {
    $(function() {
        var nnv = new StatusNet.NewNoticeView();
        nnv.init();
    });
});














