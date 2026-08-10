const fs = require("fs");

function encodeMeasurementFrequency(frequency) {
  const payload = Buffer.alloc(2);
  payload.writeUInt16BE(frequency);

  return {
    data: payload.toString("base64"),
    port: 8,
  };
}

const command = JSON.parse(fs.readFileSync(0, "utf8"));

const frequency = Number(command.measurementFrequency);

const result = encodeMeasurementFrequency(frequency);

process.stdout.write(JSON.stringify(result));
