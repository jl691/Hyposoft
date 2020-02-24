import axios from 'axios'

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

export { getPortStatus, powerPortOff, powerPortOn }
