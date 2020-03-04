import React, { Component } from 'react'
import AppBar from '../components/AppBar'
import BackButton from '../components/BackButton'
import UserMenu from '../components/UserMenu'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import { Anchor, Box, Button, Grommet, Heading, TextInput } from 'grommet'
import theme from '../theme'

class DecommissionedAssetScreen extends Component {
    constructor(props) {
        super(props)
        this.state = {}
    }

    render() {
        return (
          <Grommet theme={theme} full className='fade'>
              <Box fill background='light-2'>
                  <AppBar>
                      <BackButton alignSelf='start' this={this}/>
                      <Heading alignSelf='center' level='4' margin={{
                          top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                      }} >Decommissioned Assets</Heading>
                      <UserMenu alignSelf='end' this={this} />
                  </AppBar>
              </Box>
          </Grommet>
        )
    }
}

export default DecommissionedAssetScreen
