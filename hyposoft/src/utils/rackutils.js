import * as firebaseutils from "./firebaseutils";

function getRackAt(start, callback) {
    firebaseutils.racksRef.orderBy("letter").orderBy("number").limit(25).startAfter(start).get().then(docSnaps => {
        const newStart = docSnaps.docs[docSnaps.docs.length - 1];
        const racks = docSnaps.docs.map(doc => (
            {
                id: doc.id,
                letter: doc.data().letter,
                number: doc.data().number,
                height: doc.data().height,
                instances: (doc.data().instances ? Object.keys(doc.data().instances).length : 0)
            }));
        callback(newStart, racks);
    }).catch(function (error) {
        callback(null, null);
    })
}

function getRacks(callback) {
    firebaseutils.racksRef.orderBy("letter").orderBy("number").limit(25).get().then(docSnaps => {
        const startAfter = docSnaps.docs[docSnaps.docs.length - 1]
        const racks = docSnaps.docs.map(doc => (
            {
                id: doc.id,
                letter: doc.data().letter,
                number: doc.data().number,
                height: doc.data().height,
                instances: (doc.data().instances ? Object.keys(doc.data().instances).length : 0)
            }
        )
        )
        callback(startAfter, racks);
    }).catch(function (error) {
        callback(null, null);
    })
}

function addSingleRack(row, number, height, callback) {
    //assume form validated
    checkRackExists(row, number, status => {
        if (!status) {
            firebaseutils.racksRef.add({
                letter: row,
                number: number,
                height: height,
                instances: []
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
    for (let i = rowStartNumber; i <= rowEndNumber; i++) {
        let currLetter = String.fromCharCode(i);
        for (let j = numberStart; j <= numberEnd; j++) {
            checkRackExists(currLetter, j, status => {
                if (!status) {
                    dbPromises.push(firebaseutils.racksRef.add({
                        letter: currLetter,
                        number: j,
                        height: height,
                        instances: []
                    }).catch(function (error) {
                        callback(null);
                    }))
                }
            })
        }
    }
    Promise.all(dbPromises).then(() => {
        callback(true);
    })
}

function checkInstances(rowStart, rowEnd, numberStart, numberEnd, callback) {
    let rowStartNumber = rowStart.charCodeAt(0);
    let rowEndNumber = rowEnd.charCodeAt(0);
    for (let i = rowStartNumber; i <= rowEndNumber; i++) {
        let currLetter = String.fromCharCode(i);
        for (let j = numberStart; j <= numberEnd; j++) {
            firebaseutils.racksRef.where("letter", "==", currLetter).where("number", "==", j).get().then(function (querySnapshot) {
                if (!querySnapshot.empty && querySnapshot.docs[0].data().instances && Object.keys(querySnapshot.docs[0].data().instances).length > 0) {
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
            if (doc.data().instances && Object.keys(doc.data().instances).length > 0) {
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
    checkInstances(rowStart, rowEnd, numberStart, numberEnd, status => {
        if (status) {
            for (let i = rowStartNumber; i <= rowEndNumber; i++) {
                let currLetter = String.fromCharCode(i);
                for (let j = numberStart; j <= numberEnd; j++) {
                    dbPromises.push(firebaseutils.racksRef.where("letter", "==", currLetter).where("number", "==", parseInt(j)).get().then(function (querySnapshot) {
                        if (!querySnapshot.empty) {
                            let docID;
                            docID = querySnapshot.docs[0].id;
                            firebaseutils.racksRef.doc(docID).delete().catch(function (error) {
                                callback(null);
                            })
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
    let rackInstances = [];
    firebaseutils.racksRef.doc(rackID).get().then(function (docRefRack) {
        let letter = docRefRack.data().letter;
        let number = docRefRack.data().number;
        if (docRefRack.data().instances.length) {
            docRefRack.data().instances.forEach(instanceID => {
                getInstanceData(instanceID, result => {
                    if (result) {
                        rackInstances.push(result);
                        if (rackInstances.length === docRefRack.data().instances.length) {
                            callback(letter, number, rackInstances);
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

function getInstanceData(instanceID, callback) {
    let position, model, hostname;
    firebaseutils.instanceRef.doc(instanceID).get().then(function (docRefInstance) {
        hostname = docRefInstance.data().hostname;
        position = docRefInstance.data().rackU;
        model = docRefInstance.data().model;
        getModelHeightColor(model, (height, color) => {
            if (height) {
                callback({
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
        callback(null);
    })
}

function getModelHeightColor(model, callback) {
    firebaseutils.modelsRef.doc(model).get().then(function (docRefModel) {
        callback(docRefModel.data().height, docRefModel.data().displayColor);
    }).catch(function (error) {
        console.log(error)
        callback(null);
    })
}

function checkInstanceFits(position, height, rack, callback) { //rackU, modelHeight, rackID
    console.log("1. attempting to find rack with id " + rack)
    //create promise array
    let dbPromises = [];
    //create array of conflicting instances
    let conflicting = [];
    //generate all positions occupied in tentative instance
    let tentPositions = [];

    var thisInstanceHeight = null;
   
    for (let i = position; i < position + height; i++) {
        console.log("2. Pushing to tent positions: " + i)
        tentPositions.push(i);
    }

    firebaseutils.racksRef.doc(rack).get().then(function (docRefRack) {
        if (docRefRack.data().instances.length) {
            console.log("3. found rack with ID with instances on it")
            docRefRack.data().instances.forEach(instanceID => {
                console.log("4. In the for each")
                
                dbPromises.push(firebaseutils.instanceRef.doc(instanceID).get().then(function (docRefInstance) {
                    //find height
                    //getModelHeightColor
                    // firebaseutils.modelsRef.doc(docRefInstance.data().model).get().then(function (modelDoc) {
                    //     console.log(modelDoc.data().height)
                    //     var thisInstanceHeight=modelDoc.data().height


                    // })
                   
                    //For debugging
                    console.log("5. InstanceID: " + instanceID)
                    console.log("6. Model: " + docRefInstance.data().model)
                    console.log("7. height from query: " + thisInstanceHeight)

                    let instPositions = [];

                    //TODO:  thisInstanceHeight works??
                    for (let i = docRefInstance.data().rackU; i < docRefInstance.data().rackU + height; i++) {
                        console.log("Pushing instance positions: " + i)
                        instPositions.push(i);
                    }
                    //check for intersection
                    let intersection = tentPositions.filter(value => instPositions.includes(value));
                    console.log("8. Intersection length: " + intersection.length)

                    if (intersection.length) {
                        console.log("9. Conflicts were found, now pushing to array: " + docRefInstance.id)
                        conflicting.push(docRefInstance.id);
                    }
                }

                ));
            });
            Promise.all(dbPromises).then(() => {
                console.log("10. Please end my life. Conflicting instances: " + conflicting)
                callback(conflicting);
            })
        } else {
            console.log("11. no conflicting instances were found")
            callback([]);
        }
    }).catch(function (error) {

        console.log("12. Error in checkInstanceFits in rackutils: " + error)
        callback(null);
    })
}

function generateRackUsageReport(rack, callback) {
    let used = 0;
    let vendorCounts = new Map();
    let modelCounts = new Map();
    let ownerCounts = new Map();
    firebaseutils.racksRef.doc(rack).get().then(function (docRefRack) {
        if (docRefRack.data().instances.length) {
            docRefRack.data().instances.forEach(instanceID => {
                firebaseutils.instanceRef.doc(instanceID).get().then(function (docRefInstance) {
                    //update used count
                    getModelHeightColor(docRefInstance.data().model, (height, color) => {
                        //start with vendor
                        if (vendorCounts.has(docRefInstance.data().vendor)) {
                            vendorCounts.set(docRefInstance.data().vendor, vendorCounts.get(docRefInstance.data().vendor) + height);
                        } else {
                            vendorCounts.set(docRefInstance.data().vendor, height);
                        }
                        //then model
                        if (modelCounts.has(docRefInstance.data().modelNumber)) {
                            modelCounts.set(docRefInstance.data().modelNumber, modelCounts.get(docRefInstance.data().modelNumber) + height);
                        } else {
                            modelCounts.set(docRefInstance.data().modelNumber, height);
                        }

                        //then owner
                        if (ownerCounts.has(docRefInstance.data().owner)) {
                            ownerCounts.set(docRefInstance.data().owner, ownerCounts.get(docRefInstance.data().owner) + height);
                        } else {
                            ownerCounts.set(docRefInstance.data().owner, height);
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

export { getRackAt, getRacks, addSingleRack, addRackRange, deleteSingleRack, deleteRackRange, generateRackDiagram, getRackID, checkInstanceFits, generateRackUsageReport }