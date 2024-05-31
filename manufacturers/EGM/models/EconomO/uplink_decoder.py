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

def read_temp_hum(data_bytes):
    data = 100*((data_bytes[0] & 0xf0) >> 4)
    data = data + 10*(data_bytes[0] & 0x0f)
    data = data + ((data_bytes[1] & 0xf0) >> 4)
    data = data + 0.1*(data_bytes[1] & 0x0f)
    return data

def read_battery(battery_byte):
    return ((battery_byte & 0xf0) >> 4) + 0.1*(battery_byte & 0x0f)

def read_charger_status(charger_byte):
    if (charger_byte == 0x00) or (charger_byte == 0x11):
        return "Not charging or NTC fault"
    elif charger_byte == 0x01:
        return "Normal charging"
    elif charger_byte == 0x10:
        return "Charged or Bad battery fault"
    return ""

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

def decode_eds_config(payload_bytes):
    timestamp_sec = read_timestamp(payload_bytes[:4])
    soft_version = read_version(payload_bytes[4])
    appli_id = payload_bytes[5]
    eds_id = (payload_bytes[6] << 8) | payload_bytes[7]
    temp_C = round(read_temp_hum(payload_bytes[8:10]) - 40,1)
    hum_perc = round(read_temp_hum(payload_bytes[10:12]),1)
    voltage_V = round(read_battery(payload_bytes[12]),1)
    charger_status = read_charger_status(payload_bytes[13])
    return json.dumps({'timestamp':to_date(timestamp_sec),
                       'soft_version':soft_version,
                       'appli_id':appli_id,
                       'eds_id':eds_id,
                       'temperature':temp_C,
                       'humiditiy':hum_perc,
                       'voltage':voltage_V,
                       'charger_status':charger_status},
                       separators=(',', ':'))

def decode_eds_internal_data(payload_bytes):
    timestamp_sec = read_timestamp(payload_bytes[:4])
    temp_C = round(read_temp_hum(payload_bytes[4:6]) - 40,1)
    hum_perc = round(read_temp_hum(payload_bytes[6:8]),1)
    voltage_V = round(read_battery(payload_bytes[8]),1)
    charger_status = read_charger_status(payload_bytes[9])
    return json.dumps({'timestamp':to_date(timestamp_sec),
                       'temperature':temp_C,
                       'humiditiy':hum_perc,
                       'voltage':voltage_V,
                       'charger_status':charger_status},
                       separators=(',', ':'))

def decode_main_valve(payload_bytes):
    window_size = (payload_bytes[0] & 0xf0) >> 4
    redundancy = payload_bytes[0] & 0x0f
    main_valve_json = json.dumps({'main_valve':{'n':window_size,
                                                'r':redundancy,
                                                'duration':[],
                                                'status':[]}}, 
                                                separators=(',', ':'))
    i = 1
    duration = ''
    status = ''
    while i < len(payload_bytes):
        timestamp_sec = read_timestamp(payload_bytes[i:i+4])
        i = i + 4
        opening_time_min = (payload_bytes[i] << 8) + payload_bytes[i+1]
        i = i + 2
        duration = json.dumps({'timestamp':to_date(timestamp_sec),
                               'opening_time':opening_time_min})
        main_valve_json = insert_data(main_valve_json, 'duration', duration)
        for j in range (0,opening_time_min):
            status = json.dumps({'timestamp':to_date(timestamp_sec),
                                 'state':1})
            main_valve_json = insert_data(main_valve_json, 'status', status)
            timestamp_sec = timestamp_sec + 60
        status = json.dumps({'timestamp':to_date(timestamp_sec),
                             'state':0})
        main_valve_json = insert_data(main_valve_json, 'status', status)
    return main_valve_json

def decode_valve(payload_bytes):
    window_size = (payload_bytes[0] & 0xf0) >> 4
    redundancy = payload_bytes[0] & 0x0f
    valves_json = json.dumps({'valves':{'n':window_size,
                                        'r':redundancy,
                                        'duration':[],
                                        'status':[]}}, 
                                        separators=(',', ':'))
    i = 1
    duration = ''
    status = ''
    while i < len(payload_bytes):
        timestamp_sec = read_timestamp(payload_bytes[i:i+4])
        i = i + 4
        valve_index = payload_bytes[i]
        opening_time_min = payload_bytes[i+1]
        i = i + 2
        duration = json.dumps({'timestamp':to_date(timestamp_sec),
                               'valve_index':valve_index,
                               'opening_time':opening_time_min}) 
        valves_json = insert_data(valves_json, 'duration', duration)
        for j in range(0,opening_time_min):
            status = json.dumps({'timestamp':to_date(timestamp_sec),
                                 'valve_index':valve_index,
                                 'state':1}) 
            timestamp_sec = timestamp_sec + 60
            valves_json = insert_data(valves_json, 'status', status)
        status = json.dumps({'timestamp':to_date(timestamp_sec),
                                 'valve_index':valve_index,
                                 'state':0}) 
        valves_json = insert_data(valves_json, 'status', status)
    return valves_json
    
def decode_relay(payload_bytes):
    window_size = (payload_bytes[0] & 0xf0) >> 4
    redundancy = payload_bytes[0] & 0x0f
    relay_json = json.dumps({'relay':{'n':window_size,
                                      'r':redundancy,
                                      'duration':[],
                                      'status':[]}}, 
                                      separators=(',', ':'))
    i = 1
    duration = ''
    status = ''
    while i < len(payload_bytes):
        timestamp_sec = read_timestamp(payload_bytes[i:i+4])
        i = i + 4
        closing_time_min = payload_bytes[i]
        i = i + 1
        duration = json.dumps({'timestamp':to_date(timestamp_sec),
                               'closing_time':closing_time_min})
        relay_json = insert_data(relay_json, 'duration', duration)
        for j in range(0,closing_time_min):
            status = json.dumps({'timestamp':to_date(timestamp_sec),
                                 'state':1})
            relay_json = insert_data(relay_json, 'status', status)
            timestamp_sec = timestamp_sec + 60
        status = json.dumps({'timestamp':to_date(timestamp_sec),
                             'state':0})
        relay_json = insert_data(relay_json, 'status', status)
    return relay_json

def decode_button(payload_bytes):
    window_size = (payload_bytes[0] & 0xf0) >> 4
    redundancy = payload_bytes[0] & 0x0f
    button_json = json.dumps({'button':{'n':window_size,
                                        'r':redundancy,
                                        'data':[]}}, 
                                        separators=(',', ':'))
    i = 1
    data = ''
    while i < len(payload_bytes):
        timestamp_sec = read_timestamp(payload_bytes[i:i+4])
        i = i + 4
        data = json.dumps({'timestamp': to_date(timestamp_sec)})
        button_json = insert_data(button_json, 'data', data)
    return button_json

def decode_watering_program(payload_bytes):
        timestamp_sec = read_timestamp(payload_bytes[0:4])
        extension_numb = payload_bytes[4]
        valve_num = 0
        if extension_numb > 1:
            valve_num = 16
        program_json = json.dumps({'watering_prog':{'timestamp':to_date(timestamp_sec),
                                                    'prog':[]}}, 
                                                    separators=(',', ':'))
        i = 5
        while i<len(payload_bytes):
            valve_index = valve_num + 1
            opening_time_min = payload_bytes[i]
            data = json.dumps({'valve_index':valve_index,
                               'opening_time':opening_time_min})
            program_json = insert_data(program_json, 'prog', data)
            i = i + 1
            valve_num = valve_num + 1
        return program_json
        

def decode_pulse_counter(payload_bytes):
    window_size = (payload_bytes[0] & 0xf0) >> 4
    redundancy = payload_bytes[0] & 0x0f
    measure_duration_sec = payload_bytes[1]*60
    current_timestamp_sec = read_timestamp(payload_bytes[2:6])
    pulse_counter_json = json.dumps({'pulse_counter':{'n':window_size,
                                                      'r':redundancy,
                                                      'data':[]}}, 
                                                      separators=(',', ':'))
    i = 6
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
        decoded_data_json = decode_eds_config(payload_bytes)
    elif port_string == '3':
        decoded_data_json = decode_eds_internal_data(payload_bytes)
    elif port_string == '80':
        decoded_data_json = decode_main_valve(payload_bytes)
    elif port_string == '81':
        decoded_data_json = decode_valve(payload_bytes)
    elif port_string == '82':
        decoded_data_json = decode_relay(payload_bytes)
    elif port_string == '83':
        decoded_data_json = decode_button(payload_bytes)
    elif port_string == '84':
        decoded_data_json = decode_watering_program(payload_bytes)
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

def ngsild_wrapper(input, time):
    ngsild_payload = {}

    # Device infos and internal measurements
    if 'soft_version' in input:
        ngsild_payload['softwareVersion'] = ngsild_instance(input['soft_version'], input['timestamp'], None, None)
    if 'appli_id' in input:
        ngsild_payload['applicationId'] = ngsild_instance(input['appli_id'], input['timestamp'], None, None)
    if 'eds_id' in input:
        ngsild_payload['edgespotId'] = ngsild_instance(input['eds_id'], input['timestamp'], None, None)
    if 'temperature' in input:
        ngsild_payload['internalTemperature'] = ngsild_instance(input['temperature'], input['timestamp'], 'CEL', None)
    if 'humiditiy' in input:
        ngsild_payload['internalHumidity'] = ngsild_instance(input['humiditiy'], input['timestamp'], 'P1', None)
    if 'voltage' in input:
        ngsild_payload['batteryVoltage'] = ngsild_instance(input['voltage'], input['timestamp'], 'VLT', None)
    if 'charger_status' in input:
        ngsild_payload['chargerStatus'] = ngsild_instance(input['charger_status'], input['timestamp'], 'VLT', None)

    # Main valve status and duration
    if 'main_valve' in input:
        if 'duration' in input['main_valve']:
            ngsild_payload['actualOpeningDurationMainValve'] = []
            for item in input['main_valve']['duration']:
                ngsild_payload['actualOpeningDurationMainValve'].append(ngsild_instance(item['opening_time'], item['timestamp'], 'MIN', 'Raw'))
        if 'status' in input['main_valve']:
            ngsild_payload['statusMainValve'] = []
            for item in input['main_valve']['status']:
                ngsild_payload['statusMainValve'].append(ngsild_instance(item['state'], item['timestamp'], None, 'Raw'))

    # Secondary valves status and duration
    if 'valves' in input:
        if 'duration' in input['valves']:
            for item in input['valves']['duration']:
                ngsild_payload.setdefault(f"actualOpeningDurationValve{item['valve_index']}", []).append(ngsild_instance(item['opening_time'], item['timestamp'], 'MIN', 'Raw'))
        if 'status' in input['valves']:
            for item in input['valves']['status']:
                ngsild_payload.setdefault(f"statusValve{item['valve_index']}", []).append(ngsild_instance(item['state'], item['timestamp'], None, 'Raw'))

    # Watering program
    if 'watering_porgram' in input:
        prog_timestamp = input['watering_porgram']['timestamp']
        for item in input['watering_porgram']['prog']:
            ngsild_payload.setdefault(f"programmedOpeningDurationValve{item['valve_index']}", []).append(ngsild_instance(item['opening_time'], prog_timestamp, 'MIN', 'Raw'))

    # Relay closing
    if 'relay' in input:
        if 'duration' in input['relay']:
            ngsild_payload['relayClosingDuration'] = []
            for item in input['relay']['duration']:
                ngsild_payload['relayClosingDuration'].append(ngsild_instance(item['opening_time'], item['timestamp'], 'MIN', 'Raw'))
        if 'status' in input['relay']:
            ngsild_payload['relayStatus'] = []
            for item in input['relay']['status']:
                ngsild_payload['relayStatus'].append(ngsild_instance(item['state'], item['timestamp'], None, 'Raw'))

    # Button push
    if 'button' in input:
        ngsild_payload['buttonActivation'] = []
        for item in input['button']['data']:
            ngsild_payload['buttonActivation'].append(ngsild_instance(1, item['timestamp'], None, 'Raw'))
    
    # Pulse counter
    if 'pulse_counter' in input:
        ngsild_payload['pulses'] = []
        for item in input['pulse_counter']['data']:
            ngsild_payload['pulses'].append(ngsild_instance(item['pulses'], item['timestamp'], None, 'Raw'))
    
    return ngsild_payload

def main():
    fport = sys.argv[1]
    payload = sys.argv[2]
    time = sys.argv[3]
    decoded = json.loads(decode_payload(payload, fport))
    ngsild_payload = ngsild_wrapper(decoded, time)
    json.dump(ngsild_payload, sys.stdout, indent=4)

if __name__ == "__main__":
    main()
