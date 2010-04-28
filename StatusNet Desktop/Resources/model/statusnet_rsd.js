StatusNet.RSD = {};

/**
 * @param string url
 * @param onSuccess function(status, dom)
 * @param onError function(client, error)
 *
 * @fixme consolidate XHR setup with account?
 */
StatusNet.RSD.discover = function(url, onSuccess, onError) {
    StatusNet.debug("Attempting RSD discover to: " + url);
    var client = Titanium.Network.createHTTPClient();

    client.onload = function() {
        if (this.status == 200) {

            // @fixme Argh. responseXML is unimplemented in Titanium 1.2.1 So we have
            // to use this work-around.
            var responseXML = (new DOMParser()).parseFromString(this.responseText, "text/xml");

            onSuccess(this.status, responseXML);
        } else {
            onError(client, "HTTP status: " + this.status);
        }
    };

    client.onerror = function(e) {
        onError(client, "Error: " + e.error);
    }

    // @fixme Hack to work around bug in the Titanium Desktop 1.2.1
    // onload will not fire unless there a function assigned to
    // onreadystatechange.
    client.onreadystatechange = function() {
        // NOP
    };

    client.open("GET", url);
    client.send();
}

/**
 * @param string url
 * @param onSuccess function(apiroot)
 * @param onError function(client, error)
 */
StatusNet.RSD.discoverTwitterApi = function(url, onSuccess, onError) {
    StatusNet.RSD.discover(url, function(status, xml) {
        StatusNet.debug("Got RSD info for " + url);
        var apiroot = $("api[name='Twitter']", xml).attr("apiLink");
        if (apiroot != "") {
            StatusNet.debug("Got RSD info with Twitter API for " + url + " : " + apiroot);
            onSuccess(apiroot);
        } else {
            StatusNet.debug("Got RSD info but no Twitter API for " + url);
            onError(client, error);
        }
    }, onError);
}
