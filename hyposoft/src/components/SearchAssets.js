import React, { Component } from 'react'
import { Form, FormField, Button, TextInput, Box } from 'grommet'
import * as userutils from "../utils/userutils";
import { Redirect } from "react-router-dom";

const algoliasearch = require('algoliasearch')
const client = algoliasearch('V7ZYWMPYPA', '89a91cdfab76a8541fe5d2da46765377')
const index = client.initIndex('models')

export default class SearchAssets extends Component {


    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }

        return (
            <Box width="200px" gap="small">
                <Form margin='small'>
                    <FormField name="Search Assets">
                        <TextInput placeholder="Type here" size="xsmall"/>
                    </FormField>
                    <Button type="submit" primary label="Submit" />

                </Form>
            </Box>


        )
    }
}
