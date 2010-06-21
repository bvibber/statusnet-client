/**
 * Base class for Timeline view
 *
 * @param StatusNet.Client client  The controller
 */
StatusNet.TimelineView = function(client) {
    this.client = client;

    // XXX: Woah, it doesn't work to pass the timeline into the constructor!
    this.timeline = client.getActiveTimeline();

    this.title = "Timeline on {site}";

    var that = this;

    // Attach event listeners

    this.timeline.updateStart.attach(
        function() {
            that.showSpinner();
        }
    );

    this.timeline.updateFinished.attach(
        function() {
            that.hideSpinner();
        }
    );

    this.timeline.noticeAdded.attach(
        function(args) {
            if (args) {
                that.showNewNotice(args.notice);
                if (args.showNotification) {
                    that.showNotification(args.notice);
                }
            } else {
                StatusNet.debug("noticeAdded event with no args!");
            }
        }
    );
}

/**
 * Put together the HTML for a single notice
 *
 * @param object notice the notice
 */
StatusNet.TimelineView.prototype.renderNotice = function(notice) {

    var html = [];
    var avatar = notice.avatar;
    var author = notice.author;
    var authorId = notice.authorId

    var classes = ['notice'];

    if (notice.favorite === "true") {
        classes.push('notice-favorite');
    }

    if (notice.repeated === "true") {
        classes.push('notice-repeated');
    }

    if (notice.repeat_of) {
        classes.push('notice-repeat');
    }

    html.push('<div class="' + classes.join(" ") + '" name="notice-' + notice.id +'">');

    html.push('   <div class="avatar"><a href="' + notice.authorUri + '"><img src="' + avatar + '"/></a></div>');
    html.push('   <div><a class="author" name="author-' + authorId + '" href="' + notice.authorUri + '">' + author + '</a>');
    html.push('   <div class="content">'+ notice.content +'</div>');
    html.push('   </div><div class="date_link"><a href="' + notice.link + '" rel="external">' + humane_date(notice.updated) + '</a></div>');
    html.push('   <div class="notice_source">from ' + notice.source + '</div>');
    if (notice.contextLink && notice.inReplyToLink) {
        html.push(
            '   <div class="context_link"><a rel="external" href="'
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
StatusNet.TimelineView.prototype.show = function(notices) {

    StatusNet.debug("StatusNet.TimelineView.show() - getting notices");

    var notices = this.timeline.getNotices();

    StatusNet.debug("got notices");

    $('#notices').empty();

    if (notices.length > 0) {

        StatusNet.debug("showing notice");
        var html = [];

        for (i = 0; i < notices.length; i++) {
            html.push(this.renderNotice(notices[i]));
        }

        $('#notices').append(html.join(''));

        var that = this;

        StatusNet.debug("enabling notice controls");

        $('#notices div.notice').each(function() {
            that.enableNoticeControls(this);
        });

    }

    $('.notice a').attr('rel', 'external');

    StatusNet.debug("StatusNet.TimelineView.show() - finished showing notices");
}

StatusNet.TimelineView.prototype.showNewNotice = function(notice) {
    StatusNet.debug("prepending notice " + notice.id);
    $('#notices').prepend(this.renderNotice(notice));
    var notice = $('#notices > div.notice:first').get(0);
    this.enableNoticeControls(notice);
    $('#notices > div.notice:first').hide();
    $('#notices > div.notice:first').fadeIn("slow");
}

StatusNet.TimelineView.prototype.showNotification = function(notice, user) {

    // XXX: Notifications are busted and cause crashing on Win32 Titanium
    if (Titanium.Platform.name === "Windows NT") {
        return;
    }

    var author = null;

    // Special case for user timelines, which don't have an avatar
    // and author on each notice Atom entry
    if (user) {
        author = user.username;
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
StatusNet.TimelineView.prototype.isLocal = function(uri) {

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
    if (this.isLocal(uri)) {

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
            that.client.deleteNotice(noticeId, this);
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

    // Override external web links to local users and groups in-content
    $(noticeDom).find('div.content span.vcard a').each(function() {
        var href = $(this).attr('href');
        if (that.isLocal(href)) {
            $(this).attr('href', '#');
            // group
            var result = href.match(/group\/(\d+)\/id/);
            if (result) {
                $(this).click(function() {
                    that.client.showGroupTimeline(result[1]); // group id
                });
            // user
            } else {
                result = href.match(/(\d)+$/);
                if (result) {
                    $(this).click(function() {
                        that.client.switchUserTimeline(result[0]); // user id
                    });
                }
            }
        }
    });

    // Override external web links to tags
    $(noticeDom).find("div.content span.tag a").each(function() {
        $(this).attr('href', '#');
        $(this).click(function() {
            that.client.showTagTimeline($(this).text());
        });
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
    StatusNet.debug("StatusNet.TimelineView.showHeader() - title = " + title);
    $("#header").html("<h1></h1>");
    $("#header h1").text(title);
    StatusNet.debug("StatusNet.TimelineView.showHeader() - finished");
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
    this.title = "Replies to {name} on {site}";
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

/**
 * Constructor for a view for tag timeline
 */
StatusNet.TimelineViewTag = function(client) {
    StatusNet.TimelineView.call(this, client);
    StatusNet.debug("TimelineViewTag constructor");
    this.title = "Notices tagged #{tag} on {site}";
}

// Make StatusNet.TimelineViewTag inherit TimelineView's prototype
StatusNet.TimelineViewTag.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Override to show tag name
 */
StatusNet.TimelineViewTag.prototype.showHeader = function () {
    StatusNet.debug("TimelineViewTag.showHeader()");
    var title = this.title.replace("{tag}", this.timeline.tag)
                           .replace("{site}", this.client.account.getHost());
    StatusNet.debug("StatusNet.TimelineViewTag.showHeader() - title = " + title);
    $("#header").html("<h1></h1>");
    $("#header h1").text(title);
    StatusNet.debug("StatusNet.TimelineViewTag.showHeader() - finished");
}
