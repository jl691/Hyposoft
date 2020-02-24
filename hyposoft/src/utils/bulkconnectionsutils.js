import * as firebaseutils from './firebaseutils'

function validateImportedConnections (data, callback) {
    var fetchedAssets = {}
    var fetchedAssetsCount = 0
    var errors = []
    var toBeAdded = []
    var toBeIgnored = []
    var toBeModified = []

    function postValidation() {
        fetchedAssetsCount ++
        if (fetchedAssetsCount < data.length*2)
            return
        for (var i = 0; i < data.length; i++) {
            var datum = data[i]
            if (!fetchedAssets[datum.src_hostname]) {
                errors = [...errors, [i+1, 'No asset with provided source hostname found']]
            } else if (!(datum.src_port in fetchedAssets[datum.src_hostname].networkConnections)) {
                errors = [...errors, [i+1, 'No asset with provided source port found']]
            }

            if (datum.dest_hostname) {
                if (!fetchedAssets[datum.dest_hostname]) {
                    errors = [...errors, [i+1, 'No asset with provided destination hostname found']]
                } else if (!(datum.dest_port in fetchedAssets[datum.dest_hostname].networkConnections)) {
                    errors = [...errors, [i+1, 'No asset with provided destination port found']]
                }
            }

            if (datum.src_mac && !/^([0-9a-fA-F]{2}[\W_]*){5}([0-9a-fA-F]{2})$/.test(datum.src_mac)) {
                errors = [...errors, [i+1, 'Bad MAC address']]
            } else {
                datum.src_mac = datum.src_mac.replace((/[\W_]/g), "").toLowerCase().replace(/(.{2})(?!$)/g,"$1:")
            }

            if (errors.length === 0) {
                // NOTE: This means the three arrays are accurate only if there are no errors
                const datumAssetId = (fetchedAssets[datum.dest_hostname] ? fetchedAssets[datum.dest_hostname].id : null)
                if ((datumAssetId === null && fetchedAssets[datum.src_hostname].networkConnections[datum.src_port] === null) ||
                    (fetchedAssets[datum.src_hostname].networkConnections[datum.src_port] && fetchedAssets[datum.src_hostname].networkConnections[datum.src_port].otherAssetID === datumAssetId)) {
                    // TODO: Confirm w Janice that the entire object is null and not just otherAssetID
                    if (fetchedAssets[datum.src_hostname].networkConnections[datum.src_port].otherPort === datum.dest_port) {
                        if (fetchedAssets[datum.src_hostname].macAddresses[datum.src_port] === datum.src_mac) {
                            toBeIgnored.push(datum)
                            continue
                        }
                    }
                }

                if ((datumAssetId !== null && fetchedAssets[datum.src_hostname].networkConnections[datum.src_port] === null)) {
                    // Added as in new connection
                    // Always update MAC addresses anyway
                    toBeAdded.push(datum)
                    continue
                }

                toBeModified.push(datum)
            }
        }

        callback({ errors, toBeIgnored, toBeModified, toBeAdded, fetchedAssets })

    }

    for (var i = 0; i < data.length; i++) {
        var datum = data[i]
        datum.rowNumber = i+1
        if (!datum.src_hostname.trim()) {
            errors = [...errors, [i+1, 'Source hostname required']]
        }

        if (!datum.src_port.trim()) {
            errors = [...errors, [i+1, 'Source port required']]
        }

        firebaseutils.assetRef.where('hostname', '==', datum.src_hostname).get().then(qs => {
            if (qs.empty) {
                fetchedAssets[datum.src_hostname] = null
            } else {
                fetchedAssets[datum.src_hostname] = {...qs.docs[0].data(), id: qs.docs[0].id}
            }
            postValidation()
        })

        if (datum.dest_hostname.trim()) {
            firebaseutils.assetRef.where('hostname', '==', datum.dest_hostname).get().then(qs => {
                if (qs.empty) {
                    fetchedAssets[datum.dest_hostname] = null
                } else {
                    fetchedAssets[datum.dest_hostname] = {...qs.docs[0].data(), id: qs.docs[0].id}
                }
                postValidation()
            })
            if (!datum.dest_port.trim()) {
                errors = [...errors, [i+1, 'Destination port is required if destination hostname is specified']]
            }
        } else {
            if (datum.dest_port.trim()) {
                errors = [...errors, [i+1, 'Destination port should be blank if destination hostname is']]
            }
            postValidation()
        }
    }
}

function addConnections (data, fetchedAssets, callback) {
    for (var i = 0; i < data.length; i++) {
        const datum = data[i]

        // First remove connection from old destination
        if (fetchedAssets[datum.src_hostname].networkConnections[datum.src_port]) {
            const oldDestinationId = fetchedAssets[datum.src_hostname].networkConnections[datum.src_port].otherAssetID
            const oldDestinationPort = fetchedAssets[datum.src_hostname].networkConnections[datum.src_port].otherPort
            firebaseutils.assetRef.doc(oldDestinationId).update({
                ["networkConnections."+oldDestinationPort]: null
            })
        }

        if (datum.dest_hostname) {
            // This means: modify or add

            // Now add new connection to source
            const newMacAddress = (datum.src_mac ? datum.src_mac : fetchedAssets[datum.src_hostname].macAddresses[datum.src_port])
            firebaseutils.assetRef.doc(fetchedAssets[datum.src_hostname].id).update({
                ["networkConnections."+datum.src_port+".otherAssetID"]: fetchedAssets[datum.dest_hostname].id,
                ["networkConnections."+datum.src_port+".otherPort"]: datum.dest_port,
                ["macAddresses."+datum.src_port]: newMacAddress
            })

            // Lastly add new connection to new destination
            firebaseutils.assetRef.doc(fetchedAssets[datum.dest_hostname].id).update({
                ["networkConnections."+datum.dest_port+".otherAssetID"]: fetchedAssets[datum.src_hostname].id,
                ["networkConnections."+datum.dest_port+".otherPort"]: datum.src_port
            })

        } else {
            // This means: delete

            // Now delete connection from source
            const newMacAddress = (datum.src_mac ? datum.src_mac : fetchedAssets[datum.src_hostname].macAddresses[datum.src_port])
            firebaseutils.assetRef.doc(fetchedAssets[datum.src_hostname].id).update({
                ["networkConnections."+datum.src_port]: null,
                ["macAddresses."+datum.src_port]: newMacAddress
            })
        }

        callback()
    }
}

function getConnectionsForExport (callback) {
    var rows = [
        ["src_hostname", "src_port", "src_mac", "dest_hostname", "dest_port"]
    ]
    var assetsFound = []
    var portsToIgnore = []
    var hostnamesOfIds = {}

    function postFetch() {
        assetsFound.sort(function(a, b){
            return b.numPorts - a.numPorts
        })

        for (var i = 0; i < assetsFound.length; i++) {
            const asset = assetsFound[i]
            if (asset.networkConnections) {
                for (var j = 0; j < Object.keys(asset.networkConnections).length; j++) {
                    if (!portsToIgnore.includes(asset.id+'.'+Object.keys(asset.networkConnections)[j])) {
                        const portInfo = asset.networkConnections[Object.keys(asset.networkConnections)[j]]
                        const macAddress = (asset.macAddresses ? asset.macAddresses[Object.keys(asset.networkConnections)[j]] : '')
                        if (portInfo) {
                            rows.push([asset.hostname, Object.keys(asset.networkConnections)[j], macAddress, hostnamesOfIds[portInfo.otherAssetID], portInfo.otherPort])
                            portsToIgnore.push(portInfo.otherAssetID+'.'+portInfo.otherPort)
                        } else {
                            rows.push([asset.hostname, Object.keys(asset.networkConnections)[j], macAddress, '', ''])
                        }
                    }
                }
            }
        }

        callback(rows)
    }

    firebaseutils.assetRef.get().then(qs => {

        for (var i = 0; i < qs.size; i++) {
            const numPorts = (qs.docs[i].data().networkConnections ? Object.keys(qs.docs[i].data().networkConnections).length : 0)
            // NOTE: I shouldn't have to do the ternary check above bc networkConnections shouldn't ever be undefined/null
            // but until Janice fixes the schema of assets, I'll do this extra check to be safe.
            // Remove it afterwards! (Not necessary but it'll be cleaner)
            assetsFound.push({...qs.docs[i].data(), id: qs.docs[i].id, numPorts: numPorts})
            hostnamesOfIds[''+qs.docs[i].id] = qs.docs[i].data().hostname

            if (assetsFound.length === qs.size) {
                postFetch()
            }
        }
    })
}

export { validateImportedConnections, addConnections, getConnectionsForExport }
