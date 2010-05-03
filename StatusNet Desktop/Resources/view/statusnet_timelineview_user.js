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
 * Render the HTML display of a given timeline
 *
 */
StatusNet.TimelineViewUser.prototype.show = function () {

    this.showProfileInfo();

    var notices = this.client.timeline.getNotices();

    $('#notices').empty();

    var userAvatar = this.client.timeline.user.avatarMedium;
    var author = this.client.timeline.user.username;

    if (notices.length > 0) {

        var html = new Array();

        for (i = 0; i < notices.length; i++) {
            html.push('<div class="notice">');
            html.push('   <div class="avatar"><a href="' + notices[i].link + '"><img src="' + userAvatar + '"/></a></div>');
            html.push('   <div><a class="author" href="' + notices[i].link + '">' + author + '</a><br/>');
            html.push('   <small class="date">' + notices[i].updated + '</small></div>');
            html.push('   <div class="content">'+ notices[i].content +'<br/></div>');
            if (notices[i].contextLink && notices[i].inReplyToLink) {
                html.push(
                    '   <div class="context"><a class="context" href="'
                    + notices[i].contextLink +'">in context</a><br/></div>'
                );
            }
            html.push('</div>');
            html.push('<div class="clear"></div>');
        }

        $('#notices').append(html.join(''));
        $('.notice a').attr('rel', 'external');
    } else {
        $('#notices').append('<div id="empty_timeline">No notices in this timeline yet.</div>');
    }

    this.hideSpinner();
};

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



