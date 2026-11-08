import argparse
import sys
from pathlib import Path
try:
    from aligner.engine import WindowConstrainedAligner
except (ModuleNotFoundError, ImportError):
    try:
        from .engine import WindowConstrainedAligner
    except (ModuleNotFoundError, ImportError):
        from services.aligner.aligner.engine import WindowConstrainedAligner

def main():
    parser = argparse.ArgumentParser(
        prog="aligner",
        description="MyuJiku CLI: Align lyrics to audio with window-constrained forced timing",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    align_parser = subparsers.add_parser("align", help="Align audio and LRC files")
    align_parser.add_argument("audio", help="Path to input audio file")
    align_parser.add_argument("lyrics", help="Path to input LRC / plain lyrics file")
    align_parser.add_argument("-o", "--output", required=True, help="Path to output .elrc file")
    align_parser.add_argument("--model", default="base", choices=["tiny", "base", "small"], help="Whisper model size")
    align_parser.add_argument("--separate-vocals", action="store_true", help="Separate vocals with Demucs first")

    args = parser.parse_args()

    if args.command == "align":
        audio_path = Path(args.audio)
        lyrics_path = Path(args.lyrics)
        out_path = Path(args.output)

        if not audio_path.exists():
            print(f"Error: audio file not found: {audio_path}", file=sys.stderr)
            sys.exit(1)
        if not lyrics_path.exists():
            print(f"Error: lyrics file not found: {lyrics_path}", file=sys.stderr)
            sys.exit(1)

        lyrics_text = lyrics_path.read_text(encoding="utf-8")
        aligner = WindowConstrainedAligner()

        print(f"Aligning {audio_path.name} with model '{args.model}'...")
        lines, elrc = aligner.align(
            lyrics_text,
            total_duration=180.0,
            model_name=args.model,
            separate_vocals=args.separate_vocals,
        )

        out_path.write_text(elrc, encoding="utf-8")
        print(f"Successfully aligned {len(lines)} lines -> {out_path}")

if __name__ == "__main__":
    main()
