// NGSI-LD conversion for Ewattch decoders.

const UNIT_CODES = {
    mAh: "E09", mA: "4K", Ah: "AMH", A: "AMP", Wh: "WHR", kWh: "KWH",
    kvarh: "K3", W: "WTT", var: "D44", VA: "D46", V: "VLT", Hz: "HTZ",
    ppm: "59", s: "SEC", "°C": "CEL", "%RH": "P1", lx: "LUX"
};

const ATTRIBUTE_NAMES = {
    current: "current", currentIndex: "currentIndex", activeEnergyIndex: "activeEnergy",
    consumedActiveEnergyIndex: "activeEnergy", producedActiveEnergyIndex: "activeEnergy",
    positiveReactiveEnergyIndex: "reactiveEnergy", negativeReactiveEnergyIndex: "reactiveEnergy",
    reactiveEnergyIndex: "reactiveEnergy", apparentEnergyIndex: "energy",
    power: "activePower", activePower: "activePower", reactivePower: "reactivePower",
    apparentPower: "power", voltage: "voltage", frequency: "frequency",
    co2: "co2", temperature: "temperature", humidity: "humidity", luminosity: "luminosity",
    motion: "motion", periodicity: "periodicity", batteryLevel: "batteryLevel",
    version: "firmwareVersion", nodeType: "deviceType", hardwareProfile: "hardwareProfile"
};

const FLOW_SUFFIXES = {
    consumedActiveEnergyIndex: "Consumed", producedActiveEnergyIndex: "Produced",
    positiveReactiveEnergyIndex: "Positive", negativeReactiveEnergyIndex: "Negative"
};

function ngsildInstance(value, time, unitCode, datasetSuffix) {
    const instance = { type: "Property", value, observedAt: time };
    if (unitCode) instance.unitCode = unitCode;
    if (datasetSuffix) instance.datasetId = "urn:ngsi-ld:Dataset:" + datasetSuffix;
    return instance;
}

function datasetSuffix(data) {
    const parts = [];
    if (data.hardwareData && Number.isInteger(data.hardwareData.socket)) parts.push("Socket" + data.hardwareData.socket);
    if (data.hardwareData && Number.isInteger(data.hardwareData.channel)) parts.push("Clamp" + (data.hardwareData.channel + 1));
    else if (data.uuid) parts.push(String(data.uuid).replace(/[^A-Za-z0-9_-]/g, "_"));
    if (FLOW_SUFFIXES[data.type]) parts.push(FLOW_SUFFIXES[data.type]);
    parts.push("Raw");
    return parts.join(":");
}

function normalizeMeasurement(data) {
    if (data.unit === "varh") return { value: data.value / 1000, unitCode: "K3" };
    if (data.unit === "VAh") return { value: data.value / 1000, unitCode: "C79" };
    return { value: data.value, unitCode: UNIT_CODES[data.unit] };
}

function scale5BatteryLevel(value) {
    if (value <= 0) return 1;
    if (value === 1) return 2;
    if (value <= 3) return 3;
    if (value <= 5) return 4;
    return 5;
}

function ngsildWrapper(input, time, entityId) {
    if (!input || !Array.isArray(input.data)) throw new TypeError("The Ewattch decoder result must contain a data array");
    const payload = [{ id: entityId, type: "Device" }];
    function addToPayload(key, value) {
        const entity = payload.find((candidate) => !Object.prototype.hasOwnProperty.call(candidate, key));
        if (entity) entity[key] = value;
        else payload.push({ id: entityId, type: "Device", [key]: value });
    }
    for (const data of input.data) {
        if (!Object.prototype.hasOwnProperty.call(ATTRIBUTE_NAMES, data.type)) continue;
        const normalized = normalizeMeasurement(data);
        addToPayload(ATTRIBUTE_NAMES[data.type], ngsildInstance(normalized.value, time, normalized.unitCode, datasetSuffix(data)));
        if (data.type === "batteryLevel") addToPayload("batteryLevel", ngsildInstance(scale5BatteryLevel(data.value), time, undefined, "scale5"));
    }
    return payload;
}

module.exports = { ngsildWrapper, ngsildInstance };