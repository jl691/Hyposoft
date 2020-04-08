import React, { Component } from 'react'
import { Button, Grommet, Form, Heading, Text, Box } from 'grommet'
import { ToastsContainer, ToastsStore } from 'react-toasts';
import * as assetutils from '../utils/assetutils'
import * as bladeutils from '../utils/bladeutils'
import * as modelutils from '../utils/modelutils'
import * as userutils from "../utils/userutils";
import {Redirect} from "react-router-dom";
import theme from "../theme";


//Instance table has a layer, that holds the button to add instance and the form

export default class DeleteAssetPopup extends Component {
    deleteFunction = null
    isNonBlade = true
    previousModel = null

    constructor(props) {
        super(props);
        this.state = {

        }
        this.handleDelete = this.handleDelete.bind(this);
    }



    handleDelete(event) {
        console.log(this.props.deleteIDFromParent)
        if (event.target.name === "deleteInst") {
            this.deleteFunction(this.props.deleteIDFromParent, status => {
                if (status) {

                    ToastsStore.success('Deleted asset');
                    this.props.parentCallback(true);

                } else {
                    ToastsStore.error('Error deleting asset.');
                }
            }
            );
        }

    }

    determineDeleteFunction(callback) {
       modelutils.getModelByModelname(this.props.deleteModel, doc => {
           if (doc) {
               switch (doc.data().mount) {
                 case 'chassis':
                   this.deleteFunction = bladeutils.deleteChassis
                   this.isNonBlade = true
                   break
                 case 'blade':
                   this.deleteFunction = bladeutils.deleteServer
                   this.isNonBlade = false
                   break
                 default:
                   this.deleteFunction = assetutils.deleteAsset
                   this.isNonBlade = true
               }
           } else {
               this.deleteFunction = assetutils.deleteAsset
               this.isNonBlade = true
           }
           callback()
       })
    }

    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }

        if (this.previousModel !== this.props.deleteModel) {
            this.previousModel = this.props.deleteModel
            this.determineDeleteFunction(() => this.setState(oldState => ({ ...oldState})))
        }

        return (
            <Grommet theme={theme}>
                <Box width="medium" gap="xxsmall" overflow="auto" margin="medium">
                    <Heading
                        size="small"
                        margin="none"
                        level="4"
                    >Delete Asset</Heading>
                    <Form onSubmit={this.handleDelete}
                        name="deleteInst"
                    >

                        <Text>Are you sure you want to delete asset <strong>{this.props.deleteModel} {this.props.deleteHostname}</strong>? This cannot be undone. </Text>

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
