import base64
import grpc
import json
import sys
from chirpstack_api import api


def queue_downlink(channel, auth_token, confirmed, data, dev_eui, port):
    client = api.DeviceServiceStub(channel)
    req = api.EnqueueDeviceQueueItemRequest()
    req.queue_item.dev_eui = dev_eui
    req.queue_item.confirmed = confirmed
    req.queue_item.data = data
    req.queue_item.f_port = port
    resp = client.Enqueue(req, metadata=auth_token)
    return resp


def main():
    encoder_ouptut = json.load(sys.stdin)

    dev_eui = encoder_ouptut["dev_eui"]
    data = base64.b64decode(encoder_ouptut["data"])
    confirmed = encoder_ouptut["confirmed"]
    f_port = encoder_ouptut["f_port"]

    server = sys.argv[1]
    api_token = sys.argv[2]

    auth_token = [("authorization", "Bearer %s" % api_token)]

    try:
        with grpc.insecure_channel(server) as channel:
            queue_downlink(
                channel,
                auth_token,
                confirmed,
                data,
                dev_eui,
                f_port,
            )

        json.dump({"success": True, "dev_eui": dev_eui}, sys.stdout)

    except grpc.RpcError as e:
        json.dump(
            {"success": False, "error": e.details(), "error_code": e.code().name},
            sys.stdout,
        )


if __name__ == "__main__":
    main()
