import React from "react";
import theme from "../theme";
import {Box, Heading, Grommet, Button, DataTable, Meter, Layer, Text} from "grommet";
import {Add, Trash, Close} from "grommet-icons";
import * as userutils from "../utils/userutils";
import * as rackutils from "../utils/rackutils";
import AddRackView from "./AddRackView";
import {ToastsContainer, ToastsStore} from "react-toasts";

class RackView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            racks: [],
            popupType: "",
            deleteID: ""
        }
    }

    componentDidMount() {
        rackutils.getRacks(racksdb => {
            this.setState({racks: racksdb});
        })
    }

    AdminTools() {
        if (userutils.isLoggedInUserAdmin()) {
            return (
                <Box direction={"row"}>
                    <Button icon={<Add/>} label={"Add"} style={{width: '150px'}} onClick={() => this.setState({popupType: "Add"})}/>
                    <Button icon={<Trash/>} label={"Remove"} style={{width: '150px'}} onClick={() => {
                    }}/>
                </Box>
            );
        }
    }

    render() {
        const {popupType} = this.state;
        let popup;
        if (popupType === 'Delete') {
            let deleteID = this.state.deleteID;
            popup = (
                <Layer onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>
                    <Box pad="medium" align="center">
                        <Heading level="3" margin="none">Delete rack</Heading>
                        <Text>Are you sure you want to delete rack {deleteID}? This can't be reversed.</Text>
                        <Box direction="row">
                            <Button label="Delete" icon={<Trash/>} onClick={() => {
                                rackutils.deleteSingleRack(deleteID, status => {
                                    if (status) {
                                        console.log(status)
                                        ToastsStore.success('Successfully deleted!');
                                        this.setState({
                                            popupType: "",
                                            racks: this.state.racks.filter(function (rack) {
                                                return rack.id !== deleteID;
                                            })
                                        })
                                    } else {
                                        ToastsStore.error('Failed to delete rack. Please insure that it contains no instances and try again.');
                                        this.setState({popupType: ""})
                                    }
                                });
                            }}/>
                            <Button label="Cancel" icon={<Close/>}
                                    onClick={() => this.setState({popupType: ""})}/>
                        </Box>
                    </Box>
                </Layer>
            )
        } else if (popupType === 'Remove') {

        } else if (popupType === 'Add') {
            popup = (
                <Layer onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>
                    <AddRackView/>
                    <Button label="Cancel" icon={<Close/>}
                            onClick={() => this.setState({popupType: ""})}/>
                </Layer>
            )
        }

        return (
            <Grommet theme={theme}>
                <Box border={{color: 'brand', size: 'medium'}} pad={"medium"}>
                    <Heading margin={"none"}>Racks</Heading>
                    {this.AdminTools()}
                    <DataTable columns={[
                        {
                            property: "id",
                            header: "ID",
                            primary: true
                        },
                        {
                            property: "letter",
                            header: "Row",
                        },
                        {
                            property: "number",
                            header: "Position"
                        },
                        {
                            property: "height",
                            header: "Occupied",
                            render: datum => (
                                <Box pad={{vertical: 'xsmall'}}>
                                    <Meter
                                        values={[{value: datum.instances / 42 * 100}]}
                                        thickness="small"
                                        size="small"
                                    />
                                </Box>
                            )
                        },
                        {
                            property: "instances",
                            header: "Instances"
                        },
                        {
                            property: "modify",
                            header: "Modify",
                            render: datum => (
                                <Button icon={<Trash/>} label="Delete" onClick={() => {
                                    this.setState({popupType: 'Delete', deleteID: datum.id});
                                }}/>
                            )
                        }
                    ]} data={this.state.racks}/>
                </Box>
                {popup}
                <ToastsContainer store={ToastsStore}/>
            </Grommet>
        )
    }
}

export default RackView