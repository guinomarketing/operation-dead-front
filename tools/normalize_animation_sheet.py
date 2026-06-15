"""Crop uniform transparent margins from a horizontal RGBA animation sheet."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--columns", type=int, default=6)
    parser.add_argument("--padding", type=int, default=8)
    args = parser.parse_args()

    sheet = Image.open(args.input).convert("RGBA")
    frame_width = sheet.width // args.columns
    if frame_width * args.columns != sheet.width:
        raise ValueError("Sheet width must be divisible by the number of columns")

    union = [frame_width, sheet.height, 0, 0]
    for index in range(args.columns):
        frame = sheet.crop((index * frame_width, 0, (index + 1) * frame_width, sheet.height))
        bounds = frame.getchannel("A").getbbox()
        if not bounds:
            continue
        union[0] = min(union[0], bounds[0])
        union[1] = min(union[1], bounds[1])
        union[2] = max(union[2], bounds[2])
        union[3] = max(union[3], bounds[3])

    left = max(0, union[0] - args.padding)
    top = max(0, union[1] - args.padding)
    right = min(frame_width, union[2] + args.padding)
    bottom = min(sheet.height, union[3] + args.padding)
    cropped_width = right - left
    cropped_height = bottom - top

    normalized = Image.new("RGBA", (cropped_width * args.columns, cropped_height))
    for index in range(args.columns):
        frame = sheet.crop((
            index * frame_width + left,
            top,
            index * frame_width + right,
            bottom,
        ))
        normalized.alpha_composite(frame, (index * cropped_width, 0))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    normalized.save(args.output, optimize=True)
    print(f"{args.output}: frame={cropped_width}x{cropped_height}, sheet={normalized.width}x{normalized.height}")


if __name__ == "__main__":
    main()
