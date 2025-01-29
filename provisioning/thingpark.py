import json
import requests
import secret
import sys
import time


class Device:
    def __init__(
        self,
        dev_eui,
        name,
        model,
        connectivity,
        activation,
        app_eui,
        app_key,
        description,
        is_enabled,
    ):
        self.dev_eui = dev_eui
        self.name = name
        self.model = model
        self.connectivity = connectivity
        self.activation = activation
        self.app_eui = app_eui
        self.app_key = app_key
        self.description = description
        self.is_enabled = is_enabled


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


def create_device(hostname, session, device):
    payload = {
        "EUI": device.dev_eui,
        "name": device.name,
        "model": {"ID": device.model},
        "connectivity": device.connectivity,
        "activation": device.activation,
        "appEUI": device.app_eui,
        "appKey": device.app_key,
        "customerAdminData": device.description,
    }
    response = session.post(
        f"{hostname}/thingpark/wireless/rest/subscriptions/mine/devices",
        json=payload,
        headers={"Accept": "application/json"},
    )
    response.raise_for_status()
    if not device.is_enabled:
        suspend_device(hostname, session, device)
    return response


def suspend_device(hostname, session, device):
    response = session.put(
        f"{hostname}/thingpark/wireless/rest/subscriptions/mine/devices/e{device.dev_eui}",
        json={"suspension": "SUBSCRIBER_SUSPENDED"},
        headers={"Accept": "application/json"},
    )
    response.raise_for_status()
    return response


def update_device(hostname, session, device):
    payload = {
        "name": device.name,
        "customerAdminData": device.description,
        "suspension": "NONE" if device.is_enabled else "SUBSCRIBER_SUSPENDED",
    }
    response = session.put(
        f"{hostname}/thingpark/wireless/rest/subscriptions/mine/devices/e{device.dev_eui}",
        json=payload,
        headers={"Accept": "application/json"},
    )
    response.raise_for_status()
    return response


def delete_device(hostname, session, device):
    response = session.delete(
        f"{hostname}/thingpark/wireless/rest/subscriptions/mine/devices/e{device.dev_eui}",
        headers={"Accept": "application/json"},
    )
    response.raise_for_status()
    return response


def fetch_configuration(manufacturer: str, model: str):
    response = requests.get(
        f"https://raw.githubusercontent.com/stellio-hub/device-catalog/main/manufacturers/{manufacturer}/models/{model}/config_LoRaWAN.json"
    )
    response.raise_for_status()
    return response


def main():
    inc = json.load(sys.stdin)
    mode = sys.argv[1]

    manufacturer = inc["manufacturer"]
    model = inc["model"]

    config = fetch_configuration(manufacturer, model).json()["ThingPark"]

    device = Device(
        inc["devEUI"],
        inc["name"],
        config["model"],
        config["connectivity"],
        config["activation"],
        inc["appEUI"],
        inc["appKey"],
        inc["description"],
        inc["isEnabled"],
    )

    hostname = secret.thingpark_hostname
    client_id = secret.thingpark_client_id
    client_secret = secret.thingpark_client_secret

    session = OauthSession(
        client_id=client_id,
        client_secret=client_secret,
        token_url=f"{hostname}/users-auth/protocol/openid-connect/token",
    )

    if mode == "create":
        response = create_device(hostname, session, device)
    elif mode == "update":
        response = update_device(hostname, session, device)
    elif mode == "delete":
        response = delete_device(hostname, session, device)
    else:
        raise Exception(f"Unknown mode: {mode}")

    print(response.text)


if __name__ == "__main__":
    main()
