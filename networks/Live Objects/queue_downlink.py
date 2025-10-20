import json
import requests
import sys


def queue_downlink(host, headers, fport, command, dev_eui):
    r = requests.post(
        f"{host}/api/v1/deviceMgt/devices/urn:lo:nsid:lora:{dev_eui}/commands",
        json={
            "request": {"connector": "lora", "value": {"data": command, "port": fport}}
        },
        headers=headers,
    )
    r.raise_for_status()
    return r.json()


def main():
    payload = json.load(sys.stdin)
    dev_eui = payload["devEUI"]
    fport = sys.argv[1]
    command = sys.argv[2]

    network_config = payload["network"]["configuration"]["json"]
    server = network_config["server"]
    api_key = network_config["apiKey"]

    headers = {"X-API-Key": api_key}

    response = queue_downlink(server, headers, fport, command, dev_eui)

    json.dump(response, sys.stdout, indent=4)


if __name__ == "__main__":
    main()
