/**
 * Constructor for user timeline model
 */
StatusNet.TimelineUser = function(client, authorId) {
    StatusNet.Timeline.call(this, client);

    this.authorId = authorId;

    if (this.authorId === null) {
        this.timeline_name = 'user';
    } else {
        this.timeline_name = 'user-' + authorId;
    }

    this._url = 'statuses/user_timeline.atom';

    this.user = null;

}

// Make StatusNet.TimelineUser inherit Timeline's prototype
StatusNet.TimelineUser.prototype = heir(StatusNet.Timeline.prototype);

StatusNet.TimelineUser.prototype.getUrl = function() {

    StatusNet.debug("TimelineUser.getUrl() this.authorId = " + this.authorId);

    if (this.authorId === null) {
        return this._url;
    } else {
        return this._url + "?user_id=" + this.authorId;
    }
}

/**
 * Update the timeline.  Does a fetch of the Atom feed for the appropriate
 * timeline and notifies the view the model has changed.
 */
StatusNet.TimelineUser.prototype.update = function() {

    var that = this;

    this.account.fetchUrl(this.getUrl(),

        function(status, data) {

            StatusNet.debug('Fetched ' + that._url);
            StatusNet.debug('HTTP client returned: ' + data);

            // @todo How we get author info will need to change when we
            // update output to match the latest Activity Streams spec
            var subject = $(data).find("feed > [nodeName=activity:subject]:first");
            that.user = StatusNet.AtomParser.userFromSubject(subject);

            $(data).find('feed > entry').each(function() {
                StatusNet.debug('Timeline.update: found an entry.');
                var notice = StatusNet.AtomParser.noticeFromEntry(this);
                that.addNotice(notice, this, false);
            });

            // use events instead? Observer?
            that.finishedFetch()
        },
        function(client, msg) {
            StatusNet.debug("Something went wrong retrieving timeline: " + msg);
            alert("Couldn't get timeline: " + msg);
        }
    );

}

