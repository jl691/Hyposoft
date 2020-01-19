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

function addRackRange(rowStart, rowEnd, numberStart, numberEnd, height, callback){
    //assume form validated
    let rowStartNumber = rowStart.charCodeAt(0);
    console.log(rowStart);
    console.log(rowStartNumber);
    let rowEndNumber = rowEnd.charCodeAt(0);
    console.log(rowEnd);
    console.log(rowEndNumber);
    for(let i=rowStartNumber; i<=rowEndNumber; i++){
        let currLetter = String.fromCharCode(i);
        console.log(currLetter);
        for(let j=numberStart; j<=numberEnd; j++){
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

export {getRacks, addSingleRack, addRackRange}