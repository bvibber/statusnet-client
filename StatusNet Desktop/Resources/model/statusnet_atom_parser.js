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
    var matches = StatusNet.AtomParser.mapOverElementsHelper(parent, map);
    var last = matches.length;
    for (var i = 0; i < last; i++) {
        var match = matches[i];
        map[match.name](match);
    }
}

/**
 * Inner loop to pull the matching nodes...
 * ...this is very slow on Android.
 */
StatusNet.AtomParser.mapOverElementsHelper = function(parent, map) {
    var matches = [];
    var list = parent.childNodes;
    var last = list.length;
    for (var i = 0; i < last; i++) {
        var el = list.item(i);
        var name = el.nodeName;
        if (map[name] !== undefined) {
            var attribsDict = {};
            var attributes = el.attributes;
            var numAttribs = attributes.length;
            for (var j = 0; j < numAttribs; j++) {
                var attrib = attributes.item(j);
                attribsDict[attrib.nodeName] = attrib.nodeValue;
            }
            matches.push({
                node: el,
                name: name,
                text: $(el).text(),
                attributes: attribsDict
            });
        }
    }
    return matches;
}

/**
 * Use our optimized native version of the loop if available...
 */
if (typeof Titanium.Statusnet != "undefined") {
    if (typeof Titanium.Statusnet.mapOverElementsHelper != "undefined") {
        StatusNet.AtomParser.mapOverElementsHelper = Titanium.Statusnet.mapOverElementsHelper;
    }
}

StatusNet.AtomParser.prepBackgroundParse = function(callback)
{
    // We need to create another window to put our parsing
    // context into; this'll run on another thread, so can
    // run parsing while the UI thread is working. It'll
    // post events back to the main thread to display.
    var onReady = function() {
        Titanium.App.removeEventListener('StatusNet.background.ready', onReady);
        callback();
    };
    Titanium.App.addEventListener('StatusNet.background.ready', onReady);
    var window = Titanium.UI.createWindow({
        url: 'statusnet_background_parser.js',
        zIndex: -100
    });
    window.open();
}

/**
 * Pass XML source for an individual entry or whole feed to background thread
 * for parsing; each found notice will be passed back to the onEntry callback
 * along with its XML string source. The onComplete callback is then called
 * once the batch is complete.
 *
 * @param xmlString source XML for a feed or entry
 * @param onEntry function(notice) called for each individual entry. Source XML is saved into notice.xmlString
 * @param onSuccess function() called after completion, even if there are no notices
 * @param onFail function() called on parse error
 */
StatusNet.AtomParser.backgroundParse = function(xmlString, onEntry, onSuccess, onFail) {
    if (typeof xmlString != "string") {
        var msg = "FAIL: non-string passed to StatusNet.AtomParser.backgroundParse!";
        StatusNet.debug(msg);
        throw msg;
    }

    // Ok, this is... fun. :)
    // We can't send live objects like DOM nodes or callbacks across JS contexts,
    // so we have to pass the source XML string into the parser's queue and let
    // it post back to this context so we can call the callbacks.

    var key = Math.random();
    var entryKey = 'SN.backgroundParse.entry' + key;
    var successKey = 'SN.backgroundParse.success' + key;
    var failKey = 'SN.backgroundParse.fail' + key;

    var cleanupCallbacks;

    var entryCallback = function(event) {
        // Triggered in main context for each entry from bg context...
        if (onEntry) {
            onEntry.call(event.notice, event.notice);
        }
    };
    var successCallback = function(event) {
        // Triggered in main context after the processing is complete...
        cleanupCallbacks();
        if (onSuccess) {
            onSuccess.call();
        }
    };
    var failCallback = function(event) {
        // Triggered in main context if XML parsing failed...
        cleanupCallbacks();
        if (onFail) {
            onFail.call(event.msg);
        }
    };

    Titanium.App.addEventListener(entryKey, entryCallback);
    Titanium.App.addEventListener(successKey, successCallback);
    Titanium.App.addEventListener(failKey, failCallback);

    cleanupCallbacks = function() {
        Titanium.App.removeEventListener(entryKey, entryCallback);
        Titanium.App.removeEventListener(successKey, successCallback);
        Titanium.App.removeEventListener(failKey, failCallback);
    };

    Titanium.App.fireEvent('StatusNet.background.process', {
        xmlString: xmlString,
        onEntry: entryKey,
        onSuccess: successKey,
        onFail: failKey
    });
};

/**
 * Pass XML source for an individual entry to be parsed immediately; each found notice
 * will be passed back to the onEntry callback along with its XML string source.
 * The onComplete callback is then called once the batch is complete.
 *
 * @param xmlString source XML for a feed or entry
 * @param onEntry function(notice) called for each individual entry. Source XML is saved into notice.xmlString
 * @param onSuccess function() called after completion, even if there are no notices
 * @param onFail function() called on parse error
 */
StatusNet.AtomParser.parse = function(xmlString, onEntry, onSuccess, onFail) {
    StatusNet.debug('StatusNet.AtomParser.parse entered!');

    //StatusNet.debug('Parsing: ' + xmlString);
    var dom = StatusNet.Platform.parseXml(xmlString);
    var root = dom.documentElement;

    if (root.nodeName == 'entry') {
        StatusNet.debug("StatusNet.AtomParser.parse - parsing entry: " + xmlString);

        var notice = StatusNet.AtomParser.noticeFromEntry(root);
        notice.xmlString = xmlString;
        StatusNet.debug('StatusNet.AtomParser.parse - call onNotice for singleton');
        onEntry(notice);
    } else if (root.nodeName == 'feed') {

        StatusNet.debug("StatusNet.AtomParser.parse - parsing feed");

        // Note: for Desktop, .find() doesn't see 'feed' at this point, just entries
        $(root).find('entry').each(function() {
            StatusNet.debug("found entry -- parsing and calling onEntry");
            var notice = StatusNet.AtomParser.noticeFromEntry(this);
            notice.xmlString = StatusNet.Platform.serializeXml(this);
            onEntry(notice);
        });
    } else {
        StatusNet.debug('StatusNet.AtomParser.parse - got unknown XML: ' + msg);
        if (onFail) {
            var msg = "Expected feed or entry, got " + root.nodeName;
            onFail(msg);
        }
        return;
    }

    if (onSuccess) {
        StatusNet.debug('StatusNet.AtomParser.parse - calling onSuccess()');
        onSuccess();
    }
};

/**
 * Class method for generating a notice from an Atom entry
 *
 * @param DOM entry the Atom entry representing the notice
 */
StatusNet.AtomParser.noticeFromEntry = function(entry) {
StatusNet.debug('noticeFromEntry ENTER');
var startTime = Date.now();

    if (entry.documentElement) {
        entry = entry.documentElement;
        if (typeof entry == "function") {
            // Workaround bug that exposed this property as a function
            entry = entry();
        }
    }

    var notice = {};

    // STUFF IN THE <entry>
    var idRegexp = /(\d)+$/;
    var simpleNode = function(match) {
        notice[match.name] = match.text;
    }

    StatusNet.AtomParser.mapOverElements(entry, {
        'id': function(match) {
            // XXX: Special case for search Atom entries
            var searchId = match.text;
            if (searchId.substr(0, 4) == 'tag:') {
                var result = searchId.match(idRegexp);
                if (result) {
                    notice.id = result[0];
                }
            }
        },
        'statusnet:notice_info': function(match) {
            notice.id = match.attributes['local_id'];

            // source client
            notice.source = match.attributes['source'];
            notice.favorite = match.attributes['favorite'];
            notice.repeated = match.attributes['repeated'];
            notice.repeat_of = match.attributes['repeat_of'];
        },
        'published': simpleNode,
        'updated': function(match) {
            var updated = match.text;

            // knock off the millisecs to make the date string work with humane.js
            notice.updated = updated.substring(0, 19);
        },
        'title': simpleNode,
        'content': simpleNode, // @fixme this should actually handle more complex cases, as there may be different data types
        'source': function(match) {
            // atom:source (not the source client, eh) - this might not be in the feed
            StatusNet.AtomParser.mapOverElements(match.node, {
                'title': function(match) {
                    notice.atomSource = match.text;
                }
            });
        },
        'author': function(match) {
            StatusNet.AtomParser.mapOverElements(match.node, {
                'name':  function(match) {
                    notice.author = match.text;
                },
                'uri': function(match2) {
                    notice.authorUri = match2.text;
                    var result = notice.authorUri.match(idRegexp);
                    if (result) {
                        notice.authorId = result[0];
                    }
                },
                'statusnet:profile_info': function(match2) {
                    notice.following = match2.attributes['following'];
                    notice.blocking = match2.attributes['blocking'];
                }
            });
        },
        'activity:actor': function(match) {
            StatusNet.AtomParser.mapOverElements(match.node, {
                'poco:displayName':  function(match) {
                    notice.fullname = match.text;
                },
                'link': function(match2) {
                    // @fixme accept other image sizes
                    if (match2.attributes['rel'] == 'avatar' &&
                        match2.attributes['media:width'] == StatusNet.Platform.avatarSize()) {
                        notice.avatar = match2.attributes['href'];
                    }
                }
            });
        },
        'link': function(match) {
            var rel = match.attributes['rel'];
            var type = match.attributes['type'];
            if (rel == 'alternate') {
                notice.link = match.attributes['href'];
            } else if (rel == 'ostatus:conversation') {
                notice.contextLink = match.attributes['href'];
            } else if (rel == 'related' && (type == 'image/png' || type == 'image/jpeg' || type == 'image/gif')) {
                // XXX: Special case for search Atom entries
                if (!notice.avatar) {
                    notice.avatar = match.attributes['href'];
                }
            }
        },
        'georss:point': function(match) {
            // @fixme comma is also a valid separator
            var gArray = match.text.split(' ');
            notice.lat = gArray[0];
            notice.lon = gArray[1];
        },
        'thr:in-reply-to': function(match) {
            notice.inReplyToLink = match.attributes['ref'];
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
