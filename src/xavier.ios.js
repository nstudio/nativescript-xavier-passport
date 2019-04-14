/**********************************************************************************
 * (c) 2018-2019, nStudio, LLC
 *
 * Licensed under the APACHE license
 *
 * We do contract work in most languages, so let us solve your problems!
 *
 * Any questions please feel free to email me or put a issue up on the github repo
 * Version 2.0.2                                            NAnderson@nstudio.io
 *********************************************************************************/
"use strict";

/* global NSObject, WeakRef, UIApplication, UIDevice, UIDeviceOrientation, dispatch_async, dispatch_get_current_queue */
/* global UIResponder, UIApplicationDelegate, XavierWrapperDelegate */

const Color = require("color").Color;
const Font = require("ui/styling/font").Font;



/**
 * XavierWrapper Delegate
 */
const XavierWDelegate = NSObject.extend({
    _owner: null,
    _debug: false,
    didFinishTaskWithStatusData: function(status, data) {
        if (this._debug) {
            console.log("Callback", status);
        }
        const owner = this._owner.get();
        if (owner) {
            if (status === true) {
                owner._onResult(data);
            }
            owner._onClose();
        }
    }
}, { protocols: [ XavierWrapperDelegate ] });

/***
 * Create a new Passport Scanner object
 * @param options
 * @returns {*|Passport}
 * @constructor
 */
function Passport(options) {
    if (!this instanceof Passport) { // jshint ignore:line
        //noinspection JSValidateTypes
        return new Passport(options);
    }

    this._callbacks = {"results": [], "error": [], "closed": []};
    this._debug = false;
    this._closeHack = false;
    this._alreadyClosed = false;
    this._hasClosedController = false;

    this._delegate = new XavierWDelegate();
    this._delegate._owner = new WeakRef(this);
    this._options = options;

    this._xavierWrapper = new xavierwrapper();
    this._xavierWrapper.setDelegateWithDelegate(this._delegate);
}

/**
 * Enabled debug logging
 */
Passport.prototype.enableDebug = function() {
    this._debug = true;
    this._delegate._debug = true;
    this._xavierWrapper.enableDebugging();
};

Passport.prototype.enableCloseHack = function() {
    this._closeHack = true;
    this._xavierWrapper.enableCloseHack();
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
Passport.prototype._notify = function (event) {
    //console.log("Notify", event);
    const eh = this._callbacks[event];
    const args = Array.prototype.slice.call(arguments, 1);
    if (typeof eh !== 'undefined' && eh.length) {
        for (let i = 0; i < eh.length; i++) {
            const thisArg = eh[i].thisArg || this;
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

Passport.prototype._onClose = function() {
    if (this._closeHack && this._alreadyClosed) { return; }
    this._close();
    this._alreadyClosed = true;
    this._notify("closed");
};

Passport.prototype._onError = function(err) {
    this._notify("error", err);
};

Passport.prototype.start = function() {
    // Clear the already closed flag on each "start"
    this._alreadyClosed = false;
    this._hasClosedController = false;

    if (!this._options || !this._options["licenseKey"]) {
        this._onError("Missing License key");
        this._onClose();
        return false;
    }


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

    let customization = {};
    if (this._options) {
        for (let key in this._options) {
            if (this._options.hasOwnProperty(key) && validOptions.hasOwnProperty(key)) {
                if (key.indexOf("Color") > 0) {
                    if (typeof this._options[key] === "string") {
                        // A String value - i.e. "#112233";
                        customization[key] = new Color(this._options[key]).ios;
                    } else if (this._options[key] instanceof Color) {
                        // A NativeScript color object
                        customization[key] = this._options[key].ios;
                    } else {
                        // Assume this is a native ios color
                        customization[key] = this._options[key];
                    }
                } else if (key.indexOf("Enabled") > 0) {
                    // Force Boolean value
                    customization[key] = !!this._options[key];
                } else if (key.indexOf("Font") > 0) {
                    if (typeof this._options[key] === "string") {
                        customization[key] = new Font(this._options[key], undefined, "normal", "normal").getUIFont({pointSize: 18});
                    } else if (this._options[key] instanceof Font) {
                        customization[key] = this._options[key].getUIFont({pointSize: 18});
                    } else {
                        // Assume this is a native iOS font Typeface
                        customization[key] = this._options[key];
                    }
                } else {
                    customization[key] = this._options[key];
                }

            }
        }
    }


    if (this._debug) {
        console.log("Starting Scanning", customization);
    }

    const viewController = UIApplication.sharedApplication.keyWindow.rootViewController;
    if (viewController) {
        viewController.presentViewControllerAnimatedCompletion(this._xavierWrapper, false, null);
        this._xavierWrapper.startScanningWithKeyDict(this._options["licenseKey"], NSDictionary.alloc().initWithDictionary(customization));
    }

};

Passport.prototype._close = function() {
    if (this._hasClosedController) { return; }
    this._hasClosedController = true;
    const viewController = UIApplication.sharedApplication.keyWindow.rootViewController;
    if (viewController) {
        viewController.dismissViewControllerAnimatedCompletion(true, null);
    }
};

Passport.prototype._onResult = function(rawDictionary) {
    try {
        this._close();
        const res = shallowObjectFromDictionary(rawDictionary);
        this._notify("results", res);
    } catch (err) {
        if (this._debug) {
            console.error("Error", err);
        }
        this._onError(err);
    }
};

// JS & TS exports; (TS expects it to be a key, JS frequently is root)
Passport.Passport = Passport;
module.exports = Passport;


function shallowObjectFromDictionary(dictionary) {
    let keys = dictionary.allKeys;
    let result = {};

    for (let loop = 0; loop < keys.count; loop++) {
        let key = keys[loop];
        result[key] = dictionary.objectForKey(key);
    }

    return result;
}


