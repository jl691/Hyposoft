import React, { Component } from 'react'

import {
    Box,
    Grommet } from 'grommet'
import LoginCard from '../components/LoginCard'

import backgroundImage from '../res/bgblurred2.png'
import theme from '../theme'

class HomeScreen extends Component {
    state = {

    }
    render() {
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
                                <LoginCard this={this} />
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Grommet>
        )
    }
}

const styles = {
    mainContainerStyle: {
        backgroundImage: 'url('+backgroundImage+')',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
    }
}

export default HomeScreen
