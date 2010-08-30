/**
 * StatusNet Desktop
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
 * @author Zach Copley <zach@status.net>
 */
StatusNet.AvatarCache = {};

/**
 * Clean up the avatar cache
 */
StatusNet.AvatarCache.trimAvatarCache = function() {

    var MAX_AVATARS = 200; // @todo Make this configurable

    var appDirName = Titanium.Filesystem.applicationDataDirectory;
    var cacheDir = Titanium.Filesystem.getFile(appDirName, 'avatar_cache');
    var dirList = cacheDir.getDirectoryListing();

    var avatars = [];

    if (dirList) {
        StatusNet.debug("trimAvatarCache - avatar cache directory has " + dirList.length + " files. Max is " + MAX_AVATARS);
        if (dirList.length > MAX_AVATARS) {

            var avatarFile, modts;

            // Make a list of avatar files and their modification times
            for (i = 0; i < dirList.length; i++) {

                avatarFile = Titanium.Filesystem.getFile(appDirName, 'avatar_cache', dirList[i]);
                modts = avatarFile.modificationTimestamp();

                var avatar = {
                    "filename": dirList[i],
                    // XXX: modificationTimestamp returns a Date obj on iPhone and a long on Android
                    "timestamp": (typeof modts == "object") ? modts.getTime() : modts
                };
                avatars.push(avatar);
            }

            // Sort by timestamp - ascending
            avatars.sort(function(a, b) {
                return a.timestamp - b.timestamp;
            });

            var overflow = dirList.length - MAX_AVATARS;

            StatusNet.debug("trimAvatarCache - avatar cache has " + overflow + " too many avatars, trimming...");

            for (i = 0; i < overflow; i++) {
                avatarFile = Titanium.Filesystem.getFile(appDirName, 'avatar_cache', avatars[i].filename);
                if (avatarFile.exists()) {
                    if (avatarFile.deleteFile()) {
                        StatusNet.debug("trimAvatarCache - deleted " + avatars[i].filename);
                    } else {
                        StatusNet.debug("trimAvatarCache - couldn't delete " + avatars[i].filename);
                    }
                }
            }
            StatusNet.debug("trimAvatarCache - done trimming avatars.")
        } else {
            StatusNet.debug("trimAvatarCache - No need to trim avatar cache yet.");
        }
    }
};


/**
 * Lookup avatar in our avatar cache.
 *
 */
StatusNet.AvatarCache.lookupAvatar = function(url, onHit, onMiss) {

    StatusNet.debug("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX AvatarCache.lookupAvatar A - Begin");

    var hash;

    if (typeof Titanium.Codec == "undefined") {
        // mobile
        StatusNet.debug("AvatarCache.lookupAvatar B - Titanium.Codec is undefined (we're on mobile)");
        hash = Titanium.Utils.md5HexDigest(url);
    } else {
        // desktop
        StatusNet.debug("AvatarCache.lookupAvatar B - Titanium.Codec is defined (we're on desktop)");
        hash = Titanium.Codec.digestToHex(Titanium.Codec.SHA1, url);
    }

    StatusNet.debug('AvatarCache.lookupAvatar C - Avatar hash for ' + url + " == " + hash);

    var dot = url.lastIndexOf(".");

    if (dot == -1 ) {
        // ooh weird, no extension
        return url;
    }

    var extension = url.substr(dot, url.length);

    var appDirName = Titanium.Filesystem.applicationDataDirectory;
    var cacheDirName = 'avatar_cache';

    var cacheDir = Titanium.Filesystem.getFile(appDirName, cacheDirName);

    StatusNet.debug("AvatarCache.lookupAvatar D - cacheDir = " + cacheDir.nativePath);

    if (!cacheDir.exists()) {
        StatusNet.debug("AvatarCache.lookupAvatar E - avatar cache directory doesn't exist, creating.");
        cacheDir.createDirectory(); // XXX: always seems to return false on mobile SDK 1.4.1
        if (cacheDir.exists()) {
            StatusNet.debug("AvatarCache.lookupAvatar E1 - successfully created cache directory");
        } else {
            StatusNet.debug("AvatarCache.lookupAvatar E1 - Could not create cache directory");
        }
    } else {
        StatusNet.debug("AvatarCache.lookupAvatar E - avatar cache directory already exists");
    }

    var filename = hash + extension;

    StatusNet.debug("AvatarCache.lookupAvatar F - filename = " + filename);

    var avatarFile = Titanium.Filesystem.getFile(appDirName, cacheDirName, filename);

    StatusNet.debug('AvatarCache.lookupAvatar G - looking up avatar: ' + avatarFile.nativePath);

    if (avatarFile.exists()) {
        StatusNet.debug("AvatarCache.lookupAvatar H - Yay, avatar cache hit");
        if (onHit) {
            onHit(avatarFile.nativePath);
        }

        StatusNet.debug("AvatarCache.lookupAvatar I - returning native path: " + avatarFile.nativePath);
        StatusNet.debug("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX AvatarCache.lookupAvatar J - END");

        return avatarFile.nativePath;
    } else {

        StatusNet.debug("AvatarCache.lookupAvatar H - Avatar cache miss, fetching avatar from web");

        // Make sure there's space available on the device before fetching
        if (!cacheDir.spaceAvailable()) {
            StatusNet.debug("No space available! Can't cache avatar.");
            if (onMiss) {
                onMiss(url);
            }
            return false;
        }

        StatusNet.HttpClient.fetchFile(
            url,
            avatarFile,
            function() {
                StatusNet.debug("AvatarCache.lookupAvatar I - fetched avatar: " + url);
                if (onHit) {
                    onHit(avatarFile.nativePath);
                    return avatarFile.nativePath;
                }
            },
            function(code, e) {
                StatusNet.debug("AvatarCache.lookupAvatar I - couldn't fetch: " + url);
                StatusNet.debug("AvatarCache.lookupAvatar I - code: " + code + ", exception: " + e);
            }
        );

        if (onMiss) {
            onMiss(url)
        }

        StatusNet.debug("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX AvatarCache.lookupAvatar J - END");

        return false;
    }
};
