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
StatusNet.NewNoticeView = function(data) {
    StatusNet.debug("NewNoticeView constructor");

    this.data = data;
    this.attachment = null;

    var db = StatusNet.getDB();
    this.account = StatusNet.Account.getDefault(db);

    this.sent = new StatusNet.Event();
}

/**
 * Initialize the window -- add @-reply text if necessary
 */
StatusNet.NewNoticeView.prototype.init = function() {
    // post a new notice
    StatusNet.debug("NewNoticeView.init");
    var that = this;
    var data = this.data;

    var margin = 4;
    var controlStripHeight = 32;
    var keyboardMargin = 0;
    if (StatusNet.Platform.isApple()) {
        // Currently, iPhone doesn't resize the window or our controls
        // to fit when the on-screen keyboard comes up. To keep it safe,
        // we're hardcoding the current size of one there. Sigh.
        keyboardMargin = 216;
    }

    var window = this.window = Titanium.UI.createWindow({
        title: 'New Notice',
        backgroundColor: StatusNet.Platform.dialogBackground()
    });

    var navbar = StatusNet.Platform.createNavBar(this.window);

	var cancelButton = Titanium.UI.createButton({
        title: 'Cancel'
        //style: Titanium.UI.iPhone.SystemButtonStyle.DONE // for native iPhone navbar only
    });

    cancelButton.addEventListener('click', function() {
        that.window.close();
    });
    navbar.setLeftNavButton(cancelButton);

    var updateButton = Titanium.UI.createButton({
        title: "Send"
    });
    updateButton.addEventListener('click', function() {
        that.postNotice(noticeTextArea.value);
    });
    navbar.setRightNavButton(updateButton);

    var noticeTextArea = Titanium.UI.createTextArea({
        top: navbar.height + margin,
        left: margin,
        right: margin,
        bottom: keyboardMargin + margin + controlStripHeight,
        value: '',
        font: {fontSize: 16},
        returnKeyType: Titanium.UI.RETURNKEY_SEND
    });
    noticeTextArea.addEventListener('return', function() {
        that.postNotice(noticeTextArea.value);
    });
    if (data.replyToUsername) {
        noticeTextArea.value = '@' + data.replyToUsername + ' ';
        // set cursor position to after the @
        //$('textarea#notice_textarea').selectRange(
        //    me.replyToUsername.length + 2,
        //    me.replyToUsername.length + 2
        //);
    }
    window.add(noticeTextArea);

    // Horizontal control strip that should live between the textarea
    // and the on-screen keyboard...
    var controlStrip = Titanium.UI.createView({
            left: margin,
            right: margin,
            bottom: keyboardMargin + margin,
            height: controlStripHeight
    });
    window.add(controlStrip);

    var textLimit = this.account.textLimit;
    StatusNet.debug("textlimit = " + textLimit);

    var counter = Titanium.UI.createLabel({
        text: textLimit,
        top: 0,
        right: 0,
        width: 'auto',
        height: 'auto'
    });
    controlStrip.add(counter);

    noticeTextArea.addEventListener('change', function(event) {
        counter.text = "" + (textLimit - event.value.length);
        // @fixme change color or display when negative
    });
    var moreButton = Titanium.UI.createButton({
        title: 'Options...',
        top: 0,
        left: 0,
        width: 80,
        height: controlStripHeight
    });
    moreButton.addEventListener('click', function() {
        //noticeTextArea.blur();
        var options = [];
        var callbacks = [];
        if (that.attachment == null) {
            if (StatusNet.Platform.hasCamera()) {
                options.push('Take photo');
                callbacks.push(function() {
                    Titanium.Media.showCamera({
                        success: function(event) {
                            that.addAttachment(event);
                        },
                        autohide: true,
                        animated: true,
                        saveToPhotoGallery: true
                    });
                });
            }

            options.push('Photo gallery');
            callbacks.push(function() {
                Titanium.Media.openPhotoGallery({
                    success: function(event) {
                        that.addAttachment(event);
                    },
                    autohide: true,
                    animated: true
                });
            });
        } else {
            options.push('Remove attachment');
            callbacks.push(function() {
                that.attachment = null;
                // @fixme hide icon
            });
        }

        options.push('Cancel');
        callbacks.push(function() {});

        var dialog = Titanium.UI.createOptionDialog({
            title: 'Notice options',
            options: options
        });
        dialog.addEventListener('click', function(event) {
            callbacks[event.index]();
        });
        dialog.show();
    });
    controlStrip.add(moreButton);

    if (StatusNet.Platform.isApple()) {
        // Setting focus to the textarea doesn't show the keyboard
        // on Android for some reason. Leave it unfocused there so
        // the first tap in will set focus and open the keyboard.
        window.addEventListener('open', function(event) {
            // set focus to the text entry field
            noticeTextArea.focus();
        });
    }
    window.open({
        //modal: true
    });

    StatusNet.debug("NewNoticeView.init END");
};

StatusNet.NewNoticeView.prototype.addAttachment = function(event) {
    var image = event.media; // What is this exactly, a blob?
    for (var x in event) {
        if (event.hasOwnProperty(x)) {
            StatusNet.debug('Camera event.' + x + ' : ' + typeof event[x]);
        }
    }
    StatusNet.debug('Media type: ' + event.mediaType);
    // @fixme implement attachments ;)

    this.attachment = event.media;
};

/**
 * Setup post parameters and post the notice
 */
StatusNet.NewNoticeView.prototype.postNotice = function(noticeText)
{
    StatusNet.debug("NewNoticeView.postNotice()");

    var that = this;
    var method = 'statuses/update.xml';
    var params = {status: noticeText,
                  source: 'StatusNet Mobile'};

    var data = this.data;

    if (data.replyToId) {
        StatusNet.debug("replyToId = " + data.replyToId);
        params.in_reply_to_status_id = data.replyToId;
    }

    if (this.attachment) {
        params.media = this.attachment;
    }

    StatusNet.debug("Sending these post parameters: " + params);

    this.account.apiPost(method, params,
        function(status, response) {
            var id = $(response).find('status > id').text()
            if (id) {
                StatusNet.debug("Posted notice " + id);
            }

            // play notice posted sound
            that.window.close();

            // Tell the client we've got something fun to do!
            that.sent.notify();
        },
        function(status, response) {
            var msg = $(response).find('error').text();
            if (msg) {
                StatusNet.debug("Error posting notice" + " - " + msg);
            } else {
                StatusNet.debug("Error posting notice - " + status + " - " + response);
            }
            that.window.close();
        }
    );
}
