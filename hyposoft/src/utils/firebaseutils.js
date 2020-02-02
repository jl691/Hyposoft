import * as firebase from 'firebase/app'
import 'firebase/firestore'
import { sha256 } from 'js-sha256'

var firebaseConfig = {
    apiKey: "AIzaSyAxa-EP7hIwf1msxa4kGcyneWoOt7f3wR8",
    authDomain: "hyposoft-53c70.firebaseapp.com",
    databaseURL: "https://hyposoft-53c70.firebaseio.com",
    projectId: "hyposoft-53c70",
    storageBucket: "hyposoft-53c70.appspot.com",
    messagingSenderId: "290973758418",
    appId: "1:290973758418:web:0281f7a921152d805fce0b",
    measurementId: "G-713VLDN9N0"
  }

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
var instanceRef = db.collection('instances')
var racksRef = db.collection('racks')
var modelsRef = db.collection('models')

export { hashAndSalt, usersRef, racksRef, instanceRef, modelsRef, claimsRef, recoveriesRef, db, firebase }
