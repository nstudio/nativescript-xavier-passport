import { EventData } from "../demo/node_modules/tns-core-modules/data/observable";
import { Color } from "../demo/node_modules/tns-core-modules/color";
import { Font } from "../demo/node_modules/tns-core-modules/ui/styling/font";

export interface MRZData extends EventData {
    documentImage?: any;   // Native Image type on platform  (Bitmap or iOS Image)
    documentNumber: string;
    raw: string;
}

export interface MRZOptions {
    licenseKey: string;
    boundingBoxSearchingColor?: string|Color;
    boundingBoxFoundColor?: string|Color;
    closeButtonColor?: string|Color;
    flashOnButtonColor?: string|Color;
    flashOffButtonColor?: string|Color;
    flashButtonEnabled?: boolean;
    instructionTextEnabled?: boolean;
    instructionText?: string;
    instructionTextColor?: string|Color;
    instructionTextFont?: string|Font;
    cameraNegativeSpaceBackgroundEnabled?: boolean;
    cameraNegativeSpaceBackgroundColor?: string|Color;
}

export declare class Passport {
    constructor(options?: MRZOptions);

    /**
     * iOS Flag; needed to fix a bug in the iOS native part
     */
    enableCloseHack(): void;

    /**
     * Enables debug logging
     */
    enableDebug(): void;

    /**
     * Add an event listener
     * @param event
     * @param callback
     * @param thisArg
     */
    addEventListener(event: string, callback: Function, thisArg?: any): void;

    /**
     * Add an event listener
     * @param event
     * @param callback
     * @param thisArg
     */
    on(event: string, callback: Function, thisArg?: any): void;


    /**
     * Remove event listener(s)
     * @param event
     * @param callback - optional, null = all callbacks
     * @param thisArg - optional, null = no check for matching thisArg
     */
    removeEventListener(event: string, callback?: Function, thisArg?: any): void;

    /**
     * Remove event listener(s)
     * @param event
     * @param callback - optional, null = all callbacks
     * @param thisArg - optional, null = no check for matching thisArg
     */
    off(event: string, callback?: Function, thisArg?: any): void;


    /**
     * Start the scanning for MRZ data
     */
    start(): void;


}