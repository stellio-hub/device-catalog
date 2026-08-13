const fs = require("fs");

function encodeMeasurementFrequency(frequency) {
  const payload = Buffer.alloc(2);
  payload.writeUInt16BE(frequency);
  return {
    data: payload.toString("base64"),
    port: 8,
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
    default:
      throw new Error("Unsupported service");
  }
}

if (require.main === module) {
  main();
}
