import React from 'react'
import { Box, Button, Form, Grommet, Heading, TextInput } from 'grommet'
import * as userutils from '../utils/userutils'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import { Redirect } from 'react-router-dom'
import theme from '../theme'

class ClaimScreen extends React.Component {
    state = {
        displayName: '',
        username: '',
        email: '',
        password: '',
        confirm: '',
        redirect: '',
    }

    componentWillMount() {
        userutils.fetchClaim(this.props.match.params.secret, claim => {
            if (claim) {
                this.setState({username: '@'+claim.username, displayName: claim.displayName, email: claim.email})
            } else {
                userutils.logout()
                this.setState({redirect: '/'})
            }
        })
    }

    handleSave () {
        if (this.state.password.trim() === '') {
            ToastsStore.info("Password required", 3000, 'burntToast')
            return
        }

        if (this.state.confirm.trim() === '') {
            ToastsStore.info("Password confirmation required", 3000, 'burntToast')
            return
        }

        if (this.state.displayName.trim() === '') {
            ToastsStore.info("Display name required", 3000, 'burntToast')
            return
        }

        if (this.state.password !== this.state.confirm) {
            ToastsStore.info("Passwords don't match", 3000, 'burntToast')
            return
        }

        userutils.removeClaim(this.props.match.params.secret)
        var username = this.state.username
        while (username.startsWith('@')) {
            username = username.substring(1)
        }
        userutils.createUser(this.state.displayName, username, this.state.email, this.state.password, user => {
            userutils.logout()
            userutils.logUserIn(user)
            this.setState({redirect: '/'})
        })
    }

    render() {
        if (this.state.redirect !== '') {
            return <Redirect to={this.state.redirect} />
        }

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
                                    <Heading level='4' margin={{bottom: 'small', top: 'none'}}>Set up your profile</Heading>
                                    <p style={{marginTop: 0}}>Provide all the details below to complete your profile. After that, you're good to go!</p>
                                </Box>
                            </Box>
                            <Form>
                            <div style={{margin: '0'}}>
                                <TextInput style={styles.TIStyle}
                                    placeholder='Display name'
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
                                        placeholder="Username"
                                        onChange={e => {
                                            const value = e.target.value
                                            this.setState(oldState => ({...oldState, username: value}))
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
                                        placeholder="Email"
                                        value={this.state.email}
                                        disabled
                                        title='Email'
                                        />
                                </div>
                            </Box>
                            <Box margin={{top: 'medium'}}>
                                <div style={{margin: '0'}}>
                                    <TextInput style={{...styles.TIStyle}}
                                        placeholder="Password"
                                        type='password'
                                        onChange={e => {
                                            const value = e.target.value
                                            this.setState(oldState => ({...oldState, password: value}))
                                        }}
                                        value={this.state.password}
                                        title='Password'
                                        />
                                </div>
                            </Box>
                            <Box margin={{top: 'medium'}}>
                                <div style={{margin: '0'}}>
                                    <TextInput style={{...styles.TIStyle}}
                                        placeholder="Confirm password"
                                        type='password'
                                        onChange={e => {
                                            const value = e.target.value
                                            this.setState(oldState => ({...oldState, confirm: value}))
                                        }}
                                        value={this.state.confirm}
                                        title='Confirm password'
                                        />
                                </div>
                            </Box>
                            <Box direction='row' margin={{top: 'medium'}} gap='small'>
                                <Button
                                    primary
                                    type='submit'
                                    label="Save"
                                    onClick={() => this.handleSave()}
                                    />
                                <Button
                                    label="Cancel"
                                    onClick={() => this.props.history.goBack()}
                                    />
                            </Box>
                            </Form>
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
