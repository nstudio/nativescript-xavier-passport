import { Observable } from "tns-core-modules/data/observable";
import { ObservableArray } from "tns-core-modules/data/observable-array";

import { Passport } from "@nstudio/nativescript-xavier-passport";

// Put your license key here...
let licenseKey = "Your License Key";

// Used for my local version; to eliminate committing my test license key to the repo.  :)
if (licenseKey === "Your License Key") {
    try {
        licenseKey = require("./license.key.js");
    } catch (err) {
        console.log("Missing key", err);
    }
}


export class HelloWorldModel extends Observable {
    private _message = "Scan for Results";
    private list = new ObservableArray();
    private pp: Passport;

    constructor() {
        super();

        this.pp = new Passport({
            "licenseKey": licenseKey,
            "boundingBoxSearchingColor": "#FF0000",
            "instructionTextEnabled": true,
            "instructionText": "Hi these are instructions",
            "instructionTextFont": "monospace"
        });

        // Only if you want to see lots of logging.  :)
        this.pp.enableDebug();

        // These are the three events exposed
        // This event is triggered when the window will be or has been closed; iOS may report this twice per close.
        this.pp.on("closed", this.closed.bind(this));

        // This event has all the results of the scan
        this.pp.on("results", this.results.bind(this));

        // This Event is when an error occurs
        this.pp.on("error", this.error.bind(this));

        // Current fix for an IOS bug.  If they fix it; then we just don't call this function
        this.pp.enableCloseHack();
    }

    get message(): string {
        return this._message;
    }

    set message(value: string) {
        if (this._message !== value) {
            this._message = value;
            this.notifyPropertyChange("message", value);
        }
    }

    public onTap() {
        // This is how we start the scanning for a MRZ on a card or Passport
        this.pp.start();
    };

    closed() {
        this.list.push({item: "Closed"});
    }

    error(err) {
        this.list.push({item: "Error: "+err});
        this.message = "Error: "+err;
    }

    results(results) {
        console.log("Results", results);
        let name = "Unknown";
        if (results) {
            name = results.givenName || results.documentNumber;
        }
        this.list.push({item: "Results: "+name });
        if (results) {
            console.log("Image Type?" , typeof results.documentImage);
            this.list.push({item: "Image: " + (results.documentImage != null ? "Yes" : "No")});
        }
        this.message = "Results: "+name;
    }
}
