import * as firebaseutils from './firebaseutils'

function isUserLoggedIn() {
    var loginCheck = localStorage.getItem('userLoginCheck')
    var displayName = localStorage.getItem('displayName')
    var username = localStorage.getItem('username')
    var email = localStorage.getItem('email')

    return firebaseutils.hashAndSalt(displayName+username+email) === loginCheck
}

function isLoggedInUserAdmin() {
    return isUserLoggedIn() && (localStorage.getItem('username') === 'admin')
}

function packageUser(displayName, username, email) {
    const user = {
        displayName: displayName.trim(),
        username: username.trim(),
        email: email.trim()
    }

    return user
}

/**
* This function assumes validation (such as taken usernames etc.) has been done
* It also assumes that we've already validated that the logged in user is the admin
*/
function createUser(displayName, username, email) {
    firebaseutils.usersRef.doc(email).set(packageUser(displayName, username, email))
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
    firebaseutils.usersRef.doc(email).get().then(doc => callback(doc.data()))
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

export { isUserLoggedIn, createUser, modifyUser, deleteUser, isLoggedInUserAdmin,
isLoginValid, logUserIn, logout, getUser, changePassword, loadUsers }
