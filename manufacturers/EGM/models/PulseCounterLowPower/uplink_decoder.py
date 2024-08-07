import json
import sys
import datetime

def read_timestamp(time_bytes):
    time_size = 4
    time = 0
    for i in range(0,4):
        time = time + (time_bytes[i] << 8*(time_size-(i+1)))
        i = i + 1
    return time

def to_date(timestamp):
    try:
        date = datetime.datetime.fromtimestamp(timestamp, datetime.UTC)
    except:
        date = datetime.datetime.utcfromtimestamp(timestamp)
    return date.strftime("%Y-%m-%dT%H:%M:%SZ")

def read_version(version_byte):
    version_string = ''
    version_string = str((version_byte & 0xf0) >> 4)
    version_string = version_string + '.'
    version_string = version_string + str(version_byte & 0x0f)
    return version_string

def read_battery(battery_byte):
    return ((battery_byte & 0xf0) >> 4) + 0.1*(battery_byte & 0x0f)

def insert_data(string, string_key, string_data):
    key = '\"' + string_key + '\"'
    index = string.find(key) + len(key)
    while (string[index] == ':' or
           string[index] == '['):
        index = index + 1
    if (string[index] == '}' or
        string[index] == ']'):
        return string[:index] + string_data + string[index:]
    return string[:index] + string_data + ',' + string[index:]

def decode_PC_config(payload_bytes):
    timestamp_sec = read_timestamp(payload_bytes[:4])
    soft_version = read_version(payload_bytes[4])
    appli_id = payload_bytes[5]
    pulseCounter_id = (payload_bytes[6] << 8) | payload_bytes[7]
    voltage_V = round(read_battery(payload_bytes[8]),1)
    return json.dumps({'timestamp':to_date(timestamp_sec),
                       'soft_version':soft_version,
                       'appli_id':appli_id,
                       'pulseCounter_id':pulseCounter_id,
                       'voltage':voltage_V},
                       separators=(',', ':')) 

def decode_pulse_counter(payload_bytes):
    redundancy = payload_bytes[0]
    measure_duration_sec = payload_bytes[1]*60
    pulse_counter_number = payload_bytes[2]
    current_timestamp_sec = read_timestamp(payload_bytes[3:7])
    pulse_counter_json = json.dumps({'pulse_counter':{'r':redundancy,
                                                      'pulse_counter_number':pulse_counter_number,
                                                      'data':[]}}, 
                                                      separators=(',', ':'))
    i = 7
    j = 0
    data = ''
    while i<len(payload_bytes):
        data_timestamp_sec = current_timestamp_sec + j*measure_duration_sec
        pulses = (payload_bytes[i] << 4) + ((payload_bytes[i+1] & 0xf0) >> 4)
        data = json.dumps({'timestamp':to_date(data_timestamp_sec),
                           'pulses':pulses})
        pulse_counter_json = insert_data(pulse_counter_json, 'data', data)
        i = i + 1
        j = j + 1
        data_timestamp_sec = current_timestamp_sec + j*measure_duration_sec
        pulses = ((payload_bytes[i] & 0x0f) << 8) + payload_bytes[i+1]
        data = json.dumps({'timestamp':to_date(data_timestamp_sec),
                           'pulses':pulses})
        pulse_counter_json = insert_data(pulse_counter_json, 'data', data)
        i = i + 2
        j = j + 1
    return pulse_counter_json

def decode_payload(payload_string, port_string):
    payload_bytes = bytes.fromhex(payload_string)
    decoded_data_json = '{}'
    if port_string == '2':
        decoded_data_json = decode_PC_config(payload_bytes)
    elif port_string == '90':
        decoded_data_json = decode_pulse_counter(payload_bytes)
    return decoded_data_json

def ngsild_instance(value, time, unitCode, dataset_suffix):
    ngsild_instance = {
        "type": "Property",
        "value": value,
        "observedAt": time
    }
    if unitCode is not None:
        ngsild_instance['unitCode'] = unitCode
    if dataset_suffix is not None:
        ngsild_instance['datasetId'] = f"urn:ngsi-ld:Dataset:{dataset_suffix}"
    return ngsild_instance 

def ngsild_wrapper(input, time, entity_id):
    ngsild_payload = [{
        "id": entity_id,
        "type": "Device"
    }]

    def add_to_payload(key, value):
        if all(key in d for d in ngsild_payload):
            ngsild_payload.append({"id": entity_id, "type": "Device", key: value})
        else:
            for d in ngsild_payload:
                if key not in d:
                    d[key] = value
                    break

    # Device infos
    if 'soft_version' in input:
        add_to_payload('softwareVersion', ngsild_instance(input['soft_version'], input['timestamp'], None, None))
    if 'appli_id' in input:
        add_to_payload('applicationId', ngsild_instance(input['appli_id'], input['timestamp'], None, None))
    if 'pulseCounter_id' in input:
        add_to_payload('pulseCounterId', ngsild_instance(input['pulseCounter_id'], input['timestamp'], None, None))
    if 'voltage' in input:
        add_to_payload('batteryVoltage', ngsild_instance(input['voltage'], input['timestamp'], 'VLT', None))

    # Pulse counter
    if 'pulse_counter' in input:
        for item in input['pulse_counter']['data']:
            add_to_payload('pulses', ngsild_instance(item['pulses'], item['timestamp'], None, 'Raw'))

    return ngsild_payload

def main():
    fport = sys.argv[1]
    payload = sys.argv[2]
    time = sys.argv[3]
    entity_id = f"urn:ngsi-ld:Device:{sys.argv[4]}"
    decoded = json.loads(decode_payload(payload, fport))
    ngsild_payload = ngsild_wrapper(decoded, time, entity_id)
    json.dump(ngsild_payload, sys.stdout, indent=4)

if __name__ == "__main__":
    main()
