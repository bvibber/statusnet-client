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

    var textLimit = this.account.textLimit;

    StatusNet.debug("textlimit = " + textLimit);

    $('#counter').html(textLimit);

    // Note: pressing a key doesn't generate a keypress event on
    // Linux version of Titanium.
    $('#notice_textarea').bind('keydown', function(event) {
        var len = $('#notice_textarea').val().length;

       // turn char counter red when it goes negative
        if (textLimit - len < 0 && (textLimit - len) + 1 === 0) {
            $('#counter').addClass('negative');
        }

        if (textLimit - len === 0) {
            $('#counter').removeClass('negative');
        }

        $('#counter').html(textLimit - len);
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

    var base = 'status=' + encodeURIComponent(noticeText);
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
            // XXX: Notifications are busted and cause crashing on Win32 Titanium
            if (Titanium.Platform.name !== "Windows NT") {
                // XXX: Notifications are busted and cause crashing on Win32 Titanium
                var notification = Titanium.Notification.createNotification(Titanium.UI.getMainWindow());
                notification.setTitle("Notice posted");
                notification.setMessage("Posted new notice to " + that.account.getHost());

                notification.setIcon("app://logo.png");
                notification.setDelay(5000);
                notification.setCallback(function () {
                    // @todo Bring the app window back to focus / on top
                    alert("i've been clicked");
                });
                notification.show();
            }
            me.close();
        },
        function(client, responseText) {
            var msg = Titanium.JSON.parse(responseText);
            StatusNet.debug('Error: ' + msg.error);
            alert('Error: ' + msg.error);
            me.close();
        }
    );
}
