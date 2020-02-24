import React, { Component } from 'react'
import AppBar from '../components/AppBar'
import HomeButton from '../components/HomeButton'
import UserMenu from '../components/UserMenu'
import { Redirect } from 'react-router-dom'
import { ToastsContainer, ToastsStore } from 'react-toasts'
import { saveAs } from 'file-saver'
import * as userutils from '../utils/userutils'
import * as modelutils from '../utils/modelutils'
import * as assetutils from '../utils/assetutils'
import * as bulkutils from '../utils/bulkutils'
import * as bulkconnectionsutils from '../utils/bulkconnectionsutils'
import CSVReader from 'react-csv-reader'

import {
    Anchor,
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
        this.exportAssets = this.exportAssets.bind(this)
        this.importModels = this.importModels.bind(this)
        this.importAssets = this.importAssets.bind(this)
        this.addAssetsToDb = this.addAssetsToDb.bind(this)
        this.showFormatDocumentation = this.showFormatDocumentation.bind(this)
        this.importConnections = this.importConnections.bind(this)
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

    exportAssets () {
        this.setState(oldState => ({...oldState, showLoadingDialog: true}))
        assetutils.getAssetsForExport(rows => {
            var blob = new Blob([rows.map(e => e.join(",")).join("\r\n")], {
                type: "data:text/csv;charset=utf-8;",
            })
            saveAs(blob, "hyposoft_assets.csv")
            this.setState(oldState => ({...oldState, showLoadingDialog: false}))
        })
    }

    importConnections (uselessdata, filename) {
        const file = document.querySelector('#csvreaderconn').files[0]
        bulkutils.parseCSVFile(file, data => {
            document.getElementById('csvreaderconn').value = ''
            if (data.length === 0) {
                ToastsStore.info('No records found in imported file', 3000, 'burntToast')
                return
            }

            if (!('src_hostname' in data[0] && 'src_port' in data[0] && 'src_mac' in data[0]
                && 'dest_hostname' in data[0] && 'dest_port' in data[0])) {
                ToastsStore.info("Headers missing or incorrect", 3000, 'burntToast')
                return
            }
            this.setState(oldState => ({...oldState, showLoadingDialog: true}))
            bulkconnectionsutils.validateImportedConnections(data, ({ errors, toBeIgnored, toBeModified, toBeAdded, fetchedAssets }) => {
                if (errors.length > 0) {
                    this.setState(oldState => ({
                        ...oldState, showLoadingDialog: false, errors: errors.map(error => <div><b>Row {error[0]}:</b> {error[1]}</div>)
                    }))
                } else {
                    // NOTE: Addition and modification are done by the same utils function
                    // The only difference is that you have to confirm modifications

                    this.setState(oldState => ({...oldState, showLoadingDialog: false, errors: undefined}))
                    if (toBeModified.length === 0) {
                        if (toBeAdded.length > 0) {
                            bulkconnectionsutils.addConnections(toBeAdded, fetchedAssets, () => {
                                this.setState(oldState => ({...oldState, modificationsInfoConns: undefined, showStatsForConns: true, ignoredConns: toBeIgnored, modifiedConns: [], createdConns: toBeAdded}))
                            })
                        } else {
                            this.setState(oldState => ({...oldState, modificationsInfoConns: undefined, showStatsForConns: true, ignoredConns: toBeIgnored, modifiedConns: [], createdConns: []}))
                        }
                    } else {
                        // Ask if they want to modify, then add.
                        this.setState(oldState => ({
                            ...oldState, showLoadingDialog: false,
                            ignoredConns: toBeIgnored, modifiedConns: toBeModified, createdConns: toBeAdded,
                            showStatsForConns: false,
                            fetchedAssets: fetchedAssets,
                            modificationsInfoConns: toBeModified.map(m => <div><b>Row {m.rowNumber}:</b> {m.src_hostname+' ('+m.src_port+') '+String.fromCharCode(8594)+' '+(m.dest_hostname ? m.dest_hostname+' ('+m.dest_port+')' : 'Disconnected')}</div>)
                        }))

                        if (toBeAdded.length > 0) {
                            bulkconnectionsutils.addConnections(toBeAdded, fetchedAssets, () => {})
                        }
                    }
                }
            })
        })
    }

    importModels (uselessdata, fileName) {
        const file = document.querySelector('#csvreadermodels').files[0]
        bulkutils.parseCSVFile(file, data => {
            document.getElementById('csvreadermodels').value = ''
            if (data.length === 0) {
                ToastsStore.info('No records found in imported file', 3000, 'burntToast')
                return
            }

            if (!('vendor' in data[0] && 'model_number' in data[0] && 'height' in data[0]
                && 'display_color' in data[0] && 'network_ports' in data[0] && 'power_ports' in data[0]
                && 'cpu' in data[0] && 'memory' in data[0] && 'storage' in data[0] && 'comment' in data[0]
                && 'network_port_name_1' in data[0] && 'network_port_name_2' in data[0] && 'network_port_name_3' in data[0]
                && 'network_port_name_4' in data[0])) {
                ToastsStore.info("Headers missing or incorrect", 3000, 'burntToast')
                return
            }
            this.setState(oldState => ({...oldState, showLoadingDialog: true}))
            modelutils.validateImportedModels(data, ({ errors, toBeIgnored, toBeModified, toBeAdded }) => {
                if (errors.length > 0) {
                    this.setState(oldState => ({
                        ...oldState, showLoadingDialog: false, errors: errors.map(error => <div><b>Row {error[0]}:</b> {error[1]}</div>)
                    }))
                } else {
                    this.setState(oldState => ({...oldState, showLoadingDialog: false, errors: undefined}))
                    if (toBeModified.length === 0) {
                        if (toBeAdded.length > 0) {
                            modelutils.bulkAddModels(toBeAdded, () => {
                                this.setState(oldState => ({...oldState, modificationsInfo: undefined, showStatsForModels: true, ignoredModels: toBeIgnored, modifiedModels: [], createdModels: toBeAdded}))
                            })
                        } else {
                            this.setState(oldState => ({...oldState, modificationsInfo: undefined, showStatsForModels: true, ignoredModels: toBeIgnored, modifiedModels: [], createdModels: []}))
                        }
                    } else {
                        // Ask if they want to modify, then add.
                        this.setState(oldState => ({
                            ...oldState, showLoadingDialog: false,
                            ignoredModels: toBeIgnored, modifiedModels: toBeModified, createdModels: toBeAdded,
                            showStatsForModels: false,
                            modificationsInfo: toBeModified.map(m => <div><b>Row {m.rowNumber}:</b> {m.vendor+' '+m.model_number}</div>)
                        }))

                        if (toBeAdded.length > 0) {
                            modelutils.bulkAddModels(toBeAdded, () => {})
                        }
                    }
                }
            })
        })
    }

    importAssets (data, fileName) {
        this.setState(oldState => ({...oldState, showLoadingDialog: true}))
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

        assetutils.validateImportedAssets(data, ({errors, toBeAdded, toBeModified, toBeIgnored}) => {
            if (errors.length > 0) {
                this.setState(oldState => ({
                    ...oldState, showLoadingDialog: false, errors: errors.map(error => <div><b>Row {error[0]}:</b> {error[1]}</div>)
                }))
            } else {
                if (toBeModified.length > 0) {
                    // Confirm modifications
                    this.setState(oldState => ({
                        ...oldState, showLoadingDialog: false, errors: undefined, assetsToBeAdded: toBeAdded, assetsToBeIgnored: toBeIgnored, assetsToBeModified: toBeModified, assetsModified: undefined
                    }))
                } else {
                    // Just add the ones to be added
                    this.setState(oldState => ({
                        ...oldState, showLoadingDialog: false, errors: undefined, assetsToBeAdded: toBeAdded, assetsToBeIgnored: toBeIgnored, assetsModified: [], assetsToBeModified: undefined
                    }))
                }

                this.addAssetsToDb(toBeAdded)
            }
        })
    }

    addAssetsToDb(toBeAdded) {
        assetutils.forceAddAssetsToDb(toBeAdded)
    }

    modifyAssetsInDb(toBeModified) {
        assetutils.forceModifyAssetsInDb(toBeModified)
    }

    showFormatDocumentation() {
        this.setState(oldState => ({
            ...oldState, showFormatDocumentation: true
        }))
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
                <Button primary label="Export Assets" onClick={this.exportAssets}/>,
                <Button label="Import Assets" onClick={()=>{document.getElementById('csvreaderassets').click()}}/>,
                <Button primary label="Export Network Connections" onClick={this.exportAssets}/>,
                <Button label="Import Network Connections" onClick={()=>{document.getElementById('csvreaderconn').click()}}/>,
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
                            pad={{top: 'medium', left: 'medium', right: 'medium'}} >
                            {content}
                            <Anchor margin={{top: 'small'}} style={{marginBottom: 10}} alignSelf='center' onClick={this.showFormatDocumentation}>Need documentation for file format?</Anchor>
                        </Box>
                    </Box>
                </Box>
                <ToastsContainer store={ToastsStore} lightBackground/>
                {this.state.showFormatDocumentation && (
                    <Layer position="center" modal onClickOutside={()=>{this.setState(oldState => ({...oldState, showFormatDocumentation: false}))}} onEsc={()=>{this.setState(oldState => ({...oldState, showFormatDocumentation: false}))}}>
                        <Box pad="medium" gap="small" width="large">
                            <Heading level={4} margin="none">
                                Import File Format Documentation
                            </Heading>
                            <Box
                                margin={{top: 'small'}}
                                as="footer"
                                gap="small"
                                direction="row"
                                align="center"
                                justify="start" >
                                <span>
                                    Files must be CSV files (comma-separated values) for import purposes. Files for model import must contain all 10 headers (columns) that can potentially be specified, although individual values for these columns may be left empty.
                                    These columns are: <b>vendor, model_number, height, display_color, network_ports, power_ports, cpu, memory, storage,</b> and <b>comments.</b> <br/> <br/>
                                    The same rules apply for files intended for asset imports. However, the columns for asset import files are: <b>hostname, rack, rack_position, vendor, model_number, owner,</b> and <b>comments.</b> <br/><br/>
                                    All the restrictions that would apply to values inputted via the web form also apply to values provided in the import files. Any issues will be reported to you, and your import will safely abort.<br/><br/>
                                    <Anchor href="https://hyposoft-53c70.appspot.com/spec.pdf" target="_blank">Click here</Anchor> for more detailed technical information on the file format specification.
                                </span>
                            </Box>
                        </Box>
                    </Layer>
                )}
                {this.state.showLoadingDialog && (
                    <Layer position="center" modal>
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
                                We're processing your file.
                            </Box>
                        </Box>
                    </Layer>
                )}
                {this.state.errors && (
                    <Layer position="center" modal onClickOutside={()=>{this.setState(oldState => ({...oldState, errors: undefined}))}} onEsc={()=>{this.setState(oldState => ({...oldState, errors: undefined}))}}
                    margin='medium'>
                        <Box pad="medium" gap="small" width="medium">
                            <Heading level={4} margin="none">
                                Import failed due to the following errors
                            </Heading>
                            <Box
                                margin={{top: 'small'}}
                                overflow='auto'
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
                {this.state.modifiedModels && (
                    <Layer margin='medium' position="center" modal onClickOutside={() => this.setState(oldState => ({...oldState, modificationsInfo: undefined,
                    showStatsForModels: true, ignoredModels: [...oldState.ignoredModels, ...oldState.modifiedModels], modifiedModels: []}))}
                     onEsc={() => this.setState(oldState => ({...oldState, modificationsInfo: undefined,
                     showStatsForModels: true, ignoredModels: [...oldState.ignoredModels, ...oldState.modifiedModels], modifiedModels: []}))}>
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
                                overflow='auto'
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
                                <Button label="Ignore" primary onClick={() => this.setState(oldState => ({...oldState, modificationsInfo: undefined,
                                showStatsForModels: true, ignoredModels: [...oldState.ignoredModels, ...oldState.modifiedModels], modifiedModels: []}))} />
                                <Button
                                    label="Update"
                                    onClick={() => {
                                        modelutils.bulkModifyModels(this.state.modifiedModels, () => {
                                            this.setState(oldState => ({...oldState, modificationsInfo: undefined, showStatsForModels: true}))
                                        })
                                    }}
                                    />
                            </Box>
                        </Box>
                    </Layer>
                )}
                {this.state.modifiedConns && (
                    <Layer margin='medium' position="center" modal onClickOutside={() => this.setState(oldState => ({...oldState, modificationsInfoConns: undefined,
                    showStatsForConns: true, ignoredConns: [...oldState.ignoredConns, ...oldState.modifiedConns], modifiedConns: []}))}
                     onEsc={() => this.setState(oldState => ({...oldState, modificationsInfoConns: undefined,
                     showStatsForConns: true, ignoredConns: [...oldState.ignoredConns, ...oldState.modifiedConns], modifiedConns: []}))}>
                        <Box pad="medium" gap="small" width="medium">
                            <Heading level={4} margin="none">
                                Update or ignore?
                            </Heading>
                            <p>Some of the assets' ports in your file already have connections. Would you like to ignore these entries or update the existing values to your new values?</p>
                            <Box
                                margin={{top: 'small'}}
                                as="footer"
                                gap="small"
                                overflow='auto'
                                direction="column"
                                align="start"
                                justify="start" >
                                {this.state.modificationsInfoConns}
                            </Box>
                            <Box
                                margin={{top: 'small'}}
                                as="footer"
                                gap="small"
                                direction="row"
                                align="center"
                                justify="end" >
                                <Button label="Ignore" primary onClick={() => this.setState(oldState => ({...oldState, modificationsInfoConns: undefined,
                                showStatsForConns: true, ignoredConns: [...oldState.ignoredConns, ...oldState.modifiedConns], modifiedConns: []}))} />
                                <Button
                                    label="Update"
                                    onClick={() => {
                                        bulkconnectionsutils.addConnections(this.state.modifiedConns, this.state.fetchedAssets, () => {
                                            this.setState(oldState => ({...oldState, modificationsInfoConns: undefined, showStatsForConns: true}))
                                        })
                                    }}
                                    />
                            </Box>
                        </Box>
                    </Layer>
                )}
                {this.state.assetsToBeModified && (
                    <Layer position="center" modal onClickOutside={()=>{}} onEsc={()=>{}}>
                        <Box pad="medium" gap="small" width="medium">
                            <Heading level={4} margin="none">
                                Update or ignore?
                            </Heading>
                            <p>The following assets already exist in the database, and their fields' values are different from those you've supplied. Would you like to ignore these entries or update the existing values to your new values?</p>
                            <Box
                                margin={{top: 'small'}}
                                as="footer"
                                gap="small"
                                direction="column"
                                align="start"
                                justify="start" >
                                {this.state.assetsToBeModified.map(tbm => <div><b>Row {tbm.row}:</b> {tbm.hostname} ({tbm.vendor} {tbm.model_number})</div>)}
                            </Box>
                            <Box
                                margin='small'
                                as="footer"
                                gap="small"
                                direction="row"
                                align="center"
                                justify="end" >
                                <Button label="Ignore" primary onClick={() => this.setState(oldState => ({
                                    ...oldState, errors: undefined, assetsToBeAdded: oldState.assetsToBeAdded, assetsToBeIgnored: [...oldState.assetsToBeIgnored, oldState.assetsToBeModified], assetsToBeModified: undefined,
                                    assetsModified: []
                                }))} />
                                <Button
                                    label="Update"
                                    onClick={() => {
                                        this.modifyAssetsInDb(this.state.assetsToBeModified)
                                        this.setState(oldState => ({
                                            ...oldState, errors: undefined, assetsToBeAdded: oldState.assetsToBeAdded, assetsToBeIgnored: [...oldState.assetsToBeIgnored], assetsToBeModified: undefined,
                                            assetsModified: [...oldState.assetsToBeModified]
                                        }))
                                    }}
                                    />
                            </Box>
                        </Box>
                    </Layer>
                )}
                {(this.state.assetsToBeAdded && this.state.assetsToBeIgnored && this.state.assetsModified
                && !this.state.errors && !this.state.assetsToBeModified) && (
                    <Layer position="center" modal onClickOutside={()=>{this.setState(oldState=>({
                        ...oldState, assetsToBeAdded: undefined, assetsToBeIgnored: undefined, assetsModified: undefined
                    }))}} onEsc={()=>{this.setState(oldState=>({
                        ...oldState, assetsToBeAdded: undefined, assetsToBeIgnored: undefined, assetsModified: undefined
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
                                <div><b>Assets created:</b> {this.state.assetsToBeAdded.length}</div>
                                <div><b>Assets modified:</b> {this.state.assetsModified.length}</div>
                                <div><b>Records ignored:</b> {this.state.assetsToBeIgnored.length}</div>
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
                    }))}} margin={{top: 'medium', bottom: 'medium'}}>
                        <Box pad="medium" gap="small" width="medium">
                            <Heading level={4} margin="none">
                                Import Successful
                            </Heading>
                            <p>Here are statistics on how your database is different after import.</p>
                            <Box
                                margin={{top: 'small'}}
                                overflow='auto'
                                as="footer"
                                gap="small"
                                direction="column"
                                align="start"
                                justify="start" >
                                <div><b>Models created ({this.state.createdModels.length}):</b></div>
                                {this.state.createdModels.map(m => <div><b>Row {m.rowNumber}:</b> {m.vendor+' '+m.model_number}</div>)}
                                <div></div>
                                <div><b>Models modified ({this.state.modifiedModels.length}):</b></div>
                                {this.state.modifiedModels.map(m => <div><b>Row {m.rowNumber}:</b> {m.vendor+' '+m.model_number}</div>)}
                                <div></div>
                                <div><b>Models ignored ({this.state.ignoredModels.length}):</b></div>
                                {this.state.ignoredModels.map(m => <div><b>Row {m.rowNumber}:</b> {m.vendor+' '+m.model_number}</div>)}
                                <div></div>
                            </Box>
                        </Box>
                    </Layer>
                )}
                {this.state.showStatsForConns && (
                    <Layer position="center" modal onClickOutside={()=>{this.setState(oldState=>({
                        ...oldState, showStatsForConns: false, ignoredConns: undefined, createdConns: undefined,
                        modifiedConns: undefined
                    }))}} onEsc={()=>{this.setState(oldState=>({
                        ...oldState, showStatsForConns: false, ignoredConns: undefined, createdConns: undefined,
                        modifiedConns: undefined
                    }))}} margin={{top: 'medium', bottom: 'medium'}}>
                        <Box pad="medium" gap="small" width="medium">
                            <Heading level={4} margin="none">
                                Import Successful
                            </Heading>
                            <p>Here are statistics on how your database is different after import.</p>
                            <Box
                                margin={{top: 'small'}}
                                overflow='auto'
                                as="footer"
                                gap="small"
                                direction="column"
                                align="start"
                                justify="start" >
                                <div><b>Connections created ({this.state.createdConns.length}):</b></div>
                                {this.state.createdConns.map(m => <div><b>Row {m.rowNumber}:</b> {m.src_hostname+' ('+m.src_port+') '+String.fromCharCode(8594)+' '+(m.dest_hostname ? m.dest_hostname+' ('+m.dest_port+')' : 'Disconnected')}</div>)}
                                <div></div>
                                <div><b>Connections modified ({this.state.modifiedConns.length}):</b></div>
                                {this.state.modifiedConns.map(m => <div><b>Row {m.rowNumber}:</b> {m.src_hostname+' ('+m.src_port+') '+String.fromCharCode(8594)+' '+(m.dest_hostname ? m.dest_hostname+' ('+m.dest_port+')' : 'Disconnected')}</div>)}
                                <div></div>
                                <div><b>Connections ignored ({this.state.ignoredConns.length}):</b></div>
                                {this.state.ignoredConns.map(m => <div><b>Row {m.rowNumber}:</b> {m.src_hostname+' ('+m.src_port+') '+String.fromCharCode(8594)+' '+(m.dest_hostname ? m.dest_hostname+' ('+m.dest_port+')' : 'Disconnected')}</div>)}
                                <div></div>
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
                    onFileLoaded={this.importAssets}
                    parserOptions={this.papaparseOptions}
                    inputStyle={{ display: "none" }}
                    inputId='csvreaderassets'
                />
                <CSVReader
                    cssClass="react-csv-input"
                    onFileLoaded={this.importConnections}
                    parserOptions={this.papaparseOptions}
                    inputStyle={{ display: "none" }}
                    inputId='csvreaderconn'
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
