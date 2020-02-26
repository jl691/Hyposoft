import { assetRef, racksRef, modelsRef, usersRef, firebase, datacentersRef } from './firebaseutils'
import * as rackutils from './rackutils'
import * as modelutils from './modelutils'
import * as userutils from './userutils'
import * as assetIDutils from './assetidutils'
import * as datacenterutils from './datacenterutils'
import * as assetnetworkportutils from './assetnetworkportutils'
import * as assetpowerportutils from './assetpowerportutils'
import * as logutils from './logutils'

const algoliasearch = require('algoliasearch')
const client = algoliasearch('V7ZYWMPYPA', '26434b9e666e0b36c5d3da7a530cbdf3')
const index = client.initIndex('assets')

function getAsset(callback, field = null, direction = null) {
    let query;
    if (field && direction !== null) {
        query = direction ? assetRef.limit(25).orderBy(field) : assetRef.limit(25).orderBy(field, "desc");
    } else {
        query = assetRef.limit(25);
    }
    let assets = [];
    let count = 0;

    query.get().then(docSnaps => {
        if (docSnaps.empty) {
            callback(null, null, true);
        } else {
            const startAfter = docSnaps.docs[docSnaps.docs.length - 1];
            docSnaps.docs.forEach(doc => {
                assets.push({
                    asset_id: doc.id,
                    model: doc.data().model,
                    hostname: doc.data().hostname,
                    rack: doc.data().rack,
                    rackRow: doc.data().rackRow,
                    rackNum: doc.data().rackNum,
                    rackU: doc.data().rackU,
                    owner: doc.data().owner,
                    comment: doc.data().comment,
                    datacenter: doc.data().datacenter,
                    datacenterAbbrev: doc.data().datacenterAbbrev,
                    macAddresses: doc.data().macAddresses,
                    powerConnections: doc.data().powerConnections,
                    networkConnections: doc.data().networkConnections,
                    vendor: doc.data().vendor,
                    modelNumber: doc.data().modelNumber
                });
                count++;
                if (count === docSnaps.docs.length) {
                    callback(startAfter, assets, false);
                }

            })
        }
    }).catch(function (error) {
        console.log(error);
        callback(null, null, null)
    })
}


function getAssetAt(start, callback, field = null, direction = null) {

    let query;
    if (field && direction !== null) {
        query = direction ? assetRef.limit(25).orderBy(field).startAfter(start) : assetRef.limit(25).orderBy(field, "desc").startAfter(start);
    } else {
        query = assetRef.limit(25).startAfter(start);
    }

    let assets = [];
    let count = 0;
    query.get().then(docSnaps => {
        const newStart = docSnaps.docs[docSnaps.docs.length - 1];
        docSnaps.docs.forEach(doc => {
            assets.push({
                asset_id: doc.id,
                model: doc.data().model,
                hostname: doc.data().hostname,
                rack: doc.data().rack,
                rackRow: doc.data().rackRow,
                rackNum: doc.data().rackNum,
                rackU: doc.data().rackU,
                owner: doc.data().owner,
                comment: doc.data().comment,
                datacenter: doc.data().datacenter,
                datacenterAbbrev: doc.data().datacenterAbbrev,
                macAddresses: doc.data().macAddresses,
                powerConnections: doc.data().powerConnections,
                networkConnections: doc.data().networkConnections,
                vendor: doc.data().vendor,
                modelNumber: doc.data().modelNumber
            });
            count++;
            if (count === docSnaps.docs.length) {
                callback(newStart, assets);
            }
        })

    }).catch(function (error) {
        callback(null, null);
    })
}

function addAsset(overrideAssetID, model, hostname, rack, racku, owner, comment, datacenter, macAddresses, networkConnectionsArray, powerConnectionsInput, callback) {

    let splitRackArray = rack.split(/(\d+)/).filter(Boolean)
    let rackRow = splitRackArray[0]
    let rackNum = parseInt(splitRackArray[1])

    validateAssetForm(null, model, hostname, rack, racku, owner, datacenter).then(
        _ => {
            datacenterutils.getDataFromName(datacenter, (datacenterID, datacenterAbbrev) => {
                modelutils.getModelByModelname(model, doc => {
                    if (!doc) {
                        var errMessage = "Model does not exist"
                        callback(errMessage)
                    } else {

                        assetFitsOnRack(rack, racku, model, datacenter, function (errorMessage, modelNum, modelVendor, rackID) {

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
                                    let networkConnections = assetnetworkportutils.networkConnectionsToMap(networkConnectionsArray)
                                    let powerConnections = assetpowerportutils.formatPowerConnections(powerConnectionsInput)

                                    console.log(powerConnections)

                                    if (ncStatus) {
                                        callback(ncStatus)
                                    }
                                    else {

                                        assetpowerportutils.validatePowerConnections(datacenter, rack, racku, powerConnectionsInput, model, ppStatus => {
                                            console.log(ppStatus)
                                            if (ppStatus) {
                                                console.log("breakpoint")
                                                callback(ppStatus)
                                            }
                                            else {
                                                console.log("HERE and power connections validated")
                                                if (overrideAssetID.trim() != "") {

                                                    assetIDutils.overrideAssetID(overrideAssetID).then(
                                                        _ => {
                                                            const assetObject = {
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
                                                                datacenterAbbrev: datacenterAbbrev


                                                            }
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

                                                            index.saveObject({ ...assetObject, objectID: overrideAssetID, suffixes: suffixes_list.join(' ') })
                                                            assetRef.doc(overrideAssetID).set(assetObject).then(function (docRef) {
                                                                assetnetworkportutils.symmetricNetworkConnectionsAdd(networkConnectionsArray, overrideAssetID);

                                                                if (powerConnections.length != 0) {
                                                                    racksRef.doc(String(rackID)).update({
                                                                        assets: firebase.firestore.FieldValue.arrayUnion(overrideAssetID),
                                                                        powerPorts: firebase.firestore.FieldValue.arrayUnion(...powerConnections)
                                                                    }).then(function () {

                                                                        console.log("Document successfully updated in racks");
                                                                        logutils.addLog(overrideAssetID, logutils.ASSET(), logutils.CREATE())
                                                                        callback(null);
                                                                    })


                                                                }
                                                                else {
                                                                    racksRef.doc(String(rackID)).update({
                                                                        assets: firebase.firestore.FieldValue.arrayUnion(overrideAssetID)
                                                                    }).then(function () {

                                                                        console.log("Document successfully updated in racks");
                                                                        logutils.addLog(overrideAssetID, logutils.ASSET(), logutils.CREATE())
                                                                        callback(null);
                                                                    })


                                                                }
                                                            }).catch(function (error) {
                                                                // callback("Error");
                                                                console.log(error)
                                                            })

                                                        }).catch(errMessage => {
                                                            callback(errMessage)
                                                        })

                                                }
                                                else {

                                                    assetIDutils.generateAssetID().then(newID => {
                                                        const assetObject = {
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
                                                            datacenterAbbrev: datacenterAbbrev
                                                        }
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

                                                        index.saveObject({ ...assetObject, objectID: newID, suffixes: suffixes_list.join(' ') })

                                                        assetRef.doc(newID)
                                                            .set(assetObject).then(function (docRef) {

                                                                assetnetworkportutils.symmetricNetworkConnectionsAdd(networkConnectionsArray, newID);

                                                                if (powerConnections.length != 0) {
                                                                    racksRef.doc(String(rackID)).update({
                                                                        assets: firebase.firestore.FieldValue.arrayUnion(newID),
                                                                        powerPorts: firebase.firestore.FieldValue.arrayUnion(...powerConnections)
                                                                    }).then(function () {

                                                                        console.log("Document successfully updated in racks");
                                                                        logutils.addLog(newID, logutils.ASSET(), logutils.CREATE())
                                                                        callback(null);
                                                                    })


                                                                }
                                                                else {
                                                                    racksRef.doc(String(rackID)).update({
                                                                        assets: firebase.firestore.FieldValue.arrayUnion(newID)
                                                                    }).then(function () {

                                                                        console.log("Document successfully updated in racks");
                                                                        logutils.addLog(newID, logutils.ASSET(), logutils.CREATE())
                                                                        callback(null);
                                                                    })


                                                                }

                                                            }).catch(function (error) {
                                                                // callback("Error");
                                                                console.log(error)
                                                            })
                                                    }).catch("Ran out of tries to generate unique ID")

                                                }


                                            }


                                        })



                                    }

                                })

                            }
                        })

                        //checkInstanceFits in rackutils will check against self if instance id is passed in

                    }

                })
            })
        }).catch(errMessage => {
            callback(errMessage)
            console.log(errMessage)

        })
}

// rackAsc should be a boolean corresponding to true if rack is ascending
// rackUAsc should be a boolean corresponding to true if rackU is ascending
function sortAssetsByRackAndRackU(rackAsc, rackUAsc, callback) {
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
                        datacenterAbbrev: datacenterAbbrev
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
function assetFitsOnRack(assetRack, rackU, model, datacenter, callback, asset_id = null, echo = -1) {

    let splitRackArray = assetRack.split(/(\d+)/).filter(Boolean)
    let rackRow = splitRackArray[0]
    let rackNum = parseInt(splitRackArray[1])

    let rackID = null;
    rackutils.getRackID(rackRow, rackNum, datacenter, id => {
        if (id) {
            rackID = id
        } else {
        }
    })

    datacenterutils.getDataFromName(datacenter, datacenterID => {
        if (datacenterID) {
            racksRef.where("letter", "==", rackRow).where("number", "==", rackNum).where("datacenter", "==", datacenterID).get().then(function (querySnapshot) {
                if (!querySnapshot.empty && querySnapshot.docs[0].data().letter && querySnapshot.docs[0].data().number) {
                    let rackHeight = querySnapshot.docs[0].data().height

                    console.log(model)
                    modelutils.getModelByModelname(model, doc => {
                        //doc.data().height refers to model height
                        if (rackHeight > parseInt(rackU) + doc.data().height) {
                            //We know the instance will fit on the rack, but now does it conflict with anything?

                            rackutils.checkAssetFits(rackU, doc.data().height, rackID, function (status) {

                                //can check length. If length > 0, then conflicting instances were returned
                                //means that there are conflicts.

                                if (status && status.length) {
                                    let height = doc.data().height
                                    let rackedAt = rackU
                                    let conflictNew = [];
                                    let conflictCount = 0;
                                    status.forEach(assetID => {
                                        getAssetDetails(assetID, result => {
                                            conflictNew.push(result.model + " " + result.hostname + ", ");
                                            conflictCount++;
                                            if (conflictCount === status.length) {
                                                console.log(conflictNew)
                                                var errMessage = "Asset of height " + height + " racked at " + rackedAt + "U conflicts with asset(s) " + conflictNew.join(', ').toString();
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
                            }, asset_id) //if you pass in a null to checkInstanceFits
                        } else {
                            var errMessage = "Asset of this model at this RackU will not fit on this rack";
                            if (echo < 0) {
                                callback(errMessage);
                            } else {
                                callback({ error: errMessage, echo: echo })
                            }

                        }
                    })
                } else {
                    var errMessage2 = "Rack does not exist"
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
}

function deleteAsset(assetID, callback) {

    assetRef.doc(assetID).get().then(function (doc) {

        //This is so I can go into racks collection and delete instances associated with the rack
        if (doc.exists) {
            let assetRack = doc.data().rack
            let splitRackArray = assetRack.split(/(\d+)/).filter(Boolean)
            let rackRow = splitRackArray[0]
            let rackNum = parseInt(splitRackArray[1])
            let datacenter = doc.data().datacenter;

            let rackID = null;


            rackutils.getRackID(rackRow, rackNum, datacenter, id => {
                if (id) {
                    rackID = id
                    console.log(rackID)

                    let docData = doc.data()

                    let deleteAssetConnections = docData.powerConnections
                    console.log(deleteAssetConnections)

                    if (deleteAssetConnections.length != 0) {//
                        console.log("THere are asset connections to delete")
                        //need to get the datacenter, rack that the asset it on
                        racksRef.doc(String(rackID)).update({
                            //Can you do this??
                            powerPorts: firebase.firestore.FieldValue.arrayRemove(...deleteAssetConnections)

                        }).then(function () {
                            assetnetworkportutils.symmetricNetworkConnectionsDelete(assetID, result => {
                                console.log(result)
                                if (result) {
                                    assetRef.doc(assetID).delete().then(function () {
                                        racksRef.doc(String(rackID)).update({
                                            assets: firebase.firestore.FieldValue.arrayRemove(assetID)

                                        })
                                            .then(function () {
                                                console.log("Document successfully deleted!");
                                                logutils.addLog(assetID, logutils.ASSET(), logutils.DELETE(), docData)
                                                index.deleteObject(assetID)
                                                callback(assetID);
                                            })
                                    })
                                        .catch(function (error) {
                                            console.log(error)
                                            callback(null);
                                        })
                                } else {
                                    callback(null);
                                }
                            })
                        })

                    }
                    else {
                        //MY b, duplicated code again
                        //There were no powerConnections made in the asset in the first place

                        assetnetworkportutils.symmetricNetworkConnectionsDelete(assetID, result => {
                            if (result) {
                                assetRef.doc(assetID).delete().then(function () {
                                    racksRef.doc(String(rackID)).update({
                                        assets: firebase.firestore.FieldValue.arrayRemove(assetID)

                                    })
                                        .then(function () {
                                            console.log("Document successfully deleted!");
                                            logutils.addLog(assetID, logutils.ASSET(), logutils.DELETE(), docData)
                                            index.deleteObject(assetID)
                                            callback(assetID);
                                        })
                                })
                                    .catch(function (error) {
                                        console.log(error)
                                        callback(null);
                                    })
                            } else {
                                callback(null);
                            }
                        });
                    }


                } else {
                    console.log("no rack for this letter and number")
                    callback(null)
                }
            })

        } else {
            callback(null);
        }
    })
}

//TODO: double check this still works:
//hostname updating works, owner updating works, conflicts, etc.

function updateAsset(assetID, model, hostname, rack, rackU, owner, comment, datacenter, macAddresses, networkConnections, powerConnectionsInput, callback) {

    validateAssetForm(assetID, model, hostname, rack, rackU, owner, datacenter).then(
        _ => {
            datacenterutils.getDataFromName(datacenter, (datacenterID, datacenterAbbrev) => {
                if (datacenterID) {
                    modelutils.getModelByModelname(model, doc => {
                        if (!doc) {
                            var errMessage = "Model does not exist"
                            callback(errMessage)
                        } else {

                            console.log(rack, rackU, model, datacenter)
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
                                    let splitRackArray = rack.split(/(\d+)/).filter(Boolean)
                                    let rackRow = splitRackArray[0]
                                    let rackNum = parseInt(splitRackArray[1])
                                    //get new rack document
                                    rackutils.getRackID(rackRow, rackNum, datacenter, result => {
                                        if (result) {
                                            //get old rack document
                                            assetRef.doc(assetID).get().then(docSnap => {
                                                let oldRack = docSnap.data().rack;
                                                let oldSplitRackArray = oldRack.split(/(\d+)/).filter(Boolean)
                                                let oldRackRow = oldSplitRackArray[0]
                                                let oldRackNum = parseInt(oldSplitRackArray[1])
                                                let oldDatacenter = docSnap.data().datacenter
                                                var modelStuff = []
                                                modelutils.getVendorAndNumberFromModel(model, name => modelStuff = name)
                                                var rackId = ''
                                                rackutils.getRackID(rack.slice(0, 1), rack.slice(1, rack.length), datacenter, name => rackId = name)
                                                var modelId = ''
                                                modelutils.getModelIdFromModelName(model, name => modelId = name)
                                                rackutils.getRackID(oldRackRow, oldRackNum, oldDatacenter, oldResult => {
                                                    console.log(oldRackRow, oldRackNum, oldDatacenter, oldResult)
                                                    if (oldResult) {
                                                        console.log("up in this bitch")
                                                        //get new rack document
                                                        //get instance id
                                                        replaceAssetRack(oldResult, result, assetID, result => {
                                                            logutils.getObjectData(String(assetID), logutils.ASSET(), assetData => {

                                                                console.log("We really up in this bitch")
                                                                console.log(networkConnections)
                                                                //console.log(assetnetworkportutils.networkConnectionsToArray(networkConnections))
                                                                //the reason why we have networkConnections to array is because validateNetworkConnections expects an array. networkConnections is a JSON object because we got in from the db, and to send connectiosn to the db, it must be transformed into a JSON obj first
                                                                assetnetworkportutils.validateNetworkConnections(model, networkConnections, ncStatus => {

                                                                    let powerConnections = assetpowerportutils.formatPowerConnections(powerConnectionsInput)
                                                                    console.log(ncStatus)

                                                                    if (ncStatus) {
                                                                        console.log("Couldn't hang")
                                                                        callback(ncStatus)
                                                                    }
                                                                    else {

                                                                        assetpowerportutils.validatePowerConnections(datacenter, rack, rackU, powerConnectionsInput, model, ppStatus => {
                                                                            console.log(ppStatus)
                                                                            if (ppStatus) {
                                                                                console.log("breakpoint")
                                                                                callback(ppStatus)
                                                                            }
                                                                            else {
                                                                                const assetObject = {
                                                                                    assetId: assetID,
                                                                                    model: model,
                                                                                    modelId: modelId,
                                                                                    vendor: modelStuff[0],
                                                                                    modelNumber: modelStuff[1],
                                                                                    hostname: hostname,
                                                                                    rack: rack,
                                                                                    rackU: rackU,
                                                                                    rackID: rackId,
                                                                                    owner: owner,
                                                                                    comment: comment,
                                                                                    rackRow: rackRow,
                                                                                    rackNum: rackNum,
                                                                                    datacenter: datacenter,
                                                                                    datacenterID: datacenterID,
                                                                                    datacenterAbbrev: datacenterAbbrev,
                                                                                    macAddresses,
                                                                                    networkConnections,
                                                                                    powerConnections,
                                                                                    //these are the fields in the document to update


                                                                                }
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

                                                                                index.saveObject({ ...assetObject, objectID: assetID, suffixes: suffixes_list.join(' ') })
                                                                                assetRef.doc(String(assetID)).update(assetObject).then(function () {
                                                                                    console.log("Updated model successfully")
                                                                                    logutils.addLog(String(assetID), logutils.ASSET(), logutils.MODIFY(), assetData)
                                                                                    callback(null);
                                                                                }).catch(function (error) {
                                                                                    callback(error);

                                                                                })
                                                                            }
                                                                        })
                                                                    }


                                                                })
                                                            })
                                                        })
                                                    }
                                                })
                                            })
                                        }
                                    })
                                }
                            }, assetID)


                        }
                    })
                } else {
                    var errMessage = "Datacenter does not exist"
                    callback(errMessage)
                }
            })
        }).catch(errMessage => {
            callback(errMessage)
            console.log(errMessage)


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
            if (shouldAddToSuggestedItems(modelArray, data, userInput)) {
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

function getAssetDetails(assetID, callback) {

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
            networkConnections: doc.data().networkConnections
        }
        callback(inst)
    }
    );

}

//REFACTORED to be a promise. Combined checkHostnameExists into this function
function validateAssetForm(assetID, model, hostname, rack, racku, owner, datacenter) {
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
            if (datacenter !== "") {
                datacenterutils.getDataFromName(datacenter, datacenterID => {
                    if (datacenterID) {
                        //TODO: FIX NESTING?
                        resolve(null);
                    } else {
                        reject("Datacenter does not exist")
                    }
                })
            } else if (model.trim() === "" || rack.trim() === "" || racku == null) {
                reject("Required fields cannot be empty")
            } else {
                console.log("up in this bitch too")
                resolve(null)
            }

        })

    })
}

function replaceAssetRack(oldRack, newRack, id, callback) {
    racksRef.doc(String(oldRack)).update({
        assets: firebase.firestore.FieldValue.arrayRemove(id)
    }).then(() => {
        racksRef.doc(String(newRack)).update({
            assets: firebase.firestore.FieldValue.arrayUnion(id)
        }).then(() => {
            callback(true);
        }).catch(function (error) {
            callback(false);
        })
    }).catch(function (error) {
        callback(false);
    })
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
    getNetworkPorts,
    getAssetAt,
    validateAssetForm,
    getAssetsForExport,
    validateImportedAssets,
    sortAssetsByRackAndRackU,
    getSuggestedDatacenters
}
