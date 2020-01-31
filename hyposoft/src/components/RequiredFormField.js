
import React from "react";

import { grommet, Box, FormField, Form, Text, Button, Grommet } from "grommet";

const FormFieldLabel = props => {
    const { required, label, ...rest } = props;
    return (
      <FormField
        label={
          required ? (
            <Box direction="row">
              <Text>{label}</Text>
              <Text color="status-critical">*</Text>
            </Box>
          ) : (
            label
          )
        }
        required={required}
        {...rest}
      />
    );
  };
  
  export default FormFieldLabel
