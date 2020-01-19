import React, { Component } from 'react'
import AppBar from '../components/AppBar'
import HomeButton from '../components/HomeButton'
import UserMenu from '../components/UserMenu'
import ItemCard from '../components/ItemCard'
import { Redirect } from 'react-router-dom'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import * as userutils from '../utils/userutils'

import {
    Box,
    Grommet,
    Heading } from 'grommet'

import theme from '../theme'

class UsersScreen extends Component {
    state = {
        redirect: '',
        loading: true,
        classes: []
    }

    actions = [
        {id: 0, title: 'Users', desc: 'View and manage users'},
        {id: 1, title: 'Models', desc: 'View and manage models'},
        {id: 2, title: 'Instances', desc: 'View and manage instances of models'},
        {id: 3, title: 'Racks', desc: 'View and manage racks'},
        {id: 4, title: 'Import / Export', desc: 'Import and export models and instances'},
        {id: 5, title: 'Reports', desc: 'Generate rack usage reports'}
    ]

    doAction (action) {
        switch(action) {
            case 0:
                this.setState({redirect: '/users'})
                break
            default:
                alert(action)
        }
    }

    render() {
        if (this.state.redirect !== '') {
            return <Redirect to={this.state.redirect} />
        }
        if (!userutils.isUserLoggedIn()) {
            userutils.logout()
            return <Redirect to='/' />
        }

        return (
            <Grommet theme={theme} full className='fade'>

                <Box fill background='light-2'>
                    <AppBar>
                        <HomeButton alignSelf='start' this={this} />
                        <Heading alignSelf='center' level='4' margin={{
                            top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                        }} >Users</Heading>
                        <UserMenu alignSelf='end' this={this} />
                    </AppBar>

                    <Box direction='row'
                        justify='center'
                        wrap={true}>

                    </Box>
                </Box>
                <ToastsContainer store={ToastsStore} lightBackground/>
            </Grommet>
        )
    }
}

export default UsersScreen
