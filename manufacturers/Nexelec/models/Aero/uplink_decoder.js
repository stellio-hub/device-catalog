// v3 to v4 compatibility wrapper
function decodeUplink(input) {
    return {
            data: Decode(input.fPort, input.bytes, input.variables)
    };
}

function encodeDownlink(input) {
    return {
            bytes: Encode(input.fPort, input.data, input.variables)
    };
}


///////////////////////////////////////////////////////////////////////////////////
// NEXELEC
// THIS SOFTWARE IS PROVIDED BY NEXELEC ``AS IS'' AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL NEXELEC BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
///////////////////////////////////////////////////////////////////////////////////

function Decode(input)
{
var hex2=[];
var decode={};
var string_bin=""
var tab_bin=[];
var string_bin_elements="";
var buffer=[];
var buffer2=[];
var i=0;
var j=0;
var str=0
var compte=0;
var product_type=0;

// On passe d'un chaine de caractère à  un tableau d'hexa
// On crée un tableau d'hexa (buffer2) 

for(i=0; i<input.length;i++)
{
   str=parseInt(input[i], 16);
   buffer2.push(str);
}

// on viens lire chaque élement du tableau buffer2 pour les convertir en binaire en un seul string.

for(i=0;i<input.length;i++){ 
     string_bin_elements=buffer2[i].toString(2);
     if(string_bin_elements.length<8)
     { // PadStart 
       let nb_zeros=4-string_bin_elements.length;
       for (j=0;j<nb_zeros;j++)
       {
         string_bin_elements="0"+string_bin_elements;
       }
     }
     string_bin=string_bin+string_bin_elements;
 }
 
 for(i=0;i<input.length;i++){
     buffer[i]=""
    for( j=0;j<4;j++)
    { // tableau contenant un hexa de la payload par adresse
        buffer[i]=buffer[i]+string_bin.charAt(compte);
        compte++;
    }
    buffer[i]=parseInt(buffer[i],2);
}

product_type = (buffer[0] << 4) + buffer[1];

const ATMO_LoRa=0xA3; 
const SENSE_LoRa=0xA4; 
const AERO_LoRa=0xA5; 
const PMI_LoRa=0xA6; 
const Aero_CO2_LoRa=0xA7; 

switch(product_type){

	case  ATMO_LoRa:
        decode["Type_of_Product"] = "ATMO_LoRa";
		break;
	case  SENSE_LoRa:
        decode["Type_of_Product"] = "SENSE_LoRa";
		break;	
	case  Aero_CO2_LoRa:
        decode["Type_of_Product"] = "Aero_CO2_LoRa";
		break;		
    case  AERO_LoRa:
        decode["Type_of_Product"] = "AERO_LoRa";
		break;
	case  PMI_LoRa:
        decode["Type_of_Product"] = "PMI_LoRa";
		break;
}

    let tab_adjectif_level = ["Very Good", "Good", "Average", "Warning", "Bad", "Erreur"];
    let tab_adjectif_SRC = ["All", "Dryness Indicator", "Mould Indicator", "Dust Mites Indicator", "CO", "CO2", "VOC", "Formaldehyde", "PM1.0", "PM2.5", "PM10", "Erreur"];


    let message_type;
    if (product_type === ATMO_LoRa || product_type === SENSE_LoRa || product_type === AERO_LoRa || product_type === PMI_LoRa || product_type === Aero_CO2_LoRa) {
        let tab_decodage_ATMO_Real_Time = [8, 8, 11, 11, 11, 10, 8, 14, 14, 10, 3, 4, 3, 3, 3, 3, 3, 3, 3, 8, 7, 7, 8, 10, 16, 8, 8, 3, 4, 3, 3, 3, 3, 3, 5];
        let tab_decodage_Atmo_Product_Status_Message = [8, 8, 8, 8, 10, 10, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 8, 6, 4, 5, 5, 6, 4];
        let tab_decodage_Atmo_Product_Configuration_Message = [8, 8, 2, 2, 1, 2, 1, 1, 1, 2, 1, 3, 8, 8, 8, 8, 8, 10, 10, 10, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8];
        let tab_decodage_Atmo_Keepalive_Message = [8, 8];
        let tab_decodage_Atmo_Button_Frame_Message = [8, 8];

        // On initialise les différents type de message
        let Type_ATMO_Real_Time = 0x01;
        let Type_Atmo_Product_Status_Message = 0x02;
        let Type_Atmo_Product_Configuration_Message = 0x03;
        let Type_Atmo_Keepalive_Message = 0x04;
        let Type_Atmo_Button_Frame = 0x05;

        message_type = (buffer[2] << 4) + buffer[3];
        switch (message_type) {
            case Type_ATMO_Real_Time:
                tab_decode(tab_decodage_ATMO_Real_Time);
                decode["Type_of_message"] = "Real_Time";
                decode["Concentration_PM_1"] = tab_bin[2];
                decode["Concentration_PM_2.5"] = tab_bin[3];
                decode["Concentration_PM_10"] =  tab_bin[4];
                decode["Temperature(°C)"] =  temp_PM(tab_bin[5]);
                decode["Relative_Humidity_(%RH)"] = RH(tab_bin[6]);
                decode["Total_CO2(ppm)"] = tab_bin[7];
                decode["Total_COV(ppm)"] = tab_bin[8];
                decode["Formaldehydes(ppb)"] = tab_bin[9];
                decode["IZIAIR_Level"] = get_iaq(tab_bin[10]);
                decode["IZIAIR_Source"] = get_iaq_SRC(tab_bin[11]);
                decode["IAQ_CO2"] = get_iaq(tab_bin[12]);
                decode["IAQ_VOCs"] = get_iaq(tab_bin[13]);
                decode["IAQ_Formaldehyde"] = get_iaq(tab_bin[14]);
                decode["IAQ_PM1.0"] = get_iaq(tab_bin[15]);
                decode["IAQ_PM2.5"] = get_iaq(tab_bin[16]);
                decode["IAQ_PM10"] = get_iaq(tab_bin[17]);
                decode["IAQ_TH"] = get_iaq(tab_bin[18]);
                decode["Luminosity(lux)"] = 5 * (tab_bin[19]);
                decode["Average_Noise(dB)"] = tab_bin[20];
                decode["Peak_Noise(dB)"] = tab_bin[21];
                decode["Presence_counter"] = tab_bin[22];
                decode["Pressure"] = pressure(tab_bin[23]);
                decode["Frame_index"] = tab_bin[33];
                break;

            case Type_Atmo_Product_Status_Message:
                tab_decode(tab_decodage_Atmo_Product_Status_Message);
                decode["Type_of_message"] =  "Product_Status";
                decode["HW_Version"] = tab_bin[2];
                decode["SW_Version"] = tab_bin[3];
                decode["Product_HW_Status"] = hardware_status(tab_bin[6]);
                decode["PM_sensor_status"] = sensor_status(tab_bin[7]);
                decode["Temperature_sensor_status"] = sensor_status(tab_bin[8]);
                decode["Formaldehyde_sensor_status"] = sensor_status(tab_bin[9]);
                decode["CO2_sensor_status"] = sensor_status(tab_bin[10]);
                decode["COV_sensor_status"] = sensor_status(tab_bin[11]);
                decode["PIR_sensor_status"] = sensor_status(tab_bin[12]);
                decode["Microphone_status"] = sensor_status(tab_bin[13]);
                decode["Pressure Sensor Status"] = sensor_status(tab_bin[14]);
                decode["Accelerometer Sensor Status"] = sensor_status(tab_bin[15]);
                decode["Luminosity Sensor Status"] = sensor_status(tab_bin[16]);
                decode["Pending Join"] = PendingJoin(tab_bin[17]);
                decode["Product Activation time-counter"] = tab_bin[18];
                decode["Product Date Year"] = tab_bin[19];
                decode["Product Date Month"] = tab_bin[20];
                decode["Product Date Day"] = tab_bin[21];
                decode["Product Date Hour"] = tab_bin[22];
                decode["Product Date Minute"] = tab_bin[23];
                break;

            case Type_Atmo_Product_Configuration_Message:
                tab_decode(tab_decodage_Atmo_Product_Configuration_Message);
                decode["Type_of_message"] = "Product_Configuration_Message";
                decode["Reconfiguration source"] = reconfiguration_source(tab_bin[2]);
                decode["Reconfiguration status"] = reconfiguration_status(tab_bin[3]);
                decode["LED enable"] = active(tab_bin[4]);
                decode["LED function"] = LED_function(tab_bin[5]);
                decode["IAQ Medium levels indication enable"] = active(tab_bin[6]);
                decode["Button enable"] = active(tab_bin[7]);
                decode["Keepalive enable"] = active(tab_bin[8]);
                decode["NFC_status"] = nfc_status(tab_bin[9]);
                decode["LoRa Region"] = LoRa_Region(tab_bin[11]);
                decode["Period between measurements (minutes)"] = tab_bin[12];
                decode["Keepalive period (hours)"] = tab_bin[13];
                decode["Altitude"] = 50 * tab_bin[14];
                decode["CO2 threshold 1"] = 20 * tab_bin[15];
                decode["CO2 threshold 2"] = 20 * tab_bin[16];
                break;

            case Type_Atmo_Button_Frame:
                tab_decode(tab_decodage_Atmo_Button_Frame_Message);
                decode["Type_of_message"] = "Button Frame";
                break;

            case Type_Atmo_Keepalive_Message:
                tab_decode(tab_decodage_Atmo_Keepalive_Message);
                decode["Type_of_message"] = "Keepalive_Message";
                break;

        }
    }

    //return decode;
    return {
        data: decode,
        errors: [],
        warnings: []
    };

function tab_decode (tab){ // on rentre en paramà¨tre la table propre à  chaque message 
	let compteur=0;
    let str1;
    for (i = 0; i < tab.length; i++) {  // tab.length nousdonne donc le nombre d'information à  décoder pour ce message
        tab_bin[i] = "";
        for (j = 0; j < tab[i]; j++) { // tab[i] nous donne le nombre de bits sur lequel est codée l'information i
            str1 = string_bin.charAt(compteur); // compteur va aller de 0 jusqu'à  la longueur de string_bin
            tab_bin[i] = tab_bin[i] + str1;       // A la fin de ce deuxià¨me for: tab_bin[i] sera composé de tab[i] bits
            compteur++;
        }
        // Problà¨me si tab[i] bits est différent de 4 (ou 8) bits ca ne correspond à  1 (ou 2) hexa donc:  ne pourra pas conrrectement convertir les binaires en hexa
        // Donc  il faut qu'on fasse un bourrage de 0 grà¢ce à  padstart
        if (tab_bin[i].length > 4) { // pour les données de tailles supérieures à  4 bits et inféireures ou égales à  8 bits
            tab_bin[i] = tab_bin[i].padStart(8, '0');
            tab_bin[i] = parseInt(tab_bin[i], 2).toString(16).toUpperCase(); // Puis on convertit les binaire en hexa (en string)
            tab_bin[i] = parseInt(tab_bin[i], 16);//puis on convertit les string en int
        } else { // pour les données de tailles inférieures ou égales à  4 bits
            tab_bin[i] = tab_bin[i].padStart(4, '0');
            tab_bin[i] = parseInt(tab_bin[i], 2).toString(16).toUpperCase();
            tab_bin[i] = parseInt(tab_bin[i], 16);
        }
    }
 }


function battery(a){
    let result="";
    switch(a){
        case 0:
            result="High";
            break
        case 1: 
            result="Medium";
            break
        case 2: 
            result="Critical";
            break
        }
    return result;
}
    

function hw_mode(a){
    let result="";
    switch(a){
        case 0:
            result="Sensor OK";
            break
        case 1: 
            result="Sensor fault";
            break
        }
    return result;
}
    
function push_button(a){
    let result="";
    switch(a){
        case 0: 
            result="Short Push";
            break
            
        case 1: 
            result="Long Push";
            break
            
        case 2: 
            result="Multiple Push(x3)";     
            break
            
        case 3: 
            result="Multiple Push(x6)";     
            break                
    }
    
    return result;
}

function th(a){
    let result="";
    switch(a){
        case 0: 
            result="not reached";
            break
    
    
        case 1: 
            result="reached";
            break
    }
    
    return result;
}

function active(a){
    let result="";
    switch(a){
        case 0: 
            result="Non-Active";
           break
        case 1: 
            result="Active";
    }
    return result;
}


function temp_PM(a){
    switch(a){
        case 1023:
            return 65535;
        default :
            return 0.1*(a-300);
    }
}

function RH_PM(a){

    switch(a){
        case 127:
            return 127;
        default : 
            return a;
    }
}

function micro_PM(a){

    switch(a){
        case 65535: 
            return a;
        default : 
            return 0.1*a;
    }
}

function pcs_PM(a){

    switch(a){
        case 65535: 
            return 65535;
        default : 
            return a;
    }
}

function sensor_status(a){
    let result="";
    switch(a){
        case 0:
            result="Sensor OK";
            break;
        case 1: 
            result="Sensor Fault";
            break;
        case 2: 
            result="Sensor not populated";
            break;
    }
    return result;
}

function hardware_status(a){
    let result="";
    switch(a){
        case 0:
            result="Hardware OK";
            break;
        case 1: 
            result="Hardware Fault";
            break;
    }
    return result;
}

function temp(a){
    if(a === 255){
        return a;
    }
    
    else{
        return 0.2*a;
    }
}

function co2(a){
    if(a === 255){
        return a;
    }
    
    else{
        return 20*a;
    }
}


function RH(a){
    if(a === 255){
        return a;
    }
    else{
        return 0.5*a;
    }
}


function get_iaq (a){
    let result="";
    switch(a){
        case 0:
        result=tab_adjectif_level[0];
        break;
         
        case 1:
        result=tab_adjectif_level[1];
        break;
         
        case 2:
        result=tab_adjectif_level[2];
        break;
         
        case 3:
        result=tab_adjectif_level[3];
        break;
    
        case 4:
        result=tab_adjectif_level[4];
        break;
         
        case 7:
        result=tab_adjectif_level[5];
        break;

    }
    return result; 
}


function get_iaq_SRC(a){
    let result="";
    
    switch(a){
        case 0:
        result=tab_adjectif_SRC[0];
        break;
         
        case 1:
        result=tab_adjectif_SRC[1];
        break;
         
        case 2:
        result=tab_adjectif_SRC[2];
        break;
         
        case 3:
        result=tab_adjectif_SRC[3];
        break;
    
        case 4:
        result=tab_adjectif_SRC[4];
        break;
         
        case 5:
        result=tab_adjectif_SRC[5];
        break;
        
        case 6:
        result=tab_adjectif_SRC[6];
        break;
        
        case 7:
        result=tab_adjectif_SRC[7];
        break;
        
        case 8:
        result=tab_adjectif_SRC[8];
        break;
        
        case 15:
        result=tab_adjectif_SRC[9];
        break;
    }
    return result; 
}


function get_IAQ_HCI(a){
    let result="";
    switch(a){
        case 0:
        result=tab_adjectif_level[1];
        break;
         
        case 1:
        result=tab_adjectif_level[2];
        break;
         
        case 2:
        result=tab_adjectif_level[4];
        break;
         
        case 3:
        result=tab_adjectif_level[5];
        break;
    }
    return result; 
}

function HW_SW_Revision(a)
{
    let result="";
    switch(a)
	{
        case 0:
            result="A";
            break;
        case 1: 
            result="B";
            break;
        case 2: 
            result="C";
            break;
		case 3: 
            result="D";
            break;
        case 4: 
            result="E";
            break;
        case 5: 
            result="F";
            break;
        case 6: 
            result="G";
            break;			
    }
    return result;
}

function Yes_No(a)
{
	let result="";
	switch(a)
	{
		case 0:
			result="No";
			break;
		case 1:
			result="Yes";
			break;
	}
	return result;
}

function battery_level(a){
let result="";
switch(a){
    case 0:
        result="High";
        break;
    case 1: 
        result="Medium";
        break;
    case 2: 
        result="Low";
        break;
	case 3: 
        result="Critical";
        break;
}
return result;
}

function temperature_9bits(a)
{
	if(a > 500)
	{
		return 511;
	}	
	else
	{
		return 0.1*a;
	}
}
	
function nfc_status(a)
{
    if (a===0){
        return "Discoverable";
    }else if(a===1){
        return "Not discoverable"
    }else {
        return "RFU"
    }
}


function LoRa_Region(a)
{
  let result="";
	switch(a){
  	case 0: 
  		result="EU868";
  		break;
  	}
  	return result;
}

function reconfiguration_source(a)
{
  let result="";
	switch(a){
  	case 0: 
  		result="NFC";
  	break;
  	
  	case 1:
  	 	result="Downlink"; 
   	break;
  	
  	case 2:
  	  	result="Product start-up";
  	break;
  }
  return result;
}

function reconfiguration_status(a)
{
  let result="";
	switch(a){
  	case 0: 
  		result="Total success";
  	break;
  	
  	case 1:
  	 	result="Partial success"; 
  	break;
  	
  	case 2:
  	  	result="Total failure";
  	break;
  }
  return result;
}	

function PM(a)
{
	let result="Error";
	
	if(a === 2047){
        return result;
    }
    
    else{
        return a;
    }
}

function CO2COV(a)
{
	let result="Error";
	
	if(a === 16383){
        return result;
    }
    
    else{
        return a;
    }
}

function Formaldehyde(a)
{
	let result="Error";
	
	if(a === 1047){
        return result;
    }
    
    else{
        return a;
    }
}

function Luminosity(a)
{
	let result="Error";
	
	if(a === 255){
        return result;
    }
    
    else{
        return a*5;
    }
}

function Noise(a)
{
	let result="Error";
	
	if(a === 127){
        return result;
    }
    
    else{
        return a;
    }
}

function Occupancy(a)
{
	let result="Error";
	
	if(a === 255){
        return result;
    }
    
    else{
        return a;
    }
}

function Voltage(a)
{
	return a*1000
}

function HardwareStatus(a)
{
	let result="";
    switch(a){
        case 0: 
            result="Hardware OK ";
            break;
        case 1: 
            result="Hardware fault ";
            break;
    }
    return result;
}

function pressure(a){
    switch(a){
        case 1023:
            return 65535;
        default :
            return a+300;
    }
}

function PendingJoin(a)
{
	let result="";
    switch(a){
        case 0: 
            result="No join request scheduled";
            break;
        case 1: 
            result="Join request scheduled";
            break;
    }
    return result;
}

function LED_function(a){
    let result="";
    switch(a){
        case 0: 
            result="Global Air Quality";
            break;
        case 1: 
            result="CO2 level";
            break;
    }
    return result;
}
} // End decode function

// Added by EGM for NGSI-LD conversion

function parseISOString(s) {
        var b = s.split(/\D+/);
        return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
      }

function ngsildInstance(value, time, unit, dataset_suffix) {
    var ngsild_instance = {
        type: 'Property',
        value: value,
        observedAt: time
    }
    if (unit !== null) {
        ngsild_instance.unitCode = unit
    }
    if (dataset_suffix !== null) {
        ngsild_instance.datasetId = 'urn:ngsi-ld:Dataset:' + dataset_suffix
    }
    return ngsild_instance
}

function ngsildWrapper(input, time) {
    var payload = input.data
    if (payload.Type_of_message === 'Real_Time') {
        var ngsild_payload = { 
            pm1: ngsildInstance(payload['Concentration_PM_1'], time, 'GQ', 'Raw'),
            pm2_5: ngsildInstance(payload['Concentration_PM_2.5'], time, 'GQ', 'Raw'),
            pm10: ngsildInstance(payload['Concentration_PM_10'], time, 'GQ', 'Raw'),
            temperature: ngsildInstance(payload['Temperature(°C)'], time, 'CEL', 'Raw'),
            humidity: ngsildInstance(payload['Relative_Humidity_(%RH)'], time, 'P1', 'Raw'),
            co2: ngsildInstance(payload['Total_CO2(ppm)'], time, '59', 'Raw'),
            cov: ngsildInstance(payload['Total_COV(ppm)'], time, '59', 'Raw'),
            formaldehydes: ngsildInstance(payload['Formaldehydes(ppb)'], time, '61', 'Raw'),
            luminosity: ngsildInstance(payload['Luminosity(lux)'], time, 'LUX', 'Raw'),
            noise: ngsildInstance(payload['Average_Noise(dB)'], time, '2N', 'Raw'),
            peak_noise: ngsildInstance(payload['Peak_Noise(dB)'], time, '2N', 'Raw'),
            presence: ngsildInstance(payload['Presence_counter'], time, 'P1', 'Raw'),
            pressure: ngsildInstance(payload['Pressure'], time, 'A97', 'Raw'),
            indoorAirQuality: [
                ngsildInstance(payload['IAQ_CO2'], time, null, 'co2'),
                ngsildInstance(payload['IAQ_VOCs'], time, null, 'VOCs'),
                ngsildInstance(payload['IAQ_Formaldehyde'], time, null, 'Formaldehyde'),
                ngsildInstance(payload['IAQ_PM1.0'], time, null, 'PM1.0'),
                ngsildInstance(payload['IAQ_PM2.5'], time, null, 'PM2.5'),
                ngsildInstance(payload['IAQ_PM10'], time, null, 'PM10'),
                ngsildInstance(payload['IAQ_TH'], time, null, 'TH'),
            ]
        };
    }
    else if (payload.Type_of_message === 'Datalog') {
        var date = new Date(time);
        var time_n1 = new Date(date.setDate(date.getDate() - 1)).toISOString();
        var time_n2 = new Date(date.setDate(date.getDate() - 1)).toISOString();
        var ngsild_payload = {
            co2: [
                ngsildInstance(payload['CO2_concentration_n'], time, '59', 'Raw'),
                ngsildInstance(payload['CO2_concentration_n-1'], time_n1, '59', 'Raw'),
                ngsildInstance(payload['CO2_concentration_n-2'], time_n2, '59', 'Raw')
            ],
            temperature: [
                ngsildInstance(payload['Temperature_n'], time, 'CEL', 'Raw'),
                ngsildInstance(payload['Temperature_n-1'], time_n1, 'CEL', 'Raw'),
                ngsildInstance(payload['Temperature_n-2'], time_n2, 'CEL', 'Raw')
            ],
            humidity: [
                ngsildInstance(payload['Relative_Humidity_n'], time, 'P1', 'Raw'),
                ngsildInstance(payload['Relative_Humidity_n-1'], time_n1, 'P1', 'Raw'),
                ngsildInstance(payload['Relative_Humidity_n-2'], time_n2, 'P1', 'Raw')
            ]
        };
    }
    else if (payload.Type_of_message === 'Config_General') {
        delete payload.Type_of_Product;
        delete payload.Type_of_message;
        var ngsild_payload = {
            configGeneral: ngsildInstance(payload, time, null, null)
        };
    }
    else if (payload.Type_of_message === 'Config_CO2') {
        delete payload.Type_of_Product;
        delete payload.Type_of_message;
        var ngsild_payload = {
            co2Config: ngsildInstance(payload, time, null, null)
        };
    }
    else if (payload.Type_of_message === 'Product_Status') {
        delete payload.Type_of_Product;
        delete payload.Type_of_message;
        var ngsild_payload = {
            productStatus: ngsildInstance(payload, time, null, null)
        };
    }
    else if (payload.Type_of_message === 'Product_Status_Message') {
        delete payload.Type_of_Product;
        delete payload.Type_of_message;
        var ngsild_payload = {
            productStatusMessage: ngsildInstance(payload, time, null, null)
        };
    }
    else if (payload.Type_of_message === 'Push') {
        delete payload.Type_of_Product;
        delete payload.Type_of_message;
        var ngsild_payload = {
            buttonActivation: ngsildInstance(1, time, null, null)
        };
    }
    else if (payload.Type_of_message === 'Keep_Alive') {
        var ngsild_payload = {};
    }
    else {
        throw new Error('Unsupported Type_of_message:');
    }
    return ngsild_payload;
}

function main() {
    var payload = process.argv[3];
    var time = process.argv[4];
    var decoded = Decode(payload);
    var ngsild_payload = ngsildWrapper(decoded, time);
    process.stdout.write(JSON.stringify(ngsild_payload));
}

if (require.main === module) {
    main();
}
