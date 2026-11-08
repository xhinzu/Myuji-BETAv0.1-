"""MyuJiku Forced Alignment Service"""
import sys
from pathlib import Path

pkg_dir = str(Path(__file__).parent.parent)
if pkg_dir not in sys.path:
    sys.path.insert(0, pkg_dir)

__version__ = "2.0.0"
