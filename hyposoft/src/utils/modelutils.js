import * as firebaseutils from './firebaseutils'

function packageModel(vendor, modelNumber, height, displayColor, ethernetPorts, powerPorts, cpu, memory, storage, comment) {
    const model = {
        vendor: vendor.trim(),
        modelNumber: modelNumber.trim(),
        height: height,
        displayColor: displayColor.trim(),
        ethernetPorts: ethernetPorts,
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

function createModel(id, vendor, modelNumber, height, displayColor, ethernetPorts, powerPorts, cpu, memory, storage, comment, callback) {
    // Ignore the first param
    var model = packageModel(vendor, modelNumber, height, displayColor, ethernetPorts, powerPorts, cpu, memory, storage, comment)
    firebaseutils.modelsRef.add(model).then(docRef => {
        callback(model, docRef.id)
    })
}

function modifyModel(id, vendor, modelNumber, height, displayColor, ethernetPorts, powerPorts, cpu, memory, storage, comment, callback) {
    var model = packageModel(vendor, modelNumber, height, displayColor, ethernetPorts, powerPorts, cpu, memory, storage, comment)
    firebaseutils.modelsRef.doc(id).update(model).then(() => {
        callback(model, id)
    })

    // Now update all instances of this model just in case the modelNumber or vendor changed
    firebaseutils.assetRef.where('modelId', '==', id).get().then(qs => {
        if (!qs.empty) {
            delete model.height // Don't change height if instances exist
        }
        firebaseutils.modelsRef.doc(id).update(model).then(() => {
            callback(model, id)
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
    firebaseutils.modelsRef.doc(modelId).delete().then(() => callback())
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
            console.log(qs.docs[0]);
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
        data.ethernetPorts >= filters.ethernetPortsStart &&
        data.ethernetPorts <= filters.ethernetPortsEnd &&
        data.powerPorts >= filters.powerPortsStart &&
        data.powerPorts <= filters.powerPortsEnd
    )
}

function getModels(startAfter, callback, filters) {
    firebaseutils.modelsRef.startAfter(startAfter)
    .orderBy('vendor').orderBy('modelNumber')
    .startAfter(startAfter)
    .get()
    .then( docSnaps => {
      // added this in from anshu
      var models = []
      var itemNo = 1
      for (var i = 0; i < docSnaps.docs.length; i++) {
          if (matchesFilters(docSnaps.docs[i].data(), filters)) {
              models = [...models, {...docSnaps.docs[i].data(), id: docSnaps.docs[i].id, itemNo: itemNo++}]
              if (models.length === 25 || i === docSnaps.docs.length - 1) {
                  var newStartAfter = null
                  if (i < docSnaps.docs.length - 1) {
                      newStartAfter = docSnaps.docs[i+1]
                  }
                  callback(models, newStartAfter)
                  return
              }
          }
      }
      callback(models, null)
    })
    .catch( error => {
      console.log("Error getting documents: ", error)
      callback(null,null)
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
            ["vendor", "model_number", "height", "display_color", "ethernet_ports", "power_ports", "cpu", "memory", "storage", "comment"]
        ]

        for (var i = 0; i < qs.size; i++) {
            rows = [...rows, [
                escapeStringForCSV(qs.docs[i].data().vendor),
                escapeStringForCSV(qs.docs[i].data().modelNumber),
                ''+qs.docs[i].data().height,
                ''+qs.docs[i].data().displayColor,
                ''+(qs.docs[i].data().ethernetPorts || ''),
                ''+(qs.docs[i].data().powerPorts || ''),
                escapeStringForCSV(qs.docs[i].data().cpu),
                ''+(qs.docs[i].data().memory || ''),
                escapeStringForCSV(qs.docs[i].data().storage),
                escapeStringForCSV(qs.docs[i].data().comment)
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
        if (!datum.height || String(datum.height).trim() === '') {
            errors = [...errors, [i+1, 'Height not found']]
        } else if (isNaN(String(datum.height).trim()) || !Number.isInteger(parseFloat(String(datum.height).trim())) || parseInt(String(datum.height).trim()) <= 0) {
            errors = [...errors, [i+1, 'Height is not a positive integer']]
        }
        if (!datum.display_color || String(datum.display_color).trim() === '') {
            datum.display_color = '#000000'
        } else if (/^#[0-9A-F]{6}$/i.test(String(datum.display_color))) {
            errors = [...errors, [i+1, 'Invalid display color']]
        }
        if (datum.ethernet_ports !== null && String(datum.ethernet_ports).trim() !== '' &&
         (isNaN(String(datum.ethernet_ports).trim()) || !Number.isInteger(parseFloat(String(datum.ethernet_ports).trim())) || parseInt(String(datum.ethernet_ports).trim()) < 0)) {
             errors = [...errors, [i+1, 'Ethernet ports is not a non-negative integer']]
        }
        if (datum.power_ports !== null && String(datum.power_ports).trim() !== '' &&
         (isNaN(String(datum.power_ports).trim()) || !Number.isInteger(parseFloat(String(datum.power_ports).trim())) || parseInt(String(datum.power_ports).trim()) < 0)) {
             errors = [...errors, [i+1, 'Power ports is not a non-negative integer']]
        }
        if (datum.memory !== null && String(datum.memory).trim() !== '' &&
         (isNaN(String(datum.memory).trim()) || !Number.isInteger(parseFloat(String(datum.memory).trim())) || parseInt(String(datum.memory).trim()) < 0)) {
             errors = [...errors, [i+1, 'Memory is not a non-negative integer']]
        }
    }
    callback(errors)
}

function addModelsFromImport (models, force, callback) {
    var modelsProcessed = 0
    var modelsPending = []
    var modelsPendingInfo = []
    var modelIndices = {}
    for (var i = 0; i < models.length; i++) {
        const model = models[i]
        var ignoredModels = 0
        var modifiedModels = 0
        var createdModels = 0

        if (!modelIndices[''+model.vendor])
            modelIndices[''+model.vendor] = {}
        modelIndices[''+model.vendor][''+model.model_number] = i
        getModel(''+model.vendor, ''+model.model_number, modelFromDb => {
            const model = models[modelIndices[''+modelFromDb.vendor][''+modelFromDb.modelNumber]]
            const height = parseInt(model.height)
            const ethernet_ports = (model.ethernet_ports !== null ? parseInt(model.ethernet_ports) : null)
            const power_ports = (model.power_ports !== null ? parseInt(model.power_ports) : null)
            const memory = (model.memory !== null ? parseInt(model.memory) : null)
            const storage = (model.storage !== null ? model.storage.trim() : "")
            const cpu = (model.cpu !== null ? model.cpu.trim() : "")
            const comment = (model.comment !== null ? model.comment.trim() : "")

            const modelMemory = (modelFromDb.memory > 0 ? modelFromDb.memory : null)
            const ethernetPorts = (modelFromDb.ethernetPorts > 0 ? modelFromDb.ethernetPorts : null)
            const powerPorts = (modelFromDb.powerPorts > 0 ? modelFromDb.powerPorts : null)
            const modelStorage = (modelFromDb.storage !== undefined ? modelFromDb.storage.trim() : "")
            const modelCpu = (modelFromDb.cpu !== undefined ? modelFromDb.cpu.trim() : "")
            const modelComment = (modelFromDb.comment !== undefined ? modelFromDb.comment.trim() : "")

            if (!modelFromDb.found) {
                createModel(null, ''+model.vendor, ''+model.model_number, height, ''+model.display_color, ethernet_ports, power_ports, cpu, memory, storage, comment, () => {})
                createdModels += 1
            } else if (!(modelFromDb.height == height && modelFromDb.displayColor == model.display_color
                    && ethernetPorts == ethernet_ports && powerPorts == power_ports
                    &&  cpu == modelCpu && storage == modelStorage && modelMemory == memory
                    && comment == modelComment)) {
                modifiedModels += 1
                if (force) {
                    // Modify model
                    modifyModel(modelFromDb.id, ''+model.vendor, ''+model.model_number, height, ''+model.display_color, ethernet_ports, power_ports, cpu, memory, storage, comment, () => {})
                } else {
                    modelsPending = [...modelsPending, model]
                    modelsPendingInfo = [...modelsPendingInfo, [modelIndices[''+modelFromDb.vendor][''+modelFromDb.modelNumber]+1, model.vendor+' '+model.model_number]]
                }
            } else {
                ignoredModels += 1
            }

            modelsProcessed++
            if (modelsProcessed === models.length) {
                callback({modelsPending, modelsPendingInfo, createdModels, ignoredModels, modifiedModels})
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
getModelsForExport, escapeStringForCSV, validateImportedModels, addModelsFromImport, getVendorAndNumberFromModel,
getModelIdFromModelName, getAllModels, combineVendorAndModelNumber }
