/**
 * Base class for Timeline view
 *
 * @param StatusNet.Client client  The controller
 */
StatusNet.TimelineView = function(client) {
    StatusNet.debug("in StatusNet.TimelineView");
    this.client = client;
}

/**
 * Render the HTML display of a given timeline
 *
 */
StatusNet.TimelineView.prototype.show = function () {

    var statuses = this.client.timeline.getStatuses();

    $('#statuses').empty();

    if (statuses.length > 0) {

        var html = new Array();

        for (i = 0; i < statuses.length; i++) {
            html.push('<div class="notice">');
            html.push('   <div class="avatar"><a href="' + statuses[i].link + '"><img src="' + statuses[i].avatar + '"/></a></div>');
            html.push('   <div><a class="author" href="' + statuses[i].link + '">' + statuses[i].author + '</a><br/>');
            html.push('   <small class="date">' + statuses[i].date + '</small></div>');
            html.push('   <div class="content">'+ statuses[i].desc +'<br/></div>');
            html.push('</div>');
            html.push('<div class="clear"></div>');
        }

        $('#statuses').append(html.join(''));
        $('.notice a').attr('rel', 'external');
    } else {
        $('#statuses').append('<div id="empty_timeline">No notices in this timeline yet.</div>');
    }

    this.hideSpinner();
}

/**
 * Set up anything that should go in the header section...
 */
StatusNet.TimelineView.prototype.showHeader = function () {
    $("#header").html("");
}

StatusNet.TimelineView.prototype.showSpinner = function() {
    StatusNet.debug("showSpinner");
    $('#statuses').empty();
    $('#statuses').append('<img id="spinner" src="/images/icon_processing.gif" />');
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
}

// Make StatusNet.TimelineViewFriends inherit TimelineView's prototype
StatusNet.TimelineViewFriends.prototype = heir(StatusNet.TimelineView.prototype);


/**
 * Constructor for a view for mentions timeline
 */
StatusNet.TimelineViewMentions = function(client) {
    StatusNet.TimelineView.call(this, client);
}

// Make StatusNet.TimelineViewMentions inherit TimelineView's prototype
StatusNet.TimelineViewMentions.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Constructor for a view for public timeline
 */
StatusNet.TimelineViewPublic = function(client) {
    StatusNet.TimelineView.call(this, client);
}

// Make StatusNet.TimelineViewPublic inherit TimelineView's prototype
StatusNet.TimelineViewPublic.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Constructor for user's timeline
 */
StatusNet.TimelineViewUser = function(client) {
    StatusNet.TimelineView.call(this, client);
}

// Make StatusNet.TimelineViewUser inherit TimelineView's prototype
StatusNet.TimelineViewUser.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Constructor for a view for favorites timeline
 */
StatusNet.TimelineViewFavorites = function(client) {
    StatusNet.TimelineView.call(this, client);
}

// Make StatusNet.TimelineViewFavorites inherit TimelineView's prototype
StatusNet.TimelineViewFavorites.prototype = heir(StatusNet.TimelineView.prototype);


/**
 * Constructor for a view for search timeline
 * @fixme this guy'll need an input box!
 */
StatusNet.TimelineViewSearch = function(client) {
    StatusNet.TimelineView.call(this, client);
}

// Make StatusNet.TimelineViewSearch inherit TimelineView's prototype
StatusNet.TimelineViewSearch.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Set up the search box.
 */
StatusNet.TimelineViewSearch.prototype.showHeader = function () {
    $("#header").html('<div id="search-box"><input id="search"></div>');
    var timeline = this.client.timeline;
    var q = timeline.searchTerm();
    $("#search").val(q)
			    .change(function() {
		timeline.updateSearch($(this).val());
	});
}
