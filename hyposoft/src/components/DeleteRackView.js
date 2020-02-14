import React from "react";
import theme from "../theme";
import {Box, Button, Form, Grommet, Heading, Layer, Text, TextInput} from "grommet";
import {ToastsContainer, ToastsStore} from "react-toasts";
import * as rackutils from "../utils/rackutils";
import {Close, Trash} from "grommet-icons";
import * as formvalidationutils from "../utils/formvalidationutils";
import * as userutils from "../utils/userutils";
import {Redirect} from "react-router-dom";

class DeleteRackView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rangeLetterStart: "",
            rangeLetterEnd: "",
            rangeNumberStart: "",
            rangeNumberEnd: "",
            confirm: false
        };

        this.handleChange = this.handleChange.bind(this);
        this.deleteRacks = this.deleteRacks.bind(this);
        this.deleteRackValidation = this.deleteRackValidation.bind(this);
    }

    deleteRacks() {
        ToastsStore.info('Please wait...');
        rackutils.deleteRackRange(this.state.rangeLetterStart, this.state.rangeLetterEnd, this.state.rangeNumberStart, this.state.rangeNumberEnd, this.props.datacenter, (status, skipped) => {
            if (status) {
                console.log("not impossible")
                ToastsStore.success('Successfully deleted racks!');
                if(skipped.length){
                    ToastsStore.info('Skipped the following racks because they contained instances or did not exist: ' + skipped.join(', '));
                }
                this.props.parentCallback(true);
            } else {
                console.log("impossible")
                ToastsStore.error('Error deleting racks. Ensure none of them contain assets.');
            }
        })
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    deleteRackValidation(){
        if(!this.state.rangeLetterStart || !this.state.rangeLetterEnd || !this.state.rangeNumberStart || !this.state.rangeNumberEnd) {
            //invalid length
            ToastsStore.error('Please fill out all fields.');
        } else if (!parseInt(this.state.rangeNumberStart) || !parseInt(this.state.rangeNumberEnd)){
            //invalid numbrt
            ToastsStore.error('Invalid number.');
        } else if (!formvalidationutils.checkPositive(this.state.rangeNumberStart) || !formvalidationutils.checkPositive(this.state.rangeNumberEnd)){
            //non positive number
            ToastsStore.error('Numbers most be positive.');
        } else if(!formvalidationutils.checkUppercaseLetter(this.state.rangeLetterStart) || !formvalidationutils.checkUppercaseLetter(this.state.rangeLetterEnd)){
            //non uppercase letter
            ToastsStore.error('Rows must be a single uppercase letter.');
        } else if (!formvalidationutils.checkNumberOrder(this.state.rangeNumberStart, this.state.rangeNumberEnd) || !formvalidationutils.checkLetterOrder(this.state.rangeLetterStart, this.state.rangeLetterEnd)) {
            //ranges incorrect
            ToastsStore.error('The starting row or number must come before the ending row or number.');
        } else {
            this.setState({confirm: true});
        }
    }

    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }

        const {confirm} = this.state;
        let confirmPopup;
        if(confirm){
            confirmPopup = (confirmPopup = (
                <Layer onEsc={() => this.setState({confirm: false})}
                       onClickOutside={() => this.setState({confirm: false})}>
                    <Box pad="medium" align="center">
                        <Heading level="3" margin="none">Confirm deletion</Heading>
                        <Text>Are you sure you want to delete racks {this.state.rangeLetterStart}{this.state.rangeNumberStart} - {this.state.rangeLetterEnd}{this.state.rangeNumberEnd}? This can't be reversed.</Text>
                        <Box direction="row">
                            <Button label="Delete" icon={<Trash/>} onClick={this.deleteRacks}/>
                            <Button label="Cancel" icon={<Close/>}
                                    onClick={() => this.setState({confirm: false})}/>
                        </Box>
                    </Box>
                </Layer>
            ))
        }

        return (
            <Grommet theme={theme}>
                <Box pad="medium">
                    <Form onSubmit={this.deleteRackValidation} name="range">
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
                        <Button type="submit" primary label="Submit"/>
                    </Form>
                </Box>
                {confirmPopup}
                <ToastsContainer store={ToastsStore}/>
            </Grommet>
        )
    }
}

export default DeleteRackView