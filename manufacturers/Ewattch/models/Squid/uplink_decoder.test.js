const { execFileSync } = require("child_process");
const path = require("path");
const decoder = path.join(__dirname, "uplink_decoder.js");
const time = "2026-09-25T14:00:00Z";
const devEui = "0102030405060708";
function decode(port, payload) { return JSON.parse(execFileSync("node", [decoder, String(port), payload, time, devEui], { encoding: "utf8" })); }
function properties(output, name) { return output.filter((entity) => entity[name]).map((entity) => entity[name]); }

describe("Ewattch SQUID decoder invariants", () => {
    test("preserves channel and energy direction in dataset identifiers", () => {
        const output = decode(3, "00f040c3b47a00b2aa0095c100f774019f7701398f004641009ed700063b005cd6094537008a270040c53800000100000000006100005500003700000000000d000000000010000011000000000040c63c5700670d00020000390000d10300480b00743900584700e4350046000000000087230040c7850000fa8700cf0a00a00301bbdd00a26100000000000000000000261e0433010000000040c47e02002d01006402004d0100640100ab00000000008a0000feffff630600ffffff10000040c80c020082feffebffff6dffff8dffffa3ffff000000130000000000cafdff0000000d0000403a2c0937092c09401c8813");
        expect(properties(output, "activeEnergy")).toHaveLength(24);
        expect(properties(output, "reactiveEnergy")).toHaveLength(24);
        expect(properties(output, "activePower")).toHaveLength(12);
        expect(properties(output, "reactivePower")).toHaveLength(12);
        expect(properties(output, "voltage")).toHaveLength(3);
        expect(properties(output, "frequency")[0]).toMatchObject({ value: 50, unitCode: "HTZ" });
        expect(properties(output, "activeEnergy")[0].datasetId).toContain(":Consumed:Raw");
        expect(properties(output, "activeEnergy")[12].datasetId).toContain(":Produced:Raw");
        expect(properties(output, "reactiveEnergy")[0].datasetId).toContain(":Positive:Raw");
        expect(properties(output, "reactiveEnergy")[12].datasetId).toContain(":Negative:Raw");
    });
    test("maps apparent quantities while preserving active and reactive terms", () => {
        const consumed = decode(3, "0006412213b47a00");
        const apparentEnergy = decode(3, "0006412219840300");
        const apparentPower = decode(3, "000641221bd20400");
        expect(properties(consumed, "activeEnergy")[0]).toMatchObject({ value: 314120, unitCode: "WHR" });
        expect(properties(apparentEnergy, "energy")[0]).toMatchObject({ value: 9, unitCode: "C79" });
        expect(properties(apparentPower, "power")[0]).toMatchObject({ value: 1234, unitCode: "D46" });
        expect(properties(apparentEnergy, "apparentEnergy")).toHaveLength(0);
        expect(properties(apparentPower, "apparentPower")).toHaveLength(0);
    });
    test("decodes twelve SQUID V1 channels", () => {
        const output = decode(3, "002548509F06A03E0D407D1AF56900EAD300D4A701509F06A03E0D407D1AF56900EAD300D4A701");
        expect(properties(output, "currentIndex")).toHaveLength(12);
        expect(properties(output, "currentIndex")[0]).toMatchObject({ value: 4340, unitCode: "AMH" });
        expect(properties(output, "currentIndex")[11].datasetId).toContain(":Clamp12:Raw");
    });
    test("adds raw and scale5 battery datasets", () => {
        const output = decode(2, "1012000901065555010203040200010407083c00");
        expect(properties(output, "deviceType")[0].value).toBe("squidV2OrPro");
        expect(properties(output, "hardwareProfile")[0].value).toBe("555501020304");
        expect(properties(output, "batteryLevel")).toEqual(expect.arrayContaining([
            expect.objectContaining({ value: 7, datasetId: "urn:ngsi-ld:Dataset:Raw" }),
            expect.objectContaining({ value: 5, datasetId: "urn:ngsi-ld:Dataset:scale5" })
        ]));
    });
    test("rejects malformed payloads and invalid ports", () => {
        expect(() => decode(2, "001541203201260947720A013B0F475400400901726A00")).toThrow();
        expect(() => decode(3, "00044010010000")).toThrow();
    });
});