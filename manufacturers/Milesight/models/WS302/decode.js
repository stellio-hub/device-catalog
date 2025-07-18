/**
 * Payload Decoder
 *
 * Copyright 2024 Milesight IoT
 *
 * @product WS302
 */

function decode(bytes) {
    var decoded = {};

    for (var i = 0; i < bytes.length; ) {
        var channel_id = bytes[i++];
        var channel_type = bytes[i++];
      
        // BATTERY
        if (channel_id === 0x01 && channel_type === 0x75) {
            decoded.battery = bytes[i];
            i += 1;
        }
        // SOUND
        else if (channel_id === 0x05 && channel_type === 0x5b) {
            decoded.freq_weight = readFrequecyWeightType(bytes[i]);
            decoded.time_weight = readTimeWeightType(bytes[i]);
            decoded.sound_level = readUInt16LE(bytes.slice(i + 1, i + 3)) / 10;
            decoded.sound_level_eq = readUInt16LE(bytes.slice(i + 3, i + 5)) / 10;
            decoded.sound_level_max = readUInt16LE(bytes.slice(i + 5, i + 7)) / 10;
            i += 7;
        }
        // DEVICE STATUS
      	else if (channel_id === 0xff && channel_type === 0x0b) {
          decoded.status = "on";
          i += 1;
        }
        // PROTOCOL VERSION
      	else if (channel_id === 0xff && channel_type === 0x01) {
          decoded.protocol_version = bytes[i]
          i += 1;
        }
      	// HARDWARE VERSION
        else if (channel_id === 0xff && channel_type === 0x09) {
            decoded.hardware_version = readVersion(bytes.slice(i, i + 2));
            i += 2;
        }
        // SOFTWARE VERSION
        else if (channel_id === 0xff && channel_type === 0x0a) {
            decoded.software_version = readVersion(bytes.slice(i, i + 2));
            i += 2;
        }
        // SERIAL NUMBER
        else if (channel_id === 0xff && channel_type === 0x16) {
            decoded.sn = readString(bytes.slice(i, i + 8));
            i += 8;
        }
        // LoRaWAN Class Type
        else if (channel_id === 0xff && channel_type === 0x0f) {
            switch (bytes[i]) {
                case 0:
                    decoded.class_type = "class-a";
                    break;
                case 1:
                    decoded.class_type = "class-b";
                    break;
                case 2:
                    decoded.class_type = "class-c";
                    break;
            }
            i += 1;
        } else {
            break;
        }
    }

    return decoded;
}

function readFrequecyWeightType(bytes) {
    var type = "";
    
    var bits = bytes & 0x03;
    switch (bits) {
        case 0:
            type = "Z";
            break;
        case 1:
            type = "A";
            break;
        case 2:
            type = "C";
            break;
    }

    return type;
}

function readTimeWeightType(bytes) {
    var type = "";

    var bits = (bytes[0] >> 2) & 0x03;
    switch (bits) {
        case 0:
            type = "Impulse";
            break;
        case 1:
            type = "Fast";
            break;
        case 2:
            type = "Slow";
            break;
    }

    return type;
}

function readUInt16LE(bytes) {
    var value = (bytes[1] << 8) + bytes[0];
    return value & 0xffff;
}

function readVersion(bytes) {
    var temp = [];
    for (var idx = 0; idx < bytes.length; idx++) {
        temp.push((bytes[idx] & 0xff).toString(10));
    }
    return temp.join(".");
}

function readString(bytes) {
    var temp = [];
    for (var idx = 0; idx < bytes.length; idx++) {
        temp.push(("0" + (bytes[idx] & 0xff).toString(16)).slice(-2));
    }
    return temp.join("");
}

function readInt16LE(bytes) {
    var ref = readUInt16LE(bytes);
    return ref > 0x7fff ? ref - 0x10000 : ref;
}

module.exports = { decode };