import {racksRef} from "./firebaseutils";

function getRacks(callback) {
    const itemsArray = [];
    racksRef.orderBy("letter").orderBy("number").get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            let instanceCount = doc.data().instances ? Object.keys(doc.data().instances).length : 0;
            itemsArray.push({
                id: doc.id,
                letter: doc.data().letter,
                number: doc.data().number,
                height: doc.data().height,
                instances: instanceCount
            });
        });
        if (callback) {
            callback(itemsArray);
        }
    });
}

function addSingleRack(row, number, height, callback) {
    //assume from validated
    racksRef.add({
        letter: row,
        number: number,
        height: height,
        instances: []
    }).then(function (docRef) {
        callback(docRef.id);
    }).catch(function (error) {
        callback(null);
    })
}

function addRackRange(rowStart, rowEnd, numberStart, numberEnd, height, callback) {
    //assume form validated
    let rowStartNumber = rowStart.charCodeAt(0);
    let rowEndNumber = rowEnd.charCodeAt(0);
    for (let i = rowStartNumber; i <= rowEndNumber; i++) {
        let currLetter = String.fromCharCode(i);
        for (let j = numberStart; j <= numberEnd; j++) {
            racksRef.add({
                letter: currLetter,
                number: j,
                height: height,
                instances: []
            }).catch(function (error) {
                callback(null);
            })
        }
    }
    callback(true);
}

function checkInstances(rowStart, rowEnd, numberStart, numberEnd, callback){
    let rowStartNumber = rowStart.charCodeAt(0);
    let rowEndNumber = rowEnd.charCodeAt(0);
    for (let i = rowStartNumber; i <= rowEndNumber; i++) {
        let currLetter = String.fromCharCode(i);
        for (let j = numberStart; j <= numberEnd; j++) {
            racksRef.where("letter", "==", currLetter).where("number", "==", j).get().then(function (querySnapshot) {
                if(!querySnapshot.empty && querySnapshot.docs[0].data().instances && Object.keys(querySnapshot.docs[0].data().instances).length > 0){
                    callback(null);
                }
            })
        }
    }
    callback(true);
}

function deleteSingleRack(id, callback) {
    racksRef.doc(id).get().then(function (doc) {
        if(doc.exists){
            if(doc.data().instances &&  Object.keys(doc.data().instances).length > 0){
                callback(null)
            }
            else {
                racksRef.doc(id).delete().then(function () {
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

function deleteRackRange(rowStart, rowEnd, numberStart, numberEnd, callback){
    //first check all racks for instances
    //assume form validated
    let rowStartNumber = rowStart.charCodeAt(0);
    let rowEndNumber = rowEnd.charCodeAt(0);
    checkInstances(rowStart, rowEnd, numberStart, numberEnd, status => {
        if(status){
            for (let i = rowStartNumber; i <= rowEndNumber; i++) {
                let currLetter = String.fromCharCode(i);
                for (let j = numberStart; j <= numberEnd; j++) {
                    console.log("Checking for " + currLetter + j);
                    console.log("the current value of j is" + j);
                    racksRef.where("letter", "==", currLetter).where("number", "==", parseInt(j)).get().then(function (querySnapshot) {
                        console.log(querySnapshot)
                        if(!querySnapshot.empty){
                            console.log(currLetter + j + "exists!")
                            let docID;
                            docID = querySnapshot.docs[0].id;
                            racksRef.doc(docID).delete().catch(function (error) {
                                callback(null);
                            })
                        }
                    })
                }
            }
            callback(true);
        }
        else {
            callback(null);
        }
    })
}

export {getRacks, addSingleRack, addRackRange, deleteSingleRack, deleteRackRange}