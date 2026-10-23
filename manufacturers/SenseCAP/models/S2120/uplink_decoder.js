const batteryUtils = require("../../../../utils/batteryScale.js")

// SenseCAP S2120. Packets 01/02 are firmware before v2.0.
// Packets 4A/4B replace them from v2.0, and 4C adds peak wind gust and accumulated rain.
// Packet 00 (000801XX000314) is the daily status frame. The byte after 000801 varies (00..04).
// Seeed keeps it valid and does not map measurements.
// Parsing follows Seeed SenseCAP_S2120_ChirpStackV3_Decoder.js (big-endian, signed values).

var PACKET_VALUE_LENGTH = {
    '01': 20, '20': 20, '21': 20, '30': 20, '31': 20, '33': 20,
    '40': 20, '41': 20, '42': 20, '43': 20, '44': 20, '45': 20, '4a': 20,
    '02': 16, '4b': 16,
    '03': 2, '06': 2,
    '05': 8, '34': 8,
    '04': 18, '10': 18, '32': 18, '35': 18, '36': 18, '37': 18, '38': 18, '39': 18,
    '4c': 12
};

var SENSOR_ERRORS = {
    '00': 'CCL_SENSOR_ERROR_NONE',
    '01': 'CCL_SENSOR_NOT_FOUND',
    '02': 'CCL_SENSOR_WAKEUP_ERROR',
    '03': 'CCL_SENSOR_NOT_RESPONSE',
    '04': 'CCL_SENSOR_DATA_EMPTY',
    '05': 'CCL_SENSOR_DATA_HEAD_ERROR',
    '06': 'CCL_SENSOR_DATA_CRC_ERROR',
    '07': 'CCL_SENSOR_DATA_B1_NO_VALID',
    '08': 'CCL_SENSOR_DATA_B2_NO_VALID',
    '09': 'CCL_SENSOR_RANDOM_NOT_MATCH',
    '0a': 'CCL_SENSOR_PUBKEY_SIGN_VERIFY_FAILED',
    '0b': 'CCL_SENSOR_DATA_SIGN_VERIFY_FAILED',
    '0c': 'CCL_SENSOR_DATA_VALUE_HI',
    '0d': 'CCL_SENSOR_DATA_VALUE_LOW',
    '0e': 'CCL_SENSOR_DATA_VALUE_MISSED',
    '0f': 'CCL_SENSOR_ARG_INVAILD',
    '10': 'CCL_SENSOR_RS485_MASTER_BUSY',
    '11': 'CCL_SENSOR_RS485_REV_DATA_ERROR',
    '12': 'CCL_SENSOR_RS485_REG_MISSED',
    '13': 'CCL_SENSOR_RS485_FUN_EXE_ERROR',
    '14': 'CCL_SENSOR_RS485_WRITE_STRATEGY_ERROR',
    '15': 'CCL_SENSOR_CONFIG_ERROR',
    'ff': 'CCL_SENSOR_DATA_ERROR_UNKONW'
};

function Decode(fPort, bytes) {
    var bytesString = bytes2HexString(bytes).toLocaleUpperCase();
    var decoded = {
        valid: true,
        err: 0,
        payload: bytesString,
        messages: []
    };

    var splitArray = dataSplit(bytesString);
    if (splitArray.length === 0) {
        decoded.valid = false;
        decoded.err = -2;
        return { data: decoded };
    }

    for (var i = 0; i < splitArray.length; i++) {
        var item = splitArray[i];
        var messages = dataIdAndDataValueJudge(item.dataId, item.dataValue);
        for (var j = 0; j < messages.length; j++) {
            decoded.messages.push(messages[j]);
        }
    }

    return { data: decoded };
}

function dataSplit(bytes) {
    var frameArray = [];
    var remaining = bytes.toLowerCase();
    while (remaining.length >= 2) {
        var dataId = remaining.substring(0, 2);
        if (dataId === '00' && isDailyStatusFrame(remaining)) {
            frameArray.push({
                dataId: dataId,
                dataValue: remaining.substring(2)
            });
            break;
        }
        var valueLength = PACKET_VALUE_LENGTH[dataId];
        if (valueLength === undefined || remaining.length < 2 + valueLength) {
            break;
        }
        frameArray.push({
            dataId: dataId,
            dataValue: remaining.substring(2, 2 + valueLength)
        });
        remaining = remaining.substring(2 + valueLength);
    }
    return frameArray;
}

function isDailyStatusFrame(remaining) {
    return remaining.length >= 14
        && remaining.substring(0, 6) === '000801'
        && remaining.substring(8, 14) === '000314';
}

function telemetry(measurementId, measurementValue) {
    return {
        type: 'report_telemetry',
        measurementId: measurementId,
        measurementValue: measurementValue
    };
}

function weatherMeasurements(dataValue) {
    return [
        telemetry(4097, loraWANV2DataFormat(dataValue.substring(0, 4), 10)),
        telemetry(4098, loraWANV2DataFormat(dataValue.substring(4, 6))),
        telemetry(4099, loraWANV2DataFormat(dataValue.substring(6, 14))),
        telemetry(4190, loraWANV2DataFormat(dataValue.substring(14, 16), 10)),
        telemetry(4105, loraWANV2DataFormat(dataValue.substring(16, 20), 10))
    ];
}

function windAndRainMeasurements(dataValue) {
    return [
        telemetry(4104, loraWANV2DataFormat(dataValue.substring(0, 4))),
        telemetry(4113, loraWANV2DataFormat(dataValue.substring(4, 12), 1000)),
        telemetry(4101, loraWANV2DataFormat(dataValue.substring(12, 16), 0.1))
    ];
}

function versionString(bytesHex) {
    return loraWANV2DataFormat(bytesHex.substring(0, 2)) + '.' + loraWANV2DataFormat(bytesHex.substring(2, 4));
}

function dataIdAndDataValueJudge(dataId, dataValue) {
    switch (dataId) {
        case '01':
        case '4a':
            return weatherMeasurements(dataValue);
        case '02':
        case '4b':
            return windAndRainMeasurements(dataValue);
        case '4c':
            return [
                telemetry(4191, loraWANV2DataFormat(dataValue.substring(0, 4), 10)),
                telemetry(4213, loraWANV2DataFormat(dataValue.substring(4, 12), 1000))
            ];
        case '03':
            return [{
                type: 'upload_battery',
                battery: loraWANV2DataFormat(dataValue)
            }];
        case '04':
            return [{
                type: 'upload_battery',
                battery: loraWANV2DataFormat(dataValue.substring(0, 2))
            }, {
                type: 'upload_version',
                hardwareVersion: versionString(dataValue.substring(2, 6)),
                softwareVersion: versionString(dataValue.substring(6, 10))
            }, {
                type: 'upload_interval',
                interval: parseInt(loraWANV2DataFormat(dataValue.substring(10, 14))),
                gpsInterval: parseInt(loraWANV2DataFormat(dataValue.substring(14, 18)))
            }];
        case '05':
            return [{
                type: 'upload_interval',
                interval: parseInt(loraWANV2DataFormat(dataValue.substring(0, 4))),
                gpsInterval: parseInt(loraWANV2DataFormat(dataValue.substring(4, 8)))
            }];
        case '06':
            return [{
                type: 'sensor_error',
                errCode: dataValue.toUpperCase(),
                desc: SENSOR_ERRORS[dataValue.toLowerCase()] || 'CC_OTHER_FAILED'
            }];
        case '00':
            return [{ type: 'device_status' }];
        case '10':
            var statusBits = loraWANV2BitDataFormat(dataValue.substring(0, 2));
            return [{
                type: 'upload_sensor_id',
                status: statusBits.status,
                channelType: statusBits.type,
                sensorId: dataValue.substring(2)
            }];
        default:
            return [];
    }
}

function loraWANV2DataFormat(str, divisor) {
    if (divisor === undefined) {
        divisor = 1;
    }
    var str2 = toBinary(bigEndianTransform(str));
    if (str2.substring(0, 1) === '1') {
        var reverseArr = str2.split('').map(function (item) {
            return parseInt(item) === 1 ? '0' : '1';
        });
        var negative = parseInt(reverseArr.join(''), 2) + 1;
        return parseFloat('-' + negative) / divisor;
    }
    return parseInt(str2, 2) / divisor;
}

function bigEndianTransform(data) {
    var dataArray = [];
    for (var i = 0; i < data.length; i += 2) {
        dataArray.push(data.substring(i, i + 2));
    }
    return dataArray;
}

function toBinary(arr) {
    var binaryData = arr.map(function (item) {
        var data = parseInt(item, 16).toString(2);
        while (data.length < 8) {
            data = '0' + data;
        }
        return data;
    });
    return binaryData.join('');
}

function loraWANV2BitDataFormat(str) {
    var str2 = toBinary(bigEndianTransform(str));
    return {
        channel: parseInt(str2.substring(0, 4), 2),
        status: parseInt(str2.substring(4, 5), 2),
        type: parseInt(str2.substring(5), 2)
    };
}

function bytes2HexString(arrBytes) {
    var str = '';
    for (var i = 0; i < arrBytes.length; i++) {
        var num = arrBytes[i];
        var tmp = (num < 0 ? (255 + num + 1) : num).toString(16);
        if (tmp.length === 1) {
            tmp = '0' + tmp;
        }
        str += tmp;
    }
    return str;
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
        type: "Device"
    }];
    var messages = input.data.messages;
    var error = true
    for (let i = 0; i < messages.length; i++) {
        if (messages[i].type === 'report_telemetry' && messages[i].measurementValue !== 0 && messages[i].measurementValue !== 2000001) {
            error = false
        }
        if (messages[i].type === 'upload_battery' || messages[i].type === 'upload_interval' || messages[i].type === 'upload_version' || messages[i].type === 'device_status') {
            error = false
        }
    }
    if (error) {
        ngsild_payload[0].error = ngsildInstance(1, time, null, null)
    } else {
        const batteryMessage = messages.find((message) => message.type === "upload_battery");
        if (batteryMessage) {
            const batteryScale = batteryUtils.batteryScaleFromBatteryLevelPercent(batteryMessage.battery);
            ngsild_payload[0].batteryLevel = [
                ngsildInstance(
                    batteryScale,
                    time,
                    null,
                    "scale5"
                )
            ]
        }

        for (let i = 0; i < messages.length; i++) {
            if (messages[i].type === 'report_telemetry') {
                if (messages[i].measurementId === 4097) {
                    ngsild_payload[0].airTemperature = ngsildInstance(messages[i].measurementValue, time, 'CEL', 'Raw');
                }
                else if (messages[i].measurementId === 4098) {
                    ngsild_payload[0].airHumidity = ngsildInstance(messages[i].measurementValue, time, 'P1', 'Raw');
                }
                else if (messages[i].measurementId === 4099) {
                    ngsild_payload[0].lightIntensity = ngsildInstance(messages[i].measurementValue, time, 'LUX', 'Raw');
                }
                else if (messages[i].measurementId === 4190) {
                    ngsild_payload[0].uvIndex = ngsildInstance(messages[i].measurementValue, time, null, 'Raw');
                }
                else if (messages[i].measurementId === 4105) {
                    ngsild_payload[0].windSpeed = ngsildInstance(messages[i].measurementValue, time, 'MTS', 'Raw');
                }
                else if (messages[i].measurementId === 4104) {
                    ngsild_payload[0].windDirection = ngsildInstance(messages[i].measurementValue, time, 'DD', 'Raw');
                }
                else if (messages[i].measurementId === 4113) {
                    ngsild_payload[0].rainfallIntensity = ngsildInstance(messages[i].measurementValue, time, 'H67', 'Raw');
                }
                else if (messages[i].measurementId === 4101) {
                    ngsild_payload[0].barometricPressure = ngsildInstance(messages[i].measurementValue, time, 'PAL', 'Raw');
                }
                else if (messages[i].measurementId === 4191) {
                    ngsild_payload[0].gustSpeed = ngsildInstance(messages[i].measurementValue, time, 'MTS', 'Raw');
                }
                else if (messages[i].measurementId === 4213) {
                    ngsild_payload[0].precipitation = ngsildInstance(messages[i].measurementValue, time, 'MMT', 'Raw');
                }
            }
            if (messages[i].type === 'upload_battery') {
                ngsild_payload[0].battery = ngsildInstance(messages[i].battery, time, 'P1', 'Raw');
            }
            if (messages[i].type === 'upload_interval') {
                ngsild_payload[0].interval = ngsildInstance(messages[i].interval, time, 'MIN', 'Raw');
            }
            if (messages[i].type === 'upload_version') {
                ngsild_payload[0].hardwareVersion = ngsildInstance(messages[i].hardwareVersion, time, null, null);
                ngsild_payload[0].softwareVersion = ngsildInstance(messages[i].softwareVersion, time, null, null);
            }
        }
    }
    return ngsild_payload;
}

function main() {
    var fport = process.argv[2];
    var bytes = Uint8Array.from(Buffer.from(process.argv[3], 'hex'));
    var time = process.argv[4];
    var entity_id = "urn:ngsi-ld:Device:" + process.argv[5];
    var decoded = Decode(fport, bytes);
    var ngsild_payload = ngsildWrapper(decoded, time, entity_id);
    process.stdout.write(JSON.stringify(ngsild_payload, null, 4));
}

if (require.main === module) {
    main();
}
