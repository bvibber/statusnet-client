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
Titanium.include('heyQuery.js');
Titanium.include('model/statusnet_atom_parser.js');

/**
 * This event handler runs in a hidden background window, thus getting its own
 * JavaScript context.
 */
Titanium.App.addEventListener('StatusNet.background.process', function(event) {
    //StatusNet.debug('Background parser entered!');

    var xmlString = event.xmlString;
    var key = event.key;

    //StatusNet.debug('Parsing: ' + xmlString);
    var dom = StatusNet.Platform.parseXml(xmlString);
    var root = dom.documentElement;
    // hack for iPhone, sigh
    if (typeof root == "function") {
        root = root();
    }

    if (root.nodeName == 'entry') {
        var notice = StatusNet.AtomParser.noticeFromEntry(root);
        notice.xmlString = xmlString;
        //StatusNet.debug('Background parser firing onNotice for singleton');
        Titanium.App.fireEvent('SN.backgroundParse.entry', {
            key: key,
            notice: notice
        });
    } else if (root.nodeName == 'feed') {
        $(root).find('feed > entry').each(function() {
            var notice = StatusNet.AtomParser.noticeFromEntry(this);
            if (StatusNet.Platform.serializeXml !== undefined) {
                notice.xmlString = StatusNet.Platform.serializeXml(this);
            }

            //StatusNet.debug('Background parser firing onNotice in a feed');
            Titanium.App.fireEvent('SN.backgroundParse.entry', {
                key: key,
                notice: notice
            });
        });
    } else {
        var msg = "Expected feed or entry, got " + root.nodeName;
        StatusNet.debug('Background parser firing onFail, got unknown XML: ' + msg);
        Titanium.App.fireEvent('SN.backgroundParse.fail', {msg: msg});
        return;
    }

    StatusNet.debug('Background parser firing onSuccess');
    Titanium.App.fireEvent('SN.backgroundParse.success', {
        key: key
    });
});

StatusNet.debug('Background parser is open and ready to go.');
Titanium.App.fireEvent('StatusNet.background.ready', {});
