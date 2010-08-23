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
 * Constructor for direct message view
 */
StatusNet.directMessageView = function(data) {
    StatusNet.debug("directMessageView constructor");
    this.data = data;
    this.sent = new StatusNet.Event();
}

/**
 * Initialize the window
 */
StatusNet.directMessageView.prototype.init = function() {
    // send a direct message
    StatusNet.debug("directMessageView.init");
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
        title: 'Direct Message to ' + data.author,
        backgroundColor: StatusNet.Platform.dialogBackground(),
        navBarHidden: true
    });
    if (StatusNet.Platform.isAndroid()) {
        // If we set this on iPhone, it explodes and fails. :P
        // Need to set it on Android to force the window to size to fit
        // the screen area limited by the software keyboard, since we
        // can't predict its height.
        window.windowSoftInputMode =
            Ti.UI.Android.SOFT_INPUT_ADJUST_RESIZE +
            Ti.UI.Android.SOFT_INPUT_STATE_VISIBLE;
    }

    var navbar = StatusNet.Platform.createNavBar(this.window);

	var cancelButton = Titanium.UI.createButton({
        title: 'Cancel'
        //style: Titanium.UI.iPhone.SystemButtonStyle.DONE // for native iPhone navbar only
    });

    cancelButton.addEventListener('click', function() {
        that.window.close();
    });
    navbar.setLeftNavButton(cancelButton);

    var sendButton = Titanium.UI.createButton({
        title: "Send"
    });
    sendButton.addEventListener('click', function() {
        that.sendDirectMessage(dmTextArea.value);
    });
    navbar.setRightNavButton(sendButton);

    var dmTextArea = Titanium.UI.createTextArea({
        top: navbar.height + margin,
        left: margin,
        right: margin,
        bottom: keyboardMargin + margin + controlStripHeight,
        value: '',
        font: {fontSize: 16},
        returnKeyType: Titanium.UI.RETURNKEY_SEND
    });
    dmTextArea.addEventListener('return', function() {
        that.sendDirectMessage(dmTextArea.value);
    });

    window.add(dmTextArea);

    // Horizontal control strip that should live between the textarea
    // and the on-screen keyboard...
    var controlStrip = Titanium.UI.createView({
            left: margin,
            right: margin,
            bottom: keyboardMargin + margin,
            height: controlStripHeight
    });
    window.add(controlStrip);

    var textLimit = data.account.textLimit;
    StatusNet.debug("textlimit = " + textLimit);

    var counter = Titanium.UI.createLabel({
        text: textLimit,
        top: 0,
        right: 0,
        width: 'auto',
        height: 'auto'
    });
    controlStrip.add(counter);

    dmTextArea.addEventListener('change', function(event) {
        counter.text = "" + (textLimit - event.value.length);
        // @fixme change color or display when negative
    });

    this.actInd = Titanium.UI.createActivityIndicator();
    this.actInd.message = 'Sending...';

    if (StatusNet.Platform.isApple()) {
        // iPhone specific activity indicator niceties
        this.actInd.style = Titanium.UI.iPhone.ActivityIndicatorStyle.BIG;

        // Setting focus to the textarea doesn't show the keyboard
        // on Android for some reason. Leave it unfocused there so
        // the first tap in will set focus and open the keyboard.
        window.addEventListener('open', function(event) {
            // set focus to the text entry field
            dmTextArea.focus();
        });
    }

    window.add(this.actInd);

    StatusNet.Platform.animatedOpen(window);

    StatusNet.debug("directMessageView.init END");
};

/**
 * Setup post parameters and send the direct message
 */
StatusNet.directMessageView.prototype.sendDirectMessage = function(dmText)
{
    StatusNet.debug("directMessageView.sendDirectMessage()");

    var that = this;
    var method = 'direct_messages/new.xml';

    var data = this.data;

    var params = 'text='
        + encodeURIComponent(dmText)
        + "&screen_name="
        + encodeURIComponent(data.author);

    this.actInd.show();

    StatusNet.debug("Sending these post parameters: " + params);

    data.account.apiPost(method, params,
        function(status, response) {
            var msg = "Direct message to " + data.author + " sent";
            StatusNet.debug(msg);

            if (data.onSuccess) {
                data.onSuccess(msg);
            }

            that.actInd.hide();

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

            if (data.onFailure) {
                data.onFailure(msg);
            }

            that.actInd.hide();

            that.window.close();
        }
    );
};
