import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('boot_manage', Path(__file__).with_name('manage.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
CUSTOM = '''#!/usr/bin/sh
exec tail -n +3 $0
menuentry 'Windows Boot Manager' --class windows {
 search --fs-uuid --set=windows_efi ABCD-1234
 chainloader ($windows_efi)/EFI/Microsoft/Boot/bootmgfw.efi
}
menuentry 'Arch Linux (disco externo)' --class arch {
 search --fs-uuid --set=external EEEE-1111
 chainloader ($external)/EFI/Linux/arch-linux.efi
}
'''
DEFAULTS = 'GRUB_ENABLE_BLSCFG=true\nGRUB_DEFAULT=saved\nGRUB_CMDLINE_LINUX="quiet rootflags=subvol=root"\nGRUB_THEME="/boot/grub2/themes/whitesur/theme.txt"\n'


class BootTests(unittest.TestCase):
    def test_custom_retains_windows_search_and_chainloader(self):
        result, count = m.configure_custom(CUSTOM, 'Arch Linux (disco externo)')
        self.assertEqual(count, 1)
        self.assertNotIn('EEEE-1111', result)
        self.assertIn('ABCD-1234', result)
        self.assertIn('chainloader ($windows_efi)/EFI/Microsoft/Boot/bootmgfw.efi', result)
        self.assertIn("menuentry 'Windows'", result)
        self.assertEqual(m.configure_custom(result, 'Arch Linux (disco externo)'), (result, 0))
        with tempfile.NamedTemporaryFile(mode='w') as file:
            file.write('\n'.join(result.splitlines()[2:])); file.flush()
            subprocess.run(['grub2-script-check', file.name], check=True)

    def test_defaults_preserve_kernel_arguments(self):
        result = m.configure_defaults(DEFAULTS)
        self.assertIn('GRUB_DEFAULT=saved', result)
        self.assertIn('GRUB_CMDLINE_LINUX="quiet rootflags=subvol=root"', result)
        self.assertEqual(result.count('GRUB_THEME='), 1)
        self.assertEqual(m.configure_defaults(result), result)
        with self.assertRaises(ValueError):
            m.configure_defaults('GRUB_ENABLE_BLSCFG=false\n')

    def test_refuse_ambiguous_or_missing_windows(self):
        with self.assertRaises(ValueError):
            m.configure_custom(CUSTOM.replace(' chainloader ($external)', ' if test { chainloader ($external)'), 'Arch Linux (disco externo)')
        with self.assertRaises(ValueError):
            m.configure_custom(CUSTOM.replace('Windows Boot Manager', 'Unknown'), 'Arch Linux (disco externo)')

    def test_install_failure_restores_every_managed_file(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            files = [root / n for n in ['defaults', 'custom', 'firmware', 'grub.cfg']]
            defaults, custom, firmware, config = files
            for path, text in zip(files, [DEFAULTS, CUSTOM, 'firmware-generator', 'working-boot-config']):
                path.write_text(text); path.chmod(0o755)
            before = {p: p.read_bytes() for p in files}
            legacy = root / 'whitesur'; legacy.mkdir(); (legacy / 'theme.txt').write_text('original')
            with patch.multiple(m, DEFAULTS=defaults, CUSTOM=custom, FIRMWARE=firmware, CONFIG=config,
                                FILES=tuple(files), STATE=root / 'state', THEME=root / 'Aurea27', LEGACY=legacy), \
                 patch.object(m, 'generate', side_effect=RuntimeError('invalid generated config')):
                with self.assertRaisesRegex(RuntimeError, 'invalid generated'):
                    m.apply('Arch Linux (disco externo)')
                for path in files:
                    self.assertEqual(path.read_bytes(), before[path])
                    self.assertEqual(path.stat().st_mode & 0o777, 0o755)
                self.assertFalse(m.THEME.exists())
                self.assertEqual((legacy / 'theme.txt').read_text(), 'original')
                self.assertTrue((m.STATE / 'original.json').is_file())

    def test_generate_rejects_missing_bls_without_replacing_config(self):
        with tempfile.TemporaryDirectory() as folder:
            config = Path(folder) / 'grub.cfg'; config.write_text('working')
            def fake_run(*args):
                if args[0] == 'grub2-mkconfig':
                    Path(args[-1]).write_text("menuentry 'Windows' {}\n")
                return ''
            with patch.object(m, 'CONFIG', config), patch.object(m, 'run', side_effect=fake_run):
                with self.assertRaisesRegex(ValueError, 'BLS'):
                    m.generate('/grub2/themes/Aurea27/theme.txt')
                self.assertEqual(config.read_text(), 'working')
                self.assertEqual(list(Path(folder).iterdir()), [config])

    def test_apply_twice_and_restore_keep_original_permissions(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            files = [root / n for n in ['defaults', 'custom', 'firmware', 'grub.cfg']]
            defaults, custom, firmware, config = files
            for path, text in zip(files, [DEFAULTS, CUSTOM, 'firmware-generator', 'original-config']):
                path.write_text(text); path.chmod(0o755)
            def generate(theme, title=None):
                config.write_text(f"set theme={theme or 'previous'}\nblscfg\nmenuentry 'Windows' {{}}\n")
            with patch.multiple(m, DEFAULTS=defaults, CUSTOM=custom, FIRMWARE=firmware, CONFIG=config,
                                FILES=tuple(files), STATE=root / 'state', THEME=root / 'Aurea27', LEGACY=root / 'whitesur'), \
                 patch.object(m, 'generate', side_effect=generate), patch.object(m, 'run', return_value=''):
                m.apply('Arch Linux (disco externo)')
                backup = (m.STATE / 'original.json').read_bytes()
                m.apply('Arch Linux (disco externo)')
                self.assertEqual((m.STATE / 'original.json').read_bytes(), backup)
                self.assertEqual(firmware.stat().st_mode & 0o111, 0)
                m.restore()
                self.assertEqual(custom.read_text(), CUSTOM)
                self.assertEqual(defaults.read_text(), DEFAULTS)
                self.assertEqual(firmware.stat().st_mode & 0o777, 0o755)
                self.assertFalse(m.THEME.exists())
                self.assertFalse(m.STATE.exists())


if __name__ == '__main__':
    unittest.main()
