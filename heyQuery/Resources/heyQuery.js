/*
 * Minimal jQuery-like interface to wrap our XML-parsing helpers that use
 * jQuery's selector engine. This provides source compatibility for backend
 * code that's shared between Titanium Desktop (runs in WebKit) and Titanium
 * Mobile (which have different XML DOM implementations and need a patched
 * copy of the Sizzle selector engine).
 *
 * StatusNet - the distributed open-source microblogging tool
 * Copyright (C) 2010, StatusNet, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * @package StatusNet Mobile
 * @maintainer Brion Vibber <brion@status.net>
 */

// Pull in our patched version of jQuery's Sizzle selector engine...
Titanium.include('sizzle.js');

/**
 * heyQueryObj constructor - internal
 * @param Array context list of DOM nodes
 */
function heyQueryObj(context) {
    if (context === null || typeof context != "object" || typeof (context.length) != "number") {
        var msg = "Given invalid context to heyQueryObj: " + context;
        Titanium.API.error(msg);
        throw msg;
    }
    this.nodes = context;

    this.length = 0;
    heyQuery.appendArray(this.nodes, this); // copies in the array indexes
    this.length = this.nodes.length;
}

/**
 * Find any elements matching the CSS selector within the context nodes.
 *
 * @param string selector
 * @return heyQueryObj
 */
heyQueryObj.prototype.find = function(selector) {
    var set = [];
    for (var i = 0; i < this.nodes.length; i++) {
        var chunk = Sizzle(selector, this.nodes[i]);

        // @fixme we should check for duplicates between runs here, but
        // object identity doesn't seem to be preserved on the dom nodes
        // as proxied to javascript, which complicates things.
        heyQuery.appendArray(chunk, set);
    }
    return new heyQueryObj(set);
}

/**
 * Return one or all nodes in the context set.
 *
 * @param mixed i numeric index, or leave out to return an array of all nodes
 * @return heyQueryObj
 */
heyQueryObj.prototype.get = function(i) {
    if (typeof i == "undefined") {
        return this.nodes.slice(0, this.length);
    } else {
        return this.nodes[i];
    }
}

/**
 * Iterate over all nodes, calling the given function.
 *
 * @param function(index, node) callback
 */
heyQueryObj.prototype.each = function(callback) {
    for (var i = 0; i < this.nodes.length; i++) {
        callback.call(this[i], i, this[i]);
    }
}

/**
 * Get combined text contents of all matching nodes.
 *
 * Setting text is not implemented.
 *
 * @return string
 */
heyQueryObj.prototype.text = function(newtext) {
    if (typeof newtext != "undefined") {
        var msg = "Tried to set text in heyQuery";
        Titanium.API.error(msg);
        throw msg;
    }
    var out = [];
    this.each(function(i, item) {
        out.push(item.text); // not .textContent
    });
    return out.join('');
}

/**
 * Get text of the given attribute on the first matched node.
 *
 * Setting text is not implemented.
 *
 * @return mixed string, or undefined if no matching attribute on the first node.
 */
heyQueryObj.prototype.attr = function(attr, newval) {
    if (typeof newval != "undefined") {
        var msg = "Tried to set " + attr + " attribute in heyQuery";
        Titanium.API.error(msg);
        throw msg;
    }
    if (this.length > 0) {
        var item = this.get(0);
        var val = item.getAttribute(attr);
        if (val !== null) {
            return val;
        }
    }
    return undefined;
}

/**
 * Get the number of matching nodes.
 *
 * @return number
 */
heyQueryObj.prototype.size = function() {
    return this.length;
}

function heyQuery(a, b) {
    if (!a) {
        if (!document) {
            var msg = "Attempted to use heyQuery on missing global document context.";
            Titanium.API.error(msg);
            throw msg;
        }
        return heyQuery(document);
    } else if (typeof a == "string" && /^<[^>]+>/.test(a)) {
        // HTML/XML to parse!
        var html = a, doc = b;
        var dom = Titanium.XML.parseString(html);
        return new heyQueryObj(Sizzle.hacks.documentElement(dom));
    } else if (typeof a == "string") {
        // CSS selector in a DOM tree!
        var selector = a, context = b;
        return heyQuery(context).find(selector);
    } else if (typeof a == "function") {
        // For delayed initialization; we've got nothing to delay for.
        var callback = a;
        callback();
    /*} else if (typeof a == "object" && typeof (Sizzle.hacks.documentElement(a)) == "object") {
        // DOMDocument
        return new heyQueryObj([Sizzle.hacks.documentElement(a)]);*/
    } else if (typeof a == "object" && typeof (a.length) == "number") {
        // Array, node list, heyQuery, or other array-like set of elements
        return new heyQueryObj(heyQuery.makeArray(a));
    } else if (typeof a == "object") {
        // Probably an element or a document, but we ought to check probably.
        return new heyQueryObj([a]);
    } else {
        var msg = "Got unexpected " + typeof(a) + " in heyQuery()";
        Titanium.API.error(msg);
        throw msg;
    }
}

/**
 * Rebuild a proper array from something that may not be an array,
 * and possibly append it onto something else.
 * Will also append onto an array-like object... scary!
 *
 * Sorta ripped from scary jquery code :D
 * @access private
 */
heyQuery.appendArray = function(a, result) {
    var out = result || [];
    var len = a.length;
    var start = out.length;
    if (typeof a.item != "undefined") {
        // TiDOMNodeList in mobile doesn't support array index operator
        for (var i = 0; i < len; i++) {
            out[i + start] = a.item(i);
        }
    } else {
        // TiDOMNodeList in mobile doesn't support array index operator
        for (var i = 0; i < len; i++) {
            out[i + start] = a[i];
        }
    }
    return out;
};

heyQuery.makeArray = heyQuery.appendArray;

var $ = jQuery = heyQuery;