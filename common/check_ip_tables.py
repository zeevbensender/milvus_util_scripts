import ipaddress
import subprocess
import argparse

def main():
    parser = argparse.ArgumentParser(
        description="Check if an IP address is affected by any iptables rules (direct match or subnet match)."
    )
    parser.add_argument("ip", help="Target IP address to check")
    args = parser.parse_args()

    try:
        target_ip = ipaddress.ip_address(args.ip)
    except ValueError:
        print(f"Invalid IP address: {args.ip}")
        return

    try:
        rules = subprocess.check_output(["sudo", "iptables", "-S"], text=True)
    except subprocess.CalledProcessError as e:
        print(f"Failed to get iptables rules: {e}")
        return

    found = False
    for line in rules.splitlines():
        for token in line.split():
            try:
                net = ipaddress.ip_network(token, strict=False)
                if target_ip in net:
                    print(f"Match: {line}")
                    found = True
            except ValueError:
                continue

    if not found:
        print(f"No iptables rules found that match or include {target_ip}")

if __name__ == "__main__":
    main()
