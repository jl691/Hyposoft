import React from 'react'
import { Anchor, Box, Button, CheckBox, Grommet, Heading, TextInput } from 'grommet'
import * as userutils from '../utils/userutils'
import * as firebaseutils from '../utils/firebaseutils'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import theme from '../theme'

class SettingsScreen extends React.Component {
    state = {
        displayName: localStorage.getItem('displayName'),
        username: localStorage.getItem('username'),
        newPass: '',
        newPassConf: '',
        currPass: ''
    }

    handleSave () {

    }

    changePassword () {

    }

    render() {
        return (
            <Grommet theme={theme} full className='fade'>
                <Box fill background='light-2'>
                    <Box width='100%' align='center' direction='column'>
                        <Box direction='column' justify='center' width='42em' align='stretch' margin={{top: 'medium'}}>
                            <div style={{margin: '0'}}>
                                <TextInput style={styles.TIStyle}
                                    placeholder="Display name"
                                    onChange={e => {
                                        const value = e.target.value
                                        this.setState(oldState => ({...oldState, displayName: value}))
                                    }}
                                    value={this.state.displayName}
                                    title='Display name'
                                    />
                            </div>
                            <Box margin={{top: 'medium'}}>
                                <div style={{margin: '0'}}>
                                    <TextInput style={{...styles.TIStyle, cursor: 'not-allowed'}}
                                        placeholder="username"
                                        onChange={e => {
                                            const value = e.target.value
                                            this.setState(oldState => ({...oldState, lastName: value}))
                                        }}
                                        value={this.state.username}
                                        disabled
                                        title='Username'
                                        />
                                </div>
                            </Box>
                            <Box margin={{top: 'medium'}}>
                                <div style={{margin: '0'}}>
                                    <TextInput style={{...styles.TIStyle, cursor: 'not-allowed'}}
                                        placeholder="email@website.com"
                                        onChange={e => {
                                            const value = e.target.value
                                            this.setState(oldState => ({...oldState, lastName: value}))
                                        }}
                                        value={localStorage.getItem('email')}
                                        disabled
                                        title='Email'
                                        />
                                </div>
                            </Box>
                            <Box style={styles.boxStyle}
                                id='containerBox'
                                direction='row'
                                background='#FFFFFF'
                                margin={{top: 'medium'}}
                                flex={{
                                    grow: 0,
                                    shrink: 0
                                }}
                                pad='small' >
                                <Box margin={{left: 'small', right: 'small'}} direction='column'
                                    justify='start' alignSelf='stretch' flex>
                                    <Heading level='4' margin='none'>Password</Heading>
                                    <TextInput
                                        placeholder="Current password"
                                        type='password'
                                        style={{...styles.TIStyle2, marginTop: 10}}
                                        onChange={e => {
                                            const value = e.target.value
                                            this.setState(oldState => ({...oldState, currPass: value}))
                                        }}
                                        />
                                    <TextInput
                                        placeholder="New password"
                                        type='password'
                                        style={{...styles.TIStyle2, marginTop: 10}}
                                        onChange={e => {
                                            const value = e.target.value
                                            this.setState(oldState => ({...oldState, newPass: value}))
                                        }}
                                        />
                                    <TextInput
                                        style={{...styles.TIStyle2, marginTop: 10}}
                                        placeholder="Confirm new password"
                                        type='password'
                                        onChange={e => {
                                            const value = e.target.value
                                            this.setState(oldState => ({...oldState, newPassConf: value}))
                                        }}
                                        />
                                    <Box direction='column' flex alignSelf='stretch' margin={{top: 'medium', bottom: 'small'}}>
                                        <Box direction='row' flex justify='start'>
                                            <Anchor onClick={() => {this.changePassword()}}>Change password</Anchor>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                            <Box direction='row' margin={{top: 'medium'}} gap='small'>
                                <Button
                                    primary
                                    label="Save"
                                    onClick={() => this.handleSave()}
                                    />
                                <Button
                                    label="Cancel"
                                    onClick={() => this.props.history.goBack()}
                                    />
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

export default SettingsScreen
