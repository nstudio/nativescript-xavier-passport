/*************************************************************************************
 * (c) 2018, nStudio, LLC
 *
 * Licensed under the APACHE license or contact me for a Support or Commercial License
 *
 * I do contract work in most languages, so let me solve your problems!
 *
 * Any questions please feel free to email me or put a issue up on the github repo
 * Version 1.0.0                                            NAnderson@nstudio.io
 ************************************************************************************/
"use strict";
/* global android, com, java, javax, global, xavier */

const application = require('application');
const permissions = require("nativescript-permissions");
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
        return new Passport();
    }
    this._callbacks = {"results": [], "error": [], "closed": []};
    this._debug = false;

    // Valid options, with their defaults
    this.options = {
        "Maximum MRZ candidates": 9,
        "OCR Timeout": 5,
        "previewing Color": "#0000ff",
        "mrz detected Color": "#008000",
        "close button text": "Close",
        "email address": "test@hotmail.com",
        "license key": "E12345678",
        "portrait mode": true
    };

    if (options) {
        for (let key in options) {
            if (options.hasOwnProperty(key) && this.options.hasOwnProperty(key)) {
                this.options[key] = options[key];
            } else {
                console.error("Passport Options does not contain the key", key);
            }
        }
    }

    this._hashmap = toHashMap(this.options);
    this._activityResult = this.activityResult.bind(this);
    this._requestID = requestID++;
}

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
    for (var i=0;i<this._callbacks[event].length;i++) {
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
        permissions.hasPermission("android.permission.FLASHLIGHT")) {
        this._start();
    } else {
        permissions.requestPermission([
            "android.permission.FLASHLIGHT",
            android.Manifest.permission.CAMERA,
            android.Manifest.permission.WRITE_EXTERNAL_STORAGE], "Need access to scan MZR via Camera")
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
    var intent = new android.content.Intent(application.android.context, xavier.blacksharktech.com.xavierlib.XavierActivity.class);
    intent.setFlags(android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP);
    intent.putExtra(xavier.blacksharktech.com.xavierlib.XavierActivity.SETTINGS, this._hashmap);
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
        application.android.off("activityResult", this._activityResult);

        var results = event.intent.getSerializableExtra(xavier.blacksharktech.com.xavierlib.XavierActivity.MRZ_LINES);
        var error = event.intent.getSerializableExtra(xavier.blacksharktech.com.xavierlib.XavierActivity.ERROR_MESSAGE);

        if (results && results.length > 0) {
            this._handleData(results);
            return;
        }
        if (error && error.length > 0) {
            this._handleError(error);
            return;
        }
    } catch (err) {
        console.error("Error", err, err.stack);
    }
    this._notify("closed");
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
Passport.prototype._handleData = function(rawMRZ) {
    try {
        let results = {raw: rawMRZ};
        let data = rawMRZ.replace(/{|<|}/g, " ").split(",");
        for (let i = 0; i < data.length; i++) {
            let item = data[i].trim().split("=");
            if (item.length === 2) {
                results[item[0]] = item[1];
            }
        }
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
    var map = new java.util.HashMap();

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
