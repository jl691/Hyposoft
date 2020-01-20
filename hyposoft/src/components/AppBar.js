import React from 'react'
import { Box } from 'grommet'

const AppBar = (props) => (
    <Box
        tag='header'
        direction='row'
        align='center'
        alignContent='between'
        justify='between'
        flex={{
            grow: 0,
            shrink: 0
        }}
        background='brand'
        pad={{ left: 'medium', right: 'small', vertical: 'small' }}
        elevation='medium'
        style={{ zIndex: '1' }} >
        {props.children}
    </Box>
)

export default AppBar
