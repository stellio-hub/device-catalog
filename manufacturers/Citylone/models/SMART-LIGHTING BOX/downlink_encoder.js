const fs = require("fs");

const PORT = 1;

function downlink(id, info) {
  const payload = info && info.length ? Buffer.concat([Buffer.from([id]), info]) : Buffer.from([id]);
  return {
    data: payload.toString("base64"),
    port: PORT,
  };
}

function value(command, key) {
  if (command[key] && Object.prototype.hasOwnProperty.call(command[key], "value")) {
    return command[key].value;
  }
  return command[key];
}

function encodeForceOutput(command) {
  const payload = Buffer.alloc(5);
  payload.writeUInt8(Number(value(command, "commandType")));
  payload.writeUInt8(Number(value(command, "dimmingLevel") || 0), 1);
  payload.writeUInt8(Number(value(command, "output") || 0), 2);
  payload.writeUInt16LE(Number(value(command, "forcingTime") || 0), 3);
  return downlink(0x01, payload);
}

function encodeUtcOffset(hours, minutes) {
  const sign = hours < 0 ? 0x02 : 0x01;
  const absHours = Math.abs(Number(hours) || 0) & 0x7f;
  const absMinutes = (Number(minutes) || 0) & 0x7f;
  return (sign << 14) | (absHours << 7) | absMinutes;
}

function encodeTime(command) {
  const payload = Buffer.alloc(7);
  payload.writeUInt32LE(Number(value(command, "timestamp")), 0);
  payload.writeUInt16LE(
    encodeUtcOffset(value(command, "utcOffsetHours"), value(command, "utcOffsetMinutes")),
    4
  );
  payload.writeUInt8(value(command, "loraTimeUpdate") ? 1 : 0, 6);
  return downlink(0x04, payload);
}

function encodeCoordinate(valueDeg) {
  const abs = Math.round(Math.abs(Number(valueDeg)) * 1e6) & 0x7fffffff;
  const signed = Number(valueDeg) < 0 ? abs | 0x80000000 : abs;
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(signed >>> 0, 0);
  return buf;
}

function encodePosition(command) {
  return downlink(
    0x06,
    Buffer.concat([
      encodeCoordinate(value(command, "longitude")),
      encodeCoordinate(value(command, "latitude")),
    ])
  );
}

function encodeCalendarPair(pair, kind) {
  if (!pair || pair.mode === "all") {
    return 0x8000;
  }
  if (pair.mode === "unused") {
    return 0;
  }
  if (pair.mode === "range") {
    return (0x01 << 14) | ((Number(pair.a) & 0x7f) << 7) | (Number(pair.b) & 0x7f);
  }
  if (kind === "minutes" && (pair.mode === "civilOffset" || pair.mode === "ephemerisOffset")) {
    const selection = pair.mode === "civilOffset" ? 0 : 3;
    const dusk = Number(pair.duskOffset) || 0;
    const dawn = Number(pair.dawnOffset) || 0;
    return (
      (selection << 14) |
      ((dusk < 0 ? 1 : 0) << 12) |
      ((Math.abs(dusk) & 0x1f) << 7) |
      ((dawn < 0 ? 1 : 0) << 6) |
      (Math.abs(dawn) & 0x3f)
    );
  }
  if (kind === "hours" && pair.mode === "fixed") {
    return (0x03 << 14) | ((Number(pair.a) & 0x7f) << 7) | (Number(pair.b) & 0x7f);
  }
  return ((Number(pair.a) & 0x7f) << 7) | (Number(pair.b) & 0x7f);
}

function encodeCalendarOutput(output) {
  if (output === "all" || output === 0 || output === "0") {
    return 0x80;
  }
  const index = Number(String(output).replace(/^S/i, "")) - 1;
  return 0x40 | (index & 0x3f);
}

function encodeCalendarCommand(command) {
  if (command === 0 || command === "OFF") {
    return 0;
  }
  if (command === 1 || command === "ON") {
    return 100;
  }
  return Number(command);
}

function writeU16le(buf, offset, word) {
  buf.writeUInt8(word & 0xff, offset);
  buf.writeUInt8((word >> 8) & 0xff, offset + 1);
}

function encodeCalendar(command) {
  const rule = value(command, "calendarFeedback") || command;
  const payload = Buffer.alloc(16);
  writeU16le(payload, 0, encodeCalendarPair(rule.minutes, "minutes"));
  writeU16le(payload, 2, encodeCalendarPair(rule.hours, "hours"));
  writeU16le(payload, 4, encodeCalendarPair(rule.days, "days"));
  writeU16le(payload, 6, encodeCalendarPair(rule.weekdays, "weekdays"));
  writeU16le(payload, 8, encodeCalendarPair(rule.months, "months"));
  writeU16le(payload, 10, encodeCalendarPair(rule.years, "years"));
  payload.writeUInt8(Number(rule.remainingFrames || 0), 12);
  payload.writeUInt8(encodeCalendarOutput(rule.output), 13);
  payload.writeUInt8(encodeCalendarCommand(rule.command), 14);
  payload.writeUInt8(Number(rule.totalFrames || 1), 15);
  return downlink(0x05, payload);
}

function encodeCalendarEnd() {
  return downlink(0x05, Buffer.alloc(15));
}

function encodeConsumptionFrequency(command) {
  return downlink(0x0d, Buffer.from([Number(value(command, "consumptionFrequency"))]));
}

function encodeTimeChange(command) {
  return downlink(0x0e, Buffer.from([value(command, "timeChangeEnabled") ? 1 : 0]));
}

function encodeReset(command) {
  const devEui = String(value(command, "devEUI") || value(command, "devEui") || "").replace(/[:\s-]/g, "");
  const bytes = Buffer.from(devEui, "hex");
  const result = Math.floor(1.2 * (bytes[3] ** 3 + bytes[4] ** 2 + bytes[5] ** 3));
  const digits = String(result).padStart(4, "0");
  const payload = Buffer.alloc(4);
  payload.writeUInt8(Number(digits[0]), 0);
  payload.writeUInt8(Number(digits[1]), 1);
  payload.writeUInt8(Number(digits[2]), 2);
  payload.writeUInt8(Number(digits[3]), 3);
  return downlink(0x22, payload);
}

function encodeDataModel(command) {
  return downlink(0x24, Buffer.from([Number(value(command, "dataModel"))]));
}

function encodeCalendarLocked(command) {
  const locked = value(command, "calendarLocked");
  const byte = locked === true || locked === 1 || locked === "1" ? 1 : Number(locked) || 0;
  return downlink(0x25, Buffer.from([byte]));
}

function encodeTimeBeforeRejoin(command) {
  return downlink(0x26, Buffer.from([Number(value(command, "timeBeforeRejoin"))]));
}

function main() {
  const command = JSON.parse(fs.readFileSync(0, "utf8"));
  const serviceName = process.argv[2];
  let result;
  switch (serviceName) {
    case "forceOutput":
      result = encodeForceOutput(command);
      break;
    case "setTime":
      result = encodeTime(command);
      break;
    case "sendCalendar":
      result = encodeCalendar(command);
      break;
    case "sendCalendarEnd":
      result = encodeCalendarEnd();
      break;
    case "setPosition":
      result = encodePosition(command);
      break;
    case "requestCalendar":
      result = downlink(0x07);
      break;
    case "requestTime":
      result = downlink(0x09);
      break;
    case "requestRssi":
      result = downlink(0x0a);
      break;
    case "requestPosition":
      result = downlink(0x0b);
      break;
    case "requestSoftwareVersion":
      result = downlink(0x0c);
      break;
    case "setConsumptionFrequency":
      result = encodeConsumptionFrequency(command);
      break;
    case "setTimeChange":
      result = encodeTimeChange(command);
      break;
    case "requestTimeChange":
      result = downlink(0x0f);
      break;
    case "requestConsumption":
      result = downlink(0x10);
      break;
    case "reset":
      result = encodeReset(command);
      break;
    case "requestRunHour":
      result = downlink(0x23);
      break;
    case "setDataModel":
      result = encodeDataModel(command);
      break;
    case "setCalendarLocked":
      result = encodeCalendarLocked(command);
      break;
    case "setTimeBeforeRejoin":
      result = encodeTimeBeforeRejoin(command);
      break;
    default:
      throw new Error("Unsupported service");
  }
  process.stdout.write(JSON.stringify(result));
}

if (require.main === module) {
  main();
}
