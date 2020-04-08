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
                            id: id,
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

function updateChassis(assetID, model, hostname, rack, rackU, owner, comment, datacenter, macAddresses,
    networkConnectionsArray, deletedNCThisPort, powerConnections, callback, changePlanID = null, changeDocID = null) {
    assetutils.updateAsset(assetID, model, hostname, rack, rackU, owner, comment, datacenter, macAddresses,
        networkConnectionsArray, deletedNCThisPort, powerConnections, (errorMessage,id) => {
        if (!errorMessage && id) {
            // add collection to rack
            let splitRackArray = rack.split(/(\d+)/).filter(Boolean)
            let rackRow = splitRackArray[0]
            let rackNum = parseInt(splitRackArray[1])
            datacenterutils.getDataFromName(datacenter, (datacenterID,datacenterAbbrev) => {
                firebaseutils.racksRef.where("letter", "==", rackRow).where("number", "==", rackNum).where("datacenter", "==", datacenterID).get().then(qs => {
                    if (!qs.empty) {
                        // update self attributes within blades subcollection
                        firebaseutils.db.collectionGroup('blades').where("id","==",id).get().then(querySnapshot => {
                            const prevData = querySnapshot.docs[0].data()
                            querySnapshot.docs[0].ref.delete().then(() => {
                              firebaseutils.racksRef.doc(qs.docs[0].id).collection('blades').doc(id).set({
                                  id: id,
                                  letter: hostname,
                                  number: prevData.number,
                                  height: prevData.height,
                                  assets: prevData.assets,
                                  powerPorts: prevData.powerPorts,
                                  datacenter: datacenterID
                              }).then(async() => {
                                // update all my assets
                                const assets = prevData.assets
                                for (var i = 0; i < assets.length; i++) {
                                    await new Promise(function(resolve, reject) {
                                      firebaseutils.assetRef.doc(assets[i]).update({
                                          datacenter: datacenter,
                                          datacenterID: datacenterID,
                                          datacenterAbbrev: datacenterAbbrev,
                                          rack: rack,
                                          rackU: rackU,
                                          rackRow: rackRow,
                                          rackNum: rackNum,
                                          rackID: qs.docs[0].id
                                      }).then(() => resolve())
                                    })
                                    await new Promise(function(resolve, reject) {
                                      firebaseutils.bladeRef.doc(assets[i]).update({
                                          chassisId: id,
                                          rack: hostname,
                                          rackId: qs.docs[0].id
                                      }).then(() => resolve())
                                    })
                                }
                                callback(errorMessage)
                                return
                              })
                            })
                        })
                    } else {
                        callback(errorMessage)
                        return
                    }
                })
                .catch(function (error) {
                    console.log(error);
                    // maybe remove the asset and add error message?
                    callback(errorMessage || 'updating failed even though chassis got updated in assets')
                    return
                })
            })
        } else {
            callback(errorMessage)
        }
    }, changePlanID, changeDocID)
}

function deleteChassis(assetID, callback, isDecommission = false) {
    firebaseutils.db.collectionGroup('blades').where("id","==",assetID).get().then(qs => {
        if (!qs.empty && qs.docs[0].data().assets.length === 0) {
            assetutils.deleteAsset(assetID, deletedId => {
                if (deletedId) {
                    qs.docs[0].ref.delete().then(() => callback(deletedId))
                } else {
                    callback(null)
                }
            }, isDecommission)
        } else {
            callback(null)
        }
    })
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

function updateServer(assetID, model, hostname, chassisHostname, slot, owner, comment, datacenter, macAddresses,
    networkConnectionsArray, deletedNCThisPort, powerConnections, callback, changePlanID = null, changeDocID = null) {
    firebaseutils.assetRef.where('hostname','==',chassisHostname).get().then(qs => {
        if (!qs.empty) {
            const rack = qs.docs[0].data().rack
            const rackU = qs.docs[0].data().rackU
            const rackId = qs.docs[0].data().rackID
            const chassisId = qs.docs[0].id

            assetutils.updateAsset(assetID, model, hostname, rack, rackU, owner, comment, datacenter, macAddresses,
                networkConnectionsArray, deletedNCThisPort, powerConnections, (errorMessage,id) => {
                if (!errorMessage && id) {
                  firebaseutils.bladeRef.doc(id).get().then(docRef => {
                    firebaseutils.db.collectionGroup('blades').where("id","==",docRef.data().chassisId).get().then(async(qs) => {
                      // remove blade id from previous chassis
                      const qsAssets = qs.docs[0].data().assets
                      const ind = qsAssets.indexOf(id)
                      if (ind !== -1) {
                        await new Promise(function(resolve, reject) {
                          qs.docs[0].ref.update({
                              assets: qsAssets.slice(0, ind).concat(qsAssets.slice(ind + 1, qsAssets.length))
                          }).then(() => resolve())
                        })
                      }
                      await new Promise(function(resolve, reject) {
                        // add to the new chassis
                        firebaseutils.racksRef.doc(rackId).collection('blades').doc(chassisId).get().then(async(doc) => {
                            if (doc.exists) {
                                await new Promise(function(resolve, reject) {
                                  doc.ref.update({
                                      assets: doc.data().assets.concat(id)
                                  }).then(() => resolve())
                                })
                                await new Promise(function(resolve, reject) {
                                  firebaseutils.bladeRef.doc(id).update({
                                      rack: chassisHostname,
                                      rackU: slot,
                                      rackId: rackId,
                                      model: model,
                                      chassisId: chassisId
                                  }).then(() => resolve())
                                })
                            }
                            resolve()
                        })
                      })
                      callback(errorMessage)
                      return
                    })
                  }).catch(function (error) {
                      console.log(error);
                      // maybe remove the asset and add error message?
                      callback(errorMessage || 'updating failed even though server got updated in assets')
                      return
                  })
                } else {
                  callback(errorMessage)
                  return
                }
            }, changePlanID, changeDocID, {hostname: chassisHostname, slot: slot, id: chassisId})
        } else {
            callback('blade chassis ' + chassisHostname +' does not exist')
        }
    })
}

function deleteServer(assetID, callback, isDecommission = false) {
    assetutils.deleteAsset(assetID, deletedId => {
        if (deletedId) {
            // sequential delete to be safe
            firebaseutils.bladeRef.doc(deletedId).get().then(doc => {
                const chassisId = doc.data().chassisId
                doc.ref.delete().then(() => {
                    firebaseutils.db.collectionGroup('blades').where("id","==",chassisId).get().then(qs => {
                        if (!qs.empty) {
                            const qsAssets = qs.docs[0].data().assets
                            const ind = qsAssets.indexOf(deletedId)
                            if (ind !== -1) {
                                qs.docs[0].ref.update({
                                    assets: qsAssets.slice(0, ind).concat(qsAssets.slice(ind + 1, qsAssets.length))
                                }).then(() => callback(deletedId))
                            } else {
                                callback(null)
                            }
                        } else {
                            callback(null)
                        }
                    })
                })
            }).catch(function (error) {
                console.log(error);
                // maybe add the asset back and add error message?
                callback(null)
                return
            })
        } else {
            callback(null)
        }
    }, isDecommission)
}

function getBladeInfo(id,callback) {
    firebaseutils.bladeRef.doc(id).get().then(doc => {
        let data = null
        if (doc.exists) {
            data = doc.data()
        }
        callback(data)
    })
}

export { addChassis, addServer, updateChassis, updateServer, deleteChassis, deleteServer, getBladeInfo }
