import React from 'react';
import { TextField } from '@mui/material';

/**
 * @param {'default'|'error'|'success'} status — validation state
 */
export default function HealthInput({
  status = 'default',
  helperText,
  sx,
  InputProps,
  FormHelperTextProps,
  ...props
}) {
  const isError = status === 'error';
  const isSuccess = status === 'success';

  return (
    <TextField
      {...props}
      fullWidth
      variant="outlined"
      size="medium"
      error={isError}
      helperText={helperText}
      InputProps={InputProps}
      FormHelperTextProps={FormHelperTextProps}
      sx={{
        '& .MuiFormHelperText-root': {
          minHeight: 20,
          mt: 0.75,
          ...(isSuccess && {
            color: 'success.main',
          }),
        },
        ...sx,
      }}
    />
  );
}
