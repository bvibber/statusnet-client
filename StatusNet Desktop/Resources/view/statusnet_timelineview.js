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
 * Render the HTML display of a given timeline
 *
 */
StatusNet.TimelineView.prototype.show = function () {

    StatusNet.debug("TimelineView.show");

    var notices = this.client.timeline.getNotices();

    $('#notices').empty();

    if (notices.length > 0) {

        var html = new Array();

        for (i = 0; i < notices.length; i++) {

            html.push('<div class="notice" name="notice-' + notices[i].id +'">');
            html.push('   <div class="avatar"><a href="' + notices[i].link + '"><img src="' + notices[i].avatar + '"/></a></div>');
            html.push('   <div><a class="author" name="author-' + notices[i].authorId + '" href="' + notices[i].link + '">' + notices[i].author + '</a><br/>');
            html.push('   <div class="content">'+ notices[i].content +'<br/></div>');
            html.push('   <small class="date">' + humane_date(notices[i].updated) + '</small></div>');
            if (notices[i].contextLink && notices[i].inReplyToLink) {
                html.push(
                    '   <div class="context"><a class="context" href="'
                    + notices[i].contextLink +'">in context</a><br/></div>'
                );
            }
            html.push('<a href="#" class="notice_reply">Reply</a>');

            if (notices[i].favorite === "true") {
                html.push(' <a href="#" class="notice_unfave">Unfave</a>');
            } else {
                html.push(' <a href="#" class="notice_fave">Fave</a>')
            }

            if (notices[i].author === this.client.account.username) {
                html.push(' <a href="#" class="notice_delete">Delete</a>')
            }

            html.push('</div>');
            html.push('<div class="clear"></div>');

        }

        $('#notices').append(html.join(''));

        var that = this;

        $('#notices div.notice').each(function() {
            that.enableNoticeControls(this);
        });

    } else {
        $('#notices').append('<div id="empty_timeline">No notices in this timeline yet.</div>');
    }

    $('.notice a').attr('rel', 'external');

    this.hideSpinner();
}

/**
 * Determines whether the notice is local (by permalink)
 *
 * @param String uri the uri of the notice
 *
 * @return boolean value
 */
StatusNet.TimelineView.prototype.localAuthor = function(uri) {

    if (uri.substring(0, this.client.server.length) === this.client.server) {
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

    StatusNet.debug("authorId = " + authorId + " author name = " + noticeAuthor + " noticeId = " + noticeId);

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

    $(noticeDom).find('a.notice_reply').bind('click', function(event) {
        that.client.newNoticeDialog(noticeId, noticeAuthor);
    });

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

};

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
    $('#notices').empty();
    $('#notices').append('<img id="spinner" src="/images/icon_processing.gif" />');
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


/**
 * Constructor for a view for inbox timeline
 */
StatusNet.TimelineViewInbox = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "Inbox for {name} on {site}";
}

// Make StatusNet.TimelineViewInbox inherit TimelineView's prototype
StatusNet.TimelineViewInbox.prototype = heir(StatusNet.TimelineView.prototype);


/**
 * Constructor for a view for search timeline
 * @fixme this guy'll need an input box!
 */
StatusNet.TimelineViewSearch = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "Text search on {site}";
}

// Make StatusNet.TimelineViewSearch inherit TimelineView's prototype
StatusNet.TimelineViewSearch.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Set up the search box.
 */
StatusNet.TimelineViewSearch.prototype.showHeader = function () {
    StatusNet.TimelineView.prototype.showHeader.call(this);
    $("#header").append('<div id="search-box">' +
                        '<label for="search">Search:</label> ' +
                        '<input id="search">' +
                        '</div>');
    var timeline = this.client.timeline;
    var q = timeline.searchTerm();
    $("#search").val(q)
                .change(function() {
        timeline.updateSearch($(this).val());
    });
}
