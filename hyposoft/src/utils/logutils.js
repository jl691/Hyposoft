import * as firebaseutils from './firebaseutils'
import * as userutils from './userutils'

// OBJECT TYPES
function ASSET() {
    return 'asset'
}

function MODEL() {
    return 'model'
}

function RACK() {
    return 'rack'
}

function USER() {
    return 'user'
}

function DATACENTER() {
    return 'datacenter'
}

// ACTIONS
function CREATE() {
    return 'created'
}

function MODIFY() {
    return 'modified'
}

function DELETE() {
    return 'deleted'
}

// only optional is objectId and objectType
function packageLog(timestamp, objectId, objectType, objectName, objectData, action, userId, userName) {
    const log = {
        timestamp: timestamp,
        objectId: objectId.trim(),
        objectType: objectType.trim(),
        objectName: objectName.trim(),
        objectData: objectData,
        action: action.trim(),
        userId: userId.trim(),
        userName: userName.trim()
    }
    return log
}

function addLog(objectId, objectType, action) {
    switch (objectType) {
        case ASSET():
            getAssetName(objectId,asset => finishAddingLog(asset, objectId, objectType, action))
            break
        case MODEL():
            getModelName(objectId,model => finishAddingLog(model, objectId, objectType, action))
            break
        case RACK():
            getRackName(objectId,rack => finishAddingLog(rack, objectId, objectType, action))
            break
        case USER():
            getUserName(objectId,user => finishAddingLog(user, objectId, objectType, action))
            break
        case DATACENTER():
            getDatacenterName(objectId,datacenter => finishAddingLog(datacenter, objectId, objectType, action))
            break
        default:
            console.log("Could not create log due to unknown type: " + objectType)
    }
}

function finishAddingLog(object, objectId, objectType, action) {
    if (object) {
        const timestamp = Date.now()
        const userId = userutils.getLoggedInUser()
        getUserName(userId, user => {
            if (user) {
                var log = packageLog(timestamp, objectId, objectType, object.name, object.data, action, userId, user.name)
                firebaseutils.logsRef.add(log)
              }
        })
    }
}

function getLogs(itemNo,startAfter,callback) {
    var query = startAfter ? firebaseutils.logsRef.orderBy('timestamp','desc').limit(25).startAfter(startAfter)
                           : firebaseutils.logsRef.orderBy('timestamp','desc').limit(25)
    query.get().then(docSnaps => {
        var newStartAfter = docSnaps.docs[docSnaps.docs.length-1]

        const logs = docSnaps.docs.map(doc => (
            {...doc.data(), log: buildLog(doc.data()), date: getDate(doc.data().timestamp), itemNo: itemNo++}
        ))
        callback(logs,newStartAfter,itemNo)
    })
    .catch( error => {
        console.log("Error getting documents: ", error)
        callback(null,null,null)
    })
}

function filterLogsFromName(search,itemNo,startAfter,callback) {
    var query = startAfter ? firebaseutils.logsRef.orderBy('timestamp','desc').startAfter(startAfter)
                           : firebaseutils.logsRef.orderBy('timestamp','desc')
    query.get().then(docSnaps => {
        var newStartAfter = docSnaps.docs.length >= 25 ? docSnaps.docs[24] : docSnaps.docs[docSnaps.docs.length-1]

        var logs = []
        const searchName = search.trim().toLowerCase()
        var loop = 0
        docSnaps.docs.forEach(doc => {
            if (loop < 25 || search) {
                const user = doc.data().userName.toLowerCase()
                const object = doc.data().objectName.toLowerCase()
                const includesAsset = doc.data().objectType == ASSET() && object.includes(searchName)
                const includesUser = user.includes(searchName) || (doc.data().objectType == USER() && object.includes(searchName))
                if (!search || includesAsset || includesUser) {
                    logs = [...logs,{...doc.data(), log: buildLog(doc.data()), date: getDate(doc.data().timestamp), itemNo: itemNo++}]
                }
                ++loop
            }
        })
        callback(logs,newStartAfter,itemNo)
    })
    .catch( error => {
        console.log("Error getting documents: ", error)
        callback(null,null,null)
    })
}

function doesObjectStillExist(objectType,objectId,callback) {
    switch (objectType) {
        case ASSET():
            firebaseutils.assetRef.doc(objectId).get().then(doc => callback(doc.exists))
            break
        case MODEL():
            firebaseutils.modelsRef.doc(objectId).get().then(doc => callback(doc.exists))
            break
        default:
            callback(true)
    }
}

function buildLog(data) {
    var log = data.userName + ' ' + data.action + ' ' + data.objectType + ' ' + data.objectName + '.'
    return log
}

function getDate(timestamp) {
    var dateArray = new Date(timestamp).toString().split(' ',5)
    return dateArray.join(' ')
}

function getUserName(id,callback) {
    firebaseutils.usersRef.doc(id).get().then(doc => callback({name: doc.data().username, data: doc.data()}))
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback(null)
    })
}

function getAssetName(id,callback) {
    firebaseutils.assetRef.doc(id).get().then(doc => callback({name: doc.data().model+' '+doc.data().hostname, data: doc.data()}))
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback(null)
    })
}

function getModelName(id,callback) {
    firebaseutils.modelsRef.doc(id).get().then(doc => callback({name: doc.data().modelName, data: doc.data()}))
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback(null)
    })
}

function getRackName(id,callback) {
    firebaseutils.racksRef.doc(id).get().then(doc => callback({name: doc.data().letter+doc.data().number, data: doc.data()}))
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback(null)
    })
}

function getDatacenterName(id,callback) {
    firebaseutils.datacentersRef.doc(id).get().then(doc => callback({name: doc.data().name, data: doc.data()}))
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback(null)
    })
}

export { ASSET, MODEL, RACK, USER, DATACENTER, CREATE, MODIFY, DELETE,addLog, getLogs, doesObjectStillExist, filterLogsFromName }
