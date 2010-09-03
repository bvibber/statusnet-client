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
 * Constructor for a view for inbox timeline
 */
StatusNet.TimelineViewInbox = function(client) {
    StatusNet.TimelineView.call(this, client);
    this.title = "Inbox for {name} on {site}";
};

// Make StatusNet.TimelineViewInbox inherit TimelineView's prototype
StatusNet.TimelineViewInbox.prototype = heir(StatusNet.TimelineView.prototype);

/**
 * Override to fire StatusNet_appendDirectMessage event
 */
StatusNet.TimelineViewInbox.prototype.appendTimelineNotice = function(notice) {
    
    // XXX: we need a better way of getting the DM's authorUri
    notice.authorUri = this.client.getServer() + notice.nickname;
    
    StatusNet.AvatarCache.lookupAvatar(notice.avatar,
        function(filename) {
            notice.avatar = filename;
            Titanium.App.fireEvent('StatusNet_appendDirectMessage', {dm: notice});
        },
        function(url) {
            Titanium.App.fireEvent('StatusNet_appendDirectMessage', {dm: notice});
        }
    );    
};

