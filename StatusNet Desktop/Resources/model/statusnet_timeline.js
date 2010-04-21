/**
 * Constructor for base timeline model class
 *
 * @param StatusNet.Client       client the controller
 * @param StatusNet.TimelineView view   the view
 */
StatusNet.Timeline = function(client, view) {

    this.client = client;
    this.view = this.client.view;
    this.account = this.client.account;

    this._statuses = new Array();

    Titanium.API.debug("StatusNet.Timeline constructor");
}

/**
 * Add a notice to the Timeline if it's not already in it.
 */
StatusNet.Timeline.prototype.addStatus = function(status, prepend) {

    // dedupe here?
    for (i = 0; i < this._statuses.length; i++) {
        if (this._statuses[i].noticeId === status.noticeId) {
            Titanium.API.debug("skipping duplicate notice: " + status.noticeId);
            return;
        }
    }

    if (prepend) {
        this._statuses.unshift(status);
    } else {
        this._statuses.push(status);
    }
}

/**
 * Update the timeline.  Does a fetch of the Atom feed for the appropriate
 * timeline and notifies the view the model has changed.
 */
StatusNet.Timeline.prototype.update = function() {

    var that = this;  // Provide inner helper with outer function's context

    this.account.fetchUrl(this.url,

        function(status, data) {

            Titanium.API.debug('Fetching ' + that.url);

            $(data).find('feed > entry').each(function() {

                var status = {};

                // note: attribute selectors seem to have problems with [media:width=48]
                var avatar = 'about:blank';
                $(this).find('link[rel=avatar]').each(function(i, el) {
                    if ($(el).attr('media:width') == '48') {
                        status.avatar = $(el).attr('href');
                    }
                });

                // Pull notice ID from permalink
                var idRegexp = /(\d)+$/;
                var permalink = $(this).find('id').text();
                result = permalink.match(idRegexp);

                if (result) {
                    status.noticeId = result[0];
                }

                status.date = $(this).find('published').text();
                status.desc = $(this).find('content').text();
                status.author = $(this).find('author name').text();
                status.link = $(this).find('author uri').text();

                that.addStatus(status, false);

            });

            // use events instead? Observer?
            that.view.show();
        },
        function(status, thrown) {
            Titanium.API.debug("Someting went wrong retreiving timeline.");
            alert("Couldn't get timeline.");
        }
    );

}

/**
 * Accessor for statuses
 *
 * @return Array an array of statuses
 */
StatusNet.Timeline.prototype.getStatuses = function() {
    return this._statuses;
}

/**
 * Constructor for friends timeline model
 */
StatusNet.TimelineFriends = function(client) {
    StatusNet.Timeline.call(this, client);

    // set window title here?

    this.url = 'statuses/friends_timeline.atom';

}

// Make StatusNet.TimelineFriends inherit Timeline's prototype
StatusNet.TimelineFriends.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Constructor for mentions timeline model
 */
StatusNet.TimelineMentions = function(client) {
    StatusNet.Timeline.call(this, client);

    this.url = 'statuses/mentions.atom';

}

// Make StatusNet.TimelineMentions inherit Timeline's prototype
StatusNet.TimelineMentions.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Constructor for public timeline model
 */
StatusNet.TimelinePublic = function(client) {
    StatusNet.Timeline.call(this, client);

    this.url = 'statuses/public_timeline.atom';

}

// Make StatusNet.TimelinePublic inherit Timeline's prototype
StatusNet.TimelinePublic.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Constructor for user timeline model
 */
StatusNet.TimelineUser = function(client) {
    StatusNet.Timeline.call(this, client);

    this.url = 'statuses/user_timeline.atom';

}

// Make StatusNet.TimelineUser inherit Timeline's prototype
StatusNet.TimelineUser.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Constructor for favorites timeline model
 */
StatusNet.TimelineFavorites = function(client) {
    StatusNet.Timeline.call(this, client);

    this.url = 'favorites.atom';

}

// Make StatusNet.TimelineFavorites inherit Timeline's prototype
StatusNet.TimelineFavorites.prototype = heir(StatusNet.Timeline.prototype);
