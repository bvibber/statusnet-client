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
            html.push('   <small class="date">' + notices[i].date + '</small></div>');
            html.push('   <div class="content">'+ notices[i].desc +'<br/></div>');
            html.push('</div>');
            html.push('<div class="clear"></div>');
        }

        $('#notices').append(html.join(''));
        $('.notice a').attr('rel', 'external');
    } else {
        $('#notices').append('<div id="empty_timeline">No notices in this timeline yet.</div>');
    }

    this.hideSpinner();
}

