/**********************************************************************************
 * (c) 2018, nStudio, LLC
 *
 * Licensed under the APACHE license
 *
 * We do contract work in most languages, so let us solve your problems!
 *
 * Any questions please feel free to email me or put a issue up on the github repo
 * Version 1.0.0                                            NAnderson@nstudio.io
 *********************************************************************************/
"use strict";
const application = require('application');

/* global Xavier, SCIXavierClientProtocol, NSObject, SCIXavierViewController, WeakRef, UIApplication, UIDevice, UIDeviceOrientation, dispatch_async, dispatch_get_current_queue */
/* global UIResponder, UIApplicationDelegate */


/**
 * SCIXavierClient Delegate
 */
const SCIXavierClientDelegate = NSObject.extend({
    _owner: null,
    _debug: false,
    onRawMrz: function(rawData) {
        if (this._debug) {
            console.log("OnRawMRZ", rawData);
        }
    },
    onMrzCaptureCompleted:function() {
        if (this._debug) {
            console.log("onMrzCaptureCompleted");
        }
    },
    onError: function(error) {
        if (this._debug) {
            console.log("onError", error);
        }
        let owner = this._owner.get();
        if (owner) {
            runOnUIThread(owner, owner._onError, error);
            //owner._onError(error);
        }
    },
    onParsedJsonFromlMrz: function(data) {
        if (this._debug) {
            console.log("onParsedJsonFromlMrz", data);
        }
        let owner = this._owner.get();
        if (owner) {
            runOnUIThread(owner, owner._onResult, data);
            //owner._onResult(data);
        }
    },
    onParsedXmlFromlMrz: function(data) {
        if (this._debug) {
            console.log("onParsedXmlFromlMrz", data);
        }
    },
    onMetrics: function(metrics) {
        if (this._debug) {
            console.log("onMetrics", metrics);
        }
    },
    onCapturedBarcode: function(barcode) {
        if (this._debug) {
            console.log("onCapturedBarcode", barcode);
        }
    },
    onCapturedImage: function(img) {
        if (this._debug) {
            console.log("Captured image");
        }
    },
    onClose: function() {
        if (this._debug) {
            console.log("Close");
        }
        let owner = this._owner.get();
        if (owner) {
            runOnUIThread(owner, owner._onClose, null);
            //owner._onClose();
        }
    }


}, { protocols: [ SCIXavierClientProtocol ] });

/**
 * We have to track the main NS thread because this plugin runs on a background thread...
 */
const main_queue = dispatch_get_current_queue();

/***
 * Create a new Passport Scanner object
 * @param options
 * @returns {*|Passport}
 * @constructor
 */
function Passport(options) {
    this._portrait = false;
    if (!this instanceof Passport) { // jshint ignore:line
        //noinspection JSValidateTypes
        return new Passport(options);
    }
    if (options && options["portrait mode"]) {
        this._portrait = true;
    }
    this._callbacks = {"results": [], "error": [], "closed": []};
    this._debug = false;

    this._delegate = new SCIXavierClientDelegate();
    this._delegate._owner = new WeakRef(this);
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
Passport.prototype._notify = function (event) {
    console.log("Notify", event);
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

Passport.prototype._onClose = function() {
        this._notify("closed");
};

Passport.prototype._onError = function(err) {
        this._notify("error", err);
};

Passport.prototype._onResult = function(rawString) {
    const res = {raw: ""};
    try {
        const result = JSON.parse(rawString);
        if (result && result.parsedMRZ && result.parsedMRZ.parsedFieldList) {
            const pfl = result.parsedMRZ.parsedFieldList;
            for (let i = 0; i < pfl.length; i++) {
                res[pfl[i].name] = pfl[i].correctedValue;
            }
            console.log(res);
            this._notify("results", res);
        }
    } catch (err) {
        console.log("Error", err);
        this._onError(err);
    }
};



/**
 * Start the scanning for Passport data
 */
Passport.prototype.start = function() {
    var xavierViewController = SCIXavierViewController.alloc().init(this._portrait);
    xavierViewController._clientProtocol = this._delegate;
    this._delegate._debug = this._debug;

	const viewController = UIApplication.sharedApplication.keyWindow.rootViewController;
    if (viewController) {            
             if (!UIApplication.sharedApplication.delegate.respondsToSelector("window")) {
                 throw new Error("Please see documentation on how to fix the iOS Responder");
             }

             viewController.presentViewControllerAnimatedCompletion(xavierViewController, false, null);        
    }
};


module.exports = Passport;


function runOnUIThread(owner, uiAction, state) {
    dispatch_async(main_queue, function() {
            uiAction.call(owner, state);
    });

    return true;
}
