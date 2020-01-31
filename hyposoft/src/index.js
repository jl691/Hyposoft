import React from 'react'
import ReactDOM from 'react-dom'
import HomeScreen from './screens/HomeScreen'
import RackView from "./components/RackView";
import DashboardScreen from './screens/DashboardScreen'
import InstanceScreen from './screens/InstanceScreen'
import * as serviceWorker from './serviceWorker'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import './utils/firebaseutils'
import RackDiagram from "./components/RackDiagram";
import DetailedInstanceScreen from './screens/DetailedInstanceScreen'




ReactDOM.render((
            <BrowserRouter>
                <Switch>
                    <Route exact path='/' component={HomeScreen} />
                    <Route exact path='/racks' component={RackView} />
                    <Route exact path='/rackdiagram' component={RackDiagram} />
                    <Route exact path='/dashboard' component={DashboardScreen} />

                    {/* TODO: have url be the ID of the instance */}
                    <Route exact path='/instances/:instanceID' component={DetailedInstanceScreen}/>
                    {/* TODO: implement a functionality to take you to instance screen vs http://localhost:3000/instances*/}
                    <Route exact path='/instances' component={InstanceScreen} />
                </Switch>
            </BrowserRouter>
        ), document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
