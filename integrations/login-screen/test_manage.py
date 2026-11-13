import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('login_theme', Path(__file__).with_name('manage.py'))
theme = importlib.util.module_from_spec(spec)
spec.loader.exec_module(theme)


class ThemeTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix='aurea-gdm-test-')
        self.addCleanup(self.directory.cleanup)
        self.target = Path(self.directory.name) / 'theme.gresource'
        self.state = Path(self.directory.name) / 'state'
        self.original = theme.base_resource(theme.SYSTEM, theme.STATE).read_bytes()
        self.target.write_bytes(self.original)

    def apply(self):
        return theme.apply(self.target, self.state, restore_context=False)

    def test_install_idempotence_and_exact_restore(self):
        self.apply()
        installed = self.target.read_bytes()
        self.assertIn(theme.IMAGE, theme.entries(self.target))
        self.assertEqual(theme.extract(self.target, theme.PREFIX + 'gnome-shell-high-contrast.css'),
                         theme.extract(self.state / 'original.gresource', theme.PREFIX + 'gnome-shell-high-contrast.css'))
        self.apply()
        self.assertEqual(self.target.read_bytes(), installed)
        self.assertEqual((self.state / 'original.gresource').read_bytes(), self.original)
        theme.remove(self.target, self.state, restore_context=False)
        self.assertEqual(self.target.read_bytes(), self.original)
        self.assertFalse(self.state.exists())

    def test_vendor_update_is_not_replaced_by_old_backup(self):
        self.apply()
        self.target.write_bytes(self.original)
        theme.remove(self.target, self.state, restore_context=False)
        self.assertEqual(self.target.read_bytes(), self.original)

    def test_corrupt_backup_is_rejected(self):
        self.apply()
        installed = self.target.read_bytes()
        (self.state / 'original.gresource').write_bytes(b'wrong')
        with self.assertRaisesRegex(RuntimeError, 'checksum'):
            self.apply()
        self.assertEqual(self.target.read_bytes(), installed)

    def test_failure_restores_previous_install_and_manifest(self):
        self.apply()
        previous = self.target.read_bytes()
        metadata = (self.state / 'state.json').read_bytes()
        original = (self.state / 'original.gresource').read_bytes()
        run = subprocess.run
        build = theme.build
        def altered(base, output):
            build(base, output)
            output.write_bytes(output.read_bytes() + b'\0')
        def fail_context(command, **kwargs):
            if command[0] == 'restorecon':
                raise subprocess.CalledProcessError(1, command)
            return run(command, **kwargs)
        with patch.object(theme, 'build', altered), patch.object(theme.subprocess, 'run', fail_context):
            with self.assertRaises(subprocess.CalledProcessError):
                theme.apply(self.target, self.state, restore_context=True)
        self.assertEqual(self.target.read_bytes(), previous)
        self.assertEqual((self.state / 'state.json').read_bytes(), metadata)
        self.assertEqual((self.state / 'original.gresource').read_bytes(), original)


if __name__ == '__main__':
    unittest.main()
