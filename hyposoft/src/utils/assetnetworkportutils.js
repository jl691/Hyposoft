import { assetRef, modelsRef } from './firebaseutils'

//these fields come from the form being filled out
function validateNetworkConnections(thisModelName, networkPortConnections, callback) {

    let success = 0;
    let numConnectionsMade = networkPortConnections.length
    let mostPossibleConnections = 0;
    for (let i = 0; i < numConnectionsMade; i++) {
        let otherAssetID = networkPortConnections[i].otherAssetID;
        let otherPort = networkPortConnections[i].otherPort;
        let thisPort = networkPortConnections[i].thisPort
        console.log(otherAssetID);
        console.log(otherPort);
        console.log(thisPort)

        //Left entirely empty is OK
        if (otherAssetID == null && otherPort.trim() === "" && thisPort.trim() === "") {
            success++;
            if (success == networkPortConnections.length) {
                callback(null)
            }

        }
        //All of the fields have been filled in
        else if (otherAssetID != null && otherPort.trim() !== "" && thisPort.trim() !== "") {

            modelsRef.where("modelName", "==", thisModelName).get().then(function (querySnapshot) {
                //Number of ports on the model that you are trying to add an asset of
                console.log(querySnapshot.docs[0].data().modelName)
                let numThisModelPorts = 3//querySnapshot.docs[0].data().networkPorts.length;

                //Getting the number of network ports from the asset trying to connect to
                console.log(otherAssetID)
                assetRef.doc(otherAssetID).get().then(function (otherAssetModelDoc) {
                    if (!otherAssetModelDoc.exists) {
                        callback("To make a network connection to another asset, please enter a valid asset ID")
                    }
                    else {
                        let otherModel = otherAssetModelDoc.data().model
                        console.log(otherModel)

                        modelsRef.where("modelName", "==", otherModel).get().then(function (querySnapshot) {

                            let numOtherModelPorts = 2//querySnapshot.data().networkPorts.length
                            console.log(numThisModelPorts)
                            console.log(numOtherModelPorts)
                            //Math.min with a null, null is treated as 0
                            mostPossibleConnections = Math.min(numThisModelPorts, numOtherModelPorts)
                            //https://javascript.info/comparison

                            if (numConnectionsMade > mostPossibleConnections) {
                                if (mostPossibleConnections) {
                                    console.log("case one")
                                    callback("Making too many network connections. The most connections you can make between existing hardware is " + mostPossibleConnections)

                                }
                                else {
                                    console.log("case two")
                                    callback("Cannot make network connections. There are no ethernet ports on one or both assets.")

                                }
                            } else {
                                //Made an appropriate number of connections between the specified hardware
                                //Now need to check that the ports exist
                                checkThisModelPortsExist(thisModelName, thisPort, nonThisExist => {
                                    if (nonThisExist) {//means there's an error message
                                        callback(nonThisExist)
                                    }
                                    else {
                                        console.log("In this check")
                                        checkOtherAssetPortsExist(otherAssetID, otherPort, otherNonexist => {

                                            if (otherNonexist) {

                                                callback(otherNonexist)
                                            }
                                            else {
                                                checkNetworkPortConflicts(networkPortConnections, status => {
                                                    if (status) {
                                                        callback(status)
                                                    }
                                                    else {
                                                        success++;
                                                        if (success == networkPortConnections.length) {
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

        let hardCodedNetworkPorts = ["1", "2", "e3"]
        if (!hardCodedNetworkPorts.includes(thisPort)) {
            //if (!querySnapshot.docs[0].data().networkPorts.includes(thisPort)) {
            errPort = thisPort
            errModel = thisModelName;

            //TODO: multiple ports could not exist if user adds multiple wrong connections. Need to change erro msg
            callback("Trying to connect a nonexistent network port " + errPort + " on this model: " + errModel)

        }
        else {
            callback(null)
        }

    }).catch("This model you are trying to add does not exist: " + thisModelName)
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
        console.log(otherModel)
        errHostname = querySnapshot.data().hostname;
        modelsRef.where("modelName", "==", otherModel).get().then(function (querySnapshot) {

            console.log(otherPort)
            let hardCodedNetworkPorts = ["a", "b", "c"]
            if (!hardCodedNetworkPorts.includes(otherPort)) {
                //if (!querySnapshot.data().networkPorts.includes(networkConnections[i].otherPort)) {

                errPort = otherPort;
                errInstance = otherAssetID;
                errModel = otherModel;
                

                errMessage1 = "Trying to connect a nonexistent network port " + errPort + " on this instance " + errInstance + " which is of model " + errModel

                errMessage2 = "Trying to connect a nonexistent network port " + errPort + " on this instance with hostname " + errHostname + " which is of model " + errModel

                //TODO: multiple ports could not exist if user adds multiple wrong connections. Need to change erro msg
                //Maybe pass in index to say 'at ith connection, this is wrong'
                errMessageFinal = errHostname.trim() === "" ? errMessage1 : errMessage2;

                callback(errMessageFinal)
            }
            else {
                callback(null)
            }
        }).catch("Could not get other model from db")

    }).catch("This other asset you are trying to connect to does not exist")



}

function checkNetworkPortConflicts(networkPortConnections, callback) {
    //No doubly connected ports on this (see networkPortConns) and other asset. Must check every singe=le asst
    //The error message ^ must be specific: “can’t connect host1 port e1 to switch1 port 22; that port is already connected to host5 port e1”).
    let success = 0;
    let connection, thisPort, otherAssetID, otherPort;
    let errHost, errMessage1, errMessage2, errMessageFinal;
    let alreadyConnectedThisPort=[]

    for (let i = 0; i < networkPortConnections.length; i++) {

        connection = networkPortConnections[i]
        thisPort = connection.thisPort;
        otherAssetID = connection.otherAssetID;
        otherPort = connection.otherPort;
       
        //Case 1: The user is making a connection to another asset's port that's already been previously used
        assetRef.doc(otherAssetID).get().then(function (querySnapshot) {
            let otherAssetConnectionsMap = querySnapshot.data().networkConnections

            //the other asset has a network connection where its port already had the 'otherPort' field of the asset
            //you are currently trying to connect
            // if(otherAssetConnectionsMap.otherPort){
            //     let otherHost=querySnapshot.data().hostname;
            //     let othersOtherConnectedAsset=otherAssetConnectionsMap.otherPort.otherAssetID;
            //     console.log(othersOtherConnectedAsset);
            //     assetRef.doc(othersOtherConnectedAsset).get().then( function (otherOtherDoc) {
            //         let errAlreadyHostname = otherOtherDoc.data().hostname;
            //         let errConnectionsMap = otherOtherDoc.networkConnections
            //         let errAlreadyPort = errConnectionsMap.otherPort.otherPort
            //         console.log(errAlreadyHostname, errAlreadyPort)

            //         callback("Cannot make a network connection from this asset at port " + thisPort + " to " + otherHost + otherPort + "; that port is already connected to " + errAlreadyHostname + errAlreadyPort )

            //     })

                
            // }
            //case 2: the user is trying to make a connection more than once on the same thisPort
            // else if (networkPortConnetcions.includes(thisPort)){


        
            // }

        })

    }


}


function symmetricNetworkConnections(networkConnections) {
    //Make sure connections are symmetric. Meaning the other asset should have their network port connectiosn updated too
    //This is what's responsible for making the map from the networkConnections Array to finally pass into the database
    //Call validation function here, then depending on results, go into this for loop

}
function networkConnectionsToMap(networkConnectionsArray) {

    var JSONConnections = {}
    var JSONValues = {}
    for (let i = 0; i < networkConnectionsArray.length; i++) {

        let key = networkConnectionsArray[i].thisPort;
        let value1 = networkConnectionsArray[i].otherAssetID;
        let value2 = networkConnectionsArray[i].otherPort;
        JSONValues["otherAssetID"] = value1
        JSONValues["otherPort"] = value2
        JSONConnections[key] = JSONValues;

    }

    return JSONConnections;
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
        let assetModel = docSnap.data().model;
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
        if (docSnap.data().networkConnections) {
            Object.keys(docSnap.data().networkConnections).forEach(function (connection) {
                assetRef.doc(docSnap.data().networkConnections[connection].otherAssetID.toString()).get().then(otherDocSnap => {
                    assetSecondLevel.push(docSnap.data().networkConnections[connection].otherAssetID.toString());
                    let otherAssetModel = otherDocSnap.data().model;
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
            callback([], []);
        }
    }).catch(function (error) {
        console.log(error);
        callback(null, null);
    })
}

export {
    validateNetworkConnections,
    checkNetworkPortConflicts,
    getNetworkPortConnections,
    checkOtherAssetPortsExist,
    checkThisModelPortsExist,
    symmetricNetworkConnections,
    networkConnectionsToMap,
}