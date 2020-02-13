import React, { Component } from 'react'
import { Button, Grommet, Form, FormField, Heading, TextInput, Box } from 'grommet'
import { ToastsContainer, ToastsStore } from 'react-toasts';
import * as assetidutils from "../utils/assetidutils";
import * as userutils from "../utils/userutils";
import { Redirect } from "react-router-dom";
import theme from "../theme";


export default class AssetIDForm extends Component {

    constructor(props) {
        super(props);
        this.state = {
            asset_id: "",

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
        if (event.target.name === "overrideAssetID") {
            //call backend method
            //Need to connect cancel
            //What happens if you click outside? back to form? Or back to screen?

            assetidutils.overrideAssetID(this.state.asset_id).then(
                _ => {
                    //this.props.parentCallback(true);
                    ToastsStore.success('Successfully used asset ID!');
                }

            ).catch( errMessage => {
                    ToastsStore.error(errMessage, 10000)
               
            })

        }
    }

    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }
        return (
            <Grommet theme={theme}>
                <Box height="medium" width="medium" pad="medium" gap="xxsmall" overflow="auto">
                    <Heading
                        size="small"
                        margin="small"
                        level="4"
                    >Override Asset ID</Heading>
                    <Form onSubmit={this.handleSubmit} name="overrideAssetID">

                        <FormField name="assetID" label="Asset ID">

                            <TextInput padding="medium" name="assetID" placeholder="eg. 100108"
                                onChange={this.handleChange}
                                value={this.state.asset_id} />
                        </FormField>

                        <Box direction={"row"}>

                            <Button
                                margin="small"
                                type="submit"
                                primary label="Submit"
                            />
                            <Button
                                margin="small"
                                label="Cancel"
                                //TODO
                                //Cancel, and passing assetID back to parent
                                onClick={() => this.props.cancelCallback()}
                            />
                        </Box>

                    </Form>
                </Box>


                <ToastsContainer store={ToastsStore} />
            </Grommet>

        )
    }
}
