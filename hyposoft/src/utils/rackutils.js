import * as firebaseutils from "./firebaseutils";
import * as modelutils from "./modelutils";

var rackCount = 1;

function getRackAt(callback, start = null) {
    console.log("calling getrackat with start ")
    let racks = [];
    if(start){
        firebaseutils.racksRef.orderBy("letter").orderBy("number").limit(25).startAfter(start).get().then(docSnaps => {
            console.log("eyyyy")
            if(docSnaps.empty){
                console.log(docSnaps.empty)
                callback(null, null, true);
            } else {
                console.log(docSnaps.size)
                const newStart = docSnaps.docs[docSnaps.docs.length - 1];
                docSnaps.forEach(doc => {
                    racks.push({
                        count: rackCount,
                        id: doc.id,
                        letter: doc.data().letter,
                        number: doc.data().number,
                        height: doc.data().height,
                        assets: (doc.data().assets ? Object.keys(doc.data().assets).length : 0)
                    });
                    rackCount++;
                });
                /*const racks = docSnaps.docs.map(doc => (
                    {
                        id: doc.id,
                        letter: doc.data().letter,
                        number: doc.data().number,
                        height: doc.data().height,
                        instances: (doc.data().instances ? Object.keys(doc.data().instances).length : 0)
                    }));*/
                console.log(racks);
                callback(newStart, racks, false);
            }
        }).catch(function (error) {
            callback(null, null, null);
        })
    } else {
        firebaseutils.racksRef.orderBy("letter").orderBy("number").limit(25).get().then(docSnaps => {
            if(docSnaps.empty){
                callback(null, null, true);
            } else {
                const startAfter = docSnaps.docs[docSnaps.docs.length - 1]
                docSnaps.forEach(doc => {
                    racks.push({
                        count: rackCount,
                        id: doc.id,
                        letter: doc.data().letter,
                        number: doc.data().number,
                        height: doc.data().height,
                        assets: (doc.data().assets ? Object.keys(doc.data().assets).length : 0)
                    });
                    rackCount++;
                });
                callback(startAfter, racks, false);
            }
        }).catch(function (error) {
            callback(null, null, null);
        })
    }
}

function addSingleRack(row, number, height, callback) {
    //assume form validated
    checkRackExists(row, number, status => {
        if (!status) {
            firebaseutils.racksRef.add({
                letter: row,
                number: number,
                height: height,
                assets: []
            }).then(function (docRef) {
                callback(docRef.id);
            }).catch(function (error) {
                callback(null);
            })
        } else {
            callback(null)
        }
    })
}

function addRackRange(rowStart, rowEnd, numberStart, numberEnd, height, callback) {
    //assume form validated
    let dbPromises = [];
    let rowStartNumber = rowStart.charCodeAt(0);
    let rowEndNumber = rowEnd.charCodeAt(0);
    let skippedRacks = [];
    for (let i = rowStartNumber; i <= rowEndNumber; i++) {
        let currLetter = String.fromCharCode(i);
        for (let j = numberStart; j <= numberEnd; j++) {
            checkRackExists(currLetter, j, status => {
                if (!status) {
                    dbPromises.push(firebaseutils.racksRef.add({
                        letter: currLetter,
                        number: j,
                        height: height,
                        assets: []
                    }).catch(function (error) {
                        callback(null, null);
                    }))
                } else {
                    let skippedRack = currLetter + j;
                    skippedRacks.push(skippedRack);
                }
            })
        }
    }
    Promise.all(dbPromises).then(() => {
        callback(true, skippedRacks);
    })
}

function checkAssets(rowStart, rowEnd, numberStart, numberEnd, callback) {
    let rowStartNumber = rowStart.charCodeAt(0);
    let rowEndNumber = rowEnd.charCodeAt(0);
    for (let i = rowStartNumber; i <= rowEndNumber; i++) {
        let currLetter = String.fromCharCode(i);
        for (let j = numberStart; j <= numberEnd; j++) {
            firebaseutils.racksRef.where("letter", "==", currLetter).where("number", "==", j).get().then(function (querySnapshot) {
                if (!querySnapshot.empty && querySnapshot.docs[0].data().assets && Object.keys(querySnapshot.docs[0].data().assets).length > 0) {
                    callback(null);
                }
            })
        }
    }
    callback(true);
}

function deleteSingleRack(id, callback) {
    firebaseutils.racksRef.doc(id).get().then(function (doc) {
        if (doc.exists) {
            if (doc.data().assets && Object.keys(doc.data().assets).length > 0) {
                callback(null)
            } else {
                firebaseutils.racksRef.doc(id).delete().then(function () {
                    callback(id);
                }).catch(function (error) {
                    callback(null);
                })
            }
        } else {
            callback(null);
        }
    })
}

function getRackID(row, number, callback) {
    firebaseutils.racksRef.where("letter", "==", row).where("number", "==", parseInt(number)).get().then(function (querySnapshot) {
        if (!querySnapshot.empty) {
            callback(querySnapshot.docs[0].id);
        } else {
            callback(null);
        }
    })
}

function deleteRackRange(rowStart, rowEnd, numberStart, numberEnd, callback) {
    //first check all racks for instances
    //assume form validated
    let dbPromises = [];
    let rowStartNumber = rowStart.charCodeAt(0);
    let rowEndNumber = rowEnd.charCodeAt(0);
    let skippedRacks = [];
    checkAssets(rowStart, rowEnd, numberStart, numberEnd, status => {
        if (status) {
            for (let i = rowStartNumber; i <= rowEndNumber; i++) {
                let currLetter = String.fromCharCode(i);
                for (let j = numberStart; j <= numberEnd; j++) {
                    dbPromises.push(firebaseutils.racksRef.where("letter", "==", currLetter).where("number", "==", parseInt(j)).get().then(function (querySnapshot) {
                        if (!querySnapshot.empty) {
                            let docID;
                            docID = querySnapshot.docs[0].id;
                            if(!(querySnapshot.docs[0].data().assets && Object.keys(querySnapshot.docs[0].data().assets).length > 0)){
                                firebaseutils.racksRef.doc(docID).delete().catch(function (error) {
                                    callback(null);
                                })
                            }
                        }
                    }));
                }
            }
            Promise.all(dbPromises).then(() => {
                callback(true);
            })
        } else {
            callback(null);
        }
    })
}

function checkRackExists(letter, number, callback) {
    let parsedNumber = parseInt(number);
    firebaseutils.racksRef.where("letter", "==", letter).where("number", "==", parsedNumber).get().then(function (querySnapshot) {
        if (!querySnapshot.empty) {
            callback(true);
        } else {
            callback(false);
        }
    })
}

function generateRackDiagram(rackID, callback) {
    //first get all instances on rack
    //for each instance:
    //find position of instance
    //height as defined by model, hostname
    //find model vendor name
    let rackAssets = [];
    firebaseutils.racksRef.doc(rackID).get().then(function (docRefRack) {
        let letter = docRefRack.data().letter;
        let number = docRefRack.data().number;
        if (docRefRack.data().assets.length) {
            docRefRack.data().assets.forEach(assetID => {
                getAssetData(assetID, result => {
                    if (result) {
                        rackAssets.push(result);
                        if (rackAssets.length === docRefRack.data().assets.length) {
                            callback(letter, number, rackAssets);
                        }
                    }
                })
            })
        } else {
            callback(letter, number, []);
        }
    }).catch(function (error) {
        callback(null);
    })
}

function getAssetData(assetID, callback) {
    let position, model, hostname;
    firebaseutils.assetRef.doc(assetID).get().then(function (docRefAsset) {
        hostname = docRefAsset.data().hostname;
        position = docRefAsset.data().rackU;
        model = docRefAsset.data().model;
        getModelHeightColor(model, (height, color) => {
            if (height) {
                console.log("got the height for " + assetID)
                callback({
                    id: assetID,
                    model: model,
                    hostname: hostname,
                    height: height,
                    color: color,
                    position: position
                });
            } else {
                callback(null);
            }
        })
    }).catch(function (error) {
        console.log(error)
        callback(null);
    })
}

function getModelHeightColor(model, callback) {
    console.log("Attempting to get model " + model)
    modelutils.getModelByModelname(model, result => {
        if (result) {
            console.log("get A RESULT OF " + result)
            console.log(result.data());
            firebaseutils.modelsRef.doc(result.id).get().then(function (docRefModel) {
                callback(docRefModel.data().height, docRefModel.data().displayColor);
            }).catch(function (error) {
                console.log(error)
                callback(null);
            })
        } else {
            console.log("Couldn't find it")
            callback(null, null);
        }
    })
}

function checkAssetFits(position, height, rack, callback, id = null) { //rackU, modelHeight, rack
    //create promise array
    //create array of conflicting instances
    let conflicting = [];
    //generate all positions occupied in tentative instance
    let tentPositions = [];
    for (let i = position; i <= position + height; i++) {
        tentPositions.push(i);
        console.log("pushing " + i + " to array")
    }
    firebaseutils.racksRef.doc(rack).get().then(function (docRefRack) {
        let assetCount = 0;
        if (docRefRack.data().assets.length) {
            docRefRack.data().assets.forEach(assetID => {
                console.log("this rack contains " + assetID);
                firebaseutils.assetRef.doc(assetID).get().then(function (docRefAsset) {
                    if(assetID != id){
                     
                        console.log(docRefAsset)
                        modelutils.getModelByModelname(docRefAsset.data().model, result => {
                            if (result) {
                                console.log("found a model!")
                                console.log(result)
                                getModelHeightColor((docRefAsset.data().model), (height, color) => {
                                    if (height) {
                                        console.log("found the model height! " + height);
                                        let instPositions = [];
                                        for (let i = docRefAsset.data().rackU; i < docRefAsset.data().rackU + height; i++) {
                                            instPositions.push(i);
                                        }
                                        //check for intersection
                                        let intersection = tentPositions.filter(value => instPositions.includes(value));
                                        if (intersection.length) {
                                            console.log("conflicting!")
                                            conflicting.push(docRefAsset.id);
                                        }
                                        assetCount++;
                                        if (assetCount === docRefRack.data().assets.length) {
                                            callback(conflicting);
                                        }
                                    }
                                })
                            } else {
                                console.log("no models of that model")
                                callback(null);
                            }
                        })
                    } else {
                        assetCount++;
                        if (assetCount === docRefRack.data().assets.length) {
                            callback(conflicting);
                        }
                    }
                });
            });
            /*if(instanceCount === docRefRack.data().instances.length){
                Promise.all(dbPromises).then(() => {
                    console.log("done! calling back")
                    console.log("instancecount is " + instanceCount + " and length is " + docRefRack.data().instances.length)
                    callback(conflicting);
                })
            }*/
        } else {
            console.log("No conflicts found")
            callback([]);

        }
    }).catch(function (error) {
        console.log("No matching racks")
        callback(null);
    })
}

function generateRackUsageReport(rack, callback) {
    let used = 0;
    let vendorCounts = new Map();
    let modelCounts = new Map();
    let ownerCounts = new Map();
    firebaseutils.racksRef.doc(rack).get().then(function (docRefRack) {
        if (docRefRack.data().assets.length) {
            docRefRack.data().assets.forEach(assetID => {
                firebaseutils.assetRef.doc(assetID).get().then(function (docRefAsset) {
                    //update used count
                    getModelHeightColor(docRefAsset.data().model, (height, color) => {
                        //start with vendor
                        if (vendorCounts.has(docRefAsset.data().vendor)) {
                            vendorCounts.set(docRefAsset.data().vendor, vendorCounts.get(docRefAsset.data().vendor) + height);
                        } else {
                            vendorCounts.set(docRefAsset.data().vendor, height);
                        }
                        //then model
                        if (modelCounts.has(docRefAsset.data().modelNumber)) {
                            modelCounts.set(docRefAsset.data().modelNumber, modelCounts.get(docRefAsset.data().modelNumber) + height);
                        } else {
                            modelCounts.set(docRefAsset.data().modelNumber, height);
                        }

                        //then owner
                        let owner = docRefAsset.data().owner ? docRefAsset.data().owner : "No owner";
                        if (ownerCounts.has(owner)) {
                            ownerCounts.set(owner, ownerCounts.get(owner) + height);
                        } else {
                            ownerCounts.set(owner, height);
                        }

                        used += height;
                        callback(used, docRefRack.data().height, vendorCounts, modelCounts, ownerCounts);
                    });
                })
            })
        } else {
            //no instances
            callback(0, docRefRack.data().height, new Map(), new Map(), new Map());
        }
    }).catch(function (error) {
        console.log("couldn't find")
        callback(null);
    })
}

function generateAllRackUsageReports(callback) {
    let usedCount = 0;
    let vendorCounts = new Map();
    let modelCounts = new Map();
    let ownerCounts = new Map();
    let queryCount = 0;
    firebaseutils.assetRef.get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            console.log(" in the foreach for doc " + doc);
            /* generateRackUsageReport(doc.id, (used, height, vendor, model, owner) => {
                 //if(used) {
                     console.log("yeeeeeeeeeeeeeeeeeeeeeet")
                     usedCount += used;
                     totalHeight += height;
                     vendorCounts = new Map([...vendorCounts, ...vendor]);
                     modelCounts = new Map([...modelCounts, ...model]);
                     ownerCounts = new Map([...ownerCounts, ...owner]);
                     queryCount++;
                     if(queryCount === querySnapshot.size){
                         console.log("count");
                         console.log(usedCount);
                         console.log("vendor map");
                         console.log(vendorCounts);
                         callback(usedCount, totalHeight, vendorCounts, modelCounts, ownerCounts);
                     }
 /!*                } else {
                     callback(null);
                 }*!/
             })*/
            getModelHeightColor(doc.data().model, (height, color) => {
                if (height) {
//start with vendor
                    if (vendorCounts.has(doc.data().vendor)) {
                        vendorCounts.set(doc.data().vendor, vendorCounts.get(doc.data().vendor) + height);
                    } else {
                        vendorCounts.set(doc.data().vendor, height);
                    }
                    //then model
                    if (modelCounts.has(doc.data().modelNumber)) {
                        modelCounts.set(doc.data().modelNumber, modelCounts.get(doc.data().modelNumber) + height);
                    } else {
                        modelCounts.set(doc.data().modelNumber, height);
                    }

                    //then owner
                    if (ownerCounts.has(doc.data().owner)) {
                        ownerCounts.set(doc.data().owner, ownerCounts.get(doc.data().owner) + height);
                    } else {
                        ownerCounts.set(doc.data().owner, height);
                    }

                    usedCount += height;
                    queryCount = queryCount + 1;
                    console.log("querycount is " + queryCount)
                    if (queryCount === querySnapshot.size) {
                        getTotalRackHeight(result => {
                            if(result){
                                callback(usedCount, result, vendorCounts, modelCounts, ownerCounts)
                            } else {
                                console.log("failing here " + result)
                                callback(null);
                            }
                        })
                    }
                } else {
                    console.log("this failed")
                    callback(null);
                }
            });
        })
    }).catch(function (error) {
        callback(null);
    })
}

function getTotalRackHeight(callback){
    let height = 0;
    let count = 0;
    firebaseutils.racksRef.get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            if(!isNaN(doc.data().height)){
                height += parseInt(doc.data().height);
                console.log("just added a height of " + doc.data().height)
            }
            count++;
            if(count === querySnapshot.size){
                callback(height);
            }
        })
    }).catch(function (error) {
        console.log("about to errrrrr")
        console.log(error)
        callback(null);
    })
}

export {
    getRackAt,
    addSingleRack,
    addRackRange,
    deleteSingleRack,
    deleteRackRange,
    generateRackDiagram,
    getRackID,
    checkAssetFits,
    generateRackUsageReport,
    generateAllRackUsageReports
}