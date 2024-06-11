/*
 * VERSION: 1.0.0
 * 
 * INPUT:
 * payload          -> Time Sync payload
 * 
 * OUTPUT:
 * syncID           -> id of sync request
 * syncVersion      -> major, minor and build version
 * applicationType  -> sensor type
 * rfu              -> future use bytes
 */
function parseTimeSync(payload) {
    const uplinkId = payload.substring(0, 2);
    if (uplinkId.toUpperCase() === '01') {
        const syncID = {
            variable: 'syncID',
            value: payload.substring(2, 10)
        };
        const syncVersion = {
            variable: 'syncVersion',
            value: payload.substring(10, 12) + "." + payload.substring(12, 14) + "." + payload.substring(14, 16)
        };
        const applicationType = {
            variable: 'applicationType',
            value: payload.substring(16, 20)
        };
        const rfu = {
            variable: 'rfu',
            value: payload.substring(20)
        };

        return [
            syncID,
            syncVersion,
            applicationType,
            rfu
        ];
    } else {
        return null;
    }
}

/*
 * VERSION: 1.0.0
 * 
 * INPUT:
 * payload  -> MCF-LW12TER / MCF-LW12TERWP payload
 * 
 * OUTPUT:
 * m1       -> first measurement. See @parseTERMeasurement
 * m2       -> second measurement. See @parseTERMeasurement
 * m3       -> third measurement. See @parseTERMeasurement
 * battery  -> percentage of sensor battery
 * rfu      -> future use bytes
 */
function parseTER(payload) {
    const uplinkId = payload.substring(0, 2);
    if (uplinkId.toUpperCase() === '04' && payload.length >= 62) {
        const m1 = parseTERMeasurement(payload.substring(2, 22));
        const m2 = parseTERMeasurement(payload.substring(22, 42));
        const m3 = parseTERMeasurement(payload.substring(42, 62));
        const battery = {
            variable: 'battery',
            value: Number(parseInt(payload.substring(62, 64), 16)).toFixed(),
            unit: '%'
        };
        const rfu = {
            variable: 'rfu',
            value: payload.substring(64)
        };
        return [
            ...m1,
            ...m2,
            ...m3,
            battery,
            rfu
        ];
    } else if (uplinkId.toUpperCase() === '04' && (payload.length >= 42 && payload.length <= 52)) {
        const m1 = parseTERMeasurement(payload.substring(2, 22));
        const m2 = parseTERMeasurement(payload.substring(22, 42));
        const battery = {
            variable: 'battery',
            value: Number(parseInt(payload.substring(42, 44), 16)).toFixed(),
            unit: '%'
        };
        const rfu = {
            variable: 'rfu',
            value: payload.substring(44)
        };
        return [
            ...m1,
            ...m2,
            battery,
            rfu
        ];
    } else if (uplinkId.toUpperCase() === '04' && (payload.length >= 22 && payload.length <= 32)) {
        const m1 = parseTERMeasurement(payload.substring(2, 22));
        const battery = {
            variable: 'battery',
            value: Number(parseInt(payload.substring(22, 24), 16)).toFixed(),
            unit: '%'
        };
        const rfu = {
            variable: 'rfu',
            value: payload.substring(24)
        };
        return [
            ...m1,
            battery,
            rfu
        ];
    } else {
        return null;
    }
}

/*
 * VERSION: 1.0.0
 * 
 * INPUT:
 * payload      -> payload substring of measurement
 * 
 * OUTPUT:
 * date         -> date of measurement. See @parseDate
 * temperature  -> temperature in °C. See @getTemperature
 * humidity     -> percentage of humidity. See @getHumidity
 * pressure     -> pressure in hPa. See @getPressure
 */
function parseTERMeasurement(payload) {
    const date = {
        variable: 'date',
        value: parseDate(payload.substring(0, 8))
    };

    const temperature = {
        variable: 'temperature',
        value: getTemperature(
                parseInt(payload.substring(8, 10), 16),
                parseInt(payload.substring(10, 12), 16)
                ),
        unit: '°C'
    };
    const humidity = {
        variable: 'humidity',
        value: getHumidity(
                parseInt(payload.substring(12, 14), 16)
                ),
        unit: '%'
    };
    const pressure = {
        variable: 'pressure',
        value: getPressure(
                parseInt(payload.substring(14, 16), 16),
                parseInt(payload.substring(16, 18), 16),
                parseInt(payload.substring(18, 20), 16)
                ),
        unit: 'hPa'
    };

    return [
        date,
        temperature,
        humidity,
        pressure
    ];
}

/*
 * VERSION: 1.0.0
 * 
 * INPUT:
 * payload  -> payload substring to decode
 * 
 * OUTPUT:
 * date     -> date decoded from payload
 */
function parseDate(payload) {
    var date = new Date();

    var binary = Number(parseInt(reverseBytes(payload), 16)).toString(2).padStart(32, '0');
    var year = parseInt(binary.substring(0, 7), 2) + 2000;
    var month = parseInt(binary.substring(7, 11), 2);
    var day = parseInt(binary.substring(11, 16), 2);
    var hour = parseInt(binary.substring(16, 21), 2);
    var minute = parseInt(binary.substring(21, 27), 2);
    var second = parseInt(binary.substring(27, 32), 2) * 2;

    date = new Date(year, month - 1, day, hour, minute, second, 0).toLocaleString();
    return date;
}

/*
 * VERSION: 1.0.0
 * 
 * INPUT:
 * lo       -> payload substring for humidity byte
 * 
 * OUTPUT:
 * humidity -> percentage of humidity 
 */
function getHumidity(lo) {
    var humidity = (((((0 & 0xFF) << 8) | (lo & 0xFF)) << 16) >> 16) / 2;
    return Number(humidity).toFixed(2);
}

"use strict";

/*
 * VERSION: 1.0.1
 * 
 * INPUT:
 * lo       -> payload substring of first pressure byte
 * mi       -> payload substring of second pressure byte
 * hi       -> payload substring of third pressure byte
 * 
 * OUTPUT:
 * pressure -> pressure in hPa
 */
function getPressure(lo, mi, hi) {
    var pressure = String((lo & 0xFF) + ((mi << 8) & 0xFF00) + ((hi << 16) & 0xFF0000)).padStart(3);
    pressure = pressure.substring(0, pressure.length - 2) + "." + pressure.substring(pressure.length - 2);
    pressure = pressure.replace(" ", "0");
    return Number(pressure).toFixed(2);
}


"use strict";

/*
 * VERSION: 1.0.1
 * 
 * INPUT:
 * lo           -> payload substring of first temperature byte
 * hi           -> payload substring of second temperature byte
 * 
 * OUTPUT:
 * temperature  -> temperature in °C
 */
function getTemperature(lo, hi) {
    var temperature = String((((lo & 0xFF) + ((hi << 8) & 0xFF00)) << 16) >> 16).padStart(3).trim();
    if (temperature < 0 && temperature.trim().substring(1).length <= 1) {
        temperature = "-00" + temperature.substring(1);
    }
    temperature = temperature.substring(0, temperature.length - 2) + "." + temperature.substring(temperature.length - 2);
    return Number(temperature).toFixed(2);
}

/*
 * VERSION: 1.0.0
 * 
 * INPUT:
 * bytes    -> string of bytes to invert for LSB
 * 
 * OUTPUT:
 * reversed -> reversed string of bytes in LSB
 */
function reverseBytes(bytes) {
    var reversed = bytes;
    if (bytes.length % 2 === 0) {
        reversed = "";
        for (var starting = 0; starting + 2 <= bytes.length; starting += 2) {
            reversed = bytes.substring(starting, starting + 2) + reversed;
        }
    }
    return reversed;
}

function decode(payload)
{
    const uplinkId = payload.substring(0, 2);
    switch(uplinkId){
            case '01':
                return parseTimeSync(payload);

            case '04':
                return parseTER(payload);

            default:
                break;
    }
    return null
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

function ngsildWrapper(input, time) {

    let ngsild_payload = {};
    let temperature_data = [];
    let humidity_data = [];
    let pressure_data = [];
    input.forEach(item => {
        if(item.variable == 'date')
        {
            time = new Date(item.value);
        }
        if(item.variable == 'syncID')
        {
            ngsild_payload.syncID = ngsildInstance(item.value, 
                                                   time, 
                                                   null, 
                                                   null);
        }
        if(item.variable == 'syncVersion')
        {
            ngsild_payload.syncVersion = ngsildInstance(item.value, 
                                                        time, 
                                                        null, 
                                                        null);
        }
        if(item.variable == 'applicationType')
        {
            ngsild_payload.applicationType = ngsildInstance(item.value, 
                                                            time, 
                                                            null, 
                                                            null);
        }
        if(item.variable == 'temperature')
        {
            temperature_data.push(ngsildInstance(parseFloat(item.value), 
                                                 time, 
                                                 'CEL', 
                                                 'Raw'));
        }
        if(item.variable == 'humidity')
        {
            humidity_data.push(ngsildInstance(parseFloat(item.value), 
                                              time, 
                                              'P1', 
                                              'Raw'));
        }
        if(item.variable == 'pressure')
        {
            pressure_data.push(ngsildInstance(parseFloat(item.value), 
                                              time, 
                                              'A97', 
                                              'Raw'));
        }
    });

    if(temperature_data.length != 0)
    {
        ngsild_payload.temperature = temperature_data;
    }
    if(humidity_data.length != 0)
    {
        ngsild_payload.humidity = humidity_data;
    }
    if(pressure_data.length != 0)
    {
        ngsild_payload.pressure = pressure_data;
    }
    return ngsild_payload;
}

function main() {
    var payload = process.argv[3];
    var time = process.argv[4];
    var decoded = decode(payload);
    var ngsild_payload = ngsildWrapper(decoded, time);
    process.stdout.write(JSON.stringify(ngsild_payload));
}

if (require.main === module) {
    main();
}