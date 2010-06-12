/**
 * Constructor for friends timeline model
 */
StatusNet.TimelineFriends = function(client) {

    StatusNet.Timeline.call(this, client);

    this.timeline_name = 'friends_timeline';

    // set window title here?

    this._url = 'statuses/friends_timeline.atom';

}

// Make StatusNet.TimelineFriends inherit Timeline's prototype
StatusNet.TimelineFriends.prototype = heir(StatusNet.Timeline.prototype);

