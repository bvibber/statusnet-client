/**
 * Constructor for subscriptions model
 */
StatusNet.TimelineSubscriptions = function(client, authorId) {
    StatusNet.Timeline.call(this, client);

    this._users = [];

    this.userAdded = new StatusNet.Event(this);

    StatusNet.debug("TimelineSubscriptions constructor - authorId = " + authorId);

    this.authorId = authorId;

    if (this.authorId === null) {
        StatusNet.debug("TimelineSubscriptions constructor - authorId was null");
        this.timeline_name = 'subscriptions';
    } else {
        this.timeline_name = 'subscriptions-' + authorId;
    }

    // @todo subscription paging - defaults to 100 latest subs
    this._url = 'statuses/friends.xml?count=100';

    StatusNet.debug("TimelineSubscriptions constructor - timeline name: " + this.timeline_name);
}

// Make StatusNet.TimelineSubscriptions inherit Timeline's prototype
StatusNet.TimelineSubscriptions.prototype = heir(StatusNet.Timeline.prototype);

StatusNet.TimelineSubscriptions.prototype.getUrl = function() {

    var base = StatusNet.Timeline.prototype.getUrl.call(this);

    StatusNet.debug("BASE = " + base);

    StatusNet.debug("TimelineSubscriptions.getUrl() this.authorId = " + this.authorId);

    if (this.authorId === null) {
        return base;
    } else {
        return base + "&user_id=" + this.authorId;
    }
}

StatusNet.TimelineSubscriptions.prototype.addUser = function(userXml) {

    // parse user
    StatusNet.debug("Parse User");

    var user = {};

    user.id = $(userXml).find('id:first').text();
    user.fullname = $(userXml).find('name').text();
    user.username = $(userXml).find('screen_name').text();
    user.bio = $(userXml).find('description').text();
    user.avatar = $(userXml).find('profile_image_url').text();
    user.homepage = $(userXml).find('url').text();
    user.location = $(userXml).find('location').text();
    user.followers_cnt = $(userXml).find('followers_count').text();
    user.friends_cnt = $(userXml).find('friends_count').text();
    user.statuses_cnt = $(userXml).find('statuses_count').text();
    user.favorites_cnt = $(userXml).find('favourites_count').text();
    user.following = $(userXml).find('following').text();

    this._users.unshift(user);

    this.userAdded.notify({user: user});
}

StatusNet.TimelineSubscriptions.prototype.update = function(onFinish) {

    StatusNet.debug("TimelineSubscriptions.update()");

    this.updateStart.notify();

    var that = this;

    this.account.fetchUrl(this.getUrl(),

        function(status, data) {

            that.client.view.hideSpinner();

            var users = [];

            $(data).find('users > user').each(function() {
                StatusNet.debug('TimelineSubscriptions.update: found user.');
                users.push(this);
            });

            users.reverse();

            for (var i = 0; i < users.length; i++) {
                that.addUser(users[i]);
            }

            that.updateFinished.notify();

            if (onFinish) {
                onFinish();
            }
            that.finishedFetch()
        },
        function(client, msg) {
            StatusNet.debug("Something went wrong retrieving subscriptions: " + msg);
            alert("Couldn't get subscriptions: " + msg);
        }
    );

}

/**
 * Don't cache subscription info
 */
StatusNet.TimelineSubscriptions.prototype.cacheable = function() {
    return false;
}

/**
 * Accessor for users
 *
 * @return Array an array of users
 */
StatusNet.TimelineSubscriptions.prototype.getUsers = function() {
    return this._users;
}

/**
 * Do anything that needs doing after retrieving timeline data.
 */
StatusNet.TimelineSubscriptions.prototype.finishedFetch = function() {
    if (this._users.length === 0) {
        this.client.getActiveView().showEmptyTimeline();
    }
}

