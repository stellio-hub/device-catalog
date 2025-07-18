import json
import os
import requests
import sys
import time


class Device:
    def __init__(
        self,
        dev_eui,
        name,
        manufacturer,
        model,
        actility_model_id,
        connectivity,
        activation,
        app_eui,
        app_key,
        description,
        is_enabled,
        domain_name,
        domain_group,
        connections,
    ):
        self.dev_eui = dev_eui
        self.name = name
        self.manufacturer = manufacturer
        self.model = model
        self.actility_model_id = actility_model_id
        self.connectivity = connectivity
        self.activation = activation
        self.app_eui = app_eui
        self.app_key = app_key
        self.description = description
        self.is_enabled = is_enabled
        self.domain_name = domain_name
        self.domain_group = domain_group
        self.connections = connections


class OauthSession(requests.Session):
    def __init__(self, client_id, client_secret, token_url, **kwargs):
        super(OauthSession, self).__init__(**kwargs)
        self.client_id = client_id
        self.client_secret = client_secret
        self.token_url = token_url
        self._access_token: None | str = None
        self._expires_at = None

    def issue_token(self):
        token = (
            super(OauthSession, self)
            .request(
                "POST",
                self.token_url,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "grant_type": "client_credentials",
                },
                headers={"content-type": "application/x-www-form-urlencoded"},
            )
            .json()
        )
        self._access_token = token["access_token"]
        self._expires_at = round(time.time()) + token["expires_in"]

    def expires_in(self):
        if self._expires_at is None:
            return 0
        return self._expires_at - time.time()

    def request(self, method, url, headers=None, **kwargs):
        if self.expires_in() < 10:
            self.issue_token()
        headers = headers or {}
        headers["Authorization"] = "Bearer %s" % self._access_token
        return super(OauthSession, self).request(method, url, headers=headers, **kwargs)


def create_device(host, session, device):
    payload = {
        "EUI": device.dev_eui,
        "name": device.name,
        "model": {"ID": device.actility_model_id},
        "connectivity": device.connectivity,
        "activation": device.activation,
        "appEUI": device.app_eui,
        "appKey": device.app_key,
        "customerAdminData": device.description,
        "domains": [
            {"name": device.domain_name, "group": {"name": device.domain_group}}
        ],
        "appServers": [{"ID": connection_id} for connection_id in device.connections],
    }
    response = session.post(
        f"{host}/thingpark/wireless/rest/subscriptions/mine/devices",
        json=payload,
        headers={"Accept": "application/json"},
    )
    response.raise_for_status()

    tags = {"name": f"model: {device.manufacturer} / {device.model}"}
    add_tags_to_device(host, session, device, tags)

    if not device.is_enabled:
        suspend_device(host, session, device)

    return response


def add_tags_to_device(host, session, device, tags):
    response = session.post(
        f"{host}/thingpark/wireless/rest/subscriptions/mine/devices/e{device.dev_eui}/tags",
        json=tags,
        headers={"Accept": "application/json"},
    )
    response.raise_for_status()
    return response


def suspend_device(host, session, device):
    response = session.put(
        f"{host}/thingpark/wireless/rest/subscriptions/mine/devices/e{device.dev_eui}",
        json={"suspension": "SUBSCRIBER_SUSPENDED"},
        headers={"Accept": "application/json"},
    )
    response.raise_for_status()
    return response


def update_device(host, session, device):
    payload = {
        "name": device.name,
        "customerAdminData": device.description,
        "suspension": "NONE" if device.is_enabled else "SUBSCRIBER_SUSPENDED",
    }
    response = session.put(
        f"{host}/thingpark/wireless/rest/subscriptions/mine/devices/e{device.dev_eui}",
        json=payload,
        headers={"Accept": "application/json"},
    )
    response.raise_for_status()
    return response


def delete_device(host, session, dev_eui):
    response = session.delete(
        f"{host}/thingpark/wireless/rest/subscriptions/mine/devices/e{dev_eui}",
        headers={"Accept": "application/json"},
    )
    response.raise_for_status()
    return response


def fetch_configuration(manufacturer: str, model: str):
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with open(
        f"../../manufacturers/{manufacturer}/models/{model}/config_LoRaWAN.json",
        "r",
    ) as file:
        config = json.load(file)["thingPark"]
        return config


def main():
    payload = json.load(sys.stdin)
    mode = sys.argv[1]

    network_config = payload["network"]["configuration"]["json"]
    host = network_config["server"]
    connections = (
        network_config["connectionId"]
        if isinstance(network_config["connectionId"], list)
        else [network_config["connectionId"]]
    )

    catalog_config = fetch_configuration(payload["manufacturer"], payload["model"])

    session = OauthSession(
        client_id=network_config["clientId"],
        client_secret=network_config["clientSecret"],
        token_url=f"{host}/users-auth/protocol/openid-connect/token",
    )

    if mode == "delete":
        response = delete_device(host, session, payload["devEUI"])
    else:
        device = Device(
            payload["devEUI"],
            payload["name"],
            payload["manufacturer"],
            payload["model"],
            catalog_config["model"],
            catalog_config["connectivity"],
            catalog_config["activationType"],
            payload["appEUI"],
            payload["appKey"],
            payload["description"].strip(),
            payload["isEnabled"],
            network_config["domain_name"],
            network_config["domain_group"],
            connections,
        )
        if mode == "create":
            response = create_device(host, session, device)
        elif mode == "update":
            response = update_device(host, session, device)
        else:
            raise Exception(f"Unknown mode: {mode}")

    print(response.text)


if __name__ == "__main__":
    main()
