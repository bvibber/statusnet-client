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
 * StatusNet Desktop - a client for the StatusNet microblogging tool
 * Copyright 2010, StatusNet, Inc.
 * http://status.net/
 *
 * StatusNet Desktop is freely distributable under the terms of the Apache 2.0 license.
 * See: LICENSE.txt or http://www.apache.org/licenses/LICENSE-2.0
 */
$LAB
    .script("statusnet.js").wait()
    .script("model/statusnet_account.js")
    .script("view/statusnet_sidebar.js")
    .script("view/statusnet_infobar.js")
    .script("statusnet_client.js")
    .script("view/statusnet_timelineview.js")
    .script("view/statusnet_timelineview_user.js")
    .script("view/statusnet_timelineview_group.js")
    .script("view/statusnet_timelineview_inbox.js")
    .script("view/statusnet_timelineview_search.js")
    .script("view/statusnet_timelineview_subscriptions.js")
    .script("model/statusnet_timeline.js")
    .script("model/statusnet_timeline_friends.js")
    .script("model/statusnet_timeline_user.js")
    .script("model/statusnet_timeline_group.js")
    .script("model/statusnet_timeline_inbox.js")
    .script("model/statusnet_timeline_search.js")
    .script("model/statusnet_timeline_subscriptions.js")
    .script('model/statusnet_atom_parser.js')
    .script("humane.js")
    .wait(function(){

    var db = StatusNet.getDB();

    var ac = StatusNet.Account.getDefault(db);

    var snc = null;

    if (ac === null) {
        StatusNet.showSettings();
    } else {
        snc = new StatusNet.Client(ac);
    }

});
