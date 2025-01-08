/**
 * Payload Decoder
 *
 * Copyright 2024 Milesight IoT
 *
 * @product EM400-MUD
 */
function readUInt8(bytes) {
    return bytes & 0xff;
}

function readInt8(bytes) {
    var ref = readUInt8(bytes);
    return ref > 0x7f ? ref - 0x100 : ref;
}

function readUInt16LE(bytes) {
    var value = (bytes[1] << 8) + bytes[0];
    return value & 0xffff;
}

function readInt16LE(bytes) {
    var ref = readUInt16LE(bytes);
    return ref > 0x7fff ? ref - 0x10000 : ref;
}

function readUInt32LE(bytes) {
    var value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
    return (value & 0xffffffff) >>> 0;
}

function readInt32LE(bytes) {
    var ref = readUInt32LE(bytes);
    return ref > 0x7fffffff ? ref - 0x100000000 : ref;
}

function readProtocolVersion(bytes) {
    var major = (bytes & 0xf0) >> 4;
    var minor = bytes & 0x0f;
    return "v" + major + "." + minor;
}

function readHardwareVersion(bytes) {
    var major = bytes[0] & 0xff;
    var minor = (bytes[1] & 0xff) >> 4;
    return "v" + major + "." + minor;
}

function readFirmwareVersion(bytes) {
    var major = bytes[0] & 0xff;
    var minor = bytes[1] & 0xff;
    return "v" + major + "." + minor;
}

function readTslVersion(bytes) {
    var major = bytes[0] & 0xff;
    var minor = bytes[1] & 0xff;
    return "v" + major + "." + minor;
}

function readSerialNumber(bytes) {
    var temp = [];
    for (var idx = 0; idx < bytes.length; idx++) {
        temp.push(("0" + (bytes[idx] & 0xff).toString(16)).slice(-2));
    }
    return temp.join("");
}

function readLoRaWANClass(type) {
    switch (type) {
        case 0:
            return "ClassA";
        case 1:
            return "ClassB";
        case 2:
            return "ClassC";
        case 3:
            return "ClassCtoB";
    }
}

function decode(bytes) {
    var decoded = {};

    for (var i = 0; i < bytes.length; ) {
        var channel_id = bytes[i++];
        var channel_type = bytes[i++];
        // DEVICE STATUS
        if (channel_id === 0xff && channel_type === 0x0b) {
            decoded.device_status = bytes[i];
            i += 1;
        }
        // PROTOCOL VERSION
        else if (channel_id === 0xff && channel_type === 0x01) {
            decoded.protocol_version = readProtocolVersion(bytes[i]);
            i += 1;
        }
        // SERIAL NUMBER
        else if (channel_id === 0xff && channel_type === 0x16) {
            decoded.sn = readSerialNumber(bytes.slice(i, i + 8));
            i += 8;
        }
        // HARDWARE VERSION
        else if (channel_id === 0xff && channel_type === 0x09) {
            decoded.hardware_version = readHardwareVersion(bytes.slice(i, i + 2));
            i += 2;
        }
        // FIRMWARE VERSION
        else if (channel_id === 0xff && channel_type === 0x0a) {
            decoded.firmware_version = readFirmwareVersion(bytes.slice(i, i + 2));
            i += 2;
        }
        // LORAWAN CLASS TYPE
        else if (channel_id === 0xff && channel_type === 0x0f) {
            decoded.lorawan_class = readLoRaWANClass(bytes[i]);
            i += 1;
        }
        // TSL VERSION
        else if (channel_id === 0xff && channel_type === 0xff) {
            decoded.tsl_version = readTslVersion(bytes.slice(i, i + 2));
            i += 2;
        }
        // DEVICE RESET EVENT
        else if (channel_id === 0xff && channel_type === 0xfe) {
            decoded.reset_event = 1;
            i += 1;
        }
        // BATTERY
        else if (channel_id === 0x01 && channel_type === 0x75) {
            decoded.battery = bytes[i];
            i += 1;
        }
        // TEMPERATURE
        else if (channel_id === 0x03 && channel_type === 0x67) {
            decoded.temperature = readInt16LE(bytes.slice(i, i + 2)) / 10;
            i += 2;
        }
        // DISTANCE
        else if (channel_id === 0x04 && channel_type === 0x82) {
            decoded.distance = readUInt16LE(bytes.slice(i, i + 2));
            i += 2;
        }
        // RADAR SIGNAL STRENGHT
        else if (channel_id === 0x06 && channel_type === 0xC7) {
            decoded.radar_signal_strength = readUInt16LE(bytes.slice(i, i + 2))*0.01;
            i += 2;
        }
        // POSITION
        else if (channel_id === 0x05 && channel_type === 0x00) {
            decoded.position = bytes[i] === 0 ? "Normal" : "Tilt";
            i += 1;
        }
        // TEMPERATURE WITH ABNORMAL
        else if (channel_id === 0x83 && channel_type === 0x67) {
            decoded.temperature = readInt16LE(bytes.slice(i, i + 2)) / 10;
            decoded.temperature_abnormal = bytes[i + 2] == 0 ? false : true;
            i += 3;
        }
        // DISTANCE WITH ALARMING
        else if (channel_id === 0x84 && channel_type === 0x82) {
            decoded.distance = readUInt16LE(bytes.slice(i, i + 2));
            decoded.distance_threshold = bytes[i + 2] == 0 ? false : true;
            i += 3;
        }
        // BLIND ZONE
        else if (channel_id === 0xb4 && channel_type === 0x82) {
            decoded.distance = readUInt16LE(bytes.slice(i, i + 2));
            decoded.distance_blind = bytes[i + 2] == 0 ? false : true;
            i += 3;
        }
        else {
            break;
        }
    }
    return decoded;
}

function ngsildInstance(value, time, unit, dataset_suffix) {
    var ngsild_instance = {
        type: 'Property',
        value: value,
        observedAt: time
    }
    if (unit !== null) {
        ngsild_instance.unitCode = unit
    }
    if (dataset_suffix !== null) {
        ngsild_instance.datasetId = 'urn:ngsi-ld:Dataset:' + dataset_suffix
    }
    return ngsild_instance
}

function ngsildWrapper(input, time, entity_id) {
    var ngsild_payload = [{
        id: entity_id,
        type: "Device",
    }];

    function addToPayload(key, value, isArray = false) {
        for (let d of ngsild_payload) {
            if (isArray) {
                if (!d.hasOwnProperty(key)) {
                    d[key] = [];
                }
                d[key].push(value);
            } else {
                if (!d.hasOwnProperty(key)) {
                    d[key] = value;
                }
            }
        }
    }

    input.forEach(item => {
        if (item.variable === 'device_status') {
            addToPayload('deviceStatus', ngsildInstance(item.value, time, null, null));
        }
        if (item.variable === 'ipso_version') {
            addToPayload('ipsoVersion', ngsildInstance(item.value, time, null, null));
        }
        if (item.variable === 'sn') {
            addToPayload('sn', ngsildInstance(item.value, time, null, null));
        }
        if (item.variable === 'hardware_version') {
            addToPayload('hardwareVersion', ngsildInstance(item.value, time, null, null));
        }
        if (item.variable === 'firmware_version') {
            addToPayload('firmwareVersion', ngsildInstance(item.value, time, null, null));
        }
        if (item.variable === 'lorawan_class') {
            addToPayload('lorawanClass', ngsildInstance(item.value, time, null, null));
        }
        if (item.variable === 'tsl_version') {
            addToPayload('tslVersion', ngsildInstance(item.value, time, null, null));
        }
        if (item.variable === 'battery') {
            addToPayload('battery', ngsildInstance(item.value, time, 'P1', 'Raw'));
        }
        if (item.variable === 'position') {
            addToPayload('position', ngsildInstance(item.value, time, null, null));
        }
        if (item.variable === 'radar_signal_rssi') {
            addToPayload('radarSignalRssi', ngsildInstance(item.value, time, null, null));
        }
        if (item.variable === 'distance') {
            addToPayload('distance', ngsildInstance(parseFloat((item.value * 0.001).toFixed(3)),
                                                    time,
                                                    'MTR',
                                                    'Raw'));
        }
        if (item.variable === 'reset_event') {
            addToPayload('resetEvent', ngsildInstance(item.value, time, null, null));
        }
        if (item.variable === 'temperature') {
            addToPayload('temperature', ngsildInstance(item.value, time, 'CEL', 'Raw'));
        }
        if (item.variable === 'distance_threshold') {
            addToPayload('alarm', ngsildInstance(1, time, null, 'Threshold:Raw'), true);
        }
        if (item.variable === 'distance_blind') {
            addToPayload('alarm', ngsildInstance(1, time, null, 'Blind:Raw'), true);
        }
        if (item.variable === 'temperature_abnormal') {
            addToPayload('alarm', ngsildInstance(1, time, null, 'Temperature:Raw'), true);
        }
    });
    ngsild_payload.forEach(d => {
        if (Array.isArray(d.alarm) && d.alarm.length === 1) {
            d.alarm = d.alarm[0];
        }
    });
    return ngsild_payload;
}

function main() {
    var payload = process.argv[3];
    var time = process.argv[4];
    var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    var decoded = decode(Buffer.from(payload, 'hex'));
    var inputArray = Object.entries(decoded).map(([key, value]) => ({
        variable: key,
        value: value
    }));
    var ngsild_payload = ngsildWrapper(inputArray, time, entity_id);
    process.stdout.write(JSON.stringify(ngsild_payload, null, 2));
}

if (require.main === module) {
    main();
}