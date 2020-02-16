import axios from 'axios'

// Example usage: powerutils.getPortStatus('hpdu-rtp1-A01L', 4)
function getPortStatus(pdu, portNumber, callback) {
    axios.get('https://cors-anywhere.herokuapp.com/http://hyposoft-mgt.colab.duke.edu:8006/pdu.php?pdu='+pdu, {}).then(response => {
        const regex = new RegExp("<td>"+ portNumber + "<td><span style='background-color:#...'>(?<status>[A-Z]{2,3})")
        callback(response.data.match(regex).groups.status)
    })
}

export { getPortStatus }
