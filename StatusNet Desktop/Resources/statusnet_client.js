/**
 * StatusNet Desktop
 *
 * Copyright 2010 StatusNet, Inc.
 * Based in part on Tweetanium
 * Copyright 2008-2009 Kevin Whinnery and Appcelerator, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Constructor for UI manager class for the client.
 *
 * @param StatusNet.Account _account
 * @return StatusNet.Client object
 */
StatusNet.Client = function(_account) {

    this.account = _account;

    this.timeline = new StatusNet.TimelineFriends(this);
    this.view = new StatusNet.TimelineViewFriends(this);

    this.init();

	this.view.showHeader();
    this.view.show();
    this.timeline.update();

    var that = this;

    // @todo: refresh multiple timelines in the background

    this.refresh = setInterval(
        function() {
            StatusNet.debug("Refreshing visible timeline.");
            that.timeline.update(null, true);
        },
        60000
    );

}

StatusNet.Client.prototype.getActiveTimeline = function() {
    if (this.timeline) {
        return this.timeline;
    } else {
        StatusNet.debug("Client.getActiveTimeline() - null timeline, help!");
    }
}

StatusNet.Client.prototype.getActiveView = function() {
    if (this.view) {
        return this.view;
    } else {
        StatusNet.debug("Client.getActiveView() - null view, help!");
    }
}

StatusNet.Client.prototype.getServer = function() {
    return this.server;
}

/**
 * Switch the view to a specified timeline
 *
 * @param String timeline   the timeline to show
 */
StatusNet.Client.prototype.switchTimeline = function(timeline) {

    StatusNet.debug("StatusNet.Client.prototype.switchTimeline()");

    var that = this;

    switch (timeline) {

        case 'public':
            this.timeline = new StatusNet.TimelinePublic(this);
            this.view = new StatusNet.TimelineViewPublic(this);
            break;
        case 'user':
            this.switchUserTimeline();
            return;
            break;
        case "friends":
            this.timeline = new StatusNet.TimelineFriends(this);
            this.view = new StatusNet.TimelineViewFriends(this);
            break;
        case 'mentions':
            this.timeline = new StatusNet.TimelineMentions(this);
            this.view = new StatusNet.TimelineViewMentions(this);
            break;
        case 'favorites':
            this.timeline = new StatusNet.TimelineFavorites(this);
            this.view = new StatusNet.TimelineViewFavorites(this);
            break;
        case 'inbox':
            this.timeline = new StatusNet.TimelineInbox(this);
            this.view = new StatusNet.TimelineViewInbox(this);
            break;
        case 'search':
            this.timeline = new StatusNet.TimelineSearch(this);
            this.view = new StatusNet.TimelineViewSearch(this);
            break;
        default:
            throw new Exception("Gah wrong timeline");
    }

    StatusNet.Sidebar.setSelectedTimeline(timeline);

    clearInterval(this.refresh);

    this.view.showHeader();
    this.view.show();

    // @todo save scroll state
    $("#body").scrollTop(0);

    this.timeline.update(null);

    // @todo multiple timeline auto-refresh

    if (timeline !== 'user' && timeline !== 'inbox' && timeline !== 'search') {
        this.refresh = setInterval(
            function() {
                StatusNet.debug("Refreshing visible timeline.");
                that.timeline.update(function(notice_count) {
                    if (notice_count > 0) {
                        StatusNet.Infobar.flashMessage(
                            notice_count
                            + " new notices in "
                            + that.timeline.timeline_name
                        );
                        that.newNoticesSound.play();
                    }
                });
            },
            60000 // @todo Make this configurable
        );
    }
}

/**
 * Switch the user timeline based on the ID of the user. This only
 * works for local users.  Remote user timeline open in a browser.
 *
 * @param int authorId ID of the (local site) user to display
 */
StatusNet.Client.prototype.switchUserTimeline = function(authorId) {

    StatusNet.debug("in switchUserTimeline()");

    var timeline = 'user';

    if (authorId) {
        StatusNet.debug("authorID is " + authorId);
        timeline = 'user' + '-' + authorId;
        this.timeline = new StatusNet.TimelineUser(this, authorId);
    } else {
        StatusNet.debug("authorId is null");
        this.timeline = new StatusNet.TimelineUser(this, null);
    }

    this.view = new StatusNet.TimelineViewUser(this);

    clearInterval(this.refresh);

    StatusNet.Sidebar.setSelectedTimeline(timeline);

    var that = this;

    this.timeline.update(
        function() {
            that.view.showHeader();
            that.view.show();
            $("#body").scrollTop(0);
        },
        false
    );
}

StatusNet.Client.prototype.showSubscriptions = function(authorId) {

    StatusNet.debug("in showSubscriptions()");

    if (authorId === null) {
        StatusNet.debug("authorId is null");
        this.timeline = new StatusNet.TimelineSubscriptions(this)
    } else {
        StatusNet.debug("authorID is " + authorId);
        this.timeline = new StatusNet.TimelineSubscriptions(this, authorId);
    }

    this.view = new StatusNet.TimelineViewSubscriptions(this);

    clearInterval(this.refresh);

    var that = this;

    this.timeline.update(
        function() {
            that.view.showHeader();
            that.view.show();
            $("#body").scrollTop(0);
        }
    );
}

StatusNet.Client.prototype.showGroupTimeline = function(groupId) {
    StatusNet.debug("in showGroupTimeline()");

    StatusNet.debug("group ID is " + groupId);
    timeline = 'user' + '-' + groupId;
    this.timeline = new StatusNet.TimelineGroup(this, groupId);
    this.view = new StatusNet.TimelineViewGroup(this);

    clearInterval(this.refresh);

    var that = this;

    this.timeline.update(
        function() {
            that.view.showHeader();
            that.view.show();
            $("#body").scrollTop(0);
        },
        false
    );
}

StatusNet.Client.prototype.showTagTimeline = function(tag) {
    StatusNet.debug("in showTagTimeline() for tag: " + tag);

    this.timeline = new StatusNet.TimelineTag(this, tag);
    this.view = new StatusNet.TimelineViewTag(this);

    StatusNet.debug("finished constructing objs");

    clearInterval(this.refresh);

    var that = this;

    StatusNet.debug("Updating");
    this.timeline.update(
        function() {
            that.view.showHeader();
            that.view.show();
            $("#body").scrollTop(0);
        },
        false
    );
}

/**
 * General initialization stuff
 */
StatusNet.Client.prototype.init = function() {

    var that = this;

    this.server = this.account.apiroot.substr(0, this.account.apiroot.length - 4); // hack for now

    if (this.account.siteLogo) {
        $('#public_img').attr('src', this.account.siteLogo);
    } else {
        $('#public_img').attr('src', '/images/logo.png');
    }

    // Add event handlers for buttons

    $('#public_img').bind('click', function() { that.switchTimeline('public'); });
    $('#friends_img').bind('click', function() { that.switchTimeline('friends'); });
    $('#user_img').bind('click', function() { that.switchTimeline('user'); });
    $('#mentions_img').bind('click', function() { that.switchTimeline('mentions'); });
    $('#favorites_img').bind('click', function() { that.switchTimeline('favorites'); });
    $('#inbox_img').bind('click', function() { that.switchTimeline('inbox'); });
    $('#search_img').bind('click', function() { that.switchTimeline('search'); });
    $('#settings_img').bind('click', function() { StatusNet.showSettings(); });

    // make links open in an external browser window
    $('a[rel=external]').live('click', function() {
        Titanium.Desktop.openURL($(this).attr('href'));
        return false;
    });

    // XXX: Woah, make sure the href in the HTML link has a # in it, or Titanium goes nutso
    // and adds additional event handlers! (last one from above?)
    $('a#new_notice').bind('click', function() { that.newNoticeDialog(); });

    // setup sounds
    this.newNoticesSound = Titanium.Media.createSound('app://sounds/kalimba.wav');
}

/**
 * Show notice input dialog
 */
StatusNet.Client.prototype.newNoticeDialog = function(replyToId, replyToUsername) {
    var win = Titanium.UI.getCurrentWindow().createWindow({
        url: 'app:///new_notice.html',
        title: 'New notice',
        width: 420,
        height: 120});

    // Pass the reply-to info in via the window itself.
    // XXX: Is there a better way?

    if (replyToId) {
        win.setTitle('Replying to ' + replyToUsername);
        win.replyToId = replyToId;
        win.replyToUsername = replyToUsername;
    }

    var that = this;

    win.addEventListener(Titanium.CLOSE, function(event) {
        that.timeline.update();
    });

    win.open();
}

/**
 * Show direct message input dialog
 */
StatusNet.Client.prototype.directMessageDialog = function(nickname) {
    var win = Titanium.UI.getCurrentWindow().createWindow({
        url: 'app:///direct_message.html',
        title: 'New Direct Message',
        width: 420,
        height: 120});

    if (nickname) {
        win.setTitle('New Direct Message To: ' + nickname);
        win.nickname = nickname;
    }

    win.open();
}

/**
 * Delete a notice from the timeline
 *
 * @param int noticeId  the ID of the notice to delete
 */
StatusNet.Client.prototype.deleteNotice = function(noticeId, linkDom) {

    var url = 'statuses/destroy/' + noticeId + '.json';

    StatusNet.debug("StatusNet.Client.deleteNotice() - deleting notice " + noticeId);

    $(linkDom).attr('disabled', 'disabled');

    var params = "gar=gar"; // XXX: we have to pass something to get web client to work

    var that = this;

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(status);
            StatusNet.debug(data);
            that.timeline.decacheNotice(noticeId);
            that.view.removeNotice(noticeId);
         },
         function(client, responseText) {
             $(linkDom).removeAttr('disabled');
             var msg = Titanium.JSON.parse(responseText);
             StatusNet.debug('Error deleting notice: ' + msg.error);
             alert('Error deleting notice: ' + msg.error);
         }
    );
}

/**
 * Favorite a notice
 *
 * Change the class on the notice's fave link from notice_fave to
 * notice_unfave and refresh the notice entry in the cache so it has
 * the right state
 *
 * @param int noticeId  the ID of the notice to delete
 * @param DOM linkDom   the link element
 *
 */
StatusNet.Client.prototype.faveNotice = function(noticeId, linkDom)
{
    var url = 'favorites/create/' + noticeId + '.json';

    StatusNet.debug("StatusNet.Client.faveNotice() - faving notice " + noticeId);

    $(linkDom).attr('disabled', 'disabled');

    var params = "gar=gar"; // XXX: we have to pass something to get web client to work

    var that = this;

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(status);
            StatusNet.debug(data);
            $(linkDom).text('Unfave');
            $(linkDom).removeClass('notice_fave');
            $(linkDom).addClass('notice_unfave');
            that.timeline.refreshNotice(noticeId);
        },
        function(client, responseText) {
            $(linkDom).removeAttr('disabled');
            var msg = Titanium.JSON.parse(responseText);
            StatusNet.debug('Error favoriting notice: ' + msg.error);
            alert('Error favoriting notice: ' + msg.error);
        }
    );
}

/**
 * Unfavorite a notice
 *
 * Change the class on the notice's unfave link from notice_unfave
 * to notice_fave and refresh the notice entry in the cache so it has
 * the right state.
 *
 * @param int noticeId  the ID of the notice to delete
 * @param DOM linkDom   the link element
 *
 */
StatusNet.Client.prototype.unFaveNotice = function(noticeId, linkDom)
{
    var url = 'favorites/destroy/' + noticeId + '.json';

    StatusNet.debug("StatusNet.Client.unFaveNotice() - unfaving notice " + noticeId);

    $(linkDom).attr('disabled', 'disabled');

    var params = "gar=gar"; // XXX: we have to pass something to get web client to work

    var that = this;

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(status);
            StatusNet.debug(data);
            $(linkDom).text('Fave');
            $(linkDom).removeClass('notice_unfave');
            $(linkDom).addClass('notice_fave');
            that.timeline.refreshNotice(noticeId);
        },
        function(client, responseText) {
            $(linkDom).removeAttr('disabled');
            var msg = Titanium.JSON.parse(responseText);
            StatusNet.debug('Error unfavoring notice: ' + msg.error);
            alert('Error unfavoring notice: ' + msg.error);
        }
    );
}

/**
 * Repeat a notice
 *
 * @param int noticeId  the ID of the notice to delete
 * @param DOM linkDom   the link element
 *
 * On success, removes the repeat link and refreshes the notice entry
 * in the cache so it has the right state.
 */
StatusNet.Client.prototype.repeatNotice = function(noticeId, linkDom)
{
    var url = 'statuses/retweet/' + noticeId + '.json';

    $(linkDom).attr('disabled', 'disabled');

    StatusNet.debug("StatusNet.Client.repeatNotice() - repeating notice " + noticeId);

    var params = "gar=gar"; // XXX: we have to pass something to get web client to work

    var that = this;

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(status);
            StatusNet.debug(data);
            $(linkDom).remove();
            that.timeline.refreshNotice(noticeId);
            that.timeline.update();
        },
        function(client, responseText) {
            $(linkDom).removeAttr('disabled');
            var msg = Titanium.JSON.parse(responseText);
            StatusNet.debug('Error repeating notice: ' + msg.error);
            alert('Error repeating notice: ' + msg.error);
        }
    );
}

/**
 * Subscribe to a profile
 *
 * @param int profileId  the ID of the profile to subscribe to
 * @param DOM linkDom    the link element
 *
 * On success changes the link to an unsubscribe link
 */
StatusNet.Client.prototype.subscribe = function(profileId, linkDom)
{
    var url = 'friendships/create/' + profileId + '.json';

    $(linkDom).attr('disabled', 'disabled');

    StatusNet.debug("StatusNet.Client.subscribe() - subscribing to " + profileId);

    var params = "gar=gar"; // XXX: we have to pass something to get web client to work

    var that = this;

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(status);
            StatusNet.debug(data);
            $(linkDom).text('Unsubscribe');
            $(linkDom).removeClass('profile_subscribe');
            $(linkDom).addClass('profile_unsubscribe');
            $(linkDom).unbind('click');
            $(linkDom).bind('click',
                function(event) {
                    that.unsubscribe(profileId, linkDom);
                }
            );
        },
        function(client, responseText) {
            $(linkDom).removeAttr('disabled');
            var msg = Titanium.JSON.parse(responseText);
            StatusNet.debug('Error subscribing to profile: ' + msg.error);
            alert('Error subscribing to profile: ' + msg.error);
        }
    );
}

/**
 * Unsubscribe from a profile
 *
 * @param int profileId  the ID of the profile to unsubscribe from
 * @param DOM linkDom    the link element
 *
 * On success changes the link to a subscribe link
 *
 */
StatusNet.Client.prototype.unsubscribe = function(profileId, linkDom)
{
    var url = 'friendships/destroy/' + profileId + '.json';

    $(linkDom).attr('disabled', 'disabled');

    StatusNet.debug("StatusNet.Client.unsubscribe() - unsubscribing from " + profileId);

    var params = "gar=gar"; // XXX: we have to pass something to get web client to work

    var that = this;

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(status);
            StatusNet.debug(data);
            $(linkDom).text('Subscribe');
            $(linkDom).removeClass('profile_unsubscribe');
            $(linkDom).addClass('profile_subscribe');
            $(linkDom).unbind('click');
            $(linkDom).bind('click',
                function(event) {
                    that.subscribe(profileId, linkDom);
                }
            );
        },
        function(client, responseText) {
            $(linkDom).removeAttr('disabled');
            var msg = Titanium.JSON.parse(responseText);
            StatusNet.debug('Error unsubscribing from profile: ' + msg.error);
            alert('Error unsubscribing from profile: ' + msg.error);
        }
    );
}

/**
 * Join a group
 *
 * @param int groupId  the ID of the group to join
 * @param DOM linkDom  the link element
 *
 * On success changes the link to a leave link
 *
 */
StatusNet.Client.prototype.joinGroup = function(groupId, linkDom)
{
    var url = 'statusnet/groups/join/' + groupId + '.json';

    $(linkDom).attr('disabled', 'disabled');

    StatusNet.debug("StatusNet.Client.joinGroup() - joining group " + groupId);

    var params = "gar=gar"; // XXX: we have to pass something to get web client to work

    var that = this;

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(status);
            StatusNet.debug(data);
            $(linkDom).text('Leave');
            $(linkDom).removeClass('group_join');
            $(linkDom).addClass('group_leave');
            $(linkDom).unbind('click');
            $(linkDom).bind('click',
                function(event) {
                    that.leaveGroup(groupId, linkDom);
                }
            );
        },
        function(client, responseText) {
            $(linkDom).removeAttr('disabled');
            var msg = Titanium.JSON.parse(responseText);
            StatusNet.debug('Error joining group: ' + msg.error);
            alert('Error joining group: ' + msg.error);
        }
    );
}

/**
 * Leave a group
 *
 * @param int groupId  the ID of the group to leave
 * @param DOM linkDom  the link element
 *
 * On success changes the link to a join link
 *
 */
StatusNet.Client.prototype.leaveGroup = function(groupId, linkDom)
{
    var url = 'statusnet/groups/leave/' + groupId + '.json';

    $(linkDom).attr('disabled', 'disabled');

    StatusNet.debug("StatusNet.Client.leaveGroup() - leaving group " + groupId);

    var params = "gar=gar"; // XXX: we have to pass something to get web client to work

    var that = this;

    this.account.postUrl(url, params,
        function(status, data) {
            StatusNet.debug(status);
            StatusNet.debug(data);
            $(linkDom).text('Join');
            $(linkDom).removeClass('group_leave');
            $(linkDom).addClass('group_join');
            $(linkDom).unbind('click');
            $(linkDom).bind('click',
                function(event) {
                    that.joinGroup(groupId, linkDom);
                }
            );
        },
        function(client, responseText) {
            $(linkDom).removeAttr('disabled');
            var msg = Titanium.JSON.parse(responseText);
            StatusNet.debug('Error leaving group: ' + msg.error);
            alert('Error leaving group: ' + msg.error);
        }
    );
}
