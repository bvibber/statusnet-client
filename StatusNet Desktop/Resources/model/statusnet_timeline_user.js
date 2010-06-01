/**
 * Constructor for user timeline model
 */
StatusNet.TimelineUser = function(client, authorId) {
    StatusNet.Timeline.call(this, client);

    StatusNet.debug("TimelineUser constructor - authorId = " + authorId);

    this.authorId = authorId;

    if (this.authorId === null) {
        StatusNet.debug("TimelineUser constructor - authorId was null");
        this.timeline_name = 'user';
    } else {
        this.timeline_name = 'user-' + authorId;
    }

    StatusNet.debug("TimelineUser constructor - timeline name: " + this.timeline_name);

    this._url = 'statuses/user_timeline.atom';

    this.user = null;

}

// Make StatusNet.TimelineUser inherit Timeline's prototype
StatusNet.TimelineUser.prototype = heir(StatusNet.Timeline.prototype);

StatusNet.TimelineUser.prototype.getUrl = function() {

    var base = StatusNet.Timeline.prototype.getUrl.call(this);

    StatusNet.debug("BASE = " + base);

    StatusNet.debug("TimelineUser.getUrl() this.authorId = " + this.authorId);

    if (this.authorId === null) {
        return base;
    } else {
        var qRegexp = /atom\?/;
        result = base.match(qRegexp);
        if (result) {
            return base + "&user_id=" + this.authorId;
        } else {
            return base + "?user_id=" + this.authorId;
        }
    }
}

/**
 * Update the timeline.  Does a fetch of the Atom feed for the appropriate
 * timeline and notifies the view the model has changed.
 */
StatusNet.TimelineUser.prototype.update = function(onFinish) {

    StatusNet.debug("TimelineUser.update()");

    var that = this;

    this.account.fetchUrl(this.getUrl(),

        function(status, data) {

            that.client.view.hideSpinner();

            StatusNet.debug('Fetched ' + that.getUrl());
            StatusNet.debug('HTTP client returned: ' + data);

            // @todo How we get author info will need to change when we
            // update output to match the latest Activity Streams spec
            var subject = $(data).find("feed > [nodeName=activity:subject]:first");
            that.user = StatusNet.AtomParser.userFromSubject(subject);

            var noticeCnt = 0;

            $(data).find('feed > entry').each(function() {
                StatusNet.debug('TimelineUser.update: found an entry.');
                var notice = StatusNet.AtomParser.noticeFromEntry(this);
                that.addNotice(notice, this, true);
                noticeCnt++;
            });

            if (noticeCnt > 0) {
                that.client.newNoticesSound.play();
            }

            // use events instead? Observer?
            if (onFinish) {
                onFinish();
            }
            that.finishedFetch()
        },
        function(client, msg) {
            StatusNet.debug("Something went wrong retrieving user timeline: " + msg);
            alert("Couldn't get user timeline: " + msg);
        }
    );

}

