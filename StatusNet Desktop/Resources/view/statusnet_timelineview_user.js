/**
 * Constructor for user's timeline
 */
StatusNet.TimelineViewUser = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "{name}'s profile on {site}";

    this.client = client;

}

// Make StatusNet.TimelineViewUser inherit TimelineView's prototype
StatusNet.TimelineViewUser.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Show profile information header for this user
 */
StatusNet.TimelineViewUser.prototype.showProfileInfo = function (user, extended, client) {
    StatusNet.debug("showProfileInfo()");

    $('#profile_info').remove();

    var html = new Array();

    html.push('<div id="profile_panel">');
    html.push('<h1>@' + user.username + '</h1>');
    html.push('<img src="' + user.avatarLarge + '"/>');
    html.push('<dl class="profile_list">');
    html.push('<dt>Name</dt>');
    html.push('<dd>');
    if (user.fullname) {
        html.push(user.fullname);
    } else {
        html.push(user.username);
    }
    html.push('</dd>');

    if (user.bio) {
        html.push('<dt>Bio</dt>');
        html.push('<dd>' + user.bio + '</dd>');
    }

    if (user.location) {
        html.push('<dt>Location</dt>');
        html.push('<dd>' + user.location + '</dd>');
    }

    if (user.homepage) {
        html.push('<dt>Homepage</dt>');
        html.push('<dd><a rel="external" href="' + user.homepage + '">' + user.homepage + '</a></dd>');
    }

    html.push('</dl>');

    if (extended) {
        html.push('<dl class="profile_statistics">');
        html.push('<dt>Subscriber Count</dt>');
        html.push('<dd>' + extended.followers_cnt + '</dd>');
        html.push('<dt>Subcribed Count</dt>');
        html.push('<dd>' + extended.friends_cnt + '</dd>');
        html.push('<dt>Notices Count</dt>');
        html.push('<dd>' + extended.statuses_cnt + '</dd>');
        html.push('<dt>Favorites Count</dt>');
        html.push('<dd>' + extended.favorites_cnt + '</dd>');
        html.push('</dl>')

        if (extended.following == "false") {
            html.push('<a href="#" class="profile_subscribe">Subscribe</a>');
        } else {
            html.push('<a href="#" class="profile_unsubscribe">Unsubscribe</a>');
        }
    }

    html.push('</div>');

    $('#header').append(html.join(''));

    // XXX: sucks that I have to pass client back in so I can use it here -Z
    // Hmm... use toggle() instead?
    $('a.profile_subscribe').bind('click', function(event) {
        client.subscribe(user.id, this);
    });

    $('a.profile_unsubscribe').bind('click', function(event) {
        client.unsubscribe(user.id, this);
    });
}

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

    var that = this;

    // Show extended profile data after asynchronous load of api/users/show.xml
    this.client.timeline.getExtendedInfo(
        that.showProfileInfo,
        that.client.timeline.authorId
    );
}

/**
 * Put together the HTML for a single notice for a User profile timeline
 *
 * @param object notice the notice
 */
StatusNet.TimelineViewUser.prototype.renderNotice = function(notice) {

    var html = [];

    var avatar = null;
    var author = null;

    // Special case for user timelines, which don't have an avatar
    // and author on each notice Atom entry
    if (this.client.timeline.user) {
        avatar = this.client.timeline.user.avatarMedium;
        author = this.client.timeline.user.username;
        authorId = this.client.timeline.user.id;
    } else {
        avatar = notice.avatar;
        author = notice.author;
        authorId = notice.authorId
    }

    html.push('<div class="notice" name="notice-' + notice.id +'">');
    html.push('   <div><a class="author" name="author-' + authorId + '" href="' + notice.link + '">' + author + '</a><br/>');
    html.push('   <div class="content">'+ notice.content +'<br/></div>');
    html.push('   <small class="date">' + humane_date(notice.updated) + '</small></div>');
    if (notice.contextLink && notice.inReplyToLink) {
        html.push(
            '   <div class="context"><a class="context" href="'
            + notice.contextLink +'">in context</a><br/></div>'
        );
    }
    html.push('<a href="#" class="notice_reply">Reply</a>');

    if (notice.favorite === "true") {
        html.push(' <a href="#" class="notice_unfave">Unfave</a>');
    } else {
        html.push(' <a href="#" class="notice_fave">Fave</a>')
    }

    if (author === this.client.account.username) {
        html.push(' <a href="#" class="notice_delete">Delete</a>')
    } else {
        if (notice.repeated === "false") {
            html.push(' <a href="#" class="notice_repeat">Repeat</a>');
        }
    }

    html.push('</div>');
    html.push('<div class="clear"></div>');

    return html.join('');
}


