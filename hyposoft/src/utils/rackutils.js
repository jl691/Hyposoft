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
                if(!status){
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

function getRackID(row, number, callback){
    firebaseutils.racksRef.where("letter", "==", row).where("number", "==", parseInt(number)).get().then(function (querySnapshot) {
        if(!querySnapshot.empty){
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
            console.log(letter + number + " exists!")
            console.log(querySnapshot.docs[0].id)
            callback(true);
        } else {
            callback(false);
        }
    })
}

function generateRackDiagram(rackID, callback){
    //first get all instances on rack
    //for each instance:
    //find position of instance
    //height as defined by model, hostname
    //find model vendor name
    let rackInstances = [];
    firebaseutils.racksRef.doc(rackID).get().then(function (docRefRack) {
        let letter = docRefRack.data().letter;
        let number = docRefRack.data().number;
        console.log(letter + number);
        if(docRefRack.data().instances.length){
            docRefRack.data().instances.forEach(instanceID => {
                getInstanceData(instanceID, result => {
                    console.log(result)
                    if(result) {
                        console.log("pushing")
                        rackInstances.push(result);
                        if(rackInstances.length === docRefRack.data().instances.length){
                            callback(letter, number, rackInstances);
                        }
                    } else {
                        console.log("4");
                    }
                })
            })
        } else {
            callback(letter, number, []);
        }
    }).catch(function (error) {
        console.log("3");
        callback(null);
    })
}

function getInstanceData(instanceID, callback){
    let position, model, hostname;
    firebaseutils.instancesRef.doc(instanceID.trim()).get().then(function (docRefInstance) {
        model = docRefInstance.data().model;
        hostname = docRefInstance.data().hostname;
        position = docRefInstance.data().rackU;
        getModelHeightColor(model, (height, color) => {
            if(height){
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
        console.log("1");
        callback(null);
    })
}

export {getRackAt, getRacks, addSingleRack, addRackRange, deleteSingleRack, deleteRackRange, generateRackDiagram, getRackID}