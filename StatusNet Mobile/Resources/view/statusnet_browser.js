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

/**
 * View class for the in-app browser for iPhone.
 * Todo: on iPad, be able to run this within a split view!
 * Todo more: work also on Android so can be used in tablet mode
 */
StatusNet.Browser = function(client) {
    this.client = client;

    // The window!
    // We're not using fully native toolbar/navbar so this can be
    // extended to Android tablets in future.
    var window = this.window = Ti.UI.createWindow({
       backgroundColor: 'white'
    });

    // Top navbar: app navigation controls
    // @fixme use a more proper back button
    var navbar = this.navbar = StatusNet.Platform.createNavBar(window, 'Loading...');
    var closeButton = this.closeButton = Ti.UI.createButton({
        title: "Close"
    });
    var share = this.share = Ti.UI.createButton({
        systemButton: Titanium.UI.iPhone.SystemButton.COMPOSE
    });
    navbar.setLeftNavButton(closeButton);
    navbar.setRightNavButton(share);

    // Bottom toolbar: web navigation controls
    var back = this.back = Ti.UI.createButton({
        systemButton: Titanium.UI.iPhone.SystemButton.REWIND // @fixme use a real icon
    });
    var forward = this.forward = Ti.UI.createButton({
        systemButton: Titanium.UI.iPhone.SystemButton.FAST_FORWARD // @fixme use a real icon
    });
    var reload = this.reload = Ti.UI.createButton({
        systemButton: Titanium.UI.iPhone.SystemButton.RELOAD
    });
    var open = this.open = Ti.UI.createButton({
        systemButton: Titanium.UI.iPhone.SystemButton.ACTION
    });
    var spacer = Titanium.UI.createButton({
        systemButton: Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
    });
    var toolbar = this.toolbar = Ti.UI.createToolbar({
        left: 0,
        right: 0,
        bottom: 0,
        height: 44,
        barColor: '#444',
        items: [back, forward, spacer, reload, open]
    });
    window.add(toolbar);

    // The webview
    var webview = this.webview = Ti.UI.createWebView({
        top: navbar.height,
        bottom: toolbar.height,
        left: 0,
        right: 0
    });
    window.add(webview);



    // Setup funcs for top navbar...
    closeButton.addEventListener('click', function() {
        window.close();
    });
    share.addEventListener('click', function() {
        client.newNoticeDialog(null, null, webview.url);
    });

    // Setup funcs for bottom toolbar...
    back.addEventListener('click', function() {
        webview.goBack();
    });
    forward.addEventListener('click', function() {
        webview.goForward();
    });
    reload.addEventListener('click', function() {
        webview.reload();
    });
    open.addEventListener('click', function() {
        var url = webview.url;
        var options = ['Open in Safari', 'Post link', 'Cancel'];
        var dialog = Ti.UI.createOptionDialog({
            title: url,
            options: options,
            cancel: options.length - 1
        });
        dialog.addEventListener('click', function(event) {
            if (event.index == 0) {
                // Open in Safari
                Titanium.Platform.openURL(url);
            } else if (event.index == 1) {
                // Post link
                share.fireEvent('click');
            } else if (event.index == 2) {
                // Cancel
            }
        });
        dialog.show();
    });
};

/**
 * Open the browser with a given URL!
 */
StatusNet.Browser.prototype.init = function(url) {
    StatusNet.debug('StatusNet.Browser.init: ' + url);

    this.webview.url = url;
    // @todo a slide transition may be best here
    this.window.open();
};
