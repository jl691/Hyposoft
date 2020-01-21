import React, { Component } from 'react'
import { DataTable, Box, Text} from 'grommet'
import InstanceRow from './InstanceRow';
import * as instutils from '../utils/instanceutils'


//TODO: refactor for components

export default class InstanceTable extends Component {
    constructor(props) {
        super(props);
        this.state = {
            instances: []

        }
    }

    componentDidMount() {
        instutils.getInstance(instancesdb => {
            this.setState({ instances: instancesdb })
        })

    }

    render() {
      
        return (

            // LIST OF INSTANCES =============================================== 
            <DataTable
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
                ]}
                data={this.state.instances}

            />

        );

    }
}



