import grpc
import json
import sys
from chirpstack_api import api


def queue_downlink(channel, auth_token, fport, data, dev_eui):
    client = api.DeviceServiceStub(channel)
    req = api.EnqueueDeviceQueueItemRequest()
    req.queue_item.dev_eui = dev_eui
    req.queue_item.confirmed = True
    req.queue_item.data = data
    req.queue_item.f_port = fport
    resp = client.Enqueue(req, metadata=auth_token)
    return resp


def main():
    payload = json.load(sys.stdin)
    dev_eui = payload["devEUI"]
    fport = sys.argv[1]
    command = sys.argv[2]

    network_config = payload["network"]["configuration"]["json"]
    server = network_config["server"]
    api_token = network_config["apiToken"]

    channel = grpc.insecure_channel(server)
    auth_token = [("authorization", "Bearer %s" % api_token)]

    response = queue_downlink(channel, auth_token, fport, command, dev_eui)

    json.dump(response, sys.stdout, indent=4)


if __name__ == "__main__":
    main()
