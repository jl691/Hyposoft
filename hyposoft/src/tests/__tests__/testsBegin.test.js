import {modelutilsTest} from '../modelutilsTest.js'
import {decomutilsTest} from '../decomutilsTest.js'
import {changeplanconflictPowerConnsTest} from '../changeplanconflictPowerConnsTest.js'
import {changeplanconflictNetworkConnsTest} from '../changeplanconflictNetworkConnsTest.js'
import {changeplanconflictsRackUTest} from '../changeplanconflictsRackUTest.js'
import {changeplanconflictutilsTest} from '../changeplanconflictutilsTest.js'
import * as firebaseutils from '../../utils/firebaseutils'

describe('Begin All Tests', () => {
    beforeAll(done => {
      firebaseutils.testDB.goOnline()
      done()
    })

    modelutilsTest()
    decomutilsTest()
    changeplanconflictPowerConnsTest()
    changeplanconflictNetworkConnsTest()
    changeplanconflictsRackUTest()
    changeplanconflictutilsTest()

    afterAll(done => {
      firebaseutils.testDB.goOffline()
      done()
    })
})
