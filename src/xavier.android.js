/*************************************************************************************
 * (c) 2018-2019, nStudio, LLC
 *
 * Licensed under the APACHE license
 *
 * We do contract work in most languages, so let us solve your problems!
 *
 * Any questions please feel free to email me or put a issue up on the github repo
 * Version 2.0.0                                            NAnderson@nstudio.io
 ************************************************************************************/
"use strict";
/* global android, com, java, javax, global, com.blacksharktech */

const permissions = require("nativescript-permissions");
const application = require("application");
const Color = require("color").Color;
const Font = require("ui/styling/font").Font;

// Results from the Request
const RESULT_CANCELED = 0;
const RESULT_OK = -1;

// Each new Passport class object gets its own RequestID
let requestID = 2000;


/**
 * Create a new Passport Scanner Object
 * @param options
 * @returns {Passport}
 * @constructor
 */
function Passport(options) {
    if (!this instanceof Passport) { // jshint ignore:line
        //noinspection JSValidateTypes
        return new Passport(options);
    }
    this._callbacks = {"results": [], "error": [], "closed": []};
    this._debug = false;

    // Valid options
    const validOptions = {
        "boundingBoxSearchingColor": null,
        "boundingBoxFoundColor": null,
        "closeButtonColor": null,
        "flashOnButtonColor": null,
        "flashOffButtonColor": null,
        "flashButtonEnabled": null,
        "instructionTextEnabled": null,
        "instructionText": null,
        "instructionTextColor": null,
        "instructionTextFont": null,
        "cameraNegativeSpaceBackgroundEnabled": null,
        "cameraNegativeSpaceBackgroundColor": null,
    };

    var customization=null;
    if (options) {
        for (let key in options) {
            if (options.hasOwnProperty(key) && validOptions.hasOwnProperty(key)) {
                if (customization === null) {
                    customization = new com.blacksharktech.xavierlib.Customization();
                }
                if (key.indexOf("Color") > 0) {
                    if (typeof options[key] === "string") {
                        // A String value - i.e. "#112233";
                        customization[key] = new Color(options[key]).android;
                    } else if (options[key] instanceof Color) {
                        // A NativeScript color object
                        customization[key] = options[key].android;
                    } else {
                        // Assume this is a native Android color
                        customization[key] = options[key];
                    }
                } else if (key.indexOf("Enabled") > 0) {
                    // Force Boolean value
                    customization[key] = !!options[key];
                } else if (key.indexOf("Font") > 0) {
                    if (typeof options[key] === "string") {
                      customization[key] = new Font(options[key], undefined, "normal", "normal").getAndroidTypeface();
                    } else if (options[key] instanceof Font) {
                       customization[key] = options[key].getAndroidTypeface();
                    } else {
                        // Assume this is a native Android font Typeface
                        customization[key] = options[key];
                    }
                } else {
                    customization[key] = options[key];
                }
            } else if (key === "license key") {
                continue;
            } else {
                console.error("Passport Options does not contain a valid key", key);
            }
        }
    } else {
        console.error("Missing License Key");
    }


    com.blacksharktech.xavierlib.XavierSDK.getInstance().setAppKey(options['license key']);
    if (customization) {
        com.blacksharktech.xavierlib.XavierSDK.getInstance().setCustomization(customization);
    }

    this._activityResult = this.activityResult.bind(this);
    this._requestID = requestID++;
}

Passport.prototype.enableCloseHack = function() {
    /* Do Nothing; iOS only issue */
};

/**
 * Enabled debug logging
 */
Passport.prototype.enableDebug = function() {
    this._debug = true;
};

/**
 * Add Event listener
 * @param event
 * @param callback
 * @param thisArg
 */
Passport.prototype.addEventListener = function(event, callback, thisArg) {
    if (typeof this._callbacks[event] === 'undefined') {
        throw new Error("This event " + event + " does not exist");
    }
    if (typeof callback !== 'function') {
        throw new Error("Callback should be a function!");
    }
    this._callbacks[event].push({callback: callback, thisArg: thisArg});
};

/**
 * Removes an event listener
 * @param event
 * @param callback
 * @param thisArg
 */
Passport.prototype.removeEventListener = function(event, callback, thisArg) {
    if (typeof this._callbacks[event] === 'undefined') {
        throw new Error("This event " + event + " does not exist");
    }
    if (callback == null) {
        this._callbacks[event] = [];
        return;
    }
    for (let i=0;i<this._callbacks[event].length;i++) {
        if (this._callbacks[event][i].callback === callback) {
            if (thisArg && thisArg !== this._callbacks[event][i].thisArg) { continue; }
            this._callbacks[event].splice(i, 1);  i--;
        }
    }

};

/**
 * Notifies an event of an event
 * @param event
 * @returns {*}
 * @private
 */
Passport.prototype._notify = function(event) {
    var eh = this._callbacks[event];
    var args = Array.prototype.slice.call(arguments, 1);
    if (typeof eh !== 'undefined' && eh.length) {
        for (var i = 0; i < eh.length; i++) {
            var thisArg = eh[i].thisArg || this;
            eh[i].callback.apply(thisArg, args);
        }
    }
};

/**
 * Add a Event listener
 */
Passport.prototype.on = Passport.prototype.addEventListener;

/**
 * Remove a event listener
 */
Passport.prototype.off = Passport.prototype.removeEventListener;

/**
 * Start the scanning process
 */
Passport.prototype.start = function() {
    if (permissions.hasPermission(android.Manifest.permission.CAMERA) &&
        permissions.hasPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE) &&
        permissions.hasPermission(android.Manifest.permission.INTERNET) &&
        permissions.hasPermission("android.permission.FLASHLIGHT")) {
        this._start();
    } else {
        permissions.requestPermission([
            "android.permission.FLASHLIGHT",
            android.Manifest.permission.CAMERA,
            android.Manifest.permission.INTERNET,
            android.Manifest.permission.WRITE_EXTERNAL_STORAGE], "Need access to scan via Camera")
        .then(() => {
            this._start();
        });
    }
};

/**
 * Start the actual scanning, once we made sure we have the permissions
 * @private
 */
Passport.prototype._start = function() {
    if (this._debug) {
        console.log("Starting Xavier", this._requestID);
    }

    application.android.on("activityResult", this._activityResult);

    var intent = new android.content.Intent(application.android.context, com.blacksharktech.xavierlib.XavierActivity.class);
    intent.setFlags(android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP);
    application.android.foregroundActivity.startActivityForResult(intent, this._requestID);
};

/**
 * Used by Xavier to return the results or an error
 * @param event
 */
Passport.prototype.activityResult = function(event) {
    try {
        if (event.requestCode !== this._requestID) {
            return;
        }
        if (this._debug) {
            console.log("Activity Result from Xavier: ", event.requestCode, "Result:", event.resultCode);
        }

        // We no longer need to track Activity Results
        application.android.off("activityResult", this._activityResult);

        // Check for Cancelled or not-ok...
        if (event.resultCode === RESULT_CANCELED) {
            const error = event.intent.getStringExtra(com.blacksharktech.xavierlib.XavierActivity.ERROR_MESSAGE);
            if (error && error.length > 0) {
                this._handleError(error);
            } else {
                this._handleError("cancelled");
            }
            return;
        }  else if (event.resultCode !== RESULT_OK) {
            this._handleError(event.resultCode);
            return;
        }

        let results = fromHashMap(event.intent.getSerializableExtra(com.blacksharktech.xavierlib.XavierActivity.DOCUMENT_INFO));
        let bytes = event.intent.getByteArrayExtra(com.blacksharktech.xavierlib.XavierActivity.DOCUMENT_IMAGE);
        let bitmap = null;
        if (bytes) {
            bitmap = com.blacksharktech.xavierlib.PhotoUtil.convertByteArrayToBitmap(bytes);
        }

        if (results && results.length > 0) {
            if (this._debug) {
                console.log("Has Results");
                console.log(results);
            }
            this._handleData(results, bitmap);
            return;
        }
    } catch (err) {
        console.error("Error", err, err.stack);
        this._handleError(err);
        return;
    }

    this._notify("closed", null);
};

/**
 * Handles an Error from Xavier
 * @param error
 * @private
 */
Passport.prototype._handleError = function(error) {
    try {
        this._notify("error", error);
        this._notify("closed", null);
    } catch (err) {
        console.error("Error in Notifying about an Xavier error", error, error.stack);
    }
};

/**
 * Parsed the Return data into a structure that can be used
 * @param rawMRZ
 * @private
 */
Passport.prototype._handleData = function(data, image) {
    try {
        let results = {data: data, image: image};

        this._notify("results", results);
        this._notify("closed", null);

    } catch (error) {
        this._handleError(error);
    }
};

module.exports = Passport;


/**
 * Converts an JS Object into a Java HashMap
 * @param obj
 * @returns {java.util.HashMap}
 */
function toHashMap(obj) {
    let map = new java.util.HashMap();

    for (let property in obj) {
        if (!obj.hasOwnProperty(property)) { continue; }
        if (obj[property] == null) { continue; }

        var val = obj[property];
        switch (typeof val) {
            case 'object':
                map.put(property, toHashMap(val, map));
                break;

            case 'boolean':
                map.put(property, java.lang.Boolean.valueOf(String(val)));
                break;

            case 'number':
                map.put(property, java.lang.Integer.valueOf(String(val)));
                break;

            case 'string':
                map.put(property, String(val));
                break;
        }
    }

    return map;
}

/**
 * Converts from a Hash Map
 * @param javaObject
 */
function fromHashMap(javaObject) {
    let result = {};
    let iterator = javaObject.entrySet().iterator();
    while (iterator.hasNext()) {
        let item = iterator.next();
        switch (item.getClass().getName()) {
            case 'java.util.HashMap':
                result[item.getKey()] = fromHashMap(item.getValue());
                break;
            case 'java.lang.String':
                result[item.getKey()] = String(item.getValue());
                break;
            case 'java.lang.Boolean':
                result[item.getKey()] = Boolean(String(item.getValue()));
                break;
            case 'java.lang.Integer':
            case 'java.lang.Float':
            case 'java.lang.Long':
            case 'java.lang.Double':
                result[item.getKey()] = Number(String(item.getValue()));
                break;
            default:
                result[item.getKey()] = item.getValue();
        }
    }
    return result;
}