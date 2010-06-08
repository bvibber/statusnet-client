/**
 * Constructor for direct message view
 */
StatusNet.DirectMessageView = function() {
    var db = StatusNet.getDB();
    this.account = StatusNet.Account.getDefault(db);

    StatusNet.debug("DirectMessageView constructor");
}

/**
 * Initialize the window
 */
StatusNet.DirectMessageView.prototype.init = function() {
    // post a new notice
    StatusNet.debug("DirectMessageView.init()");

    var that = this;
    var me = Titanium.UI.getCurrentWindow();

    $('#send_button').bind('click', function(event) {
        that.send();
    });

    StatusNet.debug("textlimit = " + that.account.textLimit);

    $('#counter').html(that.account.textLimit);
    $('#direct_message_textarea').bind('keypress', function(event) {
        var len = $('#direct_message_textarea').val().length;

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
 * Send direct message
 */
StatusNet.DirectMessageView.prototype.send = function()
{
    StatusNet.debug("DirectMessageView.send()");
    var that = this;
    var url = 'direct_messages/new.json';
    var msgText = $('#direct_message_textarea').val();

    var me = Titanium.UI.getCurrentWindow();
    
    var params = 'text=' + escape(msgText) + "&" + "screen_name=" + me.nickname;
            
    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(data);
            StatusNet.debug(data.user);
            
            var notification = Titanium.Notification.createNotification(Titanium.UI.getCurrentWindow());
            notification.setTitle("Sent");
            notification.setMessage("Direct message to " + me.nickname + " sent.");

            notification.setIcon("app://logo.png");
            notification.setDelay(5000);
            notification.setCallback(function () {
                // @todo Bring the app window back to focus / on top
                 alert("i've been clicked");
             });
            notification.show();
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
