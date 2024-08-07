import json
import sys
import datetime

def read_timestamp(time_bytes):
    time_size = 4
    time = 0
    for i in range(0,4):
        time = time + (time_bytes[i] << 8*(time_size-(i+1)))
    return time

def to_date(timestamp):
    try:
        date = datetime.datetime.fromtimestamp(timestamp, datetime.UTC)
    except:
        date = datetime.datetime.utcfromtimestamp(timestamp)
    return date.strftime("%Y-%m-%dT%H:%M:%SZ")

def read_battery(battery_byte):
    return ((battery_byte & 0xf0) >> 4) + 0.1*(battery_byte & 0x0f)


def read_n_r(Param_byte):
    return ((Param_byte & 0xf0) >> 4)*10 + (Param_byte & 0x0f)


def ENose_Proto(payload_bytes):
    expected_length = 24  #24 bytes are expected
    if len(payload_bytes) < expected_length:
        raise ValueError(f"The payload has an unexpected length: {len(payload_bytes)}. expected: {expected_length}.")

    redundancy = read_n_r(payload_bytes[0])
    timestamp_sec = read_timestamp(payload_bytes[1:5])
    Ammonia = (payload_bytes[5] << 4) + ((payload_bytes[6] & 0xf0) >> 4)
    Air_components = ((payload_bytes[6] & 0x0f) << 8) + payload_bytes[7]
    Methane = (payload_bytes[8] << 4) + ((payload_bytes[9] & 0xf0) >> 4)
    Air_contaminants = ((payload_bytes[9] & 0x0f) << 8) + payload_bytes[10]
    Butane_Propane = (payload_bytes[11] << 4) + ((payload_bytes[12] & 0xf0) >> 4)
    VOC_isobutane = ((payload_bytes[12] & 0x0f) << 8) + payload_bytes[13]
    Hydrogen = (payload_bytes[14] << 4) + ((payload_bytes[15] & 0xf0) >> 4)
    NO2 = ((payload_bytes[15] & 0x0f) << 8) + payload_bytes[16]
    CO2 = (payload_bytes[17] << 4) + ((payload_bytes[18] & 0xf0) >> 4)
    Temperature = ((((payload_bytes[18] & 0x0f) << 8) + payload_bytes[19])/10)-40
    Pressure = ((payload_bytes[20] << 4) + ((payload_bytes[21] & 0xf0) >> 4))/100
    Humidity = (((payload_bytes[21] & 0x0f) << 8) + payload_bytes[22])/10
    voltage_V = round(read_battery(payload_bytes[23]),1)

    eNose_json = json.dumps({'r':redundancy,
                             'timestamp':to_date(timestamp_sec),
                             'Ammonia':Ammonia,
				             'Air_components':Air_components,
				             'Methane':Methane,
				             'Air_contaminants':Air_contaminants,
				             'Butane_Propane':Butane_Propane,
				             'VOC_isobutane':VOC_isobutane,
				             'Hydrogen':Hydrogen,
				             'NO2':NO2,
				             'CO2':CO2,
				             'Temperature':Temperature,
				             'Pressure':Pressure,
				             'Humidity':Humidity,
				             'voltage':voltage_V},
				             separators=(',', ':'))
    return eNose_json

def decode_payload(payload_string, port_string):
    payload_bytes = bytes.fromhex(payload_string)
    decoded_data_json = '{}'
    if port_string == '1':
        decoded_data_json = ENose_Proto(payload_bytes)
  
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

def ngsild_wrapper(input, entity_id):
    ngsild_payload = [{
		'id': entity_id,
		'type': 'Device',
	    'ammonia':ngsild_instance(input['Ammonia'], input['timestamp'], 'A99', 'Raw'),
	    'airComponents':ngsild_instance(input['Air_components'], input['timestamp'], 'A99', 'Raw'),
	    'methane':ngsild_instance(input['Methane'], input['timestamp'], 'A99', 'Raw'),    
	    'airContaminants': ngsild_instance(input['Air_contaminants'], input['timestamp'], 'A99', 'Raw'),
	    'butanePropane': ngsild_instance(input['Butane_Propane'], input['timestamp'], 'A99', 'Raw'),
	    'vocIsobutane': ngsild_instance(input['VOC_isobutane'], input['timestamp'], 'A99', 'Raw'),
	    'hydrogen': ngsild_instance(input['Hydrogen'], input['timestamp'], 'A99', 'Raw'),
	    'no2': ngsild_instance(input['NO2'], input['timestamp'], 'A99', 'Raw'),
	    'co2': ngsild_instance(input['CO2'], input['timestamp'], 'A99', 'Raw'),
	    'temperature': ngsild_instance(input['Temperature'], input['timestamp'], 'CEL', 'Raw'),
	    'pressure': ngsild_instance(input['Pressure'], input['timestamp'], 'BAR', 'Raw'),
	    'humidity': ngsild_instance(input['Humidity'], input['timestamp'], 'P1', 'Raw'),
	    'batteryVoltage': ngsild_instance(input['voltage'], input['timestamp'], 'VLT', 'Raw')
    }]
    return ngsild_payload

def main():
    fport = sys.argv[1]
    payload = sys.argv[2]
    entity_id = f"urn:ngsi-ld:Device:{sys.argv[4]}"
    decoded = json.loads(decode_payload(payload, fport))
    if 'timestamp' not in decoded:
        if len(payload) >= 8:  # 8 hex characters is 4 bytes
            decoded['timestamp'] = to_date(read_timestamp(bytes.fromhex(payload[2:10])))
        else:
            # If the payload length is insufficient, handle the error or set a default value
            print("Error: Payload too short to extract the timestamp.")
            return

    ngsild_payload = ngsild_wrapper(decoded, entity_id)
    json.dump(ngsild_payload, sys.stdout, indent=4)

if __name__ == "__main__":
    main()
