import React from "react";
import {Box, Button, Grommet, Heading, Layer, Text} from "grommet";
import theme from "../theme";
import {Close, Trash} from "grommet-icons";
import * as rackutils from "../utils/rackutils";
import {ToastsStore} from "react-toasts";
import * as datacenterutils from "../utils/datacenterutils";

class DeleteDatacenterForm extends React.Component {

    render() {
        return (
            <Grommet theme={theme}>
                <Layer onEsc={() => this.props.cancelPopup(true)}
                       onClickOutside={() => this.props.cancelPopup(true)}>
                    <Box pad="medium" align="center">
                        <Heading level="3" margin="none">Delete datacenter</Heading>
                        <Text>Are you sure you want to delete datacenter {this.props.name} ({this.props.abbreviation})?
                            This can't be reversed.</Text>
                        <Box direction="row">
                            <Button label="Delete" icon={<Trash/>} onClick={() => {
                                datacenterutils.deleteDatacenter(this.props.name, status => {
                                    if (status) {
                                        this.props.forceRefresh(true);
                                        ToastsStore.success('Successfully deleted!');
                                    } else {
                                        ToastsStore.error('Failed to delete datacenter. Please ensure that it contains no racks and try again.');
                                        this.props.cancelPopup(true);
                                    }
                                });
                            }}/>
                            <Button label="Cancel" icon={<Close/>}
                                    onClick={() => this.props.cancelPopup(true)}/>
                        </Box>
                    </Box>
                </Layer>
            </Grommet>
        )
    }
}

export default DeleteDatacenterForm