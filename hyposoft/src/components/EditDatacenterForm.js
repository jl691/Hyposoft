import React from "react";
import theme from "../theme";
import {Box, Button, Form, Grommet, Text, TextInput} from "grommet";
import {ToastsStore} from "react-toasts";
import * as datacenterutils from "../utils/datacenterutils";

class EditDatacenterForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            oldName: this.props.name,
            oldAbbreviation: this.props.abbreviation,
            name: this.props.name,
            abbreviation: this.props.abbreviation
        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleSubmit(event){
        if(!this.state.name || !this.state.abbreviation){
            //not all fields filled out
            ToastsStore.error("Please fill out all the fields.");
        } else if(!/^[a-zA-Z0-9]{1,6}$/.test(this.state.abbreviation)) {
            //invalid abbreviation
            ToastsStore.error("Invalid abbreviation. It must be between 1 and 6 characters and only contain letters or numbers.");
        } else {
            datacenterutils.updateDatacenter(this.state.oldName, this.state.oldAbbreviation, this.state.name.trim(), this.state.abbreviation.trim(), result => {
                if(result) {
                    this.props.parentCallback(true);
                } else {
                    console.log(result)
                    ToastsStore.error("Error updating datacenter. Please ensure that the name and abbreviation are unique.");
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
            <Grommet theme={theme}>
                <Box pad="medium" background="light-2" width={"medium"}>
                    <Form onSubmit={this.handleSubmit} name="single">
                        <Text>Name</Text>
                        <TextInput name="name" onChange={this.handleChange}
                                   value={this.state.name}/>
                        <Text>Abbreviation</Text>
                        <TextInput name="abbreviation" onChange={this.handleChange}
                                   value={this.state.abbreviation}/>
                        <Button type="submit" primary label="Submit"/>
                    </Form>
                </Box>
            </Grommet>
        )
    }
}

export default EditDatacenterForm