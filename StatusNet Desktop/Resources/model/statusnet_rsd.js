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
StatusNet.RSD = {};

/**
 * @param string url
 * @param onSuccess function(apiroot)
 * @param onError function(client, error)
 */
StatusNet.RSD.discoverTwitterApi = function(url, onSuccess, onError) {

    StatusNet.debug("in discoverTwitterApi: " + url);

    StatusNet.HttpClient.webRequest(url,
        function(status, xml) {
            StatusNet.debug("Got RSD info for " + url);
            var apiroot = $("api[name='Twitter']", xml).attr("apiLink");
            if (apiroot) {
                StatusNet.debug("Got RSD info with Twitter API for " + url + " : " + apiroot);
                onSuccess(apiroot);
            } else {
                StatusNet.debug("Got RSD info but no Twitter API for " + url);
                onError(status, xml);
            }
        },
        onError
    );
};

/**
 * Find the RSD URL from the given web page...
 */
StatusNet.RSD.discover = function(url, onSuccess, onError) {
    StatusNet.HttpClient.webRequest(url,
        function(status, xml, text) {
            var rsd, dom;
            if (status >= 400) {
                StatusNet.debug("Can't find RSD; bad HTTP response: " + status);
                onError();
            }
            if (xml) {
                rsd = StatusNet.RSD.findRSD(xml);
                if (rsd) {
                    StatusNet.debug("RSD URL is at " + url);
                    onSuccess(rsd);
                } else {
                    StatusNet.debug("Didn't find an RSD URL reference.");
                    onError();
                }
            } else {
                // Not valid XHTML? Well crap!
                // In theory we could probably pull in a webview or something
                // since there's not a native HTML parser available, but...
                // that just sounds annoying.
                //
                // For now we're going to be EVIL.
                var linker = /<link[^>]*>/g
                var matches;
                while ((matches = linker.exec(text)) != null) {
                    var link = matches[0];
                    StatusNet.debug("link: " + link);
                    if (link.substr(link.length - 2, 1) != '/') {
                        link = link.substr(0, link.length - 2) + '/>';
                    }
                    try {
                        dom = StatusNet.Platform.parseXml(link);
                    } catch (e) {
                        continue;
                    }
                    rsd = StatusNet.RSD.findRSD(dom);
                    if (rsd) {
                        StatusNet.debug("RSD URL is at " + url);
                        onSuccess(rsd);
                        return;
                    }
                }
                StatusNet.debug("No RSD link found.");
                onError();
            }
        },
        onError
    );
};

StatusNet.RSD.findRSD = function(xml, onSuccess, onError) {
    return $("link[rel=EditURI]", xml).attr("href");
}