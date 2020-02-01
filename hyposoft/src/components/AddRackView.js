import React from "react";
import theme from "../theme";
import {Accordion, AccordionPanel, Box, Button, Form, Grommet, Text, TextInput} from "grommet";
import * as rackutils from "../utils/rackutils";
import * as formvalidationutils from "../utils/formvalidationutils";
import {ToastsContainer, ToastsStore} from 'react-toasts';
import * as userutils from "../utils/userutils";
import {Redirect} from "react-router-dom";

class AddRackView extends React.Component {

    //TODO: LESS JANKY WAY TO DO THIS? NESTED STATES SUCK THO
    constructor(props) {
        super(props);
        this.state = {
            singleLetter: "",
            singleNumber: "",
            singleHeight: "",
            rangeLetterStart: "",
            rangeLetterEnd: "",
            rangeNumberStart: "",
            rangeNumberEnd: "",
            rangeHeight: "",
        }

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleSubmit(event) {
        if (event.target.name === "single") {
            if(!this.state.singleLetter || !this.state.singleHeight || !this.state.singleNumber){
                //invalid length
                ToastsStore.error('Please fill out all fields.');
            } else if (!parseInt(this.state.singleHeight) || !parseInt(this.state.singleNumber)){
                //invalid numbrt
                ToastsStore.error('Invalid number or height.');
            } else if (!formvalidationutils.checkPositive(this.state.singleNumber) || !formvalidationutils.checkPositive(this.state.singleHeight)){
                //non positive number
                ToastsStore.error('Number or height most be positive.');
            } else if (!formvalidationutils.checkUppercaseLetter(this.state.singleLetter)) {
                //non an uppercase letter
                ToastsStore.error('Row must be a single uppercase letter.');
            } else {
                //all good
                rackutils.addSingleRack(this.state.singleLetter, parseInt(this.state.singleNumber), parseInt(this.state.singleHeight), status => {
                    if (status) {
                        ToastsStore.success('Successfully added rack!');
                        this.props.parentCallback(true);
                    } else {
                        ToastsStore.error('Error adding rack.');
                    }
                });
            }
        } else if (event.target.name === "range") {
            if(!this.state.rangeLetterStart || !this.state.rangeLetterEnd || !this.state.rangeNumberStart || !this.state.rangeNumberEnd || !this.state.rangeHeight) {
                //invalid length
                ToastsStore.error('Please fill out all fields.');
            } else if (!parseInt(this.state.rangeNumberStart) || !parseInt(this.state.rangeNumberEnd) || !parseInt(this.state.rangeHeight)){
                //invalid numbrt
                ToastsStore.error('Invalid number or height.');
            } else if (!formvalidationutils.checkPositive(this.state.rangeNumberStart) || !formvalidationutils.checkPositive(this.state.rangeNumberEnd) || !formvalidationutils.checkPositive(this.state.rangeHeight)){
                //non positive number
                ToastsStore.error('Numbers or height most be positive.');
            } else if(!formvalidationutils.checkUppercaseLetter(this.state.rangeLetterStart) || !formvalidationutils.checkUppercaseLetter(this.state.rangeLetterEnd)){
                //non uppercase letter
                ToastsStore.error('Rows must be a single uppercase letter.');
            } else if (!formvalidationutils.checkNumberOrder(this.state.rangeNumberStart, this.state.rangeNumberEnd) || !formvalidationutils.checkLetterOrder(this.state.rangeLetterStart, this.state.rangeLetterEnd)) {
                //ranges incorrect
                ToastsStore.error('The starting row or number must come before the ending row or number.');
            } else {
                rackutils.addRackRange(this.state.rangeLetterStart, this.state.rangeLetterEnd, parseInt(this.state.rangeNumberStart), parseInt(this.state.rangeNumberEnd), parseInt(this.state.rangeHeight), status => {
                    if (status) {
                        ToastsStore.success('Successfully added racks!');
                        this.props.parentCallback(true);
                    } else {
                        ToastsStore.error('Error adding racks.');
                    }
                })
            }
        } else {
            ToastsStore.error('Error adding rack!');
        }
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }

        return (
            <Grommet theme={theme}>
                <Accordion>
                    <AccordionPanel label="Single rack">
                        <Box pad="medium" background="light-2">
                            <Form onSubmit={this.handleSubmit} name="single">
                                <Text>Row</Text>
                                <TextInput name="singleLetter" placeholder="eg. A, B, C" onChange={this.handleChange}
                                           value={this.state.singleLetter}/>
                                <Text>Number</Text>
                                <TextInput name="singleNumber" placeholder="eg. 6, 12, 42" onChange={this.handleChange}
                                           value={this.state.singleNumber}/>
                                <Text>Height</Text>
                                <TextInput name="singleHeight" placeholder="42" onChange={this.handleChange}
                                           value={this.state.singleHeight}/>
                                <Button type="submit" primary label="Submit"/>
                            </Form>
                        </Box>
                    </AccordionPanel>
                    <AccordionPanel label="Range of racks">
                        <Box pad="medium" background="light-2">
                            <Form onSubmit={this.handleSubmit} name="range">
                                <Text>Row range</Text>
                                <Box direction="row">
                                    <TextInput name="rangeLetterStart" placeholder="eg. A, B, C" onChange={this.handleChange} />
                                    to
                                    <TextInput name="rangeLetterEnd" placeholder="eg. D, E, F" onChange={this.handleChange} />
                                </Box>
                                <Text>Number range</Text>
                                <Box direction="row">
                                    <TextInput name="rangeNumberStart" placeholder="eg. 6, 12, 22" onChange={this.handleChange}/>
                                    to
                                    <TextInput name="rangeNumberEnd" placeholder="eg. 24, 36, 48" onChange={this.handleChange} />
                                </Box>
                                <Text>Height of racks</Text>
                                <TextInput name="rangeHeight" placeholder="42" onChange={this.handleChange}/>
                                <Button type="submit" primary label="Submit"/>
                            </Form>
                        </Box>
                    </AccordionPanel>
                </Accordion>
                <ToastsContainer store={ToastsStore}/>
            </Grommet>
        )
    }

}

export default AddRackView