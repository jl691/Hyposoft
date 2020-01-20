import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { AccordionPanel, Box, Text } from 'grommet'

//Pass in data from Firebase?? need to use instanceutils functions

//I can't figure out the props passing shit and undefined/null erros, this class is dead for now

export class InstanceRow extends Component {

    
    render(){
        console.log(this.props)
        let children = React.Children.toArray(this.props.children);
        return (
            
            <AccordionPanel 
           
            label={ children}>
            <Box pad="medium" background="light-2">
            <Text>Help a bitch out!</Text>
            </Box>
            </AccordionPanel> 

        )

        
    }


}

// InstanceRow.propTypes = {
//     instance: PropTypes.object.isRequired,
// }


export default InstanceRow

