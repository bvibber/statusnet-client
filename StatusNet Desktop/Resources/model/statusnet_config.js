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

StatusNet.config = null;

/**
 * A class representing configuration settings. if a statusnet.config
 * file exists in the Resources directory, the properties set in it
 * will override properties set in the application. Properties set within
 * the application are stored in the global Titanium.App.Properties and
 * pesist between multiple runs of the app.
 */
StatusNet.Config = function(props) {
    this.defaults = StatusNet.Config.getDefaults();
    this.props = props;

    if (props) {
        this.themeName = props.getString("theme", "default");
        this.siteLogo = props.getString("siteLogo", ""); // Note: you have to supply a second argument to getString
        this.userImage = props.getString("userImage", "");
        this.sourceName = props.getString("sourceName", "");
        StatusNet.info("this.theme = " + this.themeName);
    }
};

StatusNet.Config.getDefaults = function() {

    // Defined default settings here
    var defaults = {
        "theme": "default",
        "play_sounds": true,
        "new_notices_sound": true,
        "post_notice_sound": true,
        "notifications": StatusNet.Platform.nativeNotifications()
    };

    // Add any special case stuff here

    return defaults;
};

StatusNet.Config.getConfig = function() {

    if (StatusNet.config === null) {

        var props;

        // load config file
        try {
            props = Titanium.App.loadProperties(Titanium.App.appURLToPath("app://statusnet.config"));
        } catch(e) {
            StatusNet.info("Unable to load statusnet.config: " + e);
        }

        StatusNet.config = new StatusNet.Config(props);
    }

    return StatusNet.config;
};

StatusNet.Config.prototype.getThemeName = function() {

    if (this.themeName) {
        return this.themeName;
    } else {
        return Titanium.App.Properties.getString("theme", "default");
    }
};

StatusNet.Config.prototype.getSetting = function(key) {

    // Check to see if there's a user saved setting
    var value = Titanium.App.Properties.getString(key, "");

    // Hack: use empty string as boolean store
    if (value === "") {
        // Check to see if there's a property set in the config file
        if (this.props.getString(key, "") !== "") {
            return this.props[key];
        // Check to see if there's a default setting
        } else if (this.defaults[key] !== undefined) {
            return this.defaults[key];
        } else {
            return false;
        }
    } else if (value === "true") {
        return true;
    } else {
        return value;
    }
};

StatusNet.Config.prototype.saveSetting = function(key, value) {

    if (value === "true" || value === "false") {
        throw "You can't use the strings 'true' or 'false' as values, use booleans instead.";
    }

    var realValue;

    // hack to use empty string as boolean store
    if (value === false) {
        realValue = "";
    } else if (value === true) {
        realValue = "true";
    } else {
        realValue = value;
    }

    Titanium.App.Properties.setString(key, realValue);
};

StatusNet.Config.prototype.getSiteLogo = function() {
    return (this.siteLogo) ? this.siteLogo : false;
};

StatusNet.Config.prototype.getUserImage = function() {
    return (this.userImage) ? this.userImage : false;
};

StatusNet.Config.prototype.getSourceName = function() {
    return (this.sourceName) ? this.sourceName : 'StatusNet Desktop';
};

// Little helper. Maybe we don't need.
StatusNet.Config.prototype.playSounds = function() {
    if (this.getSetting('play_sounds')) {
        return true;
    } else {
        return false;
    }
};
