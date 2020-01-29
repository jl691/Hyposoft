import React from 'react'
import ReactDOM from 'react-dom'
import * as serviceWorker from './serviceWorker'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import './utils/firebaseutils'
import './animation.css'

import HomeScreen from './screens/HomeScreen'
import DashboardScreen from './screens/DashboardScreen'
import SettingsScreen from './screens/SettingsScreen'
import UsersScreen from './screens/UsersScreen'
import ClaimScreen from './screens/ClaimScreen'
import UnclaimScreen from './screens/UnclaimScreen'
import ResetPasswordScreen from './screens/ResetPasswordScreen'

ReactDOM.render((
            <BrowserRouter>
                <Switch>
                    <Route exact path='/' component={HomeScreen} />
                    <Route exact path='/dashboard' component={DashboardScreen} />
                    <Route exact path='/settings' component={SettingsScreen} />
                    <Route exact path='/users' component={UsersScreen} />
                    <Route path='/signup/:secret' component={ClaimScreen} />
                    <Route path='/badsignup/:secret' component={UnclaimScreen} />
                    <Route path='/resetpassword/:secret' component={ResetPasswordScreen} />
                </Switch>
            </BrowserRouter>
        ), document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
