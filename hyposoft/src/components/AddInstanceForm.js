import React, { Component } from 'react'
import { Button, Grommet, Form, FormField, Heading, TextInput, Box } from 'grommet'
import { ToastsContainer, ToastsStore } from 'react-toasts';
import * as instutils from '../utils/instanceutils'


//Instance table has a layer, that holds the button to add instance and the form

export default class AddInstanceForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            instance_id: "",
            model: "",
            hostname: "",
            rack: "",
            rackU: "",
            owner: "",
            comment: ""

        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    handleSubmit(event) {
        
        if (event.target.name === "addInst") {
            instutils.addInstance(
                //this.state.instance_id
                this.state.model, 
                this.state.hostname, 
                this.state.rack, 
                parseInt(this.state.rackU), 
                this.state.owner, 
                this.state.comment, 
                function (errorMessage) {

                if (errorMessage) {
                    ToastsStore.error(errorMessage, 10000)

                }
                else {
                   
                    ToastsStore.success('Successfully added instance!');
                    //TODO: need to pass info amongst siblings: AddInstanceForm to InstanceScreen to InstanceTable
                    //this.props.parentCallbackRefresh(true);
                    this.setState({
                        //instance_id: "",
                        model: "",
                        hostname: "",
                        rack: "",
                        rackU: "",
                        owner: "",
                        comment: ""
                    })


                }
            });

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
                    >Add Instance</Heading>
                    <Form onSubmit={this.handleSubmit} name="addInst" >

                        <FormField name="model" label="Model">

                            <TextInput name="model" placeholder="eg. Dell R710" onChange={this.handleChange}
                                value={this.state.model} />
                        </FormField>

                        <FormField name="hostname" label="Hostname" >

                            <TextInput padding="medium" name="hostname" placeholder="eg. server9" onChange={this.handleChange}
                                value={this.state.hostname} />
                        </FormField>

                        <FormField name="rack" label="Rack" >

                            <TextInput name="rack" placeholder="eg. B12" onChange={this.handleChange}
                                value={this.state.rack} />
                        </FormField>

                        <FormField name="rackU" label="RackU" >

                            <TextInput name="rackU" placeholder="eg. 9" onChange={this.handleChange}
                                value={this.state.rackU} />
                        </FormField>

                        <FormField name="owner" label="Owner" >

                            <TextInput name="owner" placeholder="eg. Jan" onChange={this.handleChange}
                                value={this.state.owner} />
                        </FormField>

                        <FormField name="comment" label="Comment" >

                            <TextInput name="comment" placeholder="" onChange={this.handleChange}
                                value={this.state.comment} />
                        </FormField>

                        <Button
                            margin="small"
                            type="submit"
                            primary label="Submit"
                        />
                        <Button
                            margin="small"
                            label="Cancel"
                            onClick={() => this.props.cancelCallbackFromParent()}

                        />

                    </Form >
                </Box>


                <ToastsContainer store={ToastsStore} />
            </Grommet>


        )



    }

}





