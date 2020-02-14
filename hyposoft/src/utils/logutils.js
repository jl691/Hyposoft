import * as firebaseutils from './firebaseutils'
import * as userutils from './userutils'

function ASSET() {
    return 'Asset'
}

function MODEL() {
    return 'Model'
}

function RACK() {
    return 'Rack'
}

function USER() {
    return 'User'
}

function DATACENTER() {
    return 'Datacenter'
}

// only optional is objectId and objectType
function packageLog(timestamp, objectId, objectType, objectName, action, userId, userName) {
    const log = {
        timestamp: timestamp,
        objectId: objectId.trim(),
        objectType: objectType.trim(),
        objectName: objectName.trim(),
        action: action.trim(),
        userId: userId.trim(),
        userName: userName.trim()
    }
    return log
}

function addLog(objectId, objectType, action) {
    const timestamp = Date.now()
    const userId = userutils.getLoggedInUser()
    var ref;
    switch (objectType) {
        case ASSET():
            ref = firebaseutils.assetRef
            break
        case MODEL():
            ref = firebaseutils.modelsRef
            break
        case RACK():
            ref = firebaseutils.racksRef
            break
        case USER():
            ref = firebaseutils.usersRef
            break
        case DATACENTER():
            ref = firebaseutils.datacentersRef
            break
        default:
            ref = null
    }

    if (ref != null) {
        getObjectName(ref,objectId, objectName => {
            getUserName(userId, userName => {
                if (objectName && userName) {
                    var log = packageLog(timestamp, objectId, objectType, objectName, action, userId, userName)
                    firebaseutils.logsRef.add(log)
                }
            })
        })
    }
}

function getLogs(callback) {
    firebaseutils.logsRef.orderBy('timestamp','desc').get()
    .then(docSnaps => {
        const logs = docSnaps.docs.map(doc => (
            {log: buildLog(doc.data()), objectId: doc.data().objectId}
        ))
        callback(logs)
    })
    .catch( error => {
        console.log("Error getting documents: ", error)
        callback(null)
    })
}

function buildLog(data) {
    var log = new Date(data.timestamp).toString() + ': '
    log += data.userName + ' ' + data.action + ' ' + data.objectType + ' ' + data.objectName + '.'
    return log
}

function getUserName(id,callback) {
    firebaseutils.usersRef.doc(id).get().then(doc => callback(doc.data().username))
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback(null)
    })
}

function getObjectName(ref,id,callback) {
    ref.doc(id).get().then(doc => callback(doc.data().modelName))
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback(null)
    })
}

export { ASSET, MODEL, RACK, USER, DATACENTER, addLog, getLogs }
