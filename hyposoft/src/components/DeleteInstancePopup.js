import React, { Component } from 'react'
import { Button, Grommet, Form, Heading, Text, Box } from 'grommet'
import { ToastsContainer, ToastsStore } from 'react-toasts';
import * as instutils from '../utils/instanceutils'


//Instance table has a layer, that holds the button to add instance and the form

export default class DeleteInstancePopup extends Component {
    constructor(props) {
        super(props);
        this.state = {

        }
        this.handleDelete = this.handleDelete.bind(this);
    }



    handleDelete(event) {
        console.log(this.props.deleteIDFromParent)
        if (event.target.name === "deleteInst") {
            instutils.deleteInstance(this.props.deleteIDFromParent, status => {
                if (status) {

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
                <Box height="250px" width="medium" pad="medium" gap="xxsmall" overflow="auto" margin="medium">
                    <Heading
                        size="small"
                        margin="small"
                        level="4"
                    >Delete Instance</Heading>
                    <Form onSubmit={this.handleDelete}
                        name="deleteInst"
                    >

                        <Text>Are you sure you want to delete instance <strong>{this.props.deleteIDFromParent}</strong>? This cannot be undone. </Text>

                        <Button

                            alignSelf="center"
                            margin="medium"
                            type="submit"
                            primary label="Yes"
                        />
                        <Button
                            alignSelf="center"
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





