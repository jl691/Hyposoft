import React from "react";
import {Box, Button, Grommet, Heading, Layer, Text} from "grommet";
import {Close, Trash} from "grommet-icons";
import {ToastsStore} from "react-toasts";
import * as changeplanutils from "../utils/changeplanutils";

class DeleteChangeForm extends React.Component {

    render() {
        return (
            <React.Fragment>
                <Layer onEsc={() => this.props.cancelPopup(true)}
                       onClickOutside={() => this.props.cancelPopup(true)}>
                    <Box pad="medium" align="center">
                        <Heading level="3" margin="none">Delete Change</Heading>
                        <Text>Are you sure you want to delete change number {this.props.stepNumber}?
                            This can't be reversed.</Text>
                        <Box direction="row">
                            <Button label="Delete" icon={<Trash/>} onClick={() => {
                                changeplanutils.deleteChange(this.props.changePlanID, this.props.stepNumber, status => {
                                    console.log(status);
                                    if (status) {
                                        this.props.forceRefresh(true);
                                        //this.props.genConflict()
                                        ToastsStore.success('Successfully deleted!');
                                    } else {
                                        ToastsStore.error('Failed to delete change. Please try again.');
                                        this.props.cancelPopup(true);
                                    }
                                });
                            }}/>
                            <Button label="Cancel" icon={<Close/>}
                                    onClick={() => this.props.cancelPopup(true)}/>
                        </Box>
                    </Box>
                </Layer>
            </React.Fragment>
        )
    }
}

export default DeleteChangeForm