import * as firebaseutils from "./firebaseutils";

function getChangePlans(itemCount, callback, start = null) {
    let query = start ? firebaseutils.changeplansRef.orderBy("name").startAfter(start).limit(25) : firebaseutils.changeplansRef.orderBy("name").limit(25);
    query.get().then(function (querySnapshot) {
        if(querySnapshot.empty){
            callback(null, null, null, true);
        } else {
            let newStart = querySnapshot.docs[querySnapshot.docs.length - 1];
            let count = 0;
            let changePlans = [];
            querySnapshot.docs.forEach(changePlan => {
                changePlans.push({id: changePlan.id, count: itemCount++, ...changePlan.data()});
                count++;
                if(count === querySnapshot.size){
                    callback(itemCount, newStart, changePlans, false);
                }
            })
        }
    }).catch(function (error) {
        callback(null);
    })
}

function getChanges(changePlanID, callback){
    firebaseutils.changeplansRef.doc(changePlanID).collection("changes").get().then(function (querySnapshot) {
        if(!querySnapshot.empty){
            let changes = [];
            let count = 0;
            querySnapshot.docs.forEach(change => {
                let newStart = querySnapshot.docs[querySnapshot.docs.length - 1];
                changes.push({id: change.id, ...change.data()})
                count++;
                if(count === querySnapshot.size){
                    callback(newStart, changes, false)
                }
            })
        } else {
            callback(null, null, true);
        }
    }).catch(function (error) {
        callback(null, null, null);
    })
}

function getChangeDetails(changePlanID, stepID, callback) {
    firebaseutils.changeplansRef.doc(changePlanID).collection("changes").doc(stepID).get().then(function (documentSnapshot) {
        if(documentSnapshot.exists){
            callback(documentSnapshot.data());
        } else {
            callback(null);
        }
    }).catch(function (error) {
        callback(null);
    })
}

function addChangePlan(name, owner, callback){
    firebaseutils.changeplansRef.add({
        name: name,
        owner: owner,
        executed: false
    }).then(function () {
        callback(true);
    }).catch(function () {
        callback(null);
    })
}

function deleteChangePlan(id, callback){
    firebaseutils.changeplansRef.doc(id).delete().then(function () {
        callback(true);
    }).catch(function () {
        callback(null);
    })
}

export { getChangePlans, getChanges, getChangeDetails, addChangePlan, deleteChangePlan }