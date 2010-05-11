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
            html.push('<div class="notice">');
            html.push('   <div class="avatar"><a href="' + notices[i].link + '"><img src="' + notices[i].avatar + '"/></a></div>');
            html.push('   <div><a class="author" href="' + notices[i].link + '">' + notices[i].author + '</a><br/>');
            html.push('   <small class="date">' + humane_date(notices[i].updated) + '</small></div>');
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



    } else {
        $('#notices').append('<div id="empty_timeline">No notices in this timeline yet.</div>');
    }

    $('.notice a').attr('rel', 'external');

    this.hideSpinner();
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

StatusNet.TimelineView.prototype.showSpinner = function() {
    StatusNet.debug("showSpinner");
    $('#notices').empty();
    $('#notices').append('<img id="spinner" src="/images/icon_processing.gif" />');
}

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
