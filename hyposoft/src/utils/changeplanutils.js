import * as firebaseutils from "./firebaseutils";
import * as assetnetworkportutils from "./assetnetworkportutils";
import * as logutils from "./logutils"
import {changeplansRef} from "./firebaseutils";
import {assetRef} from "./firebaseutils";

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
    firebaseutils.changeplansRef.doc(changePlanID).collection("changes").orderBy("step").get().then(function (querySnapshot) {
        if(!querySnapshot.empty){
            let changes = [];
            let count = 0;
            querySnapshot.docs.forEach(change => {
                let newStart = querySnapshot.docs[querySnapshot.docs.length - 1];
                changes.push({id: change.data().step, ...change.data()})
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
    firebaseutils.changeplansRef.doc(changePlanID).collection("changes").where("step", "==", parseInt(stepID)).get().then(function (querySnapshot) {
        if(!querySnapshot.empty){
            callback(querySnapshot.docs[0].data());
        } else {
            callback(null);
        }
    }).catch(function (error) {
        console.log(error)
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
    firebaseutils.changeplansRef.doc(id).collection("changes").get().then(function (querySnapshot) {
        if(!querySnapshot.empty){
            querySnapshot.docs.forEach(doc => {
                firebaseutils.changeplansRef.doc(id).collection("changes").doc(doc.id).delete().catch(function () {
                    callback(null);
                })
            })
        }
    }).catch(function () {
        callback(null);
    });
    firebaseutils.changeplansRef.doc(id).collection("conflicts").get().then(function (querySnapshot) {
        if(!querySnapshot.empty){
            querySnapshot.docs.forEach(doc => {
                firebaseutils.changeplansRef.doc(id).collection("conflicts").doc(doc.id).delete().catch(function () {
                    callback(null);
                })
            })
        }
    }).catch(function () {
        callback(null);
    });
    firebaseutils.changeplansRef.doc(id).delete().then(function () {
        callback(true);
    }).catch(function () {
        callback(null);
    })
}

function editChangePlan(id, newName, callback){
    firebaseutils.changeplansRef.doc(id).update({
        name: newName
    }).then(function () {
        callback(true)
    }).catch(function () {
        callback(null)
    })
}

function addAssetChange(asset, assetID, changePlanID, callback){
    changeplansRef.doc(changePlanID).collection("changes").orderBy("step", "desc").limit(1).get().then(function (querySnapshot) {
        let changeNumber = querySnapshot.empty ? 1 : parseInt(querySnapshot.docs[0].data().step)+1;
        let assetChangePlanObject = {
            assetID: assetID,
            change: "add",
            changes: {},
            step: changeNumber
        };
        Object.keys(asset).forEach(assetProperty => {
            if(asset[assetProperty] && (typeof asset[assetProperty] !== "object" || (typeof asset[assetProperty] === "object" && Object.keys(asset[assetProperty]).length))){
                let oldProperty = (assetProperty === "networkConnections" || assetProperty === "macAddresses") ? {} : (assetProperty === "powerConnections" ? [] : "");
                assetChangePlanObject.changes = {
                    ...assetChangePlanObject.changes,
                    [assetProperty]: {
                        old: oldProperty,
                        new: asset[assetProperty]
                    }
                }
            }
        });
        changeplansRef.doc(changePlanID).collection("changes").add(assetChangePlanObject).then(function () {
            //network ports need to be done at time of execution
            //so does power port and logging
            callback(true);
        }).catch(function (error) {
            console.log(error);
            callback(null);
        });
    }).catch(function (error) {
        console.log(error);
        callback(null);
    })
}

function editAssetChange(newAsset, assetID, changePlanID, callback){
    changeplansRef.doc(changePlanID).collection("changes").orderBy("step", "desc").limit(1).get().then(function (querySnapshot) {
        let changeNumber = querySnapshot.empty ? 1 : parseInt(querySnapshot.docs[0].data().step)+1;
        let assetChangePlanObject = {
            assetID: assetID,
            change: "edit",
            changes: {},
            step: changeNumber
        };
        assetRef.doc(assetID).get().then(function (documentSnapshot) {
            if(documentSnapshot.exists){
                let oldAsset = documentSnapshot.data();
                Object.keys(newAsset).forEach(assetProperty => {
                    if((typeof oldAsset[assetProperty] === "object" && !logutils.isEqual(oldAsset[assetProperty], newAsset[assetProperty])) || (typeof oldAsset[assetProperty] !== "object" && oldAsset[assetProperty] !== newAsset[assetProperty])){
                        assetChangePlanObject.changes = {
                            ...assetChangePlanObject.changes,
                            [assetProperty]: {
                                old: oldAsset[assetProperty],
                                new: newAsset[assetProperty]
                            }
                        }
                    }
                });
                changeplansRef.doc(changePlanID).collection("changes").add(assetChangePlanObject).then(function () {
                    //network ports need to be done at time of execution
                    //so does power port and logging
                    callback(true);
                }).catch(function (error) {
                    console.log(error);
                    callback(null);
                });
            } else {
                callback(null);
            }
        });
    }).catch(function () {
        callback(null);
    })
}

function deleteChange(changePlanID, stepNum, callback){
    changeplansRef.doc(changePlanID).collection("changes").where("step", "==", parseInt(stepNum)).get().then(function (querySnapshot) {
        if(querySnapshot.empty){
            callback(null);
        } else {
            changeplansRef.doc(querySnapshot.docs[0].id).delete().then(function () {
                cascadeUpStepNumbers(changePlanID, stepNum, result => {
                    if(result){
                        callback(true)
                    } else {
                        callback(null);
                    }
                })
            }).catch(function () {
                callback(null);
            })
        }
    }).catch(function () {
        callback(null);
    })
}

function cascadeUpStepNumbers(changePlanID, stepDeleted, callback){
    changeplansRef.doc(changePlanID).collection("changes").where("step", ">", parseInt(stepDeleted)).get().then(function (querySnapshot) {
        if(querySnapshot.empty){
            callback(true);
        } else {
            let count = 0;
            querySnapshot.docs.forEach(doc => {
                changeplansRef.doc(changePlanID).collection("changes").doc(doc.id).update({
                    step: doc.data().step - 1
                }).then(function () {
                    count++;
                    if(count === querySnapshot.size){
                        callback(true);
                    }
                }).catch(function () {
                    callback(null);
                })
            })
        }
    }).catch(function () {
        callback(null);
    })
}

function isEqual(value, other) {
    // Get the value type
    var type = Object.prototype.toString.call(value);
    // If the two objects are not the same type, return false
    if (type !== Object.prototype.toString.call(other)) return false;
    // If items are not an object or array, return false
    if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;
    // Compare the length of the length of the two items
    var valueLen = type === '[object Array]' ? value.length : Object.keys(value).length;
    var otherLen = type === '[object Array]' ? other.length : Object.keys(other).length;
    if (valueLen !== otherLen) return false;
    // Compare two items
    var compare = function (item1, item2) {
        // Get the object type
        var itemType = Object.prototype.toString.call(item1);
        // If an object or array, compare recursively
        if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
            if (!isEqual(item1, item2)) return false;
        }
        // Otherwise, do a simple comparison
        else {
            // If the two items are not the same type, return false
            if (itemType !== Object.prototype.toString.call(item2)) return false;
            // Else if it's a function, convert to a string and compare
            // Otherwise, just compare
            if (itemType === '[object Function]') {
                if (item1.toString() !== item2.toString()) return false;
            } else {
                if (item1 !== item2) return false;
            }

        }
    };
    // Compare properties
    if (type === '[object Array]') {
        for (var i = 0; i < valueLen; i++) {
            if (compare(value[i], other[i]) === false) return false;
        }
    } else {
        for (var key in value) {
            if (value.hasOwnProperty(key)) {
                if (compare(value[key], other[key]) === false) return false;
            }
        }
    }
    // If nothing failed, return true
    return true;
};

export { getChangePlans, getChanges, getChangeDetails, addChangePlan, deleteChangePlan, editChangePlan, addAssetChange, editAssetChange }