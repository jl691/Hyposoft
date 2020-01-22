import React, { Component } from 'react'
import { DataTable, Button, Text } from 'grommet'
import { Trash } from 'grommet-icons'
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



    // callbackFunctionRefresh = (data) => {
    //     this.forceRefresh();
    // }

    //  //TODO: need to pass info amongst siblings: AddInstanceForm to InstanceScreen to InstanceTable

    // forceRefresh() {
    //     this.startAfter = null;
    //     this.setState({initialLoaded: false, instances: [], popupType: "", deleteID: ""});
    //     instutils.getInstance((startAfterCallback, rackCallback) => {
    //         if (startAfterCallback && rackCallback) {
    //             this.startAfter = startAfterCallback;
    //             this.setState({racks: rackCallback, initialLoaded: true});
    //         }
    //     })
    // }

    componentDidMount() {
        instutils.getInstance(instancesdb => {
            this.setState({ instances: instancesdb })
        })

    }

    render() {

        return (

            // LIST OF INSTANCES =============================================== 
            <DataTable
                pad="20px"
                sortable="true"
                columns={[
                    {
                        property: 'doc_id',
                        header: <Text>ID</Text>,
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

                    },
                    {
                        property: 'comment',
                        header: <Text>Comment</Text>,

                    },

                    {
                        property: "delete",
                        header: "Delete",
                        render: datum => (
                            <Button
                                icon={<Trash />}
                                margin="small"
                                onClick={() => {
                                    this.setState({ popupType: 'Delete', deleteID: datum.id });
                                }} />
                        )
                    }
                ]}
                data={this.state.instances}


            />


        );

    }
}



