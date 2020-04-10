import React from "react";
import {Box, Button, Grommet, Heading, Layer, Text} from "grommet";
import theme from "../theme";
import {Close, Trash} from "grommet-icons";
import {ToastsStore} from "react-toasts";
import * as offlinestorageutils from "../utils/offlinestorageutils";

class DeleteOfflineStorageForm extends React.Component {

    render() {
        return (
            <Grommet theme={theme}>
                <Layer onEsc={() => this.props.cancelPopup(true)}
                       onClickOutside={() => this.props.cancelPopup(true)}>
                    <Box pad="medium" align="center">
                        <Heading level="3" margin="none">Delete offline storage site</Heading>
                        <Text>Are you sure you want to delete offline storage site {this.props.name} ({this.props.abbreviation})?
                            This can't be reversed.</Text>
                        <Box direction="row">
                            <Button label="Delete" icon={<Trash/>} onClick={() => {
                              offlinestorageutils.deleteStorageSite(this.props.name, status => {
                                    if (status) {
                                        this.props.forceRefresh('Successfully deleted the offline storage site!');
                                    } else {
                                        ToastsStore.error('Failed to delete the offline storage site. Please ensure that it contains no assets and try again.');
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

export default DeleteOfflineStorageForm