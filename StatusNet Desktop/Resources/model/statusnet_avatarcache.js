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
 * @return Titanium.Filesystem.File the cache directory for avatars
 */
StatusNet.AvatarCache.getCacheDirectory = function() {

    var appDirName, cacheDir;

    if (StatusNet.Platform.isMobile()) {
        appDirName = Titanium.Filesystem.applicationDataDirectory;
        cacheDir = Titanium.Filesystem.getFile(appDirName, 'avatar_cache');
    } else {

        // XXX: Technically we should noto be using the application resources directory
        // for caching our avatar files, however, Titanium notifications cannot resolve
        // file:/// URLs currently. So we need to give them app:// URLs, which refer to
        // the application resources directory. The resources directory is theoretically
        // read-only, even though it's not really. But we have not guarantee that it will
        // stay writable going forward.

        //appDirName = Titanium.Filesystem.getApplicationDataDirectory().nativePath();

        var rdir = Titanium.Filesystem.getResourcesDirectory();
        var separator = Titanium.Filesystem.getSeparator();
        cacheDir = Titanium.Filesystem.getFile(rdir + separator + 'avatar_cache');
    }

    return cacheDir;
};

/**
 * On Mobile, we get a bare filename, but on Desktop we have a complete filepath.
 * This returns the full filepath, regardless of platform.
 */
StatusNet.AvatarCache.getAvatarFile = function(filename) {

    if (typeof filename != "string") {
        // Already a File object? Should be fine then.
        return filename;
    }

    var avatarFile;

    var cacheDir = StatusNet.AvatarCache.getCacheDirectory();

    if (StatusNet.Platform.isMobile()) {
        avatarFile = Titanium.Filesystem.getFile(cacheDir.nativePath, filename);
    } else {
        var separator = Titanium.Filesystem.getSeparator();
        avatarFile = Titanium.Filesystem.getFile(cacheDir + separator + filename);
    }

    return avatarFile;
};

/**
 * Abstract away the difference between nativePath on the various platforms
 */
StatusNet.AvatarCache.getAvatarNativePath = function(file) {

    // XXX: nativePath is a function on Desktop and a property on Mobile
    return (typeof file.nativePath == "function") ? file.nativePath() : file.nativePath;
};

/**
 * Abstract away the difference between timestamp formats on Mobile(s) and Desktop. We get
 * a Date obj on Android and a property on iPhone and Desktop
 */
StatusNet.AvatarCache.getAvatarTimestamp = function(file) {
    //Titanium.API.info("AvatarCache.getAvatarTimestamp: " + StatusNet.AvatarCache.getAvatarNativePath(file));
    var modts = file.modificationTimestamp();
    return (typeof modts == "object") ? modts.getTime() : modts;
};

/**
 * We can use a better hashing function on Desktop
 */
StatusNet.AvatarCache.getAvatarHash = function(url) {
    var hash;
    if (StatusNet.Platform.isMobile()) {
        hash = Titanium.Utils.md5HexDigest(url);
    } else {
        // desktop
        hash = Titanium.Codec.digestToHex(Titanium.Codec.SHA1, url);
    }
    return hash;
};

/**
 * Clean up the avatar cache
 */
StatusNet.AvatarCache.trimAvatarCache = function() {

    var MAX_AVATARS = 200; // @todo Make this configurable

    var dirList = StatusNet.AvatarCache.getCacheDirectory().getDirectoryListing();

    var avatars = [];

    if (dirList) {

        StatusNet.debug("trimAvatarCache - avatar cache directory has " + dirList.length + " files. Max is " + MAX_AVATARS);

        if (dirList.length > MAX_AVATARS) {

            var avatarFile;

            for (i = 0; i < dirList.length; i++) {
                //Titanium.API.info('trimAvatarCache: dirList item: ' + typeof dirList[i]);
                //Titanium.API.info('trimAvatarCache: dirList item: ' + dirList[i]);
                avatarFile = StatusNet.AvatarCache.getAvatarFile(dirList[i]);
                avatars.push(avatarFile);
            }

            // Sort by timestamp - ascending
            avatars.sort(function(a, b) {
                return StatusNet.AvatarCache.getAvatarTimestamp(a) - StatusNet.AvatarCache.getAvatarTimestamp(b);
            });

            var overflow = dirList.length - MAX_AVATARS;

            StatusNet.debug("trimAvatarCache - avatar cache has " + overflow + " too many avatars, trimming...");

            for (i = 0; i < overflow; i++) {
                if (avatars[i].exists()) {

                    var nativePath = StatusNet.AvatarCache.getAvatarNativePath(avatars[i]);

                    //Titanium.API.info("AvatarCache.trimAvatarCache: deleting " + StatusNet.AvatarCache.getAvatarNativePath(avatars[i]));
                    if (avatars[i].deleteFile()) {
                        StatusNet.debug("trimAvatarCache - deleted " + nativePath);
                    } else {
                        StatusNet.debug("trimAvatarCache - couldn't delete " + nativePath);
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
StatusNet.AvatarCache.lookupAvatar = function(url, onHit, onMiss, relative) {

    //StatusNet.debug("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX AvatarCache.lookupAvatar A - Begin");

    var hash = StatusNet.AvatarCache.getAvatarHash(url);

    //StatusNet.debug('AvatarCache.lookupAvatar B - Avatar hash for ' + url + " == " + hash);

    var dot = url.lastIndexOf(".");

    if (dot == -1 ) {
        // ooh weird, no extension
        return url;
    }

    var extension = url.substr(dot, url.length);

    var cacheDir = StatusNet.AvatarCache.getCacheDirectory();

    if (!cacheDir.exists()) {
        //StatusNet.debug("AvatarCache.lookupAvatar C - avatar cache directory doesn't exist, creating.");
        cacheDir.createDirectory(); // XXX: always seems to return false on mobile SDK 1.4.1
        if (cacheDir.exists()) {
            //StatusNet.debug("AvatarCache.lookupAvatar D - successfully created cache directory");
        } else {
            StatusNet.error("AvatarCache.lookupAvatar - Could not create cache directory");
        }
    } else {
        //StatusNet.debug("AvatarCache.lookupAvatar E - avatar cache directory already exists");
    }

    var filename = hash + extension;

    //StatusNet.debug("AvatarCache.lookupAvatar F - filename = " + filename);

    var avatarFile = StatusNet.AvatarCache.getAvatarFile(filename);
    var nativePath = StatusNet.AvatarCache.getAvatarNativePath(avatarFile);
    var relativePath = 'avatar_cache/' + filename;

    //StatusNet.debug('AvatarCache.lookupAvatar G - looking up avatar: ' + nativePath);

    //Titanium.API.info("AvatarCache.lookupAvatar: checking " + StatusNet.AvatarCache.getAvatarNativePath(avatarFile));
    if (avatarFile.exists()) {
        //StatusNet.debug("AvatarCache.lookupAvatar H - Yay, avatar cache hit");
        if (onHit) {
            if (relative) {
                onHit(relativePath);
            } else {
                onHit(nativePath);
            }
        }

        //StatusNet.debug("AvatarCache.lookupAvatar I - returning native path: " + nativePath);
        //StatusNet.debug("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX AvatarCache.lookupAvatar J - END");

        return (relative) ? relativePath : nativePath;
    } else {

        //StatusNet.debug("AvatarCache.lookupAvatar H - Avatar cache miss, fetching avatar from web");

        // Make sure there's space available on the device before fetching
        if (!cacheDir.spaceAvailable()) {
            StatusNet.error("No space available! Can't cache avatar.");
            if (onMiss) {
                onMiss(url);
            }
            return false;
        }

        StatusNet.HttpClient.fetchFile(
            url,
            avatarFile,
            function() {
                //StatusNet.debug("AvatarCache.lookupAvatar I - fetched avatar: " + url);
                if (onHit) {
                    if (relative) {
                        onHit(relativePath);
                        return relativePath
                    } else {
                        onHit(nativePath);
                        return nativePath;
                    }
                }
            },
            function(code, e) {
                StatusNet.error("AvatarCache.lookupAvatar I - couldn't fetch: " + url);
                StatusNet.error("AvatarCache.lookupAvatar I - code: " + code + ", exception: " + e);
            }
        );

        if (onMiss) {
            onMiss(url)
        }

        //StatusNet.debug("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX AvatarCache.lookupAvatar J - END");

        return false;
    }
};
