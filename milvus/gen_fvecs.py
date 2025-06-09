import numpy as np
import argparse
import os
import struct

def generate_fvecs(filename, dim, n):
    if not filename.endswith(".fvecs"):
        filename += ".fvecs"

    if os.path.exists(filename):
        choice = input(f"File '{filename}' already exists. Overwrite? [Y/n]: ").strip().lower()
        if choice and choice not in ["y", "yes"]:
            print("Aborted.")
            return

    vectors = np.random.uniform(0, 1, size=(n, dim)).astype(np.float32)

    with open(filename, "wb") as f:
        for vec in vectors:
            f.write(struct.pack("i", dim))        # Write dimension as int32
            f.write(vec.tobytes())                # Write vector as float32s

    print(f"Generated {n} vectors of dimension {dim} and saved to '{filename}'.")

def main():
    parser = argparse.ArgumentParser(description="Generate an fvecs file with random vectors.")
    parser.add_argument("name", type=str, help="Name of the output .fvecs file")
    parser.add_argument("dim", type=int, help="Dimension of each vector")
    parser.add_argument("n", type=int, help="Number of vectors to generate")

    args = parser.parse_args()
    generate_fvecs(args.name, args.dim, args.n)

if __name__ == "__main__":
    main()

