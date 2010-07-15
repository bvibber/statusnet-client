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
 * Atom parsing class that understands some Activity Streams data
 */
StatusNet.AtomParser = function() {};

/**
 * Class method for generating a notice obj from an Direct Message Atom entry
 *
 * @param DOM entry the atom entry representing the DM
 *
 */
StatusNet.AtomParser.noticeFromDMEntry = function(entry) {

    var notice = {};

    notice.id = $(entry).find('id');
    notice.title = $(entry).find('title').text();

    // XXX: This is horrible, but until we improve the feed, this is the best
    // handle to the author's nick we have
    var result = notice.title.substr(12).match(/\w+\b/);

    if (result) {
        notice.nickname = result[0];
    }

    notice.content = $(entry).find('content').text();
    notice.author = $(entry).find('author name').text();
    notice.homepage = $(entry).find('author uri').text();

    notice.published = $(entry).find('published').text();
    var updated = $(entry).find('updated').text();

    // knock off the millisecs to make the date string work with humane.js
    notice.updated = updated.substring(0, 19);

    notice.link = $(entry).find('link[rel=alternate]').attr('href');
    notice.avatar = $(entry).find('link[rel=image]').attr('href');

    return notice;
};

/**
 * Class method for generating a notice from an Atom entry
 *
 * @param DOM entry the Atom entry representing the notice
 */
StatusNet.AtomParser.noticeFromEntry = function(entry) {
StatusNet.debug('noticeFromEntry ENTER');
var startTime = Date.now();

    var notice = {};
    var result;

    // note: attribute selectors seem to have problems with [media:width=48]
    $(entry).find('link[rel=avatar]').each(function(i, el) {
        if ($(el).attr('media:width') == '48') {
            notice.avatar = $(el).attr('href');
        }
    });

Titanium.API.info('noticeFromEntry CHECKPOINT A: ' + (Date.now() - startTime) + 'ms');

    // XXX: Special case for search Atom entries
    if (!notice.avatar) {
        notice.avatar = $(entry).find('link[rel=related]').attr('href');
    }

Titanium.API.info('noticeFromEntry CHECKPOINT B: ' + (Date.now() - startTime) + 'ms');

    var notice_info = $(entry).find('[nodeName=statusnet:notice_info]:first');
    notice.id = notice_info.attr('local_id');

    var idRegexp = /(\d)+$/;

Titanium.API.info('noticeFromEntry CHECKPOINT C: ' + (Date.now() - startTime) + 'ms');

    // XXX: Special case for search Atom entries
    if (!notice.id) {
        var searchId = $(entry).find('id').text();
        result = searchId.match(idRegexp);
        if (result) {
            notice.id = result[0];
        }
    }

Titanium.API.info('noticeFromEntry CHECKPOINT D: ' + (Date.now() - startTime) + 'ms');

    // source client
    notice.source = notice_info.attr('source');
    notice.favorite = notice_info.attr('favorite');
    notice.repeated = notice_info.attr('repeated');
    notice.repeat_of = notice_info.attr('repeat_of');

    notice.published = $(entry).find('published').text();
    var updated = $(entry).find('updated').text();

    // knock off the millisecs to make the date string work with humane.js
    notice.updated = updated.substring(0, 19);

Titanium.API.info('noticeFromEntry CHECKPOINT E: ' + (Date.now() - startTime) + 'ms');

    // In most timelines, the plain text version of the notice content
    // is in the second title element in the entry, but in user feeds,
    // it's in the first.
    var titles = $(entry).find('title');
    if (titles.length >= 2) {
        notice.title = $(titles[1]).text();
    } else {
        notice.title = titles.text();
    }

Titanium.API.info('noticeFromEntry CHECKPOINT F: ' + (Date.now() - startTime) + 'ms');

    // atom:source (not the source client, eh) - this might not be in the feed
    notice.atomSource = $(entry).find('source > title').text();

    notice.content = $(entry).find('content').text();
    notice.author = $(entry).find('author name').text();
    notice.authorUri = $(entry).find('author uri').text();
    notice.fullname = $(entry).find('[nodeName=poco:displayName]').text();

    result = notice.authorUri.match(idRegexp);
    if (result) {
        notice.authorId = result[0];
    }

Titanium.API.info('noticeFromEntry CHECKPOINT G: ' + (Date.now() - startTime) + 'ms');

    notice.link = $(entry).find('link[rel=alternate]:eq(1)').attr('href');

Titanium.API.info('noticeFromEntry CHECKPOINT H: ' + (Date.now() - startTime) + 'ms');

    var geoPoint = $(entry).find("[nodeName=georss:point]:first").text();

    if (geoPoint) {
        var gArray = geoPoint.split(' ');
        notice.lat = gArray[0];
        notice.lon = gArray[1];
    }

Titanium.API.info('noticeFromEntry CHECKPOINT I: ' + (Date.now() - startTime) + 'ms');

    notice.contextLink = $(entry).find('link[rel=ostatus:conversation]:first').attr('href');
    notice.inReplyToLink = $(entry).find("[nodeName=thr:in-reply-to]:first").attr('ref');

    if (notice.inReplyToLink) {
        result = notice.inReplyToLink.match(idRegexp);
        if (result) {
            notice.inReplyToId = result[0]; // Could be useful
        }
    }

Titanium.API.info('noticeFromEntry CHECKPOINT J: ' + (Date.now() - startTime) + 'ms');

    var profile_info = $(entry).find('[nodeName=statusnet:profile_info]');
    notice.following = profile_info.attr('following');
    notice.blocking = profile_info.attr('blocking');

    // @todo ostatus:attention ?

    // @todo category / tags / groups ?

var ms = Date.now() - startTime;
Titanium.API.info('noticeFromEntry EXIT: ' + ms + 'ms');
    return notice;
};

StatusNet.AtomParser.parseSubject = function(subject) {

    var author = {};

    author.username = $(subject).find('[nodeName=poco:preferredUsername]').text();
    author.fullname = $(subject).find('[nodeName=poco:displayName]').text();

    author.link = $(subject).find('id').text();

    var result = author.link.match(/(\d)+$/);
    if (result) {
        author.id = result[0];
    } else {
        // try for group id
        result = author.link.match(/group\/(\d)+\/id$/);
        if (result) {
            author.id = result[1];
        }
    }

    var geoPoint = $(subject).find("[nodeName=georss:point]:first").text();

    if (geoPoint) {
        var gArray = geoPoint.split(' ');
        author.lat = gArray[0];
        author.lon = gArray[1];
    }

    author.location = $(subject).find("[nodeName=poco:address] > [nodeName=poco:formatted]:first").text();

    // @todo: this homepage parse is sketchy. If we add other URLs we will need to update
    author.homepage = $(subject).find("[nodeName=poco:urls] > [nodeName=poco:value]:first").text();
    author.bio = $(subject).find('[nodeName=poco:note]').text();

    // note: attribute selectors seem to have problems with [media:width=48]
    $(subject).find('link[rel=avatar]').each(function(i, el) {
        var width = $(el).attr('media:width');
        switch(width) {

            // XXX: Shoulw we parse out the original (real big) avatar?

            case '24':
                author.avatarSmall = $(el).attr('href');
                break;
            case '48':
                author.avatarMedium = $(el).attr('href');
                break;
            case '96':
                author.avatarLarge = $(el).attr('href');
                break;
        }
    });

    return author;
};

/**
 * Class method for generating a user object from an
 * activity:subject.
 *
 * @param DOM subject the Atom feed's activity subject element
 */
StatusNet.AtomParser.userFromSubject = function(subject) {
    return StatusNet.AtomParser.parseSubject(subject);
};

/**
 * Class method for generating an group object from an
 * activity:subject.
 *
 * @param DOM subject the Atom feed's activity subject element
 */
StatusNet.AtomParser.groupFromSubject = function(subject) {
    return StatusNet.AtomParser.parseSubject(subject);
};

StatusNet.AtomParser.getGroup = function(data) {

    var subject = $(data).find("feed > [nodeName=activity:subject]:first");
    var group = StatusNet.AtomParser.groupFromSubject(subject);

    var group_info = $(data).find('feed > [nodeName=statusnet:group_info]:first');
    group.member = group_info.attr('member');
    group.memberCount = group_info.attr('member_count');
    group.blocked = group_info.attr('blocked');

    return group;
};
