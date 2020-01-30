import React, { Component } from 'react'
import { Button, Grommet, Form, FormField, Heading, TextInput, Box, Text } from 'grommet'
import { ToastsContainer, ToastsStore } from 'react-toasts';
import * as instutils from '../utils/instanceutils'
import { checkInstanceFits } from '../utils/rackutils';


//Instance table has a layer, that holds the button to add instance and the form

export default class EditInstanceForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            //instance_id: "",
            model: this.props.updateModelFromParent,
            hostname: this.props.updateHostnameFromParent,
            rack: this.props.updateRackFromParent,
            rackU: this.props.updateRackUFromParent,
            owner: this.props.updateOwnerFromParent,
            comment: this.props.updateCommentFromParent

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
            //this is where you pass in props updateData from InstanceScreen . Want to keep old unchanged data, ow

            instutils.updateInstance(

                this.props.updateIDFromParent, 
                this.state.model, 
                this.state.hostname,
                this.state.rack, 
                parseInt(this.state.rackU), 
                this.state.owner, 
                this.state.comment, 
                status => {
                    console.log(status)
                    //returned a null in instanceutils updateInstance function. Means no errormessage
                if (!status) {
                    console.log(this.state)
                    ToastsStore.success('Successfully updated instance!');
                    //TODO: need to pass info amongst siblings: AddInstanceForm to InstanceScreen to InstanceTable
                    //this.props.parentCallbackRefresh(true);
                    this.props.parentCallback(true);
                    /*this.setState({
                        instance_id: "",
                        model: "",
                        hostname: "",
                        rack: "",
                        rackU: "",
                        owner: "",
                        comment: ""
                    })*/
                }
                else {
                    ToastsStore.error('Error updating instance: ' + status);
                }

            })
        }

    }

    render() {
        return (
            
            <Grommet>
                <Box height="575px" width="400px" pad="medium" gap="xxsmall" overflow="auto">
                    <Heading
                        size="small"
                        margin="small"
                        level="4"
                    >Edit Instance</Heading>
                
                    <Form onSubmit={this.handleUpdate} name="updateInst" >

                        <FormField name="model" label="Model">
                            {/* change placeholders to what the original values were? */}
                            <TextInput name="model" placeholder="Update Model" onChange={this.handleChange}
                                value={this.state.model} /> 
                                {/* or value can be */}
                                {/* this.props.updateModelFromParent */}
                        </FormField>

                        <FormField name="hostname" label="Hostname" >

                            <TextInput padding="medium" name="hostname" placeholder="Update Server" onChange={this.handleChange}
                                value={this.state.hostname} />
                        </FormField>

                        <FormField name="rack" label="Rack" >

                            <TextInput name="rack" placeholder="Update Rack" onChange={this.handleChange}
                                value={this.state.rack} />
                        </FormField>

                        <FormField name="rackU" label="RackU" >

                            <TextInput name="rackU" placeholder="Update RackU" onChange={this.handleChange}
                                value={this.state.rackU} />
                        </FormField>

                        <FormField name="owner" label="Owner" >

                            <TextInput name="owner" placeholder="Update Owner" onChange={this.handleChange}
                                value={this.state.owner} />
                        </FormField>

                        <FormField name="comment" label="Comment" >

                            <TextInput name="comment" placeholder="Update Comment" onChange={this.handleChange}
                                value={this.state.comment} />
                        </FormField>

                        <Button
                            margin="small"
                            type="submit"
                            primary label="Update"
                        />

                    </Form >
                </Box>


                <ToastsContainer store={ToastsStore} />
            </Grommet>


        )



    }

}





