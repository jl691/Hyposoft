import * as firebaseutils from './firebaseutils'

// static ASSET = 'asset'
// static MODEL = 'model'
// static RACK = 'rack'
// static DATACENTER = 'datacenter'

// only optional is objectId and objectType
function packageLog(timestamp, objectId, objectType, action, userId) {
    const log = {
        timestamp: timestamp,
        objectId: objectId.trim(),
        objectType: objectType.trim(),
        action: action.trim(),
        userId: userId.trim()
    }
    return log
}

function addLog(objectId, objectType, action) {
    const timestamp = Date.now()
    const userId = 'useruser'
    var log = packageLog(timestamp, objectId, objectType, action, userId)
    firebaseutils.logsRef.add(log)
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
    log += data.userId + ' ' + data.action + ' ' + data.objectType + '.'
    return log
}

export { addLog, getLogs }
