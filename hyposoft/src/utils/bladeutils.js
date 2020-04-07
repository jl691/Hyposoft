import * as firebaseutils from './firebaseutils'
import * as assetutils from './assetutils'
import * as datacenterutils from './datacenterutils'

function addChassis(overrideAssetID, model, hostname, rack, racku, owner, comment, datacenter, macAddresses, networkConnectionsArray, powerConnections, callback, changePlanID = null, changeDocID = null) {
    assetutils.addAsset(overrideAssetID, model, hostname, rack, racku, owner, comment, datacenter, macAddresses, networkConnectionsArray, powerConnections, (errorMessage,id) => {
        if (!errorMessage && id) {
            // add collection to rack
            let splitRackArray = rack.split(/(\d+)/).filter(Boolean)
            let rackRow = splitRackArray[0]
            let rackNum = parseInt(splitRackArray[1])
            datacenterutils.getDataFromName(datacenter, datacenterID => {
                firebaseutils.racksRef.where("letter", "==", rackRow).where("number", "==", rackNum).where("datacenter", "==", datacenterID).get().then(qs => {
                    if (!qs.empty) {
                        // added fields copied from rack
                        // don't really need the number field so will hardcode to something
                        firebaseutils.racksRef.doc(qs.docs[0].id).collection('blades').doc(id).set({
                            letter: hostname,
                            number: 1,
                            height: 14,
                            assets: [],
                            powerPorts:[],
                            datacenter: datacenterID
                        })
                    }
                })
            })
        }
        callback(errorMessage)
    }, changePlanID, changeDocID)
}

function addServer(overrideAssetID, model, hostname, chassisHostname, slot, owner, comment, datacenter, macAddresses, networkConnectionsArray, powerConnections, callback, changePlanID = null, changeDocID = null) {
    firebaseutils.assetRef.where('hostname','==',chassisHostname).get().then(qs => {
        if (!qs.empty) {
            const rack = qs.docs[0].data().rack
            const racku = qs.docs[0].data().rackU
            const rackId = qs.docs[0].data().rackID
            const chassisId = qs.docs[0].id

            assetutils.addAsset(overrideAssetID, model, hostname, rack, racku, owner, comment, datacenter, macAddresses, networkConnectionsArray, powerConnections, (errorMessage,id) => {
                if (!errorMessage && id) {
                    // need to fix this, need to get doc with collection
                    firebaseutils.racksRef.doc(rackId).collection('blades').doc(chassisId).get().then(doc => {
                        if (doc.exists) {
                            doc.ref.update({
                                assets: doc.data().assets.concat(id)
                            })
                            firebaseutils.bladeRef.doc(id).set({
                                rack: chassisHostname,
                                rackU: slot,
                                rackId: rackId,
                                model: model,
                                chassisId: chassisId
                            })
                        }
                    })
                }
                callback(errorMessage)
                return
            }, changePlanID, changeDocID, {hostname: chassisHostname, slot: slot, id: chassisId})
        } else {
            callback('blade chassis ' + chassisHostname +' does not exist')
        }
    })
}

export { addChassis, addServer }
