import React from 'react'
import ReactDOM from 'react-dom'
import HomeScreen from './screens/HomeScreen'
import * as serviceWorker from './serviceWorker'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import * as fbu from './utils/firebaseutils'

//For Instance Mgmt testing purposes:
import InstanceScreen from './screens/InstanceScreen'


ReactDOM.render((
            <BrowserRouter>
                <Switch>
                    {/* For Instance Mgmt testing purposes: */}
                    {/* <Route exact path='/' component={HomeScreen} /> */}
                    <Route exact path='/' component={InstanceScreen} />
                </Switch>
            </BrowserRouter>
        ), document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
