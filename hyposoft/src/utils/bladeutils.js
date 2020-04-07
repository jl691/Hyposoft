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
                        console.log(qs.docs[0]);
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

export { addChassis }
