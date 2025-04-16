import json
import sys
import datetime
import struct

def read_timestamp(time_bytes):
    time_size = 4
    time = 0
    for i in range(0,4):
        time = time + (time_bytes[i] << 8*(time_size-(i+1)))
    return time

def to_date(timestamp):
    try:
        date = datetime.datetime.fromtimestamp(timestamp, datetime.timezone.utc)
    except:
        date = datetime.datetime.utcfromtimestamp(timestamp)
    return date.strftime("%Y-%m-%dT%H:%M:%SZ")

def read_battery(battery_byte):
    return ((battery_byte & 0xf0) >> 4) + 0.1*(battery_byte & 0x0f)

def read_n_r(Param_byte):
    return ((Param_byte & 0xf0) >> 4)*10 + (Param_byte & 0x0f)

def read_BME680_Res(BME680_Res_bytes):
    if len(BME680_Res_bytes) < 4:
        return None

    if all(b == 0xFF for b in BME680_Res_bytes[:4]):
        return None

    try:
        # Inverser les 4 octets pour obtenir le vrai little endian
        BME680_Res_bytes = BME680_Res_bytes[:4][::-1]
        BME680_Res_uint32 = struct.unpack('<I', bytes(BME680_Res_bytes))[0]  # <I pour uint32_t
    except Exception as e:
        raise Exception(f"Erreur décodage uint32_t : {e}")
        return None

    if (BME680_Res_uint32 > 10000000 or BME680_Res_uint32<0) :  # Seuil à ajuster si nécessaire
        return None  # On ignore les valeurs fausses

    return BME680_Res_uint32  




def ENose_Sensor(payload_bytes):
    expected_length = 24
    if len(payload_bytes) < expected_length:
        raise Exception(f"The payload has an unexpected length: {len(payload_bytes)}. expected: {expected_length}.")

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

    if any(val == 4095 or val < 0 for val in [Ammonia, Air_components, Methane, Air_contaminants, Butane_Propane, 
                                               VOC_isobutane, Hydrogen, NO2, CO2, Temperature, Pressure, Humidity, voltage_V]):
        return None

    eNose_json = json.dumps({
        'r': redundancy,
        'timestamp': to_date(timestamp_sec),
        'Ammonia': Ammonia if Ammonia != 4095 and Ammonia >= 0 else None,
        'Air_components': Air_components if Air_components != 4095 and Air_components >= 0 else None,
        'Methane': Methane if Methane != 4095 and Methane >= 0 else None,
        'Air_contaminants': Air_contaminants if Air_contaminants != 4095 and Air_contaminants >= 0 else None,
        'Butane_Propane': Butane_Propane if Butane_Propane != 4095 and Butane_Propane >= 0 else None,
        'VOC_isobutane': VOC_isobutane if VOC_isobutane != 4095 and VOC_isobutane >= 0 else None,
        'Hydrogen': Hydrogen if Hydrogen != 4095 and Hydrogen >= 0 else None,
        'NO2': NO2 if NO2 != 4095 and NO2 >= 0 else None,
        'CO2': CO2 if CO2 != 4095 and CO2 >= 0 else None,
        'Temperature': Temperature if Temperature != 4095 and Temperature >= 0 else None,
        'Pressure': Pressure if Pressure != 4095 and Pressure >= 0 else None,
        'Humidity': Humidity if Humidity != 4095 and Humidity >= 0 else None,
        'voltage': voltage_V if voltage_V != 4095 and voltage_V >= 0 else None
    }, separators=(',', ':'))
    return eNose_json

BME680_Res = {
    0: "ResA",
    1: "ResB",
    2: "ResC",
    3: "ResD",
    4: "ResE",
    5: "ResF",
    6: "ResG",
    7: "ResH",
    8: "ResI",
    9: "ResJ"
}

def ENose_BME680_Res(payload_bytes):
    ngsild_payload = {}
    expected_length = 45
    if len(payload_bytes) < expected_length:
        raise Exception(f"The payload has an unexpected length: {len(payload_bytes)}. expected: {expected_length}.")

    redundancy = read_n_r(payload_bytes[0])
    timestamp_sec = read_timestamp(payload_bytes[1:5])
    timestamp = to_date(timestamp_sec)

    i = 5
    electricalResistance  = []

    for a in range(10): 
        raw_bytes = payload_bytes[i:i+4]
        BME680_Res_value = read_BME680_Res(raw_bytes)  
        if BME680_Res_value is not None:
            BME680_Res_name = BME680_Res.get(a, f"Res{chr(65 + a)}")
            BME680_Res_obj = {
                "type": "Property",
                "value": BME680_Res_value,
                "unitCode": "OHM",
                "observedAt": timestamp,
                "datasetId": f"urn:ngsi-ld:Dataset:{BME680_Res_name}",
            }
            electricalResistance.append(BME680_Res_obj)
        else:
            print(f"Rés {chr(65+a)} ignorée")
        i += 4


    if electricalResistance:
        ngsild_payload["electricalResistance"] = electricalResistance 
    
    return ngsild_payload

def decode_payload(payload_string, port_string):
    payload_bytes = bytes.fromhex(payload_string)
    decoded_data_json = '{}'
    
    if port_string == '1':
        decoded_data_json = ENose_Sensor(payload_bytes)
        if decoded_data_json is None:
            print(f"Warning: No valid data decoded for port 1. Payload: {payload_string}")
            return '{}'
    
    elif port_string == '2':
        decoded = ENose_BME680_Res(payload_bytes)
        
        
        decoded_data_json = json.dumps(decoded, separators=(',', ':'))

    if decoded_data_json == '{}' or decoded_data_json is None:
        print(f"Warning: Invalid or empty data for port {port_string}. Payload: {payload_string}")
        return '{}'
    
    return decoded_data_json


def ngsild_wrapper(input, entity_id):
    ngsild_payload = [{
        'id': entity_id,
        'type': 'Device',
        'ammonia': ngsild_instance(input['Ammonia'], input['timestamp'], 'A99', 'Raw'),
        'airComponents': ngsild_instance(input['Air_components'], input['timestamp'], 'A99', 'Raw'),
        'methane': ngsild_instance(input['Methane'], input['timestamp'], 'A99', 'Raw'),    
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

def main():
    fport = sys.argv[1]
    payload = sys.argv[2]

    if len(sys.argv) > 4:
        entity_id = f"urn:ngsi-ld:Device:{sys.argv[4]}"
    else:
        entity_id = "urn:ngsi-ld:Device:default"

    decoded_json = decode_payload(payload, fport)

    if decoded_json == '{}':
        print(f"Warning: Invalid or empty data for port {fport}. Payload: {payload}", file=sys.stderr)
        # On renvoie un NGSI-LD vide 
        json.dump([{
            "id": entity_id,
            "type": "Device"
        }], sys.stdout, indent=4)
        return

    decoded = json.loads(decoded_json)

    if fport == '1':
        ngsild_payload = ngsild_wrapper(decoded, entity_id)
    elif fport == '2':
        ngsild_payload = [{
            "id": entity_id,
            "type": "Device",
            **decoded
        }]
    else:
        ngsild_payload = [{
            "id": entity_id,
            "type": "Device"
        }]

    json.dump(ngsild_payload, sys.stdout, indent=4)



if __name__ == "__main__":
    main()