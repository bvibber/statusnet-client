$LAB
    .script("statusnet.js").wait()
    .script("model/statusnet_account.js")
    .script("view/statusnet_sidebar.js")
    .script("statusnet_client.js")
    .script("view/statusnet_timelineview.js")
    .script("view/statusnet_timelineview_user.js")
    .script("view/statusnet_timelineview_inbox.js")
    .script("model/statusnet_timeline.js")
    .script("model/statusnet_timeline_friends.js")
    .script("model/statusnet_timeline_user.js")
    .script("model/statusnet_timeline_inbox.js")
    .script('atom_parser.js')
    .script("humane.js")
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
