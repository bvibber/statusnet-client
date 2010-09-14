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
    StatusNet.NewNoticeView.call(this, data);
}

StatusNet.directMessageView.prototype = heir(StatusNet.NewNoticeView.prototype);

StatusNet.directMessageView.prototype.title = function()
{
    return 'Direct Message to ' + this.data.recipient;
};

StatusNet.directMessageView.prototype.addAttachmentControls = function(controlStrip)
{
    // Do nothing -- attachments aren't supported on DMs.
}

/**
 * Setup post parameters and send the direct message
 */
StatusNet.directMessageView.prototype.postNotice = function(dmText)
{

    StatusNet.debug("directMessageView.postNotice()");

    var that = this;
    var method = 'direct_messages/new.xml';

    var data = this.data;

    var params = 'text='
        + encodeURIComponent(dmText)
        + "&screen_name="
        + encodeURIComponent(data.recipient);

    this.actInd.show();

    StatusNet.debug("Sending these post parameters: " + params);

    data.account.apiPost(method, params,
        function(status, response) {
            var msg = "Direct message to " + data.recipient + " sent";
            StatusNet.debug(msg);

            that.actInd.hide();

            // play notice posted sound
            that.close();

            // Tell the client we've got something fun to do!
            that.sent.notify({msg: msg});
        },
        function(status, response, responseText) {
            that.actInd.hide();
            // In case it didn't take...
            setTimeout(function() {
                that.actInd.hide();
            }, 10);
            that.enableControls(true);

            StatusNet.showNetworkError(status, response, responseText, "Error posting direct message: ");
        }
    );

};
