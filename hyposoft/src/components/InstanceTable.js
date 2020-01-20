import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { DataTable, Box, Text } from 'grommet'
import InstanceRow from './InstanceRow';
import * as instutils from '../utils/instanceutils'

export default class InstanceTable extends Component {
    constructor(props) {
        super(props);
        this.state = {
                instances: []
            
        }
    }

    componentDidMount() {
        instutils.getInstance(instancesdb => {
            this.setState( {instances: instancesdb })
        })

    }
   
    render() {
        // return this.state.instances.map(( instance ) => 
        // (
            // <Accordion>
            //     <AccordionPanel 
            //     key={instance.id}
            //     label={ instance.model}>
            //     <Box pad="medium" background="light-2">
        
            //     <List
            //     primaryKey="category"
            //     secondaryKey="value"
            //     data={[
            //     { category: "Hostname", value: instance.hostname},
            //     { category: "Rack", value: instance.rack},
            //     { category: "RackU", value: instance.rackU},
            //     { category: "Owner", value: instance.owner},
            //     { category: "Comment", value: instance.comment},

            //     ]}
            //     />
            //     </Box>
            //     </AccordionPanel>  
            // </Accordion>

            return(
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
                data= {this.state.instances}
                                   
            />
 
         );
      
    }
}


  
