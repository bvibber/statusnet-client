/**
 * Constructor for UI manager class for the client.
 *
 * @param StatusNet.Account _account
 * @return StatusNet.Client object
 */
StatusNet.Client = function(_account) {

    this.account = _account;

    this.init();

    this._timeline = "friends_timeline"; // which timeline are we currently showing?

    this.switchTimeline('friends');

}

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

}

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
}

/**
 * Reload timeline notices
 */
StatusNet.Client.prototype.refresh = function() {
    this.timeline.update();
}

/**
 * General initialization stuff
 */
StatusNet.Client.prototype.init = function() {
/*
    var that = this;

    this.server = this.account.apiroot.substr(0, this.account.apiroot.length - 4); // hack for now

    var gar = $('#public_img').attr('src', this.account.siteLogo);

    // Add event handlers for buttons

    $('#public_img').bind('click', function() { that.switchTimeline('public') });
    $('#friends_img').bind('click', function() { that.switchTimeline('friends') });
    $('#user_img').bind('click', function() { that.switchTimeline('user') });
    $('#mentions_img').bind('click', function() { that.switchTimeline('mentions') });
    $('#favorites_img').bind('click', function() { that.switchTimeline('favorites') });
    $('#inbox_img').bind('click', function() { that.switchTimeline('inbox') });
    $('#search_img').bind('click', function() { that.switchTimeline('search') });
    $('#settings_img').bind('click', function() { StatusNet.showSettings() });

    // until we have private message timelines working
    var inbox = this.server + this.account.username + '/inbox';
    $('ul.nav li#nav_timeline_inbox > a').attr('href', inbox);

    // until we have built-in search working
    var search = this.server + 'search/notice';
    $('ul.nav li#nav_timeline_search > a').attr('href', search);

    // refresh timeline when window is clicked
    //$("#content").bind('click', function() { that.refresh(); });

    // make links open in an external browser window
    $('a[rel=external]').live('click', function() {
        Titanium.Desktop.openURL($(this).attr('href'));
        return false;
    });

    $('#new_notice').click(function() { that.newNoticeDialog(); });
*/
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
                                  view: StatusNet.TimelineViewInbox},
                     search:    {title: 'Search',
                              timeline: StatusNet.TimelineSearch,
                                  view: StatusNet.TimelineViewSearch},
                   settings:    {title: 'Settings',
                              timeline: null,
                                  view: StatusNet.SettingsView}};

    this.tabs = {};
    this.windows = {};
    this.tabGroup = Titanium.UI.createTabGroup();

    StatusNet.debug('Starting building tabs, timelines, views...');
    for (var tab in tabInfo) {
        this.createTab(tab, tabInfo[tab]);
    }
    StatusNet.debug('Done building tabs, timelines, views.');

    // @todo remember last-used tab
    this.tabGroup.setActiveTab(this.tabs['friends']);
    this.tabGroup.open();
}

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
        url: 'tab.js',
        title: info.title
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
        client.view = new info.view(client);
        client.view.window = window;
        if (info.timeline) {
            StatusNet.debug('timeline tab? updating timeline...');
            client.timeline = new info.timeline(client);
            client.timeline.update();
        } else {
            StatusNet.debug('settings tab? showing view...');
            // Settings dialog
            client.timeline = null;
            client.view.init();
        }
    });
}

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
}
