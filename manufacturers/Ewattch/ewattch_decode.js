/*
 *  Lorawan Ewattch Javascript Decoder v1.1.8
 *  Date : 2024-05-07
 *  Author: Guillaume Caruso, Ewattch
 *
 *
 *  Decoder for Ewattch Lorawan Products, written in javascript
 *
 *
 *  BSD 3-Clause License
 *
 *  Copyright (c) 2021, Ewattch
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *
 *  1. Redistributions of source code must retain the above copyright notice, this
 *     list of conditions and the following disclaimer.
 *
 *  2. Redistributions in binary form must reproduce the above copyright notice,
 *     this list of conditions and the following disclaimer in the documentation
 *     and/or other materials provided with the distribution.
 *
 *  3. Neither the name of the copyright holder nor the names of its
 *     contributors may be used to endorse or promote products derived from
 *     this software without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 *  DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 *  FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 *  DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 *  SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 *  CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 *  OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 *  OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// change by EGM : mAh converted to Ah

function signed16(e){return 32768&e&&(e-=65536),e}function signed8(e){return 128&e&&(e-=256),e}function float(e){var t,a=(2139095040&e)>>23;0===a?(t=!0,a=-149):(t=!1,a=a-127-23);var r=8388607&e;return!1===t&&(r|=8388608),2147483648&e?-Math.pow(2,a)*r:Math.pow(2,a)*r}function decodeUplink(e){return LoraWANEwattchDecoder(e.bytes,e.fPort,!0)}String.prototype.padStart||(String.prototype.padStart=function(e,t){return e>>=0,t=String(void 0!==t?t:" "),this.length>e?String(this):((e-=this.length)>t.length&&(t+=t.repeat(e/t.length)),t.slice(0,e)+String(this))}),LoraWANEwattchDecoder=function(e,t,a){var r={"00":"environnement","01":"presence","02":"ambiance","08":"squid",10:"impulse",20:"tyness",28:"tynode"},n={"00":[2,function(e,t,a){return{uuid:"temperature_s"+t+"_c"+a,hardwareData:{socket:t,channel:a},type:"temperature",value:signed16(e[0]|e[1]<<8)/100,unit:"°C"}},function(e,t){return"temperature_s"+e+"_c"+t}],"04":[1,function(e,t,a){return{uuid:"humidity_s"+t+"_c"+a,hardwareData:{socket:t,channel:a},type:"humidity",value:e[0]/2,unit:"%RH"}},function(e,t){return"humidity_s"+e+"_c"+t}],"08":[2,function(e,t,a){return{uuid:"C02_s"+t+"_c"+a,hardwareData:{socket:t,channel:a},type:"co2",value:e[0]|e[1]<<8,unit:"ppm"}},function(e,t){return"C02_s"+e+"_c"+t}],"0C":[2,function(e,t,a){return{uuid:"counter_s"+t+"_c"+a,hardwareData:{socket:t,channel:a},type:"counter",value:e[0]|e[1]<<8,unit:""}},function(e,t){return"counter_s"+e+"_c"+t}],"0E":[3,function(e,t,a){return{uuid:"time_s"+t+"_c"+a,hardwareData:{socket:t,channel:a},type:"time",value:e[0]|e[1]<<8|e[2]<<16,unit:"s"}},function(e,t){return"time_s"+e+"_c"+t}],10:[2,function(e,t,a){return{uuid:"luminosity_s"+t+"_c"+a,hardwareData:{socket:t,channel:a},type:"luminosity",value:e[0]|e[1]<<8,unit:"lx"}},function(e,t){return"luminosity_s"+e+"_c"+t}],14:[2,function(e,t,a){return{uuid:"motion_s"+t+"_c"+a,hardwareData:{socket:t,channel:a},type:"motion",value:10*(e[0]|e[1]<<8),unit:"s"}},function(e,t){return"motion_s"+e+"_c"+t}],16:[2,function(e,t,a){return{uuid:"pressure_s"+t+"_c"+a,hardwareData:{socket:t,channel:a},type:"pressure",value:signed16(e[0]|e[1]<<8)/100,unit:"barg"}},function(e,t){return"pressure_s"+e+"_c"+t}],18:[2,function(e,t,a){return{uuid:"flow_s"+t+"_c"+a,hardwareData:{socket:t,channel:a},type:"flow",value:(e[0]|e[1]<<8)/100,unit:"m3/h"}},function(e,t){return"flow_s"+e+"_c"+t}],"1A":[2,function(e,t,a){return{uuid:"volume_s"+t+"_c"+a,hardwareData:{socket:t,channel:a},type:"volume",value:e[0]|e[1]<<8,unit:"m3"}},function(e,t){return"volume_s"+e+"_c"+t}],"1C":[4,function(e,t,a){return{uuid:"volume_s"+t+"_c"+a,hardwareData:{socket:t,channel:a},type:"volume",value:float(e[0]|e[1]<<8|e[2]<<16|e[3]<<24),unit:"m3"}},function(e,t){return"volume_s"+e+"_c"+t}],20:[1,function(e,t,a){return i(e,t,a,1)},function(e,t){return"digital_input_s"+e+"_c"+t}],22:[1,function(e,t,a){return i(e,t,a,2)},function(e,t){return"digital_input_s"+e+"_c"+t}],24:[1,function(e,t,a){return i(e,t,a,4)},function(e,t){return"digital_input_s"+e+"_c"+t}],26:[1,function(e,t,a){return i(e,t,a,8)},function(e,t){return"digital_input_s"+e+"_c"+t}],28:[3,function(e,t,a){var r,n,u;r=(224&e[0])>>5?.001:.01;0==(31&e[0])?(n="mA",u="4:20"):1==(31&e[0])?(n="V",u="0:10"):2==(31&e[0])&&(n="V",u="0:24");return{uuid:"analog_input_s"+t+"_c"+a,hardwareData:{socket:t,channel:a,scale:u},type:"analogInput",value:signed16(e[1]|e[2]<<8)*r,unit:n}},function(e,t){return"analog_input_s"+e+"_c"+t}],40:[0,function(e,t,a){var r=0,n=(240&e[r])>>4,u=15&e[r],i=[];if(2===(r++,u)){for(var c=0;c<n;c++)i.push({type:"currentIndex",hardwareData:{socket:t,channel:a+c},uuid:"clamp_s"+t+"_c"+(a+c),value:0.01*(e[r]|e[r+1]<<8|e[r+2]<<16),unit:"Ah"}),r+=3;for(c=0;c<n;c++)i.push({type:"current",hardwareData:{socket:t,channel:a+c},uuid:"clamp_s"+t+"_c"+(a+c),value:0.001*(e[r]|e[r+1]<<8|e[r+2]<<16),unit:"A"}),r+=3}else{var o={0:["currentIndex",10,"mAh"],1:["current",1,"mA"],3:["consumedActiveEnergyIndex",10,"Wh"],4:["power",1,"W"],5:["producedActiveEnergyIndex",10,"Wh"],6:["positiveReactiveEnergyIndex",10,"varh"],7:["negativeReactiveEnergyIndex",10,"varh"],8:["reactivePower",1,"var"],9:["apparentEnergyIndex",10,"VAh"],10:["voltage",.1,"V"],11:["apparentPower",1,"VA"],12:["frequency",.01,"hZ"]}[u.toString()];if(null==o)return"No such measure code";var s=10===u||12===u?2:3;for(c=0;c<n;c++){var d=2===s?e[r]|e[r+1]<<8:e[r]|e[r+1]<<8|e[r+2]<<16;(4===u||8===u)&&8388608&d&&(d|=4278190080),i.push({type:o[0],hardwareData:{socket:t,channel:a+c},uuid:"clamp_s"+t+"_c"+(a+c),value:d*o[1],unit:o[2]}),r+=s}}return e.splice(0,r),i},function(e,t){return"clamp_s"+e+"_c"+t}],44:[4,function(e,t,a){return{uuid:"active_energy_s"+t+"_c"+a,hardwareData:{socket:t,channel:a},type:"activeEnergyIndex",value:e[0]|e[1]<<8|e[2]<<16|e[3]<<24,unit:"kWh"}},function(e,t){return"active_energy_s"+e+"_c"+t}],46:[4,function(e,t,a){return{uuid:"reactive_energy_s"+t+"_c"+a,hardwareData:{socket:t,channel:a},type:"reactiveEnergyIndex",value:e[0]|e[1]<<8|e[2]<<16|e[3]<<24,unit:"kvarh"}},function(e,t){return"reactive_energy_s"+e+"_c"+t}],48:[0,function(e,t,a){for(var r=0,n=[],u=0;u<12;u++)n.push({type:"currentIndex",hardwareData:{socket:t,channel:a+u},uuid:"clamp_s"+t+"_c"+(a+u),value:0.01*(e[r]|e[r+1]<<8|e[r+2]<<16),unit:"Ah"}),r+=3;return e.splice(0,r),n},function(e,t){return"clamp_s"+e+"_c"+t}],50:[0,function(e,t,a){var r=0,n={uuid:"tic_s"+t+"_c"+a,hardwareData:{socket:t,channel:a},type:"tic",values:[],metadata:{}},u=e[r];r++;var i,_=0,f=0;15==(15&u)||14==(15&u)||0===u?(n.metadata.counterError=c[u.toString(16).toUpperCase().padStart(2,"0")]||"error code 0x"+u.toString(16).padStart(2,"0"),e.splice(0,r)):n.metadata.counterType=c[u.toString(16).toUpperCase().padStart(2,"0")];var g,P=[];switch(u){case 16:switch(n.metadata.checksum=e[1],_=(224&(i=e[2]))>>5&7,f=31&i,n.metadata.subscription=o[_.toString(16).toUpperCase().padStart(2,"0")],n.metadata.tarrifPeriod=s[f.toString(16).toUpperCase().padStart(2,"0")],r+=2,_){case 0:P=["Base"];break;case 1:P=["HC","HP"];break;case 2:P=["Heures Normales","Heures Pointe mobile"];break;case 3:P=["HC Jour bleu","HC Jour blanc","HC Jour rouge","HP Jour bleu","HP Jour blanc","HP Jour rouge"]}for(var H=0;H<P.length;H++)g=P[H],n.values.push({type:g,value:e[r]|e[r+1]<<8|e[r+2]<<16|e[r+3]<<24,unit:"Wh"}),r+=4;break;case 32:_=(240&(i=e[r]))>>4&15,f=15&i,n.metadata.subscription=d[_.toString(16).toUpperCase().padStart(2,"0")],n.metadata.tarrifPeriod=l[f.toString(16).toUpperCase().padStart(2,"0")],r++,P=["1","2","3","4"];for(H=0;H<P.length;H++)g=P[H],n.values.push({value:e[r]|e[r+1]<<8|e[r+2]<<16,unit:"kWh"}),r+=3;break;case 48:_=e[r],n.metadata.subscription=p[_.toString(16).toUpperCase().padStart(2,"0")],f=e[++r],n.metadata.tarrifPeriod=v[f.toString(16).toUpperCase().padStart(2,"0")],r++,P=["ActiveEnergyCurrentPeriode","PositiveReactiveEnergyCurrentPeriode","NegativeReactiveEnergyCurrentPeriode","ActiveEnergyPreviousPeriode","PositiveReactiveEnergyPreviousPeriode","NegativeReactiveEnergyPreviousPeriode"];for(H=0;H<P.length;H++)g=P[H],n.values.push({type:g,value:e[r]|e[r+1]<<8|e[r+2]<<16,unit:H%3==0?"kWh":"kVarh"}),r+=3;break;case 64:switch(_=e[r],n.metadata.subscription=h[_.toString(16).toUpperCase().padStart(2,"0")],f=e[++r],n.metadata.tarrifPeriod=m[f.toString(16).toUpperCase().padStart(2,"0")],r++,n.values.activePower10Minutes={value:e[r]|e[r+1]<<8,unit:"kW"},r+=2,n.values.reactivePower10Minutes={value:e[r]|e[r+1]<<8,unit:"kVar"},r+=2,_){case 10:P=["P","HPH","HCH","HPE","HCE"];break;case 11:P=["P","HPH","HCH","HPD","HCD","HPE","HCE","JA"];break;case 16:P=["PM","HH","HPE","HCE"];break;case 17:P=["PM","HH","HD","HPE","HCE","JA"];break;case 18:P=["PM","HM","DSM","SCM"]}for(H=0;H<P.length;H++)g=P[H],n.values.push({type:g,value:e[r]|e[r+1]<<8|e[r+2]<<16,unit:"kWh"}),r+=3;break;case 80:n.metadata.checksum=e[r],f=e[++r],n.metadata.tarrifPeriod=31&f,r++,n.values.push({value:e[r]|e[r+1]<<8|e[r+2]<<16|e[r+3]<<24,unit:"Wh"}),r+=4;break;case 81:n.metadata.checksum=e[r],f=e[++r],n.metadata.tarrifPeriod=31&f,r++,n.values.push({value:e[r]|e[r+1]<<8|e[r+2]<<16|e[r+3]<<24,unit:"Wh"}),r+=4,n.values.push({value:e[r]|e[r+1]<<8|e[r+2]<<16|e[r+3]<<24,unit:"Wh"}),r+=4;break;case 96:n.metadata.checksum=e[r],r++,n.metadata.tarrifPeriod=String.fromCharCode(e[r])+String.fromCharCode(e[r+1])+String.fromCharCode(e[r+2]),r+=3,n.values.push({type:"tgphis",value:signed16(e[r]|e[r+1]<<8)/100,unit:""}),r+=2,P=["1","2","3","4","5","6","7","8"];for(H=0;H<P.length;H++)g=P[H],n.values.push({value:e[r]|e[r+1]<<8|e[r+2]<<16|e[r+3]<<24,unit:"Wh"}),r+=4}return e.splice(0,r),n},function(e,t){return"tic_s"+e+"_c"+t}],58:[0,function(e,t,a){var r=0,u={uuid:"mbus_s"+t+"_c"+a,hardwareData:{socket:t,channel:a},type:"mbus",values:[],metadata:{}},i=e[r];r++;var c=(240&e[r])>>4,o=15&e[r];switch(c){case 0:u.metadata.device_name="HEAT METER";break;case 1:u.metadata.device_name="WATER METER";break;case 2:u.metadata.device_name="ELECTRICITY METER";break;case 3:u.metadata.device_name="GAZ METER";break;default:return e.splice(0,r),u.metadata.error="Unkwown meter code 0x"+c.toString(16),u}u.metadata.device_slave_adress=i,r++,e.splice(0,r);var s=0;for(;e.length>0&&s<o;){var d,l=1&e[0],p=(254&e[0]).toString(16).toUpperCase().padStart(2,"00"),v=n[p];if(null==v)return u.metadata.error="Unkwown object type 0x"+p.toString(16),u;e.splice(0,1);var h=0,m=0;l&&(h=(224&e[0])>>5,m=31&e[0],e.splice(0,1)),d=v[1](e,h,m),Array.isArray(d)?u.values=u.values.concat(d):u.values.push(d),e.splice(0,v[0]),s++}return u},function(e,t){return"mbus_s"+e+"_c"+t}],"5C":[0,function(e,t,a){var r=0,n={uuid:"modbus_s"+t+"_c"+a,hardwareData:{socket:t,channel:a},type:"modbus",values:[],metadata:{}};r++;var u=e[r];n.metadata.application_code=63&u,n.metadata.standardised=(64&u)>>7==1,r++;var i=e[r];switch(i){case 3:n.metadata.command="Read Holding Registers";break;case 4:n.metadata.command="Read Input Registers";break;case 8:n.metadata.command="Read Diagnostics";break;case 16:n.metadata.command="Write Multiples Registers Response";break;case 80:n.metadata.command="Master Write Multiples Registers Response";break;default:n.metadata.command="Unknown command : "+(127&i)}if(r++,3===i||4===i){n.metadata.startAdress=(e[r+1]<<8)+e[r],r+=2,n.metadata.wordCount=e[r]/2,r++;for(var c=[],o=0;o<n.metadata.wordCount&&!(r+1>e.length);)c.push((e[r+1]<<8)+e[r]),r+=2,o++;n.values=c}return e.splice(0,r),n},function(e,t){return"modbus_s"+e+"_c"+t}],74:[1,function(e,t,a){return{uuid:"battery_s"+t+"_c"+a,hardwareData:{socket:t,channel:a},type:"battery",value:e,unit:""}},function(e,t){return"battery_s"+e+"_c"+t}]},u={"00":[1,function(e,t,a){return{value:r[e[0].toString(16).toUpperCase().padStart(2,"00")],type:"nodeType"}}],"02":[2,function(e,t,a){return{value:e[1]+"."+e[0],type:"version"}}],"04":[1,function(e,t,a){return{value:e[0],type:"batteryLevel"}}],"08":[2,function(e,t,a){return{value:10*(e[0]|e[1]<<8),type:"periodicity"}}]};function i(e,t,a,r){for(var n=[],u=e[0],i=0;i<r;i++)n.push({uuid:"digital_input_s"+t+"_c"+(a+i),hardwareData:{socket:t,channel:a+i},type:"boolean",value:1&u,unit:""}),u>>=1;return e.splice(0,2),n}this.decode=function(e,t,a){if("string"==typeof e){for(var r=[],i=0,c=e.length;i<c;i+=2)r.push(parseInt(e.substr(i,2),16));e=r}null==a&&(a=!0);var o,s=0,d=[];if(a){if(s=0===e[0]?0:1,e[1]!==e.length-2)return d.push({type:"error",value:"Payload size indicated does not match payload size given"}),{data:d};e.splice(0,2)}for(;e.length>0;){var l,p=1&e[0],v=128==(128&e[0]),h=(126&e[0]).toString(16).toUpperCase().padStart(2,"00");if(null==(o=0===s?n[h]:u[h]))return d.push({type:"error",value:"unknown object type : "+h}),{data:d};e.splice(0,1);var m=0,_=0;0===s&&p&&(m=(224&e[0])>>5,_=31&e[0],e.splice(0,1)),v?(d.push({uuid:o[2](m,_),hardwareData:{socket:m,channel:_},type:"error"}),e.splice(0,1)):(l=o[1](e,m,_),Array.isArray(l)?d=d.concat(l):d.push(l),e.splice(0,o[0]))}return{data:d}};var c={"0E":"Données erronées","0F":"Compteur Inconnu",10:"Bleu","1F":"Bleu avec defaut",20:"Jaune","2F":"Jaune avec defaut",30:"PME-PMI","3F":"PME-PMI avec defaut",40:"ICE","4E":"ICE V2.4","4F":"ICE avec defaut",50:"Linky",51:"Linky Injection","5F":"Linky avec defaut",60:"Saphir","6F":"Saphir avec defaut"},o={"00":"Base","01":"HP/HC","02":"EJP","03":"TEMPO"},s={"00":"Base","01":"HC","02":"HP","03":"EJP heures normales","04":"EJP heures de pointe mobile","05":"TEMPO HC Jour Bleu","06":"TEMPO HC Jour Blanc","07":"TEMPO HC Jour Rouge","08":"TEMPO HP Jour Bleu","09":"TEMPO HP Jour Blanc","0a":"TEMPO HP Jour Rouge"},d={"01":"Ete","02":"Hiver","03":"Pointe mobile"},l={"01":"Heures Pleines","02":"Heures Creuses","03":"Heures de pointe","04":"Heures de pointe mobile"},p={"00":"TJ MU","01":"TJ LU","02":"TJ LU-SD","03":"TJ LU-P","04":"TJ LU-PH","05":"TJ LU-CH","06":"TJ EJP","07":"TJ EJP-SD","08":"TJ EJP-PM","09":"TJ EJP-HH","0a":"TV A5 Base","0b":"TV A8 Base","0c":"BT 4 SUP36","0d":"BT 5 SUP36","0e":"HTA 5","0f":"HTA 8"},v={"00":"P","01":"PM","02":"HH","03":"HP","04":"HC","05":"HPH","06":"HCH","07":"HPE","08":"HCE","09":"HPD","0a":"HCD","0b":"JA"},h={"0a":"TV A5 Base","0b":"TV A8 Base",10:"TV A5 EJP",11:"TV A8 EJP",12:"TV A8 MOD"},m={"00":"P","01":"PM","02":"HH","03":"HP","04":"HC","05":"HPH","06":"HCH","07":"HPE","08":"HCE","09":"HPD","0a":"HCD","0b":"JA","0c":"HD","0d":"HM","0e":"DSM","0f":"SCM"};return this.decode(e,t,a)};


module.exports = {
    LoraWANEwattchDecoder: LoraWANEwattchDecoder
}