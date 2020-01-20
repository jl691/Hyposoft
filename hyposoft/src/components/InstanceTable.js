import React, { Component } from 'react'
import { Add } from 'grommet-icons'
import { DataTable, Box, Text, Button, Layer, Grommet, Form, FormField, Heading, TextInput } from 'grommet'
import InstanceRow from './InstanceRow';
import * as instutils from '../utils/instanceutils'
import { ToastsContainer, ToastsStore } from 'react-toasts';

//TODO: refactor for components

export default class InstanceTable extends Component {
    constructor(props) {
        super(props);
        this.state = {
            instances: [
                // initialize everything to blanks
            ]

        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        instutils.getInstance(instancesdb => {
            this.setState({ instances: instancesdb })
        })

    }

    handleChange(event) {
        this.setState({ value: event.target.value });
    }

    handleSubmit(event) {
        alert('A name was submitted: ' + this.state.value);
        event.preventDefault();
    }

    render() {
        const { popupType } = this.state;
        let popup;
       if (popupType === 'Add') {
            popup = (
                <Layer onEsc={() => this.setState({ popupType: undefined })}
                    onClickOutside={() => this.setState({ popupType: undefined })}>
                    <AddRackView />
                    <Button label="Cancel" icon={<Close />}
                        onClick={() => this.setState({ popupType: "" })} />
                </Layer>
            )
        }


        // render() {

        //     const [openLayer, setOpenLayer] = React.useState(true);

        //     const onOpen = () => setOpenLayer(true);

        //     const onClose = () => setOpenLayer(undefined);

        //BUTTON, LAYER, FORM TO ADD INSTANCE =================================

        //   <Grommet>
        //   <Box fill align="center" justify="center">
        //       <Button
        //           icon={<Add />}
        //           label={
        //               <Text>
        //                   <strong>Add Instance</strong>
        //               </Text>
        //           }
        //           onClick={onOpen}

        //       />
        //   </Box>
        //   {openLayer && (
        //       // TODO: onClickOutside --> close function, need to validate the inputs/autocomplete and picklist
        //       <Layer position="center" onClickOutside={onClose}>
        //           <Box height="large" width="medium" overflow="auto" pad="medium">
        //               <Heading size="small" margin="none">Add Instance</Heading>

        //               <Form>
        //                   <FormField name="model" label="Model" >
        //                       <TextInput
        //                           placeholder="Type your model here"

        //                       />
        //                   </FormField>

        //                   <FormField name="hostname" label="Hostname"  >
        //                       <TextInput
        //                           placeholder="Type your hostname here"

        //                       />
        //                   </FormField>

        //                   <FormField name="rack" label="Rack" />
        //                   <FormField name="rackU" label="RackU" />
        //                   <FormField name="owner" label="Owner" />
        //                   <FormField name="comment" label="Comment" />

        //                   <Button
        //                       type="submit"
        //                       primary label="Submit"
        //                       // onSubmit={instutils.addInstance(value, "bitch", "RackHC", "rackUHC", "ownerHC", "comment", status => {
        //                       //     if (status) {
        //                       //         this.setState({


        //                       //         })
        //                       //     } else {
        //                       //         ToastsStore.error('Error adding instance.');
        //                       //     }

        //                       // })} 
        //                       />
        //               </Form >

        //           </Box>
        //       </Layer>
        //   )}
        //   </Grommet>

        return (

            // LIST OF INSTANCES =============================================== 
            <DataTable
                columns={[
                    {
                        property: 'doc_id',
                        header: <Text>ID</Text>,
                        primary: true,
                    },
                    {
                        property: 'model',
                        header: <Text>Model</Text>,

                    },
                    {
                        property: 'hostname',
                        header: <Text>Hostname</Text>,

                    },
                    {
                        property: 'rack',
                        header: <Text>Rack</Text>,

                    },
                    {
                        property: 'rackU',
                        header: <Text>RackU</Text>,

                    },
                    {
                        property: 'owner',
                        header: <Text>Owner</Text>,

                    },
                    {
                        property: 'comment',
                        header: <Text>Comment</Text>,

                    },
                ]}
                data={this.state.instances}

            />

        );

    }
}



