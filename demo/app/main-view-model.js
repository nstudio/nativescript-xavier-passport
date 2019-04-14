"use strict";

const Observable = require("data/observable").Observable;
const ObservableArray = require("data/observable-array").ObservableArray;

// This is the Plugin to require
const Passport = require('@nstudio/nativescript-xavier-passport');

/** Put the Key here **/

// Put your license key here...
let licenseKey = "Your License Key";

// Used for my local version; to eliminate committing my test license key to the repo.  :)
if (licenseKey === "Your License Key") {
    try {
        licenseKey = require("./license.key.js");
    } catch (err) {
        console.log("Missing key", err);
        licenseKey = "";  // No License Key
    }
}

// Throw an error if no license key is setup!
if (licenseKey === "Your License Key" || licenseKey === "") {
    throw new Error("You are missing your License key");
}

const pp = new Passport({
    "licenseKey": licenseKey,
    "boundingBoxSearchingColor": "#FF0000",
    "instructionTextEnabled": true,
    "instructionText": "Hi these are instructions",
    "instructionTextFont": "monospace"
});

// Only if you want to see lots of logging.  :)
pp.enableDebug();

// These are the three events exposed
// This event is triggered when the window will be or has been closed; iOS may report this twice per close.
pp.on("closed", closed);

// This event has all the results of the scan
pp.on("results", results);

// This Event is when an error occurs
pp.on("error", error);

// Current fix for an IOS bug.  If they fix it; then we just don't call this function
pp.enableCloseHack();

const viewModel = new Observable();

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
    let name = "Unknown";
    if (results) {
        name = results.givenName || results.documentNumber;
    }
    viewModel.list.push({item: "Results: "+name });
    if (results) {
        console.log("Image Type?" , typeof results.documentImage);
        viewModel.list.push({item: "Image: " + (results.documentImage != null ? "Yes" : "No")});
    }
    viewModel.message = "Results: "+name;
}
