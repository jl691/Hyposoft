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

class DashboardScreen extends Component {
    state = {
        redirect: '',
        loading: true,
        classes: []
    }

    actions = [
        {title: 'Users', desc: 'View and manage users'},
        {title: 'Models', desc: 'View and manage models'},
        {title: 'Assets', desc: 'View and manage assets'},
        {title: 'Racks', desc: 'View and manage racks'},
        {title: 'Import / Export', desc: 'Import and export models and assets'},
        {title: 'Reports', desc: 'Generate rack usage reports'}
    ]

    doAction (action) {
        alert(action) // STUB
    }

    render() {

        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }

        var content = this.actions.map(element => (
                    <ItemCard
                        key={element.title}
                        title={element.title}
                        desc={element.desc}
                        onAction={() => this.doAction(element.title)} />
                ))

        return (
            <Grommet theme={theme} full className='fade'>

                <Box fill background='light-2'>
                    <AppBar>
                        <HomeButton alignSelf='start' this={this} />
                        <Heading alignSelf='center' level='4' margin={{
                            top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                        }} >Dashboard</Heading>
                        <UserMenu alignSelf='end' this={this} />
                    </AppBar>
                    <Box direction='row'
                        justify='center'
                        wrap={true}>
                        {content}
                    </Box>
                </Box>
                <ToastsContainer store={ToastsStore} lightBackground/>
            </Grommet>
        )
    }
}

export default DashboardScreen
