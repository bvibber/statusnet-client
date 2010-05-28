/**
 * Constructor for user's timeline
 */
StatusNet.TimelineViewUser = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "{name}'s profile on {site}";
}

// Make StatusNet.TimelineViewUser inherit TimelineView's prototype
StatusNet.TimelineViewUser.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Show profile information header for this user
 */
StatusNet.TimelineViewUser.prototype.showProfileInfo = function () {
    StatusNet.debug("showProfileInfo()");

    var user = this.client.timeline.user;

    // @todo HTTP fetch here to get follower count, etc.

    $('#profile_info').remove();

    var html = new Array();

    html.push('<div id="profile_info">');
    html.push('<img src="' + user.avatarMedium + '"/>');
    html.push(user.fullName);
    html.push(' (@' + user.username + ')');
    html.push('</div>');

    $('#header').append(html.join(''));

};

/**
 * Override the header to show name of the user associated with
 * this timeline
 */
StatusNet.TimelineViewUser.prototype.showHeader = function () {

    StatusNet.debug("TimelineViewUser.showHeader()");

    var username = null;

    if (this.client.timeline.user) {
        StatusNet.debug("TimelineViewUser.showHeader() - found a user for the timeline!");
        username = this.client.timeline.user.username;
    } else {
        StatusNet.debug("TimelineViewUser.showHeader() - No user for timeline, falling back to account username");
        username = this.client.timeline.account.username;
    }

    StatusNet.debug("TimelineViewUser.showHeader() - username = " + username);

    var title = this.title.replace("{name}", username)
                          .replace("{site}", this.client.account.getHost());

    StatusNet.debug("TimelineViewUser.showHeader() - setting title to: " + title);

    $("#header").html("<h1></h1>");
    $("#header h1").text(title);

};

