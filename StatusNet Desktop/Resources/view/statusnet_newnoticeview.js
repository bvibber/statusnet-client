/**
 * Constructor for new notice view
 */
StatusNet.NewNoticeView = function() {
    var db = StatusNet.getDB();
    this.account = StatusNet.Account.getDefault(db);

    StatusNet.debug("NewNoticeView constructor");
}

/**
 * Initialize the window -- add @-reply text if necessary
 */
StatusNet.NewNoticeView.prototype.init = function() {
    // post a new notice
    StatusNet.debug("NewNoticeView.init");

    var that = this;
    var me = Titanium.UI.getCurrentWindow();

    if (me.replyToUsername) {
        $('textarea#notice_textarea').val('@' + me.replyToUsername + ' ');
        // set cursor position to after the @
        $('textarea#notice_textarea').selectRange(
            me.replyToUsername.length + 2,
            me.replyToUsername.length + 2
        );
    }

    $('#update_button').bind('click', function(event) {
        that.postNotice();
    });

    StatusNet.debug("textlimit = " + that.account.textLimit);

    $('#counter').html(that.account.textLimit);
    $('#notice_textarea').bind('keypress', function(event) {
        var len = $('#notice_textarea').val().length;

        // turn char counter red when it goes negative
        if (that.account.textLimit - len < 0 && that.account.textLimit - len + 1 == 0) {
            $('#counter').addClass('negative');
        }

        if (that.account.textLimit - len > 0 && that.account.textLimit - len - 1 == 0) {
            $('#counter').removeClass('negative');
        }

        $('#counter').html(that.account.textLimit - len);
    });
}

/**
 * Setup post parameters and post the notice
 */
StatusNet.NewNoticeView.prototype.postNotice = function()
{
    StatusNet.debug("NewNoticeView.postNotice()");
    var that = this;
    var url = 'statuses/update.json';
    var noticeText = $('#notice_textarea').val();

    var base = 'status=' + noticeText;
    var params = [];
    params.push('source=StatusNet Desktop');

    var me = Titanium.UI.getCurrentWindow();

    if (me.replyToId) {
        StatusNet.debug("replyToId = " + me.replyToId);
        params.push('in_reply_to_status_id=' + me.replyToId);
    }

    var postParams = base + '&' + params.join('&');

    StatusNet.debug("Sending these post parameters: " + postParams);

    this.account.postUrl(url, postParams,
        function(status, data) {
            StatusNet.debug(data);
            StatusNet.debug(data.user);
            
            var notification = Titanium.Notification.createNotification(Titanium.UI.getCurrentWindow());
            notification.setTitle("Notice posted");
            //notification.setMessage("Posted new notice to " + that.account.getHost());

            notification.setIcon("app://logo.png");
            notification.setDelay(5000);
            notification.setCallback(function () {
                // @todo Bring the app window back to focus / on top
                alert("i've been clicked");
            });
            notification.show();
            
            me.close();
        },
        function(client, msg) {
            StatusNet.debug('Could not post notice: ' + msg);
            alert('Could not post notice: ' + msg);
            me.close();
        }
    );
}
