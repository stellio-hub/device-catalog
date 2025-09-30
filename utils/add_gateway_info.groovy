import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import java.nio.charset.StandardCharsets
import org.apache.commons.io.IOUtils

def flowFile = session.get()
def decodedPayload = []
def jsonSlurper = new JsonSlurper()

session.read(flowFile, { inputStream ->
    decodedPayload = jsonSlurper.parseText(IOUtils.toString(inputStream))
} as InputStreamCallback)

def networkType = flowFile.getAttribute("network_type")
def loraInfo   = jsonSlurper.parseText(flowFile.getAttribute("lora_info"))
def payload    = flowFile.getAttribute("payload")
def time       = flowFile.getAttribute("time")

decodedPayload[0].payload = [
        type      : "Property",
        value     : payload,
        observedAt: time,
        datasetId : "urn:ngsi-ld:Dataset:Raw"
]

def asList(def container, String key) {
    if (!container[0].containsKey(key) || container[0][key] == null) {
        return []
    }
    def existing = container[0][key]
    return (existing instanceof List) ? existing : [existing]
}

def rssi = asList(decodedPayload, 'rssi')
def snr  = asList(decodedPayload, 'snr')

if (networkType == "Chirpstack") {
    for (item in loraInfo) {
        if (item.containsKey('rssi')) {
            rssi << [
                    type      : "Property",
                    value     : item.rssi,
                    observedAt: time,
                    datasetId : "urn:ngsi-ld:Dataset:Gateway:${item.gatewayId.toUpperCase()}:Raw"
            ]
        }
        if (item.containsKey('snr')) {
            snr << [
                    type      : "Property",
                    value     : item.snr,
                    observedAt: time,
                    datasetId : "urn:ngsi-ld:Dataset:Gateway:${item.gatewayId.toUpperCase()}:Raw"
            ]
        }
    }
}
else if (networkType == "Live Objects") {
    if (loraInfo.containsKey('rssi')) {
        rssi << [
                type      : "Property",
                value     : loraInfo.rssi,
                observedAt: time,
                datasetId : "urn:ngsi-ld:Dataset:Gateway:LiveObjects:Raw"
        ]
    }
    if (loraInfo.containsKey('snr')) {
        snr << [
                type      : "Property",
                value     : loraInfo.snr,
                observedAt: time,
                datasetId : "urn:ngsi-ld:Dataset:Gateway:LiveObjects:Raw"
        ]
    }
}
else if (networkType == "Netmore") {
    if (loraInfo.containsKey('rssi')) {
        rssi << [
                type      : "Property",
                value     : loraInfo.rssi,
                observedAt: time,
                datasetId : "urn:ngsi-ld:Dataset:Gateway:Netmore:Raw"
        ]
    }
    if (loraInfo.containsKey('snr')) {
        snr << [
                type      : "Property",
                value     : loraInfo.snr,
                observedAt: time,
                datasetId : "urn:ngsi-ld:Dataset:Gateway:Netmore:Raw"
        ]
    }
}
else if (networkType == "ThingPark") {
    for (item in loraInfo) {
        if (item.containsKey('LrrRSSI')) {
            rssi << [
                    type      : "Property",
                    value     : item.LrrRSSI,
                    observedAt: time,
                    datasetId : "urn:ngsi-ld:Dataset:Gateway:${item.Lrrid.toUpperCase()}:Raw"
            ]
        }
        if (item.containsKey('LrrSNR')) {
            snr << [
                    type      : "Property",
                    value     : item.LrrSNR,
                    observedAt: time,
                    datasetId : "urn:ngsi-ld:Dataset:Gateway:${item.Lrrid.toUpperCase()}:Raw"
            ]
        }
    }
}

if (!rssi.isEmpty()) {
    decodedPayload[0].rssi = rssi
}
if (!snr.isEmpty()) {
    decodedPayload[0].snr = snr
}

flowFile = session.write(flowFile, { outputStream ->
    outputStream.write(
            JsonOutput.toJson(decodedPayload)
                    .getBytes(StandardCharsets.UTF_8)
    )
} as OutputStreamCallback)

session.transfer(flowFile, REL_SUCCESS)