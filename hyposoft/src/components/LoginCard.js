import React from 'react'
import { Anchor, Box, Button, Image, TextInput } from 'grommet'
import { Redirect } from 'react-router-dom'
import { ToastsContainer, ToastsStore } from 'react-toasts'

import * as userutils from '../utils/userutils'

import '../misc.css'

class LoginCard extends React.Component {
    defaultState = {
        username: '',
        password: ''
    }

    state = {...this.defaultState}

    constructor () {
        super()
        this.handleStateChange = this.handleStateChange.bind(this)
        this.handleLoginClick = this.handleLoginClick.bind(this)
    }

    handleLoginClick() {
        userutils.isLoginValid(this.state.username, this.state.password, user => {
            if (user) {
                // It's a valid login
                userutils.logUserIn(user)
                this.setState(this.defaultState) // This act will redirect them to dashboard
            } else {
                ToastsStore.info('Invalid login', 3000, 'info')
            }
        })
    }

    handleStateChange (e, thingToChange) {
        var value = e.target.value
        this.setState(prevState => {
            const newState = {...prevState}
            newState[thingToChange] = value
            return newState
        })
    }

    render () {
        if (userutils.isUserLoggedIn()) {
            return <Redirect to='/dashboard' />
        }

        const props = this.props
        return (
            <Box style={styles.boxStyle}
                direction='row'
                alignSelf='stretch'
                background='#FFFFFF'
                flex={{shrink: 0}}
                width={props.isolated && 'medium'}
                margin={{top: 'medium', left: props.isolated && 'medium'}}
                pad='small' >
                <Box flex margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}} direction='column' justify='start'>
                    <Box pad={{top: 'small', bottom: 'small'}}>
                        <Image fit='contain' width='200px' src='logo_main.png' alt='Logo' alignSelf='center' margin={{bottom: 'medium'}} />
                        <TextInput
                            placeholder='Username' style={styles.TIStyle}
                            value={this.state.username}
                            onChange={e => this.handleStateChange(e, 'username')}
                            onKeyDown={e => e.key === 'Enter' && this.handleLoginClick()}
                             />
                        <TextInput
                            placeholder='Password' type='password' style={styles.TIStyle}
                            value={this.state.password}
                            onChange={e => this.handleStateChange(e, 'password')}
                            onKeyDown={e => e.key === 'Enter' && this.handleLoginClick()}
                             />
                        <Button primary label='Log in' onClick={() => this.handleLoginClick()} />
                        <Anchor margin={{top: 'medium'}} onClick={() => this.handleForgotPassword()}>I forgot my password</Anchor>
                    </Box>
                </Box>
                <ToastsContainer store={ToastsStore}/>
            </Box>
        )
    }
}

const styles = {
    boxStyle: {
        borderRadius: 10,
        borderColor: 'rgba(0, 0, 0, 0)'
    },
    TIStyle: {
        borderRadius: 100,
        marginBottom: 15
    }
}

export default LoginCard
