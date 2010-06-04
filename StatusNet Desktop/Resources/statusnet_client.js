/**
 * Constructor for UI manager class for the client.
 *
 * @param StatusNet.Account _account
 * @return StatusNet.Client object
 */
StatusNet.Client = function(_account) {

    this.account = _account;

    this.init();

    this.view = new StatusNet.TimelineViewFriends(this);
    this.timeline =  new StatusNet.TimelineFriends(this);

	this.view.showHeader();
    this.view.show();
    this.timeline.update();

    var that = this;

    // @todo: refresh multiple timelines in the background

    this.refresh = setInterval(
        function() {
            StatusNet.debug("Refreshing visible timeline.");
            that.timeline.update(null, true);
        },
        60000
    );
}

/**
 * Switch the view to a specified timeline
 *
 * @param String timeline   the timeline to show
 */
StatusNet.Client.prototype.switchTimeline = function(timeline) {

    StatusNet.debug("StatusNet.Client.prototype.switchTimeline()");

    switch (timeline) {

        case 'public':
            this.view = new StatusNet.TimelineViewPublic(this);
            this.timeline = new StatusNet.TimelinePublic(this);
            break;
        case 'user':
            this.view = new StatusNet.TimelineViewUser(this);
            this.timeline = new StatusNet.TimelineUser(this, null);
            break;
        case "friends":
            this.view = new StatusNet.TimelineViewFriends(this);
            this.timeline = new StatusNet.TimelineFriends(this);
            break;
        case 'mentions':
            this.view = new StatusNet.TimelineViewMentions(this);
            this.timeline = new StatusNet.TimelineMentions(this);
            break;
        case 'favorites':
            this.view = new StatusNet.TimelineViewFavorites(this);
            this.timeline = new StatusNet.TimelineFavorites(this);
            break;
        case 'inbox':
            this.view = new StatusNet.TimelineViewInbox(this);
            this.timeline = new StatusNet.TimelineInbox(this);
            break;
        case 'search':
            this.view = new StatusNet.TimelineViewSearch(this);
            this.timeline = new StatusNet.TimelineSearch(this);
            break;
        default:
            throw new Exception("Gah wrong timeline");
    }

    StatusNet.Sidebar.setSelectedTimeline(timeline);

    var that = this;

    clearInterval(this.refresh);

    this.timeline.update(
        function() {
            that.view.showHeader();
            that.view.show();
        },
        false
    );

    this.refresh = setInterval(
        function() {
            StatusNet.debug("Refreshing visible timeline.");
            that.timeline.update(null, (that.timeline.timeline_name !== 'user'));
        },
        60000
    );
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

    clearInterval(this.refresh);

    StatusNet.Sidebar.setSelectedTimeline(timeline);

    var that = this;

    this.timeline.update(
        function() {
            that.view.showHeader();
            that.view.show();
        },
        false
    );
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

    var that = this;

    this.server = this.account.apiroot.substr(0, this.account.apiroot.length - 4); // hack for now

    if (this.account.siteLogo) {
        $('#public_img').attr('src', this.account.siteLogo);
    } else {
        $('#public_img').attr('src', '/images/logo.png');
    }

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

    // setup sounds
    this.newNoticesSound = Titanium.Media.createSound('app://sounds/kalimba.wav');
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
        that.timeline.update();
    });

    win.open();
}

/**
 * Delete a notice from the timeline
 *
 * @param int noticeId  the ID of the notice to delete
 */
StatusNet.Client.prototype.deleteNotice = function(noticeId) {

    var url = 'statuses/destroy/' + noticeId + '.json';

    StatusNet.debug("StatusNet.Client.deleteNotice()");

    var params = "gar=gar"; // XXX: we have to pass something to get web client to work

    var that = this;

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(status);
            StatusNet.debug(data);
            that.timeline.decacheNotice(noticeId);
            that.view.removeNotice(noticeId);
         },
         function(client, msg) {
             StatusNet.debug('Could not delete notice: ' + msg);
             alert('Could not delete notice: ' + msg);
         }
    );
}

/**
 * Favorite a notice
 *
 * Change the class on the notice's fave link from notice_fave to
 * notice_unfave and refresh the notice entry in the cache so it has
 * the right state
 *
 * @param int noticeId  the ID of the notice to delete
 * @param DOM linkDom   the link element
 *
 */
StatusNet.Client.prototype.faveNotice = function(noticeId, linkDom)
{
    var url = 'favorites/create/' + noticeId + '.json';

    StatusNet.debug("StatusNet.Client.faveNotice() - faving notice " + noticeId);

    var params = "gar=gar"; // XXX: we have to pass something to get web client to work

    var that = this;

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(status);
            StatusNet.debug(data);
            $(linkDom).text('Unfave');
            $(linkDom).removeClass('notice_fave');
            $(linkDom).addClass('notice_unfave');
            that.timeline.refreshNotice(noticeId);
        },
        function(client, msg) {
            StatusNet.debug('Could not favorite notice: ' + msg);
            alert('Could not favorite notice: ' + msg);
        }
    );
}

/**
 * Unfavorite a notice
 *
 * Change the class on the notice's unfave link from notice_unfave
 * to notice_fave and refresh the notice entry in the cache so it has
 * the right state.
 *
 * @param int noticeId  the ID of the notice to delete
 * @param DOM linkDom   the link element
 *
 */
StatusNet.Client.prototype.unFaveNotice = function(noticeId, linkDom)
{
    var url = 'favorites/destroy/' + noticeId + '.json';

    StatusNet.debug("StatusNet.Client.unFaveNotice() - unfaving notice " + noticeId);

    var params = "gar=gar"; // XXX: we have to pass something to get web client to work

    var that = this;

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(status);
            StatusNet.debug(data);
            $(linkDom).text('Fave');
            $(linkDom).removeClass('notice_unfave');
            $(linkDom).addClass('notice_fave');
            that.timeline.refreshNotice(noticeId);
        },
        function(client, msg) {
            StatusNet.debug('Could not unfavorite notice: ' + msg);
            alert('Could not unfavorite notice: ' + msg);
        }
    );
}

/**
 * Repeat a notice
 *
 * @param int noticeId  the ID of the notice to delete
 * @param DOM linkDom   the link element
 *
 * On success, removes the repeat link and refreshes the notice entry
 * in the cache so it has the right state.
 */
StatusNet.Client.prototype.repeatNotice = function(noticeId, linkDom)
{
    var url = 'statuses/retweet/' + noticeId + '.json';

    StatusNet.debug("StatusNet.Client.repeatNotice() - repeating notice " + noticeId);

    var params = "gar=gar"; // XXX: we have to pass something to get web client to work

    var that = this;

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(status);
            StatusNet.debug(data);
            $(linkDom).remove();
            that.timeline.refreshNotice(noticeId);
        },
        function(client, msg) {
            StatusNet.debug('Could not repeat notice: ' + msg);
            alert('Could not repeat notice: ' + msg);
        }
    );
}

