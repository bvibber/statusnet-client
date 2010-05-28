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
