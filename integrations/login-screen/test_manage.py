import importlib.util
import os
import json
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


class LayoutTests(unittest.TestCase):
    def setUp(self):
        from layout_install import LayoutInstall
        self.directory = tempfile.TemporaryDirectory(prefix='aurea-gdm-layout-')
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.updates = 0
        def update():
            self.updates += 1
        self.install = LayoutInstall(theme.HERE / 'extension', theme.atomic_write, self.root,
                                     update=update, read_setting=lambda key: ['existing@local'] if key == 'enabled-extensions' else [])

    def test_install_update_remove_preserves_other_greeter_extensions(self):
        from layout_install import CONFIG, EXTENSION, MANIFEST, UUID
        self.install.apply()
        settings = (self.root / CONFIG).read_text()
        self.assertIn('existing@local', settings)
        self.assertIn(UUID, settings)
        self.assertIn('allow-extension-installation=false', settings)
        self.assertEqual((self.root / EXTENSION / 'extension.js').read_bytes(),
                         (theme.HERE / 'extension/extension.js').read_bytes())
        manifest = (self.root / MANIFEST).read_bytes()
        self.install.apply()
        self.assertEqual((self.root / MANIFEST).read_bytes(), manifest)
        self.install.remove()
        self.assertFalse((self.root / EXTENSION).exists())
        self.assertFalse((self.root / CONFIG).exists())
        self.assertFalse((self.root / MANIFEST).exists())

    def test_configuration_compiles_with_real_dconf_and_empty_disabled_list(self):
        from layout_install import CONFIG
        self.install.apply()
        output = self.root / 'compiled-gdm'
        subprocess.run(['dconf', 'compile', str(output), str((self.root / CONFIG).parent)], check=True)
        self.assertTrue(output.is_file())
        profile = self.root / 'profile'
        profile.write_text(f'file-db:{output}\n')
        env = {**os.environ, 'DCONF_PROFILE': str(profile), 'GSETTINGS_BACKEND': 'dconf'}
        for schema, key, expected in [('org.gnome.login-screen', 'logo', "''"),
                                      ('org.gnome.desktop.a11y.applications', 'screen-keyboard-enabled', 'false')]:
            actual = subprocess.check_output(['gsettings', 'get', schema, key], env=env, text=True).strip()
            self.assertEqual(actual, expected)

    def test_upgrade_from_layout_without_keyboard_policy(self):
        from layout_install import CONFIG, EXTENSION, MANIFEST, checksum
        self.install.apply()
        config = self.root / CONFIG
        config.write_text(config.read_text().split('[org/gnome/login-screen]')[0])
        policy = EXTENSION / 'keyboardPolicy.js'
        (self.root / policy).unlink()
        manifest = json.loads((self.root / MANIFEST).read_text())
        del manifest[str(policy)]
        manifest[str(CONFIG)]['installed'] = checksum(config.read_bytes())
        (self.root / MANIFEST).write_text(json.dumps(manifest))
        self.install.apply()
        self.assertIn('existing@local', config.read_text())
        self.assertIn("logo=''", config.read_text())
        self.assertTrue((self.root / policy).is_file())
        self.install.remove()
        self.assertFalse((self.root / policy).exists())

    def test_failed_update_restores_existing_files(self):
        from layout_install import CONFIG, MANIFEST
        self.install.apply()
        before = (self.root / MANIFEST).read_bytes()
        calls = []
        def update():
            calls.append(True)
            if len(calls) == 1:
                raise RuntimeError('dconf unavailable')
        self.install.update = update
        with self.assertRaisesRegex(RuntimeError, 'dconf unavailable'):
            self.install.apply()
        self.assertEqual((self.root / MANIFEST).read_bytes(), before)
        self.assertTrue((self.root / CONFIG).is_file())
        self.assertEqual(len(calls), 2)

    def test_failed_first_install_leaves_no_broken_extension_directory(self):
        from layout_install import EXTENSION, MANIFEST
        calls = []
        def update():
            calls.append(True)
            if len(calls) == 1:
                raise RuntimeError('dconf unavailable')
        self.install.update = update
        with self.assertRaisesRegex(RuntimeError, 'dconf unavailable'):
            self.install.apply()
        self.assertFalse((self.root / EXTENSION).exists())
        self.assertFalse((self.root / MANIFEST).exists())

    def test_external_edits_and_symlinks_are_rejected(self):
        from layout_install import CONFIG
        self.install.apply()
        path = self.root / CONFIG
        path.write_text('external edit')
        with self.assertRaisesRegex(RuntimeError, 'fuera de Aurea'):
            self.install.remove()
        self.assertEqual(path.read_text(), 'external edit')
        path.unlink()
        path.symlink_to(self.root / 'outside')
        with self.assertRaisesRegex(RuntimeError, 'enlazadas'):
            self.install.apply()


if __name__ == '__main__':
    unittest.main()
