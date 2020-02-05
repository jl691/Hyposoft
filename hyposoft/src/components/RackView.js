import React from "react";
import theme from "../theme";
import {Box, Heading, Grommet, Button, DataTable, Layer, Text, Form, TextInput, Stack, RangeSelector} from "grommet";
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
import {Redirect} from "react-router-dom";

class RackView extends React.Component {

    startAfter = null;

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
            numberEnd: ""
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
        this.forceRefresh();
    }

    componentDidMount() {
        rackutils.getRackAt((startAfterCallback, rackCallback) => {
            if (!(startAfterCallback === null) && !(rackCallback === null)) {
                this.startAfter = startAfterCallback;
                console.log("loaded up until " + this.startAfter)
                console.log(this.startAfter.data())
                this.setState({racks: rackCallback, initialLoaded: true});
            }
        });
    }

    forceRefresh() {
        this.startAfter = null;
        this.setState({initialLoaded: false, racks: [], popupType: "", deleteID: ""});
        rackutils.getRackAt((startAfterCallback, rackCallback) => {
            if (startAfterCallback && rackCallback) {
                this.startAfter = startAfterCallback;
                this.setState({racks: rackCallback, initialLoaded: true});
            }
        })
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
                            <Heading level='4' margin='none'>Add racks</Heading>
                            <p>Add a single rack or a range of racks.</p>
                            <Box direction='column' flex alignSelf='stretch'>
                                <Button primary icon={<Add/>} label="Add" onClick={() => {this.setState({popupType: "Add"})
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
                                <Button primary icon={<Trash/>} label="Remove" onClick={() => {this.setState({popupType: "Remove"})
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
                                <Button primary icon={<View/>} label="Elevation" onClick={() => {this.setState({popupType: "Diagram"})
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
                                <Button primary icon={<Analytics/>} label="Report" onClick={() => {this.setState({popupType: "ReportAll"})
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
                                <Button primary icon={<View/>} label="Elevation" onClick={() => {this.setState({popupType: "Diagram"})
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
                                <Button primary icon={<Analytics/>} label="Report" onClick={() => {this.setState({popupType: "ReportAll"})
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
            /*                                  {
                                                  property: "checkbox",
                                                  render: datum => (
                                                      <CheckBox key={datum.id}
                                                                checked={this.state.checkedBoxes.includes(datum.id)}
                                                                onChange={e => {
                                                                    if (e.target.checked) {
                                                                        this.state.checkedBoxes.push(datum.id);
                                                                    } else {
                                                                        this.setState({checkedBoxes: this.state.checkedBoxes.filter(item => item !== datum.id)})
                                                                    }
                                                                }}/>
                                                  )
                                              },*/
            /*                                   {
                                                   property: "id",
                                                   header: "ID",
                                                   primary: true
                                               },*/
            {
                property: "count",
                header: <Text size={"small"}>ID</Text>,
                primary: true,
                render: datum => (<Text size={"small"}>{datum.count}</Text> )
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
            /*                                   {
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
                                               },*/
            {
                property: "instances",
                header: <Text size='small'>Instances</Text>,
                render: datum => (
                    <Text size='small'>{datum.instances}</Text>)
            },
            {
                property: "view",
                header: <Text size='small'>View</Text>,
                render: datum => (<View
                    onClick={() => {
                        this.props.history.push({
                            pathname: '/rackelevation',
                            state: {
                                id: datum.id
                            }
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
        if(userutils.isLoggedInUserAdmin()){
            cols.push({
                property: "delete",
                header: <Text size='small'>Delete</Text>,
                render: datum =>
                    this.RackDeleteButton(datum)
            });
        }
        return cols;
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
                    letterStart: this.state.letterStart,
                    letterEnd: this.state.letterEnd,
                    numberStart: this.state.numberStart,
                    numberEnd: this.state.numberEnd
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
                                             justify='start' alignSelf='stretch' flex>
                                            <Box align="center">
                                                <DataTable step={25}
                                                size="medium"
                                                           onMore={() => {
                                                               if (this.startAfter) {
                                                                   rackutils.getRackAt((newStartAfter, newRacks) => {
                                                                       this.startAfter = newStartAfter
                                                                       this.setState({racks: this.state.racks.concat(newRacks)})
                                                                   }, this.startAfter);
                                                               }
                                                           }}
                                                           columns={this.generateColumns()} data={this.state.racks}/>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                                {this.AdminTools()}
                            </Box>
                        </Box>
                    </Box>

                    {/*<Heading margin={"none"}>Racks</Heading>*/}

                    {/* <DataTable step={25}
                               onMore={() => {
                                   if(this.startAfter){
                                       rackutils.getRackAt(this.startAfter, (newStartAfter, newRacks) => {
                                           this.startAfter = newStartAfter
                                           this.setState({racks: this.state.racks.concat(newRacks)})
                                       });
                                   }
                               }}
                               columns={[
                                                                     {
                                                                         property: "checkbox",
                                                                         render: datum => (
                                                                             <CheckBox key={datum.id}
                                                                                       checked={this.state.checkedBoxes.includes(datum.id)}
                                                                                       onChange={e => {
                                                                                           if (e.target.checked) {
                                                                                               this.state.checkedBoxes.push(datum.id);
                                                                                           } else {
                                                                                               this.setState({checkedBoxes: this.state.checkedBoxes.filter(item => item !== datum.id)})
                                                                                           }
                                                                                       }}/>
                                                                         )
                                                                     },*/
                        /*                                   {
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
                                                               header: "Actions",
                                                               render: datum => (
                                                                   <Box direction="row">
                                                                       {this.RackDeleteButton(datum)}
                                                                       <Button icon={<View/>} label="View" onClick={() => {
                                                                           this.props.history.push({
                                                                               pathname: '/rackelevation',
                                                                               state: {
                                                                                   id: datum.id
                                                                               }
                                                                           })
                                                                       }}/>
                                                                       <Button icon={<Analytics/>} label="Report" onClick={() => {
                                                                           this.setState({popupType: 'Report', rackReport: datum.id})
                                                                       }}/>
                                                                   </Box>
                                                               )
                                                           }
                                                       ]} data={this.state.racks}/>*/}
                </Box>
                {popup}
                <ToastsContainer store={ToastsStore}/>
            </Grommet>
        )
    }
}

export default RackView
