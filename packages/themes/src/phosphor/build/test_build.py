#!/usr/bin/env python3
"""Run generator in isolation; contrast failures must fail the process."""
import pathlib
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
            generator = build / 'build.py'
            generator.write_text(generator.read_text().replace(
                'fails=[]; rows=[]', 'wcag = lambda a, b: 1\nfails=[]; rows=[]'))
            failed = subprocess.run(command, cwd=directory, capture_output=True, text=True)
            self.assertNotEqual(failed.returncode, 0)
            self.assertIn('200 pairs checked, 200 failing', failed.stdout, failed.stderr)


if __name__ == '__main__':
    unittest.main()
