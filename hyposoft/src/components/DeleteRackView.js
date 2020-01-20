import React from "react";
import theme from "../theme";
import {Box, Button, Form, Grommet, Heading, Layer, Text, TextInput} from "grommet";
import {ToastsContainer, ToastsStore} from "react-toasts";
import * as rackutils from "../utils/rackutils";
import {Close, Trash} from "grommet-icons";

class DeleteRackView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rangeLetterStart: "",
            rangeLetterEnd: "",
            rangeNumberStart: "",
            rangeNumberEnd: "",
            confirm: false
        }

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleSubmit(event) {
        rackutils.deleteRackRange(this.state.rangeLetterStart, this.state.rangeLetterEnd, this.state.rangeNumberStart, this.state.rangeNumberEnd, status => {
            if (status) {
                ToastsStore.success('Successfully deleted racks!');
                this.setState({
                    rangeLetterStart: "",
                    rangeLetterEnd: "",
                    rangeNumberStart: "",
                    rangeNumberEnd: "",
                    confirm: false
                })
            } else {
                ToastsStore.error('Error deleting racks. Ensure none of them contain instances.');
            }
        })
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
    }



    render() {
        const {confirm} = this.state;
        let confirmPopup;
        if(confirm){
            confirmPopup = (confirmPopup = (
                <Layer onEsc={() => this.setState({confirm: false})}
                       onClickOutside={() => this.setState({confirm: false})}>
                    <Box pad="medium" align="center">
                        <Heading level="3" margin="none">Confirm deletion</Heading>
                        <Text>Are you sure you want to delete racks {this.state.rangeLetterStart} - {this.state.rangeLetterEnd}, {this.state.rangeNumberStart} - {this.state.rangeNumberEnd}? This can't be reversed.</Text>
                        <Box direction="row">
                            <Button label="Delete" icon={<Trash/>} onClick={this.handleSubmit}/>
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
                    <Form onSubmit={() => this.setState({confirm: true})} name="range">
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