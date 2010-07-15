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

    StatusNet.debug("in discoverTwitterApi");

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

