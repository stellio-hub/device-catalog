const fs = require("fs");

function encodeMeasurementFrequency(frequency) {
  if (!Number.isInteger(frequency)) {
    throw new Error("measurementFrequency must be an integer");
  }

  if (frequency < 0 || frequency > 65535) {
    throw new Error("measurementFrequency must fit in 2 bytes");
  }

  const payload = Buffer.alloc(2);
  payload.writeUInt16BE(frequency);

  return {
    data: payload.toString("base64"),
    port: 8,
  };
}

const command = JSON.parse(fs.readFileSync(0, "utf8"));

const frequency = parseInt(command.measurementFrequency);

const result = encodeMeasurementFrequency(frequency);

process.stdout.write(JSON.stringify(result));
