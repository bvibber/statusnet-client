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
 * View class for managing the sidebar
 */
StatusNet.Sidebar = function() {};

/**
 * Class method to higlight the icon associated with the selected timeline
 *
 * @param String timeline   the timeline to highlight
 */
StatusNet.Sidebar.setSelectedTimeline = function(timeline) {

    switch(timeline) {
        case 'friends':
            $('#public_img').attr('class', '');
            $('#user_img').attr('class', 'rounded');
            $('#friends_img').attr('src', '/images/blue/chat.png');
            $('#mentions_img').attr('src', '/images/at.png');
            $('#favorites_img').attr('src', '/images/star.png');
            $('#inbox_img').attr('src', '/images/mail.png');
            $('#allgroups_img').attr('src', '/images/users.png');
            $('#search_img').attr('src', '/images/magnifier.png');
            break;
        case 'mentions':
            $('#public_img').attr('class', '');
            $('#user_img').attr('class', 'rounded');
            $('#friends_img').attr('src', '/images/chat.png');
            $('#mentions_img').attr('src', '/images/blue/at.png');
            $('#favorites_img').attr('src', '/images/star.png');
            $('#inbox_img').attr('src', '/images/mail.png');
            $('#allgroups_img').attr('src', '/images/users.png');
            $('#search_img').attr('src', '/images/magnifier.png');
            break;
        case 'favorites':
            $('#public_img').attr('class', '');
            $('#user_img').attr('class', 'rounded');
            $('#friends_img').attr('src', '/images/chat.png');
            $('#mentions_img').attr('src', '/images/at.png');
            $('#favorites_img').attr('src', '/images/blue/star.png');
            $('#inbox_img').attr('src', '/images/mail.png');
            $('#allgroups_img').attr('src', '/images/users.png');
            $('#search_img').attr('src', '/images/magnifier.png');
            break;
        case 'inbox':
            $('#public_img').attr('class', '');
            $('#user_img').attr('class', 'rounded');
            $('#friends_img').attr('src', '/images/chat.png');
            $('#mentions_img').attr('src', '/images/at.png');
            $('#favorites_img').attr('src', '/images/star.png');
            $('#inbox_img').attr('src', '/images/blue/mail.png');
            $('#allgroups_img').attr('src', '/images/users.png');
            $('#search_img').attr('src', '/images/magnifier.png');
            break;
        case 'allgroups':
            $('#public_img').attr('class', '');
            $('#user_img').attr('class', 'rounded');
            $('#friends_img').attr('src', '/images/chat.png');
            $('#mentions_img').attr('src', '/images/at.png');
            $('#favorites_img').attr('src', '/images/star.png');
            $('#inbox_img').attr('src', '/images/mail.png');
            $('#allgroups_img').attr('src', '/images/blue/users.png');
            $('#search_img').attr('src', '/images/magnifier.png');
            break;
        case 'search':
            $('#public_img').attr('class', '');
            $('#user_img').attr('class', 'rounded');
            $('#friends_img').attr('src', '/images/chat.png');
            $('#mentions_img').attr('src', '/images/at.png');
            $('#favorites_img').attr('src', '/images/star.png');
            $('#inbox_img').attr('src', '/images/mail.png');
            $('#allgroups_img').attr('src', '/images/users.png');
            $('#search_img').attr('src', '/images/blue/magnifier.png');
            break;
        case 'user':
            $('#public_img').attr('class', '');
            $('#user_img').attr('class', 'rounded opaque');
            $('#friends_img').attr('src', '/images/chat.png');
            $('#mentions_img').attr('src', '/images/at.png');
            $('#favorites_img').attr('src', '/images/star.png');
            $('#inbox_img').attr('src', '/images/mail.png');
            $('#allgroups_img').attr('src', '/images/users.png');
            $('#search_img').attr('src', '/images/magnifier.png');
            break;
        case 'public':
            $('#public_img').attr('class', 'opaque');
            $('#user_img').attr('class', 'rounded');
            $('#friends_img').attr('src', '/images/chat.png');
            $('#mentions_img').attr('src', '/images/at.png');
            $('#favorites_img').attr('src', '/images/star.png');
            $('#inbox_img').attr('src', '/images/mail.png');
            $('#allgroups_img').attr('src', '/images/users.png');
            $('#search_img').attr('src', '/images/magnifier.png');
            break;
        default:
            $('#public_img').attr('class', '');
            $('#user_img').attr('class', 'rounded');
            $('#friends_img').attr('src', '/images/chat.png');
            $('#mentions_img').attr('src', '/images/at.png');
            $('#favorites_img').attr('src', '/images/star.png');
            $('#inbox_img').attr('src', '/images/mail.png');
            $('#allgroups_img').attr('src', '/images/users.png');
            $('#search_img').attr('src', '/images/magnifier.png');

            StatusNet.debug("I don\'t know how to highlight this timeline.");
            break;
    }

};
