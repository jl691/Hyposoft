import React, { Component } from 'react'
import { DataTable, Button, Text } from 'grommet'
import { Trash, Edit } from 'grommet-icons'
import * as instutils from '../utils/instanceutils'
import * as rackutils from "../utils/rackutils";
import * as userutils from "../utils/userutils";

//TODO: refactor for components

export default class InstanceTable extends Component {

    startAfter = null;
    columns = [
        {
            property: 'instance_id',
            header: <Text>Instance ID</Text>,
            primary: true,
        },
        // {
        //     property: 'rack_id',
        //     header: <Text>Rack ID</Text>,

        // },
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
            initialLoaded: false
        }
    }
    //TODO: need to change getInstance function in utils for infinite scroll and refresh (see issue #28)


    componentDidMount() {
        instutils.getInstance((newStartAfter, instancesdb) => {
            if(newStartAfter && instancesdb){
                this.startAfter = newStartAfter;
                this.setState({ instances: instancesdb, initialLoaded: true })
            }
        })
        this.adminButtons();
    }

    adminButtons() {
        if(userutils.isLoggedInUserAdmin()) {
            this.columns.push({
                property: "delete",
                header: "Delete",

                render: datum => (
                    <Button
                        icon={<Trash />}
                        margin="small"
                        onClick={() => {
                            //TODO: need to pass up popuptype state to parent InstanceScreen
                            //this.setState({ popupType: 'Delete', deleteID: datum.id });
                            this.props.deleteButtonCallbackFromParent(datum.instance_id)
                            console.log(this.state)
                            //Need to pass the deleteID up to parent InstanceScreen


                        }} />
                )
            });
            this.columns.push({
                property: "update",
                header: "Update",

                render: data => (
                    <Button
                        icon={< Edit />}
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
            if(newStartAfter && instancesdb){
                this.startAfter = newStartAfter;
                this.setState({ instances: instancesdb, initialLoaded: true })
            }
        })
    }

    render() {

        if (!this.state.initialLoaded) {
            return (<Text>Please wait...</Text>);
        }

        return (

            // LIST OF INSTANCES =============================================== 
            <DataTable
                step={5}
                onMore={() => {
                    instutils.getInstanceAt(this.startAfter, (newStartAfter, newInstances) => {
                        this.startAfter = newStartAfter
                        this.setState({instances: this.state.instances.concat(newInstances)})
                    });
                }}
                pad="17px"
                sortable={true}
                columns={this.columns}
                
                data={this.state.instances}


            />


        );

    }
}



