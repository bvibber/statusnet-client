/**
 * StatusNet Mobile
 *
 * Copyright 2010 StatusNet, Inc.
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

Titanium.include('statusnet.js');
Titanium.include('model/statusnet_atom_parser.js');

/**
 * This event handler runs in a hidden background window, thus getting its own
 * JavaScript context.
 */
Titanium.App.addEventListener('StatusNet.background.process', function(event) {
    StatusNet.debug('Background parser entered!');

    var xmlString = event.xmlString;
    var onEntry = event.onEntry;
    var onSuccess = event.onSuccess;
    var onFail = event.onFail;

    var dom = StatusNet.Platform.parseXml(xmlString);
    var root = dom.documentElement;
    // hack for iPhone, sigh
    if (typeof root == "function") {
        root = root();
    }

    if (root.nodeName == 'entry') {
        var notice = StatusNet.AtomParser.noticeFromEntry(root);
        StatusNet.debug('Background parser firing onNotice for singleton');
        Titanium.App.fireEvent(onEntry, {
            notice: notice,
            xmlString: xmlString,
        });
    } else if (root.nodeName == 'feed') {
        var entries = [];
        $(root).find('feed > entry').each(function() {
            entries.push(this);
            StatusNet.debug('Background parser firing onNotice in a feed');
            Titanium.App.fireEvent(onEntry, {
                notice: StatusNet.AtomParser.noticeFromEntry(this),
                xmlString: StatusNet.Platform.serializeXml(this)
            });
        });
    } else {
        StatusNet.debug('Background parser firing onFail, got unknown XML');
        Titanium.App.fireEvent(onFail, {});
        return;
    }

    StatusNet.debug('Background parser firing onSuccess');
    Titanium.App.fireEvent(onSuccess, {});
});

StatusNet.debug('Background parser is open and ready to go.');

