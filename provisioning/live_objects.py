import json
import requests
import secret
import sys

class Device:
    def __init__(self, dev_eui, name, description, group, properties):
        self.dev_eui        = dev_eui
        self.name           = name
        self.description    = description
        self.group          = group
        self.properties     = {}
        for prop in properties:
            self.properties.update(prop)

class DeviceInterface:
    def __init__(self, dev_eui, profile, activation_type, app_eui, application_key, connectivity_plan, is_enabled):
        self.dev_eui            = dev_eui
        self.profile            = profile
        self.activation_type    = activation_type
        self.app_eui            = app_eui
        self.application_key    = application_key
        self.connectivity_plan  = connectivity_plan
        self.is_enabled         = is_enabled

def create_device(host, headers, device, device_interface):
    payload = {
        "id": f"urn:lo:nsid:lora:{device.dev_eui}",
        "name": device.name,
        "description": device.description,
        "group": {
            "path": device.group
        },
        "properties": device.properties,
        "interfaces": [
            {
            "connector": "lora",
            "enabled": device_interface.is_enabled,
            "definition": {
                "devEUI": device_interface.dev_eui,
                "profile": device_interface.profile,
                "activationType": "OTAA",
                "appEUI": device_interface.app_eui,
                "appKey": device_interface.application_key,
                "connectivityPlan": "orange-cs/CP_Basic"
            }
            }
        ]
        }

    r = requests.post(f'{host}/api/v1/deviceMgt/devices', json=payload, headers=headers)
    if r.status_code not in [200, 201, 204]:
        raise Exception(f'error {r.status_code} when trying to create a device:\n{r.text}')
    else:
        return r.status_code

def update_device(host, headers, device):
    payload = {
        "name": device.name,
        "description": device.description,
        "group": {
            "path": device.group
        },
        "properties": device.properties
        }

    r = requests.patch(f'{host}/api/v1/deviceMgt/devices/urn:lo:nsid:lora:{device.dev_eui}', json=payload, headers=headers)
    if r.status_code not in [200, 201, 204]:
        raise Exception(f'error {r.status_code} when trying to update a device:\n{r.text}')
    else:
        return r.status_code

def update_device_interface(host, headers, device_interface):
    payload = {
            "connector": "lora",
            "enabled": device_interface.is_enabled,
            "definition": {
                "devEUI": device_interface.dev_eui,
                "profile": device_interface.profile,
                "appEUI": device_interface.app_eui,
                "appKey": device_interface.application_key
            }
            }
    r = requests.patch(f'{host}/api/v1/deviceMgt/devices/urn:lo:nsid:lora:{device_interface.dev_eui}/interfaces/lora:{device_interface.dev_eui}', json=payload, headers=headers)
    if r.status_code not in [200, 201, 204]:
        raise Exception(f'error {r.status_code} when trying to update a device interface:\n{r.text}')
    else:
        return r.status_code

def delete_device(host, headers, dev_eui):
    r = requests.delete(f'{host}/api/v1/deviceMgt/devices/urn:lo:nsid:lora:{dev_eui}', headers=headers)
    if r.status_code not in [200, 201, 204]:
        raise Exception(f'error {r.status_code} when trying to delete a device:\n{r.text}')
    else:
        return r.status_code

def main():
    payload = json.load(sys.stdin)
    mode = sys.argv[1]

    host = 'https://liveobjects.orange-business.com'
    api_key = secret.live_objects_api_key

    headers = {
        "X-API-Key": api_key
        }

    if mode == 'create' or mode == 'update':
        # Manufacturer and model
        manufacturer = payload['manufacturer']
        model = payload['model']

        # Group
        r = requests.get(f'{host}/api/v1/deviceMgt/groups?groupPath=/{manufacturer}/{model}', headers=headers)
        if r.status_code not in [200, 201, 204]:
            raise Exception(f'error {r.status_code} when trying to list existing groups:\n{r.text}')
        elif r.json() == []:
            r = requests.get(f'{host}/api/v1/deviceMgt/groups?groupPath=/{manufacturer}', headers=headers)
            if r.status_code not in [200, 201, 204]:
                raise Exception(f'error {r.status_code} when trying to list existing groups:\n{r.text}')
            else:
                if r.json() == []:
                    r = requests.post(f'{host}/api/v1/deviceMgt/groups', json={"pathNode": manufacturer}, headers=headers)
                    if r.status_code not in [200, 201, 204]:
                        raise Exception(f'error {r.status_code} when trying to create manufacturer group:\n{r.text}')
                    else:
                        parent_id = r.json()['id']
                else:
                    parent_id = r.json()[0]['id']
                r = requests.post(f'{host}/api/v1/deviceMgt/groups', json={"pathNode": model, "parentId": parent_id}, headers=headers)
                if r.status_code not in [200, 201, 204]:
                    raise Exception(f'error {r.status_code}  when trying to create model group:\n{r.text}')

        # Config
        r = requests.get(f'https://raw.githubusercontent.com/stellio-hub/device-catalog/main/manufacturers/{manufacturer}/models/{model}/config.json')
        if r.status_code not in [200, 201, 204]:
            raise Exception(f'error {r.status_code} when calling device-catalog GitHub:\n{r.text}')
        else:
            config = r.json()['liveObjects']

        # Properties
        properties = [{item: payload[item]} for item in payload.keys() if item not in ["devEUI", "appEUI", "applicationKey", "name", "description", "network", "manufacturer", "model", "isEnabled"]]

        # Device
        device = Device(payload['devEUI'], payload['name'], payload['description'], f"/{manufacturer}/{model}", properties)
        device_interface = DeviceInterface(payload['devEUI'], config['profile'], config['activationType'], payload['appEUI'], payload['applicationKey'], config['connectivityPlan'], payload['isEnabled'])

        if mode == 'create':
            resp = create_device(host, headers, device, device_interface)
            print(resp)

        elif mode == 'update':
            resp = update_device(host, headers, device), update_device_interface(host, headers, device_interface)
            print(resp)

    elif mode == 'delete':
        resp = delete_device(host, headers, payload['devEUI'])
        print(resp)

    else:
        raise Exception('Incorrect mode')

if __name__ == "__main__":
    main()