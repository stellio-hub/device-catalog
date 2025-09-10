// Added by EGM for NGSI-LD conversion

function ngsildInstance(
  value,
  time = null,
  unit = null,
  dataset_suffix = null
) {
  const ngsild_instance = {
    type: "Property",
    value: value,
  };
  if (time !== null) {
    ngsild_instance.observedAt = time;
  }
  if (unit !== null) {
    ngsild_instance.unitCode = unit;
  }
  if (dataset_suffix !== null) {
    ngsild_instance.datasetId = "urn:ngsi-ld:Dataset:" + dataset_suffix;
  }
  return ngsild_instance;
}

function ngsildWrapper(decoded, time, entityId) {
  const inputPayload = {};
  for (let i = 0; i < decoded.payload.length; i++) {
    Object.assign(inputPayload, decoded.payload[i]);
  }
  const typeOfMessage = inputPayload.Type_of_message;

  switch (typeOfMessage) {
    case "Product_Status_Message": {
      const ngsildPayload = [
        {
          id: entityId,
          type: "Device",
          productStatusMessage: {
            type: "JsonProperty",
            json: inputPayload,
          },
        },
      ];
      return ngsildPayload;
    }

    case "Real_Time": {
      const ngsildPayload = [
        {
          id: entityId,
          type: "Device",
          temperature: ngsildInstance(
            inputPayload["Temperature(°C)"],
            time,
            "CEL",
            "Raw"
          ),
          humidity: ngsildInstance(
            inputPayload["Relative_Humidity_(%RH)"],
            time,
            "P1",
            "Raw"
          ),
          indoorAirQuality: [
            ngsildInstance(inputPayload.IAQ_GLOBAL, time, null, "Global"),
            ngsildInstance(inputPayload.IAQ_DRY, time, null, "Drought_index"),
            ngsildInstance(inputPayload.IAQ_MOULD, time, null, "Mold_index"),
            ngsildInstance(inputPayload.IAQ_DM, time, null, "Mite_index"),
            ngsildInstance(
              inputPayload.IAQ_HCI,
              time,
              null,
              "Hygrothermal_comfort"
            ),
          ],
        },
      ];
      return ngsildPayload;
    }

    case "Datalog": {
      const millisecsBetweenValues =
        inputPayload.Time_between_measurements_in_minutes * 60 * 1000;
      const now = new Date(time);
      const tMinus1 = new Date(
        now.getTime() - millisecsBetweenValues * 1
      ).toISOString();
      const tMinus2 = new Date(
        now.getTime() - millisecsBetweenValues * 2
      ).toISOString();
      const tMinus3 = new Date(
        now.getTime() - millisecsBetweenValues * 3
      ).toISOString();
      const tMinus4 = new Date(
        now.getTime() - millisecsBetweenValues * 4
      ).toISOString();

      const ngsildPayload = [
        {
          id: entityId,
          type: "Device",
          temperature: ngsildInstance(
            inputPayload["Temperature(°C)_[n]"],
            time,
            "CEL",
            "Raw"
          ),
          humidity: ngsildInstance(
            inputPayload["Relative Humidity(%)_[n]"],
            time,
            "P1",
            "Raw"
          ),
        },
        {
          id: entityId,
          type: "Device",
          temperature: ngsildInstance(
            inputPayload["Temperature(°C)_[n-1]"],
            tMinus1,
            "CEL",
            "Raw"
          ),
          humidity: ngsildInstance(
            inputPayload["Relative Humidity(%)_[n-1]"],
            tMinus1,
            "P1",
            "Raw"
          ),
        },
        {
          id: entityId,
          type: "Device",
          temperature: ngsildInstance(
            inputPayload["Temperature(°C)_[n-2]"],
            tMinus2,
            "CEL",
            "Raw"
          ),
          humidity: ngsildInstance(
            inputPayload["Relative Humidity(%)_[n-2]"],
            tMinus2,
            "P1",
            "Raw"
          ),
        },
        {
          id: entityId,
          type: "Device",
          temperature: ngsildInstance(
            inputPayload["Temperature(°C)_[n-3]"],
            tMinus3,
            "CEL",
            "Raw"
          ),
          humidity: ngsildInstance(
            inputPayload["Relative Humidity(%)_[n-3]"],
            tMinus3,
            "P1",
            "Raw"
          ),
        },
        {
          id: entityId,
          type: "Device",
          temperature: ngsildInstance(
            inputPayload["Temperature(°C)_[n-4]"],
            tMinus4,
            "CEL",
            "Raw"
          ),
          humidity: ngsildInstance(
            inputPayload["Relative Humidity(%)_[n-4]"],
            tMinus4,
            "P1",
            "Raw"
          ),
        },
      ];
      return ngsildPayload;
    }

    case "Config_General": {
      const ngsildPayload = [
        {
          id: entityId,
          type: "Device",
          configGeneral: {
            type: "JsonProperty",
            json: inputPayload,
          },
        },
      ];
      return ngsildPayload;
    }

    case "Push": {
      const ngsildPayload = [
        {
          id: entityId,
          type: "Device",
          buttonActivation: ngsildInstance(1, time, null, null),
        },
      ];
      return ngsildPayload;
    }

    case "Temperature_Alert": {
      const ngsildPayload = [
        {
          id: entityId,
          type: "Device",
          temperatureAlert: {
            type: "JsonProperty",
            json: inputPayload,
          },
        },
      ];
      return ngsildPayload;
    }

    case "Keep_Alive": {
      const ngsildPayload = [
        {
          id: entityId,
          type: "Device",
        },
      ];
      return ngsildPayload;
    }

    case "Battery_level": {
      const ngsildPayload = [
        {
          id: entityId,
          type: "Device",
          batteryVoltage: ngsildInstance(
            inputPayload["Tension_batterie(mV)"],
            time,
            "2Z",
            "Raw"
          ),
        },
      ];
      return ngsildPayload;
    }

    default:
      throw new Error(`Unsupported Type_of_message: ${typeOfMessage}`);
  }
}

module.exports = {
  Wrapper: ngsildWrapper,
};
