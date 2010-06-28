/**
 * StatusNet Desktop
 *
 * Copyright 2010 StatusNet, Inc.
 * Based in part on Tweetanium
 * Copyright 2008-2009 Kevin Whinnery and Appcelerator, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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

    var textLimit = this.account.textLimit;

    StatusNet.debug("textlimit = " + textLimit);

    // Note: backspace and other whitespace keys don't generate
    // a keypress event on linux, although they do on OS X.
    $('#counter').html(that.account.textLimit);
    $('#direct_message_textarea').bind('keydown', function(event) {
        var len = $('#direct_message_textarea').val().length;

        // turn char counter red when it goes negative
        if (textLimit - len < 0 && (textLimit - len) + 1 === 0) {
            $('#counter').addClass('negative');
        }

        if (textLimit - len === 0) {
            $('#counter').removeClass('negative');
        }

        $('#counter').html(textLimit - len);
    });

    // set focus to the text entry field
    $('direct_message_textarea').focus();
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

    var params = 'text='
        + encodeURIComponent(msgText)
        + "&screen_name="
        + encodeURIComponent(me.nickname);

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(data);
            StatusNet.debug(data.user);

            // play new direct message sound

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
