function Decode(fPort, bytes, variables) {
    // Functions
    function parseCoordinate(raw_value, coordinate) {
        var raw_itude = raw_value;
        var temp = "";
        var itude_string = ((raw_itude >> 28) & 0xF).toString();
        raw_itude <<= 4;
        itude_string += ((raw_itude >> 28) & 0xF).toString();
        raw_itude <<= 4;
        coordinate.degrees += itude_string;
        itude_string += "Â°";
        temp = ((raw_itude >> 28) & 0xF).toString();
        raw_itude <<= 4;
        temp += ((raw_itude >> 28) & 0xF).toString();
        raw_itude <<= 4;
        itude_string += temp;
        itude_string += ".";
        coordinate.minutes += temp;
        temp = ((raw_itude >> 28) & 0xF).toString();
        raw_itude <<= 4;
        temp += ((raw_itude >> 28) & 0xF).toString();
        raw_itude <<= 4;
        itude_string += temp;
        coordinate.minutes += ".";
        coordinate.minutes += temp;
        return itude_string;
    }

    function parseLatitude(raw_latitude, coordinate) {
        var latitude = parseCoordinate(raw_latitude, coordinate);
        latitude += ((raw_latitude & 0xF0) >> 4).toString();
        coordinate.minutes += ((raw_latitude & 0xF0) >> 4).toString();
        return latitude;
    }

    function parseLongitude(raw_longitude, coordinate) {
        var longitude = (((raw_longitude >> 28) & 0xF)).toString();
        coordinate.degrees = longitude;
        longitude += parseCoordinate(raw_longitude << 4, coordinate);
        return longitude;
    }

    function addField(field_no, payload) {
        switch (field_no) {
            case 0:
                payload.temperature = bytes[bytes_pos_] & 0x7F;
                if ((bytes[bytes_pos_] & 0x80) > 0) {
                    payload.temperature -= 128;
                }
                bytes_pos_++;
                break;
            case 1:
                payload.trigger = "accelerometer";
                break;
            case 2:
                payload.trigger = "pushbutton";
                break;
            case 3:
                var coordinate = {};
                coordinate.degrees = "";
                coordinate.minutes = "";
                var raw_value = (bytes[bytes_pos_++] << 24) | (bytes[bytes_pos_++] << 16) | (bytes[bytes_pos_++] << 8) | bytes[bytes_pos_++];
                payload.lati_hemisphere = (raw_value & 1) == 1 ? "South" : "North";
                payload.latitude_dmm = payload.lati_hemisphere.charAt(0) + " ";
                payload.latitude_dmm += parseLatitude(raw_value, coordinate);
                payload.latitude = (parseFloat(coordinate.degrees) + parseFloat(coordinate.minutes) / 60) * ((raw_value & 1) == 1 ? -1.0 : 1.0);
                coordinate.degrees = "";
                coordinate.minutes = "";
                raw_value = (bytes[bytes_pos_++] << 24) | (bytes[bytes_pos_++] << 16) | (bytes[bytes_pos_++] << 8) | bytes[bytes_pos_++];
                payload.long_hemisphere = (raw_value & 1) == 1 ? "West" : "East";
                payload.longitude_dmm = payload.long_hemisphere.charAt(0) + " ";
                payload.longitude_dmm += parseLongitude(raw_value, coordinate);
                payload.longitude = (parseFloat(coordinate.degrees) + parseFloat(coordinate.minutes) / 60) * ((raw_value & 1) == 1 ? -1.0 : 1.0);
                raw_value = bytes[bytes_pos_++];
                switch ((raw_value & 0xF0) >> 4) {
                    case 1:
                        payload.gps_quality = "Good";
                        break;
                    case 2:
                        payload.gps_quality = "Average";
                        break;
                    case 3:
                        payload.gps_quality = "Poor";
                        break;
                    default:
                        payload.gps_quality = (raw_value >> 4) & 0xF;
                        break;
                }
                payload.hdop = (raw_value >> 4) & 0xF;
                payload.sats = raw_value & 0xF;
                break;
            case 4:
                payload.ul_counter = bytes[bytes_pos_++];
                break;
            case 5:
                payload.dl_counter = bytes[bytes_pos_++];
                break;
            case 6:
                payload.battery_level = (bytes[bytes_pos_] << 8) | bytes[bytes_pos_ + 1];
                bytes_pos_ += 2;
                break;
            case 7:
                payload.rssi_dl = bytes[bytes_pos_++];
                payload.rssi_dl *= -1;
                payload.snr_dl = bytes[bytes_pos_] & 0x7F;
                if ((bytes[bytes_pos_] & 0x80) > 0) {
                    payload.snr_dl -= 128;
                }
                bytes_pos_++;
                break;
            default:
                break;
        }
    }

    // Declaration & initialization
    var status_ = bytes[0];
    var bytes_len_ = bytes.length;
    var bytes_pos_ = 1;
    var i = 0;
    var payload = {};
    var temp_hex_str = "";
    payload.payload = "";
    for (var j = 0; j < bytes_len_; j++) {
        temp_hex_str = bytes[j].toString(16).toUpperCase();
        if (temp_hex_str.length == 1) {
            temp_hex_str = "0" + temp_hex_str;
        }
        payload.payload += temp_hex_str;
    }

    // Get payload values
    do {
        if ((status_ & 0x80) > 0) {
            addField(i, payload);
        }
        i++;
    } while (((status_ <<= 1) & 0xFF) > 0);

    return payload;
}

let parametersMapping =  {
    temperature: {label:"temperature", unitCode: "CEL", datasetId: 'Raw'},
    trigger: {label:"trigger", unitCode: null, datasetId: null},
    latitude: {label:"latitude", unitCode: "DEG", datasetId: 'Raw'},
    longitude: {label:"longitude", unitCode: "DEG", datasetId: 'Raw'},
    gps_quality: {label:"gpsQuality", unitCode: null, datasetId: null},
    hdop: {label:"hdop", unitCode: null, datasetId: 'Raw'},
    sats: {label:"satellites", unitCode: null, datasetId: 'Raw'},
    ul_counter: {label:"uplinkCounter", unitCode: null, datasetId: 'Raw'},
    dl_counter: {label:"downlinkCounter", unitCode: null, datasetId: 'Raw'},
    battery_level: {label:"batteryLevel", unitCode: "VLT", datasetId: 'Raw'},
    rssi_dl: {label:"rssiDownlink", unitCode: "DBM", datasetId: 'Raw'},
    snr_dl: {label:"snrDownlink", unitCode: "2N", datasetId: 'Raw'}
  };

  function ngsildInstance(value, time = null, unitCode = null, datasetSuffix = null) {
    const ngsildInstance = {
        type: "Property",
        value: value,
    };
    if (time) {
        ngsildInstance.observedAt = time;
    }
    if (unitCode) {
        ngsildInstance.unitCode = unitCode;
    }
    if (datasetSuffix) {
        ngsildInstance.datasetId = `urn:ngsi-ld:Dataset:${datasetSuffix}`;
    }
    return ngsildInstance;
  }

  function ngsildWrapper(decoded, time, entity_id) {
    var ngsild_payload = [{
      id: entity_id,
      type: "Device"
    }];
  
    function addToPayload(key, value) {
        if (ngsild_payload.every(d => d.hasOwnProperty(key))) {
            ngsild_payload.push({id: entity_id, type: "Device", ...{[key]: value}});
        } else {
            for (let d of ngsild_payload) {
                if (!d.hasOwnProperty(key)) {
                    d[key] = value;
                    break;
                }
            }
        }
    }
  
    for (var key in decoded) {
      if (parametersMapping[key]) {
        addToPayload(parametersMapping[key].label, ngsildInstance(decoded[key], time, parametersMapping[key].unitCode, parametersMapping[key].datasetId));
      }
    }
    return ngsild_payload;
  }  

  function main() {
    var fPort = process.argv[2];
    var payload = Buffer.from(process.argv[3], 'hex');
    var time = process.argv[4];
    var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    //payload = "9f1543376630007031101537300feb2b07" // complete message
    //payload = "9e15433766300070311025332c0fed" // message without RSSI and SNR
    //payload = "8f1606060f6f2807" // message without GPS position
    //payload = "df164337653000703130343d350f703f07" // message with accelerometer trigger (shake the device)
    //payload = "bf164337667000703130343f370f613808" // message with pushbutton trigger (press button)
    //payload = "cf1605050f7e3107" // message with accelerometer trigger (shake the device) without GPS position
    //payload = "af1608080f6e3107" // message with pushbutton trigger (press button) without GPS position
    var decoded = Decode(fPort, payload);
    var ngsild_payload = ngsildWrapper(decoded, time, entity_id);
    process.stdout.write(JSON.stringify(ngsild_payload, null, 2));
}

if (require.main === module) {
    main();
}