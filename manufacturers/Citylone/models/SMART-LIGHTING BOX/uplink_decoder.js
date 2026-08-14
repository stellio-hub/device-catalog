function u16le(bytes, offset) {
    return bytes[offset] | (bytes[offset + 1] << 8);
}

function u24le(bytes, offset) {
    return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function u32le(bytes, offset) {
    return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

function i8(value) {
    return value > 127 ? value - 256 : value;
}

function ascii(bytes, offset, length) {
    return Buffer.from(bytes.slice(offset, offset + length)).toString("ascii").replace(/\0/g, "").trim();
}

function hexVersion(value) {
    return "V" + ((value >> 4) & 0x0f) + "." + (value & 0x0f);
}

function contactState(value) {
    return value ? 1 : 0;
}

function decodeOutputs(stateByte, modeByte, decoded) {
    for (let i = 0; i < 4; i++) {
        decoded["s" + (i + 1) + "Status"] = (stateByte & (1 << i)) ? 1 : 0;
        decoded["s" + (i + 1) + "Mode"] = (modeByte & (1 << i)) ? "Priority" : "Auto";
    }
}

function decodeCoordinate(bytes, offset) {
    const raw = u32le(bytes, offset);
    const value = (raw & 0x7fffffff) / 1e6;
    return (raw & 0x80000000) ? -value : value;
}

function decodeUtcOffset(bytes, offset) {
    const utc = u16le(bytes, offset);
    const signBits = (utc >> 14) & 0x03;
    const hours = (utc >> 7) & 0x7f;
    const minutes = utc & 0x7f;
    const sign = signBits === 0x02 ? -1 : 1;
    return {
        utcOffsetHours: sign * hours,
        utcOffsetMinutes: minutes,
    };
}

const CALENDAR_STATUS = {
    1: "goodReception",
    2: "wrongReception",
    3: "storeCalendarOk",
    4: "calendarModifiedByBle",
};

const INTERNAL_FAILURE = {
    0: "none",
    1: "restartSpi",
    2: "restartSpiAndMainboard",
    3: "noBleAtStart",
    4: "resetMainboard",
    5: "rtcI2cProblem",
    6: "loraBusy",
    7: "uartBleKo",
    11: "loraSilenceFor3Days",
    12: "loraSafety",
    13: "timeRequestFailed",
};

const OPTARIF = {
    1: "BASE",
    2: "HC",
    3: "HP",
};

function decodeCalendarPair(bytes, offset, kind) {
    const word = u16le(bytes, offset);
    const selection = (word >> 14) & 0x03;
    const a = (word >> 7) & 0x7f;
    const b = word & 0x7f;

    if (selection === 1) {
        return { mode: "range", a: a, b: b };
    }
    if (selection === 2) {
        return { mode: "all" };
    }
    if (kind === "minutes" && (selection === 0 || selection === 3)) {
        const duskOffset = ((word >> 12) & 0x01 ? -1 : 1) * ((word >> 7) & 0x1f);
        const dawnOffset = ((word >> 6) & 0x01 ? -1 : 1) * (word & 0x3f);
        return {
            mode: selection === 0 ? "civilOffset" : "ephemerisOffset",
            duskOffset: duskOffset,
            dawnOffset: dawnOffset,
        };
    }
    if (kind === "hours" && selection === 3) {
        return { mode: "fixed", a: a, b: b };
    }
    return { mode: selection === 0 ? "unused" : String(selection), a: a, b: b };
}

function decodeCalendarOutput(value) {
    const selection = (value >> 6) & 0x03;
    if (selection === 2) {
        return "all";
    }
    if (selection === 1) {
        return "S" + ((value & 0x3f) + 1);
    }
    return "unused";
}

function decodeCalendarCommand(value) {
    if (value === 0) {
        return 0;
    }
    if (value >= 100) {
        return 1;
    }
    return value;
}

function decodeCalendarFeedback(bytes, decoded) {
    const info = bytes.slice(1);
    if (info.length === 0 || info.every((b) => b === 0)) {
        decoded.calendarEnd = true;
        return;
    }
    if (bytes.length < 16) {
        return;
    }
    decoded.calendarEnd = false;
    decoded.remainingCalendarFrames = bytes[13];
    decoded.calendarOutput = decodeCalendarOutput(bytes[14]);
    decoded.calendarCommand = decodeCalendarCommand(bytes[15]);
    decoded.calendarFeedback = {
        minutes: decodeCalendarPair(bytes, 1, "minutes"),
        hours: decodeCalendarPair(bytes, 3, "hours"),
        days: decodeCalendarPair(bytes, 5, "days"),
        weekdays: decodeCalendarPair(bytes, 7, "weekdays"),
        months: decodeCalendarPair(bytes, 9, "months"),
        years: decodeCalendarPair(bytes, 11, "years"),
        remainingFrames: bytes[13],
        output: decodeCalendarOutput(bytes[14]),
        command: decodeCalendarCommand(bytes[15]),
    };
    if (bytes.length >= 17) {
        decoded.calendarFeedback.totalFrames = bytes[16];
    }
}

function decodeTicIndexes(bytes, offset, decoded) {
    decoded.indexBase = u32le(bytes, offset);
    decoded.indexHchc = u32le(bytes, offset + 4);
    decoded.indexHchp = u32le(bytes, offset + 8);
}

function decodeTicTimestamped(bytes, decoded) {
    const threePhase = bytes[1] === 1;
    const optarif = bytes[2];
    decoded.phaseCount = threePhase ? 3 : 1;
    decoded.tariffOption = OPTARIF[optarif] || String(optarif);

    const hcHp = optarif === 2 || optarif === 3;
    let offset = 3;
    if (hcHp) {
        decoded.indexHchc = u32le(bytes, offset);
        offset += 4;
    } else {
        decoded.indexBase = u32le(bytes, offset);
        offset += 4;
    }
    decoded.apparentPower = u16le(bytes, offset);
    offset += 2;
    decoded.dc1 = contactState(bytes[offset++]);
    decoded.dc2 = contactState(bytes[offset++]);
    decoded.timestamp = u32le(bytes, offset);
    offset += 4;
    if (hcHp) {
        decoded.indexHchp = u32le(bytes, offset);
        offset += 4;
    }
    if (threePhase) {
        decoded.currentL1 = u16le(bytes, offset);
        decoded.currentL2 = u16le(bytes, offset + 2);
        decoded.currentL3 = u16le(bytes, offset + 4);
        offset += 6;
    } else {
        decoded.current = u16le(bytes, offset);
        offset += 2;
    }
    decoded.activePower = u16le(bytes, offset);
}

function Decode(fPort, bytes) {
    const decoded = {};
    if (!bytes || bytes.length === 0) {
        return decoded;
    }

    const frameId = bytes[0];
    decoded.frameId = frameId;

    switch (frameId) {
        case 0x01:
            if (bytes.length >= 13) {
                decodeTicIndexes(bytes, 1, decoded);
            }
            break;
        case 0x02:
            if (bytes.length >= 3) {
                decoded.dc1 = contactState(bytes[1]);
                decoded.dc2 = contactState(bytes[2]);
            }
            if (bytes.length >= 33) {
                decoded.meterId = ascii(bytes, 3, 13);
                decoded.tariffOption = ascii(bytes, 16, 5);
                decodeTicIndexes(bytes, 21, decoded);
            }
            break;
        case 0x03:
            if (bytes.length >= 23) {
                decoded.current = u16le(bytes, 1);
                decoded.currentL1 = u16le(bytes, 3);
                decoded.currentL2 = u16le(bytes, 5);
                decoded.currentL3 = u16le(bytes, 7);
                decoded.maxCurrent = u16le(bytes, 9);
                decoded.maxCurrentL1 = u16le(bytes, 11);
                decoded.maxCurrentL2 = u16le(bytes, 13);
                decoded.maxCurrentL3 = u16le(bytes, 15);
                decoded.maxActivePower = u16le(bytes, 17);
                decoded.subscribedPowerAlarm = u16le(bytes, 19);
                decoded.apparentPower = u16le(bytes, 21);
            }
            break;
        case 0x04:
            decoded.powerFailure = true;
            break;
        case 0x07:
            if (bytes.length >= 2) {
                decoded.dc1 = contactState(bytes[1]);
            }
            break;
        case 0x09:
            if (bytes.length >= 3) {
                decodeOutputs(bytes[1], bytes[2], decoded);
            }
            break;
        case 0x0b:
            if (bytes.length >= 2) {
                decoded.dc2 = contactState(bytes[1]);
            }
            break;
        case 0x0c:
            if (bytes.length >= 3) {
                decoded.softwareVersion = hexVersion(bytes[1]);
                decoded.firmwareVersion = hexVersion(bytes[2]);
            }
            break;
        case 0x0e:
            if (bytes.length >= 4) {
                decoded.rssi = -u16le(bytes, 1);
                decoded.snr = i8(bytes[3]);
            }
            break;
        case 0x0f:
            if (bytes.length >= 2) {
                decoded.calendarStatus = CALENDAR_STATUS[bytes[1]] || String(bytes[1]);
            }
            break;
        case 0x10:
            decodeCalendarFeedback(bytes, decoded);
            break;
        case 0x11:
            if (bytes.length >= 8) {
                decoded.timestamp = u32le(bytes, 1);
                Object.assign(decoded, decodeUtcOffset(bytes, 5));
                decoded.loraTimeUpdate = bytes[7] === 1;
            }
            break;
        case 0x12:
            if (bytes.length >= 9) {
                decoded.longitude = decodeCoordinate(bytes, 1);
                decoded.latitude = decodeCoordinate(bytes, 5);
            }
            break;
        case 0x13:
            if (bytes.length >= 2) {
                decoded.timeChangeEnabled = bytes[1] === 1;
            }
            break;
        case 0x21:
            if (bytes.length >= 2) {
                decoded.internalFailure = INTERNAL_FAILURE[bytes[1]] || String(bytes[1]);
            }
            break;
        case 0x22:
            if (bytes.length >= 13) {
                decoded.runHourS1 = u24le(bytes, 1);
                decoded.runHourS2 = u24le(bytes, 4);
                decoded.runHourS3 = u24le(bytes, 7);
                decoded.runHourS4 = u24le(bytes, 10);
            }
            break;
        case 0x23:
            if (bytes.length >= 7) {
                decodeOutputs(bytes[1], bytes[2], decoded);
                decoded.timestamp = u32le(bytes, 3);
            }
            break;
        case 0x24:
            if (bytes.length >= 6) {
                decoded.dc1 = contactState(bytes[1]);
                decoded.timestamp = u32le(bytes, 2);
            }
            break;
        case 0x25:
            if (bytes.length >= 6) {
                decoded.dc2 = contactState(bytes[1]);
                decoded.timestamp = u32le(bytes, 2);
            }
            break;
        case 0x26:
            if (bytes.length >= 19) {
                decodeTicTimestamped(bytes, decoded);
            }
            break;
        case 0x27:
            if (bytes.length >= 21) {
                decoded.meterId = ascii(bytes, 1, 13);
                decoded.tariffOption = ascii(bytes, 14, 5);
                decoded.maxActivePower = u16le(bytes, 19);
                decoded.maxCurrent = u16le(bytes, 21);
            }
            if (bytes.length >= 27) {
                decoded.maxCurrentL2 = u16le(bytes, 23);
                decoded.maxCurrentL3 = u16le(bytes, 25);
            }
            break;
        case 0x28:
            if (bytes.length >= 2) {
                decoded.dataModel = bytes[1] === 1 ? "timestamped" : "classical";
            }
            break;
        case 0x29:
            if (bytes.length >= 2) {
                decoded.calendarLocked = bytes[1] === 1;
            }
            break;
        case 0x2a:
            if (bytes.length >= 2) {
                decoded.timeBeforeRejoin = bytes[1];
            }
            break;
        default:
            break;
    }

    return decoded;
}

const parametersMapping = {
    s1Status: { label: "outputStatus", unitCode: null, datasetId: "S1:Raw" },
    s2Status: { label: "outputStatus", unitCode: null, datasetId: "S2:Raw" },
    s3Status: { label: "outputStatus", unitCode: null, datasetId: "S3:Raw" },
    s4Status: { label: "outputStatus", unitCode: null, datasetId: "S4:Raw" },
    s1Mode: { label: "outputMode", unitCode: null, datasetId: "S1:Raw" },
    s2Mode: { label: "outputMode", unitCode: null, datasetId: "S2:Raw" },
    s3Mode: { label: "outputMode", unitCode: null, datasetId: "S3:Raw" },
    s4Mode: { label: "outputMode", unitCode: null, datasetId: "S4:Raw" },
    dc1: { label: "digitalInput", unitCode: null, datasetId: "In1:Raw" },
    dc2: { label: "digitalInput", unitCode: null, datasetId: "In2:Raw" },
    indexBase: { label: "activeEnergy", unitCode: "WHR", datasetId: "BASE:Raw" },
    indexHchc: { label: "activeEnergy", unitCode: "WHR", datasetId: "HCHC:Raw" },
    indexHchp: { label: "activeEnergy", unitCode: "WHR", datasetId: "HCHP:Raw" },
    current: { label: "current", unitCode: "AMP", datasetId: "Raw" },
    currentL1: { label: "current", unitCode: "AMP", datasetId: "L1:Raw" },
    currentL2: { label: "current", unitCode: "AMP", datasetId: "L2:Raw" },
    currentL3: { label: "current", unitCode: "AMP", datasetId: "L3:Raw" },
    maxCurrent: { label: "current", unitCode: "AMP", datasetId: "Max:Raw" },
    maxCurrentL1: { label: "current", unitCode: "AMP", datasetId: "Max:L1:Raw" },
    maxCurrentL2: { label: "current", unitCode: "AMP", datasetId: "Max:L2:Raw" },
    maxCurrentL3: { label: "current", unitCode: "AMP", datasetId: "Max:L3:Raw" },
    apparentPower: { label: "apparentPower", unitCode: "D99", datasetId: "Raw" },
    activePower: { label: "activePower", unitCode: "WTT", datasetId: "Raw" },
    maxActivePower: { label: "activePower", unitCode: "WTT", datasetId: "Max:Raw" },
    subscribedPowerAlarm: { label: "subscribedPowerAlarm", unitCode: null, datasetId: "Raw" },
    powerFailure: { label: "powerFailure", unitCode: null, datasetId: null },
    softwareVersion: { label: "softwareVersion", unitCode: null, datasetId: null },
    firmwareVersion: { label: "firmwareVersion", unitCode: null, datasetId: null },
    rssi: { label: "rssi", unitCode: "DBM", datasetId: "Raw" },
    snr: { label: "snr", unitCode: "2N", datasetId: "Raw" },
    calendarStatus: { label: "calendarStatus", unitCode: null, datasetId: "Raw" },
    calendarEnd: { label: "calendarEnd", unitCode: null, datasetId: null },
    remainingCalendarFrames: { label: "remainingCalendarFrames", unitCode: null, datasetId: "Raw" },
    calendarOutput: { label: "calendarOutput", unitCode: null, datasetId: "Raw" },
    calendarCommand: { label: "calendarCommand", unitCode: null, datasetId: "Raw" },
    calendarFeedback: { label: "calendarFeedback", unitCode: null, datasetId: "Raw" },
    utcOffsetHours: { label: "utcOffset", unitCode: "HUR", datasetId: "Hours:Raw" },
    utcOffsetMinutes: { label: "utcOffset", unitCode: "MIN", datasetId: "Minutes:Raw" },
    loraTimeUpdate: { label: "loraTimeUpdate", unitCode: null, datasetId: null },
    timeChangeEnabled: { label: "timeChangeEnabled", unitCode: null, datasetId: null },
    internalFailure: { label: "internalFailure", unitCode: null, datasetId: "Raw" },
    runHourS1: { label: "runHour", unitCode: "HUR", datasetId: "S1:Raw" },
    runHourS2: { label: "runHour", unitCode: "HUR", datasetId: "S2:Raw" },
    runHourS3: { label: "runHour", unitCode: "HUR", datasetId: "S3:Raw" },
    runHourS4: { label: "runHour", unitCode: "HUR", datasetId: "S4:Raw" },
    meterId: { label: "meterId", unitCode: null, datasetId: null },
    tariffOption: { label: "tariffOption", unitCode: null, datasetId: null },
    phaseCount: { label: "phaseCount", unitCode: null, datasetId: null },
    dataModel: { label: "dataModel", unitCode: null, datasetId: null },
    calendarLocked: { label: "calendarLocked", unitCode: null, datasetId: null },
    timeBeforeRejoin: { label: "timeBeforeRejoin", unitCode: "DAY", datasetId: "Raw" },
    latitude: { label: "latitude", unitCode: "DEG", datasetId: "Raw" },
    longitude: { label: "longitude", unitCode: "DEG", datasetId: "Raw" },
};

function ngsildInstance(value, time = null, unitCode = null, datasetSuffix = null) {
    const instance = {
        type: "Property",
        value: value,
    };
    if (time) {
        instance.observedAt = time;
    }
    if (unitCode) {
        instance.unitCode = unitCode;
    }
    if (datasetSuffix) {
        instance.datasetId = "urn:ngsi-ld:Dataset:" + datasetSuffix;
    }
    return instance;
}

function ngsildWrapper(decoded, time, entityId) {
    const ngsildPayload = [{
        id: entityId,
        type: "Device",
    }];

    function addToPayload(key, instance) {
        const entity = ngsildPayload[0];
        if (!entity[key]) {
            entity[key] = instance;
            return;
        }
        if (!Array.isArray(entity[key])) {
            entity[key] = [entity[key]];
        }
        const existing = entity[key].map((item) => item.datasetId);
        if (!existing.includes(instance.datasetId)) {
            entity[key].push(instance);
        }
    }

    if (decoded.timestamp) {
        time = new Date(decoded.timestamp * 1000).toISOString().split(".")[0] + "Z";
    }

    let latitude = null;
    let longitude = null;

    for (const key of Object.keys(decoded)) {
        if (!parametersMapping[key]) {
            continue;
        }
        if (key === "latitude") {
            latitude = decoded[key];
        } else if (key === "longitude") {
            longitude = decoded[key];
        } else {
            const mapped = parametersMapping[key];
            addToPayload(mapped.label, ngsildInstance(decoded[key], time, mapped.unitCode, mapped.datasetId));
        }
    }

    if (latitude !== null && longitude !== null) {
        addToPayload("location", {
            type: "GeoProperty",
            value: {
                type: "Point",
                coordinates: [longitude, latitude],
            },
            observedAt: time,
        });
    }

    return ngsildPayload;
}

function main() {
    const fPort = process.argv[2];
    const payload = Buffer.from(process.argv[3], "hex");
    const time = process.argv[4];
    const entityId = "urn:ngsi-ld:Device:" + process.argv[5];
    const decoded = Decode(fPort, payload);
    const ngsildPayload = ngsildWrapper(decoded, time, entityId);
    process.stdout.write(JSON.stringify(ngsildPayload, null, 2));
}

if (require.main === module) {
    main();
}
