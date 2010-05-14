StatusNet.NewNoticeView = function() {
    var db = StatusNet.getDB();
    this.account = StatusNet.Account.getDefault(db);

    StatusNet.debug("NewNoticeView constructor");
}

StatusNet.NewNoticeView.prototype.init = function() {
    // post a new notice
    StatusNet.debug("NewNoticeView.init");

    var that = this;

    $('#update_button').bind('click', function() {
        that.postNotice();
    });

}

StatusNet.NewNoticeView.prototype.postNotice = function()
{
    StatusNet.debug("NewNoticeView.postNotice()");
    var url = 'statuses/update.json';
    var noticeText = $('#notice_textarea').val();
    var params = 'status=' + noticeText + '&source=StatusNet Desktop';
    var that = this;
    var me = Titanium.UI.getCurrentWindow();

    if (me.replyToId) {
        StatusNet.debug("replyToId = " + me.replyToId);
        StatusNet.debug("replyToUsername = " + me.replyToUsername);
    }

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(data);
            StatusNet.debug(data.user);
            me.close();
        },
        function(client, msg) {
            StatusNet.debug('Could not post notice: ' + msg);
            alert('Could not post notice: ' + msg);
            me.close();
        }
    );
}
