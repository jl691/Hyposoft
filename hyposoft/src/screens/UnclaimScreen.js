import React from 'react'
import { Anchor, Box, Button, Grommet, Heading, TextInput } from 'grommet'
import * as userutils from '../utils/userutils'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import theme from '../theme'

class ClaimScreen extends React.Component {
    render() {
        userutils.removeClaim(this.props.match.params.secret)

        return (
            <Grommet theme={theme} full className='fade'>
                <Box fill background='light-2'>
                    <Box width='100%' align='center' direction='column'>
                        <Box direction='column' justify='center' width='42em' align='stretch' margin={{top: 'medium'}}>
                            <Box style={styles.boxStyle}
                                id='containerBox'
                                direction='row'
                                background='#FFFFFF'
                                margin={{top: 'medium', bottom: 'medium'}}
                                flex={{
                                    grow: 0,
                                    shrink: 0
                                }}
                                pad='small' >
                                <Box margin={{left: 'small', right: 'small'}} direction='column'
                                    justify='start' alignSelf='stretch' flex>
                                    <Heading level='4' margin={{bottom: 'small', top: 'none'}}>Thanks for letting us know!</Heading>
                                    <p style={{marginTop: 0}}>Sorry that you got an invite you weren't expecting. We've updated our records. You may safely close this tab now.</p>
                                </Box>
                            </Box>
                        </Box>
                        <ToastsContainer store={ToastsStore}/>
                    </Box>
                </Box>
            </Grommet>
        )
    }
}

const styles = {
    TIStyle: {
        borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#FFFFFF',
        width: '100%', paddingLeft: 20, fontWeight: 'normal'
    },
    TIStyle2: {
        borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
        width: '100%', paddingLeft: 20, fontWeight: 'normal'
    },
    boxStyle: {
        borderColor: '#EDEDED',
        paddingTop: 15
    }
}

export default ClaimScreen
