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
function packageLog(timestamp, objectId, objectType, objectName, currentData, previousData, datacenter, action, userId, userName) {
    const log = {
        timestamp: timestamp,
        objectId: objectId.trim(),
        objectType: objectType.trim(),
        objectName: objectName.trim(),
        currentData: currentData,
        previousData: previousData,
        datacenter: datacenter,
        action: action.trim(),
        userId: userId.trim(),
        userName: userName.trim()
    }
    return log
}

function addLog(objectId, objectType, action, data = null) {
    switch (objectType) {
        case ASSET():
            getAssetName(objectId,data,action,asset => finishAddingLog(asset, objectId, objectType, action))
            break
        case MODEL():
            getModelName(objectId,data,action,model => finishAddingLog(model, objectId, objectType, action))
            break
        case RACK():
            getRackName(objectId,data,action,rack => finishAddingLog(rack, objectId, objectType, action))
            break
        case USER():
            getUserName(objectId,data,action,user => finishAddingLog(user, objectId, objectType, action))
            break
        case DATACENTER():
            getDatacenterName(objectId,data,action,datacenter => finishAddingLog(datacenter, objectId, objectType, action))
            break
        default:
            console.log("Could not create log due to unknown type: " + objectType)
    }
}

function finishAddingLog(object, objectId, objectType, action) {
    if (object) {
        const timestamp = Date.now()
        const userId = userutils.getLoggedInUser()
        getUserName(userId, null, action, user => {
            if (user) {
                var log = packageLog(timestamp, objectId, objectType, object.name, object.data, object.previousData, object.datacenter, action, userId, user.name)
                firebaseutils.logsRef.add(log)
              }
        })
    }
}

function getObjectData(objectId, objectType, callback) {
    switch (objectType) {
        case ASSET():
            firebaseutils.assetRef.doc(objectId).get().then(doc => callback(doc.data()))
            .catch( error => {
                console.log("Error getting documents: ", error)
                callback(null)
            })
            break
        case MODEL():
            firebaseutils.modelsRef.doc(objectId).get().then(doc => callback(doc.data()))
            .catch( error => {
                console.log("Error getting documents: ", error)
                callback(null)
            })
            break
        case RACK():
            firebaseutils.racksRef.doc(objectId).get().then(doc => callback(doc.data()))
            .catch( error => {
                console.log("Error getting documents: ", error)
                callback(null)
            })
            break
        case USER():
            firebaseutils.usersRef.doc(objectId).get().then(doc => callback(doc.data()))
            .catch( error => {
                console.log("Error getting documents: ", error)
                callback(null)
            })
            break
        case DATACENTER():
            firebaseutils.datacentersRef.doc(objectId).get().then(doc => callback(doc.data()))
            .catch( error => {
                console.log("Error getting documents: ", error)
                callback(null)
            })
            break
        default:
            console.log("Could not get object data due to unknown type: " + objectType)
            callback(null)
    }
}

function getLogs(itemNo,startAfter,callback) {
    var query = startAfter ? firebaseutils.logsRef.orderBy('timestamp','desc').startAfter(startAfter)
                           : firebaseutils.logsRef.orderBy('timestamp','desc')
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
        docSnaps.docs.forEach(doc => {
            const user = doc.data().userName.toLowerCase()
            const object = doc.data().objectName.toLowerCase()
            const includesAsset = doc.data().objectType === ASSET() && object.includes(searchName)
            const includesUser = user.includes(searchName) || (doc.data().objectType === USER() && object.includes(searchName))
            if (!search || includesAsset || includesUser) {
                logs = [...logs,{...doc.data(), log: buildLog(doc.data()), date: getDate(doc.data().timestamp), itemNo: itemNo++}]
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
    var log = data.userName + ' '
              + data.action + (data.action == MODIFY() && data.previousData ? buildDiff(data) : ' ')
              + data.objectType + ' ' + data.objectName
              + (data.objectType == RACK() || data.objectType == ASSET() ? (' in datacenter ' + data.datacenter + '.') : '.')
    return log
}

function buildDiff(data) {
    var diff = ''
    var num = 0
    var field;
    for (field in data.previousData) {
      if (data.previousData[field] !== data.currentData[field]) {
         let returnedDiff = buildSpecificDiff(data,field)
         if (returnedDiff) {
           diff = diff + (num > 0 ? ',' : '') + ' ' + returnedDiff
           num++
         }
      }
    }
    return diff + ' of '
}

function buildSpecificDiff(data,field) {
    switch (data.objectType) {
      case ASSET():
          return assetDiff(data,field)
      case MODEL():
          return modelDiff(data,field)
      case RACK():
          return rackDiff(data,field)
      case USER():
          return userDiff(data,field)
      case DATACENTER():
          return datacenterDiff(data,field)
      default:
          return ''
    }
}

function getDate(timestamp) {
    var dateArray = new Date(timestamp).toString().split(' ',5)
    return dateArray.join(' ')
}

function getUserName(id,data,action,callback) {
    if (data && action == DELETE()) {
        callback({name: data.username, data: data, previousData: null, datacenter: null})
    } else {
        firebaseutils.usersRef.doc(id).get().then(doc => callback({name: doc.data().username, data: doc.data(), previousData: data, datacenter: null}))
        .catch( error => {
          console.log("Error getting documents: ", error)
          callback(null)
        })
    }
}

function getAssetName(id,data,action,callback) {
    if (data && action == DELETE()) {
        callback({name: data.model+' '+data.hostname, data: data, previousData: null, datacenter: data.datacenter})
    } else {
        firebaseutils.assetRef.doc(id).get().then(doc => callback({name: doc.data().model+' '+doc.data().hostname, data: doc.data(), previousData: data, datacenter: doc.data().datacenter}))
        .catch( error => {
          console.log("Error getting documents: ", error)
          callback(null)
        })
    }
}

function getModelName(id,data,action,callback) {
    if (data && action == DELETE()) {
        callback({name: data.modelName, data: data, previousData: null, datacenter: null})
    } else {
        firebaseutils.modelsRef.doc(id).get().then(doc => callback({name: doc.data().modelName, data: doc.data(), previousData: data, datacenter: null}))
        .catch( error => {
          console.log("Error getting documents: ", error)
          callback(null)
        })
    }
}

function getRackName(id,data,action,callback) {
    if (data && action == DELETE()) {
        firebaseutils.datacentersRef.doc(data.datacenter).get()
        .then(doc => {
          callback({name: data.letter+data.number, data: data, previousData: null, datacenter: doc.data().name})
        })
        .catch( error => {
          console.log("Error getting documents: ", error)
          callback(null)
        })
    } else {
        firebaseutils.racksRef.doc(id).get().then(doc => {
          firebaseutils.datacentersRef.doc(doc.data().datacenter).get().then(docRef => {
            callback({name: doc.data().letter+doc.data().number, data: doc.data(), previousData: data, datacenter: docRef.data().name})
          })
        })
        .catch( error => {
          console.log("Error getting documents: ", error)
          callback(null)
        })
    }
}

function getDatacenterName(id,data,action,callback) {
    if (data && action == DELETE()) {
        callback({name: data.name, data: data, previousData: null, datacenter: null})
    } else {
        firebaseutils.datacentersRef.doc(id).get().then(doc => callback({name: doc.data().name, data: doc.data(), previousData: data, datacenter: null}))
        .catch( error => {
          console.log("Error getting documents: ", error)
          callback(null)
        })
    }
}

function assetDiff(data,field) {
    switch (field) {
      case 'networkConnections':
        return complexObjectDiff(data.previousData[field],data.currentData[field]) ? '' : (field + complexDiffString)
      case 'powerConnections':
        return complexObjectDiff(data.previousData[field],data.currentData[field]) ? '' : (field + complexDiffString)
      default:
        return field + ' from ' + data.previousData[field] + ' to ' + data.currentData[field]
    }
}

function modelDiff(data,field) {
    switch (field) {
      case 'networkPorts':
        return complexObjectDiff(data.previousData[field],data.currentData[field]) ? '' : (field + complexDiffString)
      case 'powerPorts':
        return complexObjectDiff(data.previousData[field],data.currentData[field]) ? '' : (field + complexDiffString)
      case 'modelName':
        return ''
      case 'networkPortsCount':
        return ''
      default:
        return field + ' from ' + data.previousData[field] + ' to ' + data.currentData[field]
    }
}

function rackDiff(data,field) {
    switch (field) {
      case 'assets':
        return complexObjectDiff(data.previousData[field],data.currentData[field],'asset') ? '' : (field + complexDiffString)
      default:
        return field + ' from ' + data.previousData[field] + ' to ' + data.currentData[field]
    }
}

function userDiff(data,field) {
    switch (field) {
      case 'password':
        return field
      default:
        return field + ' from ' + data.previousData[field] + ' to ' + data.currentData[field]
    }
}

function datacenterDiff(data,field) {
    switch (field) {
      case 'racks':
        return complexObjectDiff(data.previousData[field],data.currentData[field],'rack') ? '' : (field + complexDiffString)
      default:
        return field + ' from ' + data.previousData[field] + ' to ' + data.currentData[field]
    }
}

var complexDiffString = ''

function complexObjectDiff(value, other, name = 'port') {
    complexDiffString = ''
    return isEqual(value,other,name)
}

// from https://gomakethings.com/check-if-two-arrays-or-objects-are-equal-with-javascript/
var isEqual = function (value, other, name) {

	// Get the value type
	var type = Object.prototype.toString.call(value);

	// If the two objects are not the same type, return false
	if (type !== Object.prototype.toString.call(other)) return false;

	// If items are not an object or array, return false
	if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;

	// Compare the length of the length of the two items
	var valueLen = type === '[object Array]' ? value.length : Object.keys(value).length;
	var otherLen = type === '[object Array]' ? other.length : Object.keys(other).length;
	if (valueLen !== otherLen) {
    complexDiffString = complexDiffString + ' by changing size from ' + valueLen + ' to ' + otherLen
    return false;
  }

	// Compare two items
	var compare = function (item1, item2) {

		// Get the object type
		var itemType = Object.prototype.toString.call(item1);

		// If an object or array, compare recursively
		if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
			if (!isEqual(item1, item2, name)) return false;
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
				if (item1 !== item2) {
          if (complexDiffString) {
            complexDiffString = complexDiffString + ', from ' + item1 + ' to ' + item2
          } else {
            complexDiffString = complexDiffString + ' from ' + item1 + ' to ' + item2
          }
          return false;
        }
			}

		}
	};

	// Compare properties
	if (type === '[object Array]') {
		for (var i = 0; i < valueLen; i++) {
			if (compare(value[i], other[i]) === false) {
        complexDiffString = ' by changing ' + name + ' ' + i + complexDiffString
        return false;
      }
		}
	} else {
		for (var key in value) {
			if (value.hasOwnProperty(key)) {
				if (compare(value[key], other[key]) === false) {
          complexDiffString = ' by changing ' + key + complexDiffString
          return false;
        }
			}
		}
	}

	// If nothing failed, return true
	return true;
};

export { ASSET, MODEL, RACK, USER, DATACENTER, CREATE, MODIFY, DELETE,addLog, getObjectData, getLogs, doesObjectStillExist, filterLogsFromName }
