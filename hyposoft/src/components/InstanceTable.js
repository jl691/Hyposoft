import React, { Component } from 'react'
import { Accordion, AccordionPanel, Box, Text } from 'grommet'

//TODO: Watch video again on how he nested the todos in the list
//Essentially try to do the same here

export default class InstanceTable extends Component {
    render() {
        return (
            <Accordion>
            <AccordionPanel label="Panel 1">
            <Box pad="medium" background="light-2">
            <Text>One</Text>
            </Box>
            </AccordionPanel>
            <AccordionPanel label="Panel 2">
            <Box pad="medium" background="light-2">
            <Text>Two</Text>
            </Box>
            </AccordionPanel>
            </Accordion>
        )
    }
}
