/**
 * Base class for Timeline view
 *
 * @param StatusNet.Client client  The controller
 */
StatusNet.TimelineView = function(client) {
    StatusNet.debug("in StatusNet.TimelineView");
    this.client = client;
    this.title = "Timeline on {site}";
}

/**
 * Put together the HTML for a single notice
 *
 * @param object notice the notice
 */
StatusNet.TimelineView.prototype.renderNotice = function(notice) {

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
    html.push('   <div class="avatar"><a href="' + notice.authorUri + '"><img src="' + avatar + '"/></a></div>');
    html.push('   <div><a class="author" name="author-' + authorId + '" href="' + notice.authorUri + '">' + author + '</a>');
    html.push('   <div class="content">'+ notice.content +'</div>');
    html.push('   </div><div class="date_link"><a href="' + notice.link + '" rel="external">' + humane_date(notice.updated) + '</a></div>');
    if (notice.contextLink && notice.inReplyToLink) {
        html.push(
            '   <div class="context_link"><a href="'
            + notice.contextLink +'">in context</a></div>'
        );
    }
    html.push('<div class="notice_links"><a href="#" class="notice_reply">Reply</a>');

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

    html.push('</div></div>');
    html.push('<div class="clear"></div>');

    return html.join('');
}

/**
 * Render the HTML display of a given timeline
 *
 */
StatusNet.TimelineView.prototype.show = function () {

    StatusNet.debug("TimelineView.show - timeline = " + this.client.timeline.timeline_name);

    var notices = this.client.timeline.getNotices();

    $('#notices').empty();

    if (notices.length > 0) {

        var html = [];

        for (i = 0; i < notices.length; i++) {
            html.push(this.renderNotice(notices[i]));
        }

        $('#notices').append(html.join(''));

        var that = this;

        $('#notices div.notice').each(function() {
            that.enableNoticeControls(this);
        });

    }

    $('.notice a').attr('rel', 'external');
}

StatusNet.TimelineView.prototype.showNewNotice = function(notice) {
    StatusNet.debug("prepending notice " + notice.id);
    $('#notices').prepend(this.renderNotice(notice));
    var notice = $('#notices > div.notice:first').get(0);
    this.enableNoticeControls(notice);
    $('#notices > div.notice:first').hide();
    $('#notices > div.notice:first').fadeIn("slow");
}

StatusNet.TimelineView.prototype.showNotification = function(notice) {

    var author = null;

    // Special case for user timelines, which don't have an avatar
    // and author on each notice Atom entry
    if (this.client.timeline.user) {
        author = this.client.timeline.user.username;
    } else {
        author = notice.author;
    }

    var notification = Titanium.Notification.createNotification(Titanium.UI.getCurrentWindow());
    var nTitle = "New notice from " + notice.author;

    if (notice.atomSource) {
        nTitle = "New notice from " + notice.atomSource;
    }

    notification.setTitle(nTitle);
    notification.setMessage(notice.title); // plain text version of the content

    notification.setIcon("app://logo.png");
    notification.setDelay(5000);
    notification.setCallback(function () {

        // @todo Bring the app window back to focus / on top

        alert("i've been clicked");
    });
    notification.show();
}

/**
 * Determines whether the notice is local (by permalink)
 *
 * @todo This could be better...
 *
 * @param String uri the uri of the notice
 *
 * @return boolean value
 */
StatusNet.TimelineView.prototype.localAuthor = function(uri) {

    // Isolate domain name from URI paths and compare
    var path = uri.split('/');
    var serverPath = this.client.server.split('/');

    if (path[2] === serverPath[2]) {
        return true;
    }
    return false;
}

StatusNet.TimelineView.prototype.enableNoticeControls = function(noticeDom) {
    var name = $(noticeDom).attr('name');
    var noticeId = name.substring(7); // notice-

    name = $(noticeDom).find('a.author').attr('name');
    var authorId = name.substring(7); // author-
    var noticeAuthor = $(noticeDom).find('a.author').text();
    var uri = $(noticeDom).find('div a.author').attr('href');

    var that = this;

    // Override links to external web view of the notice timelines
    // with click event handlers to display timelines within the client
    if (this.localAuthor(uri)) {

        $(noticeDom).find('div a.author').attr('href', "#");
        $(noticeDom).find('div a.author').bind('click', function(event) {
            StatusNet.debug("Switching timeline to user " + authorId);
            that.client.switchUserTimeline(authorId);
        });

        $(noticeDom).find('div.avatar a').attr('href', "#");
        $(noticeDom).find('div.avatar').bind('click', function(event) {
            StatusNet.debug("Switching timeline to user " + authorId);
            that.client.switchUserTimeline(authorId);
        });
    }

    // Reply
    $(noticeDom).find('a.notice_reply').bind('click', function(event) {
        that.client.newNoticeDialog(noticeId, noticeAuthor);
    });

    // Delete notice
    $(noticeDom).find('a.notice_delete').bind('click', function(event) {
        var r = confirm("Delete notice?");
        if (r) {
            that.client.deleteNotice(noticeId);
        }
    });

    // Fave notice
    $(noticeDom).find('a.notice_fave').toggle(
        function(event) {
            that.client.faveNotice(noticeId, this);
        },
        function(event) {
            that.client.unFaveNotice(noticeId, this);
        }
    );

    $(noticeDom).find('a.notice_unfave').toggle(
        function(event) {
            that.client.unFaveNotice(noticeId, this);
        },
        function(event) {
            that.client.faveNotice(noticeId, this);
        }
    );

    // Repeat
    $(noticeDom).find('a.notice_repeat').bind('click', function(event) {
        that.client.repeatNotice(noticeId, this);
    });

    // Override external web links to local users in-content
    $(noticeDom).find('div.content span.vcard a').each(function() {
        var href = $(this).attr('href');
        if (that.localAuthor(href)) {
            $(this).attr('href', '#');
            $(this).click(function() {
                var idRegexp = /(\d)+$/;
                result = href.match(idRegexp);
                if (result) {
                    that.client.switchUserTimeline(result[0]);
                }
            });
        }
    });
}

/**
 * Remove notice from the visible timeline
 *
 * @param int noticeId  the ID of the notice to make go away
 */
StatusNet.TimelineView.prototype.removeNotice = function(noticeId) {
    StatusNet.debug("TimelineView.removeNotice() - removing notice " + noticeId);
    $('#notices div.notice[name=notice-' + noticeId + ']').fadeOut("slow");
}

/**
 * Set up anything that should go in the header section...
 */
StatusNet.TimelineView.prototype.showHeader = function () {
    var title = this.title.replace("{name}", this.client.account.username)
                           .replace("{site}", this.client.account.getHost());
    $("#header").html("<h1></h1>");
    $("#header h1").text(title);
}

/**
 * Show wait cursor
 */
StatusNet.TimelineView.prototype.showSpinner = function() {
    StatusNet.debug("showSpinner");
    /* $('#notices').prepend('<img id="spinner" src="/images/icon_processing.gif" />'); */

	$('#notices').prepend('<img id="spinner" src="/images/sam/loading.gif" />');
}

/**
 * Hide wait cursor
 */
StatusNet.TimelineView.prototype.hideSpinner = function() {
    StatusNet.debug("hideSpinner");
    $('#spinner').remove();
}

/**
 * Constructor for a view for a friends timeline
 */
StatusNet.TimelineViewFriends = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "{name} and friends on {site}";
}

// Make StatusNet.TimelineViewFriends inherit TimelineView's prototype
StatusNet.TimelineViewFriends.prototype = heir(StatusNet.TimelineView.prototype);


/**
 * Constructor for a view for mentions timeline
 */
StatusNet.TimelineViewMentions = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "{name} and friends on {site}";
}

// Make StatusNet.TimelineViewMentions inherit TimelineView's prototype
StatusNet.TimelineViewMentions.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Constructor for a view for public timeline
 */
StatusNet.TimelineViewPublic = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "Public timeline on {site}";
}

// Make StatusNet.TimelineViewPublic inherit TimelineView's prototype
StatusNet.TimelineViewPublic.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Constructor for a view for favorites timeline
 */
StatusNet.TimelineViewFavorites = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "{name}'s favorite notices on {site}";
}

// Make StatusNet.TimelineViewFavorites inherit TimelineView's prototype
StatusNet.TimelineViewFavorites.prototype = heir(StatusNet.TimelineView.prototype);

