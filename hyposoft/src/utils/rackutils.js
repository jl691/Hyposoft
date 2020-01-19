import {racksRef} from "./firebaseutils";

function getRacks(callback) {
    const itemsArray = [];
    racksRef.get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            itemsArray.push({
                id: doc.id,
                letter: doc.data().letter,
                number: doc.data().number,
                height: doc.data().height,
                instances: Object.keys(doc.data().instances).length
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

export {getRacks, addSingleRack}