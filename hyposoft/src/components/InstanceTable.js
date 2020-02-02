import React, { Component } from 'react'
import {Link, Redirect} from 'react-router-dom'
import { DataTable, Button, Text} from 'grommet'
import { Book, Trash, Edit} from 'grommet-icons'
import * as instutils from '../utils/instanceutils'
import DetailedInstanceScreen from '../screens/DetailedInstanceScreen'

import * as userutils from "../utils/userutils";


export default class InstanceTable extends Component {

    defaultInstances = [];
    startAfter = null;
    columns = [
        {
            property: 'instance_id',
            header:  <Text>Instance ID</Text>,
            primary: true,
        },

        {
            property: 'model',
            header: <Text>Model</Text>,

        },
        {
            property: 'hostname',
            header: <Text>Hostname</Text>,

        },
        {
            property: 'rack',
            header: <Text>Rack</Text>,

        },
        {
            property: 'rackU',
            header: <Text>RackU</Text>,

        },
        {
            property: 'owner',
            header: <Text>Owner</Text>,

        }
    ];

    constructor(props) {
        super(props);
        this.state = {
            instances: [],
            initialLoaded: false,
     
        }

        this.handleFilter = this.handleFilter.bind(this);
        this.restoreDefault = this.restoreDefault.bind(this);
    }

    componentDidMount() {
        instutils.getInstance((newStartAfter, instancesdb) => {
            if (!(newStartAfter === null) && !(instancesdb === null)) {
                this.startAfter = newStartAfter;
                this.defaultInstances = instancesdb;
                this.setState({instances: instancesdb, initialLoaded: true})
            }
        })
        this.adminButtons();


        this.columns.push({
            property: "details",
            header: "Details",
            sortable:false,

            render: data => (


                //need to pass down instance_id to know which page to display to detailedInstanceScreen
                <React.Fragment>
                    <Link to={`/instances/${data.instance_id}`} >

                        <Button icon={< Book />}
                            margin="small"
                            onClick={new DetailedInstanceScreen()}

                        />

                        {/* this.props.history.push */}
                    </Link>

                </React.Fragment>
            )

        })

    }



    adminButtons() {
        if (userutils.isLoggedInUserAdmin()) {
            this.columns.push({
                property: "delete",
                header: "Delete",
                sortable:false,

                render: datum => (
                    <Button
                        icon={<Trash/>}
                        margin="small"
                        
                        onClick={() => {
                            console.log(datum)
                            this.props.deleteButtonCallbackFromParent(datum)


                        }}/>
                )
            });
            this.columns.push({
                property: "update",
                header: "Update",
                sortable:false,

                render: data => (
                    <Button
                        icon={< Edit/>}
                        margin="small"
                        onClick={() => {

                            this.props.UpdateButtonCallbackFromParent(
                                data.instance_id,
                                data.model,
                                data.hostname,
                                data.rack,
                                data.rackU,
                                data.owner,
                                data.comment)

                            console.log(data.model)


                        }}/>
                )
            })
        }

    }



    forceRefresh() {
        this.startAfter = null;
        this.setState({
            instances: [],
            initialLoaded: false
        });
        instutils.getInstance((newStartAfter, instancesdb) => {
            if (newStartAfter && instancesdb) {
                this.startAfter = newStartAfter;
                this.setState({instances: instancesdb, initialLoaded: true})
            }
        })
    }

    restoreDefault() {
        this.setState({instances: this.defaultInstances});
    }

    handleFilter(start, end) {
        console.log("triggered with " + start + " and " + end)
        let splitRackArrayStart = start.split(/(\d+)/);
        let rackRowStart = splitRackArrayStart[0];
        let rackNumStart = parseInt(splitRackArrayStart[1]);

        let splitRackArrayEnd = end.split(/(\d+)/);
        let rackRowEnd = splitRackArrayEnd[0];
        let rackNumEnd = parseInt(splitRackArrayEnd[1]);

        let newInstances = [];
        let splitRackArrayTemp, rackRowTemp, rackNumTemp;
        this.defaultInstances.forEach(instance => {
            splitRackArrayTemp = instance.rack.split(/(\d+)/);
            rackRowTemp = splitRackArrayTemp[0];
            rackNumTemp = parseInt(splitRackArrayTemp[1]);
            console.log("current instance: " + rackRowTemp.charCodeAt(0) + " " + rackNumTemp)
            console.log("rackRowTemp " + rackRowTemp + " rackNumTemp " + rackNumTemp)
            console.log("rackRowStart " + rackRowStart.charCodeAt(0) + " rackRowEnd " + rackRowEnd.charCodeAt(0) + " rackNumStart " + rackNumStart + " rackNumEnd " + rackNumEnd)
            /*if(rackRowTemp.charCodeAt(0) >= rackRowStart.charCodeAt(0) && rackRowTemp.charCodeAt(0) <= rackRowEnd.charCodeAt(0) && rackNumTemp >= rackNumStart && rackNumTemp <= rackNumEnd){
                console.log("found a match!")
                newInstances.push(instance);
            }*/
            if((rackRowTemp === rackRowStart && rackNumTemp >= rackNumStart) || (rackRowTemp === rackRowEnd && rackNumTemp <= rackNumEnd) || (rackRowTemp.charCodeAt(0) > rackRowStart.charCodeAt(0) && rackRowTemp.charCodeAt(0) < rackRowEnd.charCodeAt(0))){
                console.log("found a match!")
                newInstances.push(instance);
            }
        })

        this.setState({instances: newInstances})
    }


    render() {

        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }

        if (!this.state.initialLoaded) {
            return (<Text>Please wait...</Text>);
        }


        return (

            // LIST OF INSTANCES ===============================================
       
                <DataTable
                    step={5}
                    onMore={() => {
                        if(this.startAfter){
                            instutils.getInstanceAt(this.startAfter, (newStartAfter, newInstances) => {
                                this.startAfter = newStartAfter
                                this.setState({ instances: this.state.instances.concat(newInstances) })
                            });
                        }
                    }}
                    pad="17px"
                    sortable={true}
                    columns={this.columns}

                    data={this.state.instances}


                />
    


        );

    }
}



