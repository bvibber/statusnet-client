/**
 * Constructor for a view for search timeline
 * @fixme this guy'll need an input box!
 */
StatusNet.TimelineViewSearch = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "Text search on {site}";
    
    StatusNet.debug("TimelineViewSearch constructor");
    
}

// Make StatusNet.TimelineViewSearch inherit TimelineView's prototype
StatusNet.TimelineViewSearch.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Set up the search box.
 */
StatusNet.TimelineViewSearch.prototype.showHeader = function () {
    StatusNet.TimelineView.prototype.showHeader.call(this);
    
    StatusNet.debug('TimelineViewSearch.showHeader()');
    
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
