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
        {title: 'Action 1', desc: 'Description of action 1'},
        {title: 'Action 2', desc: 'Description of action 2'},
        {title: 'Action 3', desc: 'Description of action 3'}
    ]

    doAction (action) {

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
                        <Heading alignSelf='center' flex={1} level='4' margin={{
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
