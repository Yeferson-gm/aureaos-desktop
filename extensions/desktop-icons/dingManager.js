/* eslint-disable no-undef */
/* DING: Desktop Icons New Generation for GNOME Shell
 *
 * Copyright(C) 2023, 2025 Sundeep Mediratta (smedius@gmail.com)
 * Copyright (C) 2019 Sergio Costas (rastersoft@gmail.com)
 * Based on code original (C) Carlos Soriano
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
/* exported init, enable, disable */
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import Meta from 'gi://Meta';
import Mtk from 'gi://Mtk';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Config from 'resource:///org/gnome/shell/misc/config.js';
import * as BoxPointer from 'resource:///org/gnome/shell/ui/boxpointer.js';

import * as WindowTypeManager from './windowTypeManager.js';
import * as GnomeShellOverride from './gnomeShellOverride.js';
import * as VisibleArea from './visibleArea.js';
import * as FileUtils from './utils/fileUtils.js';
import {GlobalShortcuts} from './dependencies/localFiles.js';

const GnomeShellVersion = parseInt(Config.PACKAGE_VERSION.split('.')[0]);

Gio._promisify(
    Gio.DataInputStream.prototype, 'read_line_async', 'read_line_finish_utf8'
);
Gio._promisify(Gio.Subprocess.prototype, 'wait_async');

const fileProto = imports.system.version >= 17200
    ? Gio.File.prototype : Gio._LocalFilePrototype;

Gio._promisify(fileProto, 'enumerate_children_async');
Gio._promisify(Gio.FileEnumerator.prototype, 'close_async');
Gio._promisify(Gio.FileEnumerator.prototype, 'next_files_async');
Gio._promisify(fileProto, 'load_bytes_async');

const appID = 'com.desktop.ding';
const appPath = GLib.build_filenamev(['/', ...appID.split('.')]);

const ifaceXml = `
<node>
  <interface name="${appID}extension">
    <method name="updateDesktopGeometry"/>
    <method name="getDropTargetAppInfoDesktopFile">
      <arg type="ad" direction="in" name="Global Drop Coordinates"/>
      <arg type="s" direction="out" name=".desktop App File Path or 'null'"/>
    </method>
    <method name="getShellGlobalCoordinates">
        <arg type="ai" direction="out" name="Global pointer Coordinates"/>
    </method>
    <method name="setDragCursor">
    <arg type="s" direction="in" name="Set Shell Cursor"/>
    </method>
    <method name="showShellBackgroundMenu"/>
    <method name="setWidgetLayerRaised">
      <arg type="b" direction="in" name="Raised"/>
    </method>
  </interface>
</node>`;

export {DingManager};

const DingManager = class {
    constructor(extensionObject) {
        this._getSettings = extensionObject.getSettings.bind(extensionObject);
        this.path = extensionObject.path;
        this.metadata = extensionObject.metadata;
        this.version = this.metadata['version-name'];
        this.uuid = this.metadata.uuid;
        this._init();
    }




    _init() {
        this.launchDesktop = 0;
        this.waylandClient = null;
        this.DesktopIconsUsableArea = null;
        this.scaleFactorId = 0;
        this.dingExtensionServiceImplementation = null;
        this.dingExtensionServiceInterface = null;

        this.GnomeShellOverride = null;
        this.GnomeShellVersion = GnomeShellVersion;
        this.ShortcutManager = null;







        this.windowTypeManager = null;
        this.visibleArea = null;






        this.killingProcess = false;
    }





    enable() {
        if (typeof Meta.is_wayland_compositor === 'function' &&
            !Meta.is_wayland_compositor()
        ) {
            console.error('Gtk4 DING extension requires a Wayland session');
            return;
        }

        if (!this.settings)
            this.settings = this._getSettings();

        if (!this.killingProcess) {
            this.killingProcess = true;
            this._doKillAllOldDesktopProcesses()
            .catch(e => console.error(e))
            .finally(() => (this.killingProcess = false));
        }

        if (!this.GnomeShellOverride) {
            this.GnomeShellOverride =
                new GnomeShellOverride.GnomeShellOverride();
        }

        this.GnomeShellOverride.enable();

        if (!this.windowTypeManager)
            this.windowTypeManager = new WindowTypeManager.WindowTypeManager();

        if (!this.DesktopIconsUsableArea) {
            this.DesktopIconsUsableArea = new VisibleArea.VisibleArea();
            this.visibleArea = this.DesktopIconsUsableArea;
        }


        if (Main.layoutManager._startingUp) {
            this.startupPreparedId =
                Main.layoutManager.connect(
                    'startup-complete',
                    this._activateDelayedLaunch.bind(this)
                );
        } else {
            this.startupPreparedId = null;
            this._activateDelayedLaunch();
        }
    }




    _activateDelayedLaunch() {
        if (this.killingProcess) {
            this.startupProcessKillWaitId =
                GLib.idle_add(
                    GLib.PRIORITY_DEFAULT,
                    () => {
                        if (this.killingProcess)
                            return GLib.SOURCE_CONTINUE;

                        this.startupProcessKillWaitId = 0;
                        this._activateDelayedLaunch();
                        return GLib.SOURCE_REMOVE;
                    }
                );

            return;
        }

        if (this.startupPreparedId) {
            Main.layoutManager.disconnect(this.startupPreparedId);
            this.startupPreparedId = null;
        }

        this.windowTypeManager.enable();





        this.monitorsChangedId =
            Main.layoutManager.connect(
                'monitors-changed',
                this._updateDesktopGeometry.bind(this)
            );





        this.workareasChangedId =
            global.display.connect(
                'workareas-changed',
                this._updateDesktopGeometry.bind(this)
            );





        this.visibleAreaId =
            this.visibleArea.connect(
                'updated-usable-area',
                this._updateDesktopGeometry.bind(this)
            );





        this.scaleFactorId =
            St.ThemeContext.get_for_stage(global.stage).connect(
                'notify::scale-factor',
                () => this._updateDesktopGeometry()
            );

        this.dbusConnectionId = this._acquireDBusName();

        this.lockSignalhandlerId =
            Gio.DBus.session.signal_subscribe(
                'org.gnome.ScreenSaver',
                'org.gnome.ScreenSaver',
                'ActiveChanged',
                '/org/gnome/ScreenSaver',
                null,
                Gio.DBusSignalFlags.NONE,
                this._onActiveChanged.bind(this)
            );


        if (this.launchDesktop)
            GLib.source_remove(this.launchDesktop);

        this._launchDesktop().catch(e => console.error(e));

        this.remoteDingActions = Gio.DBusActionGroup.get(
            Gio.DBus.session,
            appID,
            appPath
        );
        this.windowTypeManager.setRemoteActionGroup(this.remoteDingActions);

        this.remoteGeometryUpdateRequestedId =
            Gio.DBus.session.signal_subscribe(
                appID,
                appID,
                'updategeometry',
                appPath,
                null,
                Gio.DBusSignalFlags.NONE,
                this._updateDesktopGeometry.bind(this)
            );

        if (!this.ShortcutManager)
            this.ShortcutManager = new ShortcutManager(this);

        console.log('Adw-DING enabled.');
    }















    disable() {
        this.DesktopIconsUsableArea = null;
        if (this.startupProcessKillWaitId) {
            GLib.source_remove(this.startupProcessKillWaitId);
            this.startupProcessKillWaitId = 0;
        }
        if (this.startupPreparedId) {
            Main.layoutManager.disconnect(this.startupPreparedId);
            this.startupPreparedId = 0;
        }
        this._killCurrentProcess();
        if (this.monitorsChangedId) {
            Main.layoutManager.disconnect(this.monitorsChangedId);
            this.monitorsChangedId = 0;
        }
        if (this.workareasChangedId) {
            global.display.disconnect(this.workareasChangedId);
            this.workareasChangedId = 0;
        }
        if (this.visibleAreaId) {
            this.visibleArea?.disconnect(this.visibleAreaId);
            this.visibleAreaId = 0;
        }
        if (this.scaleFactorId) {
            St.ThemeContext.get_for_stage(global.stage)
            .disconnect(this.scaleFactorId);
            this.scaleFactorId = 0;
        }
        if (this.dbusConnectionId)
            this._stopDbusService();

        if (this.lockSignalhandlerId) {
            Gio.DBus.session.signal_unsubscribe(this.lockSignalhandlerId);
            this.lockSignalhandlerId = 0;
        }
        if (this.remoteGeometryUpdateRequestedId) {
            Gio.DBus.session
            .signal_unsubscribe(this.remoteGeometryUpdateRequestedId);

            this.remoteGeometryUpdateRequestedId = 0;
        }

        this.ShortcutManager?.disable();
        this.ShortcutManager = null;
        this.visibleArea?.disable();
        this.visibleArea = null;
        this.windowTypeManager?.disable();
        this.windowTypeManager = null;
        this.GnomeShellOverride?.disable();
        this.GnomeShellOverride = null;
        this.remoteDingActions = null;
        this.settings = null;

        console.log('Adw-DING disabled.');
    }





    _acquireDBusName() {
        const ID = Gio.bus_own_name(
            Gio.BusType.SESSION,
            `${appID}extension`,
            Gio.BusNameOwnerFlags.NONE,
            this._onBusAcquired.bind(this),
            (connection, name) => {
                console.log(`${name} DBus Name Acquired`);
                this.dbusConnectionName = name;
            },
            (connection, name) => {
                console.log(`${name} DBus and Name Lost`);
                this.dbusConnectionName = null;
            }
        );

        return ID;
    }






    _onBusAcquired(connection) {
        this.dingExtensionServiceImplementation =
            new DingExtensionService(
                this._updateDesktopGeometry.bind(this),
                this._setWidgetLayerRaised.bind(this)
            );

        this.dingExtensionServiceInterface =
            Gio.DBusExportedObject.wrapJSObject(
                ifaceXml,
                this.dingExtensionServiceImplementation
            );

        this.dingExtensionServiceImplementation._impl =
            this.dingExtensionServiceInterface;

        this.dingExtensionServiceInterface.export(
            connection,
            `${appPath}extension`
        );
    }

    _stopDbusService() {
        if (this.dingExtensionServiceInterface)
            this.dingExtensionServiceInterface.unexport();

        this.dingExtensionServiceInterface = null;

        if (this.dingExtensionServiceImplementation)
            this.dingExtensionServiceImplementation.disable();

        this.dingExtensionServiceImplementation = null;

        Gio.bus_unown_name(this.dbusConnectionId);
        this.dbusConnectionId = 0;

        if (this.dbusConnectionName)
            console.log(`${this.dbusConnectionName} DBus Name Relinquished`);

        this.dbusConnectionName = null;
    }












    _onActiveChanged(connection, sender, path, iface, signal, params) {
        const value = params.get_child_value(0);
        const locked = value.get_boolean();

        if (!locked)
            this.windowTypeManager.refreshWindows();
    }

    _setWidgetLayerRaised(raised) {
        this.windowTypeManager?.setWindowsRaisedAsDock(raised);
    }




    _updateDesktopGeometry() {
        if (this.remoteDingActions &&
            (Main.layoutManager.monitors.length !== 0)
        ) {
            this.remoteDingActions.activate_action(
                'updateGridWindows',
                this._getDesktopGeometry()
            );
        }
    }




    _getDesktopGeometry() {
        let desktopList = [];
        let ws = global.workspace_manager.get_workspace_by_index(0);
        const {scaleFactor} = St.ThemeContext.get_for_stage(global.stage);

        for (let monitorIndex = 0;
            monitorIndex < Main.layoutManager.monitors.length;
            monitorIndex++
        ) {
            let area = this.visibleArea.getMonitorGeometry(ws, monitorIndex);
            let desktopListElement = new GLib.Variant('a{sd}', {
                'x': area.x,
                'y': area.y,
                'width': area.width,
                'height': area.height,
                'zoom': area.scale,
                scaleFactor,
                'marginTop': area.marginTop,
                'marginBottom': area.marginBottom,
                'marginLeft': area.marginLeft,
                'marginRight': area.marginRight,
                monitorIndex,
                'primaryMonitor': Main.layoutManager.primaryIndex,
            });

            desktopList.push(desktopListElement);
        }

        return new GLib.Variant('av', desktopList);
    }




    _killCurrentProcess() {
        if (this.launchDesktop) {
            GLib.source_remove(this.launchDesktop);
            this.launchDesktop = 0;
        }


        if (this.waylandClient && this.waylandClient.subprocess) {
            this.waylandClient.cancellable.cancel();
            this.waylandClient.subprocess.send_signal(15);
        }

        this.waylandClient = null;
        this.windowTypeManager?.set_wayland_client(null);
    }








    async _doKillAllOldDesktopProcesses() {
        const procFolder = Gio.File.new_for_path('/proc');
        const processes = await FileUtils.enumerateDirOrEmpty(procFolder);
        const thisPath = `gjs ${GLib.build_filenamev([
            this.path,
            'app',
            'adw-ding.js',
        ])}`;

        const killPromises = processes.map(async info => {
            const filename = info.get_name();

            const processPath =
                GLib.build_filenamev(['/proc', filename, 'cmdline']);

            const processUser = Gio.File.new_for_path(processPath);

            try {
                const [binaryData] = await processUser.load_bytes_async(null);
                const readData = binaryData.get_data();
                let contents = '';

                for (let i = 0; i < readData.length; i++) {
                    if (readData[i] < 32)
                        contents += ' ';
                    else
                        contents += String.fromCharCode(readData[i]);
                }

                if (contents.startsWith(thisPath)) {
                    let proc =
                        new Gio.Subprocess({argv: ['/bin/kill', filename]});

                    proc.init(null);
                    console.log(`Killing old DING process ${filename}`);
                    await proc.wait_async(null);
                }
            } catch (e) {
            }
        });

        await Promise.all(killPromises);
    }






    _doRelaunch(reloadTime, client) {
        if (!client || this.waylandClient !== client)
            return;

        this.waylandClient = null;
        this.windowTypeManager.set_wayland_client(null);
        if (this.launchDesktop)
            GLib.source_remove(this.launchDesktop);

        this.launchDesktop =
            GLib.timeout_add(
                GLib.PRIORITY_DEFAULT,
                reloadTime,
                () => {
                    this.launchDesktop = 0;
                    this._launchDesktop().catch(e => console.error(e));
                    return false;
                }
            );
    }







    async _launchDesktop() {
        console.log('Launching Adw-DING process');
        let argv = [];
        argv.push(GLib.build_filenamev([this.path, 'app', 'adw-ding.js']));

        argv.push('-E');


        argv.push('-V');
        argv.push(`${this.GnomeShellVersion}`);

        argv.push('-v');
        argv.push(`${this.version}`);

        argv.push('-U');
        argv.push(`${this.uuid}`);

        const client = new LaunchSubprocess(0, 'Adw-DING');
        this.waylandClient = client;
        client.set_cwd(GLib.get_home_dir());
        this.windowTypeManager.set_wayland_client(client);

        const launchTime = GLib.get_monotonic_time();

        let subprocess;

        try {
            subprocess = await client.spawnv(argv);
        } catch (e) {
            if (this.waylandClient !== client)
                return;

            if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED)) {
                console.error(
                    e, `Error while trying to launch DING process: ${e.message}`
                );
                this._doRelaunch(1000, client);
            }

            return;
        }








        const delta = GLib.get_monotonic_time() - launchTime;
        let reloadTime;

        if (delta < 1000000) {


            reloadTime = 1000;
        } else {


            reloadTime = 1;
        }

        if (this.waylandClient !== client ||
            subprocess !== client.subprocess
        )
            return;


        if (subprocess.get_if_exited())
            subprocess.get_exit_status();

        this._doRelaunch(reloadTime, client);
    }
};











var LaunchSubprocess = class {
    constructor(flags, processId) {
        this._processID = processId;

        this._launcher =
            new Gio.SubprocessLauncher({
                flags:
                    flags |
                    Gio.SubprocessFlags.STDOUT_PIPE |
                    Gio.SubprocessFlags.STDERR_MERGE,
            });

        this.subprocess = null;
        this.process_running = false;

        this.isWayland = typeof Meta.is_wayland_compositor === 'function'
            ? Meta.is_wayland_compositor()
            : true;
    }

    makeWaylandClientSubprocess(argv) {
        if (!this.isWayland)
            throw new Error('Unsupported compositor: Wayland is required');

        let subprocess;



        if (typeof Meta.WaylandClient.new_subprocess === 'function') {
            this._waylandClient =
                Meta.WaylandClient.new_subprocess(
                    global.context, this._launcher, argv
                );
            subprocess = this._waylandClient.get_subprocess();
        } else {

            try {

                this._waylandClient =
                    Meta.WaylandClient.new(global.context, this._launcher);
            } catch (e) {

                this._waylandClient = Meta.WaylandClient.new(this._launcher);
            }

            if (Config.PACKAGE_VERSION === '3.38.0') {

                this._launcher.ref();
            }

            subprocess = this._waylandClient.spawnv(global.display, argv);
        }

        return subprocess;
    }

    async spawnv(argv) {
        try {
            this.subprocess = this.makeWaylandClientSubprocess(argv);
            try {
                const pid = Number(this.subprocess?.get_identifier());

                if (pid)
                    this._movePidToDingScope(pid);
            } catch (e) {
                console.warn(`Failed to move ${this._processID} to systemd scope:`, e);
            }
        } catch (e) {
            this.subprocess = null;
            throw e;
        }

        if (this.cancellable)
            this.cancellable.cancel();

        const cancellable = new Gio.Cancellable();
        this.cancellable = cancellable;


        if (this._launcher.close)
            this._launcher.close();

        this._launcher = null;







        const dataInputStream =
            Gio.DataInputStream.new(this.subprocess.get_stdout_pipe());

        this.readOutput(dataInputStream, cancellable)
        .catch(e => console.error(e));

        try {
            this.process_running = true;
            await this.subprocess.wait_async(cancellable);
        } finally {
            cancellable.cancel();
            this.process_running = false;

            if (this.cancellable === cancellable)
                this.cancellable = null;
        }
        return this.subprocess;
    }

    set_cwd(cwd) {
        this._launcher.set_cwd(cwd);
    }

    async readOutput(dataInputStream, cancellable) {
        let textDecoder = new TextDecoder();
        try {
            const [output, length] =
                await dataInputStream.read_line_async(
                    GLib.PRIORITY_DEFAULT,
                    cancellable
                );

            if (length) {
                console.log(
                    `${this._processID}: ${textDecoder.decode(output)}`
                );
            }
        } catch (e) {
            if (e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
                return;

            console.error(e, `${this._processID}_Error`);
        }

        await this.readOutput(dataInputStream, cancellable);
    }

    _movePidToDingScope(pid) {
        const bus = Gio.bus_get_sync(Gio.BusType.SESSION, null);

        const properties = [
            ['Description',
                new GLib.Variant('s', `${appID} All process`)],

            ['Slice',
                new GLib.Variant('s', `app-${appID}.slice`)],

            ['PIDs',
                new GLib.Variant('au', [pid])],

            ['CollectMode',
                new GLib.Variant('s', 'inactive-or-failed')],

            ['CPUAccounting',
                new GLib.Variant('b', true)],

            ['MemoryAccounting',
                new GLib.Variant('b', true)],

            ['TasksAccounting',
                new GLib.Variant('b', true)],
        ];

        const params = new GLib.Variant('(ssa(sv)a(sa(sv)))', [
            `app-${appID}-main-${pid}.scope`,
            'replace',
            properties,
            [],
        ]);

        try {
            bus.call_sync(
                'org.freedesktop.systemd1',
                '/org/freedesktop/systemd1',
                'org.freedesktop.systemd1.Manager',
                'StartTransientUnit',
                params,
                null,
                Gio.DBusCallFlags.NONE,
                -1,
                null
            );
        } catch (e) {
            console.error(`Failed to move ${appID} to its own slice & scope:`, e);
        }
    }






    query_window_belongs_to(window) {
        if (!this.isWayland)
            return false;

        if (!this.process_running)
            return false;

        try {
            return this._waylandClient.owns_window(window);
        } catch (e) {
            return false;
        }
    }

    query_pid_of_program() {
        if (!this.process_running)
            return false;

        return this.subprocess.get_identifier();
    }

    show_in_window_list(window) {
        if (!this.isWayland || !this.process_running)
            return;

        if (typeof window.show_in_window_list === 'function')

            window.show_in_window_list();
        else
            this._waylandClient?.show_in_window_list(window);
    }

    hide_from_window_list(window) {
        if (!this.isWayland || !this.process_running)
            return;

        if (typeof window.hide_from_window_list === 'function')

            window.hide_from_window_list();
        else
            this._waylandClient?.hide_from_window_list(window);
    }
};




var DingExtensionService = class {
    constructor(updateDesktopGeometryCB, setWidgetLayerRaisedCB) {
        this.geometryUpdate = updateDesktopGeometryCB;
        this.setWidgetLayerRaisedCB = setWidgetLayerRaisedCB;
        this.synthesizeHover = new SynthesizeHover();
        this._shellDragCursorActorRef = null;
    }

    disable() {
        this.setDragCursor('default');
        this.synthesizeHover.disable();
    }

    updateDesktopGeometry() {
        this.geometryUpdate();
    }

    showShellBackgroundMenu() {
        const [X, Y] = global.get_pointer().slice(0, 2);
        const rect = new Mtk.Rectangle({x: X, y: Y, width: 1, height: 1});
        const monitorIndex = global.display.get_monitor_index_for_rect(rect);
        const backgroundManager = Main.layoutManager._bgManagers[monitorIndex];

        const backgroundMenu =
            backgroundManager?.backgroundActor?._backgroundMenu;

        if (!backgroundMenu)
            return;

        Main.layoutManager.setDummyCursorGeometry(X, Y, 0, 0);
        backgroundMenu.open(BoxPointer.PopupAnimation.FULL);
    }

    setWidgetLayerRaised(raised) {
        this.setWidgetLayerRaisedCB?.(raised);
    }

    getDropTargetAppInfoDesktopFile([dropX, dropY]) {
        let droptarget = null;
        let actor = null;

        if (!dropX || !dropY)
            [dropX, dropY] = global.get_pointer().slice(0, 2);

        actor =
            global
            .get_stage()
            .get_actor_at_pos(Clutter.PickMode.REACTIVE, dropX, dropY);

        let i = 0;
        let checkactor;

        while (actor && (i < 10)) {
            if (actor._delegate)
                checkactor = actor._delegate;
            else
                checkactor = actor;

            if (checkactor?.app?.appInfo?.get_filename()) {
                droptarget = checkactor.app.appInfo.get_filename();
                break;
            }

            if (checkactor?.location?.get_uri()) {
                droptarget = checkactor.location.get_uri();
                break;
            }

            i += 1;
            actor = actor.get_parent();
        }

        if (droptarget) {
            this.synthesizeHover.hoverOver(checkactor);
            return droptarget;
        } else {
            return 'null';
        }
    }

    setDragCursor(cursor) {
        const currentGrabActor = global.get_stage().get_grab_actor();
        const CursorType = Clutter.CursorType;
        let cursorType;

        switch (cursor) {
        case 'dndMoveCursor':
            cursorType = CursorType.MOVE;
            break;
        case 'dndCopyCursor':
            cursorType = CursorType.COPY;
            break;
        case 'dndNoDropCursor':
            cursorType = CursorType.NO_DROP;
            break;
        default:
            cursorType = CursorType.DEFAULT;
        }

        if (cursorType === CursorType.DEFAULT) {
            const ownedActor = this._shellDragCursorActorRef?.deref();
            this._shellDragCursorActorRef = null;




            if (currentGrabActor && currentGrabActor === ownedActor)
                currentGrabActor.set_cursor_type(cursorType);
            return;
        }




        if (!currentGrabActor || currentGrabActor === global.stage ||
            Main.modalCount > 0)
            return;

        this._shellDragCursorActorRef = new WeakRef(currentGrabActor);
        currentGrabActor.set_cursor_type(cursorType);
    }

    getShellGlobalCoordinates() {
        const x = global.get_pointer();

        return x;
    }
};




var SynthesizeHover = class {
    constructor() {
        this._hoveredActor = null;
        this._hoverTimeoutID = 0;
    }

    disable() {
        this._cancelCurrentTimer();

        if (this._hoveredActor)
            this._hoveredActor.set_hover(false);

        this._hoveredActor = null;
    }

    hoverOver(newactor) {
        // eslint-disable-next-line eqeqeq
        if (newactor == this._hoveredActor) {
            this._resetHoverTimer();

            return;
        }

        if (this._hoveredActor)
            this._hoveredActor.set_hover(false);

        this._cancelCurrentTimer();
        this._hoveredActor = newactor;
        this._hoveredActor.sync_hover();
        this._setNewHoverTimer();
    }

    _resetHoverTimer() {
        this._cancelCurrentTimer();
        this._setNewHoverTimer();
    }

    _cancelCurrentTimer() {
        if (this._hoverTimeoutID)
            GLib.source_remove(this._hoverTimeoutID);

        this._hoverTimeoutID = 0;
    }

    _setNewHoverTimer() {
        this._hoverTimeoutID =
            GLib.timeout_add(
                GLib.PRIORITY_DEFAULT,
                500,
                () => {
                    if (this._hoveredActor)
                        this._hoveredActor.set_hover(false);

                    this._hoveredActor = null;
                    this._hoverTimeoutID = 0;

                    return false;
                }
            );
    }
};



var ShortcutManager = class {
    constructor(dingManager) {

        this.keyBindings = GlobalShortcuts;
        this._settings = dingManager.settings;
        this._remoteAction = dingManager.remoteDingActions;
        this._windowManager = Main.wm;
        this._enableShortcuts();
        this._monitorShortcuts();
    }

    disable() {
        this._settings.disconnect(this._monitorID);
        this._monitorID = 0;
        this._disableShortcuts();
    }

    _enableShortcuts() {
        for (let name in this.keyBindings)
            this._addKeyBinding(name);
    }

    _disableShortcuts() {
        for (let name in this.keyBindings)
            this._windowManager.removeKeybinding(name.toLowerCase());
    }

    _addKeyBinding(name) {
        try {
            Main.wm.addKeybinding(
                name.toLowerCase(),
                this._settings,
                Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
                Shell.ActionMode.NORMAL,
                () => {
                    this._activateRemoteAction(name);
                }
            );
        } catch (e) {
            log(`Error adding keybinding for ${name}: ${e}`);
        }
    }

    _activateRemoteAction(action) {
        if (this._remoteAction &&
            (Main.layoutManager.monitors.length !== 0)
        ) {
            this._remoteAction.activate_action(
                action,
                null
            );
        }
    }

    _monitorShortcuts() {
        this._monitorID = this._settings.connect(
            'changed',
            (obj, key) => {
                for (const actionName in this.keyBindings) {
                    if (actionName.toLowerCase() === key) {
                        this._updatebinding(actionName);
                        break;
                    }
                }
            }
        );
    }

    _updatebinding(key) {
        this._windowManager.removeKeybinding(key.toLowerCase());
        this._addKeyBinding(key);
    }
};
