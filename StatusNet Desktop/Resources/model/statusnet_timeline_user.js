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
 * Add a notice to the Timeline if it's not already in it.
 *
 * XXX: Override so user timelines do not get cached. Not
 * sure how else to handle at the moment since atom entries in
 * user timelines are different than they are in other timelines.
 * We may need a special cache facility just for user atom
 * entries. --Z
 *
 * @param DOM     entry    the Atom entry form of the notice
 * @param boolean prepend  whether to add it to the beginning of end of
 *                         the timeline's notices array
 * @param boolean notify   whether to show a system notification
 *
 */
StatusNet.TimelineUser.prototype.addNotice = function(entry, prepend, notify) {

    var notice = StatusNet.AtomParser.noticeFromEntry(entry);

    // dedupe here?
    for (i = 0; i < this._notices.length; i++) {
        if (this._notices[i].id === notices.id) {
            StatusNet.debug("skipping duplicate notice: " + notice.id);
            return;
        }
    }

    if (prepend) {
        this._notices.unshift(notice);
        this.client.view.showNewNotice(notice);
    } else {
        this._notices.push(notice);
    }

    if (notify) {
        this.client.view.showNotification(notice);
    }
}

/**
 * Update the timeline.  Does a fetch of the Atom feed for the appropriate
 * timeline and notifies the view the model has changed.
 */
StatusNet.TimelineUser.prototype.update = function(onFinish, notifications) {

    StatusNet.debug("TimelineUser.update() - notifications = " + notifications);

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

            var entries = [];

            $(data).find('feed > entry').each(function() {
                StatusNet.debug('TimelineUser.update: found an entry.');
                entries.push(this);
            });

            entries.reverse(); // keep correct notice order

            for (var i = 0; i < entries.length; i++) {
                that.addNotice(entries[i], true, notifications);
            }

            if (entries.length > 0 && notifications) {
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

