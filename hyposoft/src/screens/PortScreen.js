import React, { Component } from 'react'
import AppBar from '../components/AppBar'
import HomeButton from '../components/HomeButton'
import UserMenu from '../components/UserMenu'
import { Redirect } from 'react-router-dom'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import { saveAs } from 'file-saver'
import * as userutils from '../utils/userutils'
import * as modelutils from '../utils/modelutils'
import * as instanceutils from '../utils/instanceutils'
import CSVReader from 'react-csv-reader'

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
        this.exportInstances = this.exportInstances.bind(this)
        this.importModels = this.importModels.bind(this)
        this.importInstances = this.importInstances.bind(this)
        this.addInstancesToDb = this.addInstancesToDb.bind(this)
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

    exportInstances () {
        this.setState(oldState => ({...oldState, showLoadingDialog: true}))
        instanceutils.getInstancesForExport(rows => {
            var blob = new Blob([rows.map(e => e.join(",")).join("\r\n")], {
                type: "data:text/csv;charset=utf-8;",
            })
            saveAs(blob, "hyposoft_instances.csv")
            this.setState(oldState => ({...oldState, showLoadingDialog: false}))
        })
    }

    importModels (data, fileName) {
        if (data.length === 0) {
            ToastsStore.info('No records found in imported file', 3000, 'burntToast')
            return
        }

        if (!('vendor' in data[0] && 'model_number' in data[0] && 'rack' in data[0]
            && 'rack_position' in data[0] && 'hostname' in data[0] && 'owner' in data[0]
            && 'comment' in data[0])) {
            ToastsStore.info("Headers missing or incorrect", 3000, 'burntToast')
            return
        }

        modelutils.validateImportedModels(data, errors => {
            if (errors.length > 0) {
                this.setState(oldState => ({
                    ...oldState, errors: errors.map(error => <div><b>Row {error[0]}:</b> {error[1]}</div>)
                }))
            } else {
                this.setState(oldState => ({...oldState, errors: undefined}))
                modelutils.addModelsFromImport(data, false, ({modelsPending, modelsPendingInfo, ignoredModels, createdModels, modifiedModels}) => {
                    if (modelsPending.length > 0) {
                        // Show confirmation
                        this.setState(oldState => ({
                            ...oldState,
                            ignoredModels: ignoredModels, modifiedModels: modifiedModels, createdModels: createdModels,
                            showStatsForModels: false,
                            modifications: modelsPending, modificationsInfo: modelsPendingInfo.map(m => <div><b>Row {m[0]}:</b> {m[1]}</div>)
                        }))
                    } else {
                        this.setState(oldState => ({...oldState,
                        ignoredModels: ignoredModels, modifiedModels: modifiedModels, createdModels: createdModels,
                        showStatsForModels: true, modifications: undefined, modificationsInfo: undefined}))
                    }
                })
            }
        })
    }

    importInstances (data, fileName) {
        if (data.length === 0) {
            ToastsStore.info('No records found in imported file', 3000, 'burntToast')
            return
        }

        if (!('hostname' in data[0] && 'rack' in data[0] && 'rack_position' in data[0]
            && 'vendor' in data[0] && 'model_number' in data[0] && 'owner' in data[0]
            && 'comment' in data[0])) {
            ToastsStore.info("Headers missing or incorrect", 3000, 'burntToast')
            return
        }

        instanceutils.validateImportedInstances(data, ({errors, toBeAdded, toBeModified, toBeIgnored}) => {
            if (errors.length > 0) {
                this.setState(oldState => ({
                    ...oldState, errors: errors.map(error => <div><b>Row {error[0]}:</b> {error[1]}</div>)
                }))
            } else {
                if (toBeModified.length > 0) {
                    // Confirm modifications
                    this.setState(oldState => ({
                        ...oldState, errors: undefined, instancesToBeAdded: toBeAdded, instancesToBeIgnored: toBeIgnored, instancesToBeModified: toBeModified, instancesModified: undefined
                    }))
                } else {
                    // Just add the ones to be added
                    this.setState(oldState => ({
                        ...oldState, errors: undefined, instancesToBeAdded: toBeAdded, instancesToBeIgnored: toBeIgnored, instancesModified: [], instancesToBeModified: undefined
                    }))
                }

                this.addInstancesToDb(toBeAdded)
            }
        })
    }

    addInstancesToDb(toBeAdded) {
        instanceutils.forceAddInstancesToDb(toBeAdded)
    }

    modifyInstancesInDb(toBeModified) {
        instanceutils.forceModifyInstancesInDb(toBeModified)
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
                <Button label="Import Models" onClick={()=>{document.getElementById('csvreadermodels').click()}}/>,
                <Button primary label="Export Instances" onClick={this.exportInstances}/>,
                <Button label="Import Instances" onClick={()=>{document.getElementById('csvreaderinstances').click()}}/>
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
                {this.state.errors && (
                    <Layer position="center" modal onClickOutside={()=>{this.setState(oldState => ({...oldState, errors: undefined}))}} onEsc={()=>{this.setState(oldState => ({...oldState, errors: undefined}))}}>
                        <Box pad="medium" gap="small" width="medium">
                            <Heading level={4} margin="none">
                                Import failed due to the following errors
                            </Heading>
                            <Box
                                margin={{top: 'small'}}
                                as="footer"
                                gap="small"
                                direction="column"
                                align="start"
                                justify="start" >
                                {this.state.errors}
                            </Box>
                        </Box>
                    </Layer>
                )}
                {this.state.modificationsInfo && (
                    <Layer position="center" modal onClickOutside={()=>{}} onEsc={()=>{}}>
                        <Box pad="medium" gap="small" width="medium">
                            <Heading level={4} margin="none">
                                Update or ignore?
                            </Heading>
                            <p>The following models already exist in the database, and their fields' values are different from those you've supplied. Would you like to ignore these entries or update the existing values to your new values?</p>
                            <Box
                                margin={{top: 'small'}}
                                as="footer"
                                gap="small"
                                direction="column"
                                align="start"
                                justify="start" >
                                {this.state.modificationsInfo}
                            </Box>
                            <Box
                                margin={{top: 'small'}}
                                as="footer"
                                gap="small"
                                direction="row"
                                align="center"
                                justify="end" >
                                <Button label="Ignore" primary onClick={() => this.setState(oldState => ({...oldState, modifications: undefined, modificationsInfo: undefined,
                                showStatsForModels: true, ignoredModels: oldState.ignoredModels+oldState.modifiedModels, modifiedModels: 0}))} />
                                <Button
                                    label="Update"
                                    onClick={() => {
                                        modelutils.addModelsFromImport(this.state.modifications, true, () => {
                                            this.setState(oldState => ({...oldState, modifications: undefined, modificationsInfo: undefined, showStatsForModels: true}))
                                        })
                                    }}
                                    />
                            </Box>
                        </Box>
                    </Layer>
                )}
                {this.state.instancesToBeModified && (
                    <Layer position="center" modal onClickOutside={()=>{}} onEsc={()=>{}}>
                        <Box pad="medium" gap="small" width="medium">
                            <Heading level={4} margin="none">
                                Update or ignore?
                            </Heading>
                            <p>The following instances already exist in the database, and their fields' values are different from those you've supplied. Would you like to ignore these entries or update the existing values to your new values?</p>
                            <Box
                                margin={{top: 'small'}}
                                as="footer"
                                gap="small"
                                direction="column"
                                align="start"
                                justify="start" >
                                {this.state.instancesToBeModified.map(tbm => <div><b>Row {tbm.row}:</b> {tbm.hostname} ({tbm.vendor} {tbm.model_number})</div>)}
                            </Box>
                            <Box
                                margin={{top: 'small'}}
                                as="footer"
                                gap="small"
                                direction="row"
                                align="center"
                                justify="end" >
                                <Button label="Ignore" primary onClick={() => this.setState(oldState => ({
                                    ...oldState, errors: undefined, instancesToBeAdded: oldState.instancesToBeAdded, instancesToBeIgnored: [...oldState.instancesToBeIgnored, oldState.instancesToBeModified], instancesToBeModified: undefined,
                                    instancesModified: []
                                }))} />
                                <Button
                                    label="Update"
                                    onClick={() => {
                                        this.modifyInstancesInDb(this.state.instancesToBeModified)
                                        this.setState(oldState => ({
                                            ...oldState, errors: undefined, instancesToBeAdded: oldState.instancesToBeAdded, instancesToBeIgnored: [...oldState.instancesToBeIgnored], instancesToBeModified: undefined,
                                            instancesModified: [...oldState.instancesToBeModified]
                                        }))
                                    }}
                                    />
                            </Box>
                        </Box>
                    </Layer>
                )}
                {(this.state.instancesToBeAdded && this.state.instancesToBeIgnored && this.state.instancesModified
                && !this.state.errors && !this.state.instancesToBeModified) && (
                    <Layer position="center" modal onClickOutside={()=>{this.setState(oldState=>({
                        ...oldState, instancesToBeAdded: undefined, instancesToBeIgnored: undefined, instancesModified: undefined
                    }))}} onEsc={()=>{this.setState(oldState=>({
                        ...oldState, instancesToBeAdded: undefined, instancesToBeIgnored: undefined, instancesModified: undefined
                    }))}}>
                        <Box pad="medium" gap="small" width="medium">
                            <Heading level={4} margin="none">
                                Import Successful
                            </Heading>
                            <p>Here are statistics on how your database is different after import.</p>
                            <Box
                                margin={{top: 'small'}}
                                as="footer"
                                gap="small"
                                direction="column"
                                align="start"
                                justify="start" >
                                <div><b>Instances created:</b> {this.state.instancesToBeAdded.length}</div>
                                <div><b>Instances modified:</b> {this.state.instancesModified.length}</div>
                                <div><b>Records ignored:</b> {this.state.instancesToBeIgnored.length}</div>
                            </Box>
                        </Box>
                    </Layer>
                )}
                {this.state.showStatsForModels && (
                    <Layer position="center" modal onClickOutside={()=>{this.setState(oldState=>({
                        ...oldState, showStatsForModels: false, ignoredModels: undefined, createdModels: undefined,
                        modifiedModels: undefined
                    }))}} onEsc={()=>{this.setState(oldState=>({
                        ...oldState, showStatsForModels: false, ignoredModels: undefined, createdModels: undefined,
                        modifiedModels: undefined
                    }))}}>
                        <Box pad="medium" gap="small" width="medium">
                            <Heading level={4} margin="none">
                                Import Successful
                            </Heading>
                            <p>Here are statistics on how your database is different after import.</p>
                            <Box
                                margin={{top: 'small'}}
                                as="footer"
                                gap="small"
                                direction="column"
                                align="start"
                                justify="start" >
                                <div><b>Models created:</b> {this.state.createdModels}</div>
                                <div><b>Models modified:</b> {this.state.modifiedModels}</div>
                                <div><b>Records ignored:</b> {this.state.ignoredModels}</div>
                            </Box>
                        </Box>
                    </Layer>
                )}
                <CSVReader
                    cssClass="react-csv-input"
                    onFileLoaded={this.importModels}
                    parserOptions={this.papaparseOptions}
                    inputStyle={{ display: "none" }}
                    inputId='csvreadermodels'
                />
                <CSVReader
                    cssClass="react-csv-input"
                    onFileLoaded={this.importInstances}
                    parserOptions={this.papaparseOptions}
                    inputStyle={{ display: "none" }}
                    inputId='csvreaderinstances'
                />
            </Grommet>
        )
    }
    papaparseOptions = {
        header: true,
        newline: '\n',
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: header =>
          header
            .toLowerCase()
            .replace(/\W/g, '')
      }
}

export default PortScreen
