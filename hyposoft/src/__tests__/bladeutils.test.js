import * as bladeutils from '../utils/bladeutils'
import * as decomutils from '../utils/decommissionutils'
import * as userutils from '../utils/userutils'
import * as firebaseutils from '../utils/firebaseutils'

// NOTE: please only have one assertion in each test
var ids = {}
jest.setTimeout(60000);

describe('bladeutilsTest', () => {
  beforeAll(done => {
    addInitialAssets(() => {
      firebaseutils.testDB.goOnline()
      done()
    })
  })

  describe('addChassisTests', () => {
    test('addChassis valid asset', done => {
      ids = {...ids,chassis: '999990'}
      addChassis(ids['chassis'],'A1',42,result => {
        expect(result).toBe(null)
        done()
      })
    })

    test('addChassis blades collection doc exists', done => {
      firebaseutils.db.collectionGroup('blades').where('id','==',ids['chassis']).get().then(qs => {
        expect(!qs.empty).toBe(true)
        expect(qs.docs[0].ref.parent.parent.id).toBe(ids['rack'])
        done()
      })
    })

    test('addChassis log was added', done => {
      firebaseutils.logsRef.get().then(docSnaps => {
          ids = {...ids,log: docSnaps.docs[0].id}
          firebaseutils.logsRef.doc(ids['log']).get().then(docRef => {
            expect(docRef.data().action).toBe('created')
            expect(docRef.data().objectId).toBe('999990')
            done()
          })
      })
    })

    // cleanup log
    afterAll(done => {
      firebaseutils.logsRef.doc(ids['log']).delete().then(docRef => {
          done()
      })
    })
  })

  describe('updateChassisTests', () => {
    test('updateChassis valid asset', done => {
      bladeutils.updateChassis(ids['chassis'], 'Dell man5', 'chassisHostname', 'C24', 10, '', '', 'Test Datacenter',
        {}, [], [], [], '', '', '', '',
        result => {
          expect(result).toBe(null)
          done()
      })
    })

    // add test checking servers inside were updated

    test('updateChassis blades collection doc exists and was properly updated', done => {
      firebaseutils.db.collectionGroup('blades').where('id','==',ids['chassis']).get().then(qs => {
        expect(!qs.empty).toBe(true)
        expect(qs.docs[0].ref.parent.parent.id).toBe(ids['rack2'])
        expect(qs.docs[0].data().letter).toBe('chassisHostname')
        done()
      })
    })

    test('updateChassis log was added', done => {
      firebaseutils.logsRef.get().then(docSnaps => {
          ids = {...ids,log: docSnaps.docs[0].id}
          firebaseutils.logsRef.doc(ids['log']).get().then(docRef => {
            expect(docRef.data().action).toBe('modified')
            expect(docRef.data().objectId).toBe('999990')
            done()
          })
      })
    })

    // cleanup log
    afterAll(done => {
      firebaseutils.logsRef.doc(ids['log']).delete().then(docRef => {
          done()
      })
    })
  })

  describe('deleteChassisTests', () => {
    test('deleteChassis valid asset', done => {
      bladeutils.deleteChassis(ids['chassis'],
        result => {
          expect(result).toBe(ids['chassis'])
          done()
      })
    })

    // add test for no delete if servers inside

    test('deleteChassis blades collection doc does not exist', done => {
      firebaseutils.db.collectionGroup('blades').where('id','==',ids['chassis']).get().then(qs => {
        expect(qs.empty).toBe(true)
        done()
      })
    })

    test('deleteChassis log was added', done => {
      firebaseutils.logsRef.get().then(docSnaps => {
          ids = {...ids,log: docSnaps.docs[0].id}
          firebaseutils.logsRef.doc(ids['log']).get().then(docRef => {
            expect(docRef.data().action).toBe('deleted')
            expect(docRef.data().objectId).toBe('999990')
            done()
          })
      })
    })

    // cleanup log and add a chassis back
    afterAll(done => {
      addChassis(ids['chassis'],'C24',10,result => {
        firebaseutils.logsRef.orderBy('timestamp','desc').get().then(docSnaps => {
            firebaseutils.logsRef.doc(docSnaps.docs[0].id).delete().then(docRef => {
              firebaseutils.logsRef.doc(ids['log']).delete().then(docRef => {
                  done()
              })
            })
        })
      })
    })
  })

  // make last test in suite
  describe('decommissionChassisTests', () => {
    test('decommissionChassis valid asset', done => {
      decomutils.decommissionAsset(ids['chassis'],
        result => {
          expect(result).toBe(true)
          done()
      },bladeutils.deleteChassis)
    })

    // add test for decommission all servers inside as well

    test('decommissionChassis blades collection doc does not exist', done => {
      firebaseutils.db.collectionGroup('blades').where('id','==',ids['chassis']).get().then(qs => {
        expect(qs.empty).toBe(true)
        done()
      })
    })

    test('decommissionChassis log was added', done => {
      firebaseutils.logsRef.get().then(docSnaps => {
          ids = {...ids,log: docSnaps.docs[0].id}
          firebaseutils.logsRef.doc(ids['log']).get().then(docRef => {
            expect(docRef.data().action).toBe('decommissioned')
            expect(docRef.data().objectId).toBe('999990')
            done()
          })
      })
    })

    // cleanup log and add a chassis back
    afterAll(done => {
      firebaseutils.logsRef.doc(ids['log']).delete().then(docRef => {
        firebaseutils.decommissionRef.orderBy('timestamp','desc').get().then(docSnaps => {
            firebaseutils.decommissionRef.doc(docSnaps.docs[0].id).delete().then(docRef => {
              done()
            })
        })
      })
    })
  })

  // describe('serverTests', () => {
  //   test('decommissionAsset existing asset', done => {
  //     decomutils.decommissionAsset('999999', result => {
  //         expect(result).toBe(true)
  //         done()
  //     })
  //   })
  //
  //   test('decommissionAsset non-existing asset', done => {
  //     decomutils.decommissionAsset('999998', result => {
  //         expect(result).toBe(false)
  //         done()
  //     })
  //   })
  //
  //   test('decommissionAsset collection and doc exist', done => {
  //     firebaseutils.decommissionRef.get().then(docSnaps => {
  //         ids = {...ids,decom: docSnaps.docs[0].id}
  //         firebaseutils.decommissionRef.doc(ids['decom']).get().then(docRef => {
  //           expect(docRef.exists).toBe(true)
  //           done()
  //         })
  //     })
  //   })
  //
  //   test('decommissionAsset log was added', done => {
  //     firebaseutils.logsRef.get().then(docSnaps => {
  //         ids = {...ids,log: docSnaps.docs[0].id}
  //         firebaseutils.logsRef.doc(ids['log']).get().then(docRef => {
  //           expect(docRef.data().action).toBe('decommissioned')
  //           expect(docRef.data().objectId).toBe('999999')
  //           done()
  //         })
  //     })
  //   })
  // })

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
    const rack = makeRack('A',1)
    firebaseutils.racksRef.add(rack).then(docRef => {
      ids = {...ids,rack: docRef.id}
      const rack2 = makeRack('C',24)
      firebaseutils.racksRef.add(rack2).then(docRef => {
        ids = {...ids,rack2: docRef.id}
      const dell = makeModel('Dell','man5',1,'chassis')
      firebaseutils.modelsRef.add(dell).then(docRef => {
        ids = {...ids,model: docRef.id}
        callback()
      })
      })
    })
  })
}

function tearDownAssets(callback) {
  firebaseutils.modelsRef.doc(ids['model']).delete().then(docRef => {
    // firebaseutils.assetRef.doc(ids['chassis']).delete().then(docRef => {
      firebaseutils.datacentersRef.doc(ids['datacenter']).delete().then(docRef => {
        // firebaseutils.db.collectionGroup('blades').where('id','==',ids['chassis']).get().then(qs => {
        //     qs.docs[0].ref.delete().then(docRef => {
              firebaseutils.racksRef.doc(ids['rack']).delete().then(docRef => {
                firebaseutils.racksRef.doc(ids['rack2']).delete().then(docRef => {
                          callback()
                    })
                    })
            // })
        // })
        })
      // })
    })
}

function addChassis(id,rack,rackU,callback) {
  bladeutils.addChassis(id, 'Dell man5', 'chassisHostname', rack, rackU, '', '', 'Test Datacenter',
    {}, [], [], '', '', '', '',
    result => {
      callback(result)
  })
}

function makeModel(vendor,modelNum,height,mount) {
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
      modelName: vendor + ' ' + modelNum,
      mount: mount
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

function makeRack(letter,number) {
  const rack = {
    letter: letter,
    number: number,
    height: 42,
    assets: [],
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
    permissions: ['ASSET_PERMISSION_GLOBAL','ADMIN_PERMISSION','AUDIT_PERMISSION','MODEL_PERMISSION','POWER_PERMISSION']
  }
  return user
}
