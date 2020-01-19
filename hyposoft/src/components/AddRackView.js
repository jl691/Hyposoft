import React from "react";
import theme from "../theme";
import {Accordion, AccordionPanel, Box, Button, Form, Grommet, Text, TextInput} from "grommet";
import * as rackutils from "../utils/rackutils";
import {ToastsContainer, ToastsStore} from 'react-toasts';

class AddRackView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            letter: "",
            number: "",
            height: ""
        }

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleSubmit(event){
        //TODO: FORM VALIDATION
        rackutils.addSingleRack(this.state.letter, this.state.number, this.state.height, status => {
            if(status){
                ToastsStore.success('Successfully added rack!');
                this.setState({
                    letter: "",
                    number: "",
                    height: ""
                })
            } else {
                ToastsStore.error('Error adding rack.');
            }
        });
    }

    handleChange(event){
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    render(){
        return (
            <Grommet theme={theme}>
                <Accordion>
                    <AccordionPanel label="Single rack">
                        <Box pad="medium" background="light-2">
                            <Form onSubmit={this.handleSubmit}>
                                <Text>Row</Text>
                                <TextInput name="letter" placeholder="eg. A, B, C" onChange={this.handleChange} value={this.state.letter} />
                                <Text>Number</Text>
                                <TextInput name="number" placeholder="eg. 6, 12, 42" onChange={this.handleChange} value={this.state.number} />
                                <Text>Height</Text>
                                <TextInput name="height" placeholder="42" onChange={this.handleChange} value={this.state.height} />
                                <Button type="submit" primary label="Submit" />
                            </Form>
                        </Box>
                    </AccordionPanel>
                    <AccordionPanel label="Range of racks">
                        <Box pad="medium" background="light-2">
                            <Form>
                                <Text>Row range</Text>
                                <Box direction="row">
                                    <TextInput placeholder="eg. A, B, C" /> to <TextInput placeholder="eg. D, E, F" />
                                </Box>
                                <Text>Number range</Text>
                                <Box direction="row">
                                    <TextInput placeholder="eg. 6, 12, 22" /> to <TextInput placeholder="eg. 24, 36, 48" />
                                </Box>
                                <Text>Height of racks</Text>
                                <TextInput placeholder="42" />
                                <Button type="submit" primary label="Submit" />
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