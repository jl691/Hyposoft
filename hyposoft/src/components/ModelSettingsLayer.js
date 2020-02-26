import * as modelutils from '../utils/modelutils'
import * as userutils from '../utils/userutils'
import React from 'react'
import {ToastsContainer, ToastsStore} from 'react-toasts'

import {SketchPicker} from 'react-color'

import {
    Box,
    Button,
    Heading,
    Layer,
    Text,
    TextInput,
    TextArea,
    Form
} from 'grommet'

import {Redirect} from "react-router-dom";

const algoliasearch = require('algoliasearch')
const client = algoliasearch('V7ZYWMPYPA', '26434b9e666e0b36c5d3da7a530cbdf3')
const index = client.initIndex('models')

class ModelSettingsLayer extends React.Component {
    state = {
        vendor: '',
        modelNumber: '',
        height: '',
        displayColor: 'BD10E0', // default colour that looks good enough
        networkPortsCount: '',
        networkPorts: '',
        networkPortsDisabled: true,
        powerPorts: '',
        cpu: '',
        memory: '',
        storage: '',
        comment: ''
    }

    componentDidMount() {
        console.log(this.props)
        // Change from add form to edit form depending on props
        if (this.props.type === 'add') {
            console.log("adding")
            this.hideFunction = this.props.parent.hideAddModelDialog
            this.setState({
                layerTitle: 'Add Model'
            });
            this.dbFunction = modelutils.createModel
            console.log(this.layerTitle)
        } else {
            modelutils.doesModelHaveAssets(this.props.model.id, yes => {
                if (yes) {
                    this.setState(oldState => ({...oldState, modelHasAssets: true}))
                }
            })
            this.hideFunction = this.props.parent.hideEditDialog
            this.dbFunction = modelutils.modifyModel
            this.setState({
                ...this.props.model,
                height: '' + this.props.model.height,
                networkPorts: (this.props.model.networkPorts ? '' + this.props.model.networkPorts : ''),
                networkPortsDisabled: this.props.model.networkPortsCount === 0,
                powerPorts: (this.props.model.powerPorts ? '' + this.props.model.powerPorts : ''),
                memory: (this.props.model.memory ? '' + this.props.model.memory : ''),
                networkPortsCount: (this.props.model.networkPortsCount === 0 ? '' : '' + this.props.model.networkPortsCount),
                layerTitle: 'Edit Model'
            })
        }
    }

    saveModel() {
        if (!userutils.isLoggedInUserAdmin()) {
            ToastsStore.info('Only admins can do this', 3000, 'burntToast')
            return
        }

        if (this.state.vendor.trim() === '') {
            ToastsStore.info('Vendor required', 3000, 'burntToast')
            return
        } else if (this.state.vendor.trim().length > 50) {
            ToastsStore.info('Vendor name should be less than 50 characters long', 3000, 'burntToast')
            return
        }

        if (this.state.modelNumber.trim() === '') {
            ToastsStore.info('Model number required', 3000, 'burntToast')
            return
        } else if (this.state.modelNumber.trim().length > 50) {
            ToastsStore.info('Model number should be less than 50 characters long', 3000, 'burntToast')
            return
        }

        if (this.state.height.trim() === '') {
            ToastsStore.info('Height required', 3000, 'burntToast')
            return
        }

        if (isNaN(this.state.height.trim()) || !Number.isInteger(parseFloat(this.state.height.trim())) || parseInt(this.state.height.trim()) <= 0 || parseInt(this.state.height.trim()) > 42) {
            ToastsStore.info('Height should be a positive integer not greater than 42U', 3000, 'burntToast')
            this.setState(oldState => ({...oldState, height: ''}))
            return
        }


        var networkPorts = null
        if (this.state.networkPorts.trim().split(',').length > 1 || (
            this.state.networkPorts.trim().split(',').length === 1 && this.state.networkPorts.trim().split(',')[0] !== ''
        )) {
            networkPorts = this.state.networkPorts.trim().split(',')
        } else {
            networkPorts = []
        }

        if (networkPorts.length > Array.from(new Set(networkPorts)).length) {
            ToastsStore.info('Network ports should have unique names', 3000, 'burntToast')
            return
        }

        if (networkPorts.length > 100) {
            ToastsStore.info('Models should not have more than 100 network ports', 3000, 'burntToast')
            return
        }

        var powerPorts = null
        if (this.state.powerPorts.trim() !== '' &&
            (isNaN(this.state.powerPorts.trim()) || !Number.isInteger(parseFloat(this.state.powerPorts.trim())) || parseInt(this.state.powerPorts.trim()) < 0 || parseInt(this.state.powerPorts.trim()) > 10)) {
            ToastsStore.info('Power ports should be a non-negative integer not greater than 10', 3000, 'burntToast')
            this.setState(oldState => ({...oldState, powerPorts: ''}))
            return
        } else if (this.state.powerPorts.trim() !== '') {
            powerPorts = parseInt(this.state.powerPorts)
        }


        var memory = null
        if (this.state.memory.trim() !== '' &&
            (isNaN(this.state.memory.trim()) || !Number.isInteger(parseFloat(this.state.memory.trim())) || parseInt(this.state.memory.trim()) < 0 || parseInt(this.state.memory.trim()) > 1000)) {
            ToastsStore.info('Memory should be a non-negative integer less than 1000', 3000, 'burntToast')
            this.setState(oldState => ({...oldState, memory: ''}))
            return
        } else if (this.state.memory.trim() !== '') {
            memory = parseInt(this.state.memory)
        }

        if (this.state.storage.trim() !== '' && this.state.storage.trim().length > 50) {
            ToastsStore.info('Storage should be less than 50 characters long', 3000, 'burntToast')
            return
        }

        if (this.state.cpu.trim() !== '' && this.state.cpu.trim().length > 50) {
            ToastsStore.info('CPU should be less than 50 characters long', 3000, 'burntToast')
            return
        }

        modelutils.getModelByModelname(this.state.vendor.trim() + ' ' + this.state.modelNumber.trim(), doc => {
            if (doc && doc.id !== this.state.id) {
                ToastsStore.info(this.state.modelNumber.trim() + ' by ' + this.state.vendor.trim() + ' exists', 3000, 'burntToast')
                return
            } else {
                this.dbFunction(this.state.id, this.state.vendor,
                    this.state.modelNumber, parseInt(this.state.height),
                    this.state.displayColor, networkPorts,
                    powerPorts, this.state.cpu,
                    memory, this.state.storage,
                    this.state.comment, (model, id) => {
                        ToastsStore.info('Model saved', 3000, 'burntToast')
                        if(this.props.model.vendor !== this.state.vendor || this.props.model.modelNumber !== this.state.modelNumber){
                            window.location.href = "/models/" + this.state.vendor + "/" + this.state.modelNumber;
                        }
                        this.hideFunction()
                        this.props.parent.componentDidMount()

                        let suffixes_list = []
                        let cpu = model.cpu

                        while (cpu.length > 1) {
                            cpu = cpu.substr(1)
                            suffixes_list.push(cpu)
                        }

                        let storage = model.storage

                        while (storage.length > 1) {
                            storage = storage.substr(1)
                            suffixes_list.push(storage)
                        }

                        let modelName = model.vendor+model.modelNumber

                        while (modelName.length > 1) {
                            modelName = modelName.substr(1)
                            suffixes_list.push(modelName)
                        }

                        index.saveObject({...model, objectID: id, suffixes: suffixes_list.join(' ')})
                    })
            }
        })

    }

    adjustNetworkPortsList() {
        if (this.state.networkPortsCount.trim() !== '' &&
            (isNaN(this.state.networkPortsCount.trim()) || !Number.isInteger(parseFloat(this.state.networkPortsCount.trim())) || parseInt(this.state.networkPortsCount.trim()) < 0)) {
            this.setState(oldState => ({
                ...oldState,
                networkPorts: '',
                networkPortsDisabled: true,
                networkPortsCount: ''
            }))
            return
        } else if (this.state.networkPortsCount.trim() !== '' && parseInt(this.state.networkPortsCount.trim()) > 0) {
            if (this.state.networkPorts.trim().split(',').length !== parseInt(this.state.networkPortsCount.trim()) ||
                (this.state.networkPorts.trim().split(',').length === 1 && this.state.networkPorts.trim().split(',')[0] === '' && parseInt(this.state.networkPortsCount.trim()) === 1)) {
                var defaultPorts = []
                for (var i = 1; i <= parseInt(this.state.networkPortsCount.trim()); i++) {
                    defaultPorts.push('' + i)
                }
                this.setState(oldState => ({
                    ...oldState,
                    networkPorts: defaultPorts.join(', '),
                    networkPortsDisabled: false
                }))
            }
        } else {
            this.setState(oldState => ({...oldState, networkPorts: '', networkPortsDisabled: true}))
        }
    }

    adjustNetworkPortsCount() {
        if (this.state.networkPorts.trim().split(',').length === 0) {
            this.setState(oldState => ({
                ...oldState,
                networkPorts: '',
                networkPortsDisabled: true,
                networkPortsCount: ''
            }))
        } else {
            this.setState(oldState => ({
                ...oldState,
                networkPortsDisabled: false,
                networkPortsCount: '' + this.state.networkPorts.trim().split(',').length
            }))
        }
    }

    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/'/>
        }

        return (
            <Layer position="center" modal onClickOutside={this.hideFunction} onEsc={this.hideFunction}>
                <Box pad="medium" gap="small" width="large">
                    <Heading level={4} margin="none">
                        {this.state.layerTitle}
                    </Heading>
                    <p>Models are uniquely identified by a model number for each given Vendor. {this.state.modelHasAssets && <b>Some fields are disabled because this model has live assets</b>}</p>

                    <Form>
                        <Box direction='row' justify='center' gap='medium'>
                            <Box direction="column" pad='xsmall' gap="small" flex height={{max: 'medium'}}
                                 overflow={{vertical: 'scroll'}}>
                                <Text size={"small"} style={{marginLeft: "20px"}}>Vendor</Text>
                                <TextInput style={{
                                    borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                    width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal'
                                }}
                                           placeholder="eg. Dell, Apple"
                                           onChange={e => {
                                               const value = e.target.value
                                               this.setState(oldState => ({...oldState, vendor: value}))
                                               modelutils.getSuggestedVendors(value, results => this.setState(oldState => ({
                                                   ...oldState,
                                                   vendorSuggestions: results
                                               })))
                                           }}
                                           onSelect={e => {
                                               this.setState(oldState => ({...oldState, vendor: e.suggestion}))
                                           }}
                                           value={this.state.vendor}
                                           suggestions={this.state.vendorSuggestions}
                                           onClick={() => modelutils.getSuggestedVendors(this.state.vendor, results => this.setState(oldState => ({
                                               ...oldState,
                                               vendorSuggestions: results
                                           })))}
                                           title='Vendor'
                                />
                                <Text size={"small"} style={{marginLeft: "20px"}}>Model Number</Text>
                                <TextInput style={{
                                    borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                    width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                }}
                                           placeholder="eg. Vostro 5400, iServer 2.0"
                                           onChange={e => {
                                               const value = e.target.value
                                               this.setState(oldState => ({...oldState, modelNumber: value}))
                                           }}
                                           value={this.state.modelNumber}
                                           title='Model number'
                                />
                                <Text size={"small"} style={{marginLeft: "20px"}}>Height</Text>
                                <TextInput style={{
                                    borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                    width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                }}
                                           placeholder="eg. 2, 4"
                                           onChange={e => {
                                               const value = e.target.value
                                               this.setState(oldState => ({...oldState, height: value}))
                                           }}
                                           value={this.state.height}
                                           title='Height'
                                           disabled={this.state.modelHasAssets}
                                />
                                <Text size={"small"} style={{marginLeft: "20px"}}>Network Ports (Optional)</Text>
                                <TextInput style={{
                                    borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                    width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                }}
                                           placeholder="eg. 2, 4"
                                           onChange={e => {
                                               const value = e.target.value
                                               this.setState(oldState => ({...oldState, networkPortsCount: value}))
                                           }}
                                           onBlur={e => this.adjustNetworkPortsList()}
                                           value={this.state.networkPortsCount}
                                           title='Network ports'
                                           disabled={this.state.modelHasAssets}
                                />
                                <Text size={"small"} style={{marginLeft: "20px"}}>Network Port Names (Optional)</Text>
                                <TextInput style={{
                                    borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                    width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                }}
                                           disabled={this.state.networkPortsDisabled || this.state.modelHasAssets}
                                           placeholder="eg. port1, port2"
                                           onChange={e => {
                                               const value = e.target.value
                                               this.setState(oldState => ({...oldState, networkPorts: value}))
                                           }}
                                           onBlur={e => this.adjustNetworkPortsCount()}
                                           value={this.state.networkPorts}
                                           title='Network ports'
                                />
                                <Text size={"small"} style={{marginLeft: "20px"}}>Power Ports (Optional)</Text>
                                <TextInput style={{
                                    borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                    width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                }}
                                           placeholder="eg. 2, 4"
                                           onChange={e => {
                                               const value = e.target.value
                                               this.setState(oldState => ({...oldState, powerPorts: value}))
                                           }}
                                           value={this.state.powerPorts}
                                           disabled={this.state.modelHasAssets}
                                           title='Power ports'
                                />
                                <Text size={"small"} style={{marginLeft: "20px"}}>CPU (Optional)</Text>
                                <TextInput style={{
                                    borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                    width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                }}
                                           placeholder="eg. Intel Xeon, AMD Ryzen 7"
                                           onChange={e => {
                                               const value = e.target.value
                                               this.setState(oldState => ({...oldState, cpu: value}))
                                           }}
                                           value={this.state.cpu}
                                           title='cpu'
                                />
                                <Text size={"small"} style={{marginLeft: "20px"}}>Memory (GB, Optional)</Text>
                                <TextInput style={{
                                    borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                    width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                }}
                                           placeholder="eg. 2, 4"
                                           onChange={e => {
                                               const value = e.target.value
                                               this.setState(oldState => ({...oldState, memory: value}))
                                           }}
                                           value={this.state.memory}
                                           title='Memory'
                                />
                                <Text size={"small"} style={{marginLeft: "20px"}}>Storage (GB, Optional)</Text>
                                <TextInput style={{
                                    borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                    width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                }}
                                           placeholder="eg. 2, 4"
                                           onChange={e => {
                                               const value = e.target.value
                                               this.setState(oldState => ({...oldState, storage: value}))
                                           }}
                                           value={this.state.storage}
                                           title='Storage'
                                />
                                <Text size={"small"} style={{marginLeft: "20px"}}>Comment (Optional)</Text>
                                <TextArea style={{
                                    borderRadius: 20, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                    width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                    minHeight: 100
                                }}
                                          placeholder="eg. Retired model, Only 1 power port"
                                          onChange={e => {
                                              const value = e.target.value
                                              this.setState(oldState => ({...oldState, comment: value}))
                                          }}
                                          value={this.state.comment}
                                          resize={false}
                                          title='Comment'
                                />
                            </Box>
                            <Box>
                                <SketchPicker disableAlpha
                                              color={this.state.displayColor}
                                              onChange={color => {
                                                  this.setState(oldState => ({...oldState, displayColor: color.hex}))
                                              }}/>
                                <Text size='xsmall' alignSelf='center' margin={{top: 'medium'}}>Display color</Text>
                            </Box>
                        </Box>
                        <Box
                            margin={{top: 'medium'}}
                            as="footer"
                            gap="small"
                            direction="row"
                            align="center"
                            justify="end">
                            <Button label="Save" type='submit' primary onClick={() => this.saveModel()}/>
                            <Button
                                label="Cancel"
                                onClick={this.hideFunction}
                            />
                        </Box>
                    </Form>
                </Box>
                <ToastsContainer store={ToastsStore} lightBackground/>
            </Layer>
        )
    }
}

export default ModelSettingsLayer
