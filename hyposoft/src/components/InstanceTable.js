import React, { Component } from 'react'
import { DataTable, Button, Text } from 'grommet'
import { Trash, Edit } from 'grommet-icons'
import * as instutils from '../utils/instanceutils'


//TODO: refactor for components

export default class InstanceTable extends Component {

    startAfter = null;

    constructor(props) {
        super(props);
        this.state = {
            instances: []

        }
    }
    //TODO: need to change getInstance function in utils for infinite scroll and refresh (see issue #28)


    componentDidMount() {
        instutils.getInstance(instancesdb => {
            this.setState({ instances: instancesdb })
        })

    }

    render() {

        return (

            // LIST OF INSTANCES =============================================== 
            <DataTable
                pad="17px"
                sortable="true"
                columns={[
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

                    },
                    // {
                    //     property: 'comment',
                    //     header: <Text>Comment</Text>,

                    // },

                    {
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
                    },

                    {
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


                                    
                                }} />
                        )
                    }
                ]}
                
                data={this.state.instances}


            />


        );

    }
}



