/**
 * StatusNet Mobile
 *
 * Copyright 2010 StatusNet, Inc.
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

// This is a heavyweight-window-context script to handle camera callbacks
// which aren't making it back to our main context like all other event
// handlers do.
//
// Upstream bug: https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/1595-openphotogallery-showcamera-callbacks-fail-when-showing-modal-window-on-android

var tmpFile = null;

Titanium.App.addEventListener('StatusNet.newnotice.photo', function(e) {
    var source = e.source;
    var callbackEvent = e.callbackEvent;

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
            // Ok so here's the deal. We can't actually pass the
            // live image object back to the calling context, so
            // we need to save it to a temporary file and pass
            // the filename back. Kinda ugly, but it'll do.
            var media = event.media;

            Titanium.API.info('AAA: media.size: ' + media.size);
            Titanium.API.info('AAA: media.length: ' + media.length);

            // Temporary file will be deleted when deallocated,
            // so we're sticking it in a global in this context;
            // it should be deleted when the window closes, or
            // we fetch up another file.
            tmpFile = Titanium.Filesystem.createTempFile();
            Titanium.API.info('AAA: tmpFile: ' + tmpFile);

            // Warning: this fails on Android prior to commit f2eca06
            //          in Titanium Mobile 1.5 dev due to a bridging bug.
            //          Thanks to Marshall for fixing it!
            // Warning: File.write returns false on iPhone, contrary to docs.
            var ok = tmpFile.write(media);
            Titanium.API.info('ok: ' + ok);

            var filename = tmpFile.nativePath;
            Titanium.API.info('filename: ' + filename);

            Titanium.App.fireEvent(callbackEvent, {
                status: 'success',
                filename: filename
            });
        },
        cancel: function() {
            Titanium.App.fireEvent(callbackEvent, {
                status: 'cancel'
            });
        },
        error: function(event) {
            Titanium.App.fireEvent(callbackEvent, {
                status: 'error',
                msg: event.msg
            });
        },
        autohide: true,
        animated: true
    });
});
