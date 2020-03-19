import * as firebaseutils from "./firebaseutils";
import * as assetnetworkportutils from "./assetnetworkportutils";
import * as logutils from "./logutils"
import * as assetutils from "./assetutils"
import * as rackutils from "./rackutils"
import * as decommissionutils from "./decommissionutils"
import {changeplansRef} from "./firebaseutils";
import {assetRef} from "./firebaseutils";
import {racksRef} from "./firebaseutils";
import {firebase} from "./firebaseutils";
import * as assetIDutils from "./assetidutils";

function getChangePlans(itemCount, username, callback, start = null) {
    console.log(username)
    let query = start ? firebaseutils.changeplansRef.where("owner", "==", username).orderBy("name").startAfter(start).limit(25) : firebaseutils.changeplansRef.where("owner", "==", username).orderBy("name").limit(25);
    query.get().then(function (querySnapshot) {
        if (querySnapshot.empty) {
            callback(null, null, null, true);
        } else {
            let newStart = querySnapshot.docs[querySnapshot.docs.length - 1];
            let count = 0;
            let changePlans = [];
            querySnapshot.docs.forEach(changePlan => {
                changePlans.push({id: changePlan.id, count: itemCount++, ...changePlan.data()});
                count++;
                if (count === querySnapshot.size) {
                    callback(itemCount, newStart, changePlans, false);
                }
            })
        }
    }).catch(function (error) {
        console.log(error)
        callback(null);
    })
}

function getChanges(changePlanID, username, callback) {
    firebaseutils.changeplansRef.doc(changePlanID).get().then(function (documentSnapshot) {
        if (documentSnapshot.exists && documentSnapshot.data().owner === username) {
            firebaseutils.changeplansRef.doc(changePlanID).collection("changes").orderBy("step").get().then(function (querySnapshot) {
                if (!querySnapshot.empty) {
                    let changes = [];
                    let count = 0;
                    querySnapshot.docs.forEach(change => {
                        let newStart = querySnapshot.docs[querySnapshot.docs.length - 1];
                        changes.push({id: change.data().step, ...change.data()})
                        count++;
                        if (count === querySnapshot.size) {
                            callback(newStart, changes, false)
                        }
                    })
                } else {
                    callback(null, null, true);
                }
            }).catch(function (error) {
                callback(null, null, null);
            })
        } else {
            callback(null, null, true);
        }
    }).catch(function () {
        callback(null, null, null);
    })
}

function getChangeDetails(changePlanID, stepID, username, callback) {
    //console.log("this is the stepId: " + stepID)
    firebaseutils.changeplansRef.doc(changePlanID).get().then(function (documentSnapshot) {
        if (documentSnapshot.exists && documentSnapshot.data().owner === username) {
            firebaseutils.changeplansRef.doc(changePlanID).collection("changes").where("step", "==", parseInt(stepID)).get().then(function (querySnapshot) {
                if (!querySnapshot.empty) {
                    console.log(querySnapshot.docs[0].data())
                    callback(querySnapshot.docs[0].data());
                } else {
                    callback(null);
                }
            }).catch(function (error) {
                console.log(error)
                callback(null);
            })
        } else {
            callback(null);
        }
    })
}

function getStepDocID(changePlanID,stepNum, callback){
    firebaseutils.changeplansRef.doc(changePlanID).collection("changes").where("step", "==", stepNum).get().then(function (querySnapshot) {
        querySnapshot.forEach(function(doc) {
            // doc.data() is never undefined for query doc snapshots
            //for some reason only this works to get the document id?? whatever fuck it i don't care anymore
            console.log(doc.id);
            callback(doc.id)
        });


        // if(doc.exists){
        //     console.log(doc.id)
            
        //     callback(doc.id)
        // }
    })
}

function addChangePlan(name, owner, callback) {
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

function deleteChangePlan(id, callback) {
    firebaseutils.changeplansRef.doc(id).collection("changes").get().then(function (querySnapshot) {
        if (!querySnapshot.empty) {
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
        if (!querySnapshot.empty) {
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

function editChangePlan(id, newName, callback) {
    firebaseutils.changeplansRef.doc(id).update({
        name: newName
    }).then(function () {
        callback(true)
    }).catch(function () {
        callback(null)
    })
}

function addAssetChange(asset, assetID, changePlanID, callback) {
    console.log(assetID)
    changeplansRef.doc(changePlanID).collection("changes").orderBy("step", "desc").limit(1).get().then(function (querySnapshot) {
        let changeNumber = querySnapshot.empty ? 1 : parseInt(querySnapshot.docs[0].data().step) + 1;
        let assetChangePlanObject = {
            assetID: assetID ? parseInt(assetID) : "",
            change: "add",
            changes: {},
            step: changeNumber
        };
        console.log(asset);
        Object.keys(asset).forEach(assetProperty => {
            //if (typeof asset[assetProperty] !== "object" || (typeof asset[assetProperty] === "object" && Object.keys(asset[assetProperty]).length)) {
                let oldProperty = (assetProperty === "networkConnections" || assetProperty === "macAddresses") ? {} : (assetProperty === "powerConnections" ? [] : "");
                assetChangePlanObject.changes = {
                    ...assetChangePlanObject.changes,
                    [assetProperty]: {
                        old: oldProperty,
                        new: asset[assetProperty]
                    }
                }
            //}
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

function editAssetChange(newAsset, assetID, changePlanID, callback) {
    changeplansRef.doc(changePlanID).collection("changes").orderBy("step", "desc").limit(1).get().then(function (querySnapshot) {
        let changeNumber = querySnapshot.empty ? 1 : parseInt(querySnapshot.docs[0].data().step) + 1;
        let assetChangePlanObject = {
            assetID: parseInt(assetID),
            change: "edit",
            changes: {},
            step: changeNumber
        };
        assetRef.doc(assetID).get().then(function (documentSnapshot) {
            if (documentSnapshot.exists) {
                let oldAsset = documentSnapshot.data();
                Object.keys(newAsset).forEach(assetProperty => {
                    if ((typeof oldAsset[assetProperty] === "object" && !isEqual(oldAsset[assetProperty], newAsset[assetProperty])) || (typeof oldAsset[assetProperty] !== "object" && oldAsset[assetProperty] !== newAsset[assetProperty])) {
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

function decommissionAssetChange(assetID, changePlanID, callback){
    changeplansRef.doc(changePlanID).collection("changes").orderBy("step", "desc").limit(1).get().then(function (querySnapshot) {
        let changeNumber = querySnapshot.empty ? 1 : parseInt(querySnapshot.docs[0].data().step) + 1;
        assetRef.doc(assetID).get().then(function (documentSnapshot) {
            if(documentSnapshot.exists){
                changeplansRef.doc(changePlanID).collection("changes").add({
                    assetID: parseInt(assetID),
                    change: "decommission",
                    step: changeNumber
                }).then(function () {
                    callback(true);
                }).catch(function () {
                    callback(null);
                })
            } else {
                callback(null);
            }
        }).catch(function () {
            callback(null);
        })
    })
}

function deleteChange(changePlanID, stepNum, callback) {
    changeplansRef.doc(changePlanID).collection("changes").where("step", "==", parseInt(stepNum)).get().then(function (querySnapshot) {
        if (querySnapshot.empty) {
            callback(null);
        } else {
            changeplansRef.doc(changePlanID).collection("changes").doc(querySnapshot.docs[0].id).delete().then(function () {
                cascadeUpStepNumbers(changePlanID, stepNum, result => {
                    if (result) {
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

function cascadeUpStepNumbers(changePlanID, stepDeleted, callback) {
    changeplansRef.doc(changePlanID).collection("changes").where("step", ">", parseInt(stepDeleted)).get().then(function (querySnapshot) {
        if (querySnapshot.empty) {
            callback(true);
        } else {
            let count = 0;
            querySnapshot.docs.forEach(doc => {
                changeplansRef.doc(changePlanID).collection("changes").doc(doc.id).update({
                    step: doc.data().step - 1
                }).then(function () {
                    count++;
                    if (count === querySnapshot.size) {
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
}

function generateWorkOrder(changePlanID, callback) {
    console.log(changePlanID)
    changeplansRef.doc(changePlanID).collection("changes").orderBy("step").get().then(function (querySnapshot) {
        if (querySnapshot.empty) {
            callback([])
        } else {
            let steps = new Map();
            let count = 0;
            querySnapshot.docs.forEach(doc => {
                let change = doc.data().change;
                if (change === "decommission") {
                    console.log("decommission", count)
                    assetRef.doc(doc.data().assetID.toString()).get().then(function (documentSnapshot) {
                        steps.set(doc.data().step, ["Decommission asset #" + doc.data().assetID + " from datacenter " + documentSnapshot.data().datacenter + " at rack " + documentSnapshot.data().rack + " at height " + documentSnapshot.data().rackU + " U"])
                        count++;
                        if (count === querySnapshot.size) {
                            callback(steps);
                        }
                    }).catch(function () {
                        callback(null)
                    });
                } else if (change === "add") {
                    let assetID = doc.data().assetID ? doc.data().assetID : "TBD";
                    console.log(doc.data().changes.datacenter["new"]);
                    steps.set(doc.data().step, ["Add asset #" + assetID + " to datacenter " + doc.data().changes.datacenter["new"] + " on rack " + doc.data().changes.rack["new"] + " at height " + doc.data().changes.rackU["new"] + " U."]);
                    count++;
                    console.log("1", count, querySnapshot.size)
                    if (count === querySnapshot.size) {
                        console.log(steps);
                        callback(steps);
                    }
                } else if (change === "edit") {
                    generateEditWorkOrderMessage(doc, result => {
                        steps.set(doc.data().step, result);
                        count++;
                        console.log("2", count, querySnapshot.size)
                        if (count === querySnapshot.size) {
                            console.log(steps);
                            callback(steps);
                        }
                    })
                }
            })
        }
    }).catch(function (error) {
        console.log(error);
        callback(null);
    })
}

function generateEditWorkOrderMessage(doc, callback) {
    assetRef.doc(doc.data().assetID.toString()).get().then(function (documentSnapshot) {
        let changes = [];
        if (documentSnapshot.exists) {
            let datacenterPromise = new Promise(function (resolve, reject) {
                if (doc.data().changes.datacenter) {
                    //datacenter changed
                    console.log((doc.data().changes.rackU ? doc.data().changes.rackU["new"] : documentSnapshot.data().rackU))
                    changes.push("Move asset #" + doc.data().assetID + " from datacenter " + doc.data().changes.datacenter["old"] + " on rack " + documentSnapshot.data().rack + " at height " + documentSnapshot.data().rackU + " U to datacenter " + doc.data().changes.datacenter["new"] + " on rack " + (doc.data().changes.rack ? doc.data().changes.rack["new"] : documentSnapshot.data().rack) + " at height " + (doc.data().changes.rackU ? doc.data().changes.rackU["new"] : documentSnapshot.data().rackU));
                    console.log("resolve 1")
                    resolve();
                } else {
                    console.log("resolve 1")
                    resolve();
                }
            });
            let rackPromise = new Promise(function (resolve, reject) {
                if (doc.data().changes.rack) {
                    changes.push("Move asset #" + doc.data().assetID + " in datacenter " + documentSnapshot.data().datacenter + " from rack " + doc.data().changes.rack["old"] + " at height " + documentSnapshot.data().rackU + " to rack " + doc.data().changes.rack["new"] + " at height " + (doc.data().changes.rackU ? doc.data().changes.rackU["new"] : documentSnapshot.data().rackU));
                    resolve();
                } else {
                    resolve();
                }
            });
            let heightPromise = new Promise(function (resolve, reject) {
                if (doc.data().changes.rackU) {
                    changes.push("Move asset #" + doc.data().assetID + " in datacenter " + documentSnapshot.data().datacenter + " on rack " + documentSnapshot.data().rack + " from height " + doc.data().changes.rackU["old"] + " U to height " + doc.data().changes.rackU["new"] + " U");
                    console.log("resolve 2")
                    resolve();
                } else {
                    console.log("resolve 2")
                    resolve();
                }
            });
            let networkConnectionsPromise = new Promise(function (resolve, reject) {
                if (doc.data().changes.networkConnections) {
                    new Promise(function (resolve1, reject1) {
                        let count = 0;
                        if (count === Object.keys(doc.data().changes.networkConnections["old"]).length) {
                            console.log("resolve 3")
                            resolve1();
                        }
                        ;
                        Object.keys(doc.data().changes.networkConnections["old"]).forEach(networkPort => {
                            if (!doc.data().changes.networkConnections["new"][networkPort]) {
                                console.log("Case 1")
                                assetRef.doc(doc.data().changes.networkConnections["old"][networkPort].otherPort).get().then(function (otherDocumentSnapshot) {
                                    if (otherDocumentSnapshot.exists) {
                                        changes.push("In datacenter " + documentSnapshot.data().datacenter + ", disconnect the network connection between asset #" + doc.data().assetID + " at network port " + networkPort + " on rack " + documentSnapshot.data().rack + " at height " + documentSnapshot.data().rackU + " U and asset #" + doc.data.changes.networkConnections["old"][networkPort].otherAssetID + " at network port " + doc.data.changes.networkConnections["old"][networkPort].otherPort + " on rack " + otherDocumentSnapshot.data().rack + " at height " + otherDocumentSnapshot.data().rackU + " U");
                                        count++;
                                        if (count === Object.keys(doc.data().changes.networkConnections["old"]).length) {
                                            console.log("resolve 3")
                                            resolve1();
                                        }
                                        ;
                                    } else {
                                        reject1(null);
                                    }
                                }).catch(function () {
                                    reject1(null);
                                })
                            } else if (doc.data().changes.networkConnections["new"][networkPort] && (doc.data().changes.networkConnections["old"][networkPort].otherAssetID !== doc.data().changes.networkConnections["new"][networkPort].otherAssetID || doc.data().changes.networkConnections["old"][networkPort].otherPort !== doc.data().changes.networkConnections["new"][networkPort].otherPort)) {
                                console.log("Case 2")
                                if (doc.data().changes.networkConnections["old"][networkPort].otherAssetID !== doc.data().changes.networkConnections["new"][networkPort].otherAssetID) {
                                    assetRef.doc(doc.data().changes.networkConnections["new"][networkPort].otherAssetID).get().then(function (otherDocumentSnapshot) {
                                        if (otherDocumentSnapshot.exists) {
                                            changes.push("In datacenter " + documentSnapshot.data().datacenter + ", disconnect the network connection on asset #" + doc.data().changes.networkConnections["old"][networkPort].otherAssetID + " on port " + doc.data().changes.networkConnections["old"][networkPort].otherPort + " and connect it to asset #" + doc.data().networkConnections["new"][networkPort].otherAssetID + " in datacenter " + otherDocumentSnapshot.data().datacenter + " on rack" + otherDocumentSnapshot.data().rack + " at height " + otherDocumentSnapshot.data().rackU + " U, port " + doc.data().networkConnections["new"][networkPort].otherPort);
                                            count++;
                                            if (count === Object.keys(doc.data().changes.networkConnections["old"]).length) {
                                                console.log("resolve 3")
                                                resolve1();
                                            }
                                            ;
                                        } else {
                                            reject1(null);
                                        }
                                    }).catch(function () {
                                        reject1(null);
                                    })
                                } else {
                                    //port only
                                    changes.push("In datacenter " + documentSnapshot.data().datacenter + ", disconnect the network connection on asset #" + doc.data().changes.networkConnections["old"][networkPort].otherAssetID + " on port " + doc.data().changes.networkConnections["old"][networkPort].otherPort + " and connect it to port " + doc.data().changes.networkConnections["new"][networkPort].otherPort + " of the same asset");
                                    count++;
                                    if (count === Object.keys(doc.data().changes.networkConnections["old"]).length) {
                                        console.log("resolve 3")
                                        resolve1();
                                    }
                                    ;
                                }
                            } else {
                                console.log("Case 3")
                                if (count === Object.keys(doc.data().changes.networkConnections["old"]).length) {
                                    console.log("resolve 3")
                                    resolve1();
                                }
                                ;
                            }
                        });
                    }).then(function () {
                        let count2 = 0;
                        if (count2 === Object.keys(doc.data().changes.networkConnections["new"]).length) {
                            console.log("resolve 4")
                            resolve();
                        }
                        Object.keys(doc.data().changes.networkConnections["new"]).forEach(networkPort => {
                            if (!doc.data().changes.networkConnections["old"][networkPort]) {
                                assetRef.doc(doc.data().changes.networkConnections["new"][networkPort].otherAssetID).get().then(function (otherDocumentSnapshot) {
                                    if (otherDocumentSnapshot.exists) {
                                        changes.push("In datacenter " + documentSnapshot.data().datacenter + ", connect port " + networkPort + " on asset #" + doc.data().assetID + " located in rack " + documentSnapshot.data().rack + " at height " + documentSnapshot.data().rackU + " U to port " + doc.data().changes.networkConnections["new"][networkPort].otherPort + " of asset #" + doc.data().changes.networkConnections["new"][networkPort].otherAssetID + " located in rack " + otherDocumentSnapshot.data().rack + " at height " + otherDocumentSnapshot.data().rackU + " U");
                                        count2++;
                                        if (count2 === Object.keys(doc.data().changes.networkConnections["new"]).length) {
                                            console.log("resolve 4")
                                            resolve();
                                        }
                                    } else {
                                        reject(null);
                                    }
                                }).catch(function () {
                                    reject(null);
                                });
                            } else {
                                count2++;
                                if (count2 === Object.keys(doc.data().changes.networkConnections["new"]).length) {
                                    console.log("resolve 4")
                                    resolve();
                                }
                            }
                        });
                    });
                } else {
                    resolve();
                }
            });
            let powerConnectionsPromise = new Promise(function (resolve, reject) {
                if (doc.data().changes.powerConnections) {
                    new Promise(function (resolve1, reject1) {
                        let count3 = 0;
                        if (count3 === Object.keys(doc.data().changes.powerConnections["old"]).length) {
                            console.log("resolve 5")
                            resolve1();
                        }
                        Object.keys(doc.data().changes.powerConnections["old"]).forEach(powerPort => {
                            console.log(powerPort);
                            if (!doc.data().changes.powerConnections["new"][powerPort]) {
                                console.log("Case 1")
                                changes.push("In datacenter " + documentSnapshot.data().datacenter + " on asset #" + doc.data().assetID + ", located on rack " + documentSnapshot.data().rack + " at height " + documentSnapshot.data().rackU + " U, disconnect power port " + powerPort + " from the PDU " + doc.data().changes.powerConnections["old"][powerPort].pduSide.toLowerCase() + " side at PDU port " + doc.data().changes.powerConnections["old"][powerPort].port);
                                count3++;
                                if (count3 === Object.keys(doc.data().changes.powerConnections["old"]).length) {
                                    console.log("resolve 5")
                                    resolve1();
                                }
                            } else if (doc.data().changes.powerConnections["new"][powerPort] && (doc.data().changes.powerConnections["new"][powerPort].pduSide !== doc.data().changes.powerConnections["old"][powerPort].pduSide || doc.data().changes.powerConnections["new"][powerPort].port !== doc.data().changes.powerConnections["old"][powerPort].port)) {
                                console.log("Case 2")
                                changes.push("In datacenter " + documentSnapshot.data().datacenter + " on asset #" + doc.data().assetID + ", located on rack " + documentSnapshot.data().rack + " at height " + documentSnapshot.data().rackU + " U, disconnect power port " + powerPort + " from the PDU " + doc.data().changes.powerConnections["old"][powerPort].pduSide.toLowerCase() + " side at PDU port " + doc.data().changes.powerConnections["old"][powerPort].port + ", and reconnect it to the PDU " + doc.data().changes.powerConnections["new"][powerPort].pduSide.toLowerCase() + " side at PDU port " + doc.data().changes.powerConnections["new"][powerPort].port);
                                count3++;
                                if (count3 === Object.keys(doc.data().changes.powerConnections["old"]).length) {
                                    console.log("resolve 5")
                                    resolve1();
                                }
                            } else {
                                console.log("Case 3")
                                count3++;
                                if (count3 === Object.keys(doc.data().changes.powerConnections["old"]).length) {
                                    console.log("resolve 5")
                                    resolve1();
                                }
                            }
                        });
                    }).then(function () {
                        let count4 = 0;
                        if (count4 === Object.keys(doc.data().changes.powerConnections["new"]).length) {
                            console.log("resolve 6")
                            resolve();
                        }
                        Object.keys(doc.data().changes.powerConnections["new"]).forEach(powerPort => {
                            if (!doc.data().changes.powerConnections["old"][powerPort]) {
                                changes.push("In datacenter " + documentSnapshot.data().datacenter + " on asset #" + doc.data().assetID + ", located on rack " + documentSnapshot.data().rack + " at height " + documentSnapshot.data().rackU + " U, connect power port " + powerPort + " to the PDU " + doc.data().changes.powerConnections["new"][powerPort].pduSide.toLowerCase() + " side at PDU port " + doc.data().changes.powerConnections["new"][powerPort].port);
                                count4++;
                                if (count4 === Object.keys(doc.data().changes.powerConnections["new"]).length) {
                                    console.log("resolve 6")
                                    resolve();
                                }
                            } else {
                                count4++;
                                if (count4 === Object.keys(doc.data().changes.powerConnections["new"]).length) {
                                    console.log("resolve 6")
                                    resolve();
                                }
                            }
                        });
                    })
                } else {
                    console.log("resolve 6")
                    resolve();
                }
            });
            let promiseArray = [datacenterPromise, rackPromise, heightPromise, networkConnectionsPromise, powerConnectionsPromise];
            Promise.all(promiseArray).then(function () {
                callback(changes);
            })
        } else {
            callback(null);
        }
    }).catch(function () {
        callback(null);
    })
}

function executeChangePlan(changePlanID, callback) {
    changeplansRef.doc(changePlanID.toString()).collection("changes").get().then(function (querySnapshot) {
        if (querySnapshot.empty) {
            callback(true);
        } else {
            let count = 0;
            querySnapshot.docs.forEach(change => {
                console.log(change)
                if (change.data().change === "add") {
                    console.log("add")
                    if (change.data().changes.assetId && change.data().changes.assetId["new"]) {
                        console.log("not generating")
                        executeAddAsset(change.data().changes.assetId["new"], change, resultAdd => {
                            if (resultAdd) {
                                count++;
                                if (count === querySnapshot.size) {
                                    changeplansRef.doc(changePlanID.toString()).update({
                                        executed: true
                                    }).then(function () {
                                        callback(true);
                                    }).catch(function () {
                                        callback(null);
                                    });
                                }
                            } else {
                                callback(null);
                            }
                        });
                    } else {
                        //generate
                        console.log("generating")
                        assetIDutils.generateAssetID().then(newID => {
                            executeAddAsset(newID, change, resultAdd => {
                                if (resultAdd) {
                                    count++;
                                    if (count === querySnapshot.size) {
                                        changeplansRef.doc(changePlanID.toString()).update({
                                            executed: true
                                        }).then(function () {
                                            callback(true);
                                        }).catch(function () {
                                            callback(null);
                                        });
                                    }
                                } else {
                                    callback(null);
                                }
                            })
                        });
                    }
                } else if (change.data().change === "edit") {
                    console.log("edit")
                    executeEditAsset(change, resultEdit => {
                        if (resultEdit) {
                            count++;
                            if (count === querySnapshot.size) {
                                changeplansRef.doc(changePlanID.toString()).update({
                                    executed: true
                                }).then(function () {
                                    callback(true);
                                }).catch(function () {
                                    callback(null);
                                });
                            }
                        } else {
                            callback(null);
                        }
                    })
                } else {
                    //decomission
                    console.log("decomm")
                    decommissionutils.decommissionAsset(change.data().assetID.toString(), resultDecom => {
                        if(resultDecom){
                            count++;
                            if (count === querySnapshot.size) {
                                changeplansRef.doc(changePlanID.toString()).update({
                                    executed: true
                                }).then(function () {
                                    callback(true);
                                }).catch(function () {
                                    callback(null);
                                });
                            }
                        } else {
                            callback(null);
                        }
                    })
                }
            })
        }
    }).catch(function (error) {
        console.log(error)
        callback(null);
    })
}

function executeAddAsset(id, doc, callback) {
    console.log(id);
    let assetObject = {
        assetId: id
    };
    let count = 0;
    console.log(doc.data().changes)
    Object.keys(doc.data().changes).forEach(change => {
        assetObject = {
            ...assetObject,
            [change]: doc.data().changes[change]["new"]
        };
        count++;
        if (count === Object.keys(doc.data().changes).length) {

            //TODO: TEST
            assetRef.doc(id).set(assetObject).then(function (docRef) {
                if(doc.data().changes.networkConnections){
                    assetnetworkportutils.symmetricNetworkConnectionsAdd(assetnetworkportutils.networkConnectionsToArray(doc.data().changes.networkConnections["new"]), id);
                }
                if (doc.data().changes.powerConnections && doc.data().changes.powerConnections["new"].length != 0) {
                    racksRef.doc(String(doc.data().changes.rackID["new"])).update({
                        assets: firebase.firestore.FieldValue.arrayUnion(id),
                        powerPorts: firebase.firestore.FieldValue.arrayUnion(...doc.data().changes.powerConnections["new"].map(obj => ({
                            ...obj,
                            assetID: id
                        })))
                    }).then(function () {
                        console.log("Document successfully updated in racks");
                        logutils.addLog(id, logutils.ASSET(), logutils.CREATE())
                        callback(true);
                    })
                } else {
                    racksRef.doc(String(doc.data().changes.rackID["new"])).update({
                        assets: firebase.firestore.FieldValue.arrayUnion(id)
                    }).then(function () {
                        console.log("Document successfully updated in racks");
                        logutils.addLog(id, logutils.ASSET(), logutils.CREATE())
                        callback(true);
                    })
                }
            }).catch(function (error) {
                // callback("Error");
                console.log(error)
            })


        }
    })
}

function executeEditAsset(doc, callback) {
    let assetObject = {};
    let count = 0;
    Object.keys(doc.data().changes).forEach(change => {
        assetObject = {
            ...assetObject,
            [change]: doc.data().changes[change]["new"]
        };
        count++;
        if (count === Object.keys(doc.data().changes).length) {
            console.log("checkpoint w")
            assetnetworkportutils.symmetricNetworkConnectionsDelete(doc.data().assetID.toString(), deleteResult => {
                if (deleteResult) {
                    logutils.getObjectData(String(doc.data().assetID), logutils.ASSET(), assetData => {
                        if(doc.data().changes.networkConnections){
                            assetnetworkportutils.symmetricNetworkConnectionsAdd(assetnetworkportutils.networkConnectionsToArray(doc.data().changes.networkConnections["new"]), doc.data().assetID);
                        }
                        assetRef.doc(doc.data().assetID.toString()).get().then(function (documentSnapshot) {
                            console.log("checkpoint 1")
                            if (documentSnapshot.exists) {
                                let oldRackID = documentSnapshot.data().rackID;
                                let newRackID = doc.data().changes.rackID ? doc.data().changes.rackID["new"] : documentSnapshot.data().rackID;
                                let oldPowerPorts = documentSnapshot.data().powerConnections;
                                let newPowerPorts = doc.data().changes.powerConnections ? doc.data().changes.powerConnections["new"] : documentSnapshot.data().powerConnections;
                                assetutils.replaceAssetRack(oldRackID, newRackID, oldPowerPorts, newPowerPorts, doc.data().assetID, null, replaceResult => {
                                    if (replaceResult) {
                                        assetRef.doc(String(doc.data().assetID)).update(assetObject).then(function () {
                                            console.log("Updated model successfully")
                                            logutils.addLog(String(doc.data().assetID), logutils.ASSET(), logutils.MODIFY(), assetData)
                                            callback(true);
                                        }).catch(function (error) {
                                            callback(error);
                                        });
                                    } else {
                                        callback(null);
                                    }
                                });
                            }
                        }).catch(function () {
                            callback(null);
                        });
                    });
                } else {
                    callback(null);
                }
            })
        }
    })
}

export {
    getChangePlans,
    getChanges,
    getChangeDetails,
    getStepDocID,
    addChangePlan,
    deleteChangePlan,
    editChangePlan,
    addAssetChange,
    editAssetChange,
    generateWorkOrder,
    deleteChange,
    decommissionAssetChange,
    executeChangePlan
}