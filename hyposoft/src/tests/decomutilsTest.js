import * as decomutils from '../utils/decommissionutils'
import * as userutils from '../utils/userutils'
import * as firebaseutils from '../utils/firebaseutils'

// NOTE: please only have one assertion in each test
var ids = {}

export const decomutilsTest = () => describe('decomutilsTest', () => {
  beforeAll(done => {
    addInitialAssets(() => {
      firebaseutils.testDB.goOnline()
      done()
    })
  })


  test('decommissionAsset existing asset', done => {
    decomutils.decommissionAsset('999999', result => {
        expect(result).toBe(true)
        done()
    })
  })

  test('decommissionAsset non-existing asset', done => {
    decomutils.decommissionAsset('999998', result => {
        expect(result).toBe(false)
        done()
    })
  })

  test('decommissionAsset collection and doc exist', done => {
    firebaseutils.decommissionRef.get().then(docSnaps => {
        ids = {...ids,decom: docSnaps.docs[0].id}
        firebaseutils.decommissionRef.doc(ids['decom']).get().then(docRef => {
          expect(docRef.exists).toBe(true)
          done()
        })
    })
  })

  test('decommissionAsset log was added', done => {
    firebaseutils.logsRef.get().then(docSnaps => {
        ids = {...ids,log: docSnaps.docs[0].id}
        firebaseutils.logsRef.doc(ids['log']).get().then(docRef => {
          expect(docRef.data().action).toBe('decommissioned')
          expect(docRef.data().objectId).toBe('999999')
          done()
        })
    })
  })

  afterAll(done => {
    tearDownAssets(() => {
      firebaseutils.testDB.goOffline()
      done()
    })
  })
})

function addInitialAssets(callback) {
  userutils.logUserIn(makeLoggedInUser('admin'))
  const dc = makeDatacenter()
  firebaseutils.datacentersRef.add(dc).then(docRef => {
    ids = {...ids,datacenter: docRef.id}
    const rack = makeRack()
    firebaseutils.racksRef.add(rack).then(docRef => {
      ids = {...ids,rack: docRef.id}
      const dell = makeModel('Dell','man5',5)
      firebaseutils.modelsRef.add(dell).then(docRef => {
        ids = {...ids,model: docRef.id}
        const dellAsset = makeAsset('999999')
        firebaseutils.assetRef.doc('999999').set(dellAsset).then(() => {
          ids = {...ids,asset: '999999'}
          callback()
        })
      })
    })
  })
}

function tearDownAssets(callback) {
  firebaseutils.modelsRef.doc(ids['model']).delete().then(docRef => {
    firebaseutils.assetRef.doc(ids['asset']).delete().then(docRef => {
      firebaseutils.datacentersRef.doc(ids['datacenter']).delete().then(docRef => {
        firebaseutils.racksRef.doc(ids['rack']).delete().then(docRef => {
              firebaseutils.decommissionRef.doc(ids['decom']).delete().then(docRef => {
                firebaseutils.logsRef.doc(ids['log']).delete().then(docRef => {
                    callback()
                  })
                })
              })
        })
      })
    })
}

function makeAsset(id) {
  const asset = {
    assetId: id,
    modelId: ids['model'],
    model: 'Dell man5',
    hostname: 'asset1',
    rack: 'A1',
    rackU: 1,
    owner: '',
    comment: '',
    rackID: ids['rack'],
    macAddresses: {},
    networkConnections: {},
    powerConnections: [],

    //This is for rack usage reports
    modelNumber: 'man5',
    vendor: 'Dell',
    //This is for sorting
    rackRow: 'A',
    rackNum: 1,
    datacenter: 'Test Datacenter',
    datacenterID: ids['datacenter'],
    datacenterAbbrev: 'TD1'
  }
  return asset
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

function makeDatacenter() {
  const dc = {
    name: 'Test Datacenter',
    abbreviation: 'TD1',
    racks: []
  }
  return dc
}

function makeRack() {
  const rack = {
    letter: 'A',
    number: 1,
    height: 42,
    assets: ['999999'],
    powerPorts:[],
    datacenter: ids['datacenter']
  }
  return rack
}

function makeLoggedInUser(password) {
  const user = {
    displayName: 'Admin',
    username: 'admin',
    email: 'anshu.dwibhashi@duke.edu',
    docId: 'anshu.dwibhashi@duke.edu',
    password: '',
    role: 'ADMIN_ROLE'
  }
  return user
}
