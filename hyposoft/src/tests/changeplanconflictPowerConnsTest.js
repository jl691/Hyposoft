import * as changeplanconflictutils from '../utils/changeplanconflictutils.js'
import * as changeplanutils from '../utils/changeplanutils'
import * as userutils from '../utils/userutils'
import * as firebaseutils from '../utils/firebaseutils'

var ids = {}
jest.setTimeout(60000);

export const changeplanconflictPowerConnsTest = () => describe('change plan add asset: power connections test', () => {
    beforeAll(done => {
        conflictSetup(() => {
            done()
        })
    })

    test('changeplan add asset conflicts: power connections pass', done => {
        const powerConnections = [
            {
                pduSide: "Left",
                port: "3"
            },
            {
                pduSide: "Right",
                port: "3"
            }
        ]
        changeplanconflictutils.powerConnectionConflict(ids['changePlan'], ids['changePlanStep'], powerConnections, 'Test Datacenter3', 'A3', 1, powerConnectionsStatus => {
                expect(powerConnectionsStatus).toBe(false)
                done()

        })

    })

    test('changeplan add asset conflicts: power connection conflict', done => {
        console.log([...Object.entries(ids)])
        const powerConnections = [
            {
                pduSide: "Left",
                port: "1"
            },
            {
                pduSide: "Right",
                port: "1"
            }
        ]
        changeplanconflictutils.powerConnectionConflict(ids['changePlan'], ids['changePlanStep'], powerConnections, 'Test Datacenter3', 'A3', 1, powerConnectionsStatus => {

            firebaseutils.changeplansRef.doc(ids['changePlan']).collection('conflicts').doc(ids['changePlanStep']).get().then(docRef => {
                expect(docRef.data().powerConnections[0]).toBe('powerConnectionConflictErrID')
                done()
            })
        })
    })

    //TODO: okay so this test shows that something is a ticking time bomb??
    //if you do Left: 5, and switch the order of mixed and conflicts test, the test will not pass

    test('changeplan add asset conflicts: power connections mixed', done =>{
        //one of the connections that are to be added is occupied already on the rack, the other is not yet occupied (left 5)
        const powerConnections = [
            {
                pduSide: "Left",
                port: "1"
            },
            {
                pduSide: "Right",
                port: "5"
            }
        ]
        //left: 1, seems to pass, but left: 5 seems to give the tests some trouble
        changeplanconflictutils.powerConnectionConflict(ids['changePlan'], ids['changePlanStep'], powerConnections, 'Test Datacenter3', 'A3', 1, powerConnectionsStatus => {
            firebaseutils.changeplansRef.doc(ids['changePlan']).collection('conflicts').doc(ids['changePlanStep']).get().then(docRef => {
                expect(docRef.data().powerConnections[0]).toBe('powerConnectionConflictErrID')
                done()
            })

        })

    })



    afterAll(done => {
        tearDown(() => {
            console.log("Deleting all created database documents")
            done()
        })
    })
})

//helper functions

function conflictSetup(callback) {
    userutils.logUserIn(makeLoggedInUser('admin'))
    const dc = makeDatacenter()
    firebaseutils.datacentersRef.add(dc).then(docRef => {
        ids = { ...ids, datacenter: docRef.id }
        const rack = makeRack()
        firebaseutils.racksRef.add(rack).then(docRef => {
            ids = { ...ids, rack: docRef.id }
            const testModel3 = makeModel('Test', 'Model3', 5)
            firebaseutils.modelsRef.add(testModel3).then(docRef => {
                ids = { ...ids, model: docRef.id }
                const changePlan = makeChangePlan()
                firebaseutils.changeplansRef.add(changePlan).then(docRef => {
                    ids = { ...ids, changePlan: docRef.id }
                    const changePlanAddStep = makeChangePlanStep()
                    firebaseutils.changeplansRef.doc(ids['changePlan']).collection('changes').add(changePlanAddStep).then(docRef => {
                        { ids = { ...ids, changePlanStep: docRef.id } }
                        const asset = makeAsset('222222')
                        firebaseutils.assetRef.doc('222222').set(asset).then(() => {
                            ids = { ...ids, asset: '222222' }
                            callback()

                        })
                    })
                })
            })
        })
    })
}

function tearDown(callback) {

    firebaseutils.assetRef.doc(ids['asset']).delete().then(docRef => {
        changeplanutils.deleteChangePlan(ids['changePlan'], status => {
            firebaseutils.modelsRef.doc(ids['model']).delete().then(docRef => {
                firebaseutils.datacentersRef.doc(ids['datacenter']).delete().then(docRef => {
                    firebaseutils.racksRef.doc(ids['rack']).delete().then(docRef => {

                        callback()

                    })
                })
            })
        })

    })
}

function makeModel(vendor, modelNum, height) {
    const model = {
        vendor: vendor,
        modelNumber: modelNum,
        height: height,
        displayColor: 'BD10E0',
        networkPorts: null,
        networkPortsCount: 0,
        powerPorts: 2,
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
        name: 'Test Datacenter3',
        abbreviation: 'TD3',
        racks: []
    }
    return dc
}
function makeRack() {
    const rack = {
        letter: 'A',
        number: 3,
        height: 42,
        assets: ['222222'],
        powerPorts: [{
            assetID: '222222',
            pduSide: "Left",
            port: "1"
        },
        {
            assetID: '222222',
            pduSide: 'Right',
            port: "1"
        }],
        datacenter: ids['datacenter']
    }
    return rack
}

function makeChangePlan() {
    const changePlan = {
        executed: false,
        name: 'Test Change Plan Conflicts 3',
        owner: 'admin',
        timestamp: 1584641154270
    }
    return changePlan
}
function makeChangePlanStep() {
    const addAssetStep = {
        assetID: "",
        change: "add",
        changes: {
            comment: {
                new: "",
                old: ""
            },
            datacenter: {
                new: "Test Datacenter3",
                old: ""
            },
            datacenterAbbrev: {
                new: 'TD3',
                old: ''
            },
            datacenterID: {
                new: ids['datacenter'],
                old: ''
            },
            hostname: {
                new: 'testHostname3',
                old: ''
            },
            macAddresses: {
                new: {},
                old: {}
            },
            model: {
                new: 'Test Model3',
                old: ''
            },
            modelID: {
                new: ids['model'],
                old: ''
            },
            modelNumber: {
                new: 'Model3',
                old: ''
            },
            networkConnections: {
                new: {},
                old: {}
            },
            owner: {
                new: '',
                old: ''
            },
            powerConnections: {
                new: [
                    {
                        pduSide: "Left",
                        port: "1"
                    },
                    {
                        pduSide: "Right",
                        port: "1"
                    }
                ],
                old: []
            },
            rack: {
                new: 'A3',
                old: ''
            },
            rackID: {
                new: ids['rack'],
                old: ''
            },
            rackNum: {
                new: 3,
                old: ""
            },
            rackRow: {
                new: "A",
                old: ""
            },
            rackU: {
                new: 1,
                old: ""
            },
            vendor: {
                new: "Test",
                old: ""
            }
        },
        step: 1
    }
    return addAssetStep

}

function makeAsset(id) {
    const asset = {
        assetId: id,
        modelID: ids['model'],
        model: 'Test Model3',
        hostname: 'asset3',
        rack: 'A3',
        rackU: 1,
        owner: '',
        comment: '',
        rackID: ids['rack'],
        macAddresses: {},
        networkConnections: {},
        powerConnections: [
            {
                pduSide: "Left",
                port: "1"
            },
            {
                pduSide: "Right",
                port: "1"
            }
        ],

        //This is for rack usage reports
        modelNumber: 'Model3',
        vendor: 'Test',
        //This is for sorting
        rackRow: 'A',
        rackNum: 3,
        datacenter: 'Test Datacenter3',
        datacenterID: ids['datacenter'],
        datacenterAbbrev: 'TD3'
    }
    return asset
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
