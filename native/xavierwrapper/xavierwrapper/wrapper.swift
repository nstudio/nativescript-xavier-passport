//
//  wrapper.swift
//  xavierwrapper
//
//  Created by Nathanael Anderson.
//  Copyright © 2018-2019 Nathanael Anderson. All rights reserved.
//

import Foundation
import XavierFramework


@objc public protocol XavierWrapperDelegate: AnyObject {
    @objc func didFinishTask(Status: Bool, Data: Dictionary<String, Any>?)
}

				
@objc public class xavierwrapper: UIViewController, XavierScannerDelegate {
    var mrz = MRZScanner();
    var _hasShown = 0;
    var _closeHack = false;
    var _debugging = false;
    weak var delegate: XavierWrapperDelegate?

    @objc public override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        self._hasShown = self._hasShown + 1
        if (self._debugging) {
            NSLog("!!!!! View Will Disappear! %d", self.children.count)
        }
    }

    @objc public override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        self._hasShown = self._hasShown + 1
        
        if (self._debugging) {
            NSLog("!!!!! View will Appear %d", self.children.count)
        }
        
        if (self._hasShown >= 3 && self._closeHack) {
            self.scanCancelled()
        }
        
    }
    
    public override func viewWillLayoutSubviews() {
        super.viewWillLayoutSubviews()
        if (self._debugging) {
            NSLog("!!!!! View will Layout subviews %d", self.children.count)
        }
    }
   
    @objc public func enableDebugging()
    {
        self._debugging = true;
    }
    
    @objc public func enableCloseHack() {
        self._closeHack = true;
    }
   
    @objc public func startScanning(key: String, dict: Dictionary<String, Any>) {
        if (self._debugging) {
            NSLog("!!!!!!! StartScanning function")
        }
        
        // Reset hack on each scan
        self._hasShown = 0
        
        // Assign settings
        if let boundingBoxSearchingColor = dict["boundingBoxSearchingColor"] {
            if (self._debugging) { NSLog("boundingBoxSearchingColor"); }
            self.mrz.boundingBoxSearchingColor = boundingBoxSearchingColor as! UIColor
        }
        if let boundingBoxFoundColor = dict["boundingBoxFoundColor"] {
            if (self._debugging) { NSLog("boundingBoxFoundColor") }
            self.mrz.boundingBoxFoundColor = boundingBoxFoundColor as! UIColor
        }
        if let closeButtonColor = dict["closeButtonColor"] {
            if (self._debugging) { NSLog("closeButtonColor") }
            self.mrz.closeButtonColor = closeButtonColor as! UIColor
        }
        if let flashOnButtonColor = dict["flashOnButtonColor"] {
            if (self._debugging) { NSLog("flashOnButtonColor") }
            self.mrz.flashOnButtonColor = flashOnButtonColor as! UIColor
        }
        if let flashOffButtonColor = dict["flashOffButtonColor"] {
            if (self._debugging) { NSLog("flashOffButtonColor") }
            self.mrz.flashOffButtonColor = flashOffButtonColor as! UIColor
        }
        if let flashOnButtonImage = dict["flashOnButtonImage"] {
            if (self._debugging) { NSLog("flashOnButtonImage") }
            self.mrz.flashOnButtonImage = (flashOnButtonImage as! UIImage)
        }
        if let flashOffButtonImage = dict["flashOffButtonImage"] {
            if (self._debugging) { NSLog("flashOffButtonImage") }
            self.mrz.flashOffButtonImage = (flashOffButtonImage as! UIImage)
        }
        if let flashButtonEnabled = dict["flashButtonEnabled"] {
            if (self._debugging) { NSLog("flashButtonEnabled") }
            self.mrz.flashButtonEnabled = flashButtonEnabled as! Bool
        }
        if let instructionTextEnabled = dict["instructionTextenabled"] {
            if (self._debugging) { NSLog("InstructionTextEnabled") }
            self.mrz.instructionTextEnabled = instructionTextEnabled as! Bool
        }
        if let instructionText = dict["instructionText"] {
            if (self._debugging) { NSLog("InstructionText") }
            self.mrz.instructionText = instructionText as! String
        }
        if let instructionTextColor = dict["instructionTextColor"] {
            if (self._debugging) { NSLog("InstructionTextColor") }
            self.mrz.instructionTextColor = instructionTextColor as! UIColor
        }
        if let instructionTextFont = dict["instructionTextFont"] {
            if (self._debugging) { NSLog("InstructionTextFont") }
            self.mrz.instructionTextFont = instructionTextFont as! UIFont
        }
        if let cameraNegativeSpaceBackgroundEnabled = dict["cameraNegativeSpaceBackgroundEnabled"] {
            if (self._debugging) { NSLog("cameraNegativeSpaceBackgroundEnabled") }
            self.mrz.cameraNegativeSpaceBackgroundEnabled = cameraNegativeSpaceBackgroundEnabled as! Bool
        }
        if let cameraNegativeSpaceBackgroundColor = dict["cameraNegativeSpaceBackgroundColor"] {
            if (self._debugging) { NSLog("cameraNegativeSpaceBackgroundColor") }
            self.mrz.cameraNegativeSpaceBackgroundColor = cameraNegativeSpaceBackgroundColor as! UIColor
        }
        
        if (self._debugging) { NSLog("!!!!! Start Scanning") }
        self.mrz.start(self, licenseKey: key)
    }
    
    @objc public func setDelegate(delegate: XavierWrapperDelegate)
    {
        self.delegate = delegate
    }
    
    public func handleResults(results: ParsedMRZ) {
        if (self._debugging) { NSLog("!!!!!!! handleResults") }
        var nsResults = [String: Any]()
        nsResults["compositeCheckDigit"] = results.compositeCheckDigit
        nsResults["countryCitizen"] = results.countryCitizen
        nsResults["countryIssue"] = results.countryIssue
        nsResults["dateBirth"] = results.dateBirth
        nsResults["dateBirthCheckDigit"] = results.dateBirthCheckDigit
        nsResults["dateExpiration"] = results.dateExpiration
        nsResults["dateExpirationCheckDigit"] = results.dateExpirationCheckDigit
        nsResults["documentImage"] = results.documentImage
        nsResults["documentNumber"] = results.documentNumber
        nsResults["documentNumberCheckDigit"] = results.documentNumberCheckDigit
        nsResults["documentType"] = results.documentType
        nsResults["givenName"] = results.givenName
        nsResults["optionalData"] = results.optionalData
        nsResults["optionalData2"] = results.optionalData2
        nsResults["optionalDataCheckDigit"] = results.optionalDataCheckDigit
        nsResults["rawMRZ"] = results.rawMRZ
        nsResults["sex"] = results.sex
        nsResults["stateIssue"] = results.stateIssue
        nsResults["surname"] = results.surname
        nsResults["totalScanTime"] = results.totalScanTime
        delegate?.didFinishTask(Status: true, Data: nsResults)
    }
    
    public func scanCancelled() {
        if (self._debugging) { NSLog("!!!!!!!!! Scan Cancelled") }
        delegate?.didFinishTask(Status: false, Data: nil)
    }
    
    
}
