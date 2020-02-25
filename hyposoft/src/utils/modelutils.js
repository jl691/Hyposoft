import * as firebaseutils from './firebaseutils'
import * as logutils from './logutils'
import {firebase} from "./firebaseutils";
import {assetRef} from "./firebaseutils";

function packageModel(vendor, modelNumber, height, displayColor, networkPorts, powerPorts, cpu, memory, storage, comment) {
    displayColor = displayColor.trim()
    if (!displayColor.startsWith('#')) {
        displayColor = '#'+displayColor
    }
    const model = {
        vendor: vendor.trim(),
        modelNumber: modelNumber.trim(),
        height: height,
        displayColor: displayColor,
        networkPorts: networkPorts,
        networkPortsCount: networkPorts.length,
        powerPorts: powerPorts,
        cpu: cpu.trim(),
        memory: memory,
        storage: storage.trim(),
        comment: comment.trim(),
        modelName: vendor.trim() + ' ' + modelNumber.trim()
    }
    return model
}

function combineVendorAndModelNumber(vendor, modelNumber) {
    return vendor.concat(' ', modelNumber)
}

function createModel(id, vendor, modelNumber, height, displayColor, networkPorts, powerPorts, cpu, memory, storage, comment, callback) {
    // Ignore the first param
    var model = packageModel(vendor, modelNumber, height, displayColor, networkPorts, powerPorts, cpu, memory, storage, comment)
    firebaseutils.modelsRef.add(model).then(docRef => {
        logutils.addLog(docRef.id,logutils.MODEL(),logutils.CREATE())
        callback(model, docRef.id)
    })
}

function modifyModel(id, vendor, modelNumber, height, displayColor, networkPorts, powerPorts, cpu, memory, storage, comment, callback) {
    var model = packageModel(vendor, modelNumber, height, displayColor, networkPorts, powerPorts, cpu, memory, storage, comment)
    /*logutils.getObjectData(id,logutils.MODEL(),data => {
      firebaseutils.modelsRef.doc(id).update(model).then(() => {
          logutils.addLog(id,logutils.MODEL(),logutils.MODIFY(),data)
          callback(model, id)
      })
    })*/

    // Now update all instances of this model just in case the modelNumber or vendor changed
    firebaseutils.assetRef.where('modelId', '==', id).get().then(qs => {
        if (!qs.empty) {
            delete model.height // Don't change height if instances exist
        }
        logutils.getObjectData(id,logutils.MODEL(),data => {
            firebaseutils.modelsRef.doc(id).update(model).then(() => {
                logutils.addLog(id,logutils.MODEL(),logutils.MODIFY(),data)
                callback(model, id)
            })
        })
        qs.forEach(doc => {
            doc.ref.update({
                vendor: vendor,
                modelNumber: modelNumber,
                model: vendor+' '+modelNumber
            })
        })
    })
}

function deleteModel(modelId, callback) {
    firebaseutils.modelsRef.doc(modelId).get().then(docRef => {
        firebaseutils.modelsRef.doc(modelId).delete().then(() => {
          logutils.addLog(modelId,logutils.MODEL(),logutils.DELETE(),docRef.data())
          callback()
        })
    }).catch( error => {
      console.log("Error getting documents: ", error)
    })
}

function getModel(vendor, modelNumber, callback, extra_data=null) {
    firebaseutils.modelsRef.where('vendor', '==', vendor)
    .where('modelNumber', '==', modelNumber)
    .get().then(qs => {
        if (!qs.empty) {
            callback({...qs.docs[0].data(), id: qs.docs[0].id, found: true, extra_data: extra_data})
        } else {
            callback({found: false, vendor: vendor, modelNumber: modelNumber, extra_data: extra_data})
        }
    })
}

function getModelByModelname(modelName, callback) {
    firebaseutils.modelsRef.where('modelName', '==', modelName)
    .get().then(qs => {
        if (!qs.empty) {
            //console.log(qs.docs[0]);
            callback(qs.docs[0])
        } else {
            callback(null)
        }
    })
}

function matchesFilters(data, filters) {
    return (
        data.height >= filters.heightStart &&
        data.height <= filters.heightEnd &&
        data.memory >= filters.memoryStart &&
        data.memory <= filters.memoryEnd &&
        data.networkPortsCount >= filters.networkPortsStart &&
        data.networkPortsCount <= filters.networkPortsEnd &&
        data.powerPorts >= filters.powerPortsStart &&
        data.powerPorts <= filters.powerPortsEnd
    )
}

function getModels(itemNo, startAfter, callback, filters, field = null, direction = null) {
    let query;
    if (field && direction !== null) {
        query = direction ? (startAfter ? firebaseutils.modelsRef.orderBy(field).startAfter(startAfter) : firebaseutils.modelsRef.orderBy(field)) : (startAfter ? firebaseutils.modelsRef.orderBy(field, "desc").startAfter(startAfter) : firebaseutils.modelsRef.orderBy(field, "desc"));
    } else {
        query = startAfter ? firebaseutils.modelsRef.orderBy('vendor').orderBy('modelNumber').startAfter(startAfter) : firebaseutils.modelsRef.orderBy('vendor').orderBy('modelNumber');
    }

    console.log(query)

    query.get()
    .then( docSnaps => {
      // added this in from anshu
      var models = [];
      console.log(docSnaps.docs.length)
      for (var i = 0; i < docSnaps.docs.length; i++) {
          if (matchesFilters(docSnaps.docs[i].data(), filters)) {
              models = [...models, {...docSnaps.docs[i].data(), id: docSnaps.docs[i].id, itemNo: itemNo++}]
              if (models.length === 25 || i === docSnaps.docs.length - 1) {
                  var newStartAfter = null
                  if (i < docSnaps.docs.length - 1) {
                      newStartAfter = docSnaps.docs[i+1]
                  }
                  callback(itemNo, models, newStartAfter)
                  return
              }
          }
      }
      callback(itemNo, models, null)
    })
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback(null, null,null)
    })
}

function doesModelDocExist(vendor, modelNumber, callback) {
    firebaseutils.modelsRef.where('modelName','==',vendor+' '+modelNumber).get()
    .then(qs => {
      callback(!qs.empty)
    })
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback(null)
    })
}

function doesModelHaveAssets(modelId, callback) {
    firebaseutils.assetRef.where('modelId', '==', modelId).get().then(qs => {
        callback(!qs.empty)
    })
}

function getModelIdFromModelName(modelName, callback) {
    firebaseutils.modelsRef.where('modelName','==',modelName).get()
    .then(docSnaps => {
        callback(docSnaps.docs[0].id)
    })
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback(null)
    })
}

function getSuggestedVendors(userInput, callback) {
  // https://stackoverflow.com/questions/46573804/firestore-query-documents-startswith-a-string/46574143
  var vendorArray = []
  firebaseutils.modelsRef.orderBy('vendor').get().then(querySnapshot => {
    querySnapshot.forEach( doc => {
      const vendorName = doc.data().vendor.toLowerCase()
      const lowerUserInput = userInput.toLowerCase()
      if (!vendorArray.includes(doc.data().vendor) && (!userInput
          || (vendorName >= lowerUserInput
              && vendorName < lowerUserInput.slice(0,lowerUserInput.length-1)
                  + String.fromCharCode(lowerUserInput.slice(lowerUserInput.length-1,lowerUserInput.length).charCodeAt(0)+1)))) {
          vendorArray.push(doc.data().vendor)
        }
    })
    callback(vendorArray)
    })
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback(null)
    })
}

function getAssetsByModel(model, startAfter, callback) {
    firebaseutils.assetRef.startAfter(startAfter)
    .where('model', '==', model)
    .limit(25)
    .startAfter(startAfter)
    .get()
    .then( docSnaps => {
      // added this in from anshu
      var newStartAfter = null
      if (docSnaps.docs.length === 25) {
        newStartAfter = docSnaps.docs[docSnaps.docs.length-1]
      }

      const assets = docSnaps.docs.map( doc => (
        {...doc.data(), id: doc.id}
      ))
      callback(assets,newStartAfter)
    })
}

function escapeStringForCSV(string) {
    if (!string || string.trim() === '') {
        return ''
    } else {
        return '"'+string.split('"').join('""')+'"'
    }
}

function getModelsForExport(callback) {
    firebaseutils.modelsRef.orderBy('vendor').get().then(qs => {
        var rows = [
            ["vendor", "model_number", "height", "display_color", "network_ports",
            "power_ports", "cpu", "memory", "storage", "comment", "network_port_name_1",
            "network_port_name_2", "network_port_name_3", "network_port_name_4"]
        ]

        for (var i = 0; i < qs.size; i++) {
            var network_port_name_1 = ''
            var network_port_name_2 = ''
            var network_port_name_3 = ''
            var network_port_name_4 = ''

            if (qs.docs[i].data().networkPortsCount >=1 ){
                network_port_name_1 = qs.docs[i].data().networkPorts[0]
            }

            if (qs.docs[i].data().networkPortsCount >=2 ){
                network_port_name_2 = qs.docs[i].data().networkPorts[1]
            }

            if (qs.docs[i].data().networkPortsCount >=3 ){
                network_port_name_3 = qs.docs[i].data().networkPorts[2]
            }

            if (qs.docs[i].data().networkPortsCount >=4 ){
                network_port_name_4 = qs.docs[i].data().networkPorts[3]
            }

            var displayColor = qs.docs[i].data().displayColor.trim()
            if (!displayColor.startsWith('#')) {
                displayColor = '#'+displayColor
            }

            rows = [...rows, [
                escapeStringForCSV(qs.docs[i].data().vendor),
                escapeStringForCSV(qs.docs[i].data().modelNumber),
                ''+qs.docs[i].data().height,
                displayColor.toUpperCase(),
                ''+(qs.docs[i].data().networkPortsCount || ''),
                ''+(qs.docs[i].data().powerPorts || ''),
                escapeStringForCSV(qs.docs[i].data().cpu),
                ''+(qs.docs[i].data().memory || ''),
                escapeStringForCSV(qs.docs[i].data().storage),
                escapeStringForCSV(qs.docs[i].data().comment),
                network_port_name_1,
                network_port_name_2,
                network_port_name_3,
                network_port_name_4,
            ]]

            if (rows.length === qs.size+1) {
                callback(rows)
            }
        }
    })
}

function validateImportedModels (data, callback) {
    var errors = []
    var modelsSeen = {}
    var fetchedModels = []
    var fetchedModelsCount = 0

    var toBeIgnored = []
    var toBeModified = []
    var toBeAdded = []

    function postValidation () {
        if (fetchedModelsCount < data.length)
            return

        for (var i = 0; i < data.length; i++) {
            var datum = data[i]
            datum.rowNumber = i+1
            if (datum.height) {
                if (fetchedModels[i].found && fetchedModels[i].hasAssets && parseInt(datum.height) !== fetchedModels[i].height) {
                    errors = [...errors, [i+1, "Can't change height for a model with deployed instances"]]
                }
            } else {
                if (!fetchedModels[i].found) {
                    errors = [...errors, [i+1, "Height required for creating a new model"]]
                }
            }

            const model = datum // redundancy for legacy and lazy and timecrunch reasons
            const height = parseInt(model.height)
            const network_ports = (model.network_ports !== null ? parseInt(model.network_ports) : null)
            const power_ports = (model.power_ports !== null ? parseInt(model.power_ports) : null)
            const memory = (model.memory !== null ? parseInt(model.memory) : null)
            const storage = (model.storage !== null ? model.storage.trim() : "")
            const cpu = (model.cpu !== null ? model.cpu.trim() : "")
            const comment = (model.comment !== null ? model.comment.trim() : "")

            const modelFromDb = fetchedModels[i]
            const modelMemory = (modelFromDb.memory > 0 ? modelFromDb.memory : null)
            const networkPorts = (modelFromDb.networkPortsCount > 0 ? modelFromDb.networkPortsCount : null)
            const powerPorts = (modelFromDb.powerPorts > 0 ? modelFromDb.powerPorts : null)
            const modelStorage = (modelFromDb.storage !== undefined ? modelFromDb.storage.trim() : "")
            const modelCpu = (modelFromDb.cpu !== undefined ? modelFromDb.cpu.trim() : "")
            const modelComment = (modelFromDb.comment !== undefined ? modelFromDb.comment.trim() : "")

            if (!modelFromDb.found) {
                toBeAdded.push(datum)
            } else if (!(modelFromDb.height == height && modelFromDb.displayColor.toLowerCase() == model.display_color.toLowerCase()
                    && networkPorts == network_ports && powerPorts == power_ports
                    &&  cpu == modelCpu && storage == modelStorage && modelMemory == memory
                    && comment == modelComment)) {
                datum.id = modelFromDb.id
                toBeModified.push(datum)
            } else {
                toBeIgnored.push(datum)
            }
        }

        callback({ errors, toBeIgnored, toBeModified, toBeAdded })
    }

    for (var i = 0; i < data.length; i++) {
        var datum = data[i]
        var modelAndVendorFound = true
        if (!datum.vendor || String(datum.vendor).trim() === '') {
            errors = [...errors, [i+1, 'Vendor not found']]
            modelAndVendorFound = false
        }
        if (!datum.model_number || String(datum.model_number).trim() === '') {
            errors = [...errors, [i+1, 'Model number not found']]
            modelAndVendorFound = false
        }
        if (modelAndVendorFound) {
            if (!(datum.vendor in modelsSeen)) {
                modelsSeen[datum.vendor] = {}
            }
            if (datum.model_number in modelsSeen[datum.vendor]) {
                errors = [...errors, [i+1, 'Duplicate row (this model already exists on row '+modelsSeen[datum.vendor][datum.model_number]+')']]
            } else {
                modelsSeen[datum.vendor][datum.model_number] = i+1
            }
        }
        // if (!datum.height || String(datum.height).trim() === '') {
        //     errors = [...errors, [i+1, 'Height not found']]
        // } else
        if (datum.height && (isNaN(String(datum.height).trim()) || !Number.isInteger(parseFloat(String(datum.height).trim())) || parseInt(String(datum.height).trim()) <= 0)) {
            errors = [...errors, [i+1, 'Height is not a positive integer']]
        }
        if (!datum.display_color || String(datum.display_color).trim() === '') {
            datum.display_color = '#000000'
        } else if (datum.displayColor && !/^#[0-9A-F]{6}$/i.test(String(datum.display_color))) {
            errors = [...errors, [i+1, 'Invalid display color']]
        }
        if (datum.network_ports && String(datum.network_ports).trim() !== '' &&
         (isNaN(String(datum.network_ports).trim()) || !Number.isInteger(parseFloat(String(datum.network_ports).trim())) || parseInt(String(datum.network_ports).trim()) < 0)) {
             errors = [...errors, [i+1, 'Network ports is not a non-negative integer']]
        }
        if (datum.power_ports && String(datum.power_ports).trim() !== '' &&
         (isNaN(String(datum.power_ports).trim()) || !Number.isInteger(parseFloat(String(datum.power_ports).trim())) || parseInt(String(datum.power_ports).trim()) < 0)) {
             errors = [...errors, [i+1, 'Power ports is not a non-negative integer']]
        }
        if (datum.memory && String(datum.memory).trim() !== '' &&
         (isNaN(String(datum.memory).trim()) || !Number.isInteger(parseFloat(String(datum.memory).trim())) || parseInt(String(datum.memory).trim()) < 0)) {
             errors = [...errors, [i+1, 'Memory is not a non-negative integer']]
        }

        // If all is good, just get the model and whether it has any assets
        getModel(datum.vendor.trim(), datum.model_number.trim(), modelData => {
            if (modelData.found) {
                firebaseutils.assetRef.where('modelId', '==', modelData.id).get().then(qs => {
                    if (!qs.empty) {
                        modelData.hasAssets = true
                    } else {
                        modelData.hasAssets = false
                    }
                    fetchedModelsCount++
                    fetchedModels[modelData.extra_data] = modelData
                    postValidation()
                })
            } else {
                modelData.hasAssets = false
                fetchedModelsCount++
                fetchedModels[modelData.extra_data] = modelData
                postValidation()
            }

        }, i)
    }
    if (errors.length > 0) {
        callback({ errors, toBeIgnored, toBeModified, toBeAdded })
        // If no errors, the callback will be called by postValidation()
    }
}

function bulkAddModels (models, callback) {
    var addedModelsCount = 0
    for (var i = 0; i < models.length; i++) {
        const model = models[i]
        var network_ports = []
        for (var j = 1; j <= parseInt(model.network_ports); j++) {
            network_ports.push(''+j)
        }
        if (parseInt(model.network_ports) >= 1) {
            network_ports[0] = ((''+model.network_port_name_1).trim() ? (''+model.network_port_name_1).trim() : '1')
        }
        if (parseInt(model.network_ports) >= 2) {
            network_ports[1] = ((''+model.network_port_name_2).trim() ? (''+model.network_port_name_2).trim() : '2')
        }
        if (parseInt(model.network_ports) >= 3) {
            network_ports[2] = ((''+model.network_port_name_3).trim() ? (''+model.network_port_name_3).trim() : '3')
        }
        if (parseInt(model.network_ports) >= 4) {
            network_ports[3] = ((''+model.network_port_name_4).trim() ? (''+model.network_port_name_4).trim() : '4')
        }

        createModel(null, ''+model.vendor, ''+model.model_number, parseInt(model.height), ''+model.display_color,
         network_ports, parseInt(model.power_ports), ''+model.cpu, ''+model.memory, ''+model.storage,
         ''+model.comment, () => {
             addedModelsCount++
             if (addedModelsCount === models.length) {
                 callback()
             }
         })
    }
}

function bulkModifyModels (models, callback) {
    var modifiedModelsCount = 0
    for (var i = 0; i < models.length; i++) {
        const model = models[i]
        var network_ports = []
        for (var j = 1; j <= parseInt(model.network_ports); j++) {
            network_ports.push(''+j)
        }
        if (parseInt(model.network_ports) >= 1) {
            network_ports[0] = ((''+model.network_port_name_1).trim() ? (''+model.network_port_name_1).trim() : '1')
        }
        if (parseInt(model.network_ports) >= 2) {
            network_ports[1] = ((''+model.network_port_name_2).trim() ? (''+model.network_port_name_2).trim() : '2')
        }
        if (parseInt(model.network_ports) >= 3) {
            network_ports[2] = ((''+model.network_port_name_3).trim() ? (''+model.network_port_name_3).trim() : '3')
        }
        if (parseInt(model.network_ports) >= 4) {
            network_ports[3] = ((''+model.network_port_name_4).trim() ? (''+model.network_port_name_4).trim() : '4')
        }

        modifyModel(model.id, ''+model.vendor, ''+model.model_number, parseInt(model.height), ''+model.display_color,
         network_ports, parseInt(model.power_ports), ''+model.cpu, ''+model.memory, ''+model.storage,
         ''+model.comment, () => {
             modifiedModelsCount++
             if (modifiedModelsCount === models.length) {
                 callback()
             }
         })
    }
}

function getVendorAndNumberFromModel(modelName, callback) {
    firebaseutils.modelsRef.where('modelName','==',modelName).get()
    .then( docSnaps => {
        if (docSnaps.docs.length !== 0) {
          callback([docSnaps.docs[0].data().vendor,docSnaps.docs[0].data().modelNumber])
        } else {
          callback([null,null])
        }
    })
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback([null,null])
    })
}

function getAllModels (callback) {
    var listOfModels = {}
    firebaseutils.modelsRef.get().then(qs => {
        for (var i = 0; i < qs.size; i++) {
            if (!(qs.docs[i].data().vendor.trim() in listOfModels)) {
                listOfModels[qs.docs[i].data().vendor.trim()] = [qs.docs[i].data().modelNumber.trim()]
            } else {
                listOfModels[qs.docs[i].data().vendor.trim()] = [...listOfModels[qs.docs[i].data().vendor.trim()], qs.docs[i].data().modelNumber.trim()]
            }
        }
        callback(listOfModels)
    })
}

export { createModel, modifyModel, deleteModel, getModel, doesModelDocExist, getSuggestedVendors, getModels,
getModelByModelname, doesModelHaveAssets, matchesFilters, getAssetsByModel,
getModelsForExport, escapeStringForCSV, validateImportedModels, getVendorAndNumberFromModel,
getModelIdFromModelName, getAllModels, combineVendorAndModelNumber, bulkAddModels, bulkModifyModels }
