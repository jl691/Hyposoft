import React from 'react'
import { Box } from 'grommet'
import { Redirect } from 'react-router-dom'
import { useMediaQuery } from 'react-responsive'

const AppBar = (props) => {
    const isTabletOrMobileDevice = useMediaQuery({
        query: '(max-width: 1224px)'
    })
    if (isTabletOrMobileDevice) {
        // Redirect to scanner page
        return <Redirect to='/scanner' />
    } else {
        return (
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
    }
}

export default AppBar
