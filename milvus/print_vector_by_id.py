#!/usr/bin/env python3
"""
Fetch and print a vector from a Milvus collection by primary key (ID).

Example:
  python print_milvus_vector.py \
    --host 127.0.0.1 \
    --collection my_collection \
    --id 12345

If the collection has multiple vector fields, pass:
  --vector-field embedding
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any, Dict, List, Optional, Tuple

from pymilvus import Collection, connections, utility


DEFAULT_PORT = 19530


def _die(msg: str, code: int = 2) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    raise SystemExit(code)


def _connect(host: str, port: int, alias: str = "default") -> None:
    try:
        connections.connect(alias=alias, host=host, port=port)
    except Exception as e:
        _die(f"Failed to connect to Milvus at {host}:{port}. Details: {e}")


def _get_pk_and_vector_fields(collection: Collection) -> Tuple[str, List[str]]:
    """
    Returns (pk_field_name, vector_field_names).
    Vector fields include both FLOAT_VECTOR and BINARY_VECTOR.
    """
    pk_name: Optional[str] = None
    vector_fields: List[str] = []

    for f in collection.schema.fields:
        # PK detection
        if getattr(f, "is_primary", False):
            pk_name = f.name

        # Vector detection (covers typical Milvus field types)
        dtype = str(getattr(f, "dtype", "")).upper()
        if dtype in ['101'] or "FLOAT_VECTOR" in dtype or "BINARY_VECTOR" in dtype or dtype.endswith("VECTOR"):
            vector_fields.append(f.name)

    if not pk_name:
        _die(f"Collection '{collection.name}' has no primary key field in schema.")
    if not vector_fields:
        _die(f"Collection '{collection.name}' has no vector field in schema.")

    return pk_name, vector_fields


def _format_expr(pk_field: str, pk_value: str) -> str:
    """
    Build a safe-ish expr for Milvus query.
    If pk_value parses as int, we use numeric. Otherwise we quote as string.
    """
    try:
        iv = int(pk_value)
        return f"{pk_field} == {iv}"
    except ValueError:
        escaped = pk_value.replace("\\", "\\\\").replace('"', '\\"')
        return f'{pk_field} == "{escaped}"'


def _ensure_loaded(collection: Collection) -> None:
    try:
        # If already loaded, this is typically a no-op.
        collection.load()
    except Exception as e:
        _die(f"Failed to load collection '{collection.name}'. Details: {e}")


def _query_one(
    collection: Collection,
    expr: str,
    output_fields: List[str],
    timeout: Optional[float],
) -> Dict[str, Any]:
    try:
        rows = collection.query(
            expr=expr,
            output_fields=output_fields,
            limit=1,
            timeout=timeout,
        )
    except Exception as e:
        _die(f"Query failed. expr={expr!r}. Details: {e}")

    if not rows:
        _die(f"No entity found for expr={expr!r} in collection '{collection.name}'.", code=1)

    return rows[0]


def _pretty_print_vector(vec: Any) -> None:
    """
    Prints float vectors as JSON array. Binary vectors as hex if bytes-like.
    """
    if isinstance(vec, (list, tuple)):
        # float vector typically comes as list[float]
        print(json.dumps(list(vec)))
        return

    if isinstance(vec, (bytes, bytearray, memoryview)):
        b = bytes(vec)
        print(b.hex())
        return

    # Fallback: best-effort string
    print(str(vec))


def main() -> None:
    ap = argparse.ArgumentParser(description="Print a vector from Milvus by primary key.")
    ap.add_argument("--host", required=True, help="Milvus host")
    ap.add_argument(
        "--port",
        type=int,
        default=DEFAULT_PORT,
        help=f"Milvus port (default: {DEFAULT_PORT})",
    )
    ap.add_argument("--collection", required=True, help="Milvus collection name")
    ap.add_argument("--id", required=True, help="Primary key value (int or string)")
    ap.add_argument(
        "--vector-field",
        default=None,
        help="Vector field name (optional; required if multiple vector fields exist and you don't want auto-pick)",
    )
    ap.add_argument(
        "--timeout",
        type=float,
        default=10.0,
        help="Query timeout in seconds (default: 10.0)",
    )
    ap.add_argument(
        "--no-load",
        action="store_true",
        help="Do not call collection.load() (use if you manage loading externally)",
    )
    args = ap.parse_args()

    _connect(args.host, args.port)

    if not utility.has_collection(args.collection):
        _die(f"Collection '{args.collection}' does not exist on {args.host}:{args.port}.")

    col = Collection(args.collection)

    pk_field, vector_fields = _get_pk_and_vector_fields(col)

    if args.vector_field:
        if args.vector_field not in vector_fields:
            _die(
                f"--vector-field '{args.vector_field}' not found among vector fields: {vector_fields}"
            )
        vec_field = args.vector_field
    else:
        # If exactly one vector field, use it; otherwise pick the first and warn.
        vec_field = vector_fields[0]
        if len(vector_fields) > 1:
            print(
                f"WARNING: Multiple vector fields found {vector_fields}. "
                f"Using '{vec_field}'. Pass --vector-field to choose explicitly.",
                file=sys.stderr,
            )

    if not args.no_load:
        _ensure_loaded(col)

    expr = _format_expr(pk_field, args.id)
    row = _query_one(
        collection=col,
        expr=expr,
        output_fields=[pk_field, vec_field],
        timeout=args.timeout,
    )

    vec = row.get(vec_field, None)
    if vec is None:
        _die(f"Returned row does not contain vector field '{vec_field}'. Row keys: {list(row.keys())}")

    # Header (stderr for metadata so stdout can be pure vector if desired)
    print(
        f"collection={args.collection} pk_field={pk_field} id={row.get(pk_field)!r} "
        f"vector_field={vec_field} dim={len(vec) if isinstance(vec, (list, tuple)) else 'unknown'}",
        file=sys.stderr,
    )

    _pretty_print_vector(vec)


if __name__ == "__main__":
    main()
