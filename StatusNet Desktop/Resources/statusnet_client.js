/**
 * Constructor for UI manager class for the client.
 *
 * @param StatusNet.Account _account
 * @return StatusNet.Client object
 */
StatusNet.Client = function(_account) {

    this.account = _account;

    this.view = new StatusNet.TimelineViewFriends(this);
    this.timeline =  new StatusNet.TimelineFriends(this);

    this.init();

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

    // @todo multiple timeline auto-refresh

    if (timeline !== 'user' && timeline !== 'inbox' && timeline !== 'search') {
        this.refresh = setInterval(
            function() {
                StatusNet.debug("Refreshing visible timeline.");
                that.timeline.update(null, true);
            },
            60000 // @todo Make this configurable
        );
    }
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
 * Show direct message input dialog
 */
StatusNet.Client.prototype.directMessageDialog = function(nickname) {
    var win = Titanium.UI.getCurrentWindow().createWindow({
        url: 'app:///direct_message.html',
        title: 'New Direct Message',
        width: 420,
        height: 120});

    if (nickname) {
        win.setTitle('New Direct Message To: ' + nickname);
        win.nickname = nickname;
    }

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

    $(linkDom).attr('disabled', 'disabled');

    var params = "gar=gar"; // XXX: we have to pass something to get web client to work

    var that = this;

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(status);
            StatusNet.debug(data);
            that.timeline.decacheNotice(noticeId);
            that.view.removeNotice(noticeId);
         },
         function(client, responseText) {
             $(linkDom).removeAttr('disabled');
             var msg = Titanium.JSON.parse(responseText);
             StatusNet.debug('Error deleting notice: ' + msg.error);
             alert('Error deleting notice: ' + msg.error);
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

    $(linkDom).attr('disabled', 'disabled');

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
        function(client, responseText) {
            $(linkDom).removeAttr('disabled');
            var msg = Titanium.JSON.parse(responseText);
            StatusNet.debug('Error favoriting notice: ' + msg.error);
            alert('Error favoriting notice: ' + msg.error);
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

    $(linkDom).attr('disabled', 'disabled');

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
        function(client, responseText) {
            $(linkDom).removeAttr('disabled');
            var msg = Titanium.JSON.parse(responseText);
            StatusNet.debug('Error unfavoring notice: ' + msg.error);
            alert('Error unfavoring notice: ' + msg.error);
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

    $(linkDom).attr('disabled', 'disabled');

    StatusNet.debug("StatusNet.Client.repeatNotice() - repeating notice " + noticeId);

    var params = "gar=gar"; // XXX: we have to pass something to get web client to work

    var that = this;

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(status);
            StatusNet.debug(data);
            $(linkDom).remove();
            that.timeline.refreshNotice(noticeId);
            that.timeline.update();
        },
        function(client, responseText) {
            $(linkDom).removeAttr('disabled');
            var msg = Titanium.JSON.parse(responseText);
            StatusNet.debug('Error repeating notice: ' + msg.error);
            alert('Error repeating notice: ' + msg.error);
        }
    );
}

/**
 * Subscribe to a profile
 *
 * @param int profileId  the ID of the profile to subscribe to
 * @param DOM linkDom    the link element
 *
 * On success changes the link to an unsubscribe link
 */
StatusNet.Client.prototype.subscribe = function(profileId, linkDom)
{
    var url = 'friendships/create/' + profileId + '.json';

    $(linkDom).attr('disabled', 'disabled');

    StatusNet.debug("StatusNet.Client.subscribe() - subscribing to " + profileId);

    var params = "gar=gar"; // XXX: we have to pass something to get web client to work

    var that = this;

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(status);
            StatusNet.debug(data);
            $(linkDom).text('Unsubscribe');
            $(linkDom).removeClass('profile_subscribe');
            $(linkDom).addClass('profile_unsubscribe');
            $(linkDom).unbind('click');
            $(linkDom).bind('click',
                function(event) {
                    that.unsubscribe(profileId, linkDom);
                }
            );
        },
        function(client, responseText) {
            $(linkDom).removeAttr('disabled');
            var msg = Titanium.JSON.parse(responseText);
            StatusNet.debug('Error subscribing to profile: ' + msg.error);
            alert('Error subscribing to profile: ' + msg.error);
        }
    );
}

/**
 * Unsubscribe from a profile
 *
 * @param int profileId  the ID of the profile to unsubscribe from
 * @param DOM linkDom    the link element
 *
 * On success changes the link to a subscribe link
 *
 */
StatusNet.Client.prototype.unsubscribe = function(profileId, linkDom)
{
    var url = 'friendships/destroy/' + profileId + '.json';

    $(linkDom).attr('disabled', 'disabled');

    StatusNet.debug("StatusNet.Client.unsubscribe() - unsubscribing from " + profileId);

    var params = "gar=gar"; // XXX: we have to pass something to get web client to work

    var that = this;

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(status);
            StatusNet.debug(data);
            $(linkDom).text('Subscribe');
            $(linkDom).removeClass('profile_unsubscribe');
            $(linkDom).addClass('profile_subscribe');
            $(linkDom).unbind('click');
            $(linkDom).bind('click',
                function(event) {
                    that.subscribe(profileId, linkDom);
                }
            );
        },
        function(client, responseText) {
            $(linkDom).removeAttr('disabled');
            var msg = Titanium.JSON.parse(responseText);
            StatusNet.debug('Error unsubscribing from profile: ' + msg.error);
            alert('Error unsubscribing from profile: ' + msg.error);
        }
    );
}

