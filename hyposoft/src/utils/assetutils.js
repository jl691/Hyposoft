import {
    db,
    assetRef,
    racksRef,
    modelsRef,
    usersRef,
    firebase,
    datacentersRef,
    changeplansRef,
    offlinestorageRef
} from './firebaseutils'
import * as rackutils from './rackutils'
import * as modelutils from './modelutils'
import * as userutils from './userutils'
import * as assetIDutils from './assetidutils'
import * as datacenterutils from './datacenterutils'
import * as assetnetworkportutils from './assetnetworkportutils'
import * as assetpowerportutils from './assetpowerportutils'
import * as logutils from './logutils'
import * as bladeutils from './bladeutils'
import * as changeplanutils from './changeplanutils'
import * as changeplanconflictutils from '../utils/changeplanconflictutils'
import * as offlinestorageutils from './offlinestorageutils'

const algoliasearch = require('algoliasearch')
const client = algoliasearch('V7ZYWMPYPA', '26434b9e666e0b36c5d3da7a530cbdf3')
const index = client.initIndex('assets')

function getAsset(callback, field = null, direction = null, selected = null, storageSite = null) {
    console.log(storageSite)
    let query = storageSite ? ((field && direction !== null) ? (direction ? offlinestorageRef.doc(storageSite).collection("offlineAssets").limit(25).orderBy(field) : offlinestorageRef.doc(storageSite).collection("offlineAssets").limit(25).orderBy(field, "desc")) : offlinestorageRef.doc(storageSite).collection("offlineAssets").limit(25)) : ((field && direction !== null) ? (direction ? assetRef.limit(25).orderBy(field) : assetRef.limit(25).orderBy(field, "desc")) : assetRef.limit(25));
    let assets = [];
    let count = 0;

    console.log(query)

    query.get().then(docSnaps => {
        if (docSnaps.empty) {
            callback(null, [], true);
        } else {
            console.log(docSnaps)
            const startAfter = docSnaps.docs[docSnaps.docs.length - 1];
            bladeutils.getBladeIds(idToVendor => {
              docSnaps.docs.forEach(doc => {
                  assets.push({
                      asset_id: doc.id,
                      ...doc.data(),
                      checked: selected && selected.includes(doc.id),
                      bladeInfo: idToVendor[doc.id] ? idToVendor[doc.id] : null,
                      //add here to get variance data
                      displayColor: doc.data().variances.displayColor,
                      cpu: doc.data().variances.cpu,
                      memory: doc.data().variances.memory,
                      storage: doc.data().variances.storage
                  });
                  count++;
                  if (count === docSnaps.docs.length) {
                      callback(startAfter, assets, false);
                  }

              })
            })
        }
    }).catch(function (error) {
        console.log(error);
        callback(null, null, null)
    })
}


function getAssetAt(start, callback, field = null, direction = null, selected = null, selectAll = null, storageSite = null) {

    let query;
    let ref = storageSite ? offlinestorageRef.doc(storageSite).collection("offlineAssets") : assetRef
    if (field && direction !== null) {
        query = direction ? ref.limit(25).orderBy(field).startAfter(start) : ref.limit(25).orderBy(field, "desc").startAfter(start);
    } else {
        query = ref.limit(25).startAfter(start);
    }

    let assets = [];
    let count = 0;
    query.get().then(docSnaps => {
        const newStart = docSnaps.docs[docSnaps.docs.length - 1];
        bladeutils.getBladeIds(idToVendor => {
          docSnaps.docs.forEach(doc => {
              assets.push({
                  asset_id: doc.id,
                  ...doc.data(),
                  checked: selectAll || (selected && selected.includes(doc.id)),
                  bladeInfo: idToVendor[doc.id] ? idToVendor[doc.id] : null,
                  displayColor: doc.data().variances.displayColor,
                  cpu: doc.data().variances.cpu,
                  memory: doc.data().variances.memory,
                  storage: doc.data().variances.storage
              });
              count++;
              if (count === docSnaps.docs.length) {
                  callback(newStart, assets);
              }
          })
        })

    }).catch(function (error) {
        callback(null, null);
    })
}

function getAllAssetIDs(callback, field = null, direction = null, storageSite = null) {
    let query
    let ref = storageSite ? offlinestorageRef.doc(storageSite).collection("offlineAssets") : assetRef
    if (field && direction !== null) {
        query = direction ? ref.orderBy(field) : ref.orderBy(field, "desc")
    } else {
        query = ref
    }
    let assetIDs = []
    let count = 0

    query.get().then(docSnaps => {
        if (docSnaps.empty) {
            callback([])
        } else {
            docSnaps.docs.forEach(doc => {
                assetIDs.push(doc.id)
                count++;
                if (count === docSnaps.docs.length) {
                    callback(assetIDs)
                }
            })
        }
    }).catch(function (error) {
        console.log(error);
        callback([])
    })
}

function validateAssetVariances(displayColor, cpu, memory, storage, callback) {

    if (memory.trim() !== '' &&
        (isNaN(memory.trim()) || !Number.isInteger(parseFloat(memory.trim())) || parseInt(memory.trim()) < 0 || parseInt(memory.trim()) > 1000)) {

        callback('Memory should be a non-negative integer less than 1000')
    }
    // else if (memory.trim() !== '') {
    //     memory = parseInt(memory)
    // }
    else {
        if (storage.trim() !== '' && storage.trim().length > 50) {
            callback('Storage should be less than 50 characters long')

        } else {

            if (cpu.trim() !== '' && cpu.trim().length > 50) {
                callback("CPU should be less than 50 characters long")
            } else {
                callback(null)
            }
        }
    }
}

function addAsset(overrideAssetID, model, hostname, rack, racku, owner, comment, datacenter, macAddresses, networkConnectionsArray, powerConnections, displayColor, memory, storage, cpu, callback, changePlanID = null, changeDocID = null, chassis = null, noLog = false) {
console.log(rack, racku)
    let splitRackArray = rack.split(/(\d+)/).filter(Boolean)
    let rackRow = splitRackArray[0]
    let rackNum = parseInt(splitRackArray[1])

    validateAssetForm(null, model, hostname, rack, racku, owner, datacenter).then(
        _ => {
            validateAssetVariances(displayColor, cpu, memory, storage, errorMsg => {
                if (errorMsg) {
                    callback(errorMsg)
                } else {
                    //everything else....goes in here
                    //     }

                    // })
                    datacenterutils.getDataFromName(datacenter, (datacenterID, datacenterAbbrev) => {
                        modelutils.getModelByModelname(model, doc => {
                            if (!doc) {
                                var errMessage = "Model does not exist"
                                callback(errMessage)
                            } else {

                                if (userutils.isLoggedInUserAdmin() || userutils.doesLoggedInUserHaveAssetPerm(datacenterAbbrev) || userutils.doesLoggedInUserHaveAssetPerm(null)) {
                                    assetFitsOnRack(rack, racku, model, datacenter, (errorMessage, modelNum, modelVendor, rackID) => {
                                        console.log(errorMessage)
                                        console.log(modelNum)
                                        console.log(modelVendor)
                                        console.log(rackID)
                                        if (errorMessage) {
                                            callback(errorMessage)
                                        }
                                        //Go one level deeper of validation
                                        else {
                                            //if field assetID has been left empty, then call generate
                                            //otherwise, use override method and throw correct errors

                                            //TODO: refactor this. Seems inefficient/error prone to have the .set duplicated
                                            // let assetID = overrideAssetID.trim()==="" ? generateAssetID() : overrideAssetID()

                                            assetnetworkportutils.validateNetworkConnections(model, networkConnectionsArray, ncStatus => {
                                                console.log(ncStatus)
                                                assetnetworkportutils.networkConnectionsToMap(networkConnectionsArray, result => {
                                                    let networkConnections = result;
                                                    console.log(networkConnections);
                                                    //let powerConnections = assetpowerportutils.formatPowerConnections(powerConnectionsInput)

                                                    console.log(powerConnections)

                                                    if (ncStatus) {
                                                        callback(ncStatus)
                                                    } else {
                                                        console.log("big booty bitch")

                                                        assetpowerportutils.validatePowerConnections(datacenter, rack, racku, powerConnections, model, ppStatus => {
                                                            console.log("big booty bitch back")

                                                            if (ppStatus) {
                                                                console.log("breakpoint")
                                                                callback(ppStatus)
                                                            } else {
                                                                console.log("HERE and power connections validated")
                                                                if (overrideAssetID.trim() != "") {

                                                                    assetIDutils.overrideAssetID(overrideAssetID).then(
                                                                        _ => {
                                                                            let assetObject = {
                                                                                assetId: overrideAssetID,
                                                                                modelId: doc.id,
                                                                                model: model,
                                                                                hostname: hostname,
                                                                                rack: rack,
                                                                                rackU: racku,
                                                                                owner: owner,
                                                                                comment: comment,
                                                                                rackID: rackID,
                                                                                macAddresses,
                                                                                networkConnections,
                                                                                powerConnections,

                                                                                //This is for rack usage reports
                                                                                modelNumber: modelNum,
                                                                                vendor: modelVendor,
                                                                                //This is for sorting
                                                                                rackRow: rackRow,
                                                                                rackNum: rackNum,
                                                                                datacenter: datacenter,
                                                                                datacenterID: datacenterID,
                                                                                datacenterAbbrev: datacenterAbbrev,

                                                                                //this is for asset variances
                                                                                variances: {
                                                                                    displayColor: displayColor,
                                                                                    memory: memory,
                                                                                    cpu: cpu,
                                                                                    storage: storage
                                                                                }


                                                                            }

                                                                            if (!changePlanID) {
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

                                                                                index.saveObject({
                                                                                    ...assetObject,
                                                                                    objectID: overrideAssetID,
                                                                                    suffixes: suffixes_list.join(' ')
                                                                                })
                                                                                assetRef.doc(overrideAssetID).set(assetObject).then(function (docRef) {
                                                                                    assetnetworkportutils.symmetricNetworkConnectionsAdd(networkConnectionsArray, overrideAssetID);

                                                                                    if (powerConnections.length != 0) {
                                                                                        racksRef.doc(String(rackID)).get().then(doc => {
                                                                                            racksRef.doc(String(rackID)).update({
                                                                                                assets: chassis ? doc.data().assets : firebase.firestore.FieldValue.arrayUnion(overrideAssetID),
                                                                                                powerPorts: chassis ? doc.data().powerPorts : firebase.firestore.FieldValue.arrayUnion(...powerConnections.map(obj => ({
                                                                                                    ...obj,
                                                                                                    assetID: overrideAssetID
                                                                                                })))
                                                                                            }).then(function () {

                                                                                                console.log("Document successfully updated in racks");
                                                                                                if (!noLog) {
                                                                                                  logutils.addLog(overrideAssetID, logutils.ASSET(), logutils.CREATE())
                                                                                                }
                                                                                                callback(null, overrideAssetID);
                                                                                            })
                                                                                        })


                                                                                    } else {
                                                                                        racksRef.doc(String(rackID)).get().then(doc => {
                                                                                            racksRef.doc(String(rackID)).update({
                                                                                                assets: chassis ? doc.data().assets : firebase.firestore.FieldValue.arrayUnion(overrideAssetID)
                                                                                            }).then(function () {

                                                                                                console.log("Document successfully updated in racks");
                                                                                                if (!noLog) {
                                                                                                  logutils.addLog(overrideAssetID, logutils.ASSET(), logutils.CREATE())
                                                                                                }
                                                                                                callback(null, overrideAssetID);
                                                                                            })
                                                                                        })


                                                                                    }
                                                                                }).catch(function (error) {
                                                                                    // callback("Error");
                                                                                    console.log(error)
                                                                                })
                                                                            } else {
                                                                                assetObject.networkConnections = networkConnectionsArray;
                                                                                if(chassis){
                                                                                    assetObject = {
                                                                                        ...assetObject,
                                                                                        chassisHostname: chassis.hostname,
                                                                                        chassisSlot: chassis.slot
                                                                                    };
                                                                                }
                                                                                changeplanutils.addAssetChange(assetObject, overrideAssetID, changePlanID, (result) => {
                                                                                    if (result) {
                                                                                        callback(null)
                                                                                    } else {
                                                                                        callback("Error adding asset to the specified change plan.")
                                                                                    }
                                                                                }, changeDocID)
                                                                            }

                                                                        }).catch(errMessage => {
                                                                            callback(errMessage)
                                                                        })

                                                                } else {

                                                                    assetIDutils.generateAssetID().then(newID => {
                                                                        console.log("generated the new asset id", newID)
                                                                        let assetObject = {
                                                                            assetId: newID,
                                                                            modelId: doc.id,
                                                                            model: model,
                                                                            hostname: hostname,
                                                                            rack: rack,
                                                                            rackU: racku,
                                                                            owner: owner,
                                                                            comment: comment,
                                                                            rackID: rackID,
                                                                            macAddresses,
                                                                            networkConnections,
                                                                            powerConnections,

                                                                            // This is for rack usage reports
                                                                            modelNumber: modelNum,
                                                                            vendor: modelVendor,
                                                                            //This is for sorting
                                                                            rackRow: rackRow,
                                                                            rackNum: rackNum,
                                                                            datacenter: datacenter,
                                                                            datacenterID: datacenterID,
                                                                            datacenterAbbrev: datacenterAbbrev,

                                                                            //this is for assetvariances
                                                                            variances: {
                                                                                displayColor: displayColor,
                                                                                memory: memory,
                                                                                cpu: cpu,
                                                                                storage: storage
                                                                            }
                                                                        }

                                                                        if (!changePlanID) {
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

                                                                            index.saveObject({
                                                                                ...assetObject,
                                                                                objectID: newID,
                                                                                suffixes: suffixes_list.join(' ')
                                                                            })

                                                                            assetRef.doc(newID)
                                                                                .set(assetObject).then(function (docRef) {
                                                                                    console.log("set the itme")

                                                                                    assetnetworkportutils.symmetricNetworkConnectionsAdd(networkConnectionsArray, newID);

                                                                                    if (powerConnections.length != 0) {
                                                                                        racksRef.doc(String(rackID)).get().then(doc => {
                                                                                            racksRef.doc(String(rackID)).update({
                                                                                                assets: chassis ? doc.data().assets : firebase.firestore.FieldValue.arrayUnion(newID),
                                                                                                powerPorts: chassis ? doc.data().powerPorts : firebase.firestore.FieldValue.arrayUnion(...powerConnections.map(obj => ({
                                                                                                    ...obj,
                                                                                                    assetID: newID
                                                                                                })))
                                                                                            }).then(function () {

                                                                                                console.log("Document successfully updated in racks");
                                                                                                if (!noLog) {
                                                                                                  logutils.addLog(newID, logutils.ASSET(), logutils.CREATE())
                                                                                                }
                                                                                                callback(null, newID);
                                                                                            })
                                                                                        })


                                                                                    } else {
                                                                                        racksRef.doc(String(rackID)).get().then(doc => {
                                                                                            racksRef.doc(String(rackID)).update({
                                                                                                assets: chassis ? doc.data().assets : firebase.firestore.FieldValue.arrayUnion(newID)
                                                                                            }).then(function () {

                                                                                                console.log("Document successfully updated in racks");
                                                                                                if (!noLog) {
                                                                                                  logutils.addLog(newID, logutils.ASSET(), logutils.CREATE())
                                                                                                }
                                                                                                callback(null, newID);
                                                                                            })
                                                                                        })


                                                                                    }

                                                                                }).catch(function (error) {
                                                                                    // callback("Error");
                                                                                    console.log(error)
                                                                                })
                                                                        } else {
                                                                            delete assetObject["assetId"];
                                                                            //duplicate this!!
                                                                            assetObject.networkConnections = networkConnectionsArray;
                                                                            if(chassis){
                                                                                assetObject = {
                                                                                    ...assetObject,
                                                                                    chassisHostname: chassis.hostname,
                                                                                    chassisSlot: chassis.slot
                                                                                };
                                                                            }
                                                                            changeplanutils.addAssetChange(assetObject, "", changePlanID, (result) => {
                                                                                if (result) {
                                                                                    callback(null)

                                                                                } else {
                                                                                    callback("Error adding asset to the specified change plan.")
                                                                                }
                                                                            }, changeDocID)
                                                                        }
                                                                    }).catch("Ran out of tries to generate unique ID")

                                                                }


                                                            }


                                                        })


                                                    }
                                                })


                                            }, null, null, chassis)

                                        }
                                    }, null, null, chassis)
                                } else {
                                    callback("You do not have permissions for this datacenter");
                                }

                                //checkInstanceFits in rackutils will check against self if instance id is passed in

                            }

                        })
                    })

                }

            })
        }).catch(errMessage => {
            callback(errMessage)
            console.log(errMessage)

        })
}

// rackAsc should be a boolean corresponding to true if rack is ascending
// rackUAsc should be a boolean corresponding to true if rackU is ascending
function sortAssetsByRackAndRackU(rackAsc, rackUAsc, callback, selected = null, offlineStorage = null) {
    var vendorArray = []
    var query;
    let ref = offlineStorage ? offlinestorageRef.doc(offlineStorage).collection("offlineAssets") : assetRef;
    if (!rackAsc && !rackUAsc) {
        query = ref.orderBy("rackRow", "desc").orderBy("rackNum", "desc").orderBy("rackU", "desc")
    } else if (rackAsc && !rackUAsc) {
        query = ref.orderBy("rackRow").orderBy("rackNum").orderBy("rackU", "desc")
    } else if (!rackAsc && rackUAsc) {
        query = ref.orderBy("rackRow", "desc").orderBy("rackNum", "desc").orderBy("rackU")
    } else {
        query = ref.orderBy("rackRow").orderBy("rackNum").orderBy("rackU")
    }
    query.get().then(querySnapshot => {
        let count = 0;
        bladeutils.getBladeIds(idToVendor => {
          querySnapshot.forEach(doc => {
              datacenterutils.getAbbreviationFromID(doc.data().datacenterID, datacenterAbbrev => {
                  if (datacenterAbbrev) {
                      vendorArray.push({
                          asset_id: doc.id,
                          ...doc.data(),
                          checked: selected && selected.includes(doc.id),
                          bladeInfo: idToVendor[doc.id] ? idToVendor[doc.id] : null,
                          displayColor: doc.data().variances.displayColor,
                          cpu: doc.data().variances.cpu,
                          memory: doc.data().variances.memory,
                          storage: doc.data().variances.storage
                      });
                      count++;
                      if (count === querySnapshot.size) {
                          callback(vendorArray);
                      }
                  } else {
                      callback(null);
                  }
              })
          })
        })
    }).catch(error => {
        console.log("Error getting documents: ", error)
        callback(null)
    })
}

/*// rackAsc should be a boolean corresponding to true if rack is ascending
// rackUAsc should be a boolean corresponding to true if rackU is ascending
function sortAssetsByRackAndRackUFilter(rackAsc, rackUAsc, datacenter, rowStart, rowEnd, numberStart, numberEnd, callback) {
    var vendorArray = []
    var query = assetRef
    if (!rackAsc && !rackUAsc) {
        query = assetRef.orderBy("rackRow", "desc").orderBy("rackNum", "desc").orderBy("rackU", "desc")
    } else if (rackAsc && !rackUAsc) {
        query = assetRef.orderBy("rackRow").orderBy("rackNum").orderBy("rackU", "desc")
    } else if (!rackAsc && rackUAsc) {
        query = assetRef.orderBy("rackRow", "desc").orderBy("rackNum", "desc").orderBy("rackU")
    } else {
        query = assetRef.orderBy("rackRow").orderBy("rackNum").orderBy("rackU")
    }
    query.get().then(querySnapshot => {
        let count = 0;
        querySnapshot.forEach(doc => {
            datacenterutils.getAbbreviationFromID(doc.data().datacenterID, datacenterAbbrev => {
                if (datacenterAbbrev) {
                    vendorArray.push({
                        asset_id: doc.id,
                        model: doc.data().model,
                        hostname: doc.data().hostname,
                        rack: doc.data().rack,
                        rackU: doc.data().rackU,
                        owner: doc.data().owner,
                        datacenterAbbreviation: datacenterAbbrev
                    });
                    count++;
                    if (count === querySnapshot.size) {
                        callback(vendorArray);
                    }
                } else {
                    callback(null);
                }
            })
        })
    }).catch(error => {
        console.log("Error getting documents: ", error)
        callback(null)
    })
}*/


// This will check if the instance fits on rack (after checking rack exists): fits within in the height of rack, and does not conflict with other instances
// The echo param was added by Anshu and will be passed back via callback to the import functions as-is
// The param does NOT affect this function at all
function assetFitsOnRack(assetRack, rackU, model, datacenter, callback, asset_id = null, offlineStorage = null, chassis = null, echo = -1) {
    if (offlineStorage) {
        callback(null);
    } else {
        let splitRackArray = assetRack.split(/(\d+)/).filter(Boolean)
        let rackRow = splitRackArray[0]
        let rackNum = parseInt(splitRackArray[1])

        rackutils.getRackID(rackRow, rackNum, datacenter, rackID => {

            datacenterutils.getDataFromName(datacenter, datacenterID => {
                if (datacenterID) {
                    let ref = chassis ? racksRef.doc(rackID).collection('blades') : racksRef
                    ref.where("letter", "==", chassis ? chassis.hostname : rackRow).where("number", "==", chassis ? 1 : rackNum).where("datacenter", "==", datacenterID).get().then(function (querySnapshot) {
                        if (!querySnapshot.empty && querySnapshot.docs[0].data().letter && querySnapshot.docs[0].data().number) {
                            let rackHeight = querySnapshot.docs[0].data().height

                            console.log(model)
                            modelutils.getModelByModelname(model, doc => {
                                //doc.data().height refers to model height
                                if (rackHeight + 1 >= parseInt(chassis ? chassis.slot : rackU) + doc.data().height) {
                                    //We know the instance will fit on the rack, but now does it conflict with anything?

                                    rackutils.checkAssetFits(chassis ? chassis.slot : rackU, doc.data().height, rackID, function (status) {

                                        //can check length. If length > 0, then conflicting instances were returned
                                        //means that there are conflicts.

                                        if (status && status.length) {
                                            let height = doc.data().height
                                            let rackedAt = chassis ? chassis.slot : rackU
                                            let conflictNew = [];
                                            let conflictCount = 0;
                                            status.forEach(assetID => {
                                                getAssetDetails(assetID, result => {
                                                    conflictNew.push(result.model + " " + result.hostname + ", ");
                                                    conflictCount++;
                                                    if (conflictCount === status.length) {
                                                        console.log(conflictNew)
                                                        var errMessage = "Asset of height " + height + (chassis ? " slotted at " : " racked at ") + rackedAt + (chassis ? "" : "U") + " conflicts with asset(s) " + conflictNew.join(', ').toString();
                                                        if (echo < 0) {
                                                            callback(errMessage);
                                                        } else {
                                                            callback({ error: errMessage, echo: echo })
                                                        }
                                                    }
                                                });
                                            })
                                        } else {//status callback is null, no conflits
                                            if (echo < 0) {
                                                callback(null, doc.data().modelNumber, doc.data().vendor, rackID)
                                            } else {
                                                callback({ error: null, echo: echo })
                                            }

                                        }
                                    }, asset_id, chassis) //if you pass in a null to checkInstanceFits
                                } else {
                                    var errMessage = "Asset of this model at this "+(chassis ? "Slot" : "RackU")+" will not fit on this "+(chassis ? "chassis" : "rack");
                                    if (echo < 0) {
                                        callback(errMessage);
                                    } else {
                                        callback({ error: errMessage, echo: echo })
                                    }

                                }
                            })
                        } else {
                            var errMessage2 = (chassis ? "Chassis" : "Rack") + " does not exist"
                            if (echo < 0) {
                                callback(errMessage2)
                            } else {
                                callback({ error: errMessage2, echo: echo })
                            }
                        }
                    })
                } else {
                    var errMessage = "Datacenter does not exist.";
                    if (echo < 0) {
                        callback(errMessage);
                    } else {
                        callback({ error: errMessage, echo: echo })
                    }
                }
            })
        })
    }

}

function deleteAsset(assetID, callback, isDecommission = false, offlineStorage = null) {

    let query = offlineStorage ? db.collectionGroup("offlineAssets").where("assetId", "==", String(assetID)) : assetRef.doc(assetID);

    query.get().then(function (snap) {
        console.log("checkpoint 1", snap, assetID)
        let doc = offlineStorage ? snap.docs[0] : snap;

        //This is so I can go into racks collection and delete instances associated with the rack
        if (doc.exists) {
            let rackID, rackRow, rackNum, datacenter;
            if (!offlineStorage) {
                let assetRack = doc.data().rack
                let splitRackArray = assetRack.split(/(\d+)/).filter(Boolean)
                rackRow = splitRackArray[0]
                rackNum = parseInt(splitRackArray[1])
                datacenter = doc.data().datacenter;
            }

            rackutils.getRackID(rackRow, rackNum, datacenter, id => {
                if (id) {
                    console.log("checkpoint 2")
                    rackID = id
                    console.log(rackID)

                    let docData = doc.data()

                    let deleteAssetConnections = docData.powerConnections
                    console.log(deleteAssetConnections)

                    if (deleteAssetConnections.length != 0 && !offlineStorage) {//
                        console.log("THere are asset connections to delete")
                        //need to get the datacenter, rack that the asset it on
                        racksRef.doc(String(rackID)).update({
                            //Can you do this??
                            powerPorts: firebase.firestore.FieldValue.arrayRemove(...deleteAssetConnections)
                        }).then(function () {
                            //THIS RETURNS A NULL
                            //so if there are network connections, won't ever delete the asset
                            assetnetworkportutils.symmetricNetworkConnectionsDelete(assetID, result => {
                                console.log(result)
                                if (result) {
                                    assetRef.doc(assetID).delete().then(function () {
                                        racksRef.doc(String(rackID)).update({
                                            assets: firebase.firestore.FieldValue.arrayRemove(assetID)
                                        }).then(function () {
                                            console.log("Document successfully deleted!");
                                            if (!isDecommission) {
                                                logutils.addLog(assetID, logutils.ASSET(), logutils.DELETE(), docData)
                                            }
                                            index.deleteObject(assetID)
                                            callback(assetID);
                                        })
                                    }).catch(function (error) {
                                        console.log(error)
                                        callback(null);
                                    })
                                } else {
                                    callback(null);
                                }
                            })
                        })
                    } else {
                        //MY b, duplicated code again
                        //There were no powerConnections made in the asset in the first place
                        assetnetworkportutils.symmetricNetworkConnectionsDelete(assetID, result => {
                            if (result) {
                                console.log("checkpoint 3")
                                if (offlineStorage) {
                                    console.log("here1")
                                    offlinestorageutils.getInfoFromAbbrev(offlineStorage, (offlineName, offlineID) => {
                                        if (offlineName) {
                                            offlinestorageRef.doc(offlineID).collection("offlineAssets").doc(assetID).delete().then(function () {
                                                console.log("Document successfully deleted!");
                                                if (!isDecommission) {
                                                    logutils.addLog(assetID, logutils.OFFLINE(), logutils.DELETE(), docData)
                                                }
                                                index.deleteObject(assetID)
                                                callback(assetID);
                                            })
                                        } else {
                                            callback(null);
                                        }
                                    })
                                } else {
                                    console.log("here2")
                                    assetRef.doc(assetID).delete().then(function () {
                                        racksRef.doc(String(rackID)).update({
                                            assets: firebase.firestore.FieldValue.arrayRemove(assetID)
                                        }).then(function () {
                                            console.log("Document successfully deleted!");
                                            if (!isDecommission) {
                                                logutils.addLog(assetID, logutils.ASSET(), logutils.DELETE(), docData)
                                            }
                                            index.deleteObject(assetID)
                                            callback(assetID);
                                        })
                                    }).catch(function (error) {
                                        console.log(error)
                                        callback(null);
                                    })
                                }
                            } else {
                                callback(null);
                            }
                        }, offlineStorage);
                    }
                } else {
                    console.log("no rack for this letter and number")
                    callback(null)
                }
            }, offlineStorage)
        } else {
            console.log("doc doesnt exist")
            callback(null);
        }
    })
}

//TODO: double check this still works:
//hostname updating works, owner updating works, conflicts, etc.

function updateAsset(assetID, model, hostname, rack, rackU, owner, comment, datacenter, macAddresses,
    networkConnectionsArray, deletedNCThisPort, powerConnections, displayColor, memory, storage, cpu, callback, changePlanID = null, changeDocID = null, chassis = null, offlineStorageAbbrev = null) {
    console.log(rack, rackU)
    validateAssetForm(assetID, model, hostname, rack, rackU, owner, datacenter, offlineStorageAbbrev).then(
        _ => {
            console.log("checkpoint", datacenter)
            validateAssetVariances(displayColor, cpu, memory, storage, errorMsg => {
                if (errorMsg) {
                    callback(errorMsg)
                } else {
                    datacenterutils.getDataFromName(datacenter, (datacenterID, datacenterAbbrev) => {
                        if (datacenterID) {
                            console.log("checkpoint2")
                            modelutils.getModelByModelname(model, doc => {
                                if (!doc) {
                                    var errMessage = "Model does not exist"
                                    callback(errMessage)
                                } else {
                                    console.log("checkpoint3", doc)
                                    if (userutils.isLoggedInUserAdmin() || (!offlineStorageAbbrev && userutils.doesLoggedInUserHaveAssetPerm(datacenterAbbrev)) || userutils.doesLoggedInUserHaveAssetPerm(null)) {
                                        assetFitsOnRack(rack, rackU, model, datacenter, stat => {
                                            //returned an error message
                                            if (stat) {

                                                var errMessage = stat
                                                //need to pass up errormessage if model updated and instance no longer fits
                                                callback(errMessage)
                                            }
                                            //returns null if no issues/conflicts.
                                            else {
                                                console.log("No conflictss updates")
                                                let splitRackArray = offlineStorageAbbrev ? null : rack.split(/(\d+)/).filter(Boolean)
                                                let rackRow = offlineStorageAbbrev ? null : splitRackArray[0]
                                                let rackNum = offlineStorageAbbrev ? null : parseInt(splitRackArray[1])
                                                //get new rack document
                                                rackutils.getRackID(rackRow, rackNum, datacenter, result => {
                                                    if (result) {
                                                        console.log("checkpoint4")
                                                        //get old rack document
                                                        let query = offlineStorageAbbrev ? db.collectionGroup("offlineAssets").where("assetId", "==", assetID) : assetRef.doc(assetID);

                                                        query.get().then(snapShot => {
                                                            console.log("checkpoint5")
                                                            let docSnap = offlineStorageAbbrev ? snapShot.docs[0] : snapShot;
                                                            console.log(assetID, docSnap)
                                                            let oldRack = offlineStorageAbbrev ? null : docSnap.data().rack;
                                                            let oldSplitRackArray = offlineStorageAbbrev ? null : oldRack.split(/(\d+)/).filter(Boolean)
                                                            let oldRackRow = offlineStorageAbbrev ? null : oldSplitRackArray[0]
                                                            let oldRackNum = offlineStorageAbbrev ? null : parseInt(oldSplitRackArray[1])
                                                            let oldDatacenter = offlineStorageAbbrev ? null : docSnap.data().datacenter
                                                            let oldPowerConnections = docSnap.data().powerConnections;
                                                            let oldNetworkConnections = docSnap.data().networkConnections;
                                                            var modelStuff = []
                                                            modelutils.getVendorAndNumberFromModel(model, name => modelStuff = name)
                                                            var rackId = ''
                                                            console.log("checkpoint6")
                                                            if (!offlineStorageAbbrev) {
                                                                rackutils.getRackID(rack.slice(0, 1), rack.slice(1, rack.length), datacenter, name => rackId = name)
                                                            }
                                                            var modelId = ''
                                                            modelutils.getModelIdFromModelName(model, name => modelId = name)
                                                            rackutils.getRackID(oldRackRow, oldRackNum, oldDatacenter, oldResult => {
                                                                console.log("checkpoint7")
                                                                console.log(oldRackRow, oldRackNum, oldDatacenter, oldResult)
                                                                if (oldResult) {
                                                                    console.log("up in this bitch")
                                                                    console.log("checkpoint8")
                                                                    //get new rack document
                                                                    //get instance id
                                                                    console.log(powerConnections);
                                                                    replaceAssetRack(oldResult, result, oldPowerConnections, powerConnections, assetID, changePlanID, result => {
                                                                        logutils.getObjectData(String(assetID), offlineStorageAbbrev ? logutils.OFFLINE() : logutils.ASSET(), assetData => {
                                                                            console.log("checkpoint9")

                                                                            //console.log(assetnetworkportutils.networkConnectionsToArray(networkConnections))
                                                                            //the reason why we have networkConnections to array is because validateNetworkConnections expects an array. networkConnections is a JSON object because we got in from the db, and to send connectiosn to the db, it must be transformed into a JSON obj first

                                                                            assetnetworkportutils.validateNetworkConnections(model, networkConnectionsArray, ncStatus => {
                                                                                assetnetworkportutils.networkConnectionsToMap(networkConnectionsArray, mapResult => {
                                                                                    console.log("checkpoint10")
                                                                                    let networkConnections = mapResult;

                                                                                    //console.log("In updateAsset: " + powerConnectionsInput)
                                                                                    // let powerConnections = assetpowerportutils.formatPowerConnections(powerConnectionsInput)
                                                                                    console.log(ncStatus)

                                                                                    if (ncStatus) {
                                                                                        console.log("Couldn't hang")
                                                                                        callback(ncStatus)
                                                                                    } else {
                                                                                        console.log("checkpoint11")

                                                                                        console.log(powerConnections)
                                                                                        assetpowerportutils.validatePowerConnections(datacenter, rack, rackU, powerConnections, model, ppStatus => {
                                                                                            console.log("checkpoint12")
                                                                                            console.log(ppStatus)
                                                                                            if (ppStatus) {
                                                                                                console.log("breakpoint")
                                                                                                callback(ppStatus)
                                                                                            } else {
                                                                                                let assetObject = {
                                                                                                    assetId: assetID,
                                                                                                    model: model,
                                                                                                    modelId: modelId,
                                                                                                    vendor: modelStuff[0],
                                                                                                    modelNumber: modelStuff[1],
                                                                                                    hostname: hostname,
                                                                                                    owner: owner,
                                                                                                    comment: comment,
                                                                                                    rackRow: rackRow,
                                                                                                    rackNum: rackNum,
                                                                                                    macAddresses,
                                                                                                    networkConnections,
                                                                                                    powerConnections,
                                                                                                    variances: {
                                                                                                        displayColor: displayColor,
                                                                                                        memory: memory,
                                                                                                        cpu: cpu,
                                                                                                        storage: storage
                                                                                                    }
                                                                                                    //these are the fields in the document to update
                                                                                                };
                                                                                                if (!offlineStorageAbbrev) {
                                                                                                    assetObject = {
                                                                                                        ...assetObject,
                                                                                                        rack: rack,
                                                                                                        rackU: rackU,
                                                                                                        rackID: rackId,
                                                                                                        datacenter: datacenter,
                                                                                                        datacenterID: datacenterID,
                                                                                                        datacenterAbbrev: datacenterAbbrev
                                                                                                    }
                                                                                                }

                                                                                                if (!changePlanID) {
                                                                                                    console.log("checkpoint13")
                                                                                                    assetnetworkportutils.symmetricNetworkConnectionsDelete(assetID, deleteResult => {
                                                                                                        if (deleteResult) {
                                                                                                            assetnetworkportutils.symmetricNetworkConnectionsAdd(networkConnectionsArray, assetID);
                                                                                                            console.log("checkpoint14")
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

                                                                                                            if (!offlineStorageAbbrev) {
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
                                                                                                            }
                                                                                                            let _owner = assetObject.owner


                                                                                                            index.saveObject({
                                                                                                                ...assetObject,
                                                                                                                objectID: assetID,
                                                                                                                suffixes: suffixes_list.join(' ')
                                                                                                            })
                                                                                                            if (offlineStorageAbbrev) {
                                                                                                                console.log("checkpoint15")
                                                                                                                offlinestorageutils.getInfoFromAbbrev(offlineStorageAbbrev, (offlineName, offlineID) => {
                                                                                                                    console.log(offlineName, offlineID)
                                                                                                                    if (offlineName) {
                                                                                                                        console.log(offlineID)
                                                                                                                        offlinestorageRef.doc(offlineID).collection("offlineAssets").doc(String(assetID)).update(assetObject).then(function () {
                                                                                                                            console.log("checkpoint16")
                                                                                                                            console.log("Updated model successfully")
                                                                                                                            // log needs to be added before calling back for DetailedAssetScreen
                                                                                                                            logutils.addLog(String(assetID), logutils.OFFLINE(), logutils.MODIFY(), assetData, () => callback(null, String(assetID),modelStuff[0]))
                                                                                                                        }).catch(function (error) {
                                                                                                                            callback(error);
                                                                                                                        })
                                                                                                                    } else {
                                                                                                                        callback("Error getting offline storage site info.")
                                                                                                                    }
                                                                                                                })
                                                                                                            } else {
                                                                                                                assetRef.doc(String(assetID)).update(assetObject).then(function () {
                                                                                                                    console.log("Updated model successfully")
                                                                                                                    // log needs to be added before calling back for DetailedAssetScreen
                                                                                                                    logutils.addLog(String(assetID), logutils.ASSET(), logutils.MODIFY(), assetData, () => callback(null, String(assetID),modelStuff[0]))
                                                                                                                }).catch(function (error) {
                                                                                                                    callback(error);
                                                                                                                })
                                                                                                            }
                                                                                                        } else {
                                                                                                            callback("Couldn't delete existing network connections.");
                                                                                                        }
                                                                                                    }, offlineStorageAbbrev)
                                                                                                } else {
                                                                                                    console.log(changeDocID);
                                                                                                    assetObject.networkConnections = networkConnectionsArray;
                                                                                                    changeplanutils.editAssetChange(assetObject, assetID, changePlanID, (result) => {
                                                                                                        if (result) {
                                                                                                            callback(null)
                                                                                                        } else {
                                                                                                            callback("Error adding asset to the specified change plan.")
                                                                                                        }
                                                                                                        //assetnetworkportutils.symmetricNetworkConnectionsAdd(networkConnectionsArray, assetID);
                                                                                                    }, changeDocID, offlineStorageAbbrev);
                                                                                                }
                                                                                            }
                                                                                        }, assetID, offlineStorageAbbrev)
                                                                                    }


                                                                                }, offlineStorageAbbrev)
                                                                            }, oldNetworkConnections, offlineStorageAbbrev, chassis, assetID)
                                                                        })
                                                                    }, offlineStorageAbbrev, chassis)
                                                                }
                                                            }, offlineStorageAbbrev)
                                                        })
                                                    }
                                                }, offlineStorageAbbrev)
                                            }
                                        }, assetID, offlineStorageAbbrev, chassis)
                                    } else {
                                        callback("You don't have the permissions for this datacenter");
                                    }
                                }
                            })

                        }
                    }, offlineStorageAbbrev)
                }
            })
        }).catch(errMessage => {
            console.log(errMessage)
            callback(errMessage)


        })

}


function getAssetFromModel(model, callback) {
    assetRef.where('model', '==', model).get().then(docSnaps => {
        const assets = docSnaps.docs.map(doc => (
            { id: doc.id, ...doc.data() }
        ))
        callback(assets)
    })
        .catch(error => {
            callback(null)
        })
}

function sortByKeyword(keyword, callback) {
    // maybe add limit by later similar to modelutils.getModels()
    assetRef.orderBy(keyword.toLowerCase()).get().then(
        docSnaps => {
            const assets = docSnaps.docs.map(doc => (
                { id: doc.id }
            ))
            callback(assets)
        })
        .catch(error => {
            callback(null)
        })
}

function getSuggestedModels(userInput, callback) {
    // https://stackoverflow.com/questions/46573804/firestore-query-documents-startswith-a-string/46574143
    var modelArray = []
    modelsRef.orderBy('modelName').get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            const data = doc.data().modelName
            if (shouldAddToSuggestedItems(modelArray, data, userInput)) {
                modelArray.push(data)
            }
        })
        callback(modelArray)
    })
        .catch(error => {
            callback(null)
        })
}

function getSuggestedOwners(userInput, callback) {
    // https://stackoverflow.com/questions/46573804/firestore-query-documents-startswith-a-string/46574143
    var modelArray = []
    usersRef.orderBy('username').get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            const data = doc.data().username
            if (shouldAddToSuggestedItems(modelArray, data, userInput)) {
                modelArray.push(data)
            }
        })
        callback(modelArray)
    })
        .catch(error => {
            callback(null)
        })
}

function getSuggestedRacks(datacenter, userInput, callback) {
    // https://stackoverflow.com/questions/46573804/firestore-query-documents-startswith-a-string/46574143
    var modelArray = []
    datacentersRef.where('name', '==', datacenter).get().then(docSnaps => {
        const datacenterID = docSnaps.docs[0].id
        racksRef.where('datacenter', '==', datacenterID).orderBy('letter').orderBy('number').get().then(querySnapshot => {
            querySnapshot.forEach(doc => {
                const data = doc.data().letter + doc.data().number.toString()
                if (shouldAddToSuggestedItems(modelArray, data, userInput)) {
                    modelArray.push(data)
                }
            })
            callback(modelArray)
        })
            .catch(error => {
                callback(null)
            })
    })
        .catch(error => {
            callback(null)
        })
}

function getNetworkPorts(model, userInput, callback) {
    var modelArray = []
    // https://stackoverflow.com/questions/46573804/firestore-query-documents-startswith-a-string/46574143
    modelsRef.where('modelName', '==', model ? model : '').get().then(docSnaps => {
        var port;
        const data = docSnaps.docs[0].data().networkPorts
        for (port in data) {
            if (shouldAddToSuggestedItems(modelArray, data[port].trim(), userInput)) {
                modelArray.push(data[port])
            }
        }
        callback(modelArray)
    })
        .catch(error => {
            callback([])
        })
}

function getAllAssetsList(callback) {
    let assetArray = [];
    let assetData = new Map();
    let count = 0;
    assetRef.get().then(function (querySnapshot) {
        if (querySnapshot.empty) {
            callback(null);
        } else {
            db.collectionGroup("offlineAssets").get().then(function (offlineQuerySnapshot) {
                querySnapshot.forEach(doc => {
                    if (userutils.isLoggedInUserAdmin() || userutils.doesLoggedInUserHaveAssetPerm(null) || userutils.doesLoggedInUserHaveAssetPerm(doc.data().datacenterAbbrev)) {
                        assetArray.push(doc.data().assetId + " - " + doc.data().model + " - " + doc.data().hostname);
                        assetData.set(doc.data().assetId + " - " + doc.data().model + " - " + doc.data().hostname, {...doc.data(), location: "rack"});
                    }
                    count++;
                    if (count === querySnapshot.size) {
                        count = 0;
                        if(offlineQuerySnapshot.empty){
                            callback(assetArray, assetData);
                        } else {
                            offlineQuerySnapshot.forEach(offlineDoc => {
                                let parent = offlineDoc.ref.parent.parent;
                                parent.get().then(function (parentDoc) {
                                    if(parentDoc.exists){
                                        assetArray.push(offlineDoc.data().assetId + " - " + offlineDoc.data().model + " - " + offlineDoc.data().hostname);
                                        assetData.set(offlineDoc.data().assetId + " - " + offlineDoc.data().model + " - " + offlineDoc.data().hostname, {...offlineDoc.data(), location: "offline", offlineAbbrev: parentDoc.data().abbreviation});
                                        count++;
                                        if(count === offlineQuerySnapshot.size){
                                            callback(assetArray, assetData);
                                        }
                                    } else {
                                        callback(null);
                                    }
                                });
                            });
                        }
                    }
                })
            })
        }
    }).catch(function () {
        callback(null);
    })
}

// need to change logic here for editing asset, don't allow to pick own name
function getSuggestedAssetIds(datacenter, userInput, callback, self = '') {
    var modelArray = []
    // https://stackoverflow.com/questions/46573804/firestore-query-documents-startswith-a-string/46574143
    assetRef.where('datacenter', '==', datacenter ? datacenter : '').get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            const data = doc.data().assetId;
            if (data !== self && shouldAddToSuggestedItems(modelArray, data, userInput)) {
                modelArray.push(data + ' - ' + doc.data().model + ' ' + doc.data().hostname)
            }
        })
        callback(modelArray)
    })
        .catch(error => {
            callback([])
        })
}

function getSuggestedOtherAssetPorts(assetId, userInput, callback) {
    var modelArray = []
    // https://stackoverflow.com/questions/46573804/firestore-query-documents-startswith-a-string/46574143
    assetRef.where('assetId', '==', assetId ? assetId : '').get().then(docSnaps => {
        modelsRef.doc(docSnaps.docs[0].data().modelId).get().then(doc => {
            var port;
            const data = doc.data().networkPorts
            for (port in data) {
                if (shouldAddToSuggestedItems(modelArray, data[port].trim(), userInput)) {
                    modelArray.push(data[port])
                }
            }
            callback(modelArray)
        })
            .catch(error => {
                callback([])
            })
    })
        .catch(error => {
            callback([])
        })
}

function getSuggestedDatacenters(userInput, callback) {
    // https://stackoverflow.com/questions/46573804/firestore-query-documents-startswith-a-string/46574143
    var modelArray = []
    datacentersRef.orderBy('name').orderBy('abbreviation').get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            const data = doc.data().name;
            if (userutils.doesLoggedInUserHaveAssetPerm(doc.data().abbreviation) && shouldAddToSuggestedItems(modelArray, data, userInput)) {
                modelArray.push(data)
            }
        })
        callback(modelArray)
    })
        .catch(error => {
            console.log("fuck my fucking life", error)
            callback(null)
        })
}

function shouldAddToSuggestedItems(array, data, userInput) {
    const name = data.toLowerCase()
    const lowerUserInput = userInput ? userInput.toLowerCase() : userInput
    return !array.includes(data) && (!userInput
        || (name >= lowerUserInput
            && name < lowerUserInput.slice(0, lowerUserInput.length - 1)
            + String.fromCharCode(lowerUserInput.slice(lowerUserInput.length - 1, lowerUserInput.length).charCodeAt(0) + 1)))
}

function getAssetDetails(assetID, callback, offlineStorageAbbrev = null) {
console.log(assetID)
    if (offlineStorageAbbrev) {
        console.log(assetID)
        db.collectionGroup("offlineAssets").where("assetId", "==", String(assetID)).get().then(function (querySnapshot) {
            if(querySnapshot.empty){
                callback(null);
            } else {
                callback({
                    assetID: assetID,
                    ...querySnapshot.docs[0].data(),
                    modelNum: querySnapshot.docs[0].data().modelNumber.trim(),
                })
            }
        })
    } else {
        assetRef.doc(assetID).get().then((doc) => {
            let inst = {
                assetID: assetID.trim(),
                model: doc.data().model.trim(),
                hostname: doc.data().hostname.trim(),
                rack: doc.data().rack.trim(),
                rackNum: doc.data().rackNum,
                rackU: doc.data().rackU,
                rackRow: doc.data().rackRow,
                owner: doc.data().owner.trim(),
                comment: doc.data().comment.trim(),
                modelNum: doc.data().modelNumber.trim(),
                vendor: doc.data().vendor.trim(),
                datacenter: doc.data().datacenter.trim(),
                datacenterAbbrev: doc.data().datacenterAbbrev.trim(),
                powerConnections: doc.data().powerConnections,
                macAddresses: doc.data().macAddresses,
                networkConnections: doc.data().networkConnections,
                variances: doc.data().variances
            }
            callback(inst)
        });
    }
}

//REFACTORED to be a promise. Combined checkHostnameExists into this function
function validateAssetForm(assetID, model, hostname, rack, racku, owner, datacenter, offlineStorage = null) {
    return new Promise((resolve, reject) => {
        assetRef.where("hostname", "==", hostname).get().then(function (docSnaps) {
            if (!docSnaps.empty && assetID !== docSnaps.docs[0].id && hostname !== "") {
                console.log("Made it here " + assetID + " " + docSnaps.docs[0].id)
                reject("Hostname already exists")
            }
            if (owner !== "") {
                let username = owner;
                usersRef.where('username', '==', username).get().then(querySnapshot => {
                    if (!querySnapshot.empty) {
                        console.log("Up in this bitch")
                        resolve(null)
                    } else {
                        reject("This user does not exist in the system")
                    }
                })
            }
            if (!offlineStorage && datacenter !== "") {
                datacenterutils.getDataFromName(datacenter, datacenterID => {
                    if (datacenterID) {
                        //TODO: FIX NESTING?
                        resolve(null);
                    } else {
                        reject("Datacenter does not exist")
                    }
                })
            } else if (model.trim() === "" || (!offlineStorage && (rack.trim() === "" || racku == null))) {
                reject("Required fields cannot be empty")
            } else {
                console.log("up in this bitch too")
                resolve(null)
            }

        })

    })
}


function replaceAssetRack(oldRack, newRack, oldPowerPorts, newPowerPorts, id, changePlanID, callback, offlineStorage = null, chassis = null) {
    if (offlineStorage) {
        callback(true);
    } else {
        if (!changePlanID) {
            if (String(oldRack) === String(newRack)) {

                console.log(oldPowerPorts);
                console.log(newPowerPorts);

                if (!oldPowerPorts.length && !newPowerPorts.length) {
                    callback(true);
                } else if (!oldPowerPorts.length && newPowerPorts.length) {
                    //old is empty
                    racksRef.doc(String(oldRack)).update({
                        powerPorts: firebase.firestore.FieldValue.arrayUnion(...newPowerPorts.map(obj => ({
                            ...obj,
                            assetID: id
                        })))
                    }).then(function () {
                        callback(true);
                    }).catch(function () {
                        callback(null);
                    })
                } else if (!newPowerPorts.length && oldPowerPorts.length) {
                    racksRef.doc(String(oldRack)).update({
                        powerPorts: firebase.firestore.FieldValue.arrayRemove(...oldPowerPorts.map(obj => ({
                            ...obj,
                            assetID: id
                        })))
                    }).then(function () {
                        callback(true);
                    }).catch(function () {
                        callback(null);
                    })
                } else {
                    racksRef.doc(String(oldRack)).update({
                        powerPorts: firebase.firestore.FieldValue.arrayRemove(...oldPowerPorts.map(obj => ({
                            ...obj,
                            assetID: id
                        })))
                    }).then(function () {
                        racksRef.doc(String(oldRack)).update({
                            powerPorts: firebase.firestore.FieldValue.arrayUnion(...newPowerPorts.map(obj => ({
                                ...obj,
                                assetID: id
                            })))
                        }).then(function () {
                            callback(true);
                        }).catch(function () {
                            callback(null);
                        })
                    }).catch(function () {
                        callback(null);
                    })
                }

            } else {
                if (chassis) {
                    callback(true)
                    return
                }

                if (oldPowerPorts.length && newPowerPorts.length) {
                    racksRef.doc(String(oldRack)).update({
                        assets: firebase.firestore.FieldValue.arrayRemove(id),
                        powerPorts: firebase.firestore.FieldValue.arrayRemove(...oldPowerPorts.map(obj => ({
                            ...obj,
                            assetID: id
                        })))
                    }).then(() => {
                        racksRef.doc(String(newRack)).update({
                            assets: firebase.firestore.FieldValue.arrayUnion(id),
                            powerPorts: firebase.firestore.FieldValue.arrayUnion(...newPowerPorts.map(obj => ({
                                ...obj,
                                assetID: id
                            })))
                        }).then(() => {
                            callback(true);
                            return
                        }).catch(function (error) {
                            callback(false);
                            return
                        })
                    }).catch(function (error) {
                        callback(false);
                        return
                    })
                } else if (!oldPowerPorts.length && newPowerPorts.length) {
                    racksRef.doc(String(oldRack)).update({
                        assets: firebase.firestore.FieldValue.arrayRemove(id),
                    }).then(() => {
                        racksRef.doc(String(newRack)).update({
                            assets: firebase.firestore.FieldValue.arrayUnion(id),
                            powerPorts: firebase.firestore.FieldValue.arrayUnion(...newPowerPorts.map(obj => ({
                                ...obj,
                                assetID: id
                            })))
                        }).then(() => {
                            callback(true);
                            return
                        }).catch(function (error) {
                            callback(false);
                            return
                        })
                    }).catch(function (error) {
                        callback(false);
                        return
                    })
                } else if (oldPowerPorts.length && !newPowerPorts.length) {
                    racksRef.doc(String(oldRack)).update({
                        assets: firebase.firestore.FieldValue.arrayRemove(id),
                        powerPorts: firebase.firestore.FieldValue.arrayRemove(...oldPowerPorts.map(obj => ({
                            ...obj,
                            assetID: id
                        })))
                    }).then(() => {
                        racksRef.doc(String(newRack)).update({
                            assets: firebase.firestore.FieldValue.arrayUnion(id),
                        }).then(() => {
                            callback(true);
                            return
                        }).catch(function (error) {
                            callback(false);
                            return
                        })
                    }).catch(function (error) {
                        callback(false);
                        return
                    })
                } else {
                    racksRef.doc(String(oldRack)).update({
                        assets: firebase.firestore.FieldValue.arrayRemove(id),
                    }).then(() => {
                        racksRef.doc(String(newRack)).update({
                            assets: firebase.firestore.FieldValue.arrayUnion(id),
                        }).then(() => {
                            callback(true);
                            return
                        }).catch(function (error) {
                            callback(false);
                            return
                        })
                    }).catch(function (error) {
                        callback(false);
                        return
                    })
                }
            }
        } else {
            callback(true);
        }
    }
}

/*
function checkHostnameExists(hostname, id, callback) {
    assetRef.where("hostname", "==", hostname).get().then(function (docSnaps) {
        callback(!docSnaps.empty && id !== docSnaps.docs[0].id)
    })
}
*/

function getAssetByHostname(hostname, callback, echo = null) {
    assetRef.where("hostname", "==", hostname).get().then(function (docSnaps) {
        if (!docSnaps.empty) {
            callback({ ...docSnaps.docs[0].data(), found: true, echo: echo, id: docSnaps.docs[0].id })
        } else {
            callback({ found: false, echo: echo, id: null })
        }
    })
}


function getAssetsForExport(callback) {
    assetRef.orderBy('hostname').get().then(qs => {
        var rows = [
            ["hostname", "rack", "rack_position", "vendor", "model_number", "owner", "comment"]
        ]

        for (var i = 0; i < qs.size; i++) {
            rows = [...rows, [
                modelutils.escapeStringForCSV(qs.docs[i].data().hostname),
                modelutils.escapeStringForCSV(qs.docs[i].data().rack),
                '' + qs.docs[i].data().rackU,
                modelutils.escapeStringForCSV(qs.docs[i].data().vendor),
                modelutils.escapeStringForCSV(qs.docs[i].data().modelNumber),
                modelutils.escapeStringForCSV(qs.docs[i].data().owner),
                modelutils.escapeStringForCSV(qs.docs[i].data().comment)
            ]]
            if (rows.length === qs.size + 1) {
                callback(rows)
            }
        }
    })
}

function validateImportedAssets(data, callback) {
    modelutils.getAllModels(listOfModels => {
        userutils.getAllUsers(listOfUsers => {
            console.log(listOfModels)
            console.log(listOfUsers)
            var errors = []
            var toBeAdded = []
            var toBeModified = []
            var toBeIgnored = []

            var assetsSeen = {}
            var assetsProcessed = 0

            function checkAndCallback() {
                assetsProcessed++
                if (assetsProcessed === data.length) {
                    callback({ errors, toBeAdded, toBeModified, toBeIgnored })
                }
            }

            for (var i = 0; i < data.length; i++) {
                const datum = data[i]
                var canProceedWithDbValidation = true
                var vendorAndModelFound = true
                if (!datum.vendor || String(datum.vendor).trim() === '') {
                    errors = [...errors, [i + 1, 'Vendor not found']]
                    canProceedWithDbValidation = false
                    vendorAndModelFound = false
                }
                if (!datum.model_number || String(datum.model_number).trim() === '') {
                    errors = [...errors, [i + 1, 'Model number not found']]
                    canProceedWithDbValidation = false
                    vendorAndModelFound = false
                }
                if (!datum.hostname || String(datum.hostname).trim() === '') {
                    errors = [...errors, [i + 1, 'Hostname not found']]
                    canProceedWithDbValidation = false
                } else {
                    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$/.test(datum.hostname)) {
                        //not a valid hostname
                        errors = [...errors, [i + 1, 'Invalid hostname (does not follow RFC-1034 specs)']]
                        canProceedWithDbValidation = false
                    }

                    if (!(datum.hostname in assetsSeen)) {
                        assetsSeen[datum.hostname] = i
                    } else {
                        canProceedWithDbValidation = false
                        errors = [...errors, [i + 1, 'Duplicate row (an asset with this hostname already exists on row ' + (assetsSeen[datum.hostname] + 1) + ')']]
                    }
                }
                if (!datum.rack_position || String(datum.rack_position).trim() === '') {
                    errors = [...errors, [i + 1, 'Rack position not found']]
                    canProceedWithDbValidation = false
                } else if (isNaN(String(datum.rack_position).trim()) || !Number.isInteger(parseFloat(String(datum.rack_position).trim())) || parseInt(String(datum.rack_position).trim()) <= 0) {
                    errors = [...errors, [i + 1, 'Rack position is not a positive integer']]
                    canProceedWithDbValidation = false
                }
                if (!datum.rack || String(datum.rack).trim() === '') {
                    errors = [...errors, [i + 1, 'Rack field missing']]
                    canProceedWithDbValidation = false
                } else if (!/[A-Z]\d+/.test(datum.rack)) {
                    //not a valid rack
                    errors = [...errors, [i + 1, 'Invalid rack']]
                    canProceedWithDbValidation = false
                }
                if (!datum.owner || String(datum.owner).trim() === '') {
                    // errors = [...errors, [i+1, 'Owner field missing']]
                    // canProceedWithDbValidation = false
                } else if (!listOfUsers.includes(datum.owner)) {
                    errors = [...errors, [i + 1, 'Owner does not exist']]
                    canProceedWithDbValidation = false
                }

                if (!(vendorAndModelFound && String(datum.vendor).trim() in listOfModels && listOfModels[String(datum.vendor).trim()].includes(String(datum.model_number).trim()))) {
                    errors = [...errors, [i + 1, 'Model does not exist']]
                    canProceedWithDbValidation = false
                }

                if (canProceedWithDbValidation) {
                    data[i].hostname = String(datum.hostname).trim()
                    data[i].vendor = String(datum.vendor).trim()
                    data[i].rack = String(datum.rack).trim()
                    data[i].model_number = String(datum.model_number).trim()
                    data[i].owner = (datum.owner ? String(datum.owner) : "")
                    data[i].comment = (datum.comment ? String(datum.comment) : "")

                    getAssetByHostname(datum.hostname.trim(), asset => {
                        const datum = data[asset.echo]
                        const datumOwner = (!datum.owner ? "" : datum.owner.trim())
                        const datumComment = (!datum.comment ? "" : datum.comment.trim())

                        const assetOwner = (!asset.owner ? "" : asset.owner.trim())
                        const assetComment = (!asset.comment ? "" : asset.comment.trim())

                        if (asset.found) {
                            if (asset.vendor.trim() !== datum.vendor.trim() || asset.modelNumber.trim() !== datum.model_number.trim()) {
                                errors = [...errors, [asset.echo + 1, 'Another asset (of a different model) that has the same hostname exists']]
                                checkAndCallback()
                            } else if (datum.rack_position === asset.rackU && datum.rack.trim() === asset.rack.trim()
                                && datumOwner === assetOwner && datumComment === assetComment) {
                                // IGNORE CASE
                                toBeIgnored = [...toBeIgnored, datum]
                                checkAndCallback()
                            } else {
                                // MODIFY CASE
                                assetFitsOnRack(datum.rack, datum.rack_position, datum.vendor + ' ' + datum.model_number, ({ error, echo }) => {
                                    const datum = data[asset.echo]
                                    if (error) {
                                        errors = [...errors, [asset.echo + 1, 'This asset could not be placed at the requested location']]
                                        checkAndCallback()
                                    } else {
                                        toBeModified = [...toBeModified, {
                                            ...datum,
                                            row: asset.echo + 1,
                                            assetIdInDb: asset.id
                                        }]
                                        checkAndCallback()
                                    }
                                }, asset.id, asset.echo)
                            }
                        } else {
                            // ADDITION CASE
                            assetFitsOnRack(datum.rack, datum.rack_position, datum.vendor + ' ' + datum.model_number, ({ error, echo }) => {
                                const datum = data[asset.echo]
                                if (error) {
                                    errors = [...errors, [asset.echo + 1, 'This asset could not be placed at the requested location']]
                                    checkAndCallback()
                                } else {
                                    toBeAdded = [...toBeAdded, datum]
                                    checkAndCallback()
                                }
                            }, null, asset.echo)
                        }
                    }, i)
                } else {
                    checkAndCallback()
                }
            }
        })
    })
}


export {
    getAsset,
    getAllAssetIDs,
    addAsset,
    deleteAsset,
    assetFitsOnRack,
    updateAsset,
    sortByKeyword,
    getSuggestedModels,
    getAssetDetails,
    getAssetFromModel,
    getSuggestedOwners,
    getSuggestedRacks,
    getSuggestedAssetIds,
    getSuggestedOtherAssetPorts,
    shouldAddToSuggestedItems,
    getNetworkPorts,
    getAssetAt,
    validateAssetForm,
    getAssetsForExport,
    validateImportedAssets,
    sortAssetsByRackAndRackU,
    getSuggestedDatacenters,
    getAllAssetsList,
    replaceAssetRack
}
