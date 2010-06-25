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

