import * as firebaseutils from './firebaseutils'

function isUserLoggedIn() {
    var loginCheck = localStorage.getItem('userLoginCheck')
    var displayName = localStorage.getItem('displayName')
    var username = localStorage.getItem('username')
    var email = localStorage.getItem('email')

    return firebaseutils.hashAndSalt(displayName+username+email) === loginCheck
}

function validEmail(email) {
    var re = /^([a-zA-Z0-9._-]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function isLoggedInUserAdmin() {
    return isUserLoggedIn() && (localStorage.getItem('username') === 'admin')
}

function packageUser(displayName, username, email, password) {
    const user = {
        displayName: displayName.trim(),
        username: username.trim(),
        email: email.trim(),
        password: firebaseutils.hashAndSalt(password)
    }

    return user
}

/**
* This function assumes validation (such as taken usernames etc.) has been done
* It also assumes that we've already validated that the logged in user is the admin
*/
function createUser(displayName, username, email, password, callback) {
    firebaseutils.usersRef.doc(email).set(packageUser(displayName, username, email, password))
    callback(packageUser(displayName, username, email, password))
}

/**
* This function assumes validation (such as taken usernames etc.) has been done
* It also assumes that we've already validated that the logged in user is the user
*/
function modifyUser(displayName, username, email) {
    firebaseutils.usersRef.doc(email).update(packageUser(displayName, username, email))
}

/**
* This function assumes validation (such as taken usernames etc.) has been done
* It also assumes that we've already validated that the logged in user is the admin
*/
function deleteUser(email) {
    firebaseutils.usersRef.doc(email).delete()
}

function isLoginValid(username, password, callback) {
    firebaseutils.usersRef.where('username', '==', username)
    .where('password', '==', firebaseutils.hashAndSalt(password.trim())).get()
    .then(querySnapshot => {
        if (!querySnapshot.empty) {
            callback(querySnapshot.docs[0].data())
        } else {
            callback(null)
        }
    })
}

function logUserIn(userObject) {
    localStorage.setItem('userLoginCheck', firebaseutils.hashAndSalt(userObject.displayName+userObject.username+userObject.email))
    localStorage.setItem('displayName', userObject.displayName)
    localStorage.setItem('username', userObject.username)
    localStorage.setItem('email', userObject.email)
}

function logout() {
    localStorage.clear()
}

function getUser(email, callback) {
    firebaseutils.usersRef.doc(email).get().then(doc => callback(doc.exists ? doc.data() : null))
}

function usernameTaken(username, callback) {
    firebaseutils.usersRef.where('username', '==', username).get().then(qs => {
        callback(qs.size > 0)
    })
}

function changePassword(newPass) {
    firebaseutils.usersRef.doc(localStorage.getItem('email')).update({password: firebaseutils.hashAndSalt(newPass)})
}

function loadUsers(startAfter, callback) {
    firebaseutils.usersRef.orderBy('username').limit(25).startAfter(startAfter).get().then(docSnaps => {
        var newStartAfter = null
        if (docSnaps.docs.length === 25) {
            newStartAfter = docSnaps.docs[docSnaps.docs.length-1]
        }

        const users = docSnaps.docs.map(doc => (
            {dummy: true, username: doc.data().username, name: doc.data().displayName,
                 role: (doc.data().username === 'admin' ? 'Admin' : 'User')}
        ))
        callback(users, newStartAfter)
    })
}

/**
* Adds a claim document to the claimsRef with the fields above + secret
* Assumes all validation (existing username, email etc.) have been done
*/
function addClaim(username, displayName, email, callback) {
    if (!isLoggedInUserAdmin()) {
        callback(false); // They're doing something fishy
    } else {
        const secret = firebaseutils.hashAndSalt(username+email+new Date().getTime().toString())
        firebaseutils.claimsRef.doc(email).set({
            username: username,
            displayName: displayName,
            email: email,
            secret: secret
        }).then(() => callback(secret))
    }
}

/**
* Also simultaneously functions as validateClaim()
*/
function fetchClaim(secret, callback) {
    firebaseutils.claimsRef.where('secret', '==', secret).get().then(qs => {
        if (qs.size > 0) {
            callback(qs.docs[0].data())
        } else {
            callback(null)
        }
    })
}

function removeClaim(secret) {
    firebaseutils.claimsRef.where('secret', '==', secret).get().then(qs => {
        if (qs.size > 0) {
            qs.docs[0].ref.delete()
        }
    })
}

export { isUserLoggedIn, createUser, modifyUser, deleteUser, isLoggedInUserAdmin,
isLoginValid, logUserIn, logout, getUser, changePassword, loadUsers, addClaim,
fetchClaim, usernameTaken, validEmail, removeClaim }
