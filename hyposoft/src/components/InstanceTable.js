import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { Accordion, AccordionPanel, Box, Text } from 'grommet'
import InstanceRow from './InstanceRow'

export default class InstanceTable extends Component {
    constructor(props) {
        super(props);
        this.state = {
                instances: [
                    {
                        id: 1,
                        model_id: 'R710'
                    },
                    {
                        id: 2,
                        model_id: 'R708'
                    },
                    {
                        id: 3,
                        model_id: 'S800'
                    }
                ]
            
        }
    }

    render() {
        console.log(this.props.instances)
        // should it be this.props or this.state? error when you use props
        return this.state.instances.map(( instance ) => (
            <Accordion>
                <InstanceRow>
                    instance={instance} 
                </InstanceRow>
                   
            </Accordion>
          
          
         
        ));
      
    }
}

InstanceTable.propTypes = {
    instances: PropTypes.array.isRequired,

  }
