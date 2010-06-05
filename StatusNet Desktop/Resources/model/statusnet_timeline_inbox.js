/**
 * Constructor for inbox timeline model
 */
StatusNet.TimelineInbox = function(client) {
    StatusNet.Timeline.call(this, client);

    this.timeline_name = 'inbox';

    this._url = 'direct_messages.atom';

}

// Make StatusNet.TimelineInbox inherit Timeline's prototype
StatusNet.TimelineInbox.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Add a notice to the Timeline if it's not already in it. Also
 * adds it to the notice cache.
 *
 * @param DOM     entry    the Atom entry form of the notice
 * @param boolean prepend  whether to add it to the beginning of end of
 * @param boolean notify   whether to show a system notification
 *
 */
StatusNet.TimelineInbox.prototype.addNotice = function(entry, prepend, notify) {

    var notice = StatusNet.AtomParser.noticeFromDMEntry(entry);

    // Dedupe here?
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






