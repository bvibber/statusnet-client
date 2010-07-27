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
            that.show();

			StatusNet.debug("TimelineView checking for total number of notices")
		    var notices = that.client.timeline.getNotices();
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
                StatusNet.debug("FIXME: implement TimelineView.showNewNotice");
                //that.showNewNotice(args.notice);
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

	this.act = Titanium.UI.createActivityIndicator();
	this.act.style = Titanium.UI.iPhone.ActivityIndicatorStyle.PLAIN;
	this.act.font = {fontFamily:'Helvetica Neue', fontSize:15,fontWeight:'bold'};
	this.act.color = 'white';
	this.act.message = 'Loading...';

	StatusNet.debug("TimelineView: Finished adding activity indicator");
};

/**
 * Render the HTML display of a given timeline
 *
 */
StatusNet.TimelineView.prototype.show = function() {
    var that = this;

    if (!this.webview) {
        var navbar = StatusNet.Platform.createNavBar(this.window);

        // @fixme make this show account info
        var accountsButton = Titanium.UI.createButton({
            title: "Accounts"
        });
        accountsButton.addEventListener('click', function() {
            StatusNet.showSettings();
        });
        navbar.setLeftNavButton(accountsButton);

        var updateButton = Titanium.UI.createButton({
            title: "New",
            systemButton: Titanium.UI.iPhone.SystemButton.COMPOSE
        });
        updateButton.addEventListener('click', function() {
            that.client.newNoticeDialog();
        });
        navbar.setRightNavButton(updateButton);

        this.webview = Titanium.UI.createWebView({
            top: navbar.height,
            left: 0,
            right: 0,
            bottom: 0,
            scalesPageToFit: false,
            url: "timeline.html",
            backgroundColor: 'black'
        });

        this.window.add(this.webview);
    }

    var notices = this.client.timeline.getNotices();

    // clear old notices
    // @todo be a little nicer; no need to clear if we just changed one thing
    //Titanium.App.fireEvent('updateTimeline', {html: '<p>Loading...</p>'});
    this.clearTimelineView();

    if (notices.length > 0) {
    StatusNet.debug("TimelineView.show G: " + notices.length + " notice(s)");
        for (i = 0; i < notices.length; i++) {
            this.appendTimelineNotice(notices[i]);
        }
    }

    this.hideSpinner();
};

StatusNet.TimelineView.prototype.clearTimelineView = function(html) {
    if (!html) html = '';
    Titanium.App.fireEvent('StatusNet_setTimeline', {
        html: html,
        clientAccountUsername: clientAccountUsername
    });
}

StatusNet.TimelineView.prototype.appendTimelineNotice = function(notice) {
    Titanium.App.fireEvent('StatusNet_appendTimelineNotice', {notice: notice});
}

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
    //$("#header").html("<h1></h1>");
    //$("#header h1").text(title);
};

/**
 * Show wait cursor
 */
StatusNet.TimelineView.prototype.showSpinner = function() {
    StatusNet.debug("showSpinner");
	this.window.setToolbar([this.act],{animated:true});
	this.act.show();
};

/**
 * Hide wait cursor
 */
StatusNet.TimelineView.prototype.hideSpinner = function() {
    StatusNet.debug("hideSpinner");
	this.act.hide();
	this.window.setToolbar(null,{animated:true});
};

/**
 * Constructor for a view for a friends timeline
 */
StatusNet.TimelineViewFriends = function(client) {
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
