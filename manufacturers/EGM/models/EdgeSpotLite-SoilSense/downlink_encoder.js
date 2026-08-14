const fs = require("fs");

function encodeMeasurementFrequency(frequency) {
  const payload = Buffer.alloc(2);
  payload.writeUInt16BE(frequency);
  return {
    data: payload.toString("base64"),
    port: 8,
  };
}

function encodeRejoinTime(timestamp) {
  const payload = Buffer.alloc(4);
  payload.writeUInt32BE(timestamp);
  return {
    data: payload.toString("base64"),
    port: 5,
  };
}

function encodeReset() {
  const payload = Buffer.alloc(1);
  payload.writeUInt8(Math.floor(Math.random() * 256));
  return {
    data: payload.toString("base64"),
    port: 7,
  };
}

function main() {
  const command = JSON.parse(fs.readFileSync(0, "utf8"));
  const serviceName = process.argv[2];
  switch (serviceName) {
    case "setMeasurementFrequency":
      const frequency = Number(command.measurementFrequency.value);
      const result = encodeMeasurementFrequency(frequency);
      process.stdout.write(JSON.stringify(result));
      break;
    case "setRejoinTime":
      const timestamp = Number(command.rejoinTime.value);
      process.stdout.write(JSON.stringify(encodeRejoinTime(timestamp)));
      break;
    case "reset":
      process.stdout.write(JSON.stringify(encodeReset()));
      break;
    default:
      throw new Error("Unsupported service");
  }
}

if (require.main === module) {
  main();
}
