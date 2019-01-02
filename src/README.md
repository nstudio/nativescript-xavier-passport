[![npm](https://img.shields.io/npm/v/@nstudio/nativescript-xavier-passport.svg)](https://www.npmjs.com/package/@nstudio/nativescript-xavier-passport)
[![npm](https://img.shields.io/npm/l/@nstudio/nativescript-xavier-passport.svg)](https://www.npmjs.com/package/@nstudio/nativescript-xavier-passport)
[![npm](https://img.shields.io/npm/dt/@nstudio/nativescript-xavier-passport.svg?label=npm%20d%2fls)](https://www.npmjs.com/package/@nstudio/nativescript-xavier-passport)

# NativeScript Xavier-Passport

This is a NativeScript cross platform plugin wrapping the Black Shark Tech Xavier library for IOS and Android.

## License

Our code is 2018-2019, nStudio, LLC.  Everything is LICENSED under the APACHE 2.0 License, meaning you are free to include this in any type of program.  
However, the base Xavier library must be licensed from them. 
https://github.com/BlackSharkTech/Xavier-demo-android
and 
https://github.com/BlackSharkTech/Xavier-demo-ios


## Installation 
Same plugin works on  NativeScript 2.x - 5.x

Run `tns plugin add @nstudio/nativescript-xavier-passport` in your ROOT directory of your project.

## Android Required Setup
In your app/App_Resources/Android/src/main/res/AndroidManifest.xml you need to do the following:
1. Add `xmlns:tools="http://schemas.android.com/tools"` to the `<Manifest ...`
2. In the `<uses-sdk` change the android:minSdkVersion="XX" to at least 21.
3. Int the `<application` add `tools:replace="android:allowBackup"`  
![Files](../docs/xavier_android_manifest.png)


## Usage

### Start Scanning
```js
var Passport = require('nativescript-xavier-passport');

var zp = new Passport({"license key":"<LICENSE_KEY>"});
zp.on("results", function(results) { console.log("Results:", results); });
zp.start();

```

### Enable more debugging
```
zp.enableDebugging()
``` 
Will enable more logs to be output to the log system.


### Events
```js
zp.on("error", function(error) { console.log("Error", error); });
zp.on("closed", function() { console.log("Closed the reader"); });
zp.on("results", function(results) { console.log("Results", results); });
```

- `results` - Will give you an object with keys for everything including the raw data as the "raw" key.
- `error`   - Will give you the error message from Xavier or if your results or close event code is buggy then the error from your code will be also passed back via this callback.
- `closed`  - Will be triggered when it closes the scanning screen. (on iOS this is triggered several times)  
 
## Demo
 
 Please see the demo source.
   
