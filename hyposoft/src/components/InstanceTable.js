import React, { Component } from 'react'
import { Link, Redirect } from 'react-router-dom'
import { DataTable, Button, Text, Box } from 'grommet'
import {  FormEdit, FormTrash, FormFolder } from "grommet-icons"
import * as instutils from '../utils/instanceutils'
import DetailedInstanceScreen from '../screens/DetailedInstanceScreen'

import * as userutils from "../utils/userutils";


export default class InstanceTable extends Component {

    defaultInstances = [];
    startAfter = null;
    columns = [
        {
            property: 'model',
            header: <Text size='small'>Model</Text>,
            align:"start",
            render: datum => <Text size='small'>{datum.model}</Text>,

        },
        {
            property: 'hostname',
            header: <Text size='small'>Hostname</Text>,
            align:"start",
            render: datum => <Text size='small'>{datum.hostname}</Text>,
            primary: true
        },
        {
            property: 'rack',
            header: <Text size='small'>Rack</Text>,
            align:"end",
            render: datum => <Text size='small'>{datum.rack}</Text>,

        },
        {
            property: 'rackU',
            header: <Text size='small'>Rack U</Text>,
            render: datum => <Text size='small'>{datum.rackU}</Text>,

        },
        {
            property: 'owner',
            header: <Text size='small'> Owner</Text>,
            render: datum => <Text size='small'>{datum.owner}</Text>,

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
        this.handleRackRackUSort = this.handleRackRackUSort.bind(this);
    }

    componentDidMount() {
        instutils.getInstance((newStartAfter, instancesdb) => {
            if (!(newStartAfter === null) && !(instancesdb === null)) {
                this.startAfter = newStartAfter;
                console.log(instancesdb)
                this.defaultInstances = instancesdb;
                this.setState({ instances: instancesdb, initialLoaded: true })
            }
        })
        this.adminButtons();


        this.columns.push({
            property: "details",
            header: <Text size='small'>Details</Text>,
            sortable: false,

            render: data => (


                //need to pass down instance_id to know which page to display to detailedInstanceScreen
                <React.Fragment>
                    <Link to={`/instances/${data.instance_id}`} >

                        <Button icon={< FormFolder/>}
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
                header: <Text size='small'>Delete</Text>,
                sortable: false,

                render: datum => (
                    <Button
                        icon={<FormTrash />}
                        margin="small"

                        onClick={() => {
                            console.log(datum)
                            this.props.deleteButtonCallbackFromParent(datum)


                        }} />
                )
            });
            this.columns.push({
                property: "update",
                header: <Text size='small'>Update</Text>,
                sortable: false,

                render: data => (
                    <Button
                        icon={< FormEdit />}
                        margin="small"
                        onClick={() => {

                            this.props.UpdateButtonCallbackFromParent(
                                data.instance_id,
                                data.model,
                                data.hostname,
                                data.rack,
                                data.rackU,
                                data.owner,
                                data.comment,
                            )

                            console.log(data)


                        }} />
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
                this.setState({ instances: instancesdb, initialLoaded: true })
            }
        })
    }

    restoreDefault() {
        this.setState({ instances: this.defaultInstances });
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
            if ((rackRowTemp === rackRowStart && rackNumTemp >= rackNumStart) || (rackRowTemp === rackRowEnd && rackNumTemp <= rackNumEnd) || (rackRowTemp.charCodeAt(0) > rackRowStart.charCodeAt(0) && rackRowTemp.charCodeAt(0) < rackRowEnd.charCodeAt(0))) {
                console.log("found a match!")
                newInstances.push(instance);
            }
        })

        this.setState({ instances: newInstances })
    }

    handleRackRackUSort(sortedInstances){
        this.setState({instances:sortedInstances})

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
            // <Box direction='row'
            //     justify='center'
            //     wrap={true}>
            //     <Box direction='row' justify='center'>
            //         <Box direction='row' justify='center'>
            //             <Box width='large' direction='column' align='stretch' justify='start'>
            //                 <Box style={{
            //                     borderRadius: 10,
            //                     borderColor: '#EDEDED'
            //                 }}
            //                     id='containerBox'
            //                     direction='row'
            //                     background='#FFFFFF'
            //                     margin={{ top: 'medium', bottom: 'medium' }}
            //                     flex={{
            //                         grow: 0,
            //                         shrink: 0
            //                     }}

            //                     pad='small' >
            //                     <Box margin={{ left: 'medium', top: 'small', bottom: 'small', right: 'medium' }} direction='column'
            //                         justify='start' alignSelf='stretch' flex overflow="scroll">
            //                         <Box align="center" overflow="scroll">
                                        <DataTable
                                            step={5}
                                            onMore={() => {
                                                if (this.startAfter) {
                                                    instutils.getInstanceAt(this.startAfter, (newStartAfter, newInstances) => {
                                                        this.startAfter = newStartAfter
                                                        this.setState({ instances: this.state.instances.concat(newInstances) })
                                                    });
                                                }
                                            }}
                                            pad="17px"
                                            sortable={true}
                                            columns={this.columns}
                                            size="large"
                                        

                                            data={this.state.instances}


                                        />
            //                         </Box>
            //                     </Box>
            //                 </Box>
            //             </Box>
            //         </Box>
            //     </Box>
            // </Box>




        );

    }
}



