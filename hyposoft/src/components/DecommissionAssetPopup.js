import React, { Component } from 'react'
import { Button, Grommet, Form, Heading, Text, Box } from 'grommet'
import { ToastsContainer, ToastsStore } from 'react-toasts';
import * as decomutils from '../utils/decommissionutils'
import * as assetutils from '../utils/assetutils'
import * as bladeutils from '../utils/bladeutils'
import * as modelutils from '../utils/modelutils'
import * as userutils from "../utils/userutils";
import * as changeplanutils from "../utils/changeplanutils";
import {Redirect} from "react-router-dom";
import theme from "../theme";


//Instance table has a layer, that holds the button to add instance and the form

export default class DecommissionAssetPopup extends Component {
    decommissionFunction = null
    isNonBlade = true
    previousModel = null

    constructor(props) {
        super(props)
        this.state = {}
        this.handleDecommission = this.handleDecommission.bind(this)
    }



    handleDecommission(event) {
        if (event.target.name === "decommissionInst") {
            if(this.props.changePlanID){
                ToastsStore.info('Please wait...', 3000);
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
                    }, this.decommissionFunction)
            }
        }

    }

    determineDecommissionFunction(callback) {
       modelutils.getModelByModelname(this.props.decommissionModel, doc => {
           if (doc) {
               switch (doc.data().mount) {
                 case 'chassis':
                   this.decommissionFunction = bladeutils.deleteChassis
                   this.isNonBlade = true
                   break
                 case 'blade':
                   this.decommissionFunction = bladeutils.deleteServer
                   this.isNonBlade = false
                   break
                 default:
                   this.decommissionFunction = assetutils.deleteAsset
                   this.isNonBlade = true
               }
           } else {
               this.decommissionFunction = assetutils.deleteAsset
               this.isNonBlade = true
           }
           callback()
       })
    }

    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }

        if (this.previousModel !== this.props.decommissionModel) {
            this.previousModel = this.props.decommissionModel
            this.determineDecommissionFunction(() => this.setState(oldState => ({ ...oldState})))
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
                        <Text>Are you sure you want to decommission asset #<strong>{this.props.decommissionIDFromParent}</strong>? {
                            this.props.changePlanID ? "This will only take effect in the change plan." : "This cannot be undone."
                        } </Text>
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
