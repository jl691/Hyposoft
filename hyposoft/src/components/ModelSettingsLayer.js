import * as modelutils from '../utils/modelutils'
import * as userutils from '../utils/userutils'
import React from 'react'
import { ToastsContainer, ToastsStore } from 'react-toasts'

import { SketchPicker } from 'react-color'

import {
    Box,
    Button,
    Heading,
    Layer,
    Text,
    TextInput,
    TextArea,
    Form } from 'grommet'

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

    componentWillMount() {
        // Change from add form to edit form depending on props
        if (this.props.type === 'add') {
            this.hideFunction = this.props.parent.hideAddModelDialog
            this.layerTitle = 'Add Model'
            this.dbFunction = modelutils.createModel
        } else {
            this.hideFunction = this.props.parent.hideEditDialog
            this.layerTitle = 'Edit Model'
            this.dbFunction = modelutils.modifyModel
            this.setState({
                ...this.props.model,
                height: ''+this.props.model.height,
                networkPorts: (this.props.model.networkPorts ? ''+this.props.model.networkPorts : ''),
                networkPortsDisabled: this.props.model.networkPortsCount === 0,
                powerPorts: (this.props.model.powerPorts ? ''+this.props.model.powerPorts : ''),
                memory: (this.props.model.memory ? ''+this.props.model.memory : ''),
                networkPortsCount: (this.props.model.networkPortsCount === 0 ? '' : ''+this.props.model.networkPortsCount)
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
        }

        if (this.state.modelNumber.trim() === '') {
            ToastsStore.info('Model number required', 3000, 'burntToast')
            return
        }

        if (this.state.height.trim() === '') {
            ToastsStore.info('Height required', 3000, 'burntToast')
            return
        }

        if (isNaN(this.state.height.trim()) || !Number.isInteger(parseFloat(this.state.height.trim())) || parseInt(this.state.height.trim()) <= 0) {
            ToastsStore.info('Height should be a positive integer', 3000, 'burntToast')
            this.setState(oldState => ({...oldState, height: ''}))
            return
        }


        var networkPorts = null
        if (this.state.networkPorts.trim().split(',').length > 1 || (
            this.state.networkPorts.trim().split(',').length === 1 && this.state.networkPorts.trim().split(',')[0] !== ''
        )) {
             networkPorts=this.state.networkPorts.trim().split(',')
        } else {
            networkPorts=[]
        }

        var powerPorts = null
         if (this.state.powerPorts.trim() !== '' &&
          (isNaN(this.state.powerPorts.trim()) || !Number.isInteger(parseFloat(this.state.powerPorts.trim())) || parseInt(this.state.powerPorts.trim()) < 0)) {
              ToastsStore.info('Power ports should be a non-negative integer', 3000, 'burntToast')
              this.setState(oldState => ({...oldState, powerPorts: ''}))
              return
          } else if (this.state.powerPorts.trim() !== '') {
              powerPorts=parseInt(this.state.powerPorts)
          }



          var memory = null
          if (this.state.memory.trim() !== '' &&
           (isNaN(this.state.memory.trim()) || !Number.isInteger(parseFloat(this.state.memory.trim())) || parseInt(this.state.memory.trim()) < 0)) {
               ToastsStore.info('Memory should be a non-negative integer', 3000, 'burntToast')
               this.setState(oldState => ({...oldState, memory: ''}))
               return
           } else if (this.state.memory.trim() !== '') {
               memory=parseInt(this.state.memory)
           }
        modelutils.getModelByModelname(this.state.vendor.trim()+' '+this.state.modelNumber.trim(), doc => {
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
                        this.hideFunction()
                        this.props.parent.init()
                        index.saveObject({...model, objectID: id})
                    })
            }
        })

    }

    adjustNetworkPortsList() {
        if (this.state.networkPortsCount.trim() !== '' &&
         (isNaN(this.state.networkPortsCount.trim()) || !Number.isInteger(parseFloat(this.state.networkPortsCount.trim())) || parseInt(this.state.networkPortsCount.trim()) < 0)) {
             this.setState(oldState => ({...oldState, networkPorts: '', networkPortsDisabled: true, networkPortsCount: ''}))
             return
         } else if (this.state.networkPortsCount.trim() !== '' && parseInt(this.state.networkPortsCount.trim()) > 0) {
             if (this.state.networkPorts.trim().split(',').length !== parseInt(this.state.networkPortsCount.trim()) ||
                    (this.state.networkPorts.trim().split(',').length === 1 && this.state.networkPorts.trim().split(',')[0] === '' && parseInt(this.state.networkPortsCount.trim()) === 1)) {
                 var defaultPorts = []
                 for (var i = 1; i <=parseInt(this.state.networkPortsCount.trim()); i++) {
                     defaultPorts.push(''+i)
                 }
                 this.setState(oldState => ({...oldState, networkPorts: defaultPorts.join(', '), networkPortsDisabled: false}))
             }
         } else {
             this.setState(oldState => ({...oldState, networkPorts: '', networkPortsDisabled: true}))
         }
    }

    adjustNetworkPortsCount (){
        if (this.state.networkPorts.trim().split(',').length === 0) {
            this.setState(oldState => ({...oldState, networkPorts: '', networkPortsDisabled: true, networkPortsCount: ''}))
        } else {
            this.setState(oldState => ({...oldState, networkPortsDisabled: false, networkPortsCount: ''+this.state.networkPorts.trim().split(',').length }))
        }
    }

    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }

        return (
            <Layer position="center" modal onClickOutside={this.hideFunction} onEsc={this.hideFunction}>
                <Box pad="medium" gap="small" width="large">
                    <Heading level={4} margin="none">
                        {this.layerTitle}
                    </Heading>
                    <p>Models are uniquely identified by a model number for each given Vendor.</p>

                    <Form>
                        <Box direction='row' justify='center' gap='medium'>
                            <Box direction="column" pad='xsmall' gap="small" flex height={{max: 'medium'}} overflow={{vertical: 'scroll'}}>
                                <TextInput style={{
                                        borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                        width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal'
                                    }}
                                    placeholder="Vendor"
                                    onChange={e => {
                                        const value = e.target.value
                                        this.setState(oldState => ({...oldState, vendor: value}))
                                        modelutils.getSuggestedVendors(value, results => this.setState(oldState => ({...oldState, vendorSuggestions: results})))
                                    }}
                                    onSelect={e => {
                                        this.setState(oldState => ({...oldState, vendor: e.suggestion}))
                                    }}
                                    value={this.state.vendor}
                                    suggestions={this.state.vendorSuggestions}
                                    onClick={() => modelutils.getSuggestedVendors(this.state.vendor, results => this.setState(oldState => ({...oldState, vendorSuggestions: results})))}
                                    title='Vendor'
                                    />
                                <TextInput style={{
                                        borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                        width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                    }}
                                    placeholder="Model number"
                                    onChange={e => {
                                        const value = e.target.value
                                        this.setState(oldState => ({...oldState, modelNumber: value}))
                                    }}
                                    value={this.state.modelNumber}
                                    title='Model number'
                                    />
                                <TextInput style={{
                                        borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                        width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                    }}
                                    placeholder="Height"
                                    onChange={e => {
                                        const value = e.target.value
                                        this.setState(oldState => ({...oldState, height: value}))
                                    }}
                                    value={this.state.height}
                                    title='Height'
                                    />
                                <TextInput style={{
                                        borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                        width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                    }}
                                    placeholder="Network ports count (Optional)"
                                    onChange={e => {
                                        const value = e.target.value
                                        this.setState(oldState => ({...oldState, networkPortsCount: value}))
                                    }}
                                    onBlur={e => this.adjustNetworkPortsList()}
                                    value={this.state.networkPortsCount}
                                    title='Network ports'
                                    />
                                <TextInput style={{
                                        borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                        width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                    }}
                                    disabled={this.state.networkPortsDisabled}
                                    placeholder="Network ports names (Optional)"
                                    onChange={e => {
                                        const value = e.target.value
                                        this.setState(oldState => ({...oldState, networkPorts: value}))
                                    }}
                                    onBlur={e => this.adjustNetworkPortsCount()}
                                    value={this.state.networkPorts}
                                    title='Network ports'
                                    />
                                <TextInput style={{
                                        borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                        width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                    }}
                                    placeholder="Power ports (Optional)"
                                    onChange={e => {
                                        const value = e.target.value
                                        this.setState(oldState => ({...oldState, powerPorts: value}))
                                    }}
                                    value={this.state.powerPorts}
                                    title='Power ports'
                                    />
                                <TextInput style={{
                                        borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                        width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                    }}
                                    placeholder="cpu (Optional)"
                                    onChange={e => {
                                        const value = e.target.value
                                        this.setState(oldState => ({...oldState, cpu: value}))
                                    }}
                                    value={this.state.cpu}
                                    title='cpu'
                                    />
                                <TextInput style={{
                                        borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                        width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                    }}
                                    placeholder="Memory (Optional)"
                                    onChange={e => {
                                        const value = e.target.value
                                        this.setState(oldState => ({...oldState, memory: value}))
                                    }}
                                    value={this.state.memory}
                                    title='Memory'
                                    />
                                <TextInput style={{
                                        borderRadius: 1000, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                        width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                    }}
                                    placeholder="Storage (Optional)"
                                    onChange={e => {
                                        const value = e.target.value
                                        this.setState(oldState => ({...oldState, storage: value}))
                                    }}
                                    value={this.state.storage}
                                    title='Storage'
                                    />
                                <TextArea style={{
                                        borderRadius: 20, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD',
                                        width: '100%', paddingLeft: 20, paddingRight: 20, fontWeight: 'normal',
                                        minHeight: 100
                                    }}
                                    placeholder="Comment (Optional)"
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
                                    color={ this.state.displayColor }
                                    onChange={color => {
                                        this.setState(oldState => ({...oldState, displayColor: color.hex}))
                                      }} />
                                <Text size='xsmall' alignSelf='center' margin={{top: 'medium'}}>Display color</Text>
                            </Box>
                        </Box>
                        <Box
                            margin={{top: 'medium'}}
                            as="footer"
                            gap="small"
                            direction="row"
                            align="center"
                            justify="end" >
                            <Button label="Save" type='submit' primary onClick={() => this.saveModel()} />
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
