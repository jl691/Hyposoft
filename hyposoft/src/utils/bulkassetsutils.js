import * as firebaseutils from './firebaseutils'
import * as userutils from './userutils'
import { saveAs } from 'file-saver'
import * as logutils from './logutils'
import * as bladeutils from './bladeutils'

const algoliasearch = require('algoliasearch')
const client = algoliasearch('V7ZYWMPYPA', '26434b9e666e0b36c5d3da7a530cbdf3')
const index = client.initIndex('assets')

function validateImportedAssets (data, callback) {
    var tasksPending = 8 // Assets, users, datacenters+racks, models, decommissioned assets, offline assets, offline sites, blades (to see what slots are free)
    var errors = []
    var toBeAdded = []
    var toBeIgnored = []
    var toBeModified = []
    var decommissionedAssetIds = []
    var offlineAssets = {} // asset id => offline asset

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
    var existingOSs = {} // abbrev => offline site object
    var usedSlotsInChassis = {} // chassis number => {slotNumber: blade id}

    var assetNumbersSeenInImport = []

    function postTaskCompletion () {
        tasksPending--
        if (tasksPending !== 0)
            return

        // First populate usedRackUsInRack so we can check for conflicts
        for (var a = 0; a < Object.keys(assetsLoaded).length; a++) {
            const asset = assetsLoaded[Object.keys(assetsLoaded)[a]]
            if (existingModels[asset.vendor][asset.modelNumber].mount !== 'blade') {
                for (var t = asset.rackU; t < asset.rackU + existingModels[asset.vendor][asset.modelNumber].height; t++) {
                    usedRackUsInRack[asset.rackID][t] = asset.id
                }
            }
        }

        var newChassis = {} // The chassis that were created in this file
        var chassisHostnameUpdates = {} // id => hostname

        for (var i = 0; i < data.length; i++) {
            var datum = data[i]
            datum.rowNumber = i+1
            datum.datacenter = datum.datacenter && datum.datacenter.trim()
            datum.offline_site = datum.offline_site && datum.offline_site.trim()
            datum.chassis_slot = datum.chassis_slot && datum.chassis_slot.trim()
            datum.chassis_number = datum.chassis_number && datum.chassis_number.trim()
            datum.custom_cpu = datum.custom_cpu && datum.custom_cpu.trim()
            datum.custom_storage = datum.custom_storage && datum.custom_storage.trim()
            datum.custom_display_color = datum.custom_display_color && datum.custom_display_color.trim()
            datum.custom_memory = datum.custom_memory && datum.custom_memory.trim()
            datum.vendor = datum.vendor && datum.vendor.trim()
            datum.model_number = datum.model_number && datum.model_number.trim()
            datum.owner = datum.owner && datum.owner.trim()
            datum.hostname = datum.hostname && datum.hostname.toLowerCase().trim()
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
            } else if (decommissionedAssetIds.includes(datum.asset_number)) {
                errors = [...errors, [i + 1, 'A decommissioned asset with this asset number exists (you cannot modify decommissioned assets)']]
            }

            if (assetNumbersSeenInImport.includes(datum.asset_number)) {
                errors = [...errors, [i + 1, 'Another row exists for this same asset number (Row '+assetNumbersSeenInImport.indexOf(datum.asset_number)+')']]
            } else {
                assetNumbersSeenInImport.push(datum.asset_number)
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

            try {
                var isBlade = existingModels[datum.vendor][datum.model_number].mount === 'blade'
                var isOffline = !(datum.asset_number in assetsLoaded) && (datum.asset_number in offlineAssets)
                var isDCBlank = !datum.datacenter || datum.datacenter.trim() === ''
                var isOSBlank = !datum.offline_site || datum.offline_site.trim() === ''
            } catch (error) {
                continue // not work it
            }

            if (!isBlade && isDCBlank && isOSBlank && !(datum.asset_number in assetsLoaded) && !(datum.asset_number in offlineAssets)) {
                errors = [...errors, [i + 1, 'Either datacenter or offline site must be specified for new non-blade assets']]
            }

            if (isBlade && !isDCBlank) {
                errors = [...errors, [i + 1, 'Datacenter must be blank for blade assets']]
            }

            if ((datum.asset_number in assetsLoaded) || (datum.asset_number in offlineAssets)) {
                // Not a new asset
                if (isOffline && !isDCBlank) {
                    errors = [...errors, [i + 1, 'Datacenter must be blank for offline assets']]
                } else if (!isOffline && !isOSBlank) {
                    errors = [...errors, [i + 1, 'Offline site must be blank for live assets in datacenters']]
                }
            } else {
                // new asset
                if (!isDCBlank && !isOSBlank) {
                    errors = [...errors, [i + 1, 'Cannot specify both an offline site and a data center']]
                } else if (!isOSBlank){
                    isOffline = true
                }
            }

            if (datum.hostname.trim() !== '' && !/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$/.test(datum.hostname)) {
                errors = [...errors, [i + 1, 'Invalid hostname (does not follow RFC-1034 specs)']]
            }

            if (datum.hostname.trim() !== '' && datum.hostname.trim() in hostnamesToId && (''+hostnamesToId[datum.hostname.trim()]).trim() != (''+datum.asset_number).trim()) {
                errors = [...errors, [i + 1, 'Hostname taken by another asset']]
                console.log('HOSTNAME CONFLICT: '+datum.asset_number+' '+hostnamesToId[datum.hostname])
            }

            if (!isBlade && !isOffline) {
                if (!datum.rack_position || String(datum.rack_position).trim() === '') {
                    errors = [...errors, [i + 1, 'Rack position not found']]
                    canTestForFit = false
                } else if (isNaN(String(datum.rack_position).trim()) || !Number.isInteger(parseFloat(String(datum.rack_position).trim())) || parseInt(String(datum.rack_position).trim()) <= 0 || parseInt(String(datum.rack_position).trim()) > 42) {
                    errors = [...errors, [i + 1, 'Rack position is not a positive integer less than 43']]
                    canTestForFit = false
                }
            } else {
                if (datum.rack || datum.rack_position) {
                    errors = [...errors, [i + 1, 'Rack position and rack must be blank for offline assets and blade assets']]
                }
            }

            if (!isBlade) {
                if (datum.chassis_slot || datum.chassis_number) {
                    errors = [...errors, [i + 1, 'Chassis slot and number must be blank for non-blade assets']]
                }
            }

            if (!isOffline && !userutils.doesLoggedInUserHaveAssetPerm((datum.datacenter+'').trim())) {
                errors = [...errors, [i + 1, "You don't have asset management permissions for this site"]]
            } else if (isOffline && !userutils.doesLoggedInUserHaveAssetPerm((datum.offline_site+'').trim(), true)) {
                errors = [...errors, [i + 1, "You don't have asset management permissions for this site"]]
            }

            if (datum.datacenter && !(datum.datacenter in existingRacks)) {
                canTestForFit = false
                errors = [...errors, [i + 1, 'Datacenter does not exist']]
            } else if (datum.datacenter && datum.rack && !(existingRackNames[datum.datacenter].includes(datum.rack))) {
                canTestForFit = false
                errors = [...errors, [i + 1, 'Rack does not exist in specified datacenter']]
            }

            if (datum.offline_site && !(datum.offline_site in existingOSs)) {
                errors = [...errors, [i + 1, 'Offline site does not exist']]
            }

            if (isBlade && !isOffline) {
                if (isNaN(String(datum.chassis_slot).trim()) || !Number.isInteger(parseFloat(String(datum.chassis_slot).trim())) || parseInt(String(datum.chassis_slot).trim()) <= 0 || parseInt(String(datum.chassis_slot).trim()) > 14) {
                    errors = [...errors, [i + 1, 'Chassis slot must be an integer between 1 and 14 (inclusive of both)']]
                }

                if (datum.chassis_number && !(datum.chassis_number in assetsLoaded) && !(datum.chassis_number in newChassis)) {
                    errors = [...errors, [i + 1, 'No chassis exists with specified chassis number']]
                } else if (datum.chassis_number && datum.chassis_slot){
                    // Check if slot is free
                    if (datum.chassis_number in usedSlotsInChassis && datum.chassis_slot in usedSlotsInChassis[datum.chassis_number]
                    && usedSlotsInChassis[datum.chassis_number][datum.chassis_slot] !== datum.asset_number) {
                        errors = [...errors, [i + 1, 'Desired chassis slot is not available']]
                    } else if (datum.chassis_number in newChassis && datum.chassis_slot in newChassis[datum.chassis_number]
                    && newChassis[datum.chassis_number][datum.chassis_slot] !== datum.asset_number) {
                        errors = [...errors, [i + 1, 'Desired chassis slot is not available']]
                    } else {
                        // We can add this blade!
                        if (!(datum.chassis_number in assetsLoaded) && (datum.chassis_number in newChassis)) {
                            if (datum.chassis_slot in newChassis[datum.chassis_number]) {
                                newChassis[datum.chassis_number][datum.chassis_slot] = datum.asset_number
                            } else {
                                newChassis[datum.chassis_number] = {[datum.chassis_slot]: datum.asset_number}
                            }
                        }
                        if (datum.chassis_number in chassisHostnameUpdates) {
                            datum.chassis_hostname = chassisHostnameUpdates[datum.chassis_number]
                        } else {
                            datum.chassis_hostname = assetsLoaded[datum.chassis_number].hostname || bladeutils.makeNoHostname(datum.chassis_number)
                        }
                        datum.datacenter = assetsLoaded[datum.chassis_number].datacenter
                    }
                }
            }

            if (datum.owner && !existingUsernames.includes(datum.owner)) {
                errors = [...errors, [i + 1, 'Owner does not exist']]
            }

            if(!isBlade) {
                if (datum.power_port_connection_1 && !/^[LR]([2][0-4]|[1][0-9]|[0][1-9]|[1-9])$/i.test(datum.power_port_connection_1)) {
                    errors = [...errors, [i + 1, 'Power port connection 1 invalid']]
                }

                if (datum.power_port_connection_2 && !/^[LR]([2][0-4]|[1][0-9]|[0][1-9]|[1-9])$/i.test(datum.power_port_connection_2)) {
                    errors = [...errors, [i + 1, 'Power port connection 2 invalid']]
                }

                var powerPortsNumber = 0
                if (canTestForFit) {
                    powerPortsNumber = existingModels[datum.vendor][datum.model_number].powerPorts
                    if (!powerPortsNumber && (datum.power_port_connection_1 || datum.power_port_connection_2)) {
                        errors = [...errors, [i + 1, 'This model does not have any power ports']]
                        canTestForFit = false
                    }

                    if (powerPortsNumber == 1 && datum.power_port_connection_2) {
                        errors = [...errors, [i + 1, 'This model has only one power port and you have specified a connection for power port #2']]
                        canTestForFit = false
                    }
                }
            }

            datum.mount_type = existingModels[datum.vendor][datum.model_number].mount

            if (datum.mount_type === 'chassis' && !(datum.asset_number in assetsLoaded)) {
                // This is a new chassis
                if (!(datum.asset_number in newChassis)) {
                    newChassis[datum.asset_number] = {}
                }
            }

            if (canTestForFit) {
                if (!datum.custom_display_color || String(datum.custom_display_color).trim() === '') {
                    datum.custom_display_color = ""
                } else if (datum.custom_display_color && !/^#[0-9A-F]{6}$/i.test(String(datum.custom_display_color))) {
                    errors = [...errors, [i+1, 'Invalid display color']]
                }

                if (datum.custom_cpu.trim() && datum.custom_cpu.trim().length > 50) {
                    errors = [...errors, [i+1, 'CPU should be less than 50 characters long']]
                } else if (datum.custom_cpu.trim() === '') {
                    datum.custom_cpu = ""
                }

                if (datum.custom_storage.trim() && datum.custom_storage.trim().length > 50) {
                    errors = [...errors, [i+1, 'Storage should be less than 50 characters long']]
                } else if (datum.custom_storage.trim() === '') {
                    datum.custom_storage = ""
                }

                if (datum.custom_memory && String(datum.custom_memory).trim() !== '' &&
                 (isNaN(String(datum.custom_memory).trim()) || !Number.isInteger(parseFloat(String(datum.custom_memory).trim())) || parseInt(String(datum.custom_memory).trim()) < 0 || parseInt(String(datum.custom_memory).trim()) > 1000)) {
                     errors = [...errors, [i+1, 'Memory should be a non-negative integer not greater than 1000']]
                } else if (datum.custom_memory.trim() === '') {
                    datum.custom_memory = ""
                }

                datum.modelID = existingModels[datum.vendor][datum.model_number].id
            }

            if (!isBlade && canTestForFit && !isOffline) {
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
                        console.log('row: '+(i+1)+', '+usedRackUsInRack[rackNamesToIdsForOurDC[datum.rack]][j]+' conflicts w us: '+datum.asset_number)
                        errors = [...errors, [i + 1, 'Asset will not fit on the rack at this position']]
                    }
                }

                datum.rackID = rackNamesToIdsForOurDC[datum.rack]
                datum.dcID = existingDCs[datum.datacenter].id
                datum.dcFN = existingDCs[datum.datacenter].name
                datum.power_connections = []

                if (datum.power_port_connection_1) {
                    datum.power_connections.push({
                        pduSide: datum.power_port_connection_1.charAt(0) === 'L' ? 'Left' : 'Right',
                        port: datum.power_port_connection_1.substring(1)
                    })
                }

                if (datum.power_port_connection_2) {
                    datum.power_connections.push({
                        pduSide: datum.power_port_connection_2.charAt(0) === 'L' ? 'Left' : 'Right',
                        port: datum.power_port_connection_2.substring(1)
                    })
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

            datum.isBlade = isBlade
            datum.isOffline = isOffline
            if (isOffline) {
                datum.offline_site_name = existingOSs[datum.offline_site].name
            }

            if (!(datum.asset_number in assetsLoaded)) {
                // New asset
                toBeAdded.push(datum)
            } else {
                // Either ignore or modify
                const assetFromDb = assetsLoaded[datum.asset_number]
                var ppC1 = ''
                var ppC2 = ''

                if (isBlade || isOffline) { // Power connections don't matter for blades or offlien assets
                    ppC1 = ''
                    ppC2 = ''
                    datum.power_port_connection_1 = ''
                    datum.power_port_connection_2 = ''
                } else {
                    ppC1 = (assetFromDb.powerConnections && assetFromDb.powerConnections[0] && ((assetFromDb.powerConnections[0].pduSide === 'Left' ? 'L' : 'R')+assetFromDb.powerConnections[0].port)) || ''
                    ppC2 = (assetFromDb.powerConnections && assetFromDb.powerConnections[1] && ((assetFromDb.powerConnections[1].pduSide === 'Left' ? 'L' : 'R')+assetFromDb.powerConnections[1].port)) || ''
                }

                if (isOffline) {
                    // Offline asset regardless of type
                    if ((assetFromDb.hostname !== undefined && assetFromDb.hostname.toLowerCase().trim() == datum.hostname) &&
                        (assetFromDb.datacenter && assetFromDb.datacenter.toLowerCase().trim() == existingOSs[datum.offline_site].name.toLowerCase().trim()) &&
                        (assetFromDb.owner && assetFromDb.owner.toLowerCase().trim() == datum.owner.toLowerCase().trim()) &&
                        (assetFromDb.commet && assetFromDb.comment.trim() == datum.comment.trim()) &&
                        (assetFromDb.variances &&
                            assetFromDb.variances.cpu == datum.custom_cpu &&
                            assetFromDb.variances.memory == datum.custom_memory &&
                            assetFromDb.variances.storage == datum.custom_storage &&
                            assetFromDb.variances.displayColor == datum.custom_display_color
                        )) {
                        toBeIgnored.push(datum)
                    } else {
                        toBeModified.push(datum)
                    }
                } else if (isBlade) {
                    // Online asset but blade-type
                    if (assetFromDb && (assetFromDb.hostname !== undefined && assetFromDb.hostname.toLowerCase().trim() == datum.hostname) &&
                        (assetFromDb.datacenterAbbrev && assetFromDb.datacenterAbbrev.toLowerCase().trim() == datum.datacenter.toLowerCase().trim()) &&
                        (datum.chassis_number in usedSlotsInChassis && usedSlotsInChassis[datum.chassis_number][datum.chassis_slot] == datum.asset_number) &&
                        (assetFromDb.owner && assetFromDb.owner.toLowerCase().trim() == datum.owner.toLowerCase().trim()) &&
                        (assetFromDb.commet && assetFromDb.comment.trim() == datum.comment.trim()) &&
                        (assetFromDb.variances &&
                            assetFromDb.variances.cpu == datum.custom_cpu &&
                            assetFromDb.variances.memory == datum.custom_memory &&
                            assetFromDb.variances.storage == datum.custom_storage &&
                            assetFromDb.variances.displayColor == datum.custom_display_color
                        )) {
                        toBeIgnored.push(datum)
                    } else {
                        toBeModified.push(datum)
                    }
                } else {
                    // All other regular assets
                    if (assetFromDb && (assetFromDb.hostname !== undefined && assetFromDb.hostname.toLowerCase().trim() == datum.hostname) &&
                        (assetFromDb.datacenterAbbrev && assetFromDb.datacenterAbbrev.toLowerCase().trim() == datum.datacenter.toLowerCase().trim()) &&
                        (assetFromDb.rack && assetFromDb.rack.toUpperCase().trim() == datum.rack) &&
                        ''+assetFromDb.rackU == datum.rack_position.trim() &&
                        (assetFromDb.owner && assetFromDb.owner.toLowerCase().trim() == datum.owner.toLowerCase().trim()) &&
                        (assetFromDb.comment && assetFromDb.comment.trim() == datum.comment.trim()) &&
                        ppC1 == datum.power_port_connection_1.trim().toUpperCase() &&
                        ppC2 == datum.power_port_connection_2.trim().toUpperCase() &&
                        (assetFromDb.variances &&
                            assetFromDb.variances.cpu == datum.custom_cpu &&
                            assetFromDb.variances.memory == datum.custom_memory &&
                            assetFromDb.variances.storage == datum.custom_storage &&
                            assetFromDb.variances.displayColor == datum.custom_display_color
                        )) {
                        toBeIgnored.push(datum)
                    } else {
                        toBeModified.push(datum)
                        if (datum.mount_type === 'chassis' && assetFromDb.hostname.toLowerCase().trim() != datum.hostname.toLowerCase().trim()) {
                            chassisHostnameUpdates[datum.asset_number] = datum.hostname.toLowerCase().trim()
                        }
                        if (datum.mount_type === 'chassis') {
                            datum.OGmacAddresses = assetFromDb.macAddresses
                            datum.OGnetworkConnectionsArray = []
                            Object.keys(assetFromDb.networkConnections).forEach(key => {
                                datum.OGnetworkConnectionsArray.push({
                                    thisPort: key,
                                    ...assetFromDb.networkConnections[key]
                                })
                            })
                        }
                    }
                }
            }
        }

        // At this point we're done with all validation
        callback({ errors, toBeIgnored, toBeAdded, toBeModified })
    }

    firebaseutils.decommissionRef.get().then(qs => {
        for (var i = 0; i < qs.size; i++) {
            const assetID = qs.docs[i].data().assetId
            decommissionedAssetIds.push(assetID)
            unusedIds.splice(unusedIds.indexOf(assetID), 1)
        }
        postTaskCompletion()
    })

    firebaseutils.offlinestorageRef.get().then(qs => {
        for (var i = 0; i < qs.size; i++) {
            existingOSs[qs.docs[i].data().abbreviation] = {...qs.docs[i].data(), id: qs.docs[i].id}
        }
        postTaskCompletion()
    })

    firebaseutils.bladeRef.get().then(qs => {
        for (var i = 0; i < qs.size; i++) {
            const blade = {...qs.docs[i].data(), id: qs.docs[i].id}
            if (blade.chassisId in usedSlotsInChassis) {
                usedSlotsInChassis[''+blade.chassisId][''+blade.rackU] = blade.id
            } else {
                usedSlotsInChassis[''+blade.chassisId] = {[''+blade.rackU]: blade.id}
            }
        }
        postTaskCompletion()
    })

    firebaseutils.db.collectionGroup('offlineAssets').get().then(qs => {
        for (var i = 0; i < qs.size; i++) {
            offlineAssets[qs.docs[i].data().assetId] = qs.docs[i].data()
            unusedIds.splice(unusedIds.indexOf(qs.docs[i].data().assetId), 1)
            const asset = {...qs.docs[i].data(), id: qs.docs[i].id}
            const assetID = qs.docs[i].data().assetId
            assetsLoaded[assetID] = asset
            if (asset.hostname) {
                hostnamesToId[asset.hostname] = assetID
            }
        }
        postTaskCompletion()
    })

    firebaseutils.assetRef.get().then(qs => {
        for (var i = 0; i < qs.size; i++) {
            const asset = {...qs.docs[i].data(), id: qs.docs[i].id}
            const assetID = qs.docs[i].data().assetId
            assetsLoaded[assetID] = asset
            if (asset.hostname) {
                hostnamesToId[asset.hostname] = assetID
            }
            unusedIds.splice(assetID, 1)

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

function bulkAddRegularAsset(asset, callback) {
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
        rackNum: parseInt(asset.rack.substring(1)),
        datacenter: asset.dcFN,
        datacenterID: asset.dcID,
        datacenterAbbrev:  asset.datacenter,
        macAddresses: {},
        variances: {
            cpu: asset.custom_cpu,
            displayColor: asset.custom_display_color,
            storage: asset.custom_storage,
            memory: asset.custom_memory+''
        }
    }


    if (asset.mount_type === 'chassis') {
        bladeutils.addChassis(
            assetObject.assetId, assetObject.model,
            assetObject.hostname, assetObject.rack, assetObject.rackU,
            assetObject.owner, assetObject.comment,
            assetObject.datacenter, {}, [], assetObject.powerConnections, assetObject.variances.displayColor,
            assetObject.variances.memory, assetObject.variances.storage, assetObject.variances.cpu,
            () => callback()
        )
    } else {
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
    }
}

function bulkAddBladeAsset(asset) {
    bladeutils.addServer(asset.asset_number,
        asset.vendor+' '+asset.model_number, asset.hostname,
        asset.chassis_hostname, asset.chassis_slot,
        asset.owner, asset.comment,
        asset.datacenter, {},
        [], [],
        asset.custom_display_color, asset.custom_memory, asset.custom_storage, asset.custom_cpu,
        () => {})
}

function addAssetToOS(asset, assetObject) {
    firebaseutils.offlinestorageRef.where('abbreviation', '==', asset.offline_site).get().then(qs => {
        const siteId = qs.docs[0].id

        firebaseutils.offlinestorageRef.doc(siteId).collection('offlineAssets').doc(asset.asset_number).set(assetObject)
        logutils.addLog(asset.asset_number, logutils.OFFLINE(), logutils.CREATE(), {datacenterAbbrev: qs.docs[0].data().abbreviation})

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

        let _owner = assetObject.owner

        while (_owner.length > 1) {
            _owner = _owner.substr(1)
            suffixes_list.push(_owner)
        }

        client.initIndex(asset.offline_site+'_index').saveObject({ ...assetObject, objectID: asset.asset_number, suffixes: suffixes_list.join(' ') })
    })
}

function bulkAddOfflineAsset(asset) {
    const assetObject = {
        assetId: asset.asset_number,
        modelId: asset.modelID,
        model: asset.vendor+' '+asset.model_number,
        hostname: asset.hostname,
        owner: asset.owner,
        comment: asset.comment,
        networkConnections: {},
        powerConnections: [],
        modelNumber: asset.model_number,
        vendor: asset.vendor,
        datacenter: asset.offline_site_name,
        macAddresses: {},
        variances: {
            cpu: asset.custom_cpu,
            displayColor: asset.custom_display_color,
            storage: asset.custom_storage,
            memory: asset.custom_memory+''
        }
    }

    addAssetToOS(asset, assetObject)
}

function bulkAddAssets (assets, callback) {
    var bladesToAdd = []
    var chassisCount = 0
    for (var i = 0; i < assets.length; i++) {
        if (assets[i].mount_type === 'chassis') {
            chassisCount++
        } else if (assets[i].isBlade) {
            bladesToAdd.push(assets[i])
        }
    }

    if (chassisCount === 0) {
        // Now we can add all the blades safely
        bladesToAdd.forEach((blade, i) => {
            bulkAddBladeAsset(blade)
        })
    }

    for (i = 0; i < assets.length; i++) {
        var asset = assets[i]
        if(asset.isOffline) {
            // Offline asset regardless of type
            bulkAddOfflineAsset(asset)
        } else if (asset.isBlade) {
            // Online blade asset
        } else {
            // Regular online asset
            bulkAddRegularAsset(asset, () => {
                chassisCount--
                if (chassisCount === 0) {
                    // Now we can add all the blades safely
                    bladesToAdd.forEach((blade, i) => {
                        bulkAddBladeAsset(blade)
                    })
                }
            })
        }
    }
    callback()
}

var updatesss = {}
function bulkModifyRegularAsset(asset, callback) {
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
        updates.rackNum = parseInt(asset.rack.substring(1))
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

    if (asset.custom_cpu) {
        updates["variances.cpu"] = asset.custom_cpu
    }
    if (asset.custom_display_color) {
        updates["variances.displayColor"] = asset.custom_display_color
    }
    if (asset.custom_storage) {
        updates["variances.storage"] = asset.custom_storage
    }
    if (asset.custom_memory) {
        updates["variances.memory"] = asset.custom_memory
    }

    updatesss[asset.asset_number] = updates
    if (asset.mount_type === 'chassis') {
        bladeutils.updateChassis(
            asset.asset_number, asset.vendor+' '+asset.model_number,
            asset.hostname, asset.rack, parseInt(asset.rack_position),
            asset.owner, asset.comment,
            asset.dcFN, asset.OGmacAddresses, asset.OGnetworkConnectionsArray, [], asset.powerConnections,
            asset.custom_display_color, asset.custom_memory, asset.custom_storage, asset.custom_cpu,
            () => callback()
        )
    } else {
        // Regular asset modification
        firebaseutils.assetRef.doc(asset.asset_number).get().then(ds => {
            firebaseutils.racksRef.doc(ds.data().rackID).update({
                assets: firebaseutils.firebase.firestore.FieldValue.arrayRemove(ds.data().assetId+'')
            })

            firebaseutils.racksRef.doc(updatesss[ds.id].rackID).update({
                assets: firebaseutils.firebase.firestore.FieldValue.arrayUnion(ds.data().assetId+'')
            })

            const updates = updatesss[ds.data().assetId]
            logutils.getObjectData(String(asset.asset_number), logutils.ASSET(), oldData => {
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

                  logutils.addLog(String(asset.asset_number), logutils.ASSET(), logutils.MODIFY(), oldData)
              })
            })
        })
    }
}

function bulkModifyOfflineAsset(asset) {
    firebaseutils.db.collectionGroup('offlineAssets').where('assetId', '==', asset.asset_number).get().then(qs => {
        var updates = {...qs.docs[0].data()}
        var oldAssetData = {...qs.docs[0].data()}

        if (asset.hostname) {
            updates.hostname = asset.hostname
        }

        if (asset.owner) {
            updates.owner = asset.owner
        }

        if (asset.comment) {
            updates.comment = asset.comment
        }

        if (asset.offline_site_name != updates.datacenter){
            updates.datacenter = asset.offline_site_name
        }

        if (asset.custom_cpu) {
            updates.variances.cpu = asset.custom_cpu
        }
        if (asset.custom_display_color) {
            updates.variances.displayColor = asset.custom_display_color
        }
        if (asset.custom_storage) {
            updates.variances.storage = asset.custom_storage
        }
        if (asset.custom_memory) {
            updates.variances.memory = asset.custom_memory
        }

        if (asset.offline_site_name != oldAssetData.datacenter){
            // ADD IT TO A DIFFERENT OS
            addAssetToOS(asset, updates)
            // AND REMOVE IT FROM CURRENT OS
            qs.docs[0].ref.delete()
            logutils.addLog(String(asset.asset_number), logutils.OFFLINE(), logutils.DELETE(), oldAssetData)
            client.initIndex(oldAssetData.datacenter+'_index').deleteObject(asset.asset_number)
        } else {
            // UPDATE
            qs.docs[0].ref.update(updates)
            logutils.addLog(String(asset.asset_number), logutils.OFFLINE(), logutils.MODIFY(), {...oldAssetData, datacenterAbbrev: asset.offline_site}, () => {})
        }
    })
}

function bulkModifyBladeAsset (asset) {
    bladeutils.updateServer(asset.asset_number,
        asset.vendor+' '+asset.model_number, asset.hostname,
        asset.chassis_hostname, asset.chassis_slot,
        asset.owner, asset.comment,
        asset.datacenter, {},
        [], [], [],
        asset.custom_display_color, asset.custom_memory, asset.custom_storage, asset.custom_cpu,
        () => {})
}

function bulkModifyAssets (assets, callback) {
    updatesss = {}
    var bladesToMod = []
    var chassisCount = 0

    for (var i = 0; i < assets.length; i++) {
        if (assets[i].mount_type === 'chassis') {
            chassisCount++
        } else if (assets[i].isBlade) {
            bladesToMod.push(assets[i])
        }
    }

    for (i = 0; i < assets.length; i++) {
        var asset = assets[i]
        if(asset.isOffline) {
            // Offline asset regardless of type
            bulkModifyOfflineAsset(asset)
        } else if (asset.isBlade) {
            // Online blade asset
            // Handled in callback in the following else-block
        } else {
            // Regular online asset
            bulkModifyRegularAsset(asset, () => {
                chassisCount--
                if (chassisCount === 0) {
                    // Now we can add all the blades safely
                    bladesToMod.forEach((blade, i) => {
                        bulkModifyBladeAsset(blade)
                    })
                }
            })
        }
    }
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
    var assetsInDb = {}
    var offlineAssetsInDb = {}
    var models = {}
    var blades = {}
    var osNameToAbbrev = {}

    firebaseutils.offlinestorageRef.get().then(qs => {
        for (var i = 0; i < qs.size; i++) {
            osNameToAbbrev[qs.docs[i].data().name] = qs.docs[i].data().abbreviation
        }

        firebaseutils.bladeRef.get().then(qs => {
            for (i = 0; i < qs.size; i++) {
                blades[qs.docs[i].id] = qs.docs[i].data()
            }

            firebaseutils.modelsRef.get().then(qs => {
                for (i = 0; i < qs.size; i++) {
                    models[qs.docs[i].id] = qs.docs[i].data()
                }

                firebaseutils.assetRef.orderBy('assetId').get().then(qs => {
                    var rows = [
                        ["asset_number", "hostname", "datacenter", "offline_site", "rack", "rack_position",
                        "chassis_number", "chassis_slot",
                        "vendor", "model_number", "owner", "comment", "power_port_connection_1", "power_port_connection_2",
                        "custom_display_color", "custom_cpu", "custom_memory", "custom_storage"]
                    ]

                    for (var i = 0; i < qs.size; i++) {
                        assetsInDb[qs.docs[i].data().assetId] = qs.docs[i].data()
                    }

                    firebaseutils.db.collectionGroup('offlineAssets').orderBy('assetId').get().then(qs2 => {
                        for (i = 0; i < qs2.size; i++) {
                            offlineAssetsInDb[qs2.docs[i].data().assetId] = qs2.docs[i].data()
                        }

                        for (i = 0; i < assets.length; i++) {
                            // add live assets to csv
                            var asset = assets[i]
                            if (asset.assetId in assetsInDb) {
                                // online asset
                                const ppC1 = (asset.powerConnections && asset.powerConnections.length >= 1 && asset.powerConnections[0].pduSide && asset.powerConnections[0].port ? (
                                    (asset.powerConnections[0].pduSide === 'Left' ? 'L' : 'R')+asset.powerConnections[0].port
                                ) : '')
                                const ppC2 = (asset.powerConnections && asset.powerConnections.length >= 2 && asset.powerConnections[1].pduSide && asset.powerConnections[1].port ? (
                                    (asset.powerConnections[1].pduSide === 'Left' ? 'L' : 'R')+asset.powerConnections[1].port
                                ) : '')

                                var rack = ''
                                var rackU = ''
                                var chassisId = ''
                                var chassisSlot = ''

                                if (models[asset.modelId].mount === 'blade') {
                                    rack = ''
                                    rackU = ''
                                    chassisId = blades[asset.assetId].chassisId
                                    chassisSlot = blades[asset.assetId].rackU
                                } else {
                                    rack = escapeStringForCSV(asset.rack)
                                    rackU = ''+asset.rackU
                                    chassisId = ''
                                    chassisSlot = ''
                                }

                                rows = [...rows, [
                                    escapeStringForCSV(asset.assetId),
                                    escapeStringForCSV(asset.hostname),
                                    escapeStringForCSV(asset.datacenterAbbrev),
                                    '',
                                    rack,
                                    rackU,
                                    chassisId,
                                    chassisSlot,
                                    escapeStringForCSV(asset.vendor),
                                    escapeStringForCSV(asset.modelNumber),
                                    escapeStringForCSV(asset.owner),
                                    escapeStringForCSV(asset.comment),
                                    ppC1,
                                    ppC2,
                                    escapeStringForCSV(asset.variances.displayColor),
                                    escapeStringForCSV(asset.variances.cpu),
                                    escapeStringForCSV(asset.variances.memory+''),
                                    escapeStringForCSV(asset.variances.storage)
                                ]]
                            } else if (asset.assetId in offlineAssetsInDb) {
                                // offline asset
                                const ppC1 = ''
                                const ppC2 = ''

                                rows = [...rows, [
                                    escapeStringForCSV(asset.assetId),
                                    escapeStringForCSV(asset.hostname),
                                    '',
                                    osNameToAbbrev[asset.datacenter],
                                    '',
                                    '',
                                    '',
                                    '',
                                    escapeStringForCSV(asset.vendor),
                                    escapeStringForCSV(asset.modelNumber),
                                    escapeStringForCSV(asset.owner),
                                    escapeStringForCSV(asset.comment),
                                    ppC1,
                                    ppC2,
                                    escapeStringForCSV(asset.variances.displayColor),
                                    escapeStringForCSV(asset.variances.cpu),
                                    escapeStringForCSV(asset.variances.memory+''),
                                    escapeStringForCSV(asset.variances.storage)
                                ]]
                            } else {
                                console.log("pleas dont be hrere")
                                console.log(asset)
                            }
                        }
                        var blob = new Blob([rows.map(e => e.join(",")).join("\r\n")], {
                            type: "data:text/csv;charset=utf-8;",
                        })
                        saveAs(blob, "hyposoft_assets_filtered.csv")
                    })
                })
            })
        })
    })
}

function getAssetsForExport (callback) {
    var assets = {}
    var offlineAssets = {}
    var models = {}
    var blades = {}
    var osNameToAbbrev = {}

    firebaseutils.offlinestorageRef.get().then(qs => {
        for (var i = 0; i < qs.size; i++) {
            osNameToAbbrev[qs.docs[i].data().name] = qs.docs[i].data().abbreviation
        }

        firebaseutils.bladeRef.get().then(qs => {
            for (i = 0; i < qs.size; i++) {
                blades[qs.docs[i].id] = qs.docs[i].data()
            }

            firebaseutils.modelsRef.get().then(qs => {
                for (i = 0; i < qs.size; i++) {
                    models[qs.docs[i].id] = qs.docs[i].data()
                }

                firebaseutils.assetRef.orderBy('assetId').get().then(qs => {
                    var rows = [
                        ["asset_number", "hostname", "datacenter", "offline_site", "rack", "rack_position",
                        "chassis_number", "chassis_slot",
                        "vendor", "model_number", "owner", "comment", "power_port_connection_1", "power_port_connection_2",
                        "custom_display_color", "custom_cpu", "custom_memory", "custom_storage"]
                    ]

                    for (var i = 0; i < qs.size; i++) {
                        assets[qs.docs[i].data().assetId] = qs.docs[i].data()
                    }

                    firebaseutils.db.collectionGroup('offlineAssets').orderBy('assetId').get().then(qs2 => {
                        for (i = 0; i < qs2.size; i++) {
                            offlineAssets[qs2.docs[i].data().assetId] = qs2.docs[i].data()
                        }

                        var assetsKeys = Object.keys(assets)
                        for (i = 0; i < assetsKeys.length; i++) {
                            // add live assets to csv
                            var asset = assets[assetsKeys[i]]
                            const ppC1 = (asset.powerConnections && asset.powerConnections.length >= 1 && asset.powerConnections[0].pduSide && asset.powerConnections[0].port ? (
                                (asset.powerConnections[0].pduSide === 'Left' ? 'L' : 'R')+asset.powerConnections[0].port
                            ) : '')
                            const ppC2 = (asset.powerConnections && asset.powerConnections.length >= 2 && asset.powerConnections[1].pduSide && asset.powerConnections[1].port ? (
                                (asset.powerConnections[1].pduSide === 'Left' ? 'L' : 'R')+asset.powerConnections[1].port
                            ) : '')

                            var rack = ''
                            var rackU = ''
                            var chassisId = ''
                            var chassisSlot = ''
                            var dc = escapeStringForCSV(asset.datacenterAbbrev)

                            if (models[asset.modelId].mount === 'blade') {
                                rack = ''
                                rackU = ''
                                chassisId = blades[asset.assetId].chassisId
                                chassisSlot = blades[asset.assetId].rackU
                                dc = ''
                            } else {
                                rack = escapeStringForCSV(asset.rack)
                                rackU = ''+asset.rackU
                                chassisId = ''
                                chassisSlot = ''
                            }

                            rows = [...rows, [
                                escapeStringForCSV(asset.assetId),
                                escapeStringForCSV(asset.hostname),
                                dc,
                                '',
                                rack,
                                rackU,
                                chassisId,
                                chassisSlot,
                                escapeStringForCSV(asset.vendor),
                                escapeStringForCSV(asset.modelNumber),
                                escapeStringForCSV(asset.owner),
                                escapeStringForCSV(asset.comment),
                                ppC1,
                                ppC2,
                                escapeStringForCSV(asset.variances.displayColor),
                                escapeStringForCSV(asset.variances.cpu),
                                escapeStringForCSV(asset.variances.memory+''),
                                escapeStringForCSV(asset.variances.storage)
                            ]]
                        }

                        var offlineAssetsKeys = Object.keys(offlineAssets)
                        for (i = 0; i < offlineAssetsKeys.length; i++) {
                            // add offline assets to csv
                            asset = offlineAssets[offlineAssetsKeys[i]]
                            const ppC1 = ''
                            const ppC2 = ''

                            rows = [...rows, [
                                escapeStringForCSV(asset.assetId),
                                escapeStringForCSV(asset.hostname),
                                '',
                                osNameToAbbrev[asset.datacenter],
                                '',
                                '',
                                '',
                                '',
                                escapeStringForCSV(asset.vendor),
                                escapeStringForCSV(asset.modelNumber),
                                escapeStringForCSV(asset.owner),
                                escapeStringForCSV(asset.comment),
                                ppC1,
                                ppC2,
                                escapeStringForCSV(asset.variances.displayColor),
                                escapeStringForCSV(asset.variances.cpu),
                                escapeStringForCSV(asset.variances.memory+''),
                                escapeStringForCSV(asset.variances.storage)
                            ]]
                        }

                        callback(rows)
                    })
                })
            })
        })
    })
}

export { validateImportedAssets, bulkAddAssets, bulkModifyAssets, getAssetsForExport,
exportFilteredAssets }
