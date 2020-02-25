import axios from 'axios'
import * as assetutils from '../utils/assetutils'
import * as firebaseutils from './firebaseutils'

// Example usage: powerutils.getPortStatus('hpdu-rtp1-A01L', 4, () => {})
function getPortStatus(pdu, portNumber, callback) {
    axios.get('https://hyposoft-53c70.appspot.com/getPduStatuses?pdu='+pdu, {}).then(response => {
        const regex = new RegExp("<td>"+ portNumber + "<td><span style='background-color:#...'>(?<status>[A-Z]{2,3})")
        callback(response.data.match(regex).groups.status)
    })
}

function powerPortOn(pdu, portNumber, callback) {
    axios.get('https://hyposoft-53c70.appspot.com/poweron?pdu='+pdu+'&port='+portNumber, {}).then(response => {
        callback(response)
    })
}

function powerPortOff(pdu, portNumber, callback) {
    axios.get('https://hyposoft-53c70.appspot.com/poweroff?pdu='+pdu+'&port='+portNumber, {}).then(response => {
        callback(response)
    })
}

function checkConnectedToPDU(assetID, callback){
    firebaseutils.assetRef.doc(assetID).get().then(function (docSnapshot) {
        if(docSnapshot.exists){
            console.log(docSnapshot.data())
            if(docSnapshot.data().datacenterAbbrev.toUpperCase() === "RTP1" && docSnapshot.data().rackRow.charCodeAt(0) >= 65 && docSnapshot.data().rackRow.charCodeAt(0) <= 69 && parseInt(docSnapshot.data().rackNum) >= 1 && parseInt(docSnapshot.data().rackNum) <= 19 && docSnapshot.data().powerConnections && docSnapshot.data().powerConnections.length){
                console.log("Should be true")
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(null);
        }
    })
}

export { getPortStatus, powerPortOff, powerPortOn, checkConnectedToPDU }
