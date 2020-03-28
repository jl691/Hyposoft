import * as firebaseutils from './firebaseutils'
import * as userutils from './userutils'
import { saveAs } from 'file-saver'
import * as logutils from './logutils'

const algoliasearch = require('algoliasearch')
const client = algoliasearch('V7ZYWMPYPA', '26434b9e666e0b36c5d3da7a530cbdf3')
const index = client.initIndex('assets')

function validateImportedAssets (data, callback) {
    var tasksPending = 4 // Assets, users, datacenters+racks, models
    var errors = []
    var toBeAdded = []
    var toBeIgnored = []
    var toBeModified = []

    var assetsLoaded = {} // asset id => asset
    var hostnamesToId = {} // hostname => asset id
    var unusedIds = [] // We'll then loop through loaded assets from db and remove used ones
    for (var i = 100000; i <= 999999; i++) {
        unusedIds.push(''+i)
    }
    var usedPowerConnections = {} // rackId => {L20 => assetId, ...}

    var existingUsernames = [] // we'll populate this as we go through the loaded users
    var existingRacks = {} // datacenter abbreviation => [list of racks ids in this datacenter]
    var existingRackNames = {} // datacenter abbreviation => [list of rack names (A50 etc.) in this datacenter]

    var existingModels = {} // vendors => {model number: model...}
    var datacenterIdsToAbbreviations = {}
    var rackIdsToNames = {}
    var usedRackUsInRack = {} // rackId => {U => assetID, }
    var existingDCs = {} // abbrev => datacentre object

    var assetNumbersSeenInImport = []

    function postTaskCompletion () {
        tasksPending--
        if (tasksPending !== 0)
            return

        // First populate usedRackUsInRack so we can check for conflicts
        for (var a = 0; a < Object.keys(assetsLoaded).length; a++) {
            const asset = assetsLoaded[Object.keys(assetsLoaded)[a]]
            for (var t = asset.rackU; t < asset.rackU + existingModels[asset.vendor][asset.modelNumber].height; t++) {
                usedRackUsInRack[asset.rackID][t] = asset.id
            }
        }

        for (var i = 0; i < data.length; i++) {
            var datum = data[i]
            datum.rowNumber = i+1
            datum.datacenter = datum.datacenter && datum.datacenter.trim()
            datum.vendor = datum.vendor && datum.vendor.trim()
            datum.model_number = datum.model_number && datum.model_number.trim()
            datum.owner = datum.owner && datum.owner.trim()
            datum.hostname = datum.hostname && datum.hostname.trim()
            datum.rack = datum.rack && datum.rack.toUpperCase().trim()
            datum.power_port_connection_1 = datum.power_port_connection_1 && datum.power_port_connection_1.toUpperCase().trim()
            datum.power_port_connection_2 = datum.power_port_connection_2 && datum.power_port_connection_2.toUpperCase().trim()

            var canTestForFit = true

            if (!datum.asset_number) {
                datum.asset_number = unusedIds.pop() // Generate one for them
                console.log('had to generate asset number')
            } else if (isNaN(String(datum.asset_number).trim()) || !Number.isInteger(parseFloat(String(datum.asset_number).trim()))) {
                errors = [...errors, [i + 1, 'Asset number invalid format']]
            } else if (parseInt(String(datum.asset_number).trim()) > 999999 || parseInt(String(datum.asset_number).trim()) < 100000) {
                errors = [...errors, [i + 1, 'Asset number not in range 100000-999999']]
            }

            if (assetNumbersSeenInImport.includes(datum.asset_number)) {
                errors = [...errors, [i + 1, 'Another row exists for this same asset number (Row '+assetNumbersSeenInImport.indexOf(datum.asset_number)+')']]
            } else {
                assetNumbersSeenInImport.push(datum.asset_number)
            }

            if (datum.hostname.trim() !== '' && !/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$/.test(datum.hostname)) {
                errors = [...errors, [i + 1, 'Invalid hostname (does not follow RFC-1034 specs)']]
            }

            if (datum.hostname.trim() !== '' && datum.hostname.trim() in hostnamesToId && (''+hostnamesToId[datum.hostname.trim()]).trim() != (''+datum.asset_number).trim()) {
                errors = [...errors, [i + 1, 'Hostname taken by another asset']]
                console.log('HOSTNAME CONFLICT: '+datum.asset_number+' '+hostnamesToId[datum.hostname])
            }

            if (!datum.rack_position || String(datum.rack_position).trim() === '') {
                errors = [...errors, [i + 1, 'Rack position not found']]
                canTestForFit = false
            } else if (isNaN(String(datum.rack_position).trim()) || !Number.isInteger(parseFloat(String(datum.rack_position).trim())) || parseInt(String(datum.rack_position).trim()) <= 0 || parseInt(String(datum.rack_position).trim()) > 42) {
                errors = [...errors, [i + 1, 'Rack position is not a positive integer less than 43']]
                canTestForFit = false
            }

            if (!userutils.doesLoggedInUserHaveAssetPerm((datum.datacenter+'').trim())) {
                errors = [...errors, [i + 1, "You don't have asset management permissions for this datacenter"]]
            }

            if (!(datum.datacenter in existingRacks)) {
                canTestForFit = false
                errors = [...errors, [i + 1, 'Datacenter does not exist']]
            } else if (!(existingRackNames[datum.datacenter].includes(datum.rack))) {
                canTestForFit = false
                errors = [...errors, [i + 1, 'Rack does not exist in specified datacenter']]
            }

            if (!(datum.asset_number in assetsLoaded)) {
                if (!datum.vendor) {
                    canTestForFit = false
                    errors = [...errors, [i + 1, 'Vendor missing']]
                }

                if (!datum.model_number) {
                    canTestForFit = false
                    errors = [...errors, [i + 1, 'Model number missing']]
                }
            } else {
                if (datum.model_number !== assetsLoaded[datum.asset_number].modelNumber ||
                    datum.vendor !== assetsLoaded[datum.asset_number].vendor) {
                    errors = [...errors, [i + 1, 'You cannot change the model for an existing asset']]
                }
            }

            if (datum.vendor && !(datum.vendor in existingModels)) {
                canTestForFit = false
                errors = [...errors, [i + 1, 'Unknown vendor']]
            } else if (datum.model_number && !(datum.model_number in existingModels[datum.vendor])) {
                canTestForFit = false
                errors = [...errors, [i + 1, 'Unknown model number for specified vendor']]
            }

            if (datum.owner && !existingUsernames.includes(datum.owner)) {
                errors = [...errors, [i + 1, 'Owner does not exist']]
            }

            if (datum.power_port_connection_1 && !/^[LR]([2][0-4]|[1][0-9]|[0][1-9]|[1-9])$/i.test(datum.power_port_connection_1)) {
                errors = [...errors, [i + 1, 'Power port connection 1 invalid']]
            }

            if (datum.power_port_connection_2 && !/^[LR]([2][0-4]|[1][0-9]|[0][1-9]|[1-9])$/i.test(datum.power_port_connection_2)) {
                errors = [...errors, [i + 1, 'Power port connection 2 invalid']]
            }

            const powerPortsNumber = existingModels[datum.vendor][datum.model_number].powerPorts
            if (canTestForFit) {
                if (!powerPortsNumber && (datum.power_port_connection_1 || datum.power_port_connection_2)) {
                    errors = [...errors, [i + 1, 'This model does not have any power ports']]
                    canTestForFit = false
                }

                if (powerPortsNumber == 1 && datum.power_port_connection_2) {
                    errors = [...errors, [i + 1, 'This model has only one power port and you have specified a connection for power port #2']]
                    canTestForFit = false
                }
            }
            if (canTestForFit) {
                // Can do rack fit test only if model exists, datacenter is valid, rack is valid and rack position is valid

                // Rewrote custom asset fit tests for speed and reducing redundant db queries
                // First find this datum's intended rack's ID
                var rackNamesToIdsForOurDC = {}
                for(var r = 0; r < existingRacks[datum.datacenter].length; r++) {
                    var rackId = existingRacks[datum.datacenter][r]
                    rackNamesToIdsForOurDC[rackIdsToNames[rackId]] = rackId
                }
                for (var j = parseInt(datum.rack_position); j < parseInt(datum.rack_position) + parseInt(existingModels[datum.vendor][datum.model_number].height); j++) {
                    if ((rackNamesToIdsForOurDC[datum.rack] in usedRackUsInRack && j in usedRackUsInRack[rackNamesToIdsForOurDC[datum.rack]] && usedRackUsInRack[rackNamesToIdsForOurDC[datum.rack]][j] != datum.asset_number) || j > 42) {
                        errors = [...errors, [i + 1, 'Asset will not fit on the rack at this position']]
                    }
                }

                datum.rackID = rackNamesToIdsForOurDC[datum.rack]
                datum.modelID = existingModels[datum.vendor][datum.model_number].id
                datum.dcID = existingDCs[datum.datacenter].id
                datum.dcFN = existingDCs[datum.datacenter].name
                datum.power_connections = []

                if (datum.power_port_connection_1) {
                    datum.power_connections.push({
                        pduSide: datum.power_port_connection_1.charAt(0) === 'L' ? 'Left' : 'Right',
                        port: datum.power_port_connection_1.substring(1)
                    })
                } else {
                    if ((datum.asset_number in assetsLoaded) && assetsLoaded[datum.asset_number].powerConnections) {
                        if (powerPortsNumber && powerPortsNumber >= 1){
                            datum.power_connections.push({
                                pduSide: null,
                                port: null
                            })
                        }
                    }
                }

                if (datum.power_port_connection_2) {
                    datum.power_connections.push({
                        pduSide: datum.power_port_connection_2.charAt(0) === 'L' ? 'Left' : 'Right',
                        port: datum.power_port_connection_2.substring(1)
                    })
                } else {
                    if ((datum.asset_number in assetsLoaded) && powerPortsNumber && powerPortsNumber > 1 && assetsLoaded[datum.asset_number].powerConnections) {
                        datum.power_connections.push({
                            pduSide: null,
                            port: null
                        })
                    }
                }



                if (usedPowerConnections[rackNamesToIdsForOurDC[datum.rack]] && datum.power_port_connection_1 in usedPowerConnections[rackNamesToIdsForOurDC[datum.rack]]) {
                    if (usedPowerConnections[rackNamesToIdsForOurDC[datum.rack]][datum.power_port_connection_1] != datum.asset_number)
                        errors = [...errors, [i + 1, 'Power port connection 1 is being used by another asset']]
                }
                if (usedPowerConnections[rackNamesToIdsForOurDC[datum.rack]] && datum.power_port_connection_2 in usedPowerConnections[rackNamesToIdsForOurDC[datum.rack]]) {
                    if (usedPowerConnections[rackNamesToIdsForOurDC[datum.rack]][datum.power_port_connection_2] != datum.asset_number)
                        errors = [...errors, [i + 1, 'Power port connection 2 is being used by another asset']]
                }
            }

            if (!(datum.asset_number in assetsLoaded)) {
                // New asset
                toBeAdded.push(datum)
            } else {
                // Either ignore or modify
                const assetFromDb = assetsLoaded[datum.asset_number]
                const ppC1 = (assetFromDb.powerConnections && assetFromDb.powerConnections[0] && ((assetFromDb.powerConnections[0].pduSide === 'Left' ? 'L' : 'R')+assetFromDb.powerConnections[0].port)) || ''
                const ppC2 = (assetFromDb.powerConnections && assetFromDb.powerConnections[1] && ((assetFromDb.powerConnections[1].pduSide === 'Left' ? 'L' : 'R')+assetFromDb.powerConnections[1].port)) || ''

                if (assetFromDb.hostname.toLowerCase().trim() == datum.hostname.toLowerCase().trim() &&
                    assetFromDb.datacenterAbbrev.toLowerCase().trim() == datum.datacenter.toLowerCase().trim() &&
                    assetFromDb.rack.toUpperCase().trim() == datum.rack &&
                    ''+assetFromDb.rackU == datum.rack_position.trim() &&
                    assetFromDb.owner.toLowerCase().trim() == datum.owner.toLowerCase().trim() &&
                    assetFromDb.comment.trim() == datum.comment.trim() &&
                    ppC1 == datum.power_port_connection_1.trim().toUpperCase() &&
                    ppC2 == datum.power_port_connection_2.trim().toUpperCase()) {
                    toBeIgnored.push(datum)
                } else {
                    toBeModified.push(datum)
                }
            }
        }

        // At this point we're done with all validation
        callback({ errors, toBeIgnored, toBeAdded, toBeModified })
    }

    firebaseutils.assetRef.get().then(qs => {
        for (var i = 0; i < qs.size; i++) {
            const asset = {...qs.docs[i].data(), id: qs.docs[i].id}
            const assetID = qs.docs[i].data().assetId
            assetsLoaded[assetID] = asset
            if (asset.hostname) {
                hostnamesToId[asset.hostname] = assetID
            }
            unusedIds.pop(assetID)

            if (asset.powerConnections) {
                asset.powerConnections.forEach((pc, i) => {
                    const powerPort = (pc.pduSide === 'Left' ? 'L' : 'R') + pc.port
                    if (!usedPowerConnections[asset.rackID]) {
                        usedPowerConnections[asset.rackID] = {[powerPort]: assetID}
                    } else {
                        usedPowerConnections[asset.rackID][powerPort] = assetID
                    }
                })
            }

            if (!(asset.rackID in usedRackUsInRack)) {
                usedRackUsInRack[asset.rackID] = [] // this array will be populated after all models and assets are loaded
            }
        }
        postTaskCompletion()
    })

    firebaseutils.modelsRef.get().then(qs => {
        for (var i = 0; i < qs.size; i++) {
            const model = {...qs.docs[i].data(), id: qs.docs[i].id}
            if (model.vendor in existingModels) {
                existingModels[model.vendor][model.modelNumber] = model
            } else {
                existingModels[model.vendor] = {[model.modelNumber] : model}
            }

        }
        postTaskCompletion()
    })

    firebaseutils.usersRef.get().then(qs => {
        for (var i = 0; i < qs.size; i++) {
            const user = {...qs.docs[i].data(), id: qs.docs[i].id}
            existingUsernames.push(user.username)
        }
        postTaskCompletion()
    })

    firebaseutils.datacentersRef.get().then(qs => {
        var totalRacks = []
        for (var i = 0; i < qs.size; i++) {
            const dc = {...qs.docs[i].data(), id: qs.docs[i].id}
            existingRacks[dc.abbreviation] = [...dc.racks] // Initialise the array for this datacentre's racks
            totalRacks = [...totalRacks, ...dc.racks]
            datacenterIdsToAbbreviations[dc.id] = dc.abbreviation
            existingDCs[dc.abbreviation] = dc
        }

        var rackNamesFetched = 0
        for (i = 0; i < totalRacks.length; i++) {
            firebaseutils.racksRef.doc(totalRacks[i]).get().then(ds => {
                const rackName = ds.data().letter+''+ds.data().number
                rackIdsToNames[ds.id] = rackName

                rackNamesFetched++
                if (rackNamesFetched === totalRacks.length) {
                    Object.keys(existingRacks).forEach((dc, i) => {
                        existingRackNames[dc] = existingRacks[dc].map(rackId => rackIdsToNames[rackId])
                    })

                    postTaskCompletion()
                }
            })
        }
    })
}

function bulkAddAssets (assets, callback) {
    assets.forEach((asset, i) => {
        const assetObject = {
            assetId: asset.asset_number,
            modelId: asset.modelID,
            model: asset.vendor+' '+asset.model_number,
            hostname: asset.hostname,
            rack: asset.rack,
            rackU: parseInt(asset.rack_position),
            owner: asset.owner,
            comment: asset.comment,
            rackID: asset.rackID,
            networkConnections: {},
            powerConnections: asset.power_connections,
            modelNumber: asset.model_number,
            vendor: asset.vendor,
            rackRow: asset.rack.charAt(0).toUpperCase(),
            rackNum: asset.rack.substring(1),
            datacenter: asset.dcFN,
            datacenterID: asset.dcID,
            datacenterAbbrev:  asset.datacenter,
            macAddresses: {}
        }

        firebaseutils.racksRef.doc(asset.rackID).update({
            assets: firebaseutils.firebase.firestore.FieldValue.arrayUnion(asset.asset_number+'')
        })

        firebaseutils.assetRef.doc(asset.asset_number).set(assetObject)
        logutils.addLog(asset.asset_number, logutils.ASSET(), logutils.CREATE())

        let suffixes_list = []
        let _model = assetObject.model

        while (_model.length > 1) {
            _model = _model.substr(1)
            suffixes_list.push(_model)
        }

        let _hostname = assetObject.hostname

        while (_hostname.length > 1) {
            _hostname = _hostname.substr(1)
            suffixes_list.push(_hostname)
        }

        let _datacenter = assetObject.datacenter

        while (_datacenter.length > 1) {
            _datacenter = _datacenter.substr(1)
            suffixes_list.push(_datacenter)
        }

        let _datacenterAbbrev = assetObject.datacenterAbbrev

        while (_datacenterAbbrev.length > 1) {
            _datacenterAbbrev = _datacenterAbbrev.substr(1)
            suffixes_list.push(_datacenterAbbrev)
        }
        let _owner = assetObject.owner

        while (_owner.length > 1) {
            _owner = _owner.substr(1)
            suffixes_list.push(_owner)
        }

        index.saveObject({ ...assetObject, objectID: asset.asset_number, suffixes: suffixes_list.join(' ') })
    })
    callback()
}

function bulkModifyAssets (assets, callback) {
    const updatesss = {}
    assets.forEach((asset, i) => {
        const updates = {}
        if (asset.hostname) {
            updates.hostname = asset.hostname
        }

        if (asset.rack) {
            updates.rack = asset.rack
        }

        if (asset.rack_position) {
            updates.rackU = parseInt(asset.rack_position)
        }

        if (asset.owner) {
            updates.owner = asset.owner
        }

        if (asset.comment) {
            updates.comment = asset.comment
        }

        if (asset.power_connections) {
            updates.powerConnections = asset.power_connections
        }

        if (asset.rackID) {
            updates.rackID = asset.rackID
        }

        if (asset.rack) {
            updates.rackRow = asset.rack.charAt(0).toUpperCase()
            updates.rackNum = asset.rack.substring(1)
        }

        if (asset.dcFN) {
            updates.datacenter = asset.dcFN
        }

        if (asset.dcID) {
            updates.datacenterID = asset.dcID
        }

        if (asset.datacenter) {
            updates.datacenterAbbrev = asset.datacenter
        }

        updatesss[asset.asset_number] = updates

        firebaseutils.assetRef.doc(asset.asset_number).get().then(ds => {
            firebaseutils.racksRef.doc(ds.data().rackID).update({
                assets: firebaseutils.firebase.firestore.FieldValue.arrayRemove(ds.data().assetId+'')
            })

            firebaseutils.racksRef.doc(updatesss[ds.id].rackID).update({
                assets: firebaseutils.firebase.firestore.FieldValue.arrayUnion(ds.data().assetId+'')
            })

            const updates = updatesss[ds.data().assetId]

            firebaseutils.assetRef.doc(ds.data().assetId).update(updates).then(() => {
                // Add to algolia index
                var assetObject = Object.assign({}, ds.data(), updates)
                let suffixes_list = []
                let _model = assetObject.model

                while (_model.length > 1) {
                    _model = _model.substr(1)
                    suffixes_list.push(_model)
                }

                let _hostname = assetObject.hostname

                while (_hostname.length > 1) {
                    _hostname = _hostname.substr(1)
                    suffixes_list.push(_hostname)
                }

                let _datacenter = assetObject.datacenter

                while (_datacenter.length > 1) {
                    _datacenter = _datacenter.substr(1)
                    suffixes_list.push(_datacenter)
                }

                let _datacenterAbbrev = assetObject.datacenterAbbrev

                while (_datacenterAbbrev.length > 1) {
                    _datacenterAbbrev = _datacenterAbbrev.substr(1)
                    suffixes_list.push(_datacenterAbbrev)
                }
                let _owner = assetObject.owner

                while (_owner.length > 1) {
                    _owner = _owner.substr(1)
                    suffixes_list.push(_owner)
                }

                index.saveObject({ ...assetObject, objectID: ds.id, suffixes: suffixes_list.join(' ') })

                logutils.addLog(String(asset.asset_number), logutils.ASSET(), logutils.MODIFY(), assetObject)
            })
        })
    })
    callback()
}

function escapeStringForCSV(string) {
    if (!string || string.trim() === '') {
        return ''
    } else {
        return '"'+string.split('"').join('""')+'"'
    }
}

function exportFilteredAssets (assets) {
    var rows = [
        ["asset_number", "hostname", "datacenter", "rack", "rack_position",
        "vendor", "model_number", "owner", "comment", "power_port_connection_1", "power_port_connection_2"]
    ]

    for (var i = 0; i < assets.length; i++) {
        const ppC1 = (assets[i].powerConnections && assets[i].powerConnections.length >= 1 && assets[i].powerConnections[0].pduSide && assets[i].powerConnections[0].port ? (
            (assets[i].powerConnections[0].pduSide === 'Left' ? 'L' : 'R')+assets[i].powerConnections[0].port
        ) : '')
        const ppC2 = (assets[i].powerConnections && assets[i].powerConnections.length >= 2 && assets[i].powerConnections[1].pduSide && assets[i].powerConnections[1].port ? (
            (assets[i].powerConnections[1].pduSide === 'Left' ? 'L' : 'R')+assets[i].powerConnections[1].port
        ) : '')

        rows = [...rows, [
            escapeStringForCSV(assets[i].asset_id),
            escapeStringForCSV(assets[i].hostname),
            escapeStringForCSV(assets[i].datacenterAbbrev),
            escapeStringForCSV(assets[i].rack),
            ''+assets[i].rackU,
            escapeStringForCSV(assets[i].vendor),
            escapeStringForCSV(assets[i].modelNumber),
            escapeStringForCSV(assets[i].owner),
            escapeStringForCSV(assets[i].comment),
            ppC1,
            ppC2
        ]]
    }

    var blob = new Blob([rows.map(e => e.join(",")).join("\r\n")], {
        type: "data:text/csv;charset=utf-8;",
    })
    saveAs(blob, "hyposoft_assets_filtered.csv")
}

function getAssetsForExport (callback) {
    firebaseutils.assetRef.orderBy('assetId').get().then(qs => {
        var rows = [
            ["asset_number", "hostname", "datacenter", "rack", "rack_position",
            "vendor", "model_number", "owner", "comment", "power_port_connection_1", "power_port_connection_2"]
        ]

        for (var i = 0; i < qs.size; i++) {
            const ppC1 = (qs.docs[i].data().powerConnections && qs.docs[i].data().powerConnections.length >= 1 && qs.docs[i].data().powerConnections[0].pduSide && qs.docs[i].data().powerConnections[0].port ? (
                (qs.docs[i].data().powerConnections[0].pduSide === 'Left' ? 'L' : 'R')+qs.docs[i].data().powerConnections[0].port
            ) : '')
            const ppC2 = (qs.docs[i].data().powerConnections && qs.docs[i].data().powerConnections.length >= 2 && qs.docs[i].data().powerConnections[1].pduSide && qs.docs[i].data().powerConnections[1].port ? (
                (qs.docs[i].data().powerConnections[1].pduSide === 'Left' ? 'L' : 'R')+qs.docs[i].data().powerConnections[1].port
            ) : '')

            rows = [...rows, [
                escapeStringForCSV(qs.docs[i].data().assetId),
                escapeStringForCSV(qs.docs[i].data().hostname),
                escapeStringForCSV(qs.docs[i].data().datacenterAbbrev),
                escapeStringForCSV(qs.docs[i].data().rack),
                ''+qs.docs[i].data().rackU,
                escapeStringForCSV(qs.docs[i].data().vendor),
                escapeStringForCSV(qs.docs[i].data().modelNumber),
                escapeStringForCSV(qs.docs[i].data().owner),
                escapeStringForCSV(qs.docs[i].data().comment),
                ppC1,
                ppC2
            ]]

            if (rows.length === qs.size+1) {
                callback(rows)
            }
        }
    })
}

export { validateImportedAssets, bulkAddAssets, bulkModifyAssets, getAssetsForExport,
exportFilteredAssets }
