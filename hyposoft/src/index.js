import React from 'react'
import ReactDOM from 'react-dom'

import * as serviceWorker from './serviceWorker'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import './utils/firebaseutils'

import './animation.css'
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
import ChangePlanScreen from "./screens/ChangePlanScreen";
import DetailedChangePlanScreen from "./screens/DetailedChangePlanScreen";
import RackView from "./components/RackView";
import AssetScreen from './screens/AssetScreen'
import RackElevations from "./components/RackElevations";
import DatacenterScreen from "./screens/DatacenterScreen";
import LogScreen from "./screens/LogScreen"
import DetailedChangeScreen from "./screens/DetailedChangeScreen"
import DecommissionedAssetScreen from "./screens/DecommissionedAssetScreen"

import PostOAuthHandler from './handlers/PostOAuthHandler'
import NetworkNeighborhood from "./components/NetworkNeighborhood";

ReactDOM.render((
            <BrowserRouter>
                <Switch>
                    <Route exact path='/' component={HomeScreen} />
                    <Route exact path='/racks' component={RackView} />
                    <Route exact path='/rackelevation' component={RackElevations} />
                    <Route exact path='/datacenters' component={DatacenterScreen} />
                    <Route exact path='/logs' component={LogScreen} />
                    <Route exact path='/dashboard' component={DashboardScreen} />
                    <Route exact path='/settings' component={SettingsScreen} />
                    <Route exact path='/users' component={UsersScreen} />
                    <Route exact path='/networkneighborhood/:assetID' component={NetworkNeighborhood} />
                    <Route path='/signup/:secret' component={ClaimScreen} />
                    <Route path='/badsignup/:secret' component={UnclaimScreen} />
                    <Route path='/resetpassword/:secret' component={ResetPasswordScreen} />
                    <Route exact path='/models' component={ModelsScreen} />
                    <Route exact path='/models/:vendor/:modelNumber' component={ModelPermaScreen} />
                    {/* TODO: have url be the ID of the instance */}
                    <Route exact path='/assets/:assetID' component={DetailedAssetScreen}/>
                    <Route exact path='/changeplans/:changePlanID' component={DetailedChangePlanScreen}/>
                    <Route exact path='/changeplans/:changePlanID/:stepID' component={DetailedChangeScreen}/>
                    {/* TODO: implement a functionality to take you to instance screen vs http://localhost:3000/instances*/}
                    <Route exact path='/assets' component={AssetScreen} />
                    <Route path='/port' component={PortScreen} />
                    <Route path='/postoauth' component={PostOAuthHandler} />
                    <Route exact path='/changeplans' component={ChangePlanScreen}/>
                    <Route exact path='/decommissioned' component={DecommissionedAssetScreen}/>
                </Switch>
            </BrowserRouter>
        ), document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
