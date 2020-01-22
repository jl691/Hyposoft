import React, { Component } from 'react'
import { Button, Grommet, Form,  Heading, Text, Box } from 'grommet'
import { ToastsContainer, ToastsStore } from 'react-toasts';
import * as instutils from '../utils/instanceutils'


//Instance table has a layer, that holds the button to add instance and the form

export default class DeleteInstancePopup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            id: "",
            model: "",
            hostname: "",
            rack: "",
            rackU: "",
            owner: "",
            comment: ""

        }
        this.handleSubmit = this.handleSubmit.bind(this);
    }



    handleSubmit(event) {
        if (event.target.name === "deleteInst") {
            instutils.deleteInstance(this.state.id, status => {
                if (status) {
                    console.log(this.state)
                    ToastsStore.success('Deleted instance');
           
                } else {
                    ToastsStore.error('Error deleting instance.');
                }
            }
            );
        }

    }

    render() {

        return (
            <Grommet>
                <Box height="medium" width="medium" pad="medium" gap="xxsmall" overflow="auto">
                    <Heading
                        size="small"
                        margin="small"
                        level="4"
                    >Delete Instance</Heading>
                    <Form onSubmit={this.handleSubmit} name="deleteInst" >

                        <Text>Are you sure you want to delete this instance?</Text>

                        <Button
                            margin="small"
                            type="submit"
                            primary label="Submit"
                        />
                        <Button
                            margin="small"
                            label="Cancel"
                            //TODO: make sure this is the correct callback
                            onClick={() => this.props.cancelCallbackFromParent()}

                        />

                    </Form >
                </Box>


                <ToastsContainer store={ToastsStore} />
            </Grommet>


        )



    }

}





