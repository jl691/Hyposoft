import * as firebase from 'firebase/app'
import 'firebase/firestore'
import { sha256 } from 'js-sha256'

const firebaseConfig = {
    apiKey: "AIzaSyBE772y7XqZWwG5Q6Un0lu3zJsM12l-EDg",
    authDomain: "hyposoft-dev.firebaseapp.com",
    databaseURL: "https://hyposoft-dev.firebaseio.com",
    projectId: "hyposoft-dev",
    storageBucket: "hyposoft-dev.appspot.com",
    messagingSenderId: "324524941581",
    appId: "1:324524941581:web:ea302b22697fc9cc9ad044",
    measurementId: "G-ZCSSY548ED"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

var salt = 'Do8239urjfhawfA'

function hashAndSalt(data) {
    return sha256(data + salt)
}

const db = firebase.firestore()

var usersRef = db.collection('users')
var claimsRef = db.collection('claims')
var recoveriesRef = db.collection('recoveries')
var assetRef = db.collection('assets')
var racksRef = db.collection('racks')
var modelsRef = db.collection('models')
var datacentersRef = db.collection('datacenters')
var logsRef = db.collection('logs')

export { hashAndSalt, usersRef, racksRef, assetRef, modelsRef, claimsRef, recoveriesRef, datacentersRef, logsRef, db, firebase }
