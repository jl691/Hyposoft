import axios from 'axios'

// Example usage: powerutils.getPortStatus('hpdu-rtp1-A01L', 4, () => {})
function getPortStatus(pdu, portNumber, callback) {
    axios.get('https://cors-anywhere.herokuapp.com/http://hyposoft-mgt.colab.duke.edu:8006/pdu.php?pdu='+pdu, {}).then(response => {
        const regex = new RegExp("<td>"+ portNumber + "<td><span style='background-color:#...'>(?<status>[A-Z]{2,3})")
        callback(response.data.match(regex).groups.status)
    })
}

function powerPowerOn(pdu, portNumber, callback) {
    axios.post('https://cors-anywhere.herokuapp.com/http://hyposoft-mgt.colab.duke.edu:8006/power.php', {
        pdu: ''+pdu,
        port: ''+portNumber,
        v: 'on'
    }, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Access-Control-Allow-Origin': '*'
        }
    })
    .then(function (response) {
        console.log(response)
        callback()
    })
    .catch(function (error) {
        console.log(error)
    })
}

function powerPortOff(pdu, portNumber, callback) {
    axios.post('https://cors-anywhere.herokuapp.com/http://hyposoft-mgt.colab.duke.edu:8006/power.php', {
        pdu: ''+pdu,
        port: ''+portNumber,
        v: 'off'
    }, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Access-Control-Allow-Origin': '*'
        }
    })
    .then(function (response) {
        console.log(response)
        callback()
    })
    .catch(function (error) {
        console.log(error)
    })
}

function cyclePortPower(pdu, portNumber, callback) {
    // TODO
}

export { getPortStatus, powerPortOff, powerPowerOn, cyclePortPower }
