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
};

// Make StatusNet.TimelineGroup inherit Timeline's prototype
StatusNet.TimelineGroup.prototype = heir(StatusNet.Timeline.prototype);

/**
 * Update the timeline.  Does a fetch of the Atom feed for the appropriate
 * group timeline and notifies the view the model has changed.
 */
 StatusNet.TimelineGroup.prototype.update = function(onFinish) {
    StatusNet.debug('Timeline.update ENTERED');

    this.updateStart.notify();

    StatusNet.debug('Timeline.update called updateStart.notify');

    var that = this;

    this.account.apiGet(this.getUrl(),

        function(status, data, responseText) {
            StatusNet.debug('TimelineGroup.update GOT DATA:');

            // @todo How we get author info will need to change when we
            // update output to match the latest Activity Streams spec
            that.group = StatusNet.AtomParser.getGroup(data);

            var entries = [];
            var entryCount = 0;

            var onEntry = function(notice) {
                // notice
                StatusNet.debug('Got notice: ' + notice);
                StatusNet.debug('Got notice.id: ' + notice.id);
                that.addNotice(notice);
                entryCount++;
            };
            var onSuccess = function() {
                // success!
                StatusNet.debug('TimelineGroup.update success!');
                that.updateFinished.notify({notice_count: entryCount});

                if (onFinish) {
                    onFinish(entryCount);
                }
                StatusNet.debug('TimelineGroup.update calling finishedFetch...');
                that.finishedFetch(entryCount);
                StatusNet.debug('TimelineGroup.update DONE.');
            };
            var onFailure = function(msg) {
                // if parse failure
                StatusNet.debug("Something went wrong retrieving timeline: " + msg);
                StatusNet.Infobar.flashMessage("Couldn't get timeline: " + msg);
                that.updateFinished.notify();
            };

            // @todo Background processing for Desktop
            if (StatusNet.Platform.isMobile()) {
                StatusNet.AtomParser.backgroundParse(responseText, onEntry, onSuccess, onFailure);
            } else {
                StatusNet.debug("gonna parse this");
                StatusNet.AtomParser.parse(responseText, onEntry, onSuccess, onFailure);
            }
        },
        function(client, msg) {
            StatusNet.debug("Something went wrong retrieving timeline: " + msg);
            StatusNet.Infobar.flashMessage("Couldn't update timeline: " + msg);
            that.updateFinished.notify();
        }
    );
    StatusNet.debug('Timeline.update EXITED: waiting for data return.');

};
