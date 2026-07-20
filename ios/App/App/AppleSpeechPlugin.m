#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(AppleSpeechPlugin, "AppleSpeech",
    CAP_PLUGIN_METHOD(startRecognition, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(stopRecognition, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
)
