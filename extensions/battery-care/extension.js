'use strict';
import UPower from 'gi://UPowerGlib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Driver from './lib/driver.js';
import * as PowerIcon from './lib/powerIcon.js';












let initializeDriver = null;

export default class BatteryHealthCharging extends Extension {
    enable() {
        this._upowerClient = UPower.Client.new_full(null);

        if (!this._upowerClient)
            return;

        const devices = this._upowerClient.get_devices();

        if (!devices)
            return;

        const hasBattery = devices.some(device =>
            device.kind === UPower.DeviceKind.BATTERY &&
            device.power_supply
        );

        if (!hasBattery)
            return;

        const linePowerDevices = devices.filter(device =>
            device.kind === UPower.DeviceKind.LINE_POWER
        );

        this._initialize(linePowerDevices);
    }

    _initialize(linePowerDevices) {
        this._settings = this.getSettings();


        this._powerIcon = new PowerIcon.BatteryStatusIndicator(this._settings, linePowerDevices);


        if (!Main.sessionMode.isLocked && initializeDriver === null)
            initializeDriver = new Driver.IntializeDriver(this._settings, this);


        this._sessionId = Main.sessionMode.connect('updated', session => {

            if (session.currentMode === 'user' || session.parentMode === 'user') {
                if (initializeDriver === null)
                    initializeDriver = new Driver.IntializeDriver(this._settings, this);


            } else if (session.currentMode === 'unlock-dialog') {
                initializeDriver?.destroy();
                initializeDriver = null;
            }
        });
    }

    disable() {

        if (this._sessionId) {
            Main.sessionMode.disconnect(this._sessionId);
            this._sessionId = null;
        }
        if (initializeDriver) {
            initializeDriver?.destroy();
            initializeDriver = null;
        }
        this._powerIcon?.destroy();
        this._powerIcon = null;
        this._settings = null;
        this._upowerClient = null;
    }
}
