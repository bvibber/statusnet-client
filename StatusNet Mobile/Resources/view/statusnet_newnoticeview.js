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
        backgroundColor: StatusNet.Platform.dialogBackground(),
        navBarHidden: true,
        // Needed to work around Android bug with camera/gallery callbacks
        // and heavyweight windows; it won't send the callbacks direct to
        // our main context, so we need to run them from there.
        url: 'statusnet_photo_helper.js'
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
        title: 'Cancel',
        style: Titanium.UI.iPhone.SystemButtonStyle.DONE // for native iPhone navbar only
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

    var attachInfo = this.attachInfo = Titanium.UI.createLabel({
        text: '',
        top: 0,
        left: 84,
        right: 40,
        height: 'auto'
    });
    controlStrip.add(attachInfo);

    var moreButton = Titanium.UI.createButton({
        title: 'Attach...',
        top: 0,
        left: 0,
        width: 80,
        height: controlStripHeight
    });

    // Due to a bug on Android with heavyweight window contexts, we need
    // to run the actual showCamera etc from another context.
    // This sets up the event listeners in our main context to communicate
    // with the window's mini context which only has the camera code.
    var photoEvent = 'StatusNet.newnotice.photoReceived';
    var photoListener = function(event) {
        if (event.status == 'success') {
            // Read in the temporary file...
            var tempFile = Titanium.Filesystem.getFile(event.filename);
            StatusNet.debug('XXX: filename: ' + event.filename);
            StatusNet.debug('XXX: file: ' + tempFile);
            StatusNet.debug('XXX: file.exists: ' + tempFile.exists);
            StatusNet.debug('XXX: file.size: ' + tempFile.size);

            var media = tempFile.read();
            StatusNet.debug('XXX: media.size: ' + media.size);
            StatusNet.debug('XXX: media.length: ' + media.length);
            //tempFile.deleteFile();

            // And attach it!
            that.addAttachment(media);
        } else if (event.status == 'cancel') {
            StatusNet.debug('Photo attachment canceled.');
        } else if (event.status == 'error') {
            StatusNet.debug('Photo attachment failed: ' + event.msg);
            alert(event.msg);
        } else {
            StatusNet.debug('Got unexpected event from photo helper.');
        }
    }
    Titanium.App.addEventListener(photoEvent, photoListener);
    window.addEventListener('close', function() {
       Titanium.App.removeEventListener(photoEvent, photoListener);
    });

    moreButton.addEventListener('click', function() {
        //noticeTextArea.blur();
        var options = [];
        var callbacks = [];
        if (that.attachment == null) {

            if (StatusNet.Platform.hasCamera()) {
                options.push('Take photo');
                callbacks.push(function() {
                    that.openAttachment('camera');
                });
            }

            options.push('Photo gallery');
            callbacks.push(function() {
                that.openAttachment('gallery');
            });
        } else {
            options.push('Remove attachment');
            callbacks.push(function() {
                that.removeAttachment();
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
            noticeTextArea.focus();
        });
    }

    window.add(this.actInd);

    StatusNet.Platform.animatedOpen(window);

    StatusNet.debug("NewNoticeView.init END");
};

StatusNet.NewNoticeView.prototype.openAttachment = function(source)
{
    if (StatusNet.Platform.isAndroid() && !Ti.Filesystem.isExternalStoragePresent) {
        alert('SD card is missing or unmounted. Check card and try again.');
    } else {
        Titanium.App.fireEvent('StatusNet.newnotice.photo', {
            source: source,
            callbackEvent: 'StatusNet.newnotice.photoReceived'
        });
    }
};

StatusNet.NewNoticeView.prototype.addAttachment = function(media) {
    this.attachment = media;
    var size = (StatusNet.Platform.isApple() ? media.size : media.length);
    StatusNet.debug('SIZE IS: ' + size);
    var msg = Math.round(size / 1024) + ' KB';
    this.attachInfo.text = msg;
    StatusNet.debug('QQQ: ' + msg);
    return;


    var media = event.media; // TiBlob
    /*
    StatusNet.debug('media.width = ' + media.width);
    StatusNet.debug('media.height = ' + media.height);
    StatusNet.debug('media.mediaType = ' + media.mediaType);
    StatusNet.debug('media.mimeType = ' + media.mimeType);
    StatusNet.debug('media.length = ' + media.length);
    StatusNet.debug('media.size = ' + media.size);
    */

    // Width and height are passed on the event on Android,
    // but on the media blob on iPhone. Worse still, on Android
    // the blob has width/height properties which return 0.
    //var width = (media.width) ? media.width : event.width;
    //var height = (media.height) ? media.height : event.height;
    var width = (event.width) ? event.width : media.width;
    var height = (event.height) ? event.height : media.height;

    // Scale images down to this maximum width.
    // @fixme resizing has some issues at the moment
    if (StatusNet.Platform.isApple()) {
        var maxSide = 800;
        var out = this.resizePhoto(media, width, height, maxSide);
        media = out.media;
        width = out.width;
        height = out.height;
    }

    /*
    StatusNet.debug('media.width = ' + media.width);
    StatusNet.debug('media.height = ' + media.height);
    StatusNet.debug('media.mediaType = ' + media.mediaType);
    StatusNet.debug('media.mimeType = ' + media.mimeType);
    StatusNet.debug('media.length = ' + media.length);
    StatusNet.debug('media.size = ' + media.size);
    */

    // iPhone doesn't report back the new image type, but it's JPEG.
    var type = (media.mimeType ? media.mimeType : 'image/jpeg');
    var msg = width + 'x' + height + ' ' + this.niceType(type);

    this.attachment = media;
    this.attachInfo.text = msg;
    StatusNet.debug('QQQ: ' + msg);
};

/**
 * Resize (if necessary) a photo to fit within the given size constraint.
 *
 * @param media Titanium.Blob
 * @param width
 * @param height
 * @param max longest side to resize to
 *
 * @return object dictionary with width, height, and media containing a Titanium.Blob
 *
 * @access private
 */
StatusNet.NewNoticeView.prototype.resizePhoto = function(media, width, height, max) {
    StatusNet.debug("Source image is " + width + "x" + height);

    var orig = {media: media, width: width, height: height};
    if (StatusNet.Platform.isAndroid()) {
        // Our resizing gimmick doesn't 100% work on Android yet.
        // We end up with a PNG, and/or a spew of error messages
        // about failed type conversions.
        //
        // Note that on iPhone we resize ok, but we have no way to
        // specify the JPEG quality level and end up with a larger
        // file than necessary.
        return orig;
    }

    var targetWidth = width;
    var targetHeight = height;
    if (width > height) {
        if (width > max) {
            targetWidth = max;
            targetHeight = Math.round(height * max / width);
        } else {
            return orig;
        }
    } else {
        if (height > max) {
            targetHeight = max;
            targetWidth = Math.round(width * max / height);
        } else {
            return orig;
        }
    }

    StatusNet.debug("Resizing image from " + width + "x" + height +
                    " to " + targetWidth + "x" + targetHeight);
    // Resize through an intermediary imageView
    StatusNet.debug("QQQQQQQQQQQ 0");
    var imageView = Titanium.UI.createImageView({
        width: targetWidth,
        height: targetHeight,
        image: media
    });
    StatusNet.debug("QQQQQQQQQQQ A");

    // Ye horrible hack!
    // on Android, the image conversion esplodes.
    // Try inserting it so it's live...
    if (StatusNet.Platform.isAndroid()) {
        this.window.add(imageView);
    }
    StatusNet.debug("QQQQQQQQQQQ B");
    var converted = imageView.toImage();
    StatusNet.debug("QQQQQQQQQQQ C");
    if (StatusNet.Platform.isAndroid()) {
        this.window.remove(imageView);
    }

    // Then to add insult to injury, on Android it doesn't give us
    // a TiBlob directly, but rather an event object similar to when
    // we fetch directly from the camera. Yeah, doesn't make sense
    // to me either.
    StatusNet.debug("QQQQQQQQQQQ D");
    if (typeof converted.media == "object") {
        StatusNet.debug("QQQQQQQQQQQ E1");
        return {
            media: converted.media,
            width: converted.width,
            height: converted.height
        };
    } else {
        StatusNet.debug("QQQQQQQQQQQ E2");
        return {
            media: converted,
            width: converted.width,
            height: converted.height
        };
    }
}

/**
 * Clear the current attachment from the form.
 *
 * @access private
 */
StatusNet.NewNoticeView.prototype.removeAttachment = function()
{
    this.attachment = null;
    this.attachInfo.text = '';
}

/**
 * Give a nice legible file type name for given mime type.
 *
 * @param string type
 * @return string
 * @access private
 */
StatusNet.NewNoticeView.prototype.niceType = function(type)
{
    // @fixme for video support in future, add some more types
    var map = {'image/jpeg': 'JPEG',
               'image/png': 'PNG'};
    if (map[type]) {
        return map[type];
    } else {
        return type;
    }
}

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

    this.actInd.show();

    StatusNet.debug("Sending these post parameters: " + params);

    this.account.apiPost(method, params,
        function(status, response) {
            var id = $(response).find('status > id').text()
            if (id) {
                StatusNet.debug("Posted notice " + id);
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
            that.window.close();
        }
    );
}
