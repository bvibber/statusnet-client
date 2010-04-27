$LAB
    .script("statusnet.js").wait()
    .script("view/statusnet_login_dialog.js")
    .script("model/statusnet_account.js")
    .script("view/statusnet_sidebar.js")
    .script("statusnet_client.js")
    .script("view/statusnet_timelineview.js")
    .script("model/statusnet_timeline.js")
    .script("model/statusnet_timeline_friends.js")
    .wait(function(){

    var db = StatusNet.getDB();

    var ac = StatusNet.Account.getDefault(db);

    var snc = null;

    if (ac === null) {
        StatusNet.showSettings();
    } else {
        snc = new StatusNet.Client(ac);
    }

});
