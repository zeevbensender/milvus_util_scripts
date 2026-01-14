#!/usr/bin/env python3
"""
Print one vector from an FBIN-like file (float32 vectors).

Assumed default FBIN layout:
  - Header: <uint32 num_vectors, uint32 dim> (little-endian), 8 bytes total
  - Then: num_vectors * dim float32 values (little-endian) stored row-major.

If your file is raw float32 with NO header, use --skip-header.

Examples:
  python print_fbin_vector.py --fbin base.fbin --dim 768 --offset 0
  python print_fbin_vector.py --fbin base.fbin --dim 768 --offset 123 --json
  python print_fbin_vector.py --fbin raw.bin  --dim 768 --offset 10 --skip-header
"""

from __future__ import annotations

import argparse
import json
import os
import struct
import sys
from typing import Optional, Tuple, List


FBIN_HEADER_BYTES = 8  # <II


def _read_fbin_header(path: str) -> Tuple[int, int]:
    """Return (num_vectors, dim) from FBIN header <uint32, uint32>."""
    with open(path, "rb") as f:
        hdr = f.read(FBIN_HEADER_BYTES)
        if len(hdr) != FBIN_HEADER_BYTES:
            raise ValueError(f"File too small to contain FBIN header: {path}")
        num_vectors, dim = struct.unpack("<II", hdr)
        return num_vectors, dim


def _file_size(path: str) -> int:
    return os.stat(path).st_size


def _validate_bounds(
    *,
    path: str,
    dim: int,
    offset: int,
    skip_header: bool,
    header_num_vectors: Optional[int],
) -> None:
    if dim <= 0:
        raise ValueError(f"--dim must be > 0 (got {dim})")
    if offset < 0:
        raise ValueError(f"--offset must be >= 0 (got {offset})")

    file_sz = _file_size(path)
    header_sz = 0 if skip_header else FBIN_HEADER_BYTES
    vec_bytes = dim * 4  # float32
    start = header_sz + offset * vec_bytes
    end = start + vec_bytes

    if end > file_sz:
        msg = (
            f"Requested vector is out of file bounds.\n"
            f"  file: {path}\n"
            f"  file_size: {file_sz} bytes\n"
            f"  header_bytes: {header_sz}\n"
            f"  dim: {dim} -> vec_bytes: {vec_bytes}\n"
            f"  offset: {offset} -> byte_range: [{start}, {end})\n"
        )
        if header_num_vectors is not None:
            msg += f"  header_num_vectors: {header_num_vectors}\n"
        raise ValueError(msg)

    if header_num_vectors is not None and offset >= header_num_vectors:
        raise ValueError(
            f"--offset={offset} is >= num_vectors={header_num_vectors} from header."
        )


def _read_vector_f32(
    *,
    path: str,
    dim: int,
    offset: int,
    skip_header: bool,
) -> List[float]:
    header_sz = 0 if skip_header else FBIN_HEADER_BYTES
    vec_bytes = dim * 4
    byte_off = header_sz + offset * vec_bytes

    with open(path, "rb") as f:
        f.seek(byte_off, os.SEEK_SET)
        raw = f.read(vec_bytes)
        if len(raw) != vec_bytes:
            raise ValueError(
                f"Failed to read full vector: wanted {vec_bytes} bytes, got {len(raw)}"
            )
        # unpack little-endian float32s
        return list(struct.unpack("<" + "f" * dim, raw))


def main(argv: Optional[List[str]] = None) -> int:
    p = argparse.ArgumentParser(description="Print one float32 vector from an FBIN file.")
    p.add_argument("--fbin", required=True, help="Path to FBIN file")
    p.add_argument("--dim", required=True, type=int, help="Vector dimension to read")
    p.add_argument(
        "--offset",
        required=True,
        type=int,
        help="0-based vector index (number of vectors to skip)",
    )
    p.add_argument(
        "--skip-header",
        action="store_true",
        help="Treat file as raw float32 vectors with no 8-byte <II> header",
    )
    p.add_argument(
        "--trust-header-dim",
        action="store_true",
        help="If FBIN header exists, override --dim with header dim (sanity check still runs).",
    )
    p.add_argument(
        "--json",
        action="store_true",
        help="Print as JSON array (useful for piping)",
    )
    p.add_argument(
        "--precision",
        type=int,
        default=6,
        help="Float formatting precision for text output (ignored for --json)",
    )
    args = p.parse_args(argv)

    path = args.fbin
    if not os.path.isfile(path):
        print(f"ERROR: file not found: {path}", file=sys.stderr)
        return 2

    header_num_vectors = None
    header_dim = None

    if not args.skip_header:
        try:
            header_num_vectors, header_dim = _read_fbin_header(path)
        except Exception as e:
            print(
                f"ERROR: failed reading FBIN header. If this file has no header, use --skip-header.\n{e}",
                file=sys.stderr,
            )
            return 2

    dim = args.dim
    if (not args.skip_header) and args.trust_header_dim:
        dim = int(header_dim)

    # If header exists but user dim differs, warn (don’t hard-fail; user may intentionally override).
    if (not args.skip_header) and (header_dim is not None) and (dim != int(header_dim)):
        print(
            f"WARNING: --dim={dim} differs from header dim={header_dim}. "
            f"(Use --trust-header-dim to force header dim.)",
            file=sys.stderr,
        )

    try:
        _validate_bounds(
            path=path,
            dim=dim,
            offset=args.offset,
            skip_header=args.skip_header,
            header_num_vectors=header_num_vectors,
        )
        vec = _read_vector_f32(
            path=path,
            dim=dim,
            offset=args.offset,
            skip_header=args.skip_header,
        )
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(vec))
    else:
        fmt = f"{{:.{args.precision}f}}"
        print("[" + ", ".join(fmt.format(x) for x in vec) + "]")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
