import * as modelutils from '../utils/modelutils'
import * as firebaseutils from '../utils/firebaseutils'

// NOTE: please only have one assertion in each test
var modelIds = []

describe('modelutilsTest', () => {
  beforeAll(done => {
    addInitialModels(() => {
      firebaseutils.testDB.goOnline()
      done()
    })
  })


  test('getSuggestedVendors empty string', done => {
    modelutils.getSuggestedVendors('', array => {
        expect(array).toEqual(['Apple','Dell','Google'])
        done()
    })
  })

  test('getSuggestedVendors a', done => {
    modelutils.getSuggestedVendors('a', array => {
        expect(array).toEqual(['Apple'])
        done()
    })
  })

  afterAll(done => {
    tearDownModels(() => {
      firebaseutils.testDB.goOffline()
      done()
    })
  })
})

function addInitialModels(callback) {
  const dell = makeModel('Dell','man5',5)
  const apple = makeModel('Apple','iServer',5)
  const google = makeModel('Google','fusion4',5)
  firebaseutils.modelsRef.add(dell).then(docRef => {
    modelIds.push(docRef.id)
    firebaseutils.modelsRef.add(apple).then(docRef => {
      modelIds.push(docRef.id)
      firebaseutils.modelsRef.add(google).then(docRef => {
        modelIds.push(docRef.id)
        callback()
      })
    })
  })
}

function tearDownModels(callback) {
  firebaseutils.modelsRef.doc(modelIds[0]).delete().then(docRef => {
    firebaseutils.modelsRef.doc(modelIds[1]).delete().then(docRef => {
      firebaseutils.modelsRef.doc(modelIds[2]).delete().then(docRef => {
        callback()
      })
    })
  })
}

function makeModel(vendor,modelNum,height) {
  const model = {
      vendor: vendor,
      modelNumber: modelNum,
      height: height,
      displayColor: 'BD10E0',
      networkPorts: null,
      networkPortsCount: 0,
      powerPorts: null,
      cpu: null,
      memory: null,
      storage: null,
      comment: null,
      modelName: vendor + ' ' + modelNum
  }
  return model
}
