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

export {getRacks}