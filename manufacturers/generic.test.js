const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function loadManufacturers() {
  const manufacturersDir = path.resolve(__dirname);
  const manufacturers = fs
    .readdirSync(manufacturersDir)
    .filter((file) =>
      fs.statSync(path.join(manufacturersDir, file)).isDirectory()
    );
  const manufacturersWithModels = manufacturers.map((manufacturer) => {
    const modelsDir = path.join(manufacturersDir, manufacturer, "models");

    const models = fs
      .readdirSync(modelsDir)
      .filter((file) => fs.statSync(path.join(modelsDir, file)).isDirectory());

    return { manufacturer, models };
  });

  return manufacturersWithModels;
}

function getConfigTests(manufacturer, model, canShowLogs = true) {
  const testsPath = path.resolve(
    __dirname,
    `${manufacturer}/models/${model}/tests.json`
  );

  let tests;
  try {
    tests = require(testsPath);
  } catch (error) {
    if (canShowLogs)
      console.log(`Could not find tests.json for ${manufacturer} ${model}`);
    return;
  }

  if (!tests) {
    if (canShowLogs) console.log("No 'tests' provided");
    return;
  }

  if (!Array.isArray(tests)) {
    throw new Error(
      `The 'tests' option must be an array for ${manufacturer} ${model}`
    );
  }

  return tests;
}

function getOnlyTest(manufacturers) {
  let onlyTest;

  manufacturers.forEach(({ manufacturer, models }) => {
    for (const model of models) {
      const configTests = getConfigTests(manufacturer, model, false);
      if (!configTests) continue;
      const foundOnlyTest = configTests.find((test) => test.only);
      if (foundOnlyTest) {
        onlyTest = { test: foundOnlyTest, manufacturer, model };
      }
    }
  });

  return onlyTest;
}

function executeOneTest({ test, manufacturer, model }) {
  if (!test || !test.inputArguments || !test.expectedOutput) {
    console.error(`Missing test`);
    return;
  }

  console.log(`Testing... ${test.name}`);

  const uplinkDecoderPath = path.resolve(
    __dirname,
    `${manufacturer}/models/${model}/uplink_decoder.js`
  );

  const command = `node "${uplinkDecoderPath}" ${test.inputArguments
    .map((arg) => (Array.isArray(arg) ? JSON.stringify(arg) : arg))
    .join(" ")}`;

  console.log(`\n command ⬇️ \n\n ${command}`);

  const result = execSync(command).toString().trim();

  console.log(`\n results ⬇️ \n\n ${result}`);

  it(`Should pass ${test.name}`, () => {
    expect(result).toEqual(test.expectedOutput);
  });

  return;
}

function testAll(manufacturers) {
  console.log("Testing all 🚀");

  manufacturers.forEach(({ manufacturer, models }) => {
    for (const model of models) {
      const uplinkDecoderPath = path.resolve(
        __dirname,
        `${manufacturer}/models/${model}/uplink_decoder.js`
      );
      if (!uplinkDecoderPath) {
        continue;
      }

      const configTests = getConfigTests(manufacturer, model);

      if (!configTests) continue;

      describe(`${manufacturer} - ${model}`, () => {
        for (const test of configTests) {
          executeOneTest({ test, manufacturer, model });
        }
      });
    }
  });
}

function main() {
  const manufacturers = loadManufacturers();

  const onlyTest = getOnlyTest(manufacturers);

  if (onlyTest) {
    executeOneTest(onlyTest);
  } else {
    testAll(manufacturers);
  }
}

main();
