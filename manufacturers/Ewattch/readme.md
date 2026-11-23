This repository contains LoRaWAN decoders and NGSI-LD wrappers for eWattch devices.
It is based on [javascript decoders](https://ewattch-documentation.com/?page_id=540) as provided by eWattch

These decoders have been modified so that *currentIndex* is rendered in **Ah** and *current* in **A**.

Since SQUID / SQUID V2 devices have no voltage input, each *currentIndex* and *current* measurement is also converted into an estimated *activeEnergy* (Wh) and *activePower* (W), using a nominal voltage of 230 V (`NOMINAL_VOLTAGE` in *ewattch_decode.js*) and a power factor of 1. These estimates use a *datasetId* ending in `:Estimated` instead of `:Raw`, so they never overwrite real measurements sent by a SQUID PRO.

The NGSI-LD wrapping is configured through the mappings *UnitCorresponder* and *AttributeCorresponder* defined in *ngsi-ld.js*.
Only parameters declared in *AttributeCorresponder* are mapped into a NGSI-LD payload

When a device includes different sensors measuring tre same physical quantity (e.g. currents being measured by several clamps in a squid), the uuid of the measure is inserted in the dataSetID. Thus *urn:ngsi-ld:Dataset:Raw* is replaced by *urn:ngsi-ld:Dataset:clamp_s0_c2:Raw*
