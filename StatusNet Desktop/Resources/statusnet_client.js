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

    this.view = new StatusNet.TimelineViewFriends(this);
    this.timeline =  new StatusNet.TimelineFriends(this);

	this.view.showHeader();
    this.view.show();
    this.view.showSpinner(); // spinner will get hidden by the view when data finishes loading
    this.timeline.update();

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
            this.timeline = new StatusNet.TimelineUser(this);
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
    this._timeline = timeline;

    StatusNet.Sidebar.setSelectedTimeline(timeline);

	this.view.showHeader();
    this.view.showSpinner();
    this.timeline.update();

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

    that = this;

    this.server = this.account.apiroot.substr(0, this.account.apiroot.length - 4); // hack for now

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

    // post a new notice
    $('#update_button').bind('click', function() { that.postNotice(); });

    // refresh timeline when window is clicked
    $("#content").bind('click', function() { that.refresh(); });

    // make links open in an external browser window
    $('a[rel=external]').live('click', function() {
        Titanium.Desktop.openURL($(this).attr('href'));
        return false;
    });

}

/**
 * Post a notice
 */
StatusNet.Client.prototype.postNotice = function()
{
    var url = 'statuses/update.json';

    var noticeText = $('#notice_textarea').val();

    var params = 'status=' + noticeText + '&source=StatusNet Desktop';

    var that = this;

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(data);
            StatusNet.debug(data.user);

            var notice = {};

            notice.id = data.id;
            notice.avatar = data.user.profile_image_url;
            notice.date = data.created_at;
            notice.desc = data.text;
            notice.author = data.user.screen_name;
            notice.link = that.account.server + '/' + data.user.screen_name;

            that.timeline.addStatus(status, true);
            that.view.show();

            //$('#notices > div.notice:first').before(data.text);
        },
        function(client, msg) {
            StatusNet.debug('Could not post notice: ' + msg);
            alert('Could not post notice: ' + msg);
        }
    );

}
