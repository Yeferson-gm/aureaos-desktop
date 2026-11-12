#!/usr/bin/env python3
import json
from pathlib import Path
import sys
import gi
gi.require_version('Gtk', '4.0')
gi.require_version('Gdk', '4.0')
from gi.repository import Gtk, Gdk, Gio, GLib


class Shelf(Gtk.Application):
    def __init__(self, paths):
        super().__init__(application_id='org.aurea.IslandShelf', flags=Gio.ApplicationFlags.NON_UNIQUE)
        self.paths = [str(Path(p)) for p in paths if Path(p).exists()][:50]
        self.selected = set()
        self.monitors = {}
        self.connect('activate', self.activate_shelf)

    def activate_shelf(self, _app):
        self.window = Gtk.ApplicationWindow(application=self, title='Aurea · Estante')
        self.window.set_decorated(False)
        self.window.set_default_size(472, 320)
        css = Gtk.CssProvider()
        css.load_from_data(b'window { background: #101217; color: #f4f5f8; border-radius: 16px; } button { border-radius: 10px; background: #272a32; color: #f4f5f8; box-shadow: none; border: none; } button:hover { background: #3b4050; } .tile { padding: 10px; } .title { font-size: 19px; font-weight: bold; }')
        Gtk.StyleContext.add_provider_for_display(Gdk.Display.get_default(), css, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)
        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=12, margin_start=18, margin_end=18, margin_top=16, margin_bottom=16)
        head = Gtk.Box(spacing=12)
        title = Gtk.Label(label='Estante', xalign=0, hexpand=True)
        title.add_css_class('title')
        head.append(title)
        close = Gtk.Button(icon_name='window-close-symbolic')
        close.connect('clicked', lambda _b: self.quit())
        head.append(close)
        box.append(head)
        box.append(Gtk.Label(label='Suelta archivos aquí · Selecciona varios y arrástralos fuera', wrap=True, xalign=0))
        self.grid = Gtk.FlowBox(max_children_per_line=3, min_children_per_line=3, selection_mode=Gtk.SelectionMode.NONE, row_spacing=8, column_spacing=8)
        scroll = Gtk.ScrolledWindow(vexpand=True, min_content_height=210, max_content_height=440)
        scroll.set_child(self.grid)
        box.append(scroll)
        self.window.set_child(box)
        drop = Gtk.DropTarget.new(Gdk.FileList, Gdk.DragAction.COPY)
        drop.connect('drop', self.drop_files)
        self.window.add_controller(drop)
        keys = Gtk.EventControllerKey()
        keys.connect('key-pressed', lambda _k, key, _code, _state: self.quit() or True if key == Gdk.KEY_Escape else False)
        self.window.add_controller(keys)
        self.render()
        self.window.present()

    def drop_files(self, _target, value, _x, _y):
        paths = [f.get_path() for f in value.get_files() if f.get_path() and f.query_exists(None)]
        if not paths:
            return False
        self.paths = list(dict.fromkeys(self.paths + paths))[:50]
        print(json.dumps({'files': self.paths}), flush=True)
        self.render()
        return True

    def changed(self, _monitor, _file, _other, event):
        if event not in (Gio.FileMonitorEvent.DELETED, Gio.FileMonitorEvent.MOVED_OUT):
            return
        self.paths = [path for path in self.paths if Path(path).exists()]
        self.selected.intersection_update(self.paths)
        self.render()

    def render(self):
        for path, monitor in list(self.monitors.items()):
            if path not in self.paths:
                monitor.cancel()
                del self.monitors[path]
        for path in self.paths:
            if path not in self.monitors:
                monitor = Gio.File.new_for_path(path).monitor_file(Gio.FileMonitorFlags.NONE, None)
                monitor.connect('changed', self.changed)
                self.monitors[path] = monitor
        while self.grid.get_first_child():
            self.grid.remove(self.grid.get_first_child())
        for path in self.paths:
            file = Gio.File.new_for_path(path)
            col = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6, width_request=126)
            col.add_css_class('tile')
            if Path(path).suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp'):
                picture = Gtk.Picture.new_for_file(file)
                picture.set_content_fit(Gtk.ContentFit.CONTAIN)
                picture.set_size_request(80, 60)
                col.append(picture)
            else:
                col.append(Gtk.Image(icon_name='folder-symbolic' if Path(path).is_dir() else 'text-x-generic-symbolic', pixel_size=40))
            toggle = Gtk.CheckButton(label=Path(path).name[:24], active=path in self.selected)
            toggle.set_tooltip_text(Path(path).name)
            toggle.connect('toggled', lambda b, p=path: self.selected.add(p) if b.get_active() else self.selected.discard(p))
            col.append(toggle)
            source = Gtk.DragSource(actions=Gdk.DragAction.COPY)
            source.connect('prepare', lambda _s, _x, _y, p=path: Gdk.ContentProvider.new_for_value(
                Gdk.FileList.new_from_array([Gio.File.new_for_path(f) for f in (self.selected if p in self.selected else [p]) if Path(f).exists()])))
            col.add_controller(source)
            click = Gtk.GestureClick()
            click.connect('released', lambda _g, count, _x, _y, f=file: Gio.AppInfo.launch_default_for_uri(f.get_uri(), None) if count == 2 else None)
            col.add_controller(click)
            self.grid.append(col)


if __name__ == '__main__':
    Shelf(json.loads(sys.argv[1]) if len(sys.argv) > 1 else []).run([])
