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

    // set focus to the text entry field
    $('textarea#notice_textarea').focus();
}

/**
 * Setup post parameters and post the notice
 */
StatusNet.NewNoticeView.prototype.postNotice = function()
{
    StatusNet.debug("NewNoticeView.postNotice()");

    var that = this;
    var method = 'statuses/update.xml';
    var noticeText = $('#notice_textarea').val();
    var base = 'status=' + encodeURIComponent(noticeText);
    var params = [];
    params.push('source=' + encodeURIComponent('StatusNet Desktop'));

    var me = Titanium.UI.getCurrentWindow();

    if (me.replyToId) {
        StatusNet.debug("replyToId = " + me.replyToId);
        params.push('in_reply_to_status_id=' + me.replyToId);
    }

    var postParams = base + '&' + params.join('&');

    StatusNet.debug("Sending these post parameters: " + postParams);

    this.account.apiPost(method, postParams,
        function(status, response) {
            var id = $(response).find('status > id').text()
            if (id) {
                StatusNet.debug("Posted notice " + id);
            }
            // play notice posted sound
            me.close();
        },
        function(status, response) {
            var msg = $(response).find('error').text();
            if (msg) {
                StatusNet.debug("Error posting notice" + " - " + msg);
            } else {
                StatusNet.debug("Error posting notice - " + status + " - " + response);
            }
            me.close();
        }
    );
}
