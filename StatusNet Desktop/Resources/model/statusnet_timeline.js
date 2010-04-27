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

    StatusNet.debug("StatusNet.Timeline constructor");
}

/**
 * Add a notice to the Timeline if it's not already in it.
 */
StatusNet.Timeline.prototype.addStatus = function(status, prepend) {

    // dedupe here?
    for (i = 0; i < this._statuses.length; i++) {
        if (this._statuses[i].noticeId === status.noticeId) {
            StatusNet.debug("skipping duplicate notice: " + status.noticeId);
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

    this.account.fetchUrl(this.getUrl(),

        function(status, data) {

            StatusNet.debug('Fetched ' + that.url);
			StatusNet.debug('HTTP client returned: ' + data);

            $(data).find('feed > entry').each(function() {

				StatusNet.debug('found an entry');

                var status = {};

                // note: attribute selectors seem to have problems with [media:width=48]
                var avatar = 'about:blank';
                $(this).find('link[rel=avatar]').each(function(i, el) {
                    if ($(el).attr('media:width') == '48') {
                        status.avatar = $(el).attr('href');
                    }
                });

                // XXX: Quick hack to get rid of broken imgs in profile timeline
                // We need to specialize StatusNet.TimelineUser to grab the avatar
                // URL from the activity:subject or author. And probably move Atom
                // parsing to its own class
                if (!status.avatar) {
                    status.avatar = that.account.avatar;
                }

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
            that.finishedFetch()
        },
        function(client, msg) {
            StatusNet.debug("Someting went wrong retreiving timeline: " + msg);
            alert("Couldn't get timeline: " + msg);
        }
    );

}

StatusNet.Timeline.prototype.getUrl = function() {
    return this._url;
}

StatusNet.Timeline.prototype.finishedFetch = function() {
    this.view.show();
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
 * Constructor for mentions timeline model
 */
StatusNet.TimelineMentions = function(client) {
    StatusNet.Timeline.call(this, client);

    this._url = 'statuses/mentions.atom';

}

// Make StatusNet.TimelineMentions inherit Timeline's prototype
StatusNet.TimelineMentions.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Constructor for public timeline model
 */
StatusNet.TimelinePublic = function(client) {
    StatusNet.Timeline.call(this, client);

    this._url = 'statuses/public_timeline.atom';

}

// Make StatusNet.TimelinePublic inherit Timeline's prototype
StatusNet.TimelinePublic.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Constructor for user timeline model
 */
StatusNet.TimelineUser = function(client) {
    StatusNet.Timeline.call(this, client);

    this._url = 'statuses/user_timeline.atom';

}

// Make StatusNet.TimelineUser inherit Timeline's prototype
StatusNet.TimelineUser.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Constructor for favorites timeline model
 */
StatusNet.TimelineFavorites = function(client) {
    StatusNet.Timeline.call(this, client);

    this._url = 'favorites.atom';

}

// Make StatusNet.TimelineFavorites inherit Timeline's prototype
StatusNet.TimelineFavorites.prototype = heir(StatusNet.Timeline.prototype);
