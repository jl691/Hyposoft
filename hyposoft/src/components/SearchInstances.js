import React, { Component } from 'react'
import { Form, FormField, Button, TextInput } from 'grommet'


export default class SearchInstances extends Component {
    render() {
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
