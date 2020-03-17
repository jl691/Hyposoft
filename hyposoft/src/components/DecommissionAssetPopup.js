import React, { Component } from 'react'
import { Button, Grommet, Form, Heading, Text, Box } from 'grommet'
import { ToastsContainer, ToastsStore } from 'react-toasts';
import * as decomutils from '../utils/decommissionutils'
import * as userutils from "../utils/userutils";
import * as changeplanutils from "../utils/changeplanutils";
import {Redirect} from "react-router-dom";
import theme from "../theme";


//Instance table has a layer, that holds the button to add instance and the form

export default class DecommissionAssetPopup extends Component {
    constructor(props) {
        super(props)
        this.state = {}
        this.handleDecommission = this.handleDecommission.bind(this)
    }



    handleDecommission(event) {
        if (event.target.name === "decommissionInst") {
            if(this.props.changePlanID){
                changeplanutils.decommissionAssetChange(this.props.decommissionIDFromParent, this.props.changePlanID, result => {
                    if(result){
                        ToastsStore.success('Decommissioned asset successfully');
                        this.props.parentCallback(true);
                    } else {
                        ToastsStore.error('Error decommissioning asset.');
                    }
                })
            } else {
                decomutils.decommissionAsset(this.props.decommissionIDFromParent, status => {
                        if (status) {
                            ToastsStore.success('Decommissioned asset successfully')
                            this.props.parentCallback(true)

                        } else {
                            ToastsStore.error('Error decommissioning asset.')
                        }
                    }
                )
            }
        }

    }

    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }

        return (
            <Grommet theme={theme}>
                <Box width="medium" gap="xxsmall" overflow="auto" margin="medium">
                    <Heading
                        size="small"
                        margin="none"
                        level="4"
                    >Decommission Asset</Heading>
                    <Form onSubmit={this.handleDecommission}
                        name="decommissionInst"
                    >
                        <Text>Are you sure you want to decommission asset #<strong>{this.props.decommissionIDFromParent}</strong>? This cannot be undone. </Text>
                        <Box direction={"row"}>
                            <Button
                                alignSelf="center"
                                type="submit"
                                primary label="Yes"
                            />
                            <Button
                                margin={{left: 'small'}}
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
