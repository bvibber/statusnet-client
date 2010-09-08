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
    this.onClose = new StatusNet.Event();
}

/**
 * Initialize the window -- add @-reply text if necessary
 */
StatusNet.NewNoticeView.prototype.init = function() {
    // post a new notice
    StatusNet.debug("NewNoticeView.init");
    var that = this;
    var data = this.data;

    var margin = StatusNet.Platform.isAndroid() ? 4 : 0;
    var controlStripHeight = 32;
    var topMargin = 0;
    var keyboardMargin = 0;

    var window;
    if (StatusNet.Platform.isTablet()) {
        // Crappy hack for iPad, since native form sheet isn't working for
        // us right now for some reason; comes up fullscreen. It's ok in
        // isolation though, will need to find a minimal test case.

        // Add a transparent window to darken the background...
        // this won't animate along with the rest.
        var glassy = Titanium.UI.createWindow({
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'black',
            opacity: 0.5,
            navBarHidden: true
        });
        glassy.open();

        // Now the main window, which will animate up...
        this.window = Titanium.UI.createWindow({
           navBarHidden: false
        });
        this.window.addEventListener('close', function() {
            glassy.close();
        });

        // And a fake window as a view within that of the proper
        // size for a form sheet.
        window = Titanium.UI.createView({
           title: 'New Notice',
           width: 620,
           height: 540,
           backgroundColor: StatusNet.Platform.dialogBackground()
        });
        if (Ti.Platform.displayCaps.platformWidth > Ti.Platform.displayCaps.platformHeight) {
            // Landscape mode? Force to top to give more keyboard space.
            // @fixme detect orientation change and move...
            window.top = 0;
            keyboardMargin = 140;
        } else {
            // Bump it up a little from centered in portrait, but there's room.
            window.top = 120;
        }
        this.window.add(window);
    } else {
        // Nice regular window. :D
        window = this.window = Titanium.UI.createWindow({
            title: 'New Notice',
            backgroundColor: StatusNet.Platform.dialogBackground(),
            // Need to set this value to trigger a heavyweight window... needed
            // to make back button and soft input mode work correctly.
            navBarHidden: false
        });
        if (StatusNet.Platform.isAndroid()) {
            // Needed to work around Android bug with camera/gallery callbacks
            // and heavyweight windows; it won't send the callbacks direct to
            // our main context, so we need to run them from there.
            window.url = 'statusnet_photo_helper.js';
        }
        if (StatusNet.Platform.isApple()) {
            // Currently, iPhone doesn't resize the window or our controls
            // to fit when the on-screen keyboard comes up. To keep it safe,
            // we're hardcoding the current size of one there. Sigh.
            keyboardMargin = 216;
        }
    }
    this.window.addEventListener('close', function() {
        that.onClose.notify();
    });

    var cancelButton = this.cancelButton = Titanium.UI.createButton({
        title: 'Cancel'
    });
    cancelButton.addEventListener('click', function() {
        that.close();
    });

    var sendButton = this.sendButton = Titanium.UI.createButton({
        title: "Send",
        enabled: false // gray it out until there's some text!
    });
    sendButton.addEventListener('click', function() {
        that.postNotice(that.noticeTextArea.value);
    });

    if (StatusNet.Platform.isApple()) {
        // Use iPhone-style navbar (as a toolbar under our management)
        // @fixme drop the duped title if we can figure out why it doesn't come through
        var navbar = StatusNet.Platform.createNavBar(window, 'New Notice');
        sendButton.style = Titanium.UI.iPhone.SystemButtonStyle.DONE;
        navbar.setLeftNavButton(cancelButton);
        navbar.setRightNavButton(sendButton);
        topMargin = navbar.height;
    } else {
        // Make the dialog look more Android-y... Use native title bar,
        // and put the send/cancel buttons at the bottom.
        // @fixme use proper layout manager
        var buttonHeight = 40;
        var buttonBar = Titanium.UI.createView({
            left: 0,
            right: 0,
            bottom: 0,
            height: buttonHeight + margin * 2,
            backgroundColor: '#aaa'
        });
        window.add(buttonBar);

        var screenWidth = Titanium.Platform.displayCaps.platformWidth;
        sendButton.left = margin;
        sendButton.right = (screenWidth + margin) / 2;
        sendButton.top = margin;
        sendButton.bottom = margin;
        buttonBar.add(sendButton);

        cancelButton.left = (screenWidth + margin) / 2;
        cancelButton.right = margin;
        cancelButton.bottom = margin;
        cancelButton.top = margin;
        buttonBar.add(cancelButton);

        keyboardMargin += buttonHeight + margin * 2;
    }

    var noticeTextArea = this.noticeTextArea = Titanium.UI.createTextArea({
        top: topMargin + margin,
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
        var nChars = event.value.length;
        counter.text = "" + (textLimit - nChars);
        // @fixme change color or display when negative
        that.sendButton.enabled = (nChars > 0);
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

    moreButton.addEventListener('click', function() {
        var options = [];
        var callbacks = [];
        var destructive = -1;
        if (that.attachment == null) {

            if (StatusNet.Platform.hasCamera()) {
                options.push('Take photo');
                callbacks.push(function() {
                    that.openAttachment('camera', function() {
                        that.focus();
                    });
                });
            }

            options.push('Photo gallery');
            callbacks.push(function() {
                that.openAttachment('gallery', function() {
                    that.focus();
                });
            });
        } else {
            destructive = options.length;
            options.push('Remove');
            callbacks.push(function() {
                that.removeAttachment();
                that.focus();
            });
        }

        var cancel = options.length;
        options.push('Cancel');
        callbacks.push(function() {
            that.focus();
        });

        var dialog = Titanium.UI.createOptionDialog({
            title: 'Attachment',
            options: options,
            cancel: cancel
        });
        if (destructive > -1) {
            dialog.destructive = destructive;
        }
        dialog.addEventListener('click', function(event) {
            if (event.index !== undefined && callbacks[event.index] !== undefined) {
                callbacks[event.index]();
            }
        });
        dialog.show();
    });
    controlStrip.add(moreButton);

    this.actInd = Titanium.UI.createActivityIndicator();
    this.actInd.message = 'Sending...';

    if (StatusNet.Platform.isApple()) {
        // iPhone specific activity indicator niceties
        this.actInd.style = Titanium.UI.iPhone.ActivityIndicatorStyle.BIG;
    }

    window.add(this.actInd);

    StatusNet.Platform.setInitialFocus(this.window, noticeTextArea);
    StatusNet.Platform.animatedOpen(this.window);

    StatusNet.debug("NewNoticeView.init END");
};

StatusNet.NewNoticeView.prototype.openAttachment = function(source, callback)
{
    if (StatusNet.Platform.isAndroid()) {
        if (!Ti.Filesystem.isExternalStoragePresent) {
            alert('SD card is missing or unmounted. Check card and try again.');
            return;
        }
    }
    var that = this;
    this.getPhoto(source, function(event) {
        if (event.status == 'success') {
            StatusNet.debug('Photo attachment ok!');
            that.addAttachment(event.media);
        } else if (event.status == 'cancel') {
            StatusNet.debug('Photo attachment canceled.');
        } else if (event.status == 'error') {
            StatusNet.debug('Photo attachment failed: ' + event.msg);
            alert('Photo fetch failed: ' + event.msg);
        } else {
            StatusNet.debug('Got unexpected event from photo helper.');
        }
        callback(event);
    });
};

StatusNet.NewNoticeView.prototype.getPhoto = function(source, callback)
{
    if (StatusNet.Platform.isAndroid()) {
        this.getPhotoHack(source, callback);
    } else {
        this.getPhotoNative(source, callback);
    }
}

StatusNet.NewNoticeView.prototype.getPhotoNative = function(source, callback)
{
    var trigger;
    if (source == 'camera') {
        trigger = Titanium.Media.showCamera;
    } else if (source == 'gallery') {
        trigger = Titanium.Media.openPhotoGallery;
    } else {
        Titanium.API.error("Unrecognized camera source. wtf!");
        alert("Bad photo source event. This is a bug!")
    }
    trigger({
        success: function(event) {
            callback({
                status: 'success',
                media: event.media
            });
        },
        cancel: function(event) {
            callback({
                status: 'cancel'
            });
        },
        error: function(event) {
            callback({
                status: 'error',
                media: event.msg
            });
        },
        autohide: true,
        animated: true
    });
};

StatusNet.NewNoticeView.prototype.getPhotoHack = function(source, callback)
{
    // Due to a bug on Android with heavyweight window contexts, we need
    // to run the actual showCamera etc from another context.
    // This sets up the event listeners in our main context to communicate
    // with the window's mini context which only has the camera code.
    var that = this;
    var photoEvent = 'StatusNet.newnotice.photoReceived' + Math.random();
    var photoListener = function(event) {
        Titanium.App.removeEventListener(photoEvent, photoListener);
        if (event.status == 'success') {
            // Read in the temporary file...
            StatusNet.debug('Reading temp file: ' + event.filename);
            var tempFile = Titanium.Filesystem.getFile(event.filename);
            event.media = tempFile.read();
            StatusNet.debug('Media size/length: ' + event.media.length + ' ' + event.media.size);

            // We can't delete the file just yet; it seems that File.read() doesn't
            // actually read data, but returns a special magic blob that's backed
            // by the file, without warning. When the file changes, the blob changes.
            //
            //   WTF?
            //
            // https://appcelerator.lighthouseapp.com/projects/32238/tickets/1735-blob-data-returned-from-fileread-becomes-empty-when-the-file-is-deleted
            that.window.addEventListener('close', function() {
                tempFile.deleteFile();
            });
        }
        callback(event);
    };
    Titanium.App.addEventListener(photoEvent, photoListener);
    Titanium.App.fireEvent('StatusNet.newnotice.photo', {
        source: source,
        callbackEvent: photoEvent
    });
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
    if (Titanium.Network.online == false) {
        alert("No internet connection!");
        return;
    }

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

    that.noticeTextArea.enabled = false;
    that.cancelButton.enabled = false;
    that.sendButton.enabled = false;
    this.actInd.show();

    StatusNet.debug("Sending these post parameters: " + params);

    this.account.apiPost(method, params,
        function(status, response) {
            var id = $(response).find('status > id').text()
            if (id) {
                StatusNet.debug("Posted notice " + id);
            }

            that.actInd.hide();
            // @todo play notice posted sound
            that.close();

            // Tell the client we've got something fun to do!
            that.sent.notify();
        },
        function(status, response, responseText) {
            var msg;
            if (typeof response == "object") {
                msg = $(response).find('error').text();
            } else if (status == "exception") {
                msg = responseText;
            } else {
                msg = 'HTTP ' + status + ' error';
            }
            StatusNet.error("Error posting notice: " + msg);

            that.actInd.hide();
            // In case it didn't take...
            setTimeout(function() {
                that.actInd.hide();
            }, 10);
            that.noticeTextArea.enabled = true;
            that.cancelButton.enabled = true;
            that.sendButton.enabled = true;

            alert("Error posting notice: " + msg);
        }
    );
}

StatusNet.NewNoticeView.prototype.close = function()
{
    this.noticeTextArea.blur(); // close keyboard
    StatusNet.Platform.animatedClose(this.window);
}

StatusNet.NewNoticeView.prototype.focus = function()
{
    this.noticeTextArea.focus(); // open keyboard
}
