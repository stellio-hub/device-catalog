/**
 * Payload Decoder
 *
 * Copyright 2024 Milesight IoT
 *
 * @product AM307 / AM319
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
      	// SERIAL NUMBER
        else if (channel_id === 0xff && channel_type === 0x16) {
            decoded.sn = readString(bytes.slice(i, i + 8));
            i += 8;
        }
        // TEMPERATURE
        else if (channel_id === 0x03 && channel_type === 0x67) {
            // ℃
            decoded.temperature = readInt16LE(bytes.slice(i, i + 2)) / 10;
            i += 2;
        }
        // HUMIDITY
        else if (channel_id === 0x04 && channel_type === 0x68) {
            decoded.humidity = bytes[i] / 2;
            i += 1;
        }
        // PIR
        else if (channel_id === 0x05 && channel_type === 0x00) {
            decoded.pir = bytes[i] === 1 ? "trigger" : "idle";
            i += 1;
        }
        // LIGHT
        else if (channel_id === 0x06 && channel_type === 0xcb) {
            decoded.light_level = bytes[i];
            i += 1;
        }
        // CO2
        else if (channel_id === 0x07 && channel_type === 0x7d) {
            decoded.co2 = readUInt16LE(bytes.slice(i, i + 2));
            i += 2;
        }
        // TVOC
        else if (channel_id === 0x08 && channel_type === 0x7d) {
            decoded.tvoc = readUInt16LE(bytes.slice(i, i + 2));
            i += 2;
        }
        // PRESSURE
        else if (channel_id === 0x09 && channel_type === 0x73) {
            decoded.pressure = readUInt16LE(bytes.slice(i, i + 2)) / 10;
            i += 2;
        }
        // HCHO
        else if (channel_id === 0x0a && channel_type === 0x7d) {
            decoded.hcho = readUInt16LE(bytes.slice(i, i + 2)) / 100;
            i += 2;
        }
        // PM2.5
        else if (channel_id === 0x0b && channel_type === 0x7d) {
            decoded.pm2_5 = readUInt16LE(bytes.slice(i, i + 2));
            i += 2;
        }
        // PM10
        else if (channel_id === 0x0c && channel_type === 0x7d) {
            decoded.pm10 = readUInt16LE(bytes.slice(i, i + 2));
            i += 2;
        }
        // O3
        else if (channel_id === 0x0d && channel_type === 0x7d) {
            decoded.o3 = readUInt16LE(bytes.slice(i, i + 2)) / 100;
            i += 2;
        }
        // BEEP
        else if (channel_id === 0x0e && channel_type === 0x01) {
            decoded.beep = bytes[i] === 1 ? "yes" : "no";
            i += 1;
        }
        // HISTORY DATA (AM307)
        else if (channel_id === 0x20 && channel_type === 0xce) {
            var data = {};
            decoded.timestamp = readUInt32LE(bytes.slice(i, i + 4));
            decoded.temperature = readInt16LE(bytes.slice(i + 4, i + 6)) / 10;
            decoded.humidity = readUInt16LE(bytes.slice(i + 6, i + 8)) / 2;
            decoded.pir = bytes[i + 8] === 1 ? "trigger" : "idle";
            decoded.light_level = bytes[i + 9];
            decoded.co2 = readUInt16LE(bytes.slice(i + 10, i + 12));
            decoded.tvoc = readUInt16LE(bytes.slice(i + 12, i + 14));
            decoded.pressure = readUInt16LE(bytes.slice(i + 14, i + 16)) / 10;
            i += 16;
        }
        // HISTORY DATA (AM308)
        else if (channel_id === 0x20 && channel_type === 0xce) {
            var data = {};
            decoded.timestamp = readUInt32LE(bytes.slice(i, i + 4));
            decoded.temperature = readInt16LE(bytes.slice(i + 4, i + 6)) / 10;
            decoded.humidity = readUInt16LE(bytes.slice(i + 6, i + 8)) / 2;
            decoded.pir = bytes[i + 8] === 1 ? "trigger" : "idle";
            decoded.light_level = bytes[i + 9];
            decoded.co2 = readUInt16LE(bytes.slice(i + 10, i + 12));
            decoded.tvoc = readUInt16LE(bytes.slice(i + 12, i + 14));
            decoded.pressure = readUInt16LE(bytes.slice(i + 14, i + 16)) / 10;
            decoded.pm2_5 = readUInt16LE(bytes.slice(i + 16, i + 18));
            decoded.pm10 = readUInt16LE(bytes.slice(i + 18, i + 20));
            i += 20;
        }
        // HISTORY DATA (AM319 CH2O)
        else if (channel_id === 0x20 && channel_type === 0xce) {
            var data = {};
            decoded.timestamp = readUInt32LE(bytes.slice(i, i + 4));
            decoded.temperature = readInt16LE(bytes.slice(i + 4, i + 6)) / 10;
            decoded.humidity = readUInt16LE(bytes.slice(i + 6, i + 8)) / 2;
            decoded.pir = bytes[i + 8] === 1 ? "trigger" : "idle";
            decoded.light_level = bytes[i + 9];
            decoded.co2 = readUInt16LE(bytes.slice(i + 10, i + 12));
            decoded.tvoc = readUInt16LE(bytes.slice(i + 12, i + 14));
            decoded.pressure = readUInt16LE(bytes.slice(i + 14, i + 16)) / 10;
            decoded.pm2_5 = readUInt16LE(bytes.slice(i + 16, i + 18));
            decoded.pm10 = readUInt16LE(bytes.slice(i + 18, i + 20));
            decoded.hcho = readUInt16LE(bytes.slice(i + 20, i + 22)) / 100;
            i += 22;
        }
        // HISTORY DATA (AM319 O3)
        else if (channel_id === 0x20 && channel_type === 0xce) {
            var data = {};
            decoded.timestamp = readUInt32LE(bytes.slice(i, i + 4));
            decoded.temperature = readInt16LE(bytes.slice(i + 4, i + 6)) / 10;
            decoded.humidity = readUInt16LE(bytes.slice(i + 6, i + 8)) / 2;
            decoded.pir = bytes[i + 8] === 1 ? "trigger" : "idle";
            decoded.light_level = bytes[i + 9];
            decoded.co2 = readUInt16LE(bytes.slice(i + 10, i + 12));
            decoded.tvoc = readUInt16LE(bytes.slice(i + 12, i + 14));
            decoded.pressure = readUInt16LE(bytes.slice(i + 14, i + 16)) / 10;
            decoded.pm2_5 = readUInt16LE(bytes.slice(i + 16, i + 18));
            decoded.pm10 = readUInt16LE(bytes.slice(i + 18, i + 20));
            decoded.o3 = readUInt16LE(bytes.slice(i + 20, i + 22)) / 100;
            i += 22;
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

function readUInt32LE(bytes) {
    var value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
    return (value & 0xffffffff) >>> 0;
}

function readInt32LE(bytes) {
    var ref = readUInt32LE(bytes);
    return ref > 0x7fffffff ? ref - 0x100000000 : ref;
}

function readString(bytes) {
    var temp = [];
    for (var idx = 0; idx < bytes.length; idx++) {
        temp.push(("0" + (bytes[idx] & 0xff).toString(16)).slice(-2));
    }
    return temp.join("");
}

function readVersion(bytes) {
    var temp = [];
    for (var idx = 0; idx < bytes.length; idx++) {
        temp.push((bytes[idx] & 0xff).toString(10));
    }
    return temp.join(".");
}

module.exports = { decode };