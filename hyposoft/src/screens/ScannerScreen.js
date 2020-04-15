import React, { Component } from 'react'

import {
    Box,
    Anchor,
    Link,
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
            <Grommet theme={theme} full overflow='auto' className='fade'>
                <Box full oveflow='auto' align='center' direction='column'>
                    {this.state.assetID ? <p style={{margin: 15}}><Anchor onClick={() => {this.props.history.push('/assets/'+this.state.assetID)}}> {'View '+this.state.assetID}  </Anchor> or <Anchor onClick={() => {userutils.logout(); this.props.history.push('/')}}>Logout</Anchor></p>: <p style={{margin: 15}}>Point your camera at a barcode to get started or <Anchor onClick={() => {userutils.logout(); this.props.history.push('/')}}>Logout</Anchor></p>}
                    <Scanner onDetected={result => this.setState({assetID: result.codeResult.code})} />
                </Box>
            </Grommet>
        )
    }
}

export default ScannerScreen
