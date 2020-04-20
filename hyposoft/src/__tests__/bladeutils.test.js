import * as bladeutils from '../utils/bladeutils'
import * as decomutils from '../utils/decommissionutils'
import * as userutils from '../utils/userutils'
import * as firebaseutils from '../utils/firebaseutils'

// NOTE: please only have one assertion in each test
var ids = {}
jest.setTimeout(120000);

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
            expect(docRef.data().objectId).toBe(ids['chassis'])
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

  describe('addServerTests', () => {
    test('addServer valid asset', done => {
      ids = {...ids,server: '999989'}
      addServer(ids['server'],'chassisHostname',14,result => {
        expect(result).toBe(null)
        done()
      })
    })

    test('addServer invalid chassis hostname', done => {
      addServer('100000'/* shouldn't matter since fill fail*/,'nonexistent',1,result => {
        expect(result).toBe('blade chassis nonexistent does not exist in datacenter Test Datacenter')
        done()
      })
    })

    test('addServer blades collection doc exists', done => {
      firebaseutils.db.collectionGroup('blades').where('id','==',ids['chassis']).get().then(qs => {
        firebaseutils.bladeRef.doc(ids['server']).get().then(doc => {
          expect(doc.exists).toBe(true)
          expect(!qs.empty).toBe(true)
          expect(qs.docs[0].data().letter).toBe(doc.data().rack)
          expect(qs.docs[0].data().assets.includes(ids['server'])).toBe(true)
          done()
        })
      })
    })

    test('addServer asset data consistency', done => {
      firebaseutils.assetRef.doc(ids['chassis']).get().then(docRef => {
        firebaseutils.assetRef.doc(ids['server']).get().then(doc => {
          expect(doc.exists).toBe(true)
          expect(docRef.exists).toBe(true)
          expect(docRef.data().rack).toBe(doc.data().rack)
          expect(docRef.data().rackU).toBe(doc.data().rackU)
          expect(docRef.data().rackID).toBe(doc.data().rackID)
          expect(docRef.data().datacenterID).toBe(doc.data().datacenterID)
          done()
        })
      })
    })

    test('addServer log was added', done => {
      firebaseutils.logsRef.get().then(docSnaps => {
          ids = {...ids,log: docSnaps.docs[0].id}
          firebaseutils.logsRef.doc(ids['log']).get().then(docRef => {
            expect(docRef.data().action).toBe('created')
            expect(docRef.data().objectId).toBe(ids['server'])
            done()
          })
      })
    })

    // cleanup log and add a chassis back
    afterAll(done => {
      ids = {...ids,chassis2: '999991'}
      addChassis(ids['chassis2'],'C24',10,result => {
        firebaseutils.logsRef.orderBy('timestamp','desc').get().then(docSnaps => {
            firebaseutils.logsRef.doc(docSnaps.docs[0].id).delete().then(docRef => {
              firebaseutils.logsRef.doc(ids['log']).delete().then(docRef => {
                  done()
              })
            })
        })
      },'newChassis')
    })
  })

  describe('updateServerTests', () => {
    test('updateServer valid asset', done => {
      bladeutils.updateServer(ids['server'], 'Cisco bl3', 'serverHost', 'newChassis', 2, '', '', 'Test Datacenter',
        {}, [], [], [], '', '', '', '',
        result => {
          expect(result).toBe(null)
          done()
      })
    })

    test('updateServer blades collection was properly updated', done => {
      firebaseutils.db.collectionGroup('blades').where('id','==',ids['chassis2']).get().then(qs => {
        firebaseutils.db.collectionGroup('blades').where('id','==',ids['chassis']).get().then(querySnapshot => {
          firebaseutils.bladeRef.doc(ids['server']).get().then(doc => {
            expect(doc.exists).toBe(true)
            expect(!qs.empty).toBe(true)
            expect(!querySnapshot.empty).toBe(true)
            expect(qs.docs[0].data().letter).toBe(doc.data().rack)
            expect(doc.data().rackU).toBe(2)
            expect(qs.docs[0].data().assets.includes(ids['server'])).toBe(true)
            expect(querySnapshot.docs[0].data().assets.includes(ids['server'])).toBe(false)
            done()
          })
        })
      })
    })

    test('updateServer asset data consistency', done => {
      firebaseutils.assetRef.doc(ids['chassis2']).get().then(docRef => {
        firebaseutils.assetRef.doc(ids['server']).get().then(doc => {
          expect(doc.exists).toBe(true)
          expect(docRef.exists).toBe(true)
          expect(doc.data().hostname).toBe('serverHost')
          expect(docRef.data().rack).toBe(doc.data().rack)
          expect(docRef.data().rackU).toBe(doc.data().rackU)
          expect(docRef.data().rackID).toBe(doc.data().rackID)
          expect(docRef.data().datacenterID).toBe(doc.data().datacenterID)
          done()
        })
      })
    })

    test('updateServer log was added', done => {
      firebaseutils.logsRef.orderBy('timestamp','desc').get().then(docSnaps => {
          ids = {...ids,log: docSnaps.docs[0].id}
          firebaseutils.logsRef.doc(ids['log']).get().then(docRef => {
            expect(docRef.data().action).toContain('modified')
            expect(docRef.data().objectId).toBe(ids['server'])
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
      bladeutils.updateChassis(ids['chassis2'], 'Dell man5', 'newChassi', 'A1', 5, '', '', 'Test Datacenter',
        {}, [], [], [], '', '', '', '',
        result => {
          expect(result).toBe(null)
          done()
      })
    })

    test('updateChassis check servers updated with chassis', done => {
      firebaseutils.assetRef.doc(ids['chassis2']).get().then(docRef => {
        firebaseutils.assetRef.doc(ids['server']).get().then(doc => {
          firebaseutils.bladeRef.doc(ids['server']).get().then(docSnap => {
            expect(doc.exists).toBe(true)
            expect(docRef.exists).toBe(true)
            expect(docRef.data().hostname).toBe(docSnap.data().rack)
            expect(docRef.data().rack).toBe(doc.data().rack)
            expect(docRef.data().rackU).toBe(doc.data().rackU)
            expect(docRef.data().rackID).toBe(doc.data().rackID)
            expect(docRef.data().datacenterID).toBe(doc.data().datacenterID)
            done()
          })
        })
      })
    })

    test('updateChassis blades collection doc exists and was properly updated', done => {
      firebaseutils.db.collectionGroup('blades').where('id','==',ids['chassis2']).get().then(qs => {
        expect(!qs.empty).toBe(true)
        expect(qs.docs[0].ref.parent.parent.id).toBe(ids['rack'])
        expect(qs.docs[0].data().letter).toBe('newChassi')
        done()
      })
    })

    test('updateChassis log was added', done => {
      firebaseutils.logsRef.orderBy('timestamp','desc').get().then(docSnaps => {
          ids = {...ids,log: docSnaps.docs[0].id}
          firebaseutils.logsRef.doc(ids['log']).get().then(docRef => {
            expect(docRef.data().action).toBe('modified')
            expect(docRef.data().objectId).toBe(ids['chassis2'])
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

    test('deleteChassis with servers', done => {
      bladeutils.deleteChassis(ids['chassis2'],
        result => {
          expect(result).toBe(null)
          done()
      })
    })

    test('deleteChassis blades collection doc does not exist', done => {
      firebaseutils.db.collectionGroup('blades').where('id','==',ids['chassis']).get().then(qs => {
        expect(qs.empty).toBe(true)
        done()
      })
    })

    test('deleteChassis log was added', done => {
      firebaseutils.logsRef.orderBy('timestamp','desc').get().then(docSnaps => {
          ids = {...ids,log: docSnaps.docs[0].id}
          firebaseutils.logsRef.doc(ids['log']).get().then(docRef => {
            expect(docRef.data().action).toBe('deleted')
            expect(docRef.data().objectId).toBe(ids['chassis'])
            done()
          })
      })
    })

    // cleanup log and add a chassis back
    afterAll(done => {
      firebaseutils.logsRef.doc(ids['log']).delete().then(docRef => {
          done()
      })
    })
  })

  describe('deleteServerTests', () => {
    test('deleteServer valid asset', done => {
      bladeutils.deleteServer(ids['server'],
        result => {
          expect(result).toBe(ids['server'])
          done()
      })
    })

    test('deleteServer bladeInfo doc does not exist', done => {
      firebaseutils.db.collectionGroup('blades').where('id','==',ids['chassis2']).get().then(qs => {
        firebaseutils.bladeRef.doc(ids['server']).get().then(doc => {
          expect(doc.exists).toBe(false)
          expect(!qs.empty).toBe(true)
          expect(qs.docs[0].data().assets.includes(ids['server'])).toBe(false)
          done()
        })
      })
    })

    test('deleteServer log was added', done => {
      firebaseutils.logsRef.orderBy('timestamp','desc').get().then(docSnaps => {
          ids = {...ids,log: docSnaps.docs[0].id}
          firebaseutils.logsRef.doc(ids['log']).get().then(docRef => {
            expect(docRef.data().action).toBe('deleted')
            expect(docRef.data().objectId).toBe(ids['server'])
            done()
          })
      })
    })

    // cleanup log and add a chassis back
    afterAll(done => {
      // need to add two servers back for decom
      addServer(ids['server'],'newChassi',7,result => {
              ids = {...ids,server2: '999988'}
              addServer(ids['server2'],'newChassi',4,result => {
                firebaseutils.logsRef.doc(ids['log']).delete().then(docRef => {
                    done()
                })
            },'serverHost2')
      })
    })
  })

  describe('decommissionServerTests', () => {
    test('decommissionServer valid asset', done => {
      decomutils.decommissionAsset(ids['server2'],
        result => {
          expect(result).toBe(true)
          done()
      },bladeutils.deleteServer)
    })

    // add test for decommission all servers inside as well

    test('decommissionServer bladeInfo doc does not exist', done => {
      firebaseutils.db.collectionGroup('blades').where('id','==',ids['chassis2']).get().then(qs => {
        firebaseutils.bladeRef.doc(ids['server2']).get().then(doc => {
          expect(doc.exists).toBe(false)
          expect(!qs.empty).toBe(true)
          expect(qs.docs[0].data().assets.includes(ids['server2'])).toBe(false)
          done()
        })
      })
    })

    test('decommissionServer log was added', done => {
      firebaseutils.logsRef.orderBy('timestamp','desc').get().then(docSnaps => {
          ids = {...ids,log: docSnaps.docs[0].id}
          firebaseutils.logsRef.doc(ids['log']).get().then(docRef => {
            expect(docRef.data().action).toBe('decommissioned')
            expect(docRef.data().objectId).toBe(ids['server2'])
            done()
          })
      })
    })

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

  // make last test in suite
  describe('decommissionChassisTests', () => {
    test('decommissionChassis valid asset', done => {
      decomutils.decommissionAsset(ids['chassis2'],
        result => {
          expect(result).toBe(true)
          done()
      },bladeutils.deleteChassis)
    })

    // add test for decommission all servers inside as well

    test('decommissionChassis blades collection doc does not exist', done => {
      firebaseutils.db.collectionGroup('blades').where('id','==',ids['chassis2']).get().then(qs => {
        firebaseutils.bladeRef.doc(ids['server2']).get().then(doc => {
          expect(doc.exists).toBe(false)
          expect(qs.empty).toBe(true)
          done()
        })
      })
    })

    test('decommissionChassis logs were added', done => {
      firebaseutils.logsRef.orderBy('timestamp','desc').get().then(docSnaps => {
          ids = {...ids,log: docSnaps.docs[0].id}
          firebaseutils.logsRef.doc(ids['log']).get().then(docRef => {
            ids = {...ids,log2: docSnaps.docs[1].id}
            firebaseutils.logsRef.doc(docSnaps.docs[1].id).get().then(doc => {
              expect(docRef.data().action).toBe('decommissioned')
              expect(docRef.data().objectId).toBe(ids['chassis2'])
              expect(doc.data().action).toBe('decommissioned')
              expect(doc.data().objectId).toBe(ids['server'])
              done()
            })
          })
      })
    })

    // cleanup log and add a chassis back
    afterAll(done => {
      firebaseutils.logsRef.doc(ids['log']).delete().then(docRef => {
        firebaseutils.logsRef.doc(ids['log2']).delete().then(docRef => {
          firebaseutils.decommissionRef.orderBy('timestamp','desc').get().then(docSnaps => {
            firebaseutils.decommissionRef.doc(docSnaps.docs[0].id).delete().then(docRef => {
              firebaseutils.decommissionRef.doc(docSnaps.docs[1].id).delete().then(docRef => {
                done()
              })
            })
          })
        })
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
    const rack = makeRack('A',1)
    firebaseutils.racksRef.add(rack).then(docRef => {
      ids = {...ids,rack: docRef.id}
      const rack2 = makeRack('C',24)
      firebaseutils.racksRef.add(rack2).then(docRef => {
        ids = {...ids,rack2: docRef.id}
      const dell = makeModel('Dell','man5',1,'chassis')
      firebaseutils.modelsRef.add(dell).then(docRef => {
        ids = {...ids,model: docRef.id}
        const cisco = makeModel('Cisco','bl3',1,'blade')
        firebaseutils.modelsRef.add(cisco).then(docRef => {
          ids = {...ids,serverModel: docRef.id}
        clearLogs(() => callback())
      })
      })
      })
    })
  })
}

function tearDownAssets(callback) {
  firebaseutils.modelsRef.doc(ids['model']).delete().then(docRef => {
    firebaseutils.modelsRef.doc(ids['serverModel']).delete().then(docRef => {
      firebaseutils.datacentersRef.doc(ids['datacenter']).delete().then(docRef => {
        firebaseutils.racksRef.doc(ids['rack']).delete().then(docRef => {
          firebaseutils.racksRef.doc(ids['rack2']).delete().then(docRef => {
            clearLogs(() => callback())
          })
        })
      })
    })
  })
}

function clearLogs(callback) {
  firebaseutils.logsRef.get().then(docSnaps => {
    docSnaps.forEach(async(doc) => {
      await new Promise(function(resolve, reject) {
        doc.ref.delete().then(() => resolve())
      })
    })
    callback()
  })
}

function addChassis(id,rack,rackU,callback,hostname='') {
  bladeutils.addChassis(id, 'Dell man5', hostname ? hostname : 'chassisHostname', rack, rackU, '', '', 'Test Datacenter',
    {}, [], [], '', '', '', '',
    result => {
      callback(result)
  })
}

function addServer(id,chassisHost,slot,callback,hostname='') {
  bladeutils.addServer(id, 'Cisco bl3', hostname ? hostname : 'serverHostname', chassisHost, slot, '', '', 'Test Datacenter',
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
