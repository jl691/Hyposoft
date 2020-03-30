import React from "react";
import {Box, Button, Form, Text, TextInput} from "grommet";
import {ToastsStore} from "react-toasts";
import * as changeplanutils from "../utils/changeplanutils";
import * as userutils from "../utils/userutils";

class AddChangePlanForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            name: "",
        }

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleSubmit(event){
        if(!this.state.name){
            //not all fields filled out
            ToastsStore.error("Please fill out all the fields.");
        } else {
            changeplanutils.addChangePlan(this.state.name.trim(), userutils.getLoggedInUserUsername(), result => {
                if(result) {
                    this.props.parentCallback(true);
                } else {
                    ToastsStore.error("Error adding change plan.");
                }
            })
        }
    }

    handleChange(event){
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    render() {
        return (
            <React.Fragment>
                <Box pad="medium" background="light-2" width={"medium"}>
                    <Form onSubmit={this.handleSubmit} name="single">
                        <Text>Name</Text>
                        <TextInput name="name" placeholder="eg. Replace Dells with Lenovos" onChange={this.handleChange}
                                   value={this.state.name}/>
                        <Button type="submit" primary label="Submit"/>
                    </Form>
                </Box>
            </React.Fragment>
        )
    }
}

export default AddChangePlanForm