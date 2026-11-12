#!/usr/bin/env python3
"""Run generator in isolation; contrast failures must fail the process."""
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import unittest


class GeneratorTest(unittest.TestCase):
    def test_contrast_gate(self):
        with tempfile.TemporaryDirectory() as directory:
            build = pathlib.Path(directory) / 'build'
            build.mkdir()
            for name in ('build.py', 'palette.py', 'color.py'):
                shutil.copyfile(pathlib.Path(__file__).with_name(name), build / name)
            command = [sys.executable, str(build / 'build.py')]
            passed = subprocess.run(command, cwd=directory, capture_output=True, text=True)
            self.assertEqual(passed.returncode, 0, passed.stdout + passed.stderr)
            self.assertIn('200 pairs checked, 0 failing', passed.stdout)
            css = (build.parent / 'phosphor.tokens.css').read_text()
            self.assertIn('--folder:', css)
            self.assertIn('--tab-flare:', css)
            self.assertNotIn('--ph-', css)
            # Layer 1 identities, Layer 2 roles alias them; no raw color on a role
            self.assertIn('theme-editor: identities', css)
            self.assertIn('--mint: oklch(', css)
            self.assertIn('--primary: var(--mint);', css)
            self.assertIn('--bg: var(--bone);', css)
            roles = css.split('theme-editor: roles', 1)[1].split('theme-editor: roles-end')[0]
            self.assertNotRegex(roles, r'--[a-z0-9-]+: oklch\(')
            # an unnamed color fails the build
            palette = build / 'palette.py'
            palette.write_text(palette.read_text().replace("'fg': 'khaki', ", ''))
            unnamed = subprocess.run(command, cwd=directory, capture_output=True, text=True)
            self.assertNotEqual(unnamed.returncode, 0)
            self.assertIn('has no identity', unnamed.stdout + unnamed.stderr)
            shutil.copyfile(pathlib.Path(__file__).with_name('palette.py'), palette)
            generator = build / 'build.py'
            generator.write_text(generator.read_text().replace(
                'fails=[]; rows=[]', 'wcag = lambda a, b: 1\nfails=[]; rows=[]'))
            failed = subprocess.run(command, cwd=directory, capture_output=True, text=True)
            self.assertNotEqual(failed.returncode, 0)
            self.assertIn('200 pairs checked, 200 failing', failed.stdout, failed.stderr)

    def test_cev_family(self):
        with tempfile.TemporaryDirectory() as directory:
            build = pathlib.Path(directory) / 'phosphor' / 'build'
            build.mkdir(parents=True)
            for name in ('build.py', 'palette.py', 'palette_cev.py', 'color.py'):
                shutil.copyfile(pathlib.Path(__file__).with_name(name), build / name)
            command = [sys.executable, '-B', str(build / 'build.py'), '-f', 'cev']  # -B: same-size palette edits must not hit a stale .pyc
            run = lambda: subprocess.run(command, cwd=directory, capture_output=True, text=True)
            passed = run()
            self.assertEqual(passed.returncode, 0, passed.stdout + passed.stderr)
            self.assertIn('200 pairs checked, 0 failing', passed.stdout)
            out = pathlib.Path(directory) / 'cev'
            self.assertTrue((out / 'build' / 'tokens.generated.json').exists())
            # an overlay family writes only its tokens: no bridge, no adapters
            self.assertFalse((build.parent / 'phosphor.tailwind.css').exists())
            css = (out / 'cev.tokens.css').read_text()
            self.assertNotIn('@import', css)
            self.assertIn('[data-theme="cev"][data-mode="light"]', css)
            self.assertIn('--radius: 0.5rem;', css)
            roles = css.split('theme-editor: roles', 1)[1].split('theme-editor: roles-end')[0]
            dark, light = roles.split('color-scheme: light;')
            for block in (dark, light):
                for role in ('bg', 'surface-2', 'primary-fg', 'emphasis-soft-fg', 'link', 'chart-5', 'shadow-overlay', 'backdrop'):
                    self.assertIn(f'--{role}: ', block)
            identities = css.split('theme-editor: identities', 1)[1].split('identities-end')[0]
            names = set(re.findall(r'^  --([a-z0-9-]+):', identities, re.M))
            self.assertTrue(names and all(n.startswith('cev-') for n in names), names)
            palette = build / 'palette_cev.py'
            original = palette.read_text()
            # N1: a muted text colour below AA fails the contrast gate
            palette.write_text(original.replace("'fg-muted': '#a0a0a0'", "'fg-muted': '#555555'"))
            low = run()
            self.assertNotEqual(low.returncode, 0)
            self.assertIn('FAIL', low.stdout)
            # N2: an unnamed colour fails the identity gate
            palette.write_text(original + "\ndel IDENTITY['dark']['fg-disabled']\n")
            unnamed = run()
            self.assertNotEqual(unnamed.returncode, 0)
            self.assertIn('has no identity', unnamed.stdout + unnamed.stderr)
            # N3: a family without its own shadows fails instead of inheriting phosphor's
            palette.write_text(original.replace('SHADOW = {', '_SHADOW = {'))
            leak = run()
            self.assertNotEqual(leak.returncode, 0)
            self.assertIn("has no attribute 'SHADOW'", leak.stderr)


if __name__ == '__main__':
    unittest.main()
