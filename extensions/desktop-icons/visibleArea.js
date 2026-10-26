/* DING: Desktop Icons New Generation for GNOME Shell
 *
 * Copyright (C) 2021 Sergio Costas (rastersoft@gmail.com)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import GLib from 'gi://GLib';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export {VisibleArea};

const Signals = imports.signals;

var VisibleArea = class {
    constructor() {
        this._usableAreas = {};
        this._marginsList = {};
        this._refreshTimerId = null;

        this._extensionUUID = '130cbc66-235c-4bd6-8571-98d2d8bba5e2';
    }

    disable() {
        if (this._refreshTimerId !== null) {
            GLib.source_remove(this._refreshTimerId);
            this._refreshTimerId = null;
        }
    }

    setMarginsForExtension(extensionUUID, margins) {
        if (margins === null) {
            if (!(extensionUUID in this._marginsList))
                return;

            delete this._marginsList[extensionUUID];
        } else {
            this._marginsList[extensionUUID] = margins;
        }
        if (this._refreshTimerId)
            GLib.source_remove(this._refreshTimerId);

        this._refreshTimerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 250, () => {
            this._refreshMargins();
            this._refreshTimerId = null;
            return GLib.SOURCE_REMOVE;
        });
    }

    _refreshMargins() {
        this._usableAreas = {};
        for (let extensionUUID in this._marginsList) {
            let margins = this._marginsList[extensionUUID];
            for (let workspace in margins) {
                let index = workspace;
                if (workspace < 0)
                    index = Main.layoutManager.primaryIndex;

                if (!(index in this._usableAreas)) {
                    this._usableAreas[index] = {
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                    };
                }
                for (let index2 of ['top', 'bottom', 'left', 'right'])
                    this._usableAreas[index][index2] = Math.max(this._usableAreas[index][index2], margins[workspace][index2]);
            }
        }
        this.emit('updated-usable-area');
    }



























    getMonitorGeometry(ws, monitorIndex) {
        let geometry = ws.get_display().get_monitor_geometry(monitorIndex);
        let scale = ws.get_display().get_monitor_scale(monitorIndex);
        let area = ws.get_work_area_for_monitor(monitorIndex);


        let marginTop = area.y - geometry.y;
        let marginLeft = area.x - geometry.x;
        let marginRight = geometry.width - area.width - marginLeft;
        let marginBottom = geometry.height - area.height - marginTop;

        if (monitorIndex in this._usableAreas) {






            const hiddenMargin = 1000;

            if (this._usableAreas[monitorIndex]['top'] > marginTop)
                marginTop = this._usableAreas[monitorIndex]['top'] + hiddenMargin;


            if (this._usableAreas[monitorIndex]['bottom'] > marginBottom)
                marginBottom = this._usableAreas[monitorIndex]['bottom'] + hiddenMargin;


            if (this._usableAreas[monitorIndex]['left'] > marginLeft)
                marginLeft = this._usableAreas[monitorIndex]['left'] + hiddenMargin;


            if (this._usableAreas[monitorIndex]['right'] > marginRight)
                marginRight = this._usableAreas[monitorIndex]['right'] + hiddenMargin;
        }

        return {
            x: geometry.x,
            y: geometry.y,
            width: geometry.width,
            height: geometry.height,
            scale,
            marginTop,
            marginBottom,
            marginLeft,
            marginRight,
        };
    }

    get uuid() {
        return this._extensionUUID;
    }
};
Signals.addSignalMethods(VisibleArea.prototype);
