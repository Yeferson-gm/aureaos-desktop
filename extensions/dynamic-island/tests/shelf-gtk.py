import importlib.util
import os
from pathlib import Path
import tempfile
import gi
gi.require_version('Gtk', '4.0')
gi.require_version('Gdk', '4.0')
from gi.repository import Gtk, Gdk, Gio, GLib

assert os.environ.get('DI_TEST_DIR'), 'Solo en la sesión aislada'
spec = importlib.util.spec_from_file_location('shelf', Path(__file__).parents[1] / 'shelf-window.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
Gtk.init()
with tempfile.TemporaryDirectory(prefix='aurea-shelf-test-') as directory:
    first = Path(directory) / 'primero.txt'
    second = Path(directory) / 'segundo.txt'
    first.write_text('uno')
    second.write_text('dos')
    app = module.Shelf([])
    app.register(None)
    app.activate()
    value = Gdk.FileList.new_from_array([Gio.File.new_for_path(str(p)) for p in [first, second]])
    assert app.drop_files(None, value, 0, 0)
    assert app.paths == [str(first), str(second)]
    assert app.drop_files(None, value, 0, 0)
    assert len(app.paths) == 2
    provider = Gdk.ContentProvider.new_for_value(value)
    assert provider.ref_formats().contain_gtype(Gdk.FileList)
    first.unlink()
    app.changed(None, None, None, Gio.FileMonitorEvent.DELETED)
    assert app.paths == [str(second)]
    app.quit()
print('PASS: GTK FileList múltiple, duplicados, proveedor de salida y borrado')
