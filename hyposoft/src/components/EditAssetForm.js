import React, { Component } from 'react'
import { Button, Grommet, Form, FormField, Heading, TextInput, Box } from 'grommet'
import { ToastsContainer, ToastsStore } from 'react-toasts';
import * as assetutils from '../utils/assetutils'
import * as formvalidationutils from "../utils/formvalidationutils";
import * as userutils from "../utils/userutils";
import {Redirect} from "react-router-dom";
import theme from "../theme";


//Instance table has a layer, that holds the button to add instance and the form

export default class EditAssetForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            model: this.props.updateModelFromParent,
            hostname: this.props.updateHostnameFromParent,
            rack: this.props.updateRackFromParent,
            rackU: this.props.updateRackUFromParent,
            owner: this.props.updateOwnerFromParent,
            comment: this.props.updateCommentFromParent,
            datacenter: this.props.updateDatacenterFromParent

        }
        this.handleUpdate = this.handleUpdate.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    //TODO: use this method properly
    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value


        });
    }

    handleUpdate(event) {
        if (event.target.name === "updateInst") {
            //this is where you pass in props updateData from AssetScreen . Want to keep old unchanged data, ow

            if(!this.state.model || !this.state.hostname || !this.state.rack || !this.state.rackU){
                //not all required fields filled out
                ToastsStore.error("Please fill out all required fields.");
            } else if(!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$/.test(this.state.hostname)){
                //not a valid hostname
                ToastsStore.error("Invalid hostname.");
            } else if(!/[A-Z]\d+/.test(this.state.rack)){
                //not a valid rack
                ToastsStore.error("Invalid rack.");
            } else if(!parseInt(this.state.rackU)){
                //invalid number
                ToastsStore.error("Rack elevation must be a number.");
            } else if(!formvalidationutils.checkPositive(this.state.rackU)){
                ToastsStore.error("Rack elevation must be positive.");
            } else {
                assetutils.updateAsset(
                    this.props.updateIDFromParent,
                    this.state.model,
                    this.state.hostname,
                    this.state.rack,
                    parseInt(this.state.rackU),
                    this.state.owner,
                    this.state.comment,
                    this.state.datacenter,


                    status => {
                        console.log(status)
                        //returned a null in instanceutils updateInstance function. Means no errormessage
                        if (!status) {
                            console.log(this.state)
                            ToastsStore.success('Successfully updated asset!');
                            this.props.parentCallback(true);

                        }
                        else {
                            ToastsStore.error('Error updating asset: ' + status);
                        }

                    });
            }
        }

    }

    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }

        return (

            <Grommet theme={theme}>
                <Box height="575px" width="400px" pad="medium" gap="xxsmall" overflow="auto">
                    <Heading
                        size="small"
                        margin="small"
                        level="4"
                    >Edit Asset</Heading>

                    <Form onSubmit={this.handleUpdate} name="updateInst" >

                        <FormField name="model" label="Model">
                            {/* change placeholders to what the original values were? */}
                            <TextInput name="model" placeholder="Update Model"
                                onChange={e => {
                                    const value = e.target.value
                                    this.setState(oldState => ({...oldState, model: value}))
                                    assetutils.getSuggestedModels(value, results => this.setState(oldState => ({...oldState, modelSuggestions: results})))
                                }}
                                onSelect={e => {
                                  this.setState(oldState => ({...oldState, model: e.suggestion}))
                                }}
                                value={this.state.model}
                                suggestions={this.state.modelSuggestions}
                                onClick={() => assetutils.getSuggestedModels(this.state.model, results => this.setState(oldState => ({...oldState, modelSuggestions: results})))}
                                title='Model'
                              />
                                {/* or value can be */}
                                {/* this.props.updateModelFromParent */}
                        </FormField>

                        <FormField name="hostname" label="Hostname" >

                            <TextInput padding="medium" name="hostname" placeholder="Update Server" onChange={this.handleChange}
                                value={this.state.hostname} required="true"/>
                        </FormField>

                        <FormField name="datacenter" label="Datacenter">
                            <TextInput name="datacenter"
                                       placeholder="Update Datacenter"
                                       onChange={e => {
                                           const value = e.target.value
                                           this.setState(oldState => ({...oldState, datacenter: value}))
                                           assetutils.getSuggestedDatacenters(value, results => this.setState(oldState => ({
                                               ...oldState,
                                               datacenterSuggestions: results
                                           })))
                                       }}
                                       onSelect={e => {
                                           this.setState(oldState => ({...oldState, datacenter: e.suggestion}))
                                       }}
                                       value={this.state.datacenter}
                                       suggestions={this.state.datacenterSuggestions}
                                       onClick={() => assetutils.getSuggestedDatacenters(this.state.datacenter, results => this.setState(oldState => ({
                                           ...oldState,
                                           datacenterSuggestions: results
                                       })))}
                                       title='Datacenter'
                                       required="true"
                            />
                        </FormField>

                        <FormField name="rack" label="Rack" >

                            <TextInput name="rack"
                                placeholder="Update Rack"
                                onChange={e => {
                                    const value = e.target.value
                                    this.setState(oldState => ({...oldState, rack: value}))
                                    assetutils.getSuggestedRacks(this.state.datacenter, value, results => this.setState(oldState => ({...oldState, rackSuggestions: results})))
                                }}
                                onSelect={e => {
                                    this.setState(oldState => ({...oldState, rack: e.suggestion}))
                                }}
                                value={this.state.rack}
                                suggestions={this.state.rackSuggestions}
                                onClick={() => assetutils.getSuggestedRacks(this.state.datacenter, this.state.rack, results => this.setState(oldState => ({...oldState, rackSuggestions: results})))}
                                title='Rack'
                              />
                        </FormField>

                        <FormField name="rackU" label="RackU" >

                            <TextInput name="rackU" placeholder="Update RackU" onChange={this.handleChange}
                                value={this.state.rackU} required="true"/>
                        </FormField>

                        <FormField name="owner" label="Owner" >

                            <TextInput name="owner"
                                placeholder="Update Owner"
                                onChange={e => {
                                    const value = e.target.value
                                    this.setState(oldState => ({...oldState, owner: value}))
                                    assetutils.getSuggestedOwners(value, results => this.setState(oldState => ({...oldState, ownerSuggestions: results})))
                                }}
                                onSelect={e => {
                                    this.setState(oldState => ({...oldState, owner: e.suggestion}))
                                }}
                                value={this.state.owner}
                                suggestions={this.state.ownerSuggestions}
                                onClick={() => assetutils.getSuggestedOwners(this.state.owner, results => this.setState(oldState => ({...oldState, ownerSuggestions: results})))}
                                title='Owner'
                              />
                        </FormField>

                        <FormField name="comment" label="Comment" >

                            <TextInput name="comment" placeholder="Update Comment" onChange={this.handleChange}
                                value={this.state.comment} />
                        </FormField>


                        <Box direction={"row"}>
                            <Button
                                margin="small"
                                type="submit"
                                primary label="Update"
                            />
                            <Button
                                margin="small"
                                label="Cancel"
                                onClick={() => this.props.cancelCallback()}
                            />
                        </Box>

                    </Form >
                </Box>


                <ToastsContainer store={ToastsStore} />
            </Grommet>


        )



    }

}
