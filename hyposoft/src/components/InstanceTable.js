import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { Accordion, AccordionPanel, Box, Text, List} from 'grommet'
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
        return this.state.instances.map(( instance ) => (
            <Accordion>
                <AccordionPanel 
                key={instance.id}
                label={ instance.model}>
                <Box pad="medium" background="light-2">
          

                <List
                primaryKey="category"
                secondaryKey="value"
                data={[
                { category: "Hostname", value: instance.hostname},
                { category: "Rack", value: instance.rack},
                { category: "RackU", value: instance.rackU},
                { category: "Owner", value: instance.owner},
                { category: "Comment", value: instance.comment},

                ]}
                />
                </Box>
                </AccordionPanel>  
            </Accordion>
 
         ));
        // console.log(this.state.instances.id)
        // return (
        //     <Accordion>
        //          <AccordionPanel 
        //         // label={ this.state.instances.model }>
        //         label='Bitch'>
        //         <Box pad="medium" background="light-2">
        //         <Text>{ this.state.instances }</Text>
        //         </Box>
        //         </AccordionPanel>  
        //     </Accordion>
        //     //<h3>Hello</h3>
        // )
      
    }
}


  
