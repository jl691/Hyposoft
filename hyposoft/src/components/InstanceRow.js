import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { Accordion, AccordionPanel, Box, Text } from 'grommet'

//Pass in data from Firebase?? need to use instanceutils functions

export class InstanceRow extends Component {
    render(){
    
        return (
            <AccordionPanel label={ this.props.instance.model_id }>
            <Box pad="medium" background="light-2">
            <Text>Help a bitch out!</Text>
            </Box>
            </AccordionPanel> 

        )

        


    }


}

InstanceRow.propTypes = {
    instance: PropTypes.object.isRequired,
}


export default InstanceRow

