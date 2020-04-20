import React, { Component } from 'react'

import {
    Box,Button,
    Grommet } from 'grommet'
import { useMediaQuery } from 'react-responsive'

import backgroundImage from '../res/bgblurred2.png'
import theme from '../theme'

const NotFoundErrorScreen = () => {
    const isTabletOrMobileDevice = useMediaQuery({
        query: '(max-device-width: 1224px)'
    })
    return (
        <Grommet theme={theme} full className='fade'>
            <Box fill style={styles.mainContainerStyle}>
                <Box direction='row' justify='center' fill overflow={{ horizontal: 'hidden' }}>
                    <Box direction='row' justify='center'>
                        <Box
                            width='medium'
                            align='center'
                            margin={{left: 'medium'}}
                            justify='start' >
                            <Box style={styles.boxStyle}
                                direction='row'
                                alignSelf='stretch'
                                background='#FFFFFF'
                                flex={{shrink: 0}}
                                width={'medium'}
                                margin={{top: 'medium', left: 'medium'}}
                                pad='small' >
                                <Box flex align='center' margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}} direction='column' justify='start'>
                                    <Box pad={{top: 'small', bottom: 'small'}}>
                                        <p>The page you're looking for does not exist. {isTabletOrMobileDevice && "It looks like you're browisng Hyposoft on your phone. The only feature that is available on mobile devices is asset barcode scanning."}</p>
                                        <Button primary label='Go back' onClick={() => this.handleLoginClick()} />
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Grommet>
    )
}

const styles = {
    mainContainerStyle: {
        backgroundImage: 'url('+backgroundImage+')',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
    }
}

export default NotFoundErrorScreen
