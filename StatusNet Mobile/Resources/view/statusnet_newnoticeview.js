/**
 * StatusNet Mobile
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
};

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
};

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
            me.close();
        },
        function(client, msg) {
            StatusNet.debug('Could not post notice: ' + msg);
            alert('Could not post notice: ' + msg);
            me.close();
        }
    );
};
