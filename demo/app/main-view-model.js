"use strict";

const Observable = require("data/observable").Observable;
const ObservableArray = require("data/observable-array").ObservableArray;

// This is the Plugin to require
const Passport = require('@nstudio/nativescript-xavier-passport');

/** iOS requires the Key and email put in the App_Resources/iOS/Xavier.plist file **/
/** Android requires the Key put here **/

// Put your license key here...
let licenseKey = "Your License Key";

// Used for my local version; to eliminate committing my test license key to the repo.  :)
if (licenseKey === "Your License Key") {
    try {
        licenseKey = require("license.key.js");
    } catch (err) {
        licenseKey = "";  // No License Key
    }
}


// Throw an error if no license key is setup!
if (licenseKey === "Your License Key" || licenseKey === "") {
    throw new Error("You are missing your License key");
}


var pp = new Passport({
    "license key": licenseKey,
    "boundingBoxSearchingColor": "#FF0000",
    "instructionTextEnabled": true,
    "instructionText": "Hi these are instructions",
    "instructionTextFont": "monospace"
});

// Only if you want to see lots of logging.  :)
pp.enableDebug();


// These are the three events exposed
// This event is triggered when the window will be or has been closed; iOS reports this typically twice per close.
pp.on("closed", closed);

// This event has all the results of the scan
pp.on("results", results);

// This Event is when an error occurs
pp.on("error", error);


var viewModel = new Observable();

function createViewModel() {
    viewModel.message = "";
    viewModel.list = new ObservableArray();

    viewModel.onTap = function() {
        // This is how we start the scanning for a MRZ on a card or Passport
        pp.start();
    };

    return viewModel;
}
exports.createViewModel = createViewModel;

function closed() {
    viewModel.list.push({item: "Closed"});
}

function error(err) {
    viewModel.list.push({item: "Error: "+err});
    viewModel.message = "Error: "+err;
}

function results(results) {
    console.log("Results", results);
    var name = "Unknown";
    if (results) {
        name = results.bearerName || results.name;
    }
    viewModel.list.push({item: "Results: "+name });
    viewModel.message = "Results: "+name;
}
