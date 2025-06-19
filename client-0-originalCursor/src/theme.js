import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  components: {
    // Base TextField component
    MuiTextField: {
      defaultProps: {
        InputLabelProps: {
          shrink: true
        }
      }
    },
    // Autocomplete uses TextField internally
    MuiAutocomplete: {
      defaultProps: {
        InputLabelProps: {
          shrink: true
        }
      }
    },
    // DateTimePicker's TextField
    MuiDateTimePicker: {
      defaultProps: {
        InputLabelProps: {
          shrink: true
        }
      }
    },
    // For any other components that might use InputLabel
    MuiInputLabel: {
      defaultProps: {
        shrink: true
      }
    }
  }
});

export default theme; 