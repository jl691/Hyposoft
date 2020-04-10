import React from "react";
import {Box, Button, Form, Grommet, Text, TextInput} from "grommet";
import theme from "../theme";
import {ToastsStore} from "react-toasts";
import * as offlinestorageutils from "../utils/offlinestorageutils";

class AddOfflineStorageForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            name: "",
            abbreviation: ""
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
            offlinestorageutils.addStorageSite(this.state.name.trim(), this.state.abbreviation.trim(), result => {
                if(result) {
                    this.props.parentCallback("Successfully added the offline storage site!");
                } else {
                    ToastsStore.error("Error adding the offline storage site. Please ensure that the name and abbreviation are unique.");
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
                        <TextInput name="name" placeholder="eg. Musty Closet #1" onChange={this.handleChange}
                                   value={this.state.name}/>
                        <Text>Abbreviation</Text>
                        <TextInput name="abbreviation" placeholder="eg. MC1" onChange={this.handleChange}
                                   value={this.state.abbreviation}/>
                        <Button type="submit" primary label="Submit"/>
                    </Form>
                </Box>
            </Grommet>
        )
    }
}

export default AddOfflineStorageForm