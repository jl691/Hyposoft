import React from "react";
import { Box, Button, Grommet, Heading, Layer, Text } from "grommet";
import { Checkmark, Close, Trash } from "grommet-icons";
import { ToastsContainer, ToastsStore } from "react-toasts";
import * as changeplanutils from "../utils/changeplanutils";
import * as changeplanconflictutils from "../utils/changeplanconflictutils";

class ExecuteChangePlanForm extends React.Component {

    render() {
        return (
            <React.Fragment>
                <Layer onEsc={() => this.props.cancelPopup(true)}
                    onClickOutside={() => this.props.cancelPopup(true)}>
                    <Box pad="medium" align="center">
                        <Heading level="3" margin="none">Execute Change Plan</Heading>
                        <Text>Are you sure you want to execute change plan {this.props.name}?
                            This can't be reversed.</Text>
                        <Box direction="row">
                            <Button label="Execute" icon={<Checkmark />} onClick={() => {
                                console.log(this.props.id)
                                ToastsStore.info('Please wait...', 5000);
                                changeplanconflictutils.changePlanHasConflicts(this.props.id, hasConflicts => {
                                  
                                    // console.log(hasConflicts.length)
                                     console.log(hasConflicts)
                                    //if there are conflicts, then hasConflicts.length with be a number
                                    if (hasConflicts.length) {
                                        console.log("please end me now")
                                        ToastsStore.error("Error executing change plan - there are conflicts.")

                                    } else {
                                        // console.log("there were no conflcits in the change plan--executing")
                                        // console.log(hasConflicts)
                                        // console.log(hasConflicts.length)
                                        changeplanutils.executeChangePlan(this.props.id, result => {
                                            changeplanconflictutils.changePlanHasConflicts(this.props.id, hasConflicts1 => {

                                                if (result) {
                                                    this.props.successfulExecution();
                                                }
                                                else if (hasConflicts1.length) {
                                                    ToastsStore.error("Error executing change plan - there are conflicts.")

                                                } else {
                                                    ToastsStore.error("Error executing change plan - please try again later.")
                                                }
                                            })
                                        })

                                    }


                                })

                            }} />
                            <Button label="Cancel" icon={<Close />}
                                onClick={() => this.props.cancelPopup(true)} />
                        </Box>
                    </Box>
                </Layer>
                <ToastsContainer store={ToastsStore} />
            </React.Fragment>
        )
    }
}

export default ExecuteChangePlanForm