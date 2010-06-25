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
 * Constructor for group timeline model
 */
StatusNet.TimelineGroup = function(client, groupId) {
    StatusNet.Timeline.call(this, client);

    StatusNet.debug("TimelineGroup constructor - groupId = " + groupId);

    this.groupId = groupId;
    this.timeline_name = 'group-' + groupId;

    StatusNet.debug("TimelineGroup constructor - timeline name: " + this.timeline_name);

    this._url = 'statusnet/groups/timeline/' + groupId + '.atom';

    this.group = null;
}

// Make StatusNet.TimelineGroup inherit Timeline's prototype
StatusNet.TimelineGroup.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Update the timeline.  Does a fetch of the Atom feed for the appropriate
 * group timeline and notifies the view the model has changed.
 */
StatusNet.TimelineGroup.prototype.update = function(onFinish) {

    StatusNet.debug("TimelineGroup.update()");

    this.updateStart.notify();

    var that = this;

    this.account.fetchUrl(this.getUrl(),

        function(status, data) {

            StatusNet.debug('Fetched ' + that.getUrl());
            StatusNet.debug('HTTP client returned: ' + data);

            that.group = StatusNet.AtomParser.getGroup(data);

            var entries = [];

            $(data).find('feed > entry').each(function() {
                StatusNet.debug('TimelineGroup.update: found an entry.');
                entries.push(this);
            });

            entries.reverse(); // keep correct notice order

            for (var i = 0; i < entries.length; i++) {
                that.addNotice(entries[i]);
            }

            that.updateFinished.notify({notice_count: entries.length});

            if (onFinish) {
                onFinish(entries.length);
            }
            that.finishedFetch(entries.length)
        },
        function(client, msg) {
            StatusNet.debug("Something went wrong retrieving group timeline: " + msg);
            StatusNet.Infobar.flashMessage("Couldn't get group timeline: " + msg);
        }
    );

}

