import {assetRef, racksRef, modelsRef, usersRef, firebase} from './firebaseutils'
import * as rackutils from './rackutils'
import * as modelutils from './modelutils'

//TODO: admin vs. user privileges

function getAsset(callback) {
    //TODO: need to rigorously test combined sort
    //TODO: deecide to make rackU unsortable???
    
    assetRef.limit(25).orderBy("rackU", "asc").get().then(docSnaps => {
        const startAfter = docSnaps.docs[docSnaps.docs.length - 1];
        const asset = docSnaps.docs.map(doc => (
            {
                asset_id: doc.id,
                model: doc.data().model,
                hostname: doc.data().hostname,
                rack: doc.data().rack,
                rackU: doc.data().rackU,
                owner: doc.data().owner,
                comment: doc.data().comment
            }
        ))
        callback(startAfter, asset);
    }).catch(function (error) {
        callback(null, null)
    })
}


function getAssetAt(start, callback) {
    assetRef.startAfter(start).limit(25).get().then(docSnaps => {
        const newStart = docSnaps.docs[docSnaps.docs.length - 1];
        const assets = docSnaps.docs.map(doc => (
            {
                asset_id: doc.id,
                model: doc.data().model,
                hostname: doc.data().hostname,
                rack: doc.data().rack,
                rackU: doc.data().rackU,
                owner: doc.data().owner,
                comment: doc.data().comment
            }))
        callback(newStart, assets)
    }).catch(function (error) {
        callback(null, null);
    })
}

function addAsset(model, hostname, rack, racku, owner, comment, callback) {

    validateAssetForm(model, hostname, rack, racku, owner, valid => {
        if (valid) {
            callback(valid)
        } else {
            modelutils.getModelByModelname(model, doc => {
                if (!doc) {
                    var errMessage = "Model does not exist"
                    callback(errMessage)
                } else {
                    if (model.trim() === "" || hostname.trim() === "" || rack.trim() === "" || racku == null) {
                        callback("Required fields cannot be empty")
                    } else {
                        checkHostnameExists(hostname, null, result => {
                            if (result) {
                                callback("Hostname already exists!")
                            } else {
                                assetFitsOnRack(rack, racku, model, function (errorMessage, modelNum, modelVendor, rackID) {//see line 171
                                    //Allen wants me to add a vendor and modelname field to my document
                                    if (errorMessage) {
                                        callback(errorMessage)
                                    }
                                    //The rack doesn't exist, or it doesn't fit on the rack at rackU
                                    else {
                                        assetRef.add({
                                            modelId: doc.id,
                                            model: model,
                                            hostname: hostname,
                                            rack: rack,
                                            rackU: racku,
                                            owner: owner,
                                            comment: comment,
                                            rackID: rackID,
                                            //This is for rack usage reports
                                            modelNumber: modelNum,
                                            vendor: modelVendor,
                                        }).then(function (docRef) {
                                            racksRef.doc(String(rackID)).update({
                                                assets: firebase.firestore.FieldValue.arrayUnion(docRef.id)
                                            })
                                            callback(null);
                                        }).catch(function (error) {
                                            // callback("Error");
                                        })
                                    }
                                })
                            }
                        }) //checkInstanceFits in rackutils will check against self if instance id is passed in
                    }
                }
            })
        }
    })


}


// This will check if the instance fits on rack (after checking rack exists): fits within in the height of rack, and does not conflict with other instances

function assetFitsOnRack(assetRack, rackU, model, callback, asset_id=null) {

    let splitRackArray = assetRack.split(/(\d+)/).filter(Boolean)
    let rackRow = splitRackArray[0]
    let rackNum = parseInt(splitRackArray[1])

    let rackID = null;
    rackutils.getRackID(rackRow, rackNum, id => {
        if (id) {
            rackID = id
        } else {
        }
    })

    racksRef.where("letter", "==", rackRow).where("number", "==", rackNum).get().then(function (querySnapshot) {
        if (!querySnapshot.empty && querySnapshot.docs[0].data().letter && querySnapshot.docs[0].data().number) {
            let rackHeight = querySnapshot.docs[0].data().height

            modelutils.getModelByModelname(model, doc => {
                //doc.data().height refers to model height
                if (rackHeight >= parseInt(rackU) + doc.data().height) {
                    //We know the instance will fit on the rack, but now does it conflict with anything?

                    rackutils.checkAssetFits(rackU, doc.data().height, rackID, function (status) {

                        //can check length. If length > 0, then conflicting instances were returned
                        //means that there are conflicts.

                        if (status.length) {
                            let height = doc.data().height
                            let rackedAt = rackU
                            let conflictNew = [];
                            let conflictCount = 0;
                            status.forEach(assetID => {
                                getAssetDetails(assetID, result => {
                                    conflictNew.push(result.model + " " + result.hostname + ", ");
                                    conflictCount++;
                                    if (conflictCount === status.length) {
                                        var errMessage = "Asset of height " + height + " racked at " + rackedAt + "U conflicts with assets(s) " + conflictNew.join(', ').toString();
                                        callback(errMessage);
                                    }
                                });
                            })
                        } else {//status callback is null, no conflits
                            callback(null, doc.data().modelNumber, doc.data().vendor, rackID)

                        }
                    }, asset_id) //if you pass in a null to checkInstanceFits
                }
                else {
                    var errMessage = "Asset of this model at this RackU will not fit on this rack";
                    callback(errMessage);

                }
            })
        } else {
            var errMessage2 = "Rack does not exist"
            callback(errMessage2)
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

            let rackID = null;

            rackutils.getRackID(rackRow, rackNum, id => {
                if (id) {
                    rackID = id
                } else {
                }
            })


            assetRef.doc(assetID).delete().then(function () {
                racksRef.doc(String(rackID)).update({

                    assets: firebase.firestore.FieldValue.arrayRemove(assetID)
                })

                callback(assetID);
            }).catch(function (error) {
                callback(null);
            })
        } else {
            callback(null);
        }
    })
}


function updateAsset(assetID, model, hostname, rack, rackU, owner, comment, callback) {

    validateAssetForm(model, hostname, rack, rackU, owner, valid => {
        if (valid) {
            callback(valid)
        } else {
            modelutils.getModelByModelname(model, doc => {
                if (!doc) {
                    var errMessage = "Model does not exist"
                    callback(errMessage)
                } else {

                    if (model.trim() === "" || hostname.trim() === "" || rack.trim() === "" || rackU == null) {
                        callback("Required fields cannot be empty")
                    } else {
                        checkHostnameExists(hostname, assetID, result => {
                            if (result) {
                                callback("Hostname already exists.")
                            } else {
                                assetFitsOnRack(rack, rackU, model, stat => {
                                    //returned an error message
                                    if (stat) {

                                        var errMessage = stat
                                        //need to pass up errormessage if model updated and instance no longer fits
                                        callback(errMessage)
                                    }
                                    //returns null if no issues/conflicts.
                                    else {
                                        let splitRackArray = rack.split(/(\d+)/).filter(Boolean)
                                        let rackRow = splitRackArray[0]
                                        let rackNum = parseInt(splitRackArray[1])
                                        //get new rack document
                                        rackutils.getRackID(rackRow, rackNum, result => {
                                            if (result) {
                                                //get old rack document
                                                assetRef.doc(assetID).get().then(docSnap => {
                                                    let oldRack = docSnap.data().rack;
                                                    let oldSplitRackArray = oldRack.split(/(\d+)/).filter(Boolean)
                                                    let oldRackRow = oldSplitRackArray[0]
                                                    let oldRackNum = parseInt(oldSplitRackArray[1])
                                                    var modelStuff = []
                                                    modelutils.getVendorAndNumberFromModel(model, name => modelStuff = name)
                                                    var rackId = ''
                                                    rackutils.getRackID(rack.slice(0,1),rack.slice(1,rack.length), name => rackId = name)
                                                    var modelId = ''
                                                    modelutils.getModelIdFromModelName(model, name => modelId = name)
                                                    rackutils.getRackID(oldRackRow, oldRackNum, oldResult => {
                                                        if (oldResult) {
                                                            //get new rack document
                                                            //get instance id
                                                            replaceAssetRack(oldResult, result, assetID, result => {
                                                                assetRef.doc(String(assetID)).update({
                                                                    model: model,
                                                                    modelId: modelId,
                                                                    vendor: modelStuff[0],
                                                                    modelNumber: modelStuff[1],
                                                                    hostname: hostname,
                                                                    rack: rack,
                                                                    rackU: rackU,
                                                                    rackID: rackId,
                                                                    owner: owner,
                                                                    comment: comment
                                                                    //these are the fields in the document to update

                                                                }).then(function () {
                                                                    callback(null);
                                                                }).catch(function (error) {
                                                                    callback(error);
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
                    }
                }
            })
        }
    })
}


function getAssetFromModel(model, callback) {
    assetRef.where('model', '==', model).get().then(docSnaps => {
        const assets = docSnaps.docs.map(doc => (
            {id: doc.id, ...doc.data()}
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
                {id: doc.id}
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
            if (shouldAddToSuggestedItems(modelArray,data,userInput)) {
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
            if (shouldAddToSuggestedItems(modelArray,data,userInput)) {
                modelArray.push(data)
            }
        })
        callback(modelArray)
    })
        .catch(error => {
            callback(null)
        })
}

function getSuggestedRacks(userInput, callback) {
    // https://stackoverflow.com/questions/46573804/firestore-query-documents-startswith-a-string/46574143
    var modelArray = []
    racksRef.orderBy('letter').orderBy('number').get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
          const data = doc.data().letter + doc.data().number.toString()
            if (shouldAddToSuggestedItems(modelArray,data,userInput)) {
                modelArray.push(data)
            }
        })
        callback(modelArray)
    })
        .catch(error => {
            callback(null)
        })
}

function shouldAddToSuggestedItems(array,data,userInput) {
    const name = data.toLowerCase()
    const lowerUserInput = userInput.toLowerCase()
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
                rackU: doc.data().rackU,
                owner: doc.data().owner.trim(),
                comment: doc.data().comment.trim(),
                modelNum: doc.data().modelNumber.trim(),
                vendor: doc.data().vendor.trim()


            }
            callback(inst)
        }
    );

}

//as long as it's not in the render, not accessible by the user ??
function validateAssetForm(model, hostname, rack, racku, owner, callback) {
    //check required fields aren't empty
    //check model exists
    //legal hostname: done in AddAssetForm and EditAssetForm
    //racku : fits within height of the rack (what if they fill out the racku before rack?)
    //owner: must be someone in the system??

    // } TODO: see if Joyce breaks this

    //if owner is not null, need to check username in system
    if (owner !== "") {
        let username = owner;
        usersRef.where('username', '==', username).get().then(querySnapshot => {
            if (!querySnapshot.empty) {
                callback(null)
            } else {
                callback("This user does not exist")
            }
        })
    } else {
        callback(null)
    }

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

function checkHostnameExists(hostname, id, callback) {
    assetRef.where("hostname", "==", hostname).get().then(function (docSnaps) {
        callback(!docSnaps.empty && id != docSnaps.docs[0].id)
    })
}

//doublecheck that it works with infinite scroll, and will autorefresh if button is clicked
//Do this after UI/UX overhaul 
function combinedRackAndRackUSort(hostname, callback) {


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
    getAssetAt,
    validateAssetForm,
    combinedRackAndRackUSort
}
