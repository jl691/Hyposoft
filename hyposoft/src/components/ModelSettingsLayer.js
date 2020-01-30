import * as modelutils from '../utils/modelutils'
import * as firebaseutils from '../utils/firebaseutils'
import * as userutils from '../utils/userutils'
import React, { Component } from 'react'
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

import theme from '../theme'

class ModelSettingsLayer extends React.Component {
    state = {
        vendor: '',
        modelNumber: '',
        height: '',
        modelColor: 'BD10E0', // default colour that looks good enough
        ethernetPorts: '',
        powerPorts: '',
        CPU: '',
        memory: '',
        storage: '',
        comment: ''
    }

    componentWillMount() {
        // Change from add form to edit form depending on props
    }

    addModel() {
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
            return
        }

        if (this.state.ethernetPorts.trim() !== '' &&
         (isNaN(this.state.ethernetPorts.trim()) || !Number.isInteger(parseFloat(this.state.ethernetPorts.trim())) || parseInt(this.state.ethernetPorts.trim()) <= 0)) {
             ToastsStore.info('Ethernet ports should be a non-negative integer', 3000, 'burntToast')
             return
         }

         if (this.state.powerPorts.trim() !== '' &&
          (isNaN(this.state.powerPorts.trim()) || !Number.isInteger(parseFloat(this.state.powerPorts.trim())) || parseInt(this.state.powerPorts.trim()) <= 0)) {
              ToastsStore.info('Power ports should be a non-negative integer', 3000, 'burntToast')
              return
          }

          if (this.state.memory.trim() !== '' &&
           (isNaN(this.state.memory.trim()) || !Number.isInteger(parseFloat(this.state.memory.trim())) || parseInt(this.state.memory.trim()) <= 0)) {
               ToastsStore.info('Memory should be a non-negative integer', 3000, 'burntToast')
               return
           }

    }

    saveModel() {
        if (this.props.type === 'add') {
            this.addModel()
        } else {
            this.updateModel()
        }
    }

    render() {
        return (
            <Layer position="center" modal onClickOutside={this.props.parent.hideAddModelDialog} onEsc={this.props.parent.hideAddModelDialog}>
                <Box pad="medium" gap="small" width="large">
                    <Heading level={4} margin="none">
                        Add Model
                    </Heading>
                    <p>Add a new model (uniquely identified by a vendor + model number combo) to the databse using this form.</p>

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
                                    placeholder="Ethernet ports (Optional)"
                                    onChange={e => {
                                        const value = e.target.value
                                        this.setState(oldState => ({...oldState, ethernetPorts: value}))
                                    }}
                                    value={this.state.ethernetPorts}
                                    title='Ethernet ports'
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
                                    placeholder="CPU (Optional)"
                                    onChange={e => {
                                        const value = e.target.value
                                        this.setState(oldState => ({...oldState, CPU: value}))
                                    }}
                                    value={this.state.CPU}
                                    title='CPU'
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
                                        minHeight: 100, marginBottom: 20
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
                                    color={ this.state.modelColor }
                                    onChange={color => {
                                        this.setState(oldState => ({...oldState, modelColor: color.hex}))
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
                                onClick={this.props.parent.hideAddModelDialog}
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
