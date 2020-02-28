import { assetRef, modelsRef, firebase } from './firebaseutils'

//These variable are used in the checkConflicts method
let otherAssetsMap = {};
let seenThisPorts = [];
let seenOtherPorts = new Map(); //Map of otherAssetID --> array of all otherPorts assoc with it

//these fields come from the form being filled out
function validateNetworkConnections(thisModelName, networkPortConnections, callback) {
    console.log("upppppp in this bitch", networkPortConnections)

    let success = 0;

    //this is jenk af. These are here to make sure some callbacks are only done once, and toasts don't show up with the same message multiple times
    let mostConnsPrintCount = 0
    let noConnsPrintCount = 0;

    let numConnectionsMade = networkPortConnections.length
    let mostPossibleConnections = 0;

    //This was added for updating assets. seemed to be stuck, if no network connectios
    if(networkPortConnections.length == 0){

        callback(null)
    }

    for (let i = 0; i < numConnectionsMade; i++) {
        let otherAssetID = networkPortConnections[i].otherAssetID;
        let otherPort = networkPortConnections[i].otherPort;
        let thisPort = networkPortConnections[i].thisPort
        console.log(otherAssetID);
        console.log(otherPort);
        console.log(thisPort)

        //Left entirely empty is OK
        if (otherAssetID.toString() === "" && otherPort.trim() === "" && thisPort.trim() === "") {
            success++;
            if (success === networkPortConnections.length) {
                callback(null)
            }

        }
        //All of the fields have been filled in
        else if (otherPort.trim() !== "" && thisPort.trim() !== "") {

            modelsRef.where("modelName", "==", thisModelName).get().then(function (querySnapshot) {
                //Number of ports on the model that you are trying to add an asset of
                console.log(querySnapshot.docs[0].data().modelName)
                let numThisModelPorts = querySnapshot.docs[0].data().networkPortsCount;
                let errModels = [];
                if (numThisModelPorts === 0) {
                    errModels.push(thisModelName)
                }


                //Getting the number of network ports from the asset trying to connect to
                console.log(otherAssetID)
                assetRef.doc(otherAssetID).get().then(function (otherAssetModelDoc) {
                    if (!otherAssetModelDoc.exists) {
                        callback("To make a network connection to another asset, please enter a valid asset ID")
                    }
                    else {
                        let otherModel = otherAssetModelDoc.data().model

                        modelsRef.where("modelName", "==", otherModel).get().then(function (querySnapshot) {

                            let numOtherModelPorts = querySnapshot.docs[0].data().networkPortsCount
                            if (numOtherModelPorts === 0) {
                                errModels.push(otherModel)
                            }
                            console.log(numThisModelPorts)
                            console.log(numOtherModelPorts)
                            //Math.min with a null, null is treated as 0
                            mostPossibleConnections = Math.min(numThisModelPorts, numOtherModelPorts)
                            //https://javascript.info/comparison

                            if (numConnectionsMade > mostPossibleConnections) {
                                mostConnsPrintCount++;
                                noConnsPrintCount++;
                                if (mostPossibleConnections && mostConnsPrintCount === 1) {
                                    //THIS PRINTS MULTIPLE TIMES
                                    callback("Making too many network connections. The most connections you can make between existing hardware is " + mostPossibleConnections)

                                }
                                else if (noConnsPrintCount === 1) {
                                    callback("Cannot make network connections. There are no network ports on model(s): " + [...errModels] + " that you are trying to connect.")

                                }
                            } else {
                                //Made an appropriate number of connections between the specified hardware
                                //Now need to check that the ports exist
                                checkThisModelPortsExist(thisModelName, thisPort, nonThisExist => {
                                    if (nonThisExist) {//means there's an error message
                                        callback(nonThisExist)
                                    }
                                    else {
                                        checkOtherAssetPortsExist(otherAssetID, otherPort, otherNonexist => {

                                            if (otherNonexist) {

                                                callback(otherNonexist)
                                            }
                                            else {
                                                console.log("SeenOtherPorts: " + seenOtherPorts)
                                                console.log("SeenThisPOrts: " + [...seenThisPorts])

                                                checkNetworkPortConflicts(thisPort, otherAssetID, otherPort, status => {
                                                    if (status) {
                                                        callback(status)
                                                    }
                                                    else {
                                                        seenOtherPorts.set(otherAssetID, otherPort);
                                                        console.log("pushing " + otherAssetID + " : " + otherPort + " to seen otherports")
                                                        seenThisPorts.push(thisPort)
                                                        success++;
                                                        if (success === networkPortConnections.length) {
                                                            callback(null)
                                                        }
                                                        console.log("Congrats, you made it here.")

                                                    }
                                                })


                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }

                }).catch(error => { console.log(error) })
            })
        }
        else {
            //has been partially filled out
            callback("To make a network connection, must fill out all fields.")
        }
    }

}

//Everything else below are helper functions called in the above validate function============================

function checkThisModelPortsExist(thisModelName, thisPort, callback) {

    let errPort = "";
    let errModel = "";


    modelsRef.where("modelName", "==", thisModelName).get().then(function (querySnapshot) {

        //does the model contain this port name?
        //WHAT IF THERE ARE NO NETWORK PORTS? [].include() will return false
        if (!querySnapshot.docs[0].data().networkPorts.includes(thisPort)) {
            errPort = thisPort
            errModel = thisModelName;
            console.log("Did not find the input thisPort in the model's existing port names")


            console.log(seenThisPorts)


            //TODO: multiple ports could not exist if user adds multiple wrong connections. Need to change erro msg
            callback("Trying to connect a nonexistent network port " + errPort + " on this model: " + errModel)

        }
        else {
            callback(null)
        }

    }).catch(error => console.log(error))
}

function checkOtherAssetPortsExist(otherAssetID, otherPort, callback) {

    let errPort = "";
    let errInstance = "";
    let errModel = "";
    let errHostname = "";
    let errMessage1 = "";
    let errMessage2 = "";
    let errMessageFinal = "";

    assetRef.doc(otherAssetID).get().then(function (querySnapshot) {
        let otherModel = querySnapshot.data().model;
        errHostname = querySnapshot.data().hostname;
        modelsRef.where("modelName", "==", otherModel).get().then(function (querySnapshot) {
            console.log("In checkOtherAssetPortsExist")

            //Need to keep track in a different collection of which ports have been occupied
            if (!querySnapshot.docs[0].data().networkPorts.includes(otherPort)) {

                errPort = otherPort;
                errInstance = otherAssetID;
                errModel = otherModel;


                errMessage1 = "Trying to connect a nonexistent network port " + errPort + " on other asset " + errInstance + " " + errModel

                errMessage2 = "Trying to connect a nonexistent network port " + errPort + " on other asset " + errHostname + " " + errModel

                //TODO: multiple ports could not exist if user adds multiple wrong connections. Need to change erro msg
                //Maybe pass in index to say 'at ith connection, this is wrong'
                errMessageFinal = errHostname.trim() === "" ? errMessage1 : errMessage2;


                callback(errMessageFinal)
            }
            else {
                callback(null)
            }
        }).catch(error => console.log(error))

    }).catch(error => console.log(error))



}
function checkNetworkPortConflicts(thisPort, otherAssetID, otherPort, callback) {

    let errHost = "";
    let case1ErrPrintCount = 0
    let case2ErrPrintCount = 0
    let case3ErrPrintCount = 0


    console.log(seenOtherPorts)
    console.log(seenThisPorts)

    assetRef.doc(otherAssetID).get().then(function (querySnapshot) {
        errHost = querySnapshot.data().hostname
        otherAssetsMap = querySnapshot.data().networkConnections
        let otherPortString = otherPort.toString()

        if (Object.keys(otherAssetsMap).length !== 0) {
            let keys = Object.keys(otherAssetsMap)
            console.log(keys.includes(otherPortString))
            console.log(keys)


            case1ErrPrintCount++
            case2ErrPrintCount++
            case3ErrPrintCount++

            if (Object.keys(otherAssetsMap).includes(otherPort) && case3ErrPrintCount === 1) {//otherPort is already a key in otherAssetID's Map: so it's already connected
                console.log("up in this bitch")
                callback("Can’t connect port " + thisPort + " on this asset to " + errHost + " " + otherAssetID + " " + otherPort + ". Already connected.")//+ ". That port is already connected to host5 port e1")


            }
            else if (seenOtherPorts.has(otherAssetID) && seenOtherPorts.get(otherAssetID).includes(otherPort) && case2ErrPrintCount === 1) {
                console.log(seenOtherPorts);
                console.log(otherAssetID);
                console.log(otherPort);
                callback("Can’t connect to" + errHost + " " + otherAssetID + " " + otherPort + ". It's already being used in a previous network connection you are trying to add.")

            }

            else if (seenThisPorts.includes(thisPort) && case1ErrPrintCount === 1) {
                callback("Can’t connect port " + thisPort + " on this asset. It's already being used in a previous network connection you are trying to add.")
            }

            else {
                //the last else should be a callback(null). For the current connection, it has run through the gauntlet of validation checks

                callback(null)

            }



        }
        else {
            //since no network connections have been
            callback(null)
        }

    }).catch(error => console.log(error))
}

function symmetricNetworkConnectionsAdd(networkConnectionsArray, newID) {
    //Make sure connections are symmetric. Meaning the other asset should have their network port connectiosn updated too
    //So when someone adds an asset and makes network connections, the networkconnections field for otherAssetID otherPort will be updated
    let thisPort = "";
    let otherAssetID = ""
    let otherPort = "";
    console.log("In symmetric network connections")

    if (networkConnectionsArray[0].otherAssetID === "") {
        //TODO:didn't fill out any fields?? But what if first one was left blank
        return;
    }
    else {

        //Only add once everything has been validated. Go up into assetutils and call this method there
        for (let i = 0; i < networkConnectionsArray.length; i++) {
            thisPort = networkConnectionsArray[i].thisPort
            otherAssetID = networkConnectionsArray[i].otherAssetID
            otherPort = networkConnectionsArray[i].otherPort
            //add a connection where otherPort : {otherAssetID: newID; otherPort: thisPort}

            //go into the other assetID, do update
            console.log(otherAssetID)
            assetRef.doc(otherAssetID).set({
                networkConnections: { [otherPort]: { otherAssetID: newID, otherPort: thisPort } }


            }, { merge: true }).then(function () {
                console.log("Successfully made a symmetric network connection")
            }).catch(error => console.log(error))

        }


    }


}
//TODO: asset utils and add this method
//takes in id of asset being deleted
//for all network connections, delete te matching port
function symmetricNetworkConnectionsDelete(deleteID, callback) {
    //deleteID refers to asset you are deleting
    console.log("fucking kms")
    assetRef.doc(deleteID).get().then(function (docRef) {
        if (!(docRef.data().networkConnections && Object.keys(docRef.data().networkConnections).length)) {
            callback(true);
        }
        let networkConnections = Object.keys(docRef.data().networkConnections);
        console.log(networkConnections)
        let count = 0;
        //Go through each connection made, go to each connected asset, and delete yourself
        networkConnections.forEach(function (connection) {
            let otherConnectedAsset = docRef.data().networkConnections[connection].otherAssetID;
            console.log(otherConnectedAsset)
            assetRef.doc(otherConnectedAsset).get().then(function (otherAssetDoc) {
                console.log(otherAssetDoc)
                //delete yourself
                let conns = Object.keys(otherAssetDoc.data().networkConnections);
                console.log(conns)
                conns.forEach(function (conn) {
                    console.log("in the innerforeach for ", conn)
                    console.log(otherAssetDoc.data().networkConnections[conn].otherAssetID)
                    console.log(deleteID)
                    if (otherAssetDoc.data().networkConnections[conn].otherAssetID === deleteID) {
                        console.log("matched")
                        //then call firld delete frecase code
                        assetRef.doc(otherConnectedAsset).update({
                            [`networkConnections.${conn}`]: firebase.firestore.FieldValue.delete()
                        }).then(function () {
                            console.log("update worked for " + otherConnectedAsset)
                            count++;
                            //console.log("count is " + count + " and networkconnections size is " + networkConnections.length)
                            if (count === networkConnections.length) {
                                console.log("calling back")
                                callback(true);
                            }
                        }).catch(function (error) {
                            console.log("not quite")
                            console.log(error);
                            callback(null);
                        });
                        console.log("after the update")
                    }
                })
            }).catch(function (error) {
                console.log(error);
                callback(null);
            })
        })
    }).catch(function (error) {
        console.log(error);
        callback(null);
    })


}
function networkConnectionsToMap(networkConnectionsArray) {

    var JSONConnections = {}
    var JSONValues = {}

    // if (networkConnectionsArray == null) {
    //     return JSONConnections
    // }

    if (networkConnectionsArray[0].otherAssetID === "") {
        //TODO:didn't fill out anything. But what if first is empty but second is not?
        let emptyConns = [];
        return emptyConns;
    } else {
        for (let i = 0; i < networkConnectionsArray.length; i++) {

            //var propertyName = 'thisPort';
            let key = networkConnectionsArray[i].thisPort;
            let value1 = networkConnectionsArray[i].otherAssetID;
            let value2 = networkConnectionsArray[i].otherPort;
            JSONValues["otherAssetID"] = value1
            JSONValues["otherPort"] = value2
            JSONConnections[key] = JSONValues;

        }

        return JSONConnections;

    }

}
function networkConnectionsToArray(networkMap) {
    let networkArray = []

    if (Object.keys(networkMap)) {
        let count = 0;
        console.log(networkMap)
        console.log(Object.keys(networkMap))
        Object.keys(networkMap).forEach(key => {
            console.log(key)
            let connObject = {}
            connObject["thisPort"] = key
            connObject["otherAssetID"] = networkMap[key].otherAssetID
            connObject["otherPort"] = networkMap[key].otherPort
            console.log(connObject)

            networkArray.push(connObject)
            console.log(networkArray)
            count++;

        })
        return networkArray
    }
    else {
        return networkArray;
    }




}


function getNetworkPortConnections(assetID, callback) {
    let assets = [];
    addPortsByAsset(assetID, 1, (nodes, secondLevel) => {
        if (nodes && nodes.length) {
            assets = assets.concat(nodes);
            let count = 0;
            console.log("secondlevel is ", secondLevel)
            secondLevel.forEach(secondLevelID => {
                addPortsByAsset(secondLevelID, 2, (secondLevelNodes, thirdLevel) => {
                    console.log("here and count is " + count + " out of " + secondLevel.length)
                    if (secondLevelNodes && secondLevelNodes.length) {
                        assets = assets.concat(secondLevelNodes);
                        count++;
                        if (count === secondLevel.length) {
                            console.log("yeeeet")
                            console.log(assets)
                            callback(assets);
                        }
                    } else if (secondLevelNodes) {
                        count++;
                        if (count === secondLevel.length) {
                            console.log("yeeeet")
                            console.log(assets)
                            callback(assets);
                        }
                    }
                    else {
                        console.log("fail")
                        callback(null);
                    }
                });
            })
        } else {
            callback(null);
        }
    })
}

function addPortsByAsset(assetID, level, callback) {
    let assets = [];
    let assetSecondLevel = [];
    assetRef.doc(assetID).get().then(docSnap => {
        //let assetModel = docSnap.data().model;
        let nodeClass = (level === 1) ? "origin" : "second";
        let nodeLevel = (level === 1) ? 1 : 2;
        let hostname = docSnap.data().hostname ? docSnap.data().hostname : "No hostname";
        if (level === 1) {
            assets.push({
                data: {
                    id: assetID,
                    level: nodeLevel,
                    display: assetID + "\n" + hostname
                },
                classes: nodeClass,
            });
        }
        let count = 0;
        console.log(docSnap.data())
        if (docSnap.data().networkConnections && Object.keys(docSnap.data().networkConnections).length) {
            Object.keys(docSnap.data().networkConnections).forEach(function (connection) {
                assetRef.doc(docSnap.data().networkConnections[connection].otherAssetID.toString()).get().then(otherDocSnap => {
                    assetSecondLevel.push(docSnap.data().networkConnections[connection].otherAssetID.toString());
                    console.log("here 2")
                    //let otherAssetModel = otherDocSnap.data().model;
                    let innerNodeClass = (level === 1) ? "second" : "third";
                    let innerNodeLevel = (level === 1) ? 2 : 3;
                    let otherHostname = otherDocSnap.data().hostname ? otherDocSnap.data().hostname : "No hostname";
                    assets.push({
                        data: {
                            id: docSnap.data().networkConnections[connection].otherAssetID,
                            level: innerNodeLevel,
                            display: docSnap.data().networkConnections[connection].otherAssetID + "\n" + otherHostname
                        },
                        classes: innerNodeClass,
                    });
                    assets.push({
                        data: {
                            source: assetID,
                            target: docSnap.data().networkConnections[connection].otherAssetID
                        }
                    });
                    count++;
                    if (count === Object.keys(docSnap.data().networkConnections).length) {
                        callback(assets, assetSecondLevel);
                    }
                }).catch(function (error) {
                    console.log(error);
                    callback(null, null)
                })
            })
        } else {
            console.log("here 3")
            callback([], []);
        }
    }).catch(function (error) {
        console.log(error);
        callback(null, null);
    })
}

//note this only deletes a single connection, not to be confused with the other function that deletes all
function symmetricDeleteSingleNetworkConnection(assetID, connectionName, callback){
    assetRef.doc(assetID).get().then(function (docSnap) {
        let networkConnections = docSnap.data().networkConnections;
        if(networkConnections[connectionName] && Object.keys(networkConnections[connectionName]).length){
            let otherAssetID = networkConnections[connectionName].otherAssetID;
            let otherPort = networkConnections[connectionName].otherPort;
            assetRef.doc(otherAssetID).get().then(function (otherDocSnap) {
                let otherNetworkConnections = otherDocSnap.data().networkConnections;
                if(otherNetworkConnections[otherPort] && Object.keys(otherNetworkConnections[otherPort]).length){
                    assetRef.doc(otherAssetID).update({
                        [`networkConnections.${otherPort}`]: firebase.firestore.FieldValue.delete()
                    }).then(function () {
                        assetRef.doc(assetID).update({
                            [`networkConnections.${connectionName}`]: firebase.firestore.FieldValue.delete()
                        }).then(function () {
                            callback(true);
                        }).catch(function (error) {
                            console.log(error);
                            callback(null);
                        })
                    }).catch(function (error) {
                        console.log(error);
                        callback(null);
                    })
                } else {
                    callback(null);
                }
            }).catch(function (error) {
                console.log(error);
                callback(null);
            })
        } else {
            callback(null);
        }
    }).catch(function (error) {
        console.log(error);
        callback(null);
    })
}

export {
    validateNetworkConnections,
    checkNetworkPortConflicts,
    getNetworkPortConnections,
    checkOtherAssetPortsExist,
    checkThisModelPortsExist,
    symmetricNetworkConnectionsAdd,
    networkConnectionsToMap,
    symmetricNetworkConnectionsDelete,
    networkConnectionsToArray,
    symmetricDeleteSingleNetworkConnection
}
