import React from 'react'
import { Anchor, Box, Button, Form, Grommet, Heading, TextInput } from 'grommet'
import * as userutils from '../utils/userutils'
import * as firebaseutils from '../utils/firebaseutils'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import { Redirect } from 'react-router-dom'
import theme from '../theme'

class ResetPasswordScreen extends React.Component {
    state = {
        password: '',
        confirm: '',
        redirect: '',
    }

    componentWillMount() {
        userutils.fetchRecovery(this.props.match.params.secret, recovery => {
            if (recovery) {
                this.setState({email: recovery.email})
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

        if (this.state.password !== this.state.confirm) {
            ToastsStore.info("Passwords don't match", 3000, 'burntToast')
            return
        }

        userutils.removeRecovery(this.props.match.params.secret)
        userutils.changePasswordByEmail(this.state.email, this.state.password, () => {
            ToastsStore.info("Saved settings", 1000, 'burntToast')
            setTimeout(() => {
                this.setState({redirect: '/'})
            }, 2000)
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
                                    <Heading level='4' margin={{bottom: 'small', top: 'none'}}>Reset password</Heading>
                                </Box>
                            </Box>
                            <Form>
                            <Box>
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

export default ResetPasswordScreen
