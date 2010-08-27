StatusNet.HttpClient = {};

/**
 * Start an asynchronous, web call. If username and password are provided,
 * use HTTP Basic Auth.  If the data argument is supplied the request will
 * be a POST, otherwise it will be a GET. Any needed parameters for GET
 * must be in the url, as part of the path or query string.
 *
 * @param string   url         the URL
 * @param callable onSuccess   callback function called after successful HTTP fetch: function(status, responseXML, responseText)
 * @param callable onError     callback function called if there's an HTTP error: function(status, responseXML, responseText)
 * @param mixed    data        any POST data, as either raw string or dictionary of key-value pairs; values that are blobs will be uploaded as attachments
 * @param String   username    optional username for HTTP Basic Auth
 * @param String   password    optional password for HTTP Basic Auth
 */
StatusNet.HttpClient.webRequest = function(url, onSuccess, onError, data, username, password, attachment) {

    StatusNet.debug("in webRequest");

    try {

        var client = Titanium.Network.createHTTPClient();

        if (Titanium.Network.online == false) {
           StatusNet.debug("No internet.");
           onError(client, "No Internet connection!");
           return;
        }

        client.onload = function() {

            StatusNet.debug("XYZ webRequest: in onload, before parse " + this.status);

            var responseXML = null;
            var type = client.getResponseHeader('Content-Type');
            if (/^[^\/]+\/(.+\+)?xml(;|$)/.test(type) && type != 'application/vnd.wap.xhtml+xml') {
                // Don't check the responseXML property until we've confirmed
                // this is supposed to be an XML fetch, or it'll throw an
                // exception on iPhone.
                //
                // Also skipping the wap/xhtml which our mobileprofile currently
                // sends to things it thinks are iphones... there's not currently
                // a good guarantee of correctness. Sigh.
                StatusNet.debug("XML? " + type);
                responseXML = this.responseXML;
                if (responseXML == null) {
                    StatusNet.debug("Trying a manual XML parse...");
                    try {
                        responseXML = StatusNet.Platform.parseXml(this.responseText);
                    } catch (e) {
                        responseXML = null;
                    }
                }
            } else {
                StatusNet.debug("Not XML? " + type);
                responseXML = null;
            }

            StatusNet.debug("webRequest: after parse, before onSuccess");

            if (this.status == 200) {
                StatusNet.debug("webRequest: calling onSuccess");
                onSuccess(this.status, responseXML, this.responseText);

                StatusNet.debug("webRequest: after onSuccess");

            } else {
                StatusNet.debug("webRequest: calling onError");

                onError(this.status, responseXML, this.responseText);
            }
            StatusNet.debug("webRequest: done with onload.");
        };

        // @fixme Hack to work around bug in the Titanium Desktop 1.2.1
        // onload will not fire unless there a function assigned to
        // onreadystatechange.
        client.onreadystatechange = function() {
            // NOP
        };

        // XXX: client.onerror is only called by mobile's HTTPClient
        client.onerror = function(e) {
            StatusNet.debug("webRequest: failure!");
            onError(client.status, "Error: " + e.error);
        };

        if (data) {
            StatusNet.debug("HTTP POST to: " + url);
            client.open("POST", url);
        } else {
            StatusNet.debug("HTTP GET to: " + url);
            client.open("GET", url);
        }

        if (username && password) {
            // @fixme Desktop vs Mobile auth differences HTTPClient hack
            //
            // Titanium Mobile 1.3.0 seems to lack the ability to do HTTP basic auth
            // on its HTTPClient implementation. The setBasicCredentials method
            // claims to exist (typeof client.setBasicCredentials == 'function') however
            // calling it triggers an "invalid method 'setBasicCredentials:'" error.
            // The method is also not listed in the documentation for Mobile, nor do I see
            // it in the source code for the proxy object.
            //
            // Moreover, the Titanium.Utils namespace, which contains the base 64 utility
            // functions, isn't present on Desktop. So for now, we'll check for that and
            // use the manual way assuming it's mobile. Seriously, can't the core libs be
            // synchronized better?
            StatusNet.debug("webRequest: Titanium.Utils is: " + typeof Titanium.Utils);
            StatusNet.debug("webRequest: client.setBasicCredentials is: " + typeof client.setBasicCredentials);
            if (typeof Titanium.Utils == "undefined") {
                client.setBasicCredentials(username, password);
            } else {
                // @fixme Desktop vs Mobile auth differences HTTPClient hack
                // setRequestHeader must be called between open() and send()
                var auth = 'Basic ' + Titanium.Utils.base64encode(username + ':' + password);
                //StatusNet.debug("webRequest: Authorization: " + auth);
                client.setRequestHeader('Authorization', auth);
            }
        }

        if (data) {
            StatusNet.debug('webRequest: sending data: ' + data);
            // Titanium Mobile/iPhone doesn't set Content-Type, which breaks PHP's processing.
            if (typeof data == "string") {
                client.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                //client.setRequestHeader('Content-Type', 'multipart/form');
            }
            client.send(data);
            //client.send(StatusNet.HttpClient.formData(data));
        } else {
            client.send();
        }

    } catch (e) {
        StatusNet.debug('webRequest: HTTP client exception: ' + e);
        onError(client, e);
    }
};

StatusNet.HttpClient.fetchFile = function(url, file, onSuccess, onError) {

    try {

        var client = Titanium.Network.createHTTPClient();

        if (Titanium.Network.online == false) {
           StatusNet.debug("No internet.");
           onError(client.status, "No Internet connection!");
           return;
        }

        client.onreadystatechange = function() {
            if (client.readyState == 4) {
                // XXX: write() always returns false on iPhone 1.4.1 SDK. Works Okay on Android.
                file.write(client.responseData) 
                if (file.exists()) {
                    StatusNet.debug("HttpClient.fetchFile - saved file: " + file.nativePath);
                    onSuccess(client.status);
                } else {
                    StatusNet.debug("HttpClient.fetchFile - could not save file: " + file.nativePath);
                }
            }
        };

        // XXX: client.onerror is only called by mobile's HTTPClient
        client.onerror = function(e) {
            StatusNet.debug("fetchFile: failure!");
            onError(client.status, "Error: " + e.error);
        };

        client.open("GET", url);
        client.send();

    } catch (e) {
        StatusNet.debug('fetchFile: HTTP client exception: ' + e);
        onError(client.status, e);
    }
}


/**
 * @param mixed    data        any POST data, as either raw string or dictionary of key-value pairs; values that are blobs will be uploaded as attachments
 */
/*StatusNet.HttpClient.formData = function(data) {
    if (typeof data == "string") {
        return data;
    } else {
        var simple = [];
        var fancy = [];
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var val = data[key];
                if (val instanceof Titanium.Blob) {
                    fancy.push wtf;
                } else {
                    simple.push(key + '=' + val);
                }
            }
        }
    }
}*/
