import * as firebaseutils from './firebaseutils'
import * as logutils from './logutils'
import {firebase} from "./firebaseutils";
import {assetRef} from "./firebaseutils";
import { saveAs } from 'file-saver'

const algoliasearch = require('algoliasearch')
const client = algoliasearch('V7ZYWMPYPA', '26434b9e666e0b36c5d3da7a530cbdf3')
const index = client.initIndex('models')

function packageModel(vendor, modelNumber, height, displayColor, networkPorts, powerPorts, cpu, memory, storage, comment, mount) {
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
        modelName: vendor.trim() + ' ' + modelNumber.trim(),
        mount: mount
    }
    return model
}

function combineVendorAndModelNumber(vendor, modelNumber) {
    return vendor.concat(' ', modelNumber)
}

function createModel(id, vendor, modelNumber, height, displayColor, networkPorts, powerPorts, cpu, memory, storage, comment, mount, callback) {
    // Ignore the first param
    var model = packageModel(vendor, modelNumber, height, displayColor, networkPorts, powerPorts, cpu, memory, storage, comment, mount)
    firebaseutils.modelsRef.add(model).then(docRef => {
        logutils.addLog(docRef.id,logutils.MODEL(),logutils.CREATE())
        callback(model, docRef.id)
    })
}

function modifyModel(id, vendor, modelNumber, height, displayColor, networkPorts, powerPorts, cpu, memory, storage, comment, mount, callback) {
    var model = packageModel(vendor, modelNumber, height, displayColor, networkPorts, powerPorts, cpu, memory, storage, comment, mount)
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
                logutils.addLog(id,logutils.MODEL(),logutils.MODIFY(),data, () => {
                    callback(model, id)
                })
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

function exportFilteredModels(models) {
    var rows = [
        ["mount_type", "vendor", "model_number", "height", "display_color", "network_ports",
        "power_ports", "cpu", "memory", "storage", "comment", "network_port_name_1",
        "network_port_name_2", "network_port_name_3", "network_port_name_4"]
    ]

    for (var i = 0; i < models.length; i++) {
        var network_port_name_1 = ''
        var network_port_name_2 = ''
        var network_port_name_3 = ''
        var network_port_name_4 = ''

        if (models[i].mount !== 'blade') {
            if (models[i].networkPortsCount >=1 ){
                network_port_name_1 = models[i].networkPorts[0]
            }

            if (models[i].networkPortsCount >=2 ){
                network_port_name_2 = models[i].networkPorts[1]
            }

            if (models[i].networkPortsCount >=3 ){
                network_port_name_3 = models[i].networkPorts[2]
            }

            if (models[i].networkPortsCount >=4 ){
                network_port_name_4 = models[i].networkPorts[3]
            }
        }

        var displayColor = models[i].displayColor.trim()
        if (!displayColor.startsWith('#')) {
            displayColor = '#'+displayColor
        }

        var mountType = models[i].mount === 'normal' ? 'asset' : models[i].mount

        rows = [...rows, [
            mountType,
            escapeStringForCSV(models[i].vendor),
            escapeStringForCSV(models[i].modelNumber),
            ''+models[i].height,
            displayColor.toUpperCase(),
            ''+(models[i].networkPortsCount || ''),
            ''+(models[i].powerPorts || ''),
            escapeStringForCSV(models[i].cpu),
            ''+(models[i].memory || ''),
            escapeStringForCSV(models[i].storage),
            escapeStringForCSV(models[i].comment),
            network_port_name_1,
            network_port_name_2,
            network_port_name_3,
            network_port_name_4,
        ]]
    }

    var blob = new Blob([rows.map(e => e.join(",")).join("\r\n")], {
        type: "data:text/csv;charset=utf-8;",
    })
    saveAs(blob, "hyposoft_models_filtered.csv")
}

function getModelsForExport(callback) {
    firebaseutils.modelsRef.orderBy('vendor').get().then(qs => {
        var rows = [
            ["mount_type", "vendor", "model_number", "height", "display_color", "network_ports",
            "power_ports", "cpu", "memory", "storage", "comment", "network_port_name_1",
            "network_port_name_2", "network_port_name_3", "network_port_name_4"]
        ]

        for (var i = 0; i < qs.size; i++) {
            var network_port_name_1 = ''
            var network_port_name_2 = ''
            var network_port_name_3 = ''
            var network_port_name_4 = ''

            if (qs.docs[i].data().mount !== 'blade') {
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
            }

            var displayColor = qs.docs[i].data().displayColor.trim()
            if (!displayColor.startsWith('#')) {
                displayColor = '#'+displayColor
            }

            var mountType = qs.docs[i].data().mount === 'normal' ? 'asset' : qs.docs[i].data().mount

            rows = [...rows, [
                mountType,
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
            if (fetchedModels[i].found && datum.mount_type !== fetchedModels[i].mount) {
                errors = [...errors, [i+1, "Can't change mount type of a model after creation"]]
            }
            if (datum.height) {
                if (fetchedModels[i].found && fetchedModels[i].hasAssets && parseInt(datum.height) !== fetchedModels[i].height) {
                    errors = [...errors, [i+1, "Can't change height for a model with deployed instances"]]
                }
            } else {
                if (!fetchedModels[i].found && datum.mount_type !== 'blade') {
                    errors = [...errors, [i+1, "Height required for creating a new non-blade-type model"]]
                }
            }

            if (datum.power_ports) {
                if (fetchedModels[i].found && fetchedModels[i].hasAssets && parseInt(datum.power_ports) !== fetchedModels[i].powerPorts) {
                    errors = [...errors, [i+1, "Can't change number of power ports for a model with deployed instances"]]
                }
            }

            if (datum.network_ports) {
                if (fetchedModels[i].found && fetchedModels[i].hasAssets && parseInt(datum.network_ports) !== fetchedModels[i].networkPortsCount) {
                    errors = [...errors, [i+1, "Can't change number of network ports for a model with deployed instances"]]
                }
            }

            if (fetchedModels[i].found && fetchedModels[i].hasAssets) {
                for (var np = 0; np < fetchedModels[i].networkPorts.length; np++) {
                    if (np < 4) {
                        if (datum['network_port_name_'+(i+1)] && datum['network_port_name_'+(i+1)].trim() !== fetchedModels[i].networkPorts[i]) {
                            errors = [...errors, [i+1, "Can't change names of network ports for a model with deployed instances"]]
                            break
                        }
                    } else {
                        break
                    }
                }
            }

            const model = datum // redundancy for legacy and lazy and timecrunch reasons
            const height = parseInt(model.height)
            const network_ports = (model.network_ports ? parseInt(model.network_ports) : null)
            const power_ports = (model.power_ports  ? parseInt(model.power_ports) : null)
            const memory = (model.memory ? (''+model.memory).trim() : null)
            const storage = (model.storage ? model.storage.trim() : "")
            const cpu = (model.cpu ? model.cpu.trim() : "")
            const comment = (model.comment ? model.comment.trim() : "")
            const color = (model.display_color.toLowerCase().startsWith('#') ? model.display_color.toLowerCase() : '#'+model.display_color.toLowerCase())

            const modelFromDb = fetchedModels[i]
            const modelMemory = (modelFromDb.memory ? (''+modelFromDb.memory).trim() : null)
            const networkPorts = (modelFromDb.networkPortsCount ? modelFromDb.networkPortsCount : null)
            const powerPorts = (modelFromDb.powerPorts ? modelFromDb.powerPorts : null)
            const modelStorage = (modelFromDb.storage ? modelFromDb.storage.trim() : "")
            const modelCpu = (modelFromDb.cpu ? modelFromDb.cpu.trim() : "")
            const modelComment = (modelFromDb.comment ? modelFromDb.comment.trim() : "")
            const modelColor = modelFromDb.displayColor && (modelFromDb.displayColor.toLowerCase().startsWith('#') ? modelFromDb.displayColor.toLowerCase() : '#'+modelFromDb.displayColor.toLowerCase())

            if (!modelFromDb.found) {
                toBeAdded.push(datum)
            } else if (!(modelFromDb.height == height && modelColor == color
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
        if (datum.mount_type === 'asset') {
            datum.mount_type = 'normal'
        } else if (datum.mount_type === 'chassis' || datum.mount_type === 'blade') {
            // ye noice
        } else {
            errors = [...errors, [i+1, "Mount type must be 'asset', 'chassis', or 'blade'."]]
        }

        if (!datum.vendor || String(datum.vendor).trim() === '') {
            errors = [...errors, [i+1, 'Vendor not found']]
            modelAndVendorFound = false
        } else if (datum.vendor.trim().length > 50) {
            errors = [...errors, [i+1, 'Vendor name should not be longer than 50 characters']]
        }
        if (!datum.model_number || String(datum.model_number).trim() === '') {
            errors = [...errors, [i+1, 'Model number not found']]
            modelAndVendorFound = false
        } else if (datum.model_number.trim().length > 50) {
            errors = [...errors, [i+1, 'Model number should not be longer than 50 characters']]
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
        if (datum.mount_type !== 'blade' && datum.height && (isNaN(String(datum.height).trim()) || !Number.isInteger(parseFloat(String(datum.height).trim())) || parseInt(String(datum.height).trim()) <= 0|| parseInt(String(datum.height).trim()) > 42)) {
            errors = [...errors, [i+1, 'Height should be a positive integer not greater than 42U']]
        } else if (datum.mount_type === 'blade' && datum.height && (datum.height.trim() !== '' || datum.height.trim() !== '0')) {
            errors = [...errors, [i+1, 'Height should be 0 or blank for blades']]
        } else if (datum.mount_type === 'blade') {
            datum.height = '1'
        }
        
        if (!datum.display_color || String(datum.display_color).trim() === '') {
            datum.display_color = '#000000'
        } else if (datum.display_color && !/^#[0-9A-F]{6}$/i.test(String(datum.display_color))) {
            errors = [...errors, [i+1, 'Invalid display color']]
        }
        if (datum.mount_type !== 'blade' && datum.network_ports && String(datum.network_ports).trim() !== '' &&
         (isNaN(String(datum.network_ports).trim()) || !Number.isInteger(parseFloat(String(datum.network_ports).trim())) || parseInt(String(datum.network_ports).trim()) < 0|| parseInt(String(datum.network_ports).trim()) > 100)) {
             errors = [...errors, [i+1, 'Network ports should be a non-negative integer not greater than 100']]
        } else if (datum.mount_type === 'blade' && datum.network_ports && (datum.network_ports.trim() !== '' || datum.network_ports.trim() !== '0')) {
            errors = [...errors, [i+1, 'Network ports should be 0 or blank for blades']]
        }
        if (datum.mount_type !== 'blade' && datum.power_ports && String(datum.power_ports).trim() !== '' &&
         (isNaN(String(datum.power_ports).trim()) || !Number.isInteger(parseFloat(String(datum.power_ports).trim())) || parseInt(String(datum.power_ports).trim()) < 0 || parseInt(String(datum.power_ports).trim()) > 10)) {
             errors = [...errors, [i+1, 'Power ports should be a non-negative integer not greater than 10']]
        } else if (datum.mount_type === 'blade' && datum.power_ports && (datum.power_ports.trim() !== '' || datum.power_ports.trim() !== '0')) {
            errors = [...errors, [i+1, 'Power ports should be 0 or blank for blades']]
        }
        if (datum.memory && String(datum.memory).trim() !== '' &&
         (isNaN(String(datum.memory).trim()) || !Number.isInteger(parseFloat(String(datum.memory).trim())) || parseInt(String(datum.memory).trim()) < 0 || parseInt(String(datum.memory).trim()) > 1000)) {
             errors = [...errors, [i+1, 'Memory should be a non-negative integer not greater than 1000']]
        }

        if (datum.storage.trim() && datum.storage.trim().length > 50) {
            errors = [...errors, [i+1, 'Storage should be less than 50 characters long']]
        }

        if (datum.cpu.trim() && datum.cpu.trim().length > 50) {
            errors = [...errors, [i+1, 'CPU should be less than 50 characters long']]
        }

        if (datum.mount_type !== 'blade') {
            var uniqueNP = true
            if (datum.network_port_name_1) {
                if (datum.network_port_name_1.trim() === datum.network_port_name_2.trim() ||
                datum.network_port_name_1.trim() === datum.network_port_name_3.trim() ||
                datum.network_port_name_1.trim() === datum.network_port_name_4.trim()) {
                    uniqueNP = false
                }

                if (/\s/g.test(datum.network_port_name_1)) {
                    errors = [...errors, [i+1, 'Network port name 1 has whitespaces']]
                }
            }
            if (datum.network_port_name_2) {
                if (datum.network_port_name_2.trim() === datum.network_port_name_1.trim() ||
                datum.network_port_name_2.trim() === datum.network_port_name_3.trim() ||
                datum.network_port_name_2.trim() === datum.network_port_name_4.trim()) {
                    uniqueNP = false
                }

                if (/\s/g.test(datum.network_port_name_2)) {
                    errors = [...errors, [i+1, 'Network port name 2 has whitespaces']]
                }
            }
            if (datum.network_port_name_3) {
                if (datum.network_port_name_3.trim() === datum.network_port_name_2.trim() ||
                datum.network_port_name_3.trim() === datum.network_port_name_1.trim() ||
                datum.network_port_name_3.trim() === datum.network_port_name_4.trim()) {
                    uniqueNP = false
                }

                if (/\s/g.test(datum.network_port_name_3)) {
                    errors = [...errors, [i+1, 'Network port name 3 has whitespaces']]
                }
            }
            if (datum.network_port_name_4) {
                if (datum.network_port_name_4.trim() === datum.network_port_name_2.trim() ||
                datum.network_port_name_4.trim() === datum.network_port_name_3.trim() ||
                datum.network_port_name_4.trim() === datum.network_port_name_1.trim()) {
                    uniqueNP = false
                }
                if (/\s/g.test(datum.network_port_name_4)) {
                    errors = [...errors, [i+1, 'Network port name 4 has whitespaces']]
                }
            }

            if (!uniqueNP) {
                errors = [...errors, [i+1, 'Network port names must be unique']]
            }
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
        if (model.mount_type !== 'blade') {
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
        }

        createModel(null, ''+model.vendor, ''+model.model_number, model.height&&parseInt(model.height), ''+model.display_color,
         network_ports, model.power_ports ? parseInt(model.power_ports) : null, ''+model.cpu, ''+model.memory, ''+model.storage,
         ''+model.comment, ''+model.mount_type, (modelDoc, modelDocid) => {
             let suffixes_list = []
             let cpu = modelDoc.cpu

             while (cpu.length > 1) {
                 cpu = cpu.substr(1)
                 suffixes_list.push(cpu)
             }

             let storage = modelDoc.storage

             while (storage.length > 1) {
                 storage = storage.substr(1)
                 suffixes_list.push(storage)
             }

             let modelName = modelDoc.vendor+modelDoc.modelNumber

             while (modelName.length > 1) {
                 modelName = modelName.substr(1)
                 suffixes_list.push(modelName)
             }

             index.saveObject({...modelDoc, objectID: modelDocid, suffixes: suffixes_list.join(' ')})

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
        if (model.mount_type !== 'blade') {
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
        }

        modifyModel(model.id, ''+model.vendor, ''+model.model_number, parseInt(model.height), ''+model.display_color,
         network_ports, model.power_ports&&parseInt(model.power_ports), ''+model.cpu, ''+model.memory, ''+model.storage,
         ''+model.comment, (modelDoc, modelDocid) => {
             let suffixes_list = []
             let cpu = modelDoc.cpu

             while (cpu.length > 1) {
                 cpu = cpu.substr(1)
                 suffixes_list.push(cpu)
             }

             let storage = modelDoc.storage

             while (storage.length > 1) {
                 storage = storage.substr(1)
                 suffixes_list.push(storage)
             }

             let modelName = modelDoc.vendor+modelDoc.modelNumber

             while (modelName.length > 1) {
                 modelName = modelName.substr(1)
                 suffixes_list.push(modelName)
             }

             index.saveObject({...modelDoc, objectID: modelDocid, suffixes: suffixes_list.join(' ')})

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
getModelIdFromModelName, getAllModels, combineVendorAndModelNumber, bulkAddModels, bulkModifyModels, exportFilteredModels }
