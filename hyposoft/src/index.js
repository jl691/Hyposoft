import React from 'react'
import ReactDOM from 'react-dom'
import * as serviceWorker from './serviceWorker'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import './utils/firebaseutils'

import HomeScreen from './screens/HomeScreen'
import DashboardScreen from './screens/DashboardScreen'
import SettingsScreen from './screens/SettingsScreen'

ReactDOM.render((
            <BrowserRouter>
                <Switch>
                    <Route exact path='/' component={HomeScreen} />
                    <Route exact path='/dashboard' component={DashboardScreen} />
                    <Route exact path='/settings' component={SettingsScreen} />
                </Switch>
            </BrowserRouter>
        ), document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
