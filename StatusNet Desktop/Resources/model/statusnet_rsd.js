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
        StatusNet.debug("RSD loaded: " + this.status);
        if (this.status == 200) {

            if (Titanium.version < '1.3.0') {
                // @fixme Argh. responseXML is unimplemented in Titanium 1.2.1 So we have
                // to use this work-around.
                var responseXML = (new DOMParser()).parseFromString(this.responseText, "text/xml");
            } else {
                // Is implemented in Titanium Mobile 1.3, whereas the above doesn't work there.
                if (this.responseXML == null) {
                    // Titanium Mobile 1.3/Android doesn't implement responseXML,
                    // and 'new DOMParser()' doesn't work like on Desktop 1.2.
                    var responseXML = Titanium.XML.parseString(this.responseText);
                } else {
                    // Actually works on Titanium Mobile 1.3/iPhone
                    var responseXML = this.responseXML;
                }
            }

            onSuccess(this.status, responseXML);
        } else {
            onError(client, "HTTP status: " + this.status);
        }
    };

    client.onerror = function(e) {
        StatusNet.debug("RSD error: " + e.error);
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
    StatusNet.debug("Sent and waiting...");
}

/**
 * @param string url
 * @param onSuccess function(apiroot)
 * @param onError function(client, error)
 */
StatusNet.RSD.discoverTwitterApi = function(url, onSuccess, onError) {
    StatusNet.RSD.discover(url, function(status, xml) {
        StatusNet.debug("Got RSD info for " + url);

        // jQuery selector engine doesn't work with the utter fail that is the
        // DOM implementation in Titanium Mobile/iPhone. :(
        //
        //var apiroot = $("api[name='Twitter']", xml).attr("apiLink");

        StatusNet.debug("... xml: " + xml);
        var apis = xml.getElementsByTagName('api');
        StatusNet.debug('RSD api elements: ' + apis);
        StatusNet.debug('RSD api elements length: ' + apis.length);
        for (var i = 0; i < apis.length; i++) {
            StatusNet.debug('RSD iter ' + i);
            var api = apis.item(i);
            StatusNet.debug('RSD iter ' + i + ' api: ' + api);
            var apiroot = api.getAttribute('apiLink');
            if (apiroot && api.getAttribute('name') == 'Twitter') {
                StatusNet.debug("Got RSD info with Twitter API for " + url + " : " + apiroot);
                onSuccess(apiroot);
                return;
            }
            StatusNet.debug('RSD iter ' + i + ' out');
        }
        StatusNet.debug("Got RSD info but no Twitter API for " + url);
        onError(client, error);
    }, onError);
}
