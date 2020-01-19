import React, { Component } from 'react'
import { Form, FormField, Select, RangeInput, Button, TextInput, Box } from 'grommet'


// TODO: add functionality, and UI components for filter, range, add Model, etc
// Might be a better idea to make each of these its own component, then come to this class to put all those
//components together. But that is a later me problem

const FilterBarInstances = (props) => (
    <Box
        direction='row'
        align='center'
        alignContent='between'
        justify='between'
        flex={{
            grow: 0,
            shrink: 0
        }}
        background='neutral-1'
        pad={{ left: 'medium', right: 'small', vertical: 'small' }}
        elevation='medium'
        style={{ zIndex: '1' }} >
        {props.children}
    </Box>
)

export default FilterBarInstances
