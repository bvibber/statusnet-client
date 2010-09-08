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

/**
 * Constructor
 */
StatusNet.Theme = function(themePath) {
    this.themePath = "theme/" + themePath + "/";
    this.cssPath = this.themePath + "css/";
    this.imagePath = this.themePath + "images/";
    this.soundPath = "app://" + this.themePath + "sounds/";
};

StatusNet.Theme.getTheme = function() {
    return new StatusNet.Theme(StatusNet.Config.getConfig().getThemeName());
}

StatusNet.Theme.prototype.getDisplayStylesheet = function() {
    return this.cssPath + "display.css";
};

StatusNet.Theme.prototype.getNewNoticeStylesheet = function() {
    return this.cssPath + "new_notice.css";
};

StatusNet.Theme.prototype.getSettingsStylesheet = function() {
    return this.cssPath + "settings.css";
};

StatusNet.Theme.prototype.getDirectMessageStylesheet = function() {
    return this.cssPath + "direct_message.css";
};

StatusNet.Theme.prototype.getImage = function(filename) {
    return this.imagePath + filename;
};

StatusNet.Theme.prototype.getDefaultSiteLogo = function() {
    return this.getImage("logo.png");
};

StatusNet.Theme.prototype.getSpinner = function() {
    return this.getImage("loading.gif");
};

// @todo: make the names of these sound files more generic like post_notice.wav

StatusNet.Theme.prototype.getPostNoticeSound = function() {
    return Titanium.Media.createSound(this.soundPath + "whoosh.wav");
};

StatusNet.Theme.prototype.getNewNoticesSound = function() {
    return Titanium.Media.createSound(this.soundPath + "kalimba.wav");
};

StatusNet.Theme.listAvailable = function() {
    // stub
};

