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
 * Iterate over all direct children of the given DOM node, calling functions from a map
 * based on the element's node name. This is used because doing a bunch of individual selector
 * lookups for every element we need is hella slow on mobile; iterating directly over the
 * element set has a lot less overhead.
 *
 * @param DOMNode parent
 * @param object map dictionary of node names to functions, which will have the child element passed to them.
 * @access private
 */
StatusNet.AtomParser.mapOverElements = function(parent, map) {
    Titanium.API.info('WWW IN');
    var origstart = Date.now();
    var list = parent.childNodes;
    var ms = Date.now() - origstart;
    Titanium.API.info('WWW - ' + ms + 'ms to get child nodes');
    var last = list.length;
    for (var i = 0; i < last; i++) {
        var el = list.item(i);
        if (map[el.nodeName] !== undefined) {
            map[el.nodeName](el);
        }
    }
    var ms = Date.now() - origstart;
    Titanium.API.info('WWW OUT - ' + ms + 'ms to process group in ' + parent.nodeName);
}

/**
 * Class method for generating a notice from an Atom entry
 *
 * @param DOM entry the Atom entry representing the notice
 */
StatusNet.AtomParser.noticeFromEntry = function(entry) {
StatusNet.debug('noticeFromEntry ENTER');
var startTime = Date.now();

    if (entry.documentElement) {
        var $entry = $(entry).find('entry');
        entry = $entry[0];
    } else {
        var $entry = $(entry);
    }

    var notice = {};

Titanium.API.info('noticeFromEntry CHECKPOINT A: ' + (Date.now() - startTime) + 'ms');

    // STUFF IN THE <entry>
    var idRegexp = /^(\d)+$/;
    var simpleNode = function(el) {
        notice[el.nodeName] = $(el).text();
    };

    StatusNet.AtomParser.mapOverElements(entry, {
        'id': function(el) {
            // XXX: Special case for search Atom entries
            var searchId = $(el).text();
            if (searchId.substr(0, 4) == 'tag:') {
                var result = searchId.match(idRegexp);
                if (result) {
                    notice.id = result[0];
                }
            }
        },
        'statusnet:notice_info': function(el) {
            notice.id = el.getAttribute('local_id');

            // source client
            notice.source = el.getAttribute('source');
            notice.favorite = el.getAttribute('favorite');
            notice.repeated = el.getAttribute('repeated');
            notice.repeat_of = el.getAttribute('repeat_of');
        },
        'published': simpleNode,
        'updated': function(el) {
            var updated = $(el).text();

            // knock off the millisecs to make the date string work with humane.js
            notice.updated = updated.substring(0, 19);
        },
        'title': simpleNode,
        'content': simpleNode, // @fixme this should actually handle more complex cases, as there may be different data types
        'source': function(el) {
            // atom:source (not the source client, eh) - this might not be in the feed
            StatusNet.AtomParser.mapOverElements(el, {
                'title': function(elem) {
                    notice.atomSource = $(elem).text();
                }
            });
        },
        'author': function(el) {
            StatusNet.AtomParser.mapOverElements(el, {
                'name': function(elem) {
                    notice.author = $(elem).text();
                },
                'uri': function(elem) {
                    notice.authorUri = $(elem).text();
                    var result = notice.authorUri.match(idRegexp);
                    if (result) {
                        notice.authorId = result[0];
                    }
                },
                'statusnet:profile_info': function(elem) {
                    notice.following = elem.getAttribute('following');
                    notice.blocking = elem.getAttribute('blocking');
                }
            });
        },
        'activity:actor': function(el) {
            StatusNet.AtomParser.mapOverElements(el, {
                'poco:displayName': function(elem) {
                    notice.fullname = $(elem).text();
                },
                'link': function(elem) {
                    // @fixme accept other image sizes
                    if (elem.getAttribute('rel') == 'avatar' && elem.getAttribute('media:width') == StatusNet.Platform.avatarSize()) {
                        notice.avatar = elem.getAttribute('href');
                    }
                }
            });        
        },
        'link': function(el) {
            var rel = el.getAttribute('rel');
            var type = el.getAttribute('type');
            if (rel == 'alternate') {
                notice.link = el.getAttribute('href');
            } else if (rel == 'ostatus:conversation') {
                notice.contextLink = el.getAttribute('href');
            } else if (rel == 'related' && (type == 'image/png' || type == 'image/jpeg' || type == 'image/gif')) {
                // XXX: Special case for search Atom entries
                if (!notice.avatar) {
                    notice.avatar = el.getAttribute('href');
                }
            }
        },
        'georss:point': function(el) {
            // @fixme comma is also a valid separator
            var gArray = $(el).text().split(' ');
            notice.lat = gArray[0];
            notice.lon = gArray[1];
        },
        'thr:in-reply-to': function(el) {
            notice.inReplyToLink = el.getAttribute('ref');
            var result = notice.inReplyToLink.match(idRegexp);
            if (result) {
                notice.inReplyToId = result[0]; // Could be useful
            }
        }
    });

    // @todo ostatus:attention ?

    // @todo category / tags / groups ?

var ms = Date.now() - startTime;
Titanium.API.info('noticeFromEntry CHECKPOINT EXIT: ' + ms + 'ms');
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
