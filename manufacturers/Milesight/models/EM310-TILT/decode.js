/**
 * Payload Decoder
 *
 * Copyright 2024 Milesight IoT
 *
 * @product EM310-TILT
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
        // ANGLE
        else if (channel_id === 0x03 && channel_type === 0xcf) {
            decoded.angle_x = readInt16LE(bytes.slice(i, i + 2)) / 100;
            decoded.angle_y = readInt16LE(bytes.slice(i + 2, i + 4)) / 100;
            decoded.angle_z = readInt16LE(bytes.slice(i + 4, i + 6)) / 100;
            decoded.threshold_x = (bytes[i+6] & 0x01) === 0x01 ? "trigger" : "normal";
            decoded.threshold_y = (bytes[i+6] & 0x02) === 0x02 ? "trigger" : "normal";
            decoded.threshold_z = (bytes[i+6] & 0x04) === 0x04 ? "trigger" : "normal";
            i += 7;
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
        // FIRMWARE VERSION
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
        }
      	// DEVICE STATUS
      	else if (channel_id === 0xff && channel_type === 0x0b) {
          decoded.status = "on";
          i += 1;
        } else {
            break;
        }
    }

    return decoded;
}

/* ******************************************
 * bytes to number
 ********************************************/
function readUInt16LE(bytes) {
    var value = (bytes[1] << 8) + bytes[0];
    return value & 0xffff;
}

function readInt16LE(bytes) {
    var ref = readUInt16LE(bytes);
    return ref > 0x7fff ? ref - 0x10000 : ref;
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

module.exports = { decode };