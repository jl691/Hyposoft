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

function CHANGEPLAN() {
    return 'change plan'
}

function PDU() {
    return 'pdu'
}

function BCMAN() {
    return 'bcman'
}

function OFFLINE() {
    return 'offline asset'
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

function DECOMMISSION() {
    return 'decommissioned'
}

function EXECUTE() {
    return 'executed'
}

function COMPLETE() {
    return 'completed'
}

function POWER_ON() {
    return 'powered on'
}

function POWER_OFF() {
    return 'powered off'
}

function MOVE() {
    return 'moved'
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

function addLog(objectId, objectType, action, data = null, callback = null, wantPromise = false) {
    function meatOfAddLog (callback) {
        switch (objectType) {
            case ASSET():
                getAssetName(objectId,data,action,asset => finishAddingLog(asset, objectId, objectType, action, callback))
                break
            case MODEL():
                getModelName(objectId,data,action,model => finishAddingLog(model, objectId, objectType, action, callback))
                break
            case RACK():
                getRackName(objectId,data,action,rack => finishAddingLog(rack, objectId, objectType, action, callback))
                break
            case USER():
                getUserName(objectId,data,action,user => finishAddingLog(user, objectId, objectType, action, callback))
                break
            case DATACENTER():
                getDatacenterName(objectId,data,action,datacenter => finishAddingLog(datacenter, objectId, objectType, action, callback))
                break
            case CHANGEPLAN():
                getChangePlanName(objectId,data,action,changeplan => finishAddingLog(changeplan, objectId, objectType, action, callback))
                break
            case PDU():
            case BCMAN():
                getPDUName(data,action,(pdu,assetId) => finishAddingLog(pdu, assetId, objectType, action, callback),objectType===BCMAN())
                break
            case OFFLINE():
                getAssetName(objectId,data,action,asset => finishAddingLog(asset, objectId, objectType, action, callback),true)
                break
            default:
                console.log("Could not create log due to unknown type: " + objectType)
                if (callback) {
                  callback()
                }
        }
    }

    if (!wantPromise) {
        // Just do the original work
        meatOfAddLog(callback)
    } else {
        // Return a promise
        return new Promise(function(resolve, reject) {
            meatOfAddLog(resolve)
        })
    }

}

function finishAddingLog(object, objectId, objectType, action, callback) {
    if (object) {
        const timestamp = Date.now()
        const userId = userutils.getLoggedInUser()
        getUserName(userId, null, action, user => {
            if (user) {
                var log = packageLog(timestamp, objectId, objectType, object.name, object.data, object.previousData, object.datacenter, action, userId, user.name)
                firebaseutils.logsRef.add(log)
              }
            if (callback) {
              callback()
            }
        })
    }
}

function getObjectData(objectId, objectType, callback, wantPromise = false) {
    function meatOfGetObjectData (callback) {
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
            case OFFLINE():
                firebaseutils.db.collectionGroup("offlineAssets").where("assetId", "==", objectId).get().then(qs => callback(qs.docs[0].data()))
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

    if (!wantPromise) {
        // Just do the original work
        meatOfGetObjectData(callback)
    } else {
        // Return a promise
        return new Promise(function(resolve, reject) {
            meatOfGetObjectData(resolve)
        })
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
        var newStartAfter;
        var logs = []
        const searchName = search.trim().toLowerCase()
        docSnaps.docs.forEach(doc => {
            const user = doc.data().userName.toLowerCase()
            const object = doc.data().objectName.toLowerCase()
            const includesAsset = (doc.data().objectType === ASSET() || doc.data().objectType === OFFLINE()) && (object.includes(searchName) || doc.data().objectId.includes(searchName))
            const includesPDUAsset = (doc.data().objectType === PDU() || doc.data().objectType === BCMAN()) && includesAssetInPDUName(object,searchName)
            const includesUser = user.includes(searchName) || (doc.data().objectType === USER() && object.includes(searchName))
            if (!search || includesAsset || includesPDUAsset || includesUser) {
                logs = [...logs,{...doc.data(), log: buildLog(doc.data()), date: getDate(doc.data().timestamp), itemNo: itemNo++}]
                newStartAfter = doc
            }
        })
        callback(logs,newStartAfter,itemNo)
    })
    .catch( error => {
        console.log("Error getting documents: ", error)
        callback(null,null,null)
    })
}

function includesAssetInPDUName(name,searchName) {
    var splitName = name.split(" ")
    const ind = splitName.indexOf(ASSET())
    return ind !== -1 ? splitName.slice(ind+1).join(' ').includes(searchName) : false
}

function doesObjectStillExist(objectType,objectId,callback,objectName=null) {
    switch (objectType) {
        case ASSET():
        case PDU():
        case BCMAN():
            firebaseutils.assetRef.doc(objectId).get().then(doc => {
                if (doc.exists) {
                    callback(true,true)
                    return
                }
                firebaseutils.decommissionRef.where('assetId','==',objectId).get().then(docSnaps => {
                    if (docSnaps.docs.length === 0) {
                        callback(false,false)
                        return
                    }
                    callback(docSnaps.docs[0].exists,false)
                })
            })
            break
        case OFFLINE():
            firebaseutils.db.collectionGroup("offlineAssets").where("assetId", "==", objectId).get().then(qs => callback(!qs.empty,true))
            break
        case CHANGEPLAN():
            firebaseutils.changeplansRef.doc(objectId).get().then(doc => callback(doc.exists,true))
            break
        case MODEL():
            firebaseutils.modelsRef.doc(objectId).get().then(doc => {
              if (doc.exists) {
                firebaseutils.modelsRef.where('modelName','==',objectName).get().then(qs => {
                  callback(!qs.empty,true)
                })
              } else {
                callback(false,true)
              }
            })
            break
        default:
            callback(true,true)
    }
}

function buildLog(data) {
    var log = data.userName + ' '
              + data.action + (data.action === MODIFY() && data.previousData ? buildDiff(data) : ' ')
              + data.objectType + ' ' + data.objectName
              + (data.objectType === RACK()
                || ((data.objectType === ASSET() || data.objectType === OFFLINE()) && data.action !== MOVE())
                || data.objectType === PDU()
                || data.objectType === BCMAN()
                    ? ((data.objectType === OFFLINE() ? ' in offline storage site ' : ' in datacenter ') + data.datacenter + '.')
                    : (data.action === MOVE()
                        ? (' from ' + data.previousData.datacenter + ' to ' + data.datacenter + '.')
                        : '.'))
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
    return diff ? (diff + ' of ') : ' '
}

function buildSpecificDiff(data,field) {
    switch (data.objectType) {
      case ASSET():
      case OFFLINE():
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
    if (data && action === DELETE()) {
        callback({name: data.username, data: data, previousData: null, datacenter: null})
    } else {
        firebaseutils.usersRef.doc(id).get().then(doc => callback({name: doc.data().username, data: doc.data(), previousData: data, datacenter: null}))
        .catch( error => {
          console.log("Error getting documents: ", error)
          callback(null)
        })
    }
}

function getAssetName(id,data,action,callback,offline=false) {
    if (data && (action === DELETE() || action === DECOMMISSION())) {
        callback({name: data.model+' '+data.hostname, data: data, previousData: null, datacenter: data.datacenter})
    } else {
        if (offline) {
          firebaseutils.db.collectionGroup("offlineAssets").where("assetId", "==", id).get().then(qs => callback({name: qs.docs[0].data().model+' '+qs.docs[0].data().hostname, data: {...qs.docs[0].data(),datacenterAbbrev: data.datacenterAbbrev}, previousData: data, datacenter: qs.docs[0].data().datacenter}))
          .catch( error => {
            console.log("Error getting documents: ", error)
            callback(null)
          })
        } else {
          firebaseutils.assetRef.doc(id).get().then(doc => callback({name: doc.data().model+' '+doc.data().hostname, data: doc.data(), previousData: data, datacenter: doc.data().datacenter}))
          .catch( error => {
            console.log("Error getting documents: ", error)
            callback(null)
          })
        }
    }
}

function getModelName(id,data,action,callback) {
    if (data && action === DELETE()) {
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
    if (data && action === DELETE()) {
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
    if (data && action === DELETE()) {
        callback({name: data.name, data: data, previousData: null, datacenter: null})
    } else {
        firebaseutils.datacentersRef.doc(id).get().then(doc => callback({name: doc.data().name, data: doc.data(), previousData: data, datacenter: null}))
        .catch( error => {
          console.log("Error getting documents: ", error)
          callback(null)
        })
    }
}

function getChangePlanName(id,data,action,callback) {
    if (data && action === DELETE()) {
        callback({name: data.name, data: data, previousData: null, datacenter: null})
    } else {
        firebaseutils.changeplansRef.doc(id).get().then(doc => callback({name: doc.data().name, data: doc.data(), previousData: data, datacenter: null}))
        .catch( error => {
          console.log("Error getting documents: ", error)
          callback(null)
        })
    }
}

function getPDUName(data,action,callback,bcman=false) {
    let ref = bcman ? firebaseutils.bladeRef : firebaseutils.assetRef
    ref.get().then(async(docSnaps) => {
        var assetId = null
        var asset;
        for (var i = 0; i < docSnaps.docs.length; i++) {
            asset = docSnaps.docs[i].data()
            const docID = docSnaps.docs[i].id
            let formattedNum;
            if (!bcman) {
              if (asset.rackNum.toString().length === 1) {
                  formattedNum = "0" + asset.rackNum;
              } else {
                  formattedNum = asset.rackNum;
              }
            }
            if (bcman || asset.powerConnections) {
                for (var j = 0; j < (bcman ? 1 : asset.powerConnections.length); j++) {
                    const assetPDU = bcman ? (asset.rack+':'+asset.rackU) : ("hpdu-rtp1-" + asset.rackRow + formattedNum + asset.powerConnections[j].pduSide.charAt(0) + ":" + asset.powerConnections[j].port)
                    if (assetPDU === data.pdu+':'+data.portNumber) {
                        assetId = bcman ? docID : asset.assetId
                        break
                    }
                }
                if (assetId) {
                    break
                }
            }
        }
        if (assetId) {
            let extra = null
            if (bcman) {
              extra = await new Promise(function(resolve, reject) {
                  firebaseutils.assetRef.doc(assetId).get().then(doc => resolve({dc: doc.data().datacenter, host: doc.data().hostname}))
              })
            }
            callback({name: data.pdu+':'+data.portNumber+' connected to asset '+asset.model+' '+(extra ? extra.host : asset.hostname), data: {...data,asset: asset}, previousData: null, datacenter: extra ? extra.dc : asset.datacenter}, assetId)
            return
        }
        callback(null,null)
    })
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback(null,null)
    })
}

function assetDiff(data,field) {
    switch (field) {
      case 'networkConnections':
        return !findArrayAndMapDiff(flattenArrayOrMap(data.previousData[field]),flattenArrayOrMap(data.currentData[field]),true) ? '' : (field + arrayAndMapDiffString)
      case 'powerConnections':
        return !findArrayAndMapDiff(flattenArrayOrMap(data.previousData[field]),flattenArrayOrMap(data.currentData[field]),true) ? '' : (field + arrayAndMapDiffString)
      case 'macAddresses':
        return !findArrayAndMapDiff(data.previousData[field],data.currentData[field],true) ? '' : (field + arrayAndMapDiffString)
      case 'variances':
        return complexObjectDiff(data.previousData[field],data.currentData[field]) ? '' : (field + complexDiffString)
      case 'id':
          return ''
      default:
        return defaultDiff(data,field)
    }
}

function modelDiff(data,field) {
    switch (field) {
      case 'networkPorts':
        return !findArrayAndMapDiff(data.previousData[field],data.currentData[field]) ? '' : (field + arrayAndMapDiffString)
      case 'modelName':
        return ''
      case 'networkPortsCount':
        return ''
      default:
        return defaultDiff(data,field)
    }
}

function rackDiff(data,field) {
    switch (field) {
      case 'assets':
        return complexObjectDiff(data.previousData[field],data.currentData[field],'asset') ? '' : (field + complexDiffString)
      default:
        return defaultDiff(data,field)
    }
}

function userDiff(data,field) {
    switch (field) {
      case 'password':
        return field
      case 'permissions':
        return !findArrayAndMapDiff(data.previousData[field],data.currentData[field]) ? '' : (field + arrayAndMapDiffString)
      default:
        return defaultDiff(data,field)
    }
}

function datacenterDiff(data,field) {
    switch (field) {
      case 'racks':
        return complexObjectDiff(data.previousData[field],data.currentData[field],'rack') ? '' : (field + complexDiffString)
      default:
        return defaultDiff(data,field)
    }
}

function defaultDiff(data,field) {
    return field + ' from ' + (data.previousData[field] ? data.previousData[field] : 'none') + ' to ' + (data.currentData[field] ? data.currentData[field] : 'none')
}

var arrayAndMapDiffString = ''
function findArrayAndMapDiff(a,b,map=false) {
    arrayAndMapDiffString = ''
    var c, other, act;
    for (var i = 0; i < 3; i++) {
      var permDiff = []
      if (i === 0) {
        c = a
        other = b
        act = ' by removing '
      } else if (i === 1) {
        c = b
        other = a
        act = ' by adding '
      } else {
        c = b
        other = a
        act = ' by changing '
      }
      for (var field in c) {
          if (map) {
            if (act !== ' by changing ' && !other[field]) {
                permDiff.push(field + (act == ' by removing ' ? ' as ' : ' to be ') + c[field])
            } else {
              if (act === ' by changing ' && other[field] && other[field] !== c[field]) {
                permDiff.push(field + ' from ' + other[field] + ' to ' + c[field])
              }
            }
          } else {
            if (act !== ' by changing ' && !other.includes(c[field])) {
                permDiff.push(c[field])
            }
          }
      }
      if (permDiff.length !== 0) {
        if (arrayAndMapDiffString) {
          arrayAndMapDiffString = arrayAndMapDiffString + ' and'
        }
        arrayAndMapDiffString = arrayAndMapDiffString + act + permDiff.join(', ')
      }
    }
    return arrayAndMapDiffString
}

function flattenArrayOrMap(flat) {
    var newMap = {}
    for (var field in flat) {
      flatten(field)
    }
    return newMap

    function flatten(key) {
      const value = getValue(key)
      var type = Object.prototype.toString.call(value)
      if (['[object Array]', '[object Object]'].indexOf(type) < 0) {
        return
      }
      delete newMap[key]
      for (var nextKey in value) {
        newMap[key+'|'+nextKey] = value[nextKey]
        flatten(key+'|'+nextKey)
      }
    }

    function getValue(key) {
      var value = flat
      const keyArray = key.split('|')
      for (var field in keyArray) {
        value = value[keyArray[field]]
      }
      return value
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
	if (type !== Object.prototype.toString.call(other)) {
    // TODO: Hopefully this fixes weird issue
    complexDiffString = ''
    return false;
  }

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
			if (itemType !== Object.prototype.toString.call(item2)) {
        // TODO: Shouldn't happen
        complexDiffString = ''
        return false;
      }

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

export { ASSET, MODEL, RACK, USER, DATACENTER, CHANGEPLAN, PDU, BCMAN, OFFLINE, CREATE, MODIFY, DELETE, DECOMMISSION, EXECUTE, COMPLETE, POWER_ON, POWER_OFF, MOVE, addLog, getObjectData, getLogs, doesObjectStillExist, filterLogsFromName, isEqual }
