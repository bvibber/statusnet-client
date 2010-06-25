/**
 * StatusNet Mobile
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
// Stub shims to allow jQuery to be loaded up (no guarantees anything will work!)
var window = {
    navigator: {
        userAgent: "Mozilla/5.0 (compatible)"
    },
    document: {
        addEventListener: function() {},
        createElement: function() {
            // throw "Call to shim document.createElement";
            return {
                style: {},
                getElementsByTagName: function() {
                    return {};
                },
                appendChild: function() {},
                innerHTML: ""
            };
        },
        documentElement: {
            insertBefore: function() {},
            removeChild: function() {}
        },
        getElementById: function() {},
        createComment: function() {},
    },
    location: {}
};
var navigator = window.navigator;
var document = window.document;
var location = window.location;

//Titanium.include('lib/jquery-1.4.2.js');
Titanium.include('lib/jquery-1.4.2.min.js');

var jQuery = window.jQuery;
var $ = jQuery;
