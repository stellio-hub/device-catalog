/**
 * Payload Decoder
 *
 * Copyright 2024 Milesight IoT
 *
 * @product WS52x
 */

function decode(bytes) {
    var decoded = {};

    for (var i = 0; i < bytes.length; ) {
        var channel_id = bytes[i++];
        var channel_type = bytes[i++];

        // VOLTAGE
        if (channel_id === 0x03 && channel_type === 0x74) {
            decoded.voltage = readUInt16LE(bytes.slice(i, i + 2)) / 10;
            i += 2;
        }
		// ACTIVE POWER
        else if (channel_id === 0x04 && channel_type === 0x80) {
            decoded.power = readUInt32LE(bytes.slice(i, i + 4));
            i += 4;
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
      	// DEVICE STATUS
      	else if (channel_id === 0xff && channel_type === 0x0b) {
          decoded.status = "on";
          i += 1;
        }
      	// SERIAL NUMBER
        else if (channel_id === 0xff && channel_type === 0x16) {
            decoded.sn = readString(bytes.slice(i, i + 8));
          
            i += 8;
        }
      	// OVERCURRENT ALARM
        else if (channel_id === 0xff && channel_type === 0x24) {
          	decoded.alarm = bytes[i];
          	decoded.alarm_threshold = bytes[i+1];
            i += 2;
        }
      	// BUTTON LOCK
        else if (channel_id === 0xff && channel_type === 0x25) {
          	decoded.button_lock = bytes[i+1];
            i += 2;
        }
      	// POWER CONSUMPTION
        else if (channel_id === 0xff && channel_type === 0x26) {
          	decoded.power_sum_status = bytes[i];
            i += 1;
        }
      	// OVERCURRENT PROTECTION
        else if (channel_id === 0xff && channel_type === 0x30) {
          	decoded.overcurrent_protection = bytes[i];
          	decoded.current_threshold = bytes[i+1];
            i += 2;
        }
        // POWER FACTOR
        else if (channel_id === 0x05 && channel_type === 0x81) {
            decoded.factor = bytes[i];
            i += 1;
        }
        // POWER CONSUMPTION
        else if (channel_id === 0x06 && channel_type == 0x83) {
            decoded.power_sum = readUInt32LE(bytes.slice(i, i + 4));
            i += 4;
        }
        // CURRENT
        else if (channel_id === 0x07 && channel_type == 0xc9) {
            decoded.current = readUInt16LE(bytes.slice(i, i + 2));
            i += 2;
        }
        // STATE
        else if (channel_id === 0x08 && channel_type == 0x70) {
            decoded.state = bytes[i] == 1 || bytes[i] == 0x11? "Open" : "Close";
            i += 1;
        } 
	else if (channel_id === 0xFF && channel_type == 0x3F) {
            decoded.outage = bytes[i] == 0xFF ? 1 : 0;
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

function readUInt32LE(bytes) {
    var value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
    return (value & 0xffffffff) >>> 0;
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