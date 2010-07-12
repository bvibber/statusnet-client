package new.status.client.mobile;

import org.appcelerator.titanium.TiApplication;
import ti.modules.titanium.api.APIModule;

public class StatusnetMobileApplication extends TiApplication {
	public StatusnetMobileApplication() 
	{
		super();

		appInfo = new StatusnetMobileAppInfo(this);
		
		APIModule apiModule = new APIModule();
		apiModule.equals(apiModule);
	}

	public static void main(String[] args) {
		StatusnetMobileApplication instance = new StatusnetMobileApplication();
		instance.enterEventDispatcher();
	}

    public String getAppId() 
    {
        return "new.status.client.mobile";
    }

}

