// import React, { useState , Component} from 'react'
// import { Add } from 'grommet-icons'
// import { Button, Box, Layer, Text, Grommet, Form, FormField, Heading, TextInput} from 'grommet'
// import * as instutils from '../utils/instanceutils'
// import {ToastsContainer, ToastsStore} from 'react-toasts';


// const AddInstanceButton = (props) => {
//     const [openLayer, setOpenLayer] = React.useState(true);

//     const onOpen = () => setOpenLayer(true);

//     const onClose = () => setOpenLayer(undefined);

//     const [value, setValue] = React.useState('');


//     return (
//     <Grommet>
//         <Box fill align="center" justify="center">
//         <Button
//           icon={<Add/>}
//           label={
//             <Text>
//               <strong>Add Instance</strong>
//             </Text>
//           }
//           onClick={onOpen}
          
//         />
//       </Box>
//       {openLayer && (
//         //   TODO: onClickOutside --> close function, need to validate the inputs/autocomplete and picklist
//         <Layer position="center" onClickOutside={onClose}>
//           <Box height="large" width="medium" overflow="auto" pad="medium">
//           <Heading size="small" margin="none">Add Instance</Heading>
//           {/* <Box pad="xlarge">Form here to add an instance: Use Required Label and Text Input Storyboards</Box> */}
           
//             <Form>
//                 <FormField name="model" label="Model" >
//                     <TextInput
//                     placeholder="Type your model here"
//                     value={value}
//                     onChangae={event => setValue(event.target.value)}
//                     />       
//                 </FormField> 

//                 <FormField name="hostname" label="Hostname"  >
//                     <TextInput
//                     placeholder="Type your hostname here"
//                     value={value}
//                     onChange={event => setValue(event.target.value)}
//                     />        
//                 </FormField>

//                 {/* <FormField name="rack" label="Rack" />
//                 <FormField name="rackU" label="RackU" />
//                 <FormField name="owner" label="Owner" />
//                 <FormField name="comment" label="Comment" /> */}

//                 <Button 
//                 type="submit" 
//                 primary label="Submit" 
//                 onSubmit={instutils.addInstance( value, "bitch", "RackHC", "rackUHC", "ownerHC", "comment", status => {
//                       if (status) {
//                         this.setState({
                            
                            
//                         })
//                     } else {
//                         ToastsStore.error('Error adding instance.');
//                     }
                
//                  } )} />
//             </Form >

//           </Box>
//         </Layer>
//       )}
  

//     </Grommet>
      

//     )
//     }


// export default AddInstanceButton


