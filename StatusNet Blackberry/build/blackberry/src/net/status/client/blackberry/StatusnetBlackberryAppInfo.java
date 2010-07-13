package net.status.client.blackberry;

import org.appcelerator.titanium.ITiAppInfo;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiProperties;
import org.appcelerator.titanium.util.Log;

/* GENERATED CODE
 * Warning - this class was generated from your application's tiapp.xml
 * Any changes you make here will be overwritten
 */
public class StatusnetBlackberryAppInfo implements ITiAppInfo
{
	private static final String TAG = "AppInfo";
	
	
	public StatusnetBlackberryAppInfo(TiApplication app) {
	}
	
	public String getId() {
		return "net.status.client.blackberry";
	}
	
	public String getName() {
		return "StatusNet Blackberry";
	}
	
	public String getVersion() {
		return "1.0";
	}
	
	public String getPublisher() {
		return "StatusNet, Inc.";
	}
	
	public String getUrl() {
		return "http://status.net/";
	}
	
	public String getCopyright() {
		return "2010 by StatusNet";
	}
	
	public String getDescription() {
		return "A Blackberry client for StatusNet";
	}
	
	public String getIcon() {
		return "appicon.png";
	}
	
	public boolean isAnalyticsEnabled() {
		return true;
	}
	
	public String getGUID() {
		return "0f1ca825-f1c2-4739-9bd0-442b9f290626";
	}
	
	public boolean isFullscreen() {
		return false;
	}
	
	public boolean isNavBarHidden() {
		return false;
	}
}
