import React, { Component } from 'react'
import { Button, Grommet, Form, Heading, Text, Box } from 'grommet'
import { ToastsContainer, ToastsStore } from 'react-toasts';
import * as instutils from '../utils/instanceutils'
import * as userutils from "../utils/userutils";
import {Redirect} from "react-router-dom";
import theme from "../theme";


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
                    this.props.parentCallback(true);

                } else {
                    ToastsStore.error('Error deleting instance.');
                }
            }
            );
        }

    }

    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }

        return (
            <Grommet theme={theme}>
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

                        <Box direction={"row"}>
                            <Button
                                alignSelf="center"
                                margin="small"
                                type="submit"
                                primary label="Yes"
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





