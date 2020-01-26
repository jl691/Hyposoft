import React from "react";
import theme from "../theme";
import {Box, Heading, Grommet, Button, DataTable, Meter, Layer, Text, CheckBox} from "grommet";
import {Add, Trash, Close} from "grommet-icons";
import * as userutils from "../utils/userutils";
import * as rackutils from "../utils/rackutils";
import AddRackView from "./AddRackView";
import {ToastsContainer, ToastsStore} from "react-toasts";
import DeleteRackView from "./DeleteRackView"

class RackView extends React.Component {

    startAfter = null;

    constructor(props) {
        super(props);
        this.state = {
            racks: [],
            popupType: "",
            deleteID: "",
            initialLoaded: false,
            checkedBoxes: []
        }
    }

    callbackFunction = (data) => {
        this.forceRefresh();
    }

    componentDidMount() {
        console.log(typeof this.state.checkedBoxes)
        console.log(Array.isArray(this.state.checkedBoxes))
        rackutils.getRacks((startAfterCallback, rackCallback) => {
            if (startAfterCallback && rackCallback) {
                this.startAfter = startAfterCallback;
                this.setState({racks: rackCallback, initialLoaded: true});
            }
        })
        rackutils.generateRackDiagram("09ZXdZyFzu7TQY0GCGN3", result => {
            if(result){
                console.log("success!")
                console.log(result);
            } else {
                console.log("error")
            }
        });
    }

    forceRefresh() {
        this.startAfter = null;
        this.setState({initialLoaded: false, racks: [], popupType: "", deleteID: ""});
        rackutils.getRacks((startAfterCallback, rackCallback) => {
            if (startAfterCallback && rackCallback) {
                this.startAfter = startAfterCallback;
                this.setState({racks: rackCallback, initialLoaded: true});
            }
        })
    }

    AdminTools() {
        if (userutils.isLoggedInUserAdmin()) {
            return (
                <Box direction={"row"}>
                    <Button icon={<Add/>} label={"Add"} style={{width: '150px'}}
                            onClick={() => this.setState({popupType: "Add"})}/>
                    <Button icon={<Trash/>} label={"Remove"} style={{width: '150px'}}
                            onClick={() => this.setState({popupType: "Remove"})}/>
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
                                        this.forceRefresh();
                                        ToastsStore.success('Successfully deleted!');
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
            popup = (
                <Layer onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>
                    <DeleteRackView parentCallback={this.callbackFunction}/>
                    <Button label="Cancel" icon={<Close/>}
                            onClick={() => this.setState({popupType: ""})}/>
                </Layer>
            )
        } else if (popupType === 'Add') {
            popup = (
                <Layer onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>
                    <AddRackView parentCallback={this.callbackFunction}/>
                    <Button label="Cancel" icon={<Close/>}
                            onClick={() => this.setState({popupType: ""})}/>
                </Layer>
            )
        }

        if (!this.state.initialLoaded) {
            return (<Text>Please wait...</Text>);
        }

        return (
            <Grommet theme={theme}>
                <Box border={{color: 'brand', size: 'medium'}} pad={"medium"}>
                    <Heading margin={"none"}>Racks</Heading>
                    {this.AdminTools()}
                    <DataTable step={25}
                               onMore={() => {
                                   rackutils.getRackAt(this.startAfter, (newStartAfter, newRacks) => {
                                       this.startAfter = newStartAfter
                                       this.setState({racks: this.state.racks.concat(newRacks)})
                                   });
                               }}
                               columns={[
                                   {
                                     property: "checkbox",
                                     render: datum => (
                                         <CheckBox key={datum.id}
                                                   checked={this.state.checkedBoxes.includes(datum.id)}
                                   onChange={e => {
                                       if(this.state.checkedBoxes.includes(datum.id)){
                                            this.state.checkedBoxes.splice(this.state.checkedBoxes.indexOf(datum.id), 1);
                                       } else {
                                           console.log("kmsssss")
                                           this.state.checkedBoxes.push(datum.id);
                                       }
                                   }}/>
                                     )
                                   },
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