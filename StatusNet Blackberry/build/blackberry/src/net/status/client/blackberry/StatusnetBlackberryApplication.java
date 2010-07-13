package net.status.client.blackberry;

import org.appcelerator.titanium.TiApplication;
import ti.modules.titanium.api.APIModule;

public class StatusnetBlackberryApplication extends TiApplication {
	public StatusnetBlackberryApplication() 
	{
		super();

		appInfo = new StatusnetBlackberryAppInfo(this);
		
		APIModule apiModule = new APIModule();
		apiModule.equals(apiModule);
	}

	public static void main(String[] args) {
		StatusnetBlackberryApplication instance = new StatusnetBlackberryApplication();
		instance.enterEventDispatcher();
	}

    public String getAppId() 
    {
        return "net.status.client.blackberry";
    }

}

