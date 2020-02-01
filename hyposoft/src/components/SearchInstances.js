import React, { Component } from 'react'
import { Form, FormField, Button, TextInput } from 'grommet'
import * as userutils from "../utils/userutils";
import {Redirect} from "react-router-dom";


export default class SearchInstances extends Component {
    render() {
        if (!userutils.isUserLoggedIn()) {
            return <Redirect to='/' />
        }

        return (
          
            <Form margin = 'small'> 
                <FormField label="Search Instances">
                    <TextInput placeholder="Type here" />
                </FormField>
                <Button type="submit" primary label="Submit" />
               
            </Form>

            
        )
    }
}
