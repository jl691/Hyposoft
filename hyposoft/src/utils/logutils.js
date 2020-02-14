import * as firebaseutils from './firebaseutils'
import * as userutils from './userutils'

// static ASSET = 'asset'
// static MODEL = 'model'
// static RACK = 'rack'
// static DATACENTER = 'datacenter'

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
    const objectName = 'name'
    getUserName(userId, user => {
        const userName = user
        var log = packageLog(timestamp, objectId, objectType, objectName, action, userId, userName)
        firebaseutils.logsRef.add(log)
    })
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
    log += data.userName + ' ' + data.action + ' ' + data.objectType + '.'
    return log
}

function getUserName(id,callback) {
    firebaseutils.usersRef.doc(id).get().then(doc => callback(doc.data().username))
}

export { addLog, getLogs }
