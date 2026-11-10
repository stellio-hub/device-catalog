// Nexelec Insafe+ Carbon LoRa uplink decoder.
// Reference: D678I Insafe+ Carbon LoRa Technical Guide (revision I), section 5.

const PRODUCT_TYPE_CARBON = 0x7;
const ERROR_VALUE = 255;

const MESSAGE_TYPES = {
    0x2: "Real_Time",
    0x3: "Product_Status_Message",
    0x4: "Push",
    0x5: "Datalog",
    0x6: "Temperature_Alert",
    0x7: "CO2_Alert",
    0x8: "Config_CO2",
    0x9: "Config_General",
    0xA: "Keep_Alive",
};

const IAQ_LEVELS = ["Excellent", "Good", "Fair", "Poor", "Bad", "Reserved", "Reserved", "Error"];
const IAQ_SOURCES = { 0: "All", 1: "Drought_index", 2: "Mold_index", 3: "Mite_index", 4: "CO", 5: "CO2", 15: "Error" };
const HCI_LEVELS = ["Good", "Fair", "Poor", "Error"];
const BATTERY_LEVELS = ["High", "Medium", "Low", "Critical"];
const BATTERY_SCALE5 = { High: 4, Medium: 3, Low: 2, Critical: 1 };
const BUTTON_PRESS_TYPES = ["Short_press", "Reserved", "Reserved", "Reserved", "Reserved", "Reserved", "Reserved", "Reserved"];
const NFC_STATUSES = ["Discoverable", "Not_Discoverable", "RFU", "RFU"];
const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Reads consecutive MSB-first bit fields of the given sizes from a byte array.
function readBitFields(bytes, sizes) {
    const values = [];
    let bitOffset = 0;
    for (const size of sizes) {
        let value = 0;
        for (let k = 0; k < size; k++, bitOffset++) {
            const byte = bytes[bitOffset >> 3] || 0;
            const bit = (byte >> (7 - (bitOffset & 7))) & 1;
            value = (value << 1) | bit;
        }
        values.push(value);
    }
    return values;
}

function round1(value) {
    return Math.round(value * 10) / 10;
}

// Linear 8-bit value where 255 means sensor error; returns null on error.
function scaled(raw, step) {
    return raw === ERROR_VALUE ? null : round1(raw * step);
}

function active(bit) {
    return bit ? "Active" : "Non-Active";
}

function reached(bit) {
    return bit ? "reached" : "not reached";
}

function decodeRealTime(bytes) {
    const f = readBitFields(bytes, [4, 4, 8, 8, 8, 3, 4, 3, 3, 3, 3, 2, 3]);
    return {
        CO2_concentration: scaled(f[2], 20),
        Temperature: scaled(f[3], 0.2),
        Relative_Humidity: scaled(f[4], 0.5),
        IAQ_GLOBAL: IAQ_LEVELS[f[5]],
        IAQ_SRC: IAQ_SOURCES[f[6]] || "Reserved",
        IAQ_CO2: IAQ_LEVELS[f[7]],
        IAQ_DRY: IAQ_LEVELS[f[8]],
        IAQ_MOULD: IAQ_LEVELS[f[9]],
        IAQ_DM: IAQ_LEVELS[f[10]],
        IAQ_HCI: HCI_LEVELS[f[11]],
        Frame_Index: f[12],
    };
}

function decodeProductStatus(bytes) {
    const f = readBitFields(bytes, [4, 4, 2, 1, 3, 1, 1, 8, 8, 6, 4, 5, 5, 6, 6]);
    return {
        Battery_level: BATTERY_LEVELS[f[2]],
        HW_Fault_mode: f[3] ? "Hardware_fault" : "Hardware_OK",
        Frame_Index: f[4],
        Pending_Join: f[5] ? "Join_request_scheduled" : "No_join_request_scheduled",
        Product_hours_meter_per_month: f[7] === ERROR_VALUE ? null : f[7],
        CO2_autocalibration_value_ppm: scaled(f[8], 20),
        Product_RTC_date_since_2000_in_years: f[9],
        Product_RTC_date_Month_of_the_year: f[10],
        Product_RTC_date_Day_of_the_month: f[11],
        Product_RTC_date_Hours_of_the_day: f[12],
        Product_RTC_date_Minutes_of_the_hour: f[13],
    };
}

function decodePush(bytes) {
    const f = readBitFields(bytes, [4, 4, 3, 3, 2]);
    return {
        Push_Button_Action: BUTTON_PRESS_TYPES[f[2]],
        Frame_Index: f[3],
    };
}

function decodeDatalog(bytes) {
    const f = readBitFields(bytes, [4, 4, 8, 8, 8, 8, 8, 8, 8, 8, 8, 4, 3, 1]);
    return {
        "CO2_concentration_n-2": scaled(f[2], 20),
        "Temperature_n-2": scaled(f[3], 0.2),
        "Relative_Humidity_n-2": scaled(f[4], 0.5),
        "CO2_concentration_n-1": scaled(f[5], 20),
        "Temperature_n-1": scaled(f[6], 0.2),
        "Relative_Humidity_n-1": scaled(f[7], 0.5),
        CO2_concentration_n: scaled(f[8], 20),
        Temperature_n: scaled(f[9], 0.2),
        Relative_Humidity_n: scaled(f[10], 0.5),
        Time_between_measurements_in_minutes: 10 * f[11],
        Frame_Index: f[12],
    };
}

function decodeTemperatureAlert(bytes) {
    const f = readBitFields(bytes, [4, 4, 8, 1, 1, 3, 3]);
    return {
        Temperature: scaled(f[2], 0.2),
        Temperature_threshold_1: reached(f[3]),
        Temperature_threshold_2: reached(f[4]),
        Frame_Index: f[5],
    };
}

function decodeCo2Alert(bytes) {
    const f = readBitFields(bytes, [4, 4, 8, 3, 1, 1, 3]);
    return {
        CO2_concentration: scaled(f[2], 20),
        Frame_Index: f[3],
        CO2_threshold_1: reached(f[4]),
        CO2_threshold_2: reached(f[5]),
    };
}

function decodeConfigCo2(bytes) {
    const f = readBitFields(bytes, [4, 4, 8, 8, 6, 6, 6, 6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8]);
    const config = {
        CO2_threshold_1: scaled(f[2], 20),
        CO2_threshold_2: scaled(f[3], 20),
        Smart_Period_1_start_at_in_hour: 0.5 * f[4],
        Smart_Period_1_duration_in_hour: 0.5 * f[5],
        Smart_Period_2_start_at_in_hour: 0.5 * f[6],
        Smart_Period_2_duration_in_hour: 0.5 * f[7],
    };
    [1, 2].forEach((period, p) => {
        const base = 8 + 8 * p;
        config[`Smart_Period_${period}`] = active(f[base]);
        WEEK_DAYS.forEach((day, d) => {
            config[`Smart_Period_${period}_on_${day}`] = active(f[base + 1 + d]);
        });
    });
    config.Altitude = 50 * f[24];
    return config;
}

function decodeConfigGeneral(bytes) {
    const f = readBitFields(bytes, [4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 8, 8, 8, 8, 8, 8, 8, 8, 8, 2, 6]);
    return {
        LED_blink: active(f[2]),
        Button_Notification: active(f[3]),
        "Real-time_data": active(f[4]),
        Datalog_enable: active(f[5]),
        Temperature_Alert: active(f[6]),
        CO2_Alert: active(f[7]),
        Keep_Alive: active(f[8]),
        Orange_Led: active(f[9]),
        Period_between_measurements_CO2_temperature_humidity_minutes: f[10] === ERROR_VALUE ? null : f[10],
        Datalog_decimation_factor_record_only_1_on_x_samples: f[11],
        Temperature_alert_threshold_1: scaled(f[12], 0.2),
        Temperature_alert_threshold_2: scaled(f[13], 0.2),
        "Temperature_change_leading_to_a_real-time_message_transmission": scaled(f[14], 0.1),
        "Relative_humidity_change_leading_to_a_real-time_message_transmission": scaled(f[15], 0.5),
        "CO2_concentration_change_leading_to_a_real-time_message_transmission": scaled(f[16], 20),
        Keepalive_period_hours: f[17],
        SW_Version: f[18],
        NFC_status: NFC_STATUSES[f[19]],
        "Real-time_message_sending_period_minutes": 10 * f[20],
    };
}

const DECODERS = {
    Real_Time: decodeRealTime,
    Product_Status_Message: decodeProductStatus,
    Push: decodePush,
    Datalog: decodeDatalog,
    Temperature_Alert: decodeTemperatureAlert,
    CO2_Alert: decodeCo2Alert,
    Config_CO2: decodeConfigCo2,
    Config_General: decodeConfigGeneral,
    Keep_Alive: () => ({}),
};

// Decodes a raw frame into a flat object { Type_of_message, ...fields }.
function decodePayload(bytes) {
    if (!bytes || bytes.length === 0) {
        throw new Error("Empty payload");
    }
    const [productType, messageTypeId] = readBitFields(bytes, [4, 4]);
    if (productType !== PRODUCT_TYPE_CARBON) {
        throw new Error(`Unsupported product type: 0x${productType.toString(16)}`);
    }
    const messageType = MESSAGE_TYPES[messageTypeId];
    if (!messageType) {
        throw new Error("Unsupported Type_of_message");
    }
    return Object.assign({ Type_of_message: messageType }, DECODERS[messageType](bytes));
}

// The Things Stack (v3) entry point.
function decodeUplink(input) {
    return { data: decodePayload(input.bytes) };
}

function ngsildInstance(value, time, unit, datasetSuffix) {
    const instance = {
        type: "Property",
        value: value,
        observedAt: time,
    };
    if (unit) {
        instance.unitCode = unit;
    }
    if (datasetSuffix) {
        instance.datasetId = "urn:ngsi-ld:Dataset:" + datasetSuffix;
    }
    return instance;
}

// Adds the CO2 / temperature / humidity measurements, skipping the ones flagged in error.
function addMeasurements(entity, co2, temperature, humidity, time) {
    if (co2 !== null) entity.co2 = ngsildInstance(co2, time, "59", "Raw");
    if (temperature !== null) entity.temperature = ngsildInstance(temperature, time, "CEL", "Raw");
    if (humidity !== null) entity.humidity = ngsildInstance(humidity, time, "P1", "Raw");
    return entity;
}

function minutesBefore(time, minutes) {
    return new Date(new Date(time).getTime() - minutes * 60 * 1000).toISOString();
}

function rtcToIso(status) {
    const y = status.Product_RTC_date_since_2000_in_years;
    const m = status.Product_RTC_date_Month_of_the_year;
    const d = status.Product_RTC_date_Day_of_the_month;
    const h = status.Product_RTC_date_Hours_of_the_day;
    const mn = status.Product_RTC_date_Minutes_of_the_hour;
    if (m < 1 || m > 12 || d < 1 || d > 31 || h > 23 || mn > 59) {
        return null;
    }
    return new Date(Date.UTC(2000 + y, m - 1, d, h, mn, 0)).toISOString();
}

function ngsildWrapper(payload, time, entityId) {
    const entity = { id: entityId, type: "Device" };
    const { Type_of_message: messageType, ...fields } = payload;

    switch (messageType) {
        case "Real_Time":
            addMeasurements(entity, fields.CO2_concentration, fields.Temperature, fields.Relative_Humidity, time);
            entity.indoorAirQuality = [
                ngsildInstance(fields.IAQ_GLOBAL, time, null, "Global"),
                ngsildInstance(fields.IAQ_CO2, time, null, "co2"),
                ngsildInstance(fields.IAQ_DRY, time, null, "Drought_index"),
                ngsildInstance(fields.IAQ_MOULD, time, null, "Mold_index"),
                ngsildInstance(fields.IAQ_DM, time, null, "Mite_index"),
                ngsildInstance(fields.IAQ_HCI, time, null, "Hygrothermal_comfort"),
            ];
            entity.indoorAirQualitySource = ngsildInstance(fields.IAQ_SRC, time, null, null);
            entity.frameIndex = ngsildInstance(fields.Frame_Index, time, null, null);
            return [entity];

        case "Datalog": {
            const interval = fields.Time_between_measurements_in_minutes;
            const timeN1 = minutesBefore(time, interval);
            const timeN2 = minutesBefore(time, 2 * interval);
            return [
                addMeasurements({ id: entityId, type: "Device" },
                    fields.CO2_concentration_n, fields.Temperature_n, fields.Relative_Humidity_n, time),
                addMeasurements({ id: entityId, type: "Device" },
                    fields["CO2_concentration_n-1"], fields["Temperature_n-1"], fields["Relative_Humidity_n-1"], timeN1),
                addMeasurements({ id: entityId, type: "Device" },
                    fields["CO2_concentration_n-2"], fields["Temperature_n-2"], fields["Relative_Humidity_n-2"], timeN2),
            ];
        }

        case "Config_General":
            entity.configGeneral = ngsildInstance(fields, time, null, null);
            return [entity];

        case "Config_CO2":
            entity.co2Config = ngsildInstance(fields, time, null, null);
            return [entity];

        case "Product_Status_Message": {
            const { Battery_level: batteryLabel, ...status } = fields;
            entity.productStatusMessage = ngsildInstance(status, time, null, null);
            entity.batteryLevel = [
                ngsildInstance(batteryLabel, time, null, "qualitative"),
                ngsildInstance(BATTERY_SCALE5[batteryLabel], time, null, "scale5"),
            ];
            entity.productRtc = ngsildInstance(rtcToIso(status), time, null, null);
            return [entity];
        }

        case "Push":
            entity.buttonActivation = ngsildInstance(1, time, null, null);
            entity.buttonPressType = ngsildInstance(fields.Push_Button_Action, time, null, null);
            entity.frameIndex = ngsildInstance(fields.Frame_Index, time, null, null);
            return [entity];

        case "Keep_Alive":
            return [entity];

        case "Temperature_Alert": {
            const alertActive = fields.Temperature_threshold_1 === "reached" || fields.Temperature_threshold_2 === "reached";
            entity.temperatureAlert = ngsildInstance(alertActive ? 1 : 0, time, null, null);
            if (fields.Temperature !== null) {
                entity.temperature = ngsildInstance(fields.Temperature, time, "CEL", "Raw");
            }
            entity.temperatureThreshold1 = ngsildInstance(fields.Temperature_threshold_1, time, null, null);
            entity.temperatureThreshold2 = ngsildInstance(fields.Temperature_threshold_2, time, null, null);
            entity.frameIndex = ngsildInstance(fields.Frame_Index, time, null, null);
            return [entity];
        }

        case "CO2_Alert": {
            const alertActive = fields.CO2_threshold_1 === "reached" || fields.CO2_threshold_2 === "reached";
            entity.co2Alert = ngsildInstance(alertActive ? 1 : 0, time, null, null);
            if (fields.CO2_concentration !== null) {
                entity.co2 = ngsildInstance(fields.CO2_concentration, time, "59", "Raw");
            }
            entity.frameIndex = ngsildInstance(fields.Frame_Index, time, null, null);
            entity.co2Threshold1 = ngsildInstance(fields.CO2_threshold_1, time, null, null);
            entity.co2Threshold2 = ngsildInstance(fields.CO2_threshold_2, time, null, null);
            return [entity];
        }

        default:
            throw new Error("Unsupported Type_of_message");
    }
}

function main() {
    const bytes = Uint8Array.from(Buffer.from(process.argv[3], "hex"));
    const time = process.argv[4];
    const entityId = "urn:ngsi-ld:Device:" + process.argv[5];
    const ngsildPayload = ngsildWrapper(decodePayload(bytes), time, entityId);
    console.log(JSON.stringify(ngsildPayload, null, 2));
}

if (require.main === module) {
    main();
}

module.exports = { decodePayload, decodeUplink, ngsildWrapper };
