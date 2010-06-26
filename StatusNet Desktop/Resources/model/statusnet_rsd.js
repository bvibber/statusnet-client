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
 * @param onSuccess function(status, dom)
 * @param onError function(client, error)
 *
 * @fixme consolidate XHR setup with account?
 */
StatusNet.RSD.discover = function(url, onSuccess, onError) {
    StatusNet.debug("Attempting RSD discover to: " + url);
    var client = Titanium.Network.createHTTPClient();

    client.onload = function() {
        StatusNet.debug("RSD loaded: " + this.status);
        if (this.status == 200) {

            if (Titanium.version < '1.3.0') {
                // @fixme Argh. responseXML is unimplemented in Titanium 1.2.1 So we have
                // to use this work-around.
                var responseXML = (new DOMParser()).parseFromString(this.responseText, "text/xml");
            } else {
                // Is implemented in Titanium Mobile 1.3, whereas the above doesn't work there.
                if (this.responseXML == null) {
                    // Titanium Mobile 1.3/Android doesn't implement responseXML,
                    // and 'new DOMParser()' doesn't work like on Desktop 1.2.
                    var responseXML = Titanium.XML.parseString(this.responseText);
                } else {
                    // Actually works on Titanium Mobile 1.3/iPhone
                    var responseXML = this.responseXML;
                }
            }

            onSuccess(this.status, responseXML);
        } else {
            onError(client, "HTTP status: " + this.status);
        }
    };

    client.onerror = function(e) {
        StatusNet.debug("RSD error: " + e.error);
        onError(client, "Error: " + e.error);
    }

    // @fixme Hack to work around bug in the Titanium Desktop 1.2.1
    // onload will not fire unless there a function assigned to
    // onreadystatechange.
    client.onreadystatechange = function() {
        // NOP
    };

    client.open("GET", url);
    client.send();
    StatusNet.debug("Sent and waiting...");
}

/**
 * @param string url
 * @param onSuccess function(apiroot)
 * @param onError function(client, error)
 */
StatusNet.RSD.discoverTwitterApi = function(url, onSuccess, onError) {
    StatusNet.RSD.discover(url, function(status, xml) {
        StatusNet.debug("Got RSD info for " + url);

        var apiroot = $("api[name='Twitter']", xml).attr("apiLink");
        if (apiroot) {
            StatusNet.debug("Got RSD info with Twitter API for " + url + " : " + apiroot);
            onSuccess(apiroot);
        } else {
            StatusNet.debug("Got RSD info but no Twitter API for " + url);
            onError(client, error);
        }
    }, onError);
}
