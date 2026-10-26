import Cairo from "cairo";
import Clutter from "gi://Clutter";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import GObject from "gi://GObject";
import Meta from "gi://Meta";
import St from "gi://St";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import { StaticWallpaper } from "./staticWallpaper.js";
import { getBackgroundsDir } from "./utils.js";

const RENDERER_WINDOW_PREFIX = "gwe-wallpaper-";




const NoCullEffect = GObject.registerClass(
    class NoCullEffect extends Clutter.Effect {}
);

function getMonitorBounds(monitors) {
    if (!monitors.length) return null;

    const x = Math.min(...monitors.map(({ x }) => x));
    const y = Math.min(...monitors.map(({ y }) => y));
    const right = Math.max(...monitors.map(({ x, width }) => x + width));
    const bottom = Math.max(...monitors.map(({ y, height }) => y + height));
    return { x, y, width: right - x, height: bottom - y };
}

function getRelativeMonitorBounds(bounds, monitor) {
    return {
        x: monitor.x - bounds.x,
        y: monitor.y - bounds.y,
        width: monitor.width,
        height: monitor.height,
    };
}

export class Wallpaper {
    constructor(ext, windowFilter) {
        this._ext = ext;
        this._windowFilter = windowFilter;
        this._staticWallpaper = new StaticWallpaper();
        this._process = null;
        this._sessionId = null;
        this._sourceActor = null;
        this._clones = [];
        this._overviewLayer = null;
        this._mapTimeoutId = null;

        this._windowMapId = global.window_manager.connect_after(
            "map",
            (_windowManager, windowActor) => this._onWindowMapped(windowActor)
        );
        this._monitorsChangedId = Main.layoutManager.connect(
            "monitors-changed",
            () => {
                if (this._sessionId) this.start();
            }
        );
    }

    _placeInBackgroundLayer(actor) {
        const backgroundGroup = Main.layoutManager._backgroundGroup;
        backgroundGroup.add_child(actor);





        const tahoeCanvas = backgroundGroup.get_children()
            .find(child => child.get_name?.() === "tahoe-canvas");
        if (tahoeCanvas && tahoeCanvas !== actor)
            backgroundGroup.set_child_below_sibling(actor, tahoeCanvas);
    }

    start() {
        this.stop();

        const filename = this._ext._settings.get_string("current-wallpaper");
        if (!filename) return;

        const bgDir = getBackgroundsDir();
        const baseName = filename.substring(0, filename.lastIndexOf("."));
        const thumbPath = GLib.build_filenamev([bgDir, `${baseName}-thumb.jpg`]);
        this._staticWallpaper.set(thumbPath);

        const videoPath = GLib.build_filenamev([bgDir, filename]);

        if (!GLib.getenv("WAYLAND_DISPLAY") || !Meta.WaylandClient?.new_subprocess) {
            Main.notify("Gnome Live Wallpaper", "GNOME Shell 50 on Wayland is required.");
            return;
        }

        const mpvPath = GLib.find_program_in_path("mpv");
        if (!mpvPath) {
            Main.notify("Gnome Live Wallpaper", "mpv was not found.");
            return;
        }

        const monitors = [...Main.layoutManager.monitors].sort(
            (a, b) => a.x - b.x || a.y - b.y
        );
        const bounds = getMonitorBounds(monitors);
        if (!bounds) return;
        const sourceMonitor = monitors[0];

        const sessionId = GLib.uuid_string_random();
        this._sessionId = sessionId;
        const windowTitle = `${RENDERER_WINDOW_PREFIX}${sessionId}`;
        const argv = [
            mpvPath,
            "--vo=gpu",
            "--gpu-context=wayland",
            "--hwdec=auto",
            "--no-border",
            "--loop-file=inf",
            "--no-audio",
            "--force-window=immediate",
            `--title=${windowTitle}`,
            `--geometry=${sourceMonitor.width}x${sourceMonitor.height}+0+0`,
            "--keepaspect=yes",
            "--keepaspect-window=no",
            "--no-auto-window-resize",
            "--panscan=1.0",
            "--video-unscaled=no",
            "--osc=no",
            "--osd-bar=no",
            "--input-default-bindings=no",
            "--input-vo-keyboard=no",
            "--cursor-autohide=no",
            "--no-terminal",
            videoPath,
        ];

        try {
            const launcher = new Gio.SubprocessLauncher({
                flags: Gio.SubprocessFlags.NONE,
            });
            try {
                const waylandClient = Meta.WaylandClient.new_subprocess(
                    global.context,
                    launcher,
                    argv
                );
                this._process = waylandClient.get_subprocess();
            } finally {
                if (launcher.close) launcher.close();
            }

            if (!this._process) throw new Error("Could not start the mpv Wayland client");

            const process = this._process;
            process.wait_async(null, (subprocess, result) => {
                try {
                    subprocess.wait_finish(result);
                } catch (error) {
                    logError(error);
                }

                if (this._process !== process) return;

                this._process = null;
                this._sessionId = null;
                this._sourceActor = null;
                this._destroyClones();
                if (this._mapTimeoutId) {
                    GLib.source_remove(this._mapTimeoutId);
                    this._mapTimeoutId = null;
                }
                if (!process.get_successful()) {
                    Main.notify("Gnome Live Wallpaper", "mpv stopped unexpectedly.");
                }
            });

            this._mapTimeoutId = GLib.timeout_add(
                GLib.PRIORITY_DEFAULT,
                5000,
                () => {
                    this._mapTimeoutId = null;
                    if (this._sessionId === sessionId && !this._sourceActor) {
                        Main.notify("Gnome Live Wallpaper", "The mpv window could not be attached.");
                        this.stop();
                    }
                    return GLib.SOURCE_REMOVE;
                }
            );
        } catch (error) {
            console.error("[Wallpaper] Error starting renderer:", error);
            Main.notify("Gnome Live Wallpaper", error.message);
            this.stop();
        }
    }

    _onWindowMapped(windowActor) {
        if (!this._sessionId || this._sourceActor) return;

        const metaWindow = windowActor.get_meta_window();
        const title = metaWindow?.get_title();
        if (!title?.startsWith(RENDERER_WINDOW_PREFIX)) return;
        if (title !== `${RENDERER_WINDOW_PREFIX}${this._sessionId}`) return;

        const monitors = [...Main.layoutManager.monitors].sort(
            (a, b) => a.x - b.x || a.y - b.y
        );
        const bounds = getMonitorBounds(monitors);
        const sourceMonitor = monitors[0];
        const backgroundGroup = Main.layoutManager._backgroundGroup;

        if (!bounds || !sourceMonitor || !backgroundGroup) {
            Main.notify("Gnome Live Wallpaper", "GNOME's wallpaper layer is unavailable.");
            this.stop();
            return;
        }

        try {
            const sourceBounds = getRelativeMonitorBounds(bounds, sourceMonitor);
            const localMonitorBounds = monitors.map((monitor) =>
                getRelativeMonitorBounds(bounds, monitor)
            );

            metaWindow.set_type(Meta.WindowType.DESKTOP);
            metaWindow.stick();
            metaWindow.focus_on_click = false;
            if (typeof metaWindow.set_accept_focus === "function") {
                metaWindow.set_accept_focus(false);
            }
            try {
                metaWindow.set_input_region(new Cairo.Region());
            } catch (_) {

            }
            metaWindow.move_resize_frame(
                true,
                sourceMonitor.x,
                sourceMonitor.y,
                sourceMonitor.width,
                sourceMonitor.height
            );
            windowActor.set_position(sourceBounds.x, sourceBounds.y);
            windowActor.set_size(sourceBounds.width, sourceBounds.height);
            this._sourceActor = windowActor;
            const parent = windowActor.get_parent();
            if (parent) parent.remove_child(windowActor);
            this._placeInBackgroundLayer(windowActor);
            windowActor.set_opacity(255);
            windowActor.set_reactive(false);
            windowActor.add_effect_with_name("gwe-no-cull", new NoCullEffect());

            this._clones = localMonitorBounds.map((localBounds) => {
                const clone = new Clutter.Clone({ source: windowActor });

                clone.set_position(localBounds.x, localBounds.y);
                clone.set_size(localBounds.width, localBounds.height);
                clone.set_clip_to_allocation(true);
                clone.set_reactive(false);
                this._placeInBackgroundLayer(clone);
                return clone;
            });

            this._createOverviewLayer(windowActor, monitors);

            const sourceX = bounds.x - sourceMonitor.width - 1;
            const hiddenSourceBounds = {
                x: -sourceMonitor.width - 1,
                y: sourceMonitor.y - bounds.y,
            };
            metaWindow.move_resize_frame(
                true,
                sourceX,
                sourceMonitor.y,
                sourceMonitor.width,
                sourceMonitor.height
            );
            windowActor.set_position(hiddenSourceBounds.x, hiddenSourceBounds.y);
            metaWindow.lower();
            this._windowFilter?.addWindow(metaWindow);

            if (this._mapTimeoutId) {
                GLib.source_remove(this._mapTimeoutId);
                this._mapTimeoutId = null;
            }

            windowActor.connect("destroy", () => {
                this._windowFilter?.removeWindow(metaWindow);


                if (this._sourceActor !== windowActor) return;
                this._destroyClones();
                this._sourceActor = null;
            });
        } catch (error) {
            console.error("[Wallpaper] Error attaching renderer:", error);
            Main.notify("Gnome Live Wallpaper", error.message);
            this.stop();
        }
    }

    _createOverviewLayer(source, monitors) {


        const group = Main.layoutManager.overviewGroup;
        this._overviewLayer = new St.Widget({
            name: "gwe-overview-video",
            reactive: false,
            clip_to_allocation: true,
            constraints: new Clutter.BindConstraint({
                source: group,
                coordinate: Clutter.BindCoordinate.ALL,
            }),
        });
        group.insert_child_at_index(this._overviewLayer, 0);
        for (const monitor of monitors) {
            this._overviewLayer.add_child(new Clutter.Clone({
                source,
                x: monitor.x, y: monitor.y,
                width: monitor.width, height: monitor.height,
                reactive: false,
                clip_to_allocation: true,
            }));
        }

        this._overviewLayer.add_child(new St.Widget({
            reactive: false,
            style: "background-color: rgba(0, 0, 0, 0.18);",
            constraints: new Clutter.BindConstraint({
                source: this._overviewLayer,
                coordinate: Clutter.BindCoordinate.ALL,
            }),
        }));
    }

    stop() {
        this._sessionId = null;
        if (this._mapTimeoutId) {
            GLib.source_remove(this._mapTimeoutId);
            this._mapTimeoutId = null;
        }
        this._destroyClones();
        this._sourceActor = null;
        if (this._process) this._process.force_exit();
        this._process = null;
    }

    _destroyClones() {
        this._overviewLayer?.destroy();
        this._overviewLayer = null;
        for (const clone of this._clones) clone.destroy();
        this._clones = [];
    }

    destroy() {
        this.stop();
        if (this._windowMapId) {
            global.window_manager.disconnect(this._windowMapId);
            this._windowMapId = null;
        }
        if (this._monitorsChangedId) {
            Main.layoutManager.disconnect(this._monitorsChangedId);
            this._monitorsChangedId = null;
        }
    }
}
