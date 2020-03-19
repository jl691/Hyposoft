import * as firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/database'
import { sha256 } from 'js-sha256'

const firebaseConfig = {
    apiKey: "AIzaSyDYysL-YL2Q6Edyrukt2pMP9CZlKVzLfOs",
    authDomain: "hyposoft-test.firebaseapp.com",
    databaseURL: "https://hyposoft-test.firebaseio.com",
    projectId: "hyposoft-test",
    storageBucket: "hyposoft-test.appspot.com",
    messagingSenderId: "505613544306",
    appId: "1:505613544306:web:3f7e8074d506415eec0beb",
    measurementId: "G-2XZ7TZ4NRT"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

var salt = 'Do8239urjfhawfA'

function hashAndSalt(data) {
    return sha256(data + salt)
}

const db = firebase.firestore()
const testDB = firebase.database()

var usersRef = db.collection('users')
var claimsRef = db.collection('claims')
var recoveriesRef = db.collection('recoveries')
var assetRef = db.collection('assets')
var racksRef = db.collection('racks')
var modelsRef = db.collection('models')
var datacentersRef = db.collection('datacenters')
var logsRef = db.collection('logs')

export { hashAndSalt, usersRef, racksRef, assetRef, modelsRef, claimsRef, recoveriesRef, datacentersRef, logsRef, db, testDB, firebase }
