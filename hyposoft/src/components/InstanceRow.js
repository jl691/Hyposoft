import React, { Component } from 'react'
import { Accordion, AccordionPanel, Box, Text } from 'grommet'

//Pass in data from Firebase
const InstanceRow = (props) => ( 

        <AccordionPanel label="Panel 1">
            <Box pad="medium" background="light-2">
                <Text>One</Text>
            </Box>
        </AccordionPanel>
 
)

export default InstanceRow

