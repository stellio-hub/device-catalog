/*
 * Ewattch LoRaWAN uplink decoder.
 * Implements the frame and object formats documented by Ewattch, including
 * the complete SQUID / SQUID V2 / SQUID PRO electrical measurement set.
 */

"use strict";

function signed16(value) {
    return value & 0x8000 ? value - 0x10000 : value;
}

function signed24(value) {
    return value & 0x800000 ? value - 0x1000000 : value;
}

function uint16(bytes, offset) {
    return bytes[offset] | (bytes[offset + 1] << 8);
}

function uint24(bytes, offset) {
    return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function measurement(type, value, unit, socket, channel, uuidPrefix) {
    return {
        type,
        hardwareData: { socket, channel },
        uuid: `${uuidPrefix}_s${socket}_c${channel}`,
        value,
        unit
    };
}

function parseEnergy(bytes, offset, socket, channel) {
    const descriptor = bytes[offset++];
    const count = descriptor >> 4;
    const code = descriptor & 0x0f;
    const values = [];
    const definitions = {
        0: ["currentIndex", 10, "mAh", 3, false],
        1: ["current", 1, "mA", 3, false],
        3: ["consumedActiveEnergyIndex", 10, "Wh", 3, false],
        4: ["power", 1, "W", 3, true],
        5: ["producedActiveEnergyIndex", 10, "Wh", 3, false],
        6: ["positiveReactiveEnergyIndex", 10, "varh", 3, false],
        7: ["negativeReactiveEnergyIndex", 10, "varh", 3, false],
        8: ["reactivePower", 1, "var", 3, true],
        9: ["apparentEnergyIndex", 10, "VAh", 3, false],
        10: ["voltage", 0.1, "V", 2, false],
        11: ["apparentPower", 1, "VA", 3, false],
        12: ["frequency", 0.01, "Hz", 2, false]
    };

    function readSeries(definition, seriesType) {
        const [, factor, unit, size, signed] = definition;
        for (let i = 0; i < count; i++) {
            if (offset + size > bytes.length) throw new Error("Truncated electrical measurement");
            let raw = size === 2 ? uint16(bytes, offset) : uint24(bytes, offset);
            if (signed && size === 3) raw = signed24(raw);
            values.push(measurement(seriesType, raw * factor, unit, socket, channel + i, "clamp"));
            offset += size;
        }
    }

    if (code === 2) {
        readSeries(definitions[0], "currentIndex");
        readSeries(definitions[1], "current");
    } else {
        const definition = definitions[code];
        if (!definition) throw new Error(`Unknown electrical measurement code: ${code}`);
        readSeries(definition, definition[0]);
    }
    return { values, offset };
}

function parsePeriodic(bytes) {
    const data = [];
    let offset = 0;
    const simpleObjects = {
        0x00: [2, "temperature", 0.01, "°C", true],
        0x02: [1, "iaq", 2, "", false],
        0x04: [1, "humidity", 0.5, "%RH", false],
        0x06: [2, "atmosphericPressure", 5, "Pa", false],
        0x08: [2, "co2", 1, "ppm", false],
        0x0a: [2, "equivalentCo2", 1, "ppm", false],
        0x0c: [2, "counter", 1, "", false],
        0x0e: [3, "duration", 1, "s", false],
        0x10: [2, "luminosity", 1, "lx", false],
        0x12: [1, "motion", 1, "", false],
        0x14: [2, "motionDuration", 10, "s", false]
    };

    while (offset < bytes.length) {
        const objectByte = bytes[offset++];
        const error = Boolean(objectByte & 0x80);
        const indexed = Boolean(objectByte & 0x01);
        const objectCode = objectByte & 0x7e;
        let socket = 0;
        let channel = 0;
        if (indexed) {
            if (offset >= bytes.length) throw new Error("Missing object index");
            socket = bytes[offset] >> 5;
            channel = bytes[offset] & 0x1f;
            offset++;
        }
        if (error) {
            if (offset >= bytes.length) throw new Error("Missing object error code");
            data.push({ type: "error", value: bytes[offset++], hardwareData: { socket, channel } });
            continue;
        }
        if (objectCode === 0x40) {
            const parsed = parseEnergy(bytes, offset, socket, channel);
            data.push(...parsed.values);
            offset = parsed.offset;
            continue;
        }
        if (objectCode === 0x48) {
            for (let i = 0; i < 12; i++) {
                if (offset + 3 > bytes.length) throw new Error("Truncated SQUID current index");
                data.push(measurement("currentIndex", uint24(bytes, offset) * 0.01, "Ah", socket, channel + i, "clamp"));
                offset += 3;
            }
            continue;
        }
        if (objectCode === 0x44 || objectCode === 0x46) {
            if (offset + 4 > bytes.length) throw new Error("Truncated energy index");
            const value = (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
            const type = objectCode === 0x44 ? "activeEnergyIndex" : "reactiveEnergyIndex";
            const unit = objectCode === 0x44 ? "kWh" : "kvarh";
            data.push(measurement(type, value, unit, socket, channel, type));
            offset += 4;
            continue;
        }
        const definition = simpleObjects[objectCode];
        if (!definition) throw new Error(`Unknown periodic object type: 0x${objectCode.toString(16).padStart(2, "0")}`);
        const [size, type, factor, unit, signed] = definition;
        if (offset + size > bytes.length) throw new Error(`Truncated ${type} object`);
        let raw = size === 1 ? bytes[offset] : size === 2 ? uint16(bytes, offset) : uint24(bytes, offset);
        if (signed && size === 2) raw = signed16(raw);
        data.push(measurement(type, raw * factor, unit, socket, channel, type));
        offset += size;
    }
    return data;
}

function parseStatus(bytes) {
    const data = [];
    let offset = 0;
    const nodeTypes = {
        0x00: "environment", 0x01: "presence", 0x02: "ambiance", 0x03: "ambianceV2",
        0x08: "squid", 0x09: "squidV2OrPro", 0x10: "impulse", 0x20: "tyness", 0x28: "tynode"
    };
    while (offset < bytes.length) {
        const code = bytes[offset++];
        if (code === 0x00) {
            data.push({ type: "nodeType", value: nodeTypes[bytes[offset]] || `unknown:${bytes[offset]}` });
            offset += 1;
        } else if (code === 0x01) {
            const size = bytes[offset++];
            const raw = bytes.slice(offset, offset + size);
            if (raw.length !== size) throw new Error("Truncated hardware profile");
            data.push({ type: "hardwareProfile", value: Buffer.from(raw).toString("hex") });
            offset += size;
        } else if (code === 0x02) {
            if (offset + 2 > bytes.length) throw new Error("Truncated firmware version");
            data.push({ type: "version", value: `${bytes[offset + 1]}.${bytes[offset]}` });
            offset += 2;
        } else if (code === 0x04) {
            data.push({ type: "batteryLevel", value: bytes[offset++] });
        } else if (code === 0x08) {
            if (offset + 2 > bytes.length) throw new Error("Truncated periodicity");
            data.push({ type: "periodicity", value: uint16(bytes, offset) * 10, unit: "s" });
            offset += 2;
        } else {
            throw new Error(`Unknown status object type: 0x${code.toString(16).padStart(2, "0")}`);
        }
    }
    return data;
}

function LoraWANEwattchDecoder(payload, fPort) {
    try {
        const bytes = typeof payload === "string" ? Array.from(Buffer.from(payload, "hex")) : Array.from(payload);
        if (bytes.length < 2) throw new Error("Payload is shorter than the Ewattch header");
        const frameType = bytes[0] & 0x1f;
        const declaredLength = bytes[1];
        const body = bytes.slice(2);
        if (body.length !== declaredLength) throw new Error("Payload size indicated does not match payload size given");
        if ((frameType === 0x00 || frameType === 0x01) && fPort !== undefined && Number(fPort) !== 3) {
            throw new Error(`Frame type 0x${frameType.toString(16)} must use LoRaWAN port 3`);
        }
        if (frameType === 0x10 && fPort !== undefined && Number(fPort) !== 2) {
            throw new Error("Node status frames must use LoRaWAN port 2");
        }
        if (frameType === 0x00 || frameType === 0x01) return { data: parsePeriodic(body), hardwareData: { frameType } };
        if (frameType === 0x10) return { data: parseStatus(body), hardwareData: { frameType } };
        throw new Error(`Unsupported uplink frame type: 0x${frameType.toString(16).padStart(2, "0")}`);
    } catch (error) {
        return { data: [{ type: "error", value: error.message }], hardwareData: {} };
    }
}

function decodeUplink(input) {
    const decoded = LoraWANEwattchDecoder(input.bytes, input.fPort);
    const errors = decoded.data.filter((item) => item.type === "error");
    return errors.length ? { errors: errors.map((item) => item.value) } : { data: decoded };
}

module.exports = { LoraWANEwattchDecoder, decodeUplink };
