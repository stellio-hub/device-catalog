import json
import os
import requests
import sys


def create_headers(host: str, username: str, password: str):
    r = requests.post(f"{host}/core/login/{username}", json={"password": password})
    if not r.json()["success"]:
        raise Exception("Authentication to Netmore API failed")
    token = r.json()["token"]
    headers = {"Accept": "application/json", "Authorization": f"Bearer {token}"}
    return headers


def create_device(host: str, headers: dict, device_body: dict):
    r = requests.get(f"{host}/net/sensors/{device_body['devEui']}", headers=headers)
    if r.status_code == 200:
        r = update_device(host, headers, device_body)
        return r
    elif r.status_code == 404:
        r = requests.post(f"{host}/net/sensors", json=device_body, headers=headers)
        r.raise_for_status()
        if r.json()[0]["status"] == "OK":
            return r
        elif r.json()[0]["status"] == "ERROR":
            raise Exception(r.text)
        else:
            raise Exception(f"Unexpected response: {r.text}")
    else:
        raise Exception(f"Unexpected response: {r.text}")


def update_device(host: str, headers: dict, device_body: dict):
    r = requests.put(f"{host}/net/sensors", json=device_body, headers=headers)
    r.raise_for_status()
    if r.json()[0]["status"] == "OK":
        return r
    elif r.json()[0]["status"] == "ERROR":
        raise Exception(r.text)
    else:
        raise Exception(f"Unexpected response: {r.text}")


def delete_device(host: str, headers: dict, dev_eui: str):
    device_body = {"devEui": dev_eui, "provisioned": False, "active": False}
    r = requests.put(f"{host}/net/sensors", json=device_body, headers=headers)
    r.raise_for_status()
    if r.json()[0]["status"] == "OK":
        return r
    elif r.json()[0]["status"] == "ERROR":
        raise Exception(r.text)
    else:
        raise Exception(f"Unexpected response: {r.text}")


def fetch_configuration(manufacturer: str, model: str):
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with open(
        f"../../manufacturers/{manufacturer}/models/{model}/config_LoRaWAN.json",
        "r",
    ) as file:
        config = json.load(file)["netmore"]
        return config


def main():
    payload = json.load(sys.stdin)
    mode = sys.argv[1]

    network_config = payload["network"]["configuration"]["json"]
    host = network_config["server"]
    headers = create_headers(
        host, network_config["username"], network_config["password"]
    )

    catalog_config = fetch_configuration(payload["manufacturer"], payload["model"])

    if mode == "create" or mode == "update":
        device_body = {
            "devEui": payload["devEUI"],
            "alias": payload["name"],
            "sensorTypeCompositeCode": catalog_config["sensorTypeCompositeCode"],
            "sensorActivationMethodTypeCompositeCode": catalog_config[
                "sensorActivationMethodTypeCompositeCode"
            ],
            "lorawanVersionTypeCompositeCode": catalog_config[
                "lorawanVersionTypeCompositeCode"
            ],
            "sensorClassTypeCompositeCode": catalog_config[
                "sensorClassTypeCompositeCode"
            ],
            "priceModelMessagesCountTypesCompositeCode": network_config[
                "priceModelMessagesCountTypesCompositeCode"
            ],
            "serviceProviderCode": network_config["serviceProviderCode"],
            "customerCode": network_config["customerCode"],
            "exportConfigCode": network_config["exportConfigCode"],
            "provisioned": payload["isEnabled"],
            "appEui": payload["appEUI"],
            "appKey": payload["appKey"],
            "active": True,
            "description": payload["description"],
            "tags": [
                {"key": "manufacturer", "values": [{"value": payload["manufacturer"]}]},
                {"key": "model", "values": [{"value": payload["model"]}]},
            ],
        }
        if mode == "create":
            response = create_device(host, headers, device_body)
        if mode == "update":
            response = update_device(host, headers, device_body)
    elif mode == "delete":
        response = delete_device(host, headers, device_body["devEUI"])
    else:
        raise Exception(f"Invalid mode: {mode}")

    print(response.text)


if __name__ == "__main__":
    main()
