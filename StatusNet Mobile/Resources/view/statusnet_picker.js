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

/**
 * Helper for creating options dialogs, easier to construct options
 * with individual callbacks.
 */
StatusNet.Picker = function(args) {
    this.args = args;
    this.options = [];
    this.callbacks = [];
}

/**
 * Add an option!
 */
StatusNet.Picker.prototype.add = function(label, callback) {
    this.options.push(label);
    this.callbacks.push(callback);
}

/**
 * Add a cancel option!
 */
StatusNet.Picker.prototype.addCancel = function(label, callback) {
    this.args.cancel = this.options.length;
    this.add(label || "Cancel", callback);
}

/**
 * Add a destructive option!
 */
StatusNet.Picker.prototype.addDestructive = function(label, callback) {
    this.args.destructive = this.options.length;
    this.add(label, callback);
}

/**
 * Show the darn thang
 */
StatusNet.Picker.prototype.show = function() {
    var callbacks = this.callbacks;
    var args = this.args;

    args.options = this.options;
    var dialog = Ti.UI.createOptionDialog(args);

    dialog.addEventListener('click', function(event) {
        var i = event.index;
        if (i >= 0 && i < callbacks.length && callbacks[i]) {
            callbacks[i]();
        }
    });
    dialog.show();
}
