import React, { Component } from 'react'

import {
    Box,
    Button,
    Grommet } from 'grommet'
import theme from '../theme'
import Scanner from '../components/Scanner'
import * as userutils from '../utils/userutils'

class ScannerScreen extends Component {
    state = {
        assetID: undefined
    }
    render() {
        return (
            <Grommet theme={theme} full className='fade'>
                <Box fill align='center' direction='column'>
                    {this.state.assetID ? <Button margin='small' label={'View '+this.state.assetID} onClick={() => {this.props.history.push('/assets/'+this.state.assetID)}} />: <p>Point your camera at a barcode to get started</p>}
                    <Button primary label='Logout' margin={{bottom: 'small'}} onClick={() => {userutils.logout(); this.props.history.push('/')}} />
                    <Scanner onDetected={result => this.setState({assetID: result.codeResult.code})} />
                </Box>
            </Grommet>
        )
    }
}

export default ScannerScreen
