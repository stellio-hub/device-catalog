import json
import os
import requests
import sys


class Device:
    def __init__(
        self,
        dev_eui: str,
        name: str,
        manufacturer: str,
        model: str,
        app_eui: str,
        app_key: str,
        description: str,
        is_enabled: bool,
        sensor_type_code: str,
        sensor_activation_method_code: str,
        lorawan_version_code: str,
        sensor_class_type_code: str,
        service_provider_code: str,
        price_model_code: str,
    ):
        self.dev_eui = dev_eui
        self.name = name
        self.manufacturer = manufacturer
        self.model = model
        self.app_eui = app_eui
        self.app_key = app_key
        self.description = description
        self.is_enabled = is_enabled
        self.sensor_type_code = sensor_type_code
        self.sensor_activation_method_code = sensor_activation_method_code
        self.lorawan_version_code = lorawan_version_code
        self.sensor_class_type_code = sensor_class_type_code
        self.service_provider_code = service_provider_code
        self.price_model_code = price_model_code


def create_headers(host: str, username: str, password: str):
    r = requests.post(f"{host}/core/login/{username}", json={"password": password})
    if not r.json()["success"]:
        raise Exception("Authentication to Netmore API failed")
    token = r.json()["token"]
    headers = {"Accept": "application/json", "Authorization": f"Bearer {token}"}
    return headers


def generate_payload(device: Device):
    payload = {
        "devEui": device.dev_eui,
        "alias": device.name,
        "sensorTypeCompositeCode": device.sensor_type_code,
        "sensorActivationMethodTypeCompositeCode": device.sensor_activation_method_code,
        "lorawanVersionTypeCompositeCode": device.lorawan_version_code,
        "sensorClassTypeCompositeCode": device.sensor_class_type_code,
        "serviceProviderCode": device.service_provider_code,
        "priceModelMessagesCountTypesCompositeCode": device.price_model_code,
        "provisioned": device.is_enabled,
        "appEui": device.app_eui,
        "appKey": device.app_key,
        "active": True,
        "description": device.description,
        "tags": [
            {"key": "manufacturer", "values": [{"value": device.manufacturer}]},
            {"key": "model", "values": [{"value": device.model}]},
        ],
    }
    return payload


def create_device(host: str, headers: dict, device: Device):
    payload = generate_payload(device)

    r = requests.get(
        f"{host}/net/sensors/{device.dev_eui}", json=payload, headers=headers
    )
    if r.status_code == 200:
        r = update_device(host, headers, device)
        return r
    else:
        r = requests.post(f"{host}/net/sensors", json=payload, headers=headers)
        r.raise_for_status()
        return r


def update_device(host: str, headers: dict, device: Device):
    payload = generate_payload(device)

    r = requests.put(f"{host}/net/sensors", json=payload, headers=headers)
    r.raise_for_status()
    return r


def delete_device(host: str, headers: dict, device: Device):
    payload = {"devEui": device.dev_eui, "provisioned": False, "active": False}

    r = requests.put(f"{host}/net/sensors", json=payload, headers=headers)
    r.raise_for_status()
    return r


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

    device = Device(
        payload["devEui"],
        payload["name"],
        payload["manufacturer"],
        payload["model"],
        payload["appEui"],
        payload["appKey"],
        payload["description"],
        payload["isEnabled"],
        catalog_config["sensorTypeCompositeCode"],
        catalog_config["sensorActivationMethodTypeCompositeCode"],
        catalog_config["lorawanVersionTypeCompositeCode"],
        catalog_config["sensorClassTypeCompositeCode"],
        network_config["serviceProviderCode"],
        network_config["priceModelMessagesCountTypesCompositeCode"],
    )

    if mode == "create":
        response = create_device(host, headers, device)
    elif mode == "update":
        response = update_device(host, headers, device)
    elif mode == "delete":
        response = delete_device(host, headers, device)
    else:
        raise Exception("Invalid mode: {mode}")

    print(response.text)


if __name__ == "__main__":
    main()
