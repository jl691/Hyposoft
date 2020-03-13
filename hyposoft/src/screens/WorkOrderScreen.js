import React from "react";
import theme from "../theme";
import {Box, Button, Grommet, Heading, Table, TableBody, TableCell, TableHeader, TableRow, Text} from "grommet";
import AppBar from "../components/AppBar";
import BackButton from "../components/BackButton";
import UserMenu from "../components/UserMenu";
import {ToastsContainer, ToastsStore} from "react-toasts";
import * as changeplanutils from "../utils/changeplanutils";

class WorkOrderScreen extends React.Component {

    sortedSteps;

    constructor(props) {
        super(props);
        this.state = {
            stepsLoaded: false
        }
    }

    componentDidMount() {
        changeplanutils.generateWorkOrder(this.props.match.params.changePlanID, result => {
            console.log(result)
            if(result){
                this.sortedSteps = new Map([...result.entries()].sort());
                console.log(this.sortedSteps)
                this.setState({
                    stepsLoaded: true
                })
            }
        })
    }

    generateStepTable(){
        if(!this.state.stepsLoaded){
            return (
                <Text>Please wait...</Text>
            )
        } else {
            console.log(Object.keys(this.sortedSteps))
            return [...this.sortedSteps.keys()].map(key => (
                <TableRow>
                    <TableCell scope={"row"}>
                        {key}
                    </TableCell>
                    <TableCell>
                        <ol>
                            {this.generateListFromStepsArray(this.sortedSteps.get(key))}
                        </ol>
                    </TableCell>
                </TableRow>
            ))
        }
    }

    generateListFromStepsArray(steps){
        console.log(steps)
        return steps.map(step => (
            <li>{step}</li>
        ))
    }

    render() {
        return (
            <React.Fragment>
                <Grommet theme={theme} full className='fade'>
                    <Box fill background='light-2'>
                        <AppBar>
                            <BackButton alignSelf='start' this={this}/>
                            <Heading alignSelf='center' level='4' margin={{
                                top: 'none', bottom: 'none', left: 'xlarge', right: 'none'
                            }}>Work Order</Heading>
                            <UserMenu alignSelf='end' this={this}/>
                        </AppBar>
                        <Box
                            align='center'
                            direction='row'
                            margin={{left: 'medium', right: 'medium'}}
                            justify='center'>
                            <Box style={{
                                borderRadius: 10,
                                borderColor: '#EDEDED'
                            }}
                                 direction='row'
                                 background='#FFFFFF'
                                 width={'large'}
                                 margin={{top: 'medium', left: 'medium', right: 'medium'}}
                                 pad='small'>
                                <Box flex margin={{left: 'medium', top: 'small', bottom: 'small', right: 'medium'}}
                                     direction='column' justify='start'>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableCell scope="col" border="bottom">
                                                    <strong>Change Plan Step #</strong>
                                                </TableCell>
                                                <TableCell scope="col" border="bottom">
                                                    <strong>Instructions</strong>
                                                </TableCell>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {this.generateStepTable()}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </Box>
                        </Box>
                        <ToastsContainer store={ToastsStore}/>
                    </Box>
                </Grommet>
            </React.Fragment>
        )
    }

}

export default WorkOrderScreen