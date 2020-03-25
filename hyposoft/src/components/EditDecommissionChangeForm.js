import React from "react";
import {Box, Button, Grommet, Heading, Layer, Menu, Text} from "grommet";
import * as changeplanutils from "../utils/changeplanutils";
import * as assetutils from "../utils/assetutils";
import {ToastsContainer, ToastsStore} from "react-toasts";

class EditDecommissionChangeForm extends React.Component {

    menuItems = [];
    assetData;

    constructor(props) {
        super(props);
        this.state = {
            assetsLoaded: false
        };
    }

    getAssetsList() {
        let newMenuItems = [];
        if (this.state.assetsLoaded) {
            this.menuItems.forEach(menuItem => {
                newMenuItems.push({
                    label: menuItem,
                    onClick: () => {
                        let selectedData = this.assetData.get(menuItem);
                        changeplanutils.decommissionAssetChange(selectedData.assetId, this.props.changePlanID, result => {
                            if(result){
                                this.props.successfulEdit("Successfully edited step #" + this.props.stepID);
                            } else {
                                console.log(result)
                                ToastsStore.error("Something went wrong. Please try again later.");
                            }
                        }, this.props.stepID);
                    }
                });
            });
            return (
                <Menu items={newMenuItems} label={"Select an asset..."} alignSelf={"center"}/>
            )
        } else {
            return (
                <Menu label={"No assets found."} alignSelf={"center"}/>
            )
        }
    }

    componentDidMount() {
        assetutils.getAllAssetsList((assetNames, assetData) => {
            if (assetNames) {
                this.assetData = assetData;
                let count = 0;
                assetNames.forEach(asset => {
                    this.menuItems.push(asset);
                    count++;
                    if (count === assetNames.length) {
                        this.setState({
                            assetsLoaded: true,
                        });
                    }
                })
            } else {
                this.setState({
                    assetsLoaded: true
                });
            }
        })
    }

    render() {
        return (
            <React.Fragment>
                <Layer onEsc={() => this.props.cancelPopup(true)}
                       onClickOutside={() => this.props.cancelPopup(true)}>
                    <Box pad="medium" align="center">
                        <Heading level="3" margin="none">Edit Change</Heading>
                        <Text>Select a new asset to decommission in step #{this.props.stepID}.</Text>
                        <Box>
                            {this.getAssetsList()}
                        </Box>
                    </Box>
                </Layer>
                <ToastsContainer store={ToastsStore} />
            </React.Fragment>
        )
    }
}

export default EditDecommissionChangeForm