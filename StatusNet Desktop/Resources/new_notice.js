$LAB
    .script("statusnet.js").wait()
    .script("model/statusnet_account.js")
    .script("view/statusnet_newnoticeview.js")
    .wait(function() {
    $(function() {
        StatusNet.debug("gargargar");
        var nnv = new StatusNet.NewNoticeView();
        nnv.init();
    });
});














