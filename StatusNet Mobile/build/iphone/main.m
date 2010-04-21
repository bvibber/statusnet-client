//
//  Appcelerator Titanium Mobile
//  WARNING: this is a generated file and should not be modified
//

#import <UIKit/UIKit.h>
#define _QUOTEME(x) #x
#define STRING(x) _QUOTEME(x)

NSString * const TI_APPLICATION_DEPLOYTYPE = @"development";
NSString * const TI_APPLICATION_ID = @"new.status.client.mobile";
NSString * const TI_APPLICATION_PUBLISHER = @"StatusNet, Inc.";
NSString * const TI_APPLICATION_URL = @"StatusNet, Inc.";
NSString * const TI_APPLICATION_NAME = @"StatusNet Mobile";
NSString * const TI_APPLICATION_VERSION = @"1.0";
NSString * const TI_APPLICATION_DESCRIPTION = @"StatusNet Mobile Client";
NSString * const TI_APPLICATION_COPYRIGHT = @"2010 StatusNet, Inc.";
NSString * const TI_APPLICATION_GUID = @"cca143fb-473f-4e8c-9bcb-91b02a08e548";
BOOL const TI_APPLICATION_ANALYTICS = true;

#ifdef DEBUG
NSString * const TI_APPLICATION_RESOURCE_DIR = @"/Users/zcopley/Documents/Projects/statusnet-client/StatusNet Mobile/build/iphone/build/Debug-iphonesimulator/StatusNet Mobile.app";
#endif

int main(int argc, char *argv[]) {
    NSAutoreleasePool * pool = [[NSAutoreleasePool alloc] init];

#ifdef __LOG__ID__
	NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
	NSString *documentsDirectory = [paths objectAtIndex:0];
	NSString *logPath = [documentsDirectory stringByAppendingPathComponent:[NSString stringWithFormat:@"%s.log",STRING(__LOG__ID__)]];
	freopen([logPath cStringUsingEncoding:NSUTF8StringEncoding],"w+",stderr);
	fprintf(stderr,"[INFO] Application started\n");
#endif

    int retVal = UIApplicationMain(argc, argv, nil, nil);
    [pool release];
    return retVal;
}