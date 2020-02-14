import React, { Component } from 'react'
import AppBar from '../components/AppBar'
import HomeButton from '../components/HomeButton'
import UserMenu from '../components/UserMenu'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import { Anchor, Box, Button, Grommet, Heading, TextInput } from 'grommet'
import theme from '../theme'
import * as logutils from '../utils/logutils'

class LogScreen extends Component {
    // constructor(props) {
    //     super(props)
        state = {}
    // }
    render() {
        return (
          <Grommet theme={theme} full className='fade'>
              <Box fill background='light-2'>
                  <AppBar>
                      <HomeButton alignSelf='start' this={this} />
                      <Heading alignSelf='center' level='4' margin={{
                          top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                      }} >Logs</Heading>
                      <UserMenu alignSelf='end' this={this} />
                  </AppBar>
              </Box>
          </Grommet>
        )
    }
}

export default LogScreen
