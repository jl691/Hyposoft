import React from "react";
import theme from "../theme";
import {
    Box,
    Heading,
    Grommet,
    Button,
    DataTable,
    Layer,
    Text,
    Form,
    TextInput,
    Stack,
    RangeSelector,
    Menu, Select
} from "grommet";
import {Add, Trash, Close, View, Analytics, FormEdit, FormTrash, FormView} from "grommet-icons";
import * as userutils from "../utils/userutils";
import * as rackutils from "../utils/rackutils";
import AddRackView from "./AddRackView";
import {ToastsContainer, ToastsStore} from "react-toasts";
import DeleteRackView from "./DeleteRackView"
import HomeButton from "./HomeButton";
import UserMenu from "./UserMenu";
import AppBar from "./AppBar";
import RackUsageReport from "./RackUsageReport";
import * as formvalidationutils from "../utils/formvalidationutils";
import * as datacenterutils from "../utils/datacenterutils";
import {Redirect} from "react-router-dom";
import SingleRackElevation from "./SingleRackElevation";

class RackView extends React.Component {

    startAfter = null;
    datacenters = [];

    constructor(props) {
        super(props);
        this.state = {
            racks: [],
            popupType: "",
            deleteID: "",
            deleteLetter: "",
            deleteNumber: "",
            rackReport: "",
            initialLoaded: false,
            checkedBoxes: [],
            letterStart: "",
            letterEnd: "",
            numberStart: "",
            numberEnd: "",
            elevation: "",
            datacenter: "",
            datacentersLoaded: false
        }

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    callbackFunction = (data) => {
        this.forceRefresh(this.state.datacenter);
    }

    componentDidMount() {
        this.fetchDatacenters();
    }

    forceRefresh(datacenter) {
        console.log("called forcerefresh with state " + datacenter)
        this.startAfter = null;
        this.setState({initialLoaded: false, racks: [], popupType: "", deleteID: ""});
        if (datacenter === "All") {
            rackutils.getRackAt((startAfterCallback, rackCallback, empty) => {
                if (empty) {
                    console.log("eptyyyy")
                    this.setState({initialLoaded: true});
                } else if (startAfterCallback && rackCallback) {
                    this.startAfter = startAfterCallback;
                    this.setState({racks: rackCallback, initialLoaded: true});
                }
            })
        } else {
            rackutils.getRackAt((startAfterCallback, rackCallback, empty) => {
                if (empty) {
                    console.log("eptyyyy")
                    this.setState({initialLoaded: true});
                } else if (startAfterCallback && rackCallback) {
                    this.startAfter = startAfterCallback;
                    this.setState({racks: rackCallback, initialLoaded: true});
                }
            }, datacenter)
        }
    }

    fetchDatacenters() {
        let count = 0;
        let items = [];
        datacenterutils.getAllDatacenterNames(names => {
            if (names.length) {
                names.forEach(name => {
                    this.datacenters.push(name);
                    count++;
                    if (count === names.length) {
                        this.datacenters.push(name);
                        console.log(items)
                        this.setState({
                            datacentersLoaded: true
                        });
                    }
                })
            } else {
                console.log("no datacenters")
                this.datacenters.push("No datacenters exist.")
                this.setState({
                    datacentersLoaded: true
                });
            }
        })
    }

    generateDatacenters() {
        if (!this.state.datacentersLoaded) {
            return (<Menu
                label="Please wait..."
            />)
        } else {
            console.log(this.datacenters)
            return (
                <Select
                    placeholder="Select one..."
                    options={this.datacenters}
                    value={this.state.datacenter}
                    onChange={(option) => {
                        this.setState({
                            datacenter: option.value
                        });
                        this.forceRefresh(option.value)
                    }}
                />
            )
        }
    }

    AdminTools() {
        if (userutils.isLoggedInUserAdmin()) {
            return (
                <Box
                    width='medium'
                    align='center'
                    margin={{left: 'medium', right: 'medium'}}
                    justify='start'>
                    <Box style={{
                        borderRadius: 10,
                        borderColor: '#EDEDED'
                    }}
                         direction='row'
                         alignSelf='stretch'
                         background='#FFFFFF'
                         width={'medium'}
                         margin={{top: 'medium', left: 'medium', right: 'medium'}}
                         pad='small'>
                        <Box flex
                             margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                             direction='column' justify='start'>
                            <Heading level='4' margin='none'>Datacenter</Heading>
                            {this.generateDatacenters()}
                        </Box>
                    </Box>
                    <Box style={{
                        borderRadius: 10,
                        borderColor: '#EDEDED'
                    }}
                         direction='row'
                         alignSelf='stretch'
                         background='#FFFFFF'
                         width={'medium'}
                         margin={{top: 'medium', left: 'medium', right: 'medium'}}
                         pad='small'>
                        <Box flex
                             margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                             direction='column' justify='start'>
                            <Heading level='4' margin='none'>Add racks</Heading>
                            <p>Add a single rack or a range of racks.</p>
                            <Box direction='column' flex alignSelf='stretch'>
                                <Button primary icon={<Add/>} label="Add" onClick={() => {
                                    if(this.state.datacenter){
                                        this.setState({popupType: "Add"})
                                    } else {
                                        ToastsStore.error("Please select a datacenter first.");
                                    }
                                }}/>
                            </Box>
                        </Box>
                    </Box>
                    <Box style={{
                        borderRadius: 10,
                        borderColor: '#EDEDED'
                    }}
                         direction='row'
                         alignSelf='stretch'
                         background='#FFFFFF'
                         width={'medium'}
                         margin={{top: 'medium', left: 'medium', right: 'medium'}}
                         pad='small'>
                        <Box flex
                             margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                             direction='column' justify='start'>
                            <Heading level='4' margin='none'>Remove racks</Heading>
                            <p>Remove a range of racks.</p>
                            <Box direction='column' flex alignSelf='stretch'>
                                <Button primary icon={<Trash/>} label="Remove" onClick={() => {
                                    if(this.state.datacenter){
                                        this.setState({popupType: "Remove"});
                                    } else {
                                        ToastsStore.error("Please select a datacenter first.");
                                    }
                                }}/>
                            </Box>
                        </Box>
                    </Box>
                    <Box style={{
                        borderRadius: 10,
                        borderColor: '#EDEDED'
                    }}
                         direction='row'
                         alignSelf='stretch'
                         background='#FFFFFF'
                         width={'medium'}
                         margin={{top: 'medium', left: 'medium', right: 'medium'}}
                         pad='small'>
                        <Box flex
                             margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                             direction='column' justify='start'>
                            <Heading level='4' margin='none'>View rack elevations</Heading>
                            <p>View rack elevations for a range of racks.</p>
                            <Box direction='column' flex alignSelf='stretch'>
                                <Button primary icon={<View/>} label="Elevation" onClick={() => {
                                    if(this.state.datacenter){
                                        this.setState({popupType: "Diagram"})
                                    } else {
                                        ToastsStore.error("Please select a datacenter first.");
                                    }
                                }}/>
                            </Box>
                        </Box>
                    </Box>
                    <Box style={{
                        borderRadius: 10,
                        borderColor: '#EDEDED'
                    }}
                         direction='row'
                         alignSelf='stretch'
                         background='#FFFFFF'
                         width={'medium'}
                         margin={{top: 'medium', left: 'medium', right: 'medium'}}
                         pad='small'>
                        <Box flex
                             margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                             direction='column' justify='start'>
                            <Heading level='4' margin='none'>View rack usage report</Heading>
                            <p>View an overall rack usage report for all racks, either globally or per datacenter..</p>
                            <Box direction='column' flex alignSelf='stretch'>
                                <Button primary icon={<Analytics/>} margin={"small"} label="Global" onClick={() => {
                                    this.setState({popupType: "ReportAll"})
                                }}/>
                                <Button primary icon={<Analytics/>} margin={"small"} label="Datacenter" onClick={() => {
                                    if(this.state.datacenter){
                                        this.setState({popupType: "ReportDatacenter"})
                                    } else {
                                        ToastsStore.error("Please select a datacenter first.");
                                    }
                                }}/>
                            </Box>
                        </Box>
                    </Box></Box>
            );
        } else {
            return (
                <Box
                    width='medium'
                    align='center'
                    margin={{left: 'medium', right: 'medium'}}
                    justify='start'>
                    <Box style={{
                        borderRadius: 10,
                        borderColor: '#EDEDED'
                    }}
                         direction='row'
                         alignSelf='stretch'
                         background='#FFFFFF'
                         width={'medium'}
                         margin={{top: 'medium', left: 'medium', right: 'medium'}}
                         pad='small'>
                        <Box flex
                             margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                             direction='column' justify='start'>
                            <Heading level='4' margin='none'>View rack elevations</Heading>
                            <p>View rack elevations for a range of racks.</p>
                            <Box direction='column' flex alignSelf='stretch'>
                                <Button primary icon={<View/>} label="Elevation" onClick={() => {
                                    this.setState({popupType: "Diagram"})
                                }}/>
                            </Box>
                        </Box>
                    </Box>
                    <Box style={{
                        borderRadius: 10,
                        borderColor: '#EDEDED'
                    }}
                         direction='row'
                         alignSelf='stretch'
                         background='#FFFFFF'
                         width={'medium'}
                         margin={{top: 'medium', left: 'medium', right: 'medium'}}
                         pad='small'>
                        <Box flex
                             margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                             direction='column' justify='start'>
                            <Heading level='4' margin='none'>View rack usage report</Heading>
                            <p>View an overall rack usage report for all racks.</p>
                            <Box direction='column' flex alignSelf='stretch'>
                                <Button primary icon={<Analytics/>} label="Report" onClick={() => {
                                    this.setState({popupType: "ReportAll"})
                                }}/>
                            </Box>
                        </Box>
                    </Box></Box>
            )
        }
    }

    RackDeleteButton(datum) {
        if (userutils.isLoggedInUserAdmin()) {
            return (
                <Trash onClick={() => {
                    console.log(datum)
                    this.setState({
                        popupType: 'Delete',
                        deleteID: datum.id,
                        deleteLetter: datum.letter,
                        deleteNumber: datum.number
                    });
                }}/>
            )
        }
    }

    generateColumns() {
        let cols = [
            {
                property: "count",
                header: <Text size={"small"}>ID</Text>,
                primary: true,
                render: datum => (<Text size={"small"}>{datum.count}</Text>)
            },
            {
                property: "letter",
                header: <Text size='small'>Row</Text>,
                render: datum => (
                    <Text size='small'>{datum.letter}</Text>)
            },
            {
                property: "number",
                header: <Text size='small'>Position</Text>,
                render: datum => (
                    <Text size='small'>{datum.number}</Text>)
            },
            {
                property: "assets",
                header: <Text size='small'>Assets</Text>,
                render: datum => (
                    <Text size='small'>{datum.assets}</Text>)
            },
            {
                property: "view",
                header: <Text size='small'>View</Text>,
                render: datum => (<View
                    onClick={() => {
                        this.setState({
                            popupType: 'Elevation',
                            elevation: datum.id
                        })
                    }}/>)
            },
            {
                property: "report",
                header: <Text size='small'>Report</Text>,
                render: datum => (<Analytics
                    onClick={() => {
                        this.setState({
                            popupType: 'Report',
                            rackReport: datum.id
                        })
                    }}/>)
            }
        ];
        if (userutils.isLoggedInUserAdmin()) {
            cols.push({
                property: "delete",
                header: <Text size='small'>Delete</Text>,
                render: datum =>
                    this.RackDeleteButton(datum)
            });
        }
        return cols;
    }

    DataTable() {
        if (!this.state.datacenter) {
            return (
                <Text>Please select a datacenter from the right.</Text>
            )
        } else if (!this.state.initialLoaded) {
            return (
                <Text>Please wait...</Text>
            )
        } else {
            return (
                <DataTable step={25}
                           onMore={() => {
                               if (this.startAfter) {
                                   if(this.state.datacenter && this.state.datacenter === "All"){
                                       rackutils.getRackAt((newStartAfter, newRacks, empty) => {
                                           if (!empty) {
                                               this.startAfter = newStartAfter
                                               this.setState({racks: this.state.racks.concat(newRacks)})
                                           }
                                       }, null, this.startAfter);
                                   } else if(this.state.datacenter) {
                                       rackutils.getRackAt((newStartAfter, newRacks, empty) => {
                                           if (!empty) {
                                               this.startAfter = newStartAfter
                                               this.setState({racks: this.state.racks.concat(newRacks)})
                                           }
                                       }, this.state.datacenter, this.startAfter);
                                   }
                               }
                           }}
                           columns={this.generateColumns()} data={this.state.racks} size={"large"}/>
            )
        }
    }

    handleSubmit(event) {
        if (!this.state.letterStart || !this.state.letterEnd || !this.state.numberStart || !this.state.numberEnd) {
            //invalid length
            ToastsStore.error('Please fill out all fields.');
        } else if (!parseInt(this.state.numberStart) || !parseInt(this.state.numberEnd)) {
            //invalid numbrt
            ToastsStore.error('Invalid number.');
        } else if (!formvalidationutils.checkPositive(this.state.numberStart) || !formvalidationutils.checkPositive(this.state.numberEnd)) {
            //non positive number
            ToastsStore.error('Numbers must be positive.');
        } else if (!formvalidationutils.checkUppercaseLetter(this.state.letterStart) || !formvalidationutils.checkUppercaseLetter(this.state.letterEnd)) {
            //non uppercase letter
            ToastsStore.error('Rows must be a single uppercase letter.');
        } else if (!formvalidationutils.checkNumberOrder(this.state.numberStart, this.state.numberEnd) || !formvalidationutils.checkLetterOrder(this.state.letterStart, this.state.letterEnd)) {
            //ranges incorrect
            ToastsStore.error('The starting row or number must come before the ending row or number.');
        } else {
            //we gucci
            this.props.history.push({
                pathname: '/rackelevation',
                state: {
                    startRow: this.state.letterStart,
                    endRow: this.state.letterEnd,
                    startNumber: this.state.numberStart,
                    endNumber: this.state.numberEnd,
                    datacenter: this.state.datacenter
                }
            })
        }
    }

    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/'/>
        }

        const {popupType} = this.state;
        let popup;
        if (localStorage.getItem('tipShown') !== 'yes') {
            ToastsStore.info("Tip: Click on column headers to sort", 3000, 'burntToast')
            localStorage.setItem('tipShown', 'yes')
        }

        if (popupType === 'Delete') {
            let deleteID = this.state.deleteID;
            popup = (
                <Layer onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>
                    <Box pad="medium" align="center">
                        <Heading level="3" margin="none">Delete rack</Heading>
                        <Text>Are you sure you want to delete rack {this.state.deleteLetter}{this.state.deleteNumber}?
                            This can't be reversed.</Text>
                        <Box direction="row">
                            <Button label="Delete" icon={<Trash/>} onClick={() => {
                                rackutils.deleteSingleRack(deleteID, status => {
                                    if (status) {
                                        this.forceRefresh(this.state.datacenter);
                                        ToastsStore.success('Successfully deleted!');
                                    } else {
                                        ToastsStore.error('Failed to delete rack. Please insure that it contains no assets and try again.');
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
                    <DeleteRackView parentCallback={this.callbackFunction} datacenter={this.state.datacenter}/>
                    <Button label="Cancel" icon={<Close/>}
                            onClick={() => this.setState({popupType: ""})}/>
                </Layer>
            )
        } else if (popupType === 'Add') {
            popup = (
                <Layer onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>
                    <AddRackView parentCallback={this.callbackFunction} datacenter={this.state.datacenter}/>
                    <Button label="Cancel" icon={<Close/>}
                            onClick={() => this.setState({popupType: ""})}/>
                </Layer>
            )
        } else if (popupType === 'Diagram') {
            popup = (
                <Layer onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>
                    <Box pad="medium" background="light-2">
                        <Form onSubmit={this.handleSubmit} name="range">
                            <Text>Row range</Text>
                            <Box direction="row">
                                <TextInput name="letterStart" placeholder="eg. A, B, C" onChange={this.handleChange}/>
                                to
                                <TextInput name="letterEnd" placeholder="eg. D, E, F" onChange={this.handleChange}/>
                            </Box>
                            <Text>Number range</Text>
                            <Box direction="row">
                                <TextInput name="numberStart" placeholder="eg. 6, 12, 22" onChange={this.handleChange}/>
                                to
                                <TextInput name="numberEnd" placeholder="eg. 24, 36, 48" onChange={this.handleChange}/>
                            </Box>
                            <Button type="submit" primary label="Submit"/>
                        </Form>
                    </Box>
                    <Button label="Cancel" icon={<Close/>} onClick={() => this.setState({popupType: ""})}/>
                </Layer>
            )
        } else if (popupType === 'Report') {
            popup = (
                <Layer onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>
                    <RackUsageReport rack={this.state.rackReport} type={"single"}/>
                    <Button label="Close" icon={<Close/>}
                            onClick={() => this.setState({popupType: ""})}/>
                </Layer>
            )
        } else if (popupType === 'ReportAll') {
            popup = (
                <Layer onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>
                    <RackUsageReport rack={this.state.rackReport} type={"all"}/>
                    <Button label="Close" icon={<Close/>}
                            onClick={() => this.setState({popupType: ""})}/>
                </Layer>
            )
        } else if (popupType === 'ReportDatacenter') {
            popup = (
                <Layer onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>
                    <RackUsageReport rack={this.state.datacenter} type={"datacenter"}/>
                    <Button label="Close" icon={<Close/>}
                            onClick={() => this.setState({popupType: ""})}/>
                </Layer>
            )
        } else if (popupType === 'Elevation') {
            popup = (
                <Layer onEsc={() => this.setState({popupType: undefined})}
                       onClickOutside={() => this.setState({popupType: undefined})}>
                    <SingleRackElevation rackID={this.state.elevation}/>
                    <Button label="Close" icon={<Close/>}
                            onClick={() => this.setState({popupType: ""})}/>
                </Layer>
            );
        }

        return (
            <Grommet theme={theme} full className='fade'>
                <Box fill background='light-2'>
                    <AppBar>
                        <HomeButton alignSelf='start' this={this}/>
                        <Heading alignSelf='center' level='4' margin={{
                            top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                        }}>Racks</Heading>
                        <UserMenu alignSelf='end' this={this}/>
                    </AppBar>
                    <Box direction='row'
                         justify='center'
                         wrap={true}>
                        <Box direction='row' justify='center' overflow={{horizontal: 'hidden'}}>
                            <Box direction='row' justify='center'>
                                <Box width='large' direction='column' align='stretch' justify='start'>
                                    <Box style={{
                                        borderRadius: 10,
                                        borderColor: '#EDEDED'
                                    }}
                                         id='containerBox'
                                         direction='row'
                                         background='#FFFFFF'
                                         margin={{top: 'medium', bottom: 'medium'}}
                                         flex={{
                                             grow: 0,
                                             shrink: 0
                                         }}
                                         pad='small'>
                                        <Box margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                                             direction='column'
                                             justify='start' alignSelf='stretch' height={"810px"} flex>
                                            <Box align="center">

                                                {this.DataTable()}

                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                                {this.AdminTools()}
                            </Box>
                        </Box>
                    </Box>
                </Box>
                {popup}
                <ToastsContainer store={ToastsStore}/>
            </Grommet>
        )
    }
}

export default RackView
