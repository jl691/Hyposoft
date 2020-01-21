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
    //assume from validated
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
                    }));
                }
                else {
                    console.log("not adding " + currLetter + j + " bc it already exists!")
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

function deleteRackRange(rowStart, rowEnd, numberStart, numberEnd, callback) {
    //first check all racks for instances
    //assume form validated
    let rowStartNumber = rowStart.charCodeAt(0);
    let rowEndNumber = rowEnd.charCodeAt(0);
    checkInstances(rowStart, rowEnd, numberStart, numberEnd, status => {
        if (status) {
            for (let i = rowStartNumber; i <= rowEndNumber; i++) {
                let currLetter = String.fromCharCode(i);
                for (let j = numberStart; j <= numberEnd; j++) {
                    firebaseutils.racksRef.where("letter", "==", currLetter).where("number", "==", parseInt(j)).get().then(function (querySnapshot) {
                        if (!querySnapshot.empty) {
                            let docID;
                            docID = querySnapshot.docs[0].id;
                            firebaseutils.racksRef.doc(docID).delete().catch(function (error) {
                                callback(null);
                            })
                        }
                    })
                }
            }
            callback(true);
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

export {getRackAt, getRacks, addSingleRack, addRackRange, deleteSingleRack, deleteRackRange}