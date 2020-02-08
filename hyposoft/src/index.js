import React from 'react'
import ReactDOM from 'react-dom'

import * as serviceWorker from './serviceWorker'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import './utils/firebaseutils'

import './animation.css'
import RackDiagram from "./components/RackDiagram";
import DetailedAssetScreen from './screens/DetailedAssetScreen'


import HomeScreen from './screens/HomeScreen'
import DashboardScreen from './screens/DashboardScreen'
import SettingsScreen from './screens/SettingsScreen'
import UsersScreen from './screens/UsersScreen'
import ClaimScreen from './screens/ClaimScreen'
import UnclaimScreen from './screens/UnclaimScreen'
import ResetPasswordScreen from './screens/ResetPasswordScreen'
import ModelsScreen from './screens/ModelsScreen'
import ModelPermaScreen from './screens/ModelPermaScreen'
import PortScreen from './screens/PortScreen'

import RackView from "./components/RackView";
import AssetScreen from './screens/AssetScreen'

ReactDOM.render((
            <BrowserRouter>
                <Switch>
                    <Route exact path='/' component={HomeScreen} />
                    <Route exact path='/racks' component={RackView} />
                    <Route exact path='/rackelevation' component={RackDiagram} />
                    <Route exact path='/dashboard' component={DashboardScreen} />
                    <Route exact path='/settings' component={SettingsScreen} />
                    <Route exact path='/users' component={UsersScreen} />
                    <Route path='/signup/:secret' component={ClaimScreen} />
                    <Route path='/badsignup/:secret' component={UnclaimScreen} />
                    <Route path='/resetpassword/:secret' component={ResetPasswordScreen} />
                    <Route exact path='/models' component={ModelsScreen} />
                    <Route exact path='/models/:vendor/:modelNumber' component={ModelPermaScreen} />
                    {/* TODO: have url be the ID of the instance */}
                    <Route exact path='/assets/:assetID' component={DetailedAssetScreen}/>
                    {/* TODO: implement a functionality to take you to instance screen vs http://localhost:3000/instances*/}
                    <Route exact path='/assets' component={AssetScreen} />
                    <Route path='/port' component={PortScreen} />
                </Switch>
            </BrowserRouter>
        ), document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
