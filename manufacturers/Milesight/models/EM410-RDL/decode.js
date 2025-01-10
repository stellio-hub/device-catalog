/**
 * Payload Decoder
 *
 * Copyright 2024 Milesight IoT
 *
 * @product EM410-RDL
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

function readPositionStatus(status) {
    switch (status) {
        case 0:
            return "Normal";
        case 1:
            return "Tilt";
        default:
            return "Unknown";
    }
}

function readDistanceAlarm(status) {
    switch (status) {
        case 0:
            return 0; // Threshold Alarm Release
        case 1:
            return 1; // Threshold Alarm
        case 2:
            return 2; // Mutation Alarm
        default:
            return 0;
    }
}

function readDistanceException(status) {
    switch (status) {
        case 0:
            return 0; // Blind Spot Alarm Release
        case 1:
            return 1; // Blind Spot Alarm
        case 2:
            return 2; // No Target
        case 3:
            return 3; // Sensor Exception
        default:
            return 0;
    }
}

function readHistoryEvent(status) {
    var event = [];

    if (((status >>> 0) & 0x01) === 0x01) {
        event.push("Threshold Alarm");
    }
    if (((status >>> 1) & 0x01) === 0x01) {
        event.push("Threshold Alarm Release");
    }
    if (((status >>> 2) & 0x01) === 0x01) {
        event.push("Blind Spot Alarm");
    }
    if (((status >>> 3) & 0x01) === 0x01) {
        event.push("Blind Spot Alarm Release");
    }
    if (((status >>> 4) & 0x01) === 0x01) {
        event.push("Mutation Alarm");
    }
    if (((status >>> 5) & 0x01) === 0x01) {
        event.push("Tilt Alarm");
    }

    return event;
}

function handle_downlink_response(channel_type, bytes, offset) {
    var decoded = {};

    switch (channel_type) {
        case 0x06: // distance_alarm
            var data = readUInt8(bytes[offset]);
            var min = readInt16LE(bytes.slice(offset + 1, offset + 3));
            var max = readInt16LE(bytes.slice(offset + 3, offset + 5));
            // skip 4 bytes (reserved)
            offset += 9;

            var alarm_type = data & 0x07;
            var id = (data >>> 3) & 0x07;
            var alarm_release_report_enable = data >>> 7;

            if (alarm_type === 5 && id === 2) {
                decoded.distance_mutation_alarm = {};
                decoded.distance_mutation_alarm.alarm_release_report_enable = alarm_release_report_enable;
                decoded.distance_mutation_alarm.mutation = max;
            } else {
                decoded.distance_alarm = {};
                decoded.distance_alarm.condition = alarm_type;
                decoded.distance_alarm.alarm_release_report_enable = alarm_release_report_enable;
                decoded.distance_alarm.min = min;
                decoded.distance_alarm.max = max;
            }
            break;
        case 0x1b: // distance_range
            decoded.distance_range = {};
            decoded.distance_range.mode = readUInt8(bytes[offset]);
            // skip 2 bytes (reserved)
            decoded.distance_range.max = readUInt16LE(bytes.slice(offset + 3, offset + 5));
            offset += 5;
            break;
        case 0x1c:
            decoded.recollection_counts = readUInt8(bytes[offset]);
            decoded.recollection_interval = readUInt8(bytes[offset + 1]);
            offset += 2;
            break;
        case 0x2a: // radar calibration
            var calibrate_type = readUInt8(bytes[offset]);
            offset += 1;

            switch (calibrate_type) {
                case 0:
                    decoded.radar_calibration = 1;
                    break;
                case 1:
                    decoded.radar_blind_calibration = 1;
                    break;
            }
            break;
        case 0x3e: // tilt_distance_link
            decoded.tilt_distance_link = readUInt8(bytes[offset]);
            offset += 1;
            break;
        case 0x4a: // sync_time
            decoded.sync_time = 1;
            offset += 1;
            break;
        case 0x68: // history_enable
            decoded.history_enable = readUInt8(bytes[offset]);
            offset += 1;
            break;
        case 0x69: // retransmit_enable
            decoded.retransmit_enable = readUInt8(bytes[offset]);
            offset += 1;
            break;
        case 0x6a:
            var interval_type = readUInt8(bytes[offset]);
            switch (interval_type) {
                case 0:
                    decoded.retransmit_interval = readUInt16LE(bytes.slice(offset + 1, offset + 3));
                    break;
                case 1:
                    decoded.resend_interval = readUInt16LE(bytes.slice(offset + 1, offset + 3));
                    break;
            }
            offset += 3;
            break;
        case 0x8e: // report_interval
            // ignore the first byte
            decoded.report_interval = readUInt16LE(bytes.slice(offset + 1, offset + 3));
            offset += 3;
            break;
        case 0xab: // distance_calibration
            decoded.distance_calibration = {};
            decoded.distance_calibration.enable = readUInt8(bytes[offset]);
            decoded.distance_calibration.distance = readInt16LE(bytes.slice(offset + 1, offset + 3));
            offset += 3;
            break;
        case 0xbd: // timezone
            decoded.timezone = readInt16LE(bytes.slice(offset, offset + 2)) / 60;
            offset += 2;
            break;
        case 0xf2: // alarm_counts
            decoded.alarm_counts = readUInt16LE(bytes.slice(offset, offset + 2));
            offset += 2;
            break;
        default:
            throw new Error("unknown downlink response");
    }

    return { data: decoded, offset: offset };
}

function handle_downlink_response_ext(channel_type, bytes, offset) {
    var decoded = {};

    switch (channel_type) {
        case 0x12: // distance_mode
            var distance_mode_result = readUInt8(bytes[offset + 1]);
            if (distance_mode_result === 0) {
                decoded.distance_mode = readUInt8(bytes[offset]);
            }
            offset += 2;
            break;
        case 0x13: // blind_detection_enable
            var blind_detection_enable_result = readUInt8(bytes[offset + 1]);
            if (blind_detection_enable_result === 0) {
                decoded.blind_detection_enable = readUInt8(bytes[offset]);
            }
            offset += 2;
            break;
        case 0x14: // signal_quality
            var signal_quality_result = readUInt8(bytes[offset + 2]);
            if (signal_quality_result === 0) {
                decoded.signal_quality = readInt16LE(bytes.slice(offset, offset + 2));
            }
            offset += 3;
            break;
        case 0x15: // distance_threshold_sensitive
            var distance_threshold_sensitive_result = readUInt8(bytes[offset + 2]);
            if (distance_threshold_sensitive_result === 0) {
                decoded.distance_threshold_sensitive = readInt16LE(bytes.slice(offset, offset + 2)) / 10;
            }
            offset += 3;
            break;
        case 0x16: // peak_sorting
            var peak_sorting_result = readUInt8(bytes[offset + 1]);
            if (peak_sorting_result === 0) {
                decoded.peak_sorting = readUInt8(bytes[offset]);
            }
            offset += 2;
            break;
        case 0x0d: // retransmit_config
            var retransmit_config_result = readUInt8(bytes[offset + 3]);
            if (retransmit_config_result === 0) {
                decoded.retransmit_config = {};
                decoded.retransmit_config.enable = readUInt8(bytes[offset]);
                decoded.retransmit_config.retransmit_interval = readUInt16LE(bytes.slice(offset + 1, offset + 3));
            }
            offset += 4;
            break;
        case 0x39: // collection_interval
            var collection_interval_result = readUInt8(bytes[offset + 2]);
            if (collection_interval_result === 0) {
                decoded.collection_interval = readUInt16LE(bytes.slice(offset, offset + 2));
            }
            offset += 3;
            break;
        default:
            throw new Error("unknown downlink response");
    }

    return { data: decoded, offset: offset };
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
        // IPSO VERSION
        else if (channel_id === 0xff && channel_type === 0x01) {
            decoded.ipso_version = readProtocolVersion(bytes[i]);
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
            decoded.battery = readUInt8(bytes[i]);
            i += 1;
        }
        // TEMPERATURE
        else if (channel_id === 0x03 && channel_type === 0x67) {
            decoded.temperature = readInt16LE(bytes.slice(i, i + 2)) / 10;
            i += 2;
        }
        // DISTANCE
        else if (channel_id === 0x04 && channel_type === 0x82) {
            decoded.distance = readInt16LE(bytes.slice(i, i + 2));
            i += 2;
        }
        // POSITION
        else if (channel_id === 0x05 && channel_type === 0x00) {
            decoded.position = readPositionStatus(bytes[i]);
            i += 1;
        }
        // RADAR SIGNAL STRENGTH
        else if (channel_id === 0x06 && channel_type === 0xc7) {
            decoded.radar_signal_rssi = readInt16LE(bytes.slice(i, i + 2)) / 100;
            i += 2;
        }
        // DISTANCE ALARM
        else if (channel_id === 0x84 && channel_type === 0x82) {
            decoded.distance = readInt16LE(bytes.slice(i, i + 2));
            var data = readDistanceAlarm(bytes[i + 2]);
            if(data == 0) {
                decoded.threshold_alarm = 0;
            }
            else if(data == 1) {
                decoded.threshold_alarm = 1;
            }
            else if(data == 2) {
                decoded.mutation_alarm = 1;
            }
            i += 3;
        }
        // DISTANCE MUTATION ALARM
        else if (channel_id === 0x94 && channel_type === 0x82) {
            decoded.distance = readInt16LE(bytes.slice(i, i + 2));
            decoded.distance_mutation = readInt16LE(bytes.slice(i + 2, i + 4));
            var data = readDistanceAlarm(bytes[i + 4]);
            if(data == 0) {
                decoded.threshold_alarm = 0;
            }
            else if(data == 1) {
                decoded.threshold_alarm = 1;
            }
            else if(data == 2) {
                decoded.mutation_alarm = 1;
            }
            i += 5;
        }
        // DISTANCE EXCEPTION ALARM
        else if (channel_id === 0xb4 && channel_type === 0x82) {
            var distance_raw_data = readUInt16LE(bytes.slice(i, i + 2));
            var distance_value = readInt16LE(bytes.slice(i, i + 2));
            var distance_exception = readDistanceException(bytes[i + 2]);
            i += 3;

            var data = {};
            if (distance_raw_data === 0xfffd || distance_raw_data === 0xffff) {
                // IGNORE NO TARGET AND SENSOR EXCEPTION
            } else {
                decoded.distance = distance_value;
            }
            if(distance_exception == 0) {
                decoded.blind_alarm = 0;
            }
            else if(distance_exception == 1) {
                decoded.blind_alarm = 1;
            }
            else if(distance_exception == 2) {
                decoded.target_alarm = 1;
            }
            else if(distance_exception == 3) {
                decoded.sensor_alarm = 1;
            }
        }
        // HISTORY
        else if (channel_id === 0x20 && channel_type === 0xce) {
            var timestamp = readUInt32LE(bytes.slice(i, i + 4));
            var distance_raw_data = readUInt16LE(bytes.slice(i + 4, i + 6));
            var distance_value = readInt16LE(bytes.slice(i + 4, i + 6));
            var temperature_raw_data = readUInt16LE(bytes.slice(i + 6, i + 8));
            var temperature_value = readInt16LE(bytes.slice(i + 6, i + 8)) / 10;
            var mutation = readInt16LE(bytes.slice(i + 8, i + 10));
            var event_value = readUInt8(bytes[i + 10]);
            i += 11;

            var data = {};
            decoded.timestamp = timestamp;
            if (distance_raw_data === 0xfffd) {
                decoded.distance_exception = 1; // No Target
            } else if (distance_raw_data === 0xffff) {
                decoded.distance_exception = 1; // Sensor Exception
            } else if (distance_raw_data === 0xfffe) {
                decoded.distance_exception = 1; // Disabled
            } else {
                decoded.distance = distance_value;
            }

            if (temperature_raw_data === 0xfffe) {
                decoded.temperature_exception = 1; // Disabled
            } else if (temperature_raw_data === 0xffff) {
                decoded.temperature_exception = 1; // Sensor Exception
            } else {
                decoded.temperature = temperature_value;
            }

            var event = readHistoryEvent(event_value);
            if (event.length > 0) {
                data.event = event;
            }
            if (event.indexOf("Mutation Alarm") !== -1) {
                decoded.distance_mutation = mutation;
            }
        }
        // DOWNLINK RESPONSE
        else if (channel_id === 0xfe) {
            result = handle_downlink_response(channel_type, bytes, i);
            decoded = Object.assign(decoded, result.data);
            i = result.offset;
        }
        // DOWNLINK RESPONSE
        else if (channel_id === 0xf8) {
            result = handle_downlink_response_ext(channel_type, bytes, i);
            decoded = Object.assign(decoded, result.data);
            i = result.offset;
        } else {
            break;
        }
    }
    return decoded;
}

module.exports = { decode };