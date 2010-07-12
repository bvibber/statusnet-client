package new.status.client.mobile;

import org.appcelerator.titanium.ITiAppInfo;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiProperties;
import org.appcelerator.titanium.util.Log;

/* GENERATED CODE
 * Warning - this class was generated from your application's tiapp.xml
 * Any changes you make here will be overwritten
 */
public class StatusnetMobileAppInfo implements ITiAppInfo
{
	private static final String TAG = "AppInfo";
	
	
	public StatusnetMobileAppInfo(TiApplication app) {
	}
	
	public String getId() {
		return "new.status.client.mobile";
	}
	
	public String getName() {
		return "StatusNet Mobile";
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
		return "2010 StatusNet, Inc.";
	}
	
	public String getDescription() {
		return "StatusNet Mobile Client";
	}
	
	public String getIcon() {
		return "logo.png";
	}
	
	public boolean isAnalyticsEnabled() {
		return true;
	}
	
	public String getGUID() {
		return "cca143fb-473f-4e8c-9bcb-91b02a08e548";
	}
	
	public boolean isFullscreen() {
		return false;
	}
	
	public boolean isNavBarHidden() {
		return false;
	}
}
