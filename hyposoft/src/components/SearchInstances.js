import React, { Component } from 'react'
import { Form, FormField, Button, TextInput, Box } from 'grommet'
import * as userutils from "../utils/userutils";
import { Redirect } from "react-router-dom";

export default class SearchInstances extends Component {


    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }

        return (
            <Box width="200px" gap="small">
                <Form margin='small' onSubmit={() => this.props.parent.handleSearch()}>
                    <FormField name="Search Instances">
                        <TextInput placeholder="Type here" size="xsmall" value={this.props.parent.state.searchQuery} onChange={e=>{
                            const value = e.target.value
                            this.props.parent.setState(oldState => ({
                                ...oldState, searchQuery: value
                            }))
                        }}/>
                    </FormField>
                    <Button type="submit" primary label="Submit" />

                </Form>
            </Box>


        )
    }
}
