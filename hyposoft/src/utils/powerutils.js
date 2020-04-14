import axios from 'axios'
import * as firebaseutils from './firebaseutils'
import * as logutils from './logutils'

// Example usage: powerutils.getBladeStatus('test-chassis', 1, () => {})
function getBladeStatus(chassis, blade, callback) {
    axios.get('https://hyposoft-53c70.appspot.com/getBCMANStatus?chassis='+chassis+'&blade='+blade, {}).then(response => {
        if (response.data === 'Failed') {
            callback(null)
        } else {
            callback(response.data)
        }
    }).catch(() => {
        callback(null)
    })
}

function changeBladePower(chassis, blade, callback, powerStatus) {
    axios.get('https://hyposoft-53c70.appspot.com/BCMANPower?chassis='+chassis+'&blade='+blade+'&powerStatus='+powerStatus, {}).then(response => {
        if (response.data === 'Failed') {
            callback(null)
        } else {
            // TODO: Change the log statement below when logging for BCMAN is implemented
            logutils.addLog(null,logutils.BCMAN(),powerStatus === "ON" ? logutils.POWER_ON() : logutils.POWER_OFF(),{pdu: chassis, portNumber: blade})
            callback(response.data) // Data should be 'Success'
        }
    }).catch(() => {
        callback(null)
    })
}

// function powerPortOn(pdu, portNumber, callback) {
//     axios.get('https://hyposoft-53c70.appspot.com/poweron?pdu='+pdu+'&port='+portNumber, {}).then(response => {
//         console.log(response)
//         if (response) {
//             logutils.addLog(null,logutils.PDU(),logutils.POWER_ON(),{pdu: pdu, portNumber: portNumber})
//             callback(response)
//         } else {
//             callback(null)
//         }
//     }).catch(() => {
//         callback(null)
//     })
// }

// Example usage: powerutils.getPortStatus('hpdu-rtp1-A01L', 4, () => {})
function getPortStatus(pdu, portNumber, callback) {
    axios.get('https://hyposoft-53c70.appspot.com/getPduStatuses?pdu='+pdu, {}).then(response => {
        const regex = new RegExp("<td>"+ portNumber + "<td><span style='background-color:#...'>(?<status>[A-Z]{2,3})")
        callback(response.data.match(regex).groups.status)
    }).catch(() => {
        callback(null)
    })
}

function powerPortOn(pdu, portNumber, callback) {
    axios.get('https://hyposoft-53c70.appspot.com/poweron?pdu='+pdu+'&port='+portNumber, {}).then(response => {
        console.log(response)
        if (response) {
            logutils.addLog(null,logutils.PDU(),logutils.POWER_ON(),{pdu: pdu, portNumber: portNumber})
            callback(response)
        } else {
            callback(null)
        }
    }).catch(() => {
        callback(null)
    })
}

function powerPortOff(pdu, portNumber, callback) {
    axios.get('https://hyposoft-53c70.appspot.com/poweroff?pdu='+pdu+'&port='+portNumber, {}).then(response => {
        if (response) {
            logutils.addLog(null,logutils.PDU(),logutils.POWER_OFF(),{pdu: pdu, portNumber: portNumber})
            callback(response)
        } else {
            callback(null)
        }
    }).catch(() => {
        callback(null)
    })
}

function checkConnectedToPDU(assetID, callback){
    firebaseutils.assetRef.doc(assetID).get().then(function (docSnapshot) {
        if(docSnapshot.exists){
          firebaseutils.modelsRef.doc(docSnapshot.data().modelId).get().then(doc => {
            if (doc.exists && doc.data().mount === "blade") {
                firebaseutils.bladeRef.doc(assetID).get().then(doc => {
                    if (doc.exists) {
                      firebaseutils.assetRef.doc(doc.data().chassisId).get().then(doc => {
                          callback(doc.exists && doc.data().vendor.toUpperCase() === "BMI")
                      })
                    } else {
                      callback(null)
                    }
                })
            } else {
                console.log(docSnapshot.data());
                console.log(docSnapshot.data().datacenterAbbrev.toUpperCase() === "RTP1");
                console.log(docSnapshot.data().datacenterAbbrev.toUpperCase())
                console.log(docSnapshot.data().rackRow.charCodeAt(0) >= 65);
                console.log(docSnapshot.data().rackRow.charCodeAt(0) <= 69);
                console.log(parseInt(docSnapshot.data().rackNum) >= 1);
                console.log(parseInt(docSnapshot.data().rackNum) <= 19);
                console.log(docSnapshot.data().powerConnections);
                console.log(docSnapshot.data().powerConnections.length)
                if(docSnapshot.data().datacenterAbbrev.toUpperCase() === "RTP1" && docSnapshot.data().rackRow.charCodeAt(0) >= 65 && docSnapshot.data().rackRow.charCodeAt(0) <= 69 && parseInt(docSnapshot.data().rackNum) >= 1 && parseInt(docSnapshot.data().rackNum) <= 19 && docSnapshot.data().powerConnections && docSnapshot.data().powerConnections.length){
                    console.log("Should be true")
                    callback(true);
                } else {
                    callback(false);
                }
            }
          })
        } else {
            callback(null);
        }
    })
}

export { getPortStatus, powerPortOff, powerPortOn, checkConnectedToPDU, getBladeStatus, changeBladePower }
