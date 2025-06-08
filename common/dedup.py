import os
import hashlib
from collections import defaultdict

def file_hash(path):
    """Compute SHA256 hash of a file."""
    hasher = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            hasher.update(chunk)
    return hasher.hexdigest()

def find_txt_files(root_dir):
    """Find all .txt files under root_dir and its subdirectories."""
    txt_files = defaultdict(list)
    for dirpath, _, filenames in os.walk(root_dir):
        for fname in filenames:
            if fname.lower().endswith(".txt"):
                full_path = os.path.join(dirpath, fname)
                txt_files[fname].append(full_path)
    return txt_files

def deduplicate(txt_files):
    """Delete duplicate files with same name and same content."""
    for fname, paths in txt_files.items():
        if len(paths) == 1:
            continue  # Unique file, skip

        # Compute hash of each file
        hashes = {}
        for path in paths:
            hashes[path] = file_hash(path)

        unique_hashes = set(hashes.values())

        if len(unique_hashes) == 1:
            # All files are identical – keep one, delete the rest
            print(f"Duplicate identical files found for '{fname}'. Keeping one, deleting the rest.")
            paths_to_delete = paths[1:]  # Keep the first
            for p in paths_to_delete:
                os.remove(p)
                print(f"  Deleted: {p}")
        else:
            # Conflicting content, warn and keep all
            print(f"WARNING: Duplicate filename with different content: '{fname}'")
            for path, h in hashes.items():
                print(f"  {path} (hash: {h})")

def main():
    import sys
    if len(sys.argv) != 2:
        print("Usage: python dedup_txt_by_name.py /path/to/target-directory")
        sys.exit(1)

    root_dir = sys.argv[1]
    if not os.path.isdir(root_dir):
        print(f"Error: '{root_dir}' is not a valid directory.")
        sys.exit(1)

    txt_files = find_txt_files(root_dir)
    deduplicate(txt_files)

if __name__ == "__main__":
    main()
