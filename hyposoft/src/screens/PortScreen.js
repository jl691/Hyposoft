import React, { Component } from 'react'
import AppBar from '../components/AppBar'
import HomeButton from '../components/HomeButton'
import UserMenu from '../components/UserMenu'
import { Redirect } from 'react-router-dom'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import { saveAs } from 'file-saver'
import * as userutils from '../utils/userutils'
import * as modelutils from '../utils/modelutils'

import {
    Box,
    Button,
    Grommet,
    Heading,
    Layer } from 'grommet'

import theme from '../theme'

class PortScreen extends Component {
    state = {
        redirect: '',
        showLoadingDialog: false
    }

    constructor () {
        super()
        this.exportModels = this.exportModels.bind(this)
    }

    exportModels () {
        this.setState(oldState => ({...oldState, showLoadingDialog: true}))
        modelutils.getModelsForExport(rows => {
            var blob = new Blob([rows.map(e => e.join(",")).join("\r\n")], {
                type: "data:text/csv;charset=utf-8;",
            })
            saveAs(blob, "hyposoft_models.csv")
            this.setState(oldState => ({...oldState, showLoadingDialog: false}))
        })
    }

    render() {
        if (this.state.redirect !== '') {
            return <Redirect to={this.state.redirect} />
        }
        if (!userutils.isUserLoggedIn()) {
            userutils.logout()
            return <Redirect to='/' />
        }

        var content = [
                <Button primary label="Export Models" onClick={this.exportModels}/>,
                <Button label="Import Models" onClick={()=>{}}/>,
                <Button primary label="Export Instances" onClick={()=>{}}/>,
                <Button label="Import Instances" onClick={()=>{}}/>
        ]
        if (!userutils.isLoggedInUserAdmin()) {
            content = [
                    <Heading alignSelf='center' level='5' margin='none'>You're not an admin</Heading>,
                    <Button label="Go back" onClick={()=>this.props.history.goBack()} margin={{top: 'small'}}/>
            ]
        }

        return (
            <Grommet theme={theme} full className='fade'>

                <Box fill background='light-2'>
                    <AppBar>
                        <HomeButton alignSelf='start' this={this} />
                        <Heading alignSelf='center' level='4' margin={{
                            top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                        }} ></Heading>
                        <UserMenu alignSelf='end' this={this} />
                    </AppBar>
                    <Box direction='row'
                        justify='center'
                        wrap={true}>
                        <Box style={{
                                 borderRadius: 10,
                                 borderColor: '#EDEDED'
                             }}
                             width="medium"
                            id='containerBox'
                            background='#FFFFFF'
                            margin={{top: 'medium', bottom: 'small'}}
                            flex={{
                                grow: 0,
                                shrink: 0
                            }}
                            gap='small'
                            pad='medium' >
                            {content}
                        </Box>
                    </Box>
                </Box>
                <ToastsContainer store={ToastsStore} lightBackground/>
                {this.state.showLoadingDialog && (
                    <Layer position="center" modal onClickOutside={this.hideDeleteDialog} onEsc={this.hideDeleteDialog}>
                        <Box pad="medium" gap="small" width="medium">
                            <Heading level={4} margin="none">
                                Please wait
                            </Heading>
                            <Box
                                margin={{top: 'small'}}
                                as="footer"
                                gap="small"
                                direction="row"
                                align="center"
                                justify="start" >
                                We're preparing your export.
                            </Box>
                        </Box>
                    </Layer>
                )}
            </Grommet>
        )
    }
}

export default PortScreen
