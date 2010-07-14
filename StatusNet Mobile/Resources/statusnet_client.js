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
 * Constructor for UI manager class for the client.
 *
 * @param StatusNet.Account _account
 * @return StatusNet.Client object
 */
StatusNet.Client = function(_account) {

    this.account = _account;

    this.init();

    /*
    this._timeline = "friends_timeline"; // which timeline are we currently showing?

    this.switchTimeline('friends');
    */
};

StatusNet.Client.prototype.setActiveTab = function(tabName) {
    this.tabGroup.setActiveTab(this.tabs[tabName]);
};


/**
 * Switch the view to a specified timeline
 *
 * @param String timeline   the timeline to show
 */
StatusNet.Client.prototype.switchTimeline = function(timeline) {

    StatusNet.debug("StatusNet.Client.prototype.switchTimeline()");

    this._timeline = timeline;

    this.setActiveTab(timeline);

    /*
    // should happen in response to open event?
    this.view.showHeader();
    this.view.showSpinner();
    this.timeline.update();
    */

    StatusNet.debug("StatusNet.Client.prototype.switchTimeline() DONE");

};

/**
 * Switch the user timeline based on the ID of the user. This only
 * works for local users.  Remote user timeline open in a browser.
 *
 * @param int authorId ID of the (local site) user to display
 */
StatusNet.Client.prototype.switchUserTimeline = function(authorId) {

    StatusNet.debug("in switchUserTimeline()");

    this.view = new StatusNet.TimelineViewUser(this);

    var timeline = 'user';

    if (authorId === null) {
        StatusNet.debug("authorId is null");
        this.timeline = new StatusNet.TimelineUser(this, null);
    } else {
        StatusNet.debug("authorID is " + authorId);
        timeline = 'user' + '-' + authorId;
        this.timeline = new StatusNet.TimelineUser(this, authorId);
    }

    this._timeline = timeline;
    StatusNet.Sidebar.setSelectedTimeline(timeline);

    this.view.showSpinner();
    this.timeline.update();
    this.view.showHeader();
};

/**
 * Reload timeline notices
 */
StatusNet.Client.prototype.refresh = function() {
    this.timeline.update();
};

/**
 * General initialization stuff
 */
StatusNet.Client.prototype.init = function() {
    var tabGroup = Titanium.UI.createTabGroup();

    var window = Titanium.UI.createWindow({
        title: 'Accounts',
        tabBarHidden: true
    });
    var tab = Titanium.UI.createTab({
        icon: 'images/tabs/settings.png',
        title: 'Accounts',
        window: window
    });

    tabGroup.addTab(tab);
    tabGroup.open();

    var client = this;
    window.addEventListener('open', function() {
        StatusNet.debug("Open main tab");
        client.view = new StatusNet.SettingsView(client);
        client.view.window = window;
        client.view.init();
    });

    Titanium.Gesture.addEventListener('shake', function(event) {
        StatusNet.debug("Shaken, not stirred.");
        if (client.timeline) {
            StatusNet.debug("Triggering update for shake gesture...");
            client.timeline.update(function() {
                StatusNet.debug("Updated, gonna show:");
                client.view.show();
                StatusNet.debug("Updated and done showing.");
            });
            StatusNet.debug("Started an update, waiting...");
        }
        StatusNet.debug("Done checking out the shake.");
    });
};

StatusNet.Client.prototype.initAccountView = function(acct) {
    StatusNet.debug('initAccountView entered...');
    this.account = acct;

    // For now let's stick with the same tabs we have on the desktop sidebar
    // @todo localization
    var tabInfo = {'public':    {title: 'Public',
                              timeline: StatusNet.TimelinePublic,
                                  view: StatusNet.TimelineViewPublic},
                    friends:    {title: 'Personal',
                              timeline: StatusNet.TimelineFriends,
                                  view: StatusNet.TimelineViewFriends},
                    profile:    {title: 'Profile',
                              timeline: StatusNet.TimelineUser,
                                  view: StatusNet.TimelineViewUser},
                   mentions:    {title: 'Replies',
                              timeline: StatusNet.TimelineMentions,
                                  view: StatusNet.TimelineViewMentions},
                  favorites:    {title: 'Favorites',
                              timeline: StatusNet.TimelineFavorites,
                                  view: StatusNet.TimelineViewFavorites},
                      inbox:    {title: 'Inbox',
                              timeline: StatusNet.TimelineInbox,
                                  view: StatusNet.TimelineViewInbox}/*,
                     search:    {title: 'Search',
                              timeline: StatusNet.TimelineSearch,
                                  view: StatusNet.TimelineViewSearch}*/};

    StatusNet.debug('initAccountView made a big list.');
    this.tabs = {};
    this.windows = {};
    this.tabGroup = Titanium.UI.createTabGroup();
    StatusNet.debug('initAccountView created a tab group.');

    StatusNet.debug('initAccountView Starting building tabs, timelines, views...');
    for (var tab in tabInfo) {
        if (tabInfo.hasOwnProperty(tab)) {
            this.createTab(tab, tabInfo[tab]);
        }
    }
    StatusNet.debug('initAccountView Done building tabs, timelines, views.');

    // @todo remember last-used tab
    StatusNet.debug('initAccountView friends tab is: ' + this.tabs.friends);
    this.tabGroup.setActiveTab(this.tabs.friends);
    this.tabGroup.open();

    /*
    var that = this;
    this.timeline.update(
        function() {
            StatusNet.debug('initAccountView post-update START');
            that.view.showHeader();
            StatusNet.debug('initAccountView post-update shown header');
            that.view.show();
            StatusNet.debug('initAccountView post-update DONE');
        },
        false
    );
    */

    StatusNet.debug('initAccountView done.');
};

/**
 * Build an individual tab for the user interface and set up its
 * associated view and timeline, if applicable.
 *
 * @param string tab identifier
 * @param object info associative array with name and related classes
 *
 * @access private
 */
StatusNet.Client.prototype.createTab = function(tab, info) {
    StatusNet.debug('tab: ' + tab);
    StatusNet.debug('info: ' + info);

    var window = Titanium.UI.createWindow({
        title: info.title//,
        //tabBarHidden: true
    });
    this.windows[tab] = window;

    this.tabs[tab] = Titanium.UI.createTab({
        icon: 'images/tabs/' + tab + '.png',
        title: info.title,
        window: window
    });
    this.tabGroup.addTab(this.tabs[tab]);

    //window.StatusNet = StatusNet;
    //window.client = this;
    //window.timeline = tab;
    var client = this;
    window.addEventListener('open', function() {
        StatusNet.debug("Open tab: " + tab);
        if (info.timeline) {
            StatusNet.debug('timeline tab? updating timeline...');
            StatusNet.debug(info.timeline);
            client.timeline = new info.timeline(client);
            
            StatusNet.debug('Creating the view...');
            client.view = new info.view(client);
            client.view.window = window;
            StatusNet.debug('telling the view to show...');
            client.view.show();

            StatusNet.debug('Telling timeline to update:');
            client.timeline.update(function() {
                client.timeline.noticeAdded.attach(
                    function(args) {
                        if (args.notifications) {
                            client.view.notifyNewNotice(args.notice);
                        } else {
                            StatusNet.debug("noticeAdded event with no args!");
                        }
                    },
                    false
                );
            });
            StatusNet.debug('timeline updated.');
        } else {
            StatusNet.debug('settings tab? showing view...');
            // Settings dialog
            client.timeline = null;
            client.view = new info.view(client);
            client.view.window = window;
            client.view.init();
            StatusNet.debug('settings shown.');
        }
    });
};

/**
 * Show notice input dialog
 */
StatusNet.Client.prototype.newNoticeDialog = function(replyToId, replyToUsername) {
    var win = Titanium.UI.getCurrentWindow().createWindow({
        url: 'app:///new_notice.html',
        title: 'New notice',
        width: 420,
        height: 120});

    // Pass the reply-to info in via the window itself.
    // XXX: Is there a better way?

    if (replyToId) {
        win.setTitle('Replying to ' + replyToUsername);
        win.replyToId = replyToId;
        win.replyToUsername = replyToUsername;
    }

    var that = this;

    win.addEventListener(Titanium.CLOSE, function(event) {
        that.view.showHeader();
        that.view.showSpinner();
        that.timeline.update();
    });

    win.open();
};
