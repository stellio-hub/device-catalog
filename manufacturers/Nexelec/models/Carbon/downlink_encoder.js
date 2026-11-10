// Nexelec Insafe+ Carbon LoRa downlink encoder.
// Reference: D678I Insafe+ Carbon LoRa Technical Guide (revision I), section 5.13.
//
// Usage: echo '<NGSI-LD JSON>' | node downlink_encoder.js <service>
// Output: { "data": "<base64>", "port": 56 }

const fs = require("fs");

// Downlink fPort 56 (decimal), validated on a real device.
const PORT = 56;
const HEADER = 0x55;
const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function fail(message) {
  throw new Error(message);
}

// Converts a physical value into an integer number of steps, checking the allowed range.
function steps(name, value, step, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    fail(`${name} must be a number`);
  }
  const raw = Math.round(number / step);
  if (raw < min || raw > max) {
    fail(`${name} out of range: ${value} (allowed ${min * step} to ${max * step})`);
  }
  return raw;
}

function flag(name, value) {
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value === 0 || value === 1) return value;
  if (value === "true" || value === "false") return value === "true" ? 1 : 0;
  return fail(`${name} must be a boolean`);
}

function uint16BE(value) {
  return [(value >> 8) & 0xff, value & 0xff];
}

// smartPeriod value: { enabled, days: ["monday", ...], startTime: hours (step 0.5), duration: hours (step 0.5) }
function smartPeriod(name, period) {
  if (!period || typeof period !== "object") {
    fail(`${name} must be an object`);
  }
  const days = (period.days || []).map((day) => String(day).toLowerCase());
  days.forEach((day) => WEEK_DAYS.includes(day) || fail(`${name}: unknown day ${day}`));
  let mask = flag(`${name}.enabled`, period.enabled) << 7;
  WEEK_DAYS.forEach((day, index) => {
    if (days.includes(day)) mask |= 1 << (6 - index);
  });
  return [
    mask,
    steps(`${name}.startTime`, period.startTime, 0.5, 0, 47),
    steps(`${name}.duration`, period.duration, 0.5, 0, 48),
  ];
}

// clock value: ISO 8601 UTC date-time, e.g. "2025-11-18T15:59:03Z"
function clock(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    fail("clock must be an ISO 8601 date-time");
  }
  const year = date.getUTCFullYear() - 2000;
  if (year < 0 || year > 100) {
    fail("clock year must be between 2000 and 2100");
  }
  return [
    year,
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  ];
}

// clockShift value: signed number of minutes to add (> 0) or remove (< 0) from the device RTC.
function clockShift(value) {
  const minutes = Number(value);
  return [minutes >= 0 ? 1 : 0, steps("clockShift", Math.abs(minutes), 1, 0, 250)];
}

// Supported parameters, keyed by NGSI-LD attribute name.
// Each one gives its command ID and how to encode its value into data bytes.
const PARAMETERS = {
  ledEnabled: { id: 0x03, encode: (v) => [flag("ledEnabled", v)] },
  buttonNotificationEnabled: { id: 0x04, encode: (v) => [flag("buttonNotificationEnabled", v)] },
  realTimeDataEnabled: { id: 0x05, encode: (v) => [flag("realTimeDataEnabled", v)] },
  datalogEnabled: { id: 0x06, encode: (v) => [flag("datalogEnabled", v)] },
  temperatureAlertEnabled: { id: 0x07, encode: (v) => [flag("temperatureAlertEnabled", v)] },
  co2AlertEnabled: { id: 0x08, encode: (v) => [flag("co2AlertEnabled", v)] },
  keepaliveEnabled: { id: 0x09, encode: (v) => [flag("keepaliveEnabled", v)] },
  nfcEnabled: { id: 0x0a, encode: (v) => [flag("nfcEnabled", v)] },
  datalogDecimation: { id: 0x0b, encode: (v) => [steps("datalogDecimation", v, 1, 1, 9)] },
  temperatureThreshold1: { id: 0x0c, encode: (v) => uint16BE(steps("temperatureThreshold1", v, 0.1, 0, 500)) },
  temperatureThreshold2: { id: 0x0d, encode: (v) => uint16BE(steps("temperatureThreshold2", v, 0.1, 0, 500)) },
  deltaTemperature: { id: 0x0e, encode: (v) => [steps("deltaTemperature", v, 0.1, 0, 99)] },
  deltaHumidity: { id: 0x0f, encode: (v) => [steps("deltaHumidity", v, 0.5, 0, 19)] },
  deltaCo2: { id: 0x10, encode: (v) => [steps("deltaCo2", v, 20, 0, 250)] },
  keepalivePeriod: { id: 0x11, encode: (v) => [steps("keepalivePeriod", v, 1, 1, 99)] },
  co2Threshold1: { id: 0x12, encode: (v) => [steps("co2Threshold1", v, 20, 0, 250)] },
  co2Threshold2: { id: 0x13, encode: (v) => [steps("co2Threshold2", v, 20, 0, 250)] },
  smartPeriod1: { id: 0x14, encode: (v) => smartPeriod("smartPeriod1", v) },
  smartPeriod2: { id: 0x15, encode: (v) => smartPeriod("smartPeriod2", v) },
  // Step of 50 m, consistent with the altitude echoed in the CO2 configuration uplink.
  altitude: { id: 0x16, encode: (v) => [steps("altitude", v, 50, 0, 200)] },
  clock: { id: 0x17, encode: clock },
  clockShift: { id: 0x18, encode: clockShift },
  joinDelay: { id: 0x1c, encode: (v) => uint16BE(steps("joinDelay", v, 10, 1, 1008)) },
  // The device expects 1 to DEACTIVATE the orange LED.
  orangeLedEnabled: { id: 0x27, encode: (v) => [flag("orangeLedEnabled", v) ? 0 : 1] },
  realTimeSendingPeriod: { id: 0x49, encode: (v) => [steps("realTimeSendingPeriod", v, 10, 1, 63)] },
};

// Services and the parameters each one accepts. `requests` are parameterless commands.
const SERVICES = {
  requestGeneralConfig: { requests: [0x01] },
  requestCo2Config: { requests: [0x02] },
  setLed: { parameters: ["ledEnabled", "orangeLedEnabled"] },
  setButtonNotification: { parameters: ["buttonNotificationEnabled"] },
  setRealTimeData: {
    parameters: ["realTimeDataEnabled", "deltaTemperature", "deltaHumidity", "deltaCo2", "realTimeSendingPeriod"],
  },
  setDatalog: { parameters: ["datalogEnabled", "datalogDecimation"] },
  setTemperatureAlert: { parameters: ["temperatureAlertEnabled", "temperatureThreshold1", "temperatureThreshold2"] },
  setCo2Thresholds: { parameters: ["co2AlertEnabled", "co2Threshold1", "co2Threshold2"] },
  setKeepalive: { parameters: ["keepaliveEnabled", "keepalivePeriod"] },
  setNfc: { parameters: ["nfcEnabled"] },
  setSmartPeriods: { parameters: ["smartPeriod1", "smartPeriod2"] },
  setAltitude: { parameters: ["altitude"] },
  setClock: { parameters: ["clock"] },
  shiftClock: { parameters: ["clockShift"] },
  scheduleJoin: { parameters: ["joinDelay"] },
  configure: { parameters: Object.keys(PARAMETERS) },
};

function attributeValue(command, key) {
  const attribute = command[key];
  if (attribute !== null && typeof attribute === "object" && Object.prototype.hasOwnProperty.call(attribute, "value")) {
    return attribute.value;
  }
  return attribute;
}

function encode(serviceName, command) {
  const service = SERVICES[serviceName];
  if (!service) {
    fail("Unsupported service");
  }

  const commands = (service.requests || []).map((id) => ({ id, data: [] }));
  for (const key of service.parameters || []) {
    const value = attributeValue(command, key);
    if (value !== undefined && value !== null) {
      commands.push({ id: PARAMETERS[key].id, data: PARAMETERS[key].encode(value) });
    }
  }
  if (commands.length === 0) {
    fail(`No parameter provided for ${serviceName} (expected one of: ${service.parameters.join(", ")})`);
  }

  // Nexelec recommends sending command IDs in ascending order.
  commands.sort((a, b) => a.id - b.id);
  const bytes = [HEADER];
  commands.forEach(({ id, data }) => bytes.push(id, ...data));

  return {
    data: Buffer.from(bytes).toString("base64"),
    port: PORT,
  };
}

function main() {
  const input = fs.readFileSync(0, "utf8").trim();
  const command = input ? JSON.parse(input) : {};
  process.stdout.write(JSON.stringify(encode(process.argv[2], command)));
}

if (require.main === module) {
  main();
}

module.exports = { encode };
