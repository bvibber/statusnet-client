StatusNet.HttpClient = {};

/**
 * Start an asynchronous, web call. If username and password are provided,
 * use HTTP Basic Auth.  If the data argument is supplied the request will
 * be a POST, otherwise it will be a GET. Any needed parameters for GET
 * must be in the url, as part of the path or query string.
 *
 * @param string   url         the URL
 * @param callable onSuccess   callback function called after successful HTTP fetch: function(status, response)
 * @param callable onError     callback function called if there's an HTTP error: function(status, response)
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

            StatusNet.debug("webRequest: in onload, before parse " + this.status);

            StatusNet.debug(Titanium.version);

            var responseXML;
            if (this.responseXML == null) {
                if (typeof DOMParser != "undefined") {
                    // Titanium Desktop 1.0 doesn't fill out responseXML.
                    // We'll use WebKit's XML parser...
                    responseXML = (new DOMParser()).parseFromString(this.responseText, "text/xml");
                } else {
                    // Titanium Mobile 1.3 doesn't fill out responseXML on Android.
                    // We'll use Titanium's XML parser...
                    responseXML = Titanium.XML.parseString(this.responseText);
                }
            } else {
                responseXML = this.responseXML;
            }

            StatusNet.debug("webRequest: after parse, before onSuccess");

            if (this.status == 200) {
                StatusNet.debug("webRequest: calling onSuccess");
                onSuccess(this.status, responseXML);

                StatusNet.debug("webRequest: after onSuccess");

            } else {
                StatusNet.debug("webRequest: calling onError");

                onError(this.status, responseXML);
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
                StatusNet.debug("webRequest: Authorization: " + auth);
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
