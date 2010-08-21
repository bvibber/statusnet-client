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
 * Base class for Timeline view
 *
 * @param StatusNet.Client client  The controller
 */
StatusNet.TimelineView = function(client) {
    StatusNet.debug("in StatusNet.TimelineView");
    this.client = client;
    this.title = "Timeline on {site}";

    StatusNet.debug("TimelineView constructor");
    // XXX: Woah, it doesn't work to pass the timeline into the constructor!
    if (client) {
        this.timeline = client.timeline;
    }

    var that = this;

    // Attach event listeners

    StatusNet.debug("TimelineView constructor - attaching events");

    this.timeline.updateStart.attach(
        function() {
            StatusNet.debug("TimelineView got updateStart event!");
            that.showSpinner();
            StatusNet.debug("TimelineView updateStart DONE");
        }
    );

    StatusNet.debug("TimelineView constructor - finished attaching updateStart");

    this.timeline.updateFinished.attach(
        function(args) {
            StatusNet.debug("TimelineView got updateFinished event!");
            that.hideSpinner();
            StatusNet.debug("TimelineView showing:");
            //that.show();

            StatusNet.debug("TimelineView checking for total number of notices")
            /*var notices = that.client.timeline.getNotices();*/
            var notices = that.client.timeline._notices;
            if (notices.length == 0) {
                StatusNet.debug("TimelineView: no notices found");
                that.clearTimelineView({title: 'No notices in this timeline yet.'});
            }
            StatusNet.debug("TimelineView - there are " + notices.length + " notices in timeline");
            StatusNet.debug("TimelineView updateFinished DONE");
        }
    );

    this.timeline.noticeAdded.attach(
        function(args) {
            StatusNet.debug("TimelineView got noticeAdded event!");
            if (args) {
                that.appendTimelineNotice(args.notice);
            } else {
                StatusNet.debug("noticeAdded event with no args!");
            }
            StatusNet.debug("TimelineView noticeAdded DONE");
        }
    );

};

/**
 * Additional initialization stuff that can't be done in the constructor
 */
StatusNet.TimelineView.prototype.init = function() {
    StatusNet.debug("TimelineView init");

    StatusNet.debug("TimelineView: adding adding activity indicator -- spinner");

    /*
    if (StatusNet.Platform.isApple()) {
        this.act = Titanium.UI.createActivityIndicator();
        this.act.style = Titanium.UI.iPhone.ActivityIndicatorStyle.PLAIN;
        this.act.font = {fontFamily:'Helvetica Neue', fontSize:15,fontWeight:'bold'};
        this.act.color = 'white';
        this.act.message = 'Loading...';
    } else {
    */
        this.act = Titanium.UI.createView({
            bottom: 49, // just above the emulated tab list...?
            left: 0,
            right: 0,
            height: 32,
        });

        // Give it a smokey shadow!
        this.act.add(Titanium.UI.createView({
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'black',
            opacity: 0.5
        }));

        // And a label...
        this.act.add(Titanium.UI.createLabel({
            left: 32,
            right: 8,
            top: 4,
            bottom: 4,
            text: "Loading...",
            color: "white"
        }));

        // And a spinner!
        this.act.add(Titanium.UI.createImageView({
            left: 8,
            top: 8,
            width: 16,
            height: 16,
            image: 'images/loading.gif'
        }));
        this.client.mainwin.add(this.act);
        this.act.hide();
    //}

    StatusNet.debug("TimelineView: Finished adding activity indicator");

};

/**
 * Render the HTML display of a given timeline
 *
 */
StatusNet.TimelineView.prototype.show = function() {

    this.showHeader();
    this.clearTimelineView();
    this.client.timeline.loadCachedNotices();

    // Err?
    this.hideSpinner();
};

StatusNet.TimelineView.prototype.clearTimelineView = function(html) {
    if (!html) html = '';
    Titanium.App.fireEvent('StatusNet_setTimeline', {
        html: html,
        clientAccountUsername: this.client.account.username
    });
};

StatusNet.TimelineView.prototype.appendTimelineNotice = function(notice) {
    
    // XXX Mobile SDK differences alert! Android platform doesn't seem to
    // return any kind of useable application data directory that can 
    // used for caching, so we'll only cache avatars on iPhone for now.
    
    if (StatusNet.Platform.isAndroid()) {
    
        StatusNet.debug("TimelineView.appendTimelineNotice - checking for cached version of avatar: " + notice.avatar);
    
        var cachedAvatar = this.client.getActiveTimeline().lookupAvatar(notice.avatar);

        if (cachedAvatar) {
            notice.cachedAvatar = cachedAvatar;
        }
    }
    
    Titanium.App.fireEvent('StatusNet_appendTimelineNotice', {notice: notice});
};

StatusNet.TimelineView.prototype.notifyNewNotice = function(notice) {
    StatusNet.debug('Stubbed TimelineView.notifyNewNotice');
/*
    if (!StatusNet.Platform.nativeNotifications()) {
        return;
    }

    if (this.client.account.username === notice.author) {
        return;
    }

    var msg;

    if (notice.atomSource) {
        msg = "New notice from " + notice.atomSource;
    } else {
        msg = "New notice from " + notice.author;
    }

    var notification = Titanium.Notification.createNotification(Titanium.UI.getMainWindow());
    notification.setTitle(msg);
    notification.setMessage(notice.title);

    notification.setIcon("app://logo.png");
    notification.setDelay(5000);
    notification.setCallback(function () {
    // @todo Bring the app window back to focus / on top
        StatusNet.debug("i've been clicked");
    });
    notification.show();
*/
}

/**
 * Determines whether the notice is local (by permalink)
 *
 * @param String uri the uri of the notice
 *
 * @return boolean value
 */
StatusNet.TimelineView.prototype.localAuthor = function(uri) {

    if (uri.substring(0, this.client.server.length) === this.client.server) {
        return true;
    }
    return false;
};

/**
 * Set up anything that should go in the header section...
 */
StatusNet.TimelineView.prototype.showHeader = function () {
    var title = this.title.replace("{name}", this.client.account.username)
                           .replace("{site}", this.client.account.getHost());

    this.client.setMainWindowTitle(title);

    //$("#header").html("<h1></h1>");
    //$("#header h1").text(title);
};

/**
 * Show wait cursor
 */
StatusNet.TimelineView.prototype.showSpinner = function() {
    StatusNet.debug("showSpinner");
    if (StatusNet.Platform.isApple()) {
        this.client.mainwin.setToolbar([this.act],{animated:true});
    }
    this.act.show();
};

/**
 * Hide wait cursor
 */
StatusNet.TimelineView.prototype.hideSpinner = function() {
    StatusNet.debug("hideSpinner");
    this.act.hide();
    if (StatusNet.Platform.isApple()) {
        this.client.mainwin.setToolbar(null,{animated:true});
    }
};

/**
 * Show this if the timeline is empty
 */
StatusNet.TimelineView.prototype.showEmptyTimeline = function() {
    StatusNet.debug('TimelineView.showEmptyTimeline - firing StatusNet_showEmptyTimelineMsg');
    Titanium.App.fireEvent('StatusNet_showEmptyTimelineMsg');
};

/**
 * Show a confirm dialog
 *
 * XXX: I probably made this too complicated
 *
 * @param string    msg             the msg to display
 * @param function  onConfirm       what to do if the user confirms
 * @param function  onCanceldo      this if the user cancels
 * @param string    confirmTitle    title of the confirm button
 * @param string    cancelTitle     title of the cancel button
 */
StatusNet.TimelineView.prototype.showConfirmDialog = function(msg, onConfirm, onCancel, confirmTitle, cancelTitle)
{
    if (!confirmTitle) {
        confirmTitle = 'Yes';
    }

    if (!cancelTitle) {
        cancelTitle = 'No';
    }

    var confirmDialog = Titanium.UI.createOptionDialog({
        options: [confirmTitle, cancelTitle],
        destructive: 0,
        cancel: 1
    });

    if (msg) {
        confirmDialog.title = msg;
    }

    confirmDialog.addEventListener('click', function(e)
    {
        if (e.index == 0) {
            if (onConfirm) {
                onConfirm();
            }
        } else {
            if (onCancel) {
                onCancel();
            }
        }
    });

    confirmDialog.show();
};

/**
 * Constructor for a view for a friends timeline
 */
StatusNet.TimelineViewFriends = function(client) {
    StatusNet.debug("StatusNet.TimelineViewFriends - constructor");
    StatusNet.TimelineView.call(this, client);
    this.title = "{name} and friends on {site}";
    this.tab = 'friends';
};

// Make StatusNet.TimelineViewFriends inherit TimelineView's prototype
StatusNet.TimelineViewFriends.prototype = heir(StatusNet.TimelineView.prototype);


/**
 * Constructor for a view for mentions timeline
 */
StatusNet.TimelineViewMentions = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "{name} and friends on {site}";
    this.tab = 'mentions';
};

// Make StatusNet.TimelineViewMentions inherit TimelineView's prototype
StatusNet.TimelineViewMentions.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Constructor for a view for public timeline
 */
StatusNet.TimelineViewPublic = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "Public timeline on {site}";
    this.tab = 'public';
};

// Make StatusNet.TimelineViewPublic inherit TimelineView's prototype
StatusNet.TimelineViewPublic.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Constructor for a view for favorites timeline
 */
StatusNet.TimelineViewFavorites = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "{name}'s favorite notices on {site}";
    this.tab = 'favorites';
};

// Make StatusNet.TimelineViewFavorites inherit TimelineView's prototype
StatusNet.TimelineViewFavorites.prototype = heir(StatusNet.TimelineView.prototype);


/**
 * Constructor for a view for inbox timeline
 */
StatusNet.TimelineViewInbox = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "Inbox for {name} on {site}";
    this.tab = 'inbox';
};

// Make StatusNet.TimelineViewInbox inherit TimelineView's prototype
StatusNet.TimelineViewInbox.prototype = heir(StatusNet.TimelineView.prototype);


/**
 * Constructor for a view for search timeline
 * @fixme this guy'll need an input box!
 */
StatusNet.TimelineViewSearch = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "Text search on {site}";
    this.tab = 'search';
};

// Make StatusNet.TimelineViewSearch inherit TimelineView's prototype
StatusNet.TimelineViewSearch.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Set up the search box.
 */
StatusNet.TimelineViewSearch.prototype.showHeader = function () {
    StatusNet.TimelineView.prototype.showHeader.call(this);
    /*
    $("#header").append('<div id="search-box">' +
                        '<label for="search">Search:</label> ' +
                        '<input id="search">' +
                        '</div>');
    var timeline = this.client.timeline;
    var q = timeline.searchTerm();
    $("#search").val(q)
                .change(function() {
        timeline.updateSearch($(this).val());
    });
    */
};
