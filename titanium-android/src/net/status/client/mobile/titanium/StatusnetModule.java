/**
 * StatusNet Mobile
 * http://status.net/wiki/Client
 *
 * Optimized Java implementation of our XML mapping loop for Android.
 * October 2010: Updated to Titanium Mobile 1.5's new Android module format.
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

package net.status.client.mobile.titanium;

import java.util.ArrayList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConfig;

import ti.modules.titanium.xml.ElementProxy;
import ti.modules.titanium.xml.NodeProxy;

import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import android.content.Intent;

@Kroll.module(name="Statusnet", id="net.status.client.mobile.titanium")
public class StatusnetModule extends KrollModule
{

    // Standard Debugging variables
    private static final String LCAT = "StatusnetModule";
    private static final boolean DBG = TiConfig.LOGD;

    public StatusnetModule(TiContext tiContext) {
        super(tiContext);
    }

    /**
     * Helper for StatusNet.AtomParser.mapOverElements()
     *
     * Transitioning between Java and JS code appears to be insanely
     * inefficient, so we're going to try to minimize it here...
     * We can't call the callbacks directly, since they'd get called
     * asynchronously. Instead, we build a list of output items!
     *
     * Return value should look something like:
     * [{node: el1, name: "link", text: ""},
     *  {node: el2, name: "author", text: "Foo Bar"},
     *  {node: el3, name: "link", text: ""}]
     *
     * Caller can then iterate over that list and make direct calls
     * within the JS context.
     */
    @Kroll.method
    public Object[] mapOverElementsHelper(Object parent, KrollDict map) {
        ArrayList<KrollDict> matches = new ArrayList<KrollDict>();

        NodeList list = ((NodeProxy)parent).getNode().getChildNodes();
        int last = list.getLength();
        for (int i = 0; i < last; i++) {
            Node el = list.item(i);
            if (el.getNodeType() == Node.ELEMENT_NODE) {
                String name = el.getNodeName();
                Object target = map.get(name);
                if (target != null) {
                    KrollDict dict = new KrollDict();

                    ElementProxy proxy = (ElementProxy)NodeProxy.getNodeProxy(getTiContext(), el);

                    KrollDict attribsDict = new KrollDict();
                    NamedNodeMap attributes = el.getAttributes();
                    int numAttribs = attributes.getLength();
                    for (int j = 0; j < numAttribs; j++) {
                        Node attrib = attributes.item(j);
                        attribsDict.put(attrib.getNodeName(), attrib.getNodeValue());
                    }

                    dict.put("name", name);
                    dict.put("node", proxy);
                    dict.put("text", proxy.getText());
                    dict.put("attributes", attribsDict);

                    matches.add(dict);
                }
            }
        }
        return matches.toArray();
    }

    /**
     * Offer some text to be shared to any app that takes the 'send' intent
     * for text/plain.
     *
     * Fun fact: the only reason this can't be done with EmailDialog as is
     * is the hardcoded MIME type. :)
     *
     * When the android_native_refactor branch lands, it should be possible
     * to do this directly from within JS code.
     */
    @Kroll.method
    public void shareText(String prompt, String text) {
        Intent send = new Intent(Intent.ACTION_SEND);
        send.setType("text/plain");
        send.putExtra(Intent.EXTRA_TEXT, text);

        Intent chooser = Intent.createChooser(send, prompt);

        getTiContext().getActivity().startActivity(chooser);
    }

}
