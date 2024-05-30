import json
import requests
import secret
import sys

class Device:
    def __init__(self, dev_eui, name, description, group):
        self.dev_eui        = dev_eui
        self.name           = name
        self.description    = description
        self.group          = group

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
        raise Exception(f'error {r.status_code} - issue when trying to create a device')
    else:
        return r.status_code
    
def update_device(host, headers, device):
    payload = {
        "name": device.name,
        "description": device.description,
        "group": {
            "path": device.group
        }
        }
    
    r = requests.patch(f'{host}/api/v1/deviceMgt/devices/urn:lo:nsid:lora:{device.dev_eui}', json=payload, headers=headers)
    if r.status_code not in [200, 201, 204]:
        raise Exception(f'error {r.status_code} - issue when trying to update a device')
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
        raise Exception(r.status_code)
    else:
        return r.status_code

def delete_device(host, headers, dev_eui):
    r = requests.delete(f'{host}/api/v1/deviceMgt/devices/urn:lo:nsid:lora:{dev_eui}', headers=headers)
    if r.status_code not in [200, 201, 204]:
        raise Exception(f'error {r.status_code} - issue when trying to delete a device')
    else:
        return r.status_code

def main():
    input = json.load(sys.stdin)
    mode = sys.argv[1]

    host  = 'https://liveobjects.orange-business.com'
    api_key = secret.live_objects_api_key

    headers = {
        "X-API-Key": api_key
        }

    if mode == 'create' or mode == 'update':
        manufacturer = input['manufacturer']
        model = input['model']

        r = requests.get(f'{host}/api/v1/deviceMgt/groups?groupPath=/{manufacturer}/{model}', headers=headers)
        if r.status_code != 200:
            raise Exception(f'error {r.status_code} - issue when trying to list existing groups')
        elif r.json() == []:
            r = requests.get(f'{host}/api/v1/deviceMgt/groups?groupPath=/{manufacturer}', headers=headers)
            if r.status_code != 200:
                raise Exception(f'error {r.status_code} - issue when trying to list existing groups')
            else:
                if r.json() == []:
                    r = requests.post(f'{host}/api/v1/deviceMgt/groups', json={"pathNode": manufacturer}, headers=headers)
                    if r.status_code != 201:
                        raise Exception(f'error {r.status_code} - issue when trying to create manufacturer group')
                    else:
                        parent_id = r.json()['id']
                else:
                    parent_id = r.json()[0]['id']
                r = requests.post(f'{host}/api/v1/deviceMgt/groups', json={"pathNode": model, "parentId": parent_id}, headers=headers)
                if r.status_code != 201:
                    raise Exception(f'error {r.status_code} - issue when trying to create model group')

        r = requests.get(f'https://raw.githubusercontent.com/stellio-hub/device-catalog/feat/group-by-manfucaturers/manufacturers/{manufacturer}/models/{model}/config.json')
        if r.status_code not in [200, 201, 204]:
            raise Exception('Issue when calling device-catalog GitHub')
        else:
            config = r.json()['liveObjects']

    if mode == 'create':
        device = Device(input['devEUI'], input['name'], input['description'], f"/{manufacturer}/{model}")
        device_interface = DeviceInterface(input['devEUI'], config['profile'], config['activationType'], input['appEUI'], input['applicationKey'], config['connectivityPlan'], input['isEnabled'])
        resp = create_device(host, headers, device, device_interface)
        print(resp)

    elif mode == 'update':
        device = Device(input['devEUI'], input['name'], input['description'], f"/{manufacturer}/{model}")
        device_interface = DeviceInterface(input['devEUI'], config['profile'], config['activationType'], input['appEUI'], input['applicationKey'], config['connectivityPlan'], input['isEnabled'])
        resp = update_device(host, headers, device), update_device_interface(host, headers, device_interface)
        print(resp)

    elif mode == 'delete':
        resp = delete_device(host, headers, input['devEUI'])
        print(resp)
    else:
        raise Exception('Unkonwn mode')

if __name__ == "__main__":
    main()