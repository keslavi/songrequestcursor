
import React from "react";
import { createTheme } from "@mui/material/styles";
//import { blue, red, white } from "@mui/material/colors";

import { ThemeProvider as MUIThemeProvider } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
//import { green } from "@mui/material/colors";
//https://mui.com/material-ui/customization/theming/
//https://mui.com/material-ui/customization/theme-components/

import { AccordionSummary } from '@mui/material';
import { styled } from "@mui/system";
import { Padding } from "@mui/icons-material";

/*************************************************
 
!IMPORTANT: rowHeader is styled in /src/components/grid/row.jsx
 
***************************************************/

export const ThemeProvider = (props) => {
  return (
    <>
      <CssBaseline>
        <MUIThemeProvider theme={theme}>{props.children}</MUIThemeProvider>
      </CssBaseline>
    </>
  );
};

export default ThemeProvider;

export const color = {
  primary: {
    blue: "#022366",
    red: "#e31836",
    white: "#FFFFFF",
    header: "#0241ce", //blue600
    backgroundColor: "#fff",
    black: "#000000",
    gray: "#757575",
    grey: "#757575",
    disabled: "#EEEEEE",
  },
  secondary: {
    blue300: "#CEE0EA",
    blue600: "#0241ce",
    blue700: "#2741A3",
    blueShade: "#e6e9f1",
    almostBlack: "#504f54",
    grey500: "#EEEbe8",//"#E3ded8",
    almostGray: "#7A7878",
    almostGrey: "#7A7878",
    black: "#000000",
    shaded: "#F8F8F8",
  },
  cobe1: {
    blue: "#0073cf",
    black: "#333333",
    white: "#FFFFFF",
    gray: "#9d8e80", //border color on hover of input fields
    grey: "#9d8e80",
    red: "#d32f2f",
    lightGray: '#d1c9c0',
  }
};

const init = createTheme();

//TIP: use ctrl-k + ctrl-0 to collapse all, then expand
export const theme = createTheme({
  //TODO: finish all the custom stuff as it comes up
  typography: {
    fontFamily: "Connections, Calibri, 'sans-serif'",
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.5,
    color: color.cobe1.black,
  },
  palette: {
    primary: {
      main: color.primary.blue,
    },
    secondary: {
      main: color.primary.red,
    },
    text: {
      disabled: "black",//color.secondary.almostGrey
    },
  },
  zIndex: {
    appBar: 4000,
    modal: 4001,
  },
  root: {
    display: "flex",
  },
  paper: {
    marginRight: init.spacing(2),
  },
  // uncomment this if we want to use bofa's default font through out
  // all mui components.
  // typography: {
  //   allVariants: {
  //     fontFamily: [
  //       'Connections', 'Arial', 'Calibri', 'Helvetica', 'sans-serif'
  //     ].join(','),
  //     textTransform: 'none',
  //   }
  // },
  components: {
    //TODO: figure out how latest MUI properties work
    MuiGrid: {
      styleOverrides: {
        root: {
          '>.MuiGrid-item': {
            // paddingLeft: "0px",
          },
          '>.MuiPaper-root': {
            paddingLeft: "0px",
          },
          '>.MuiFormControl-root': {
            paddingLeft: "16px",
          }
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          position: "relative",
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          border: `1px solid ${color.cobe1.grey}`,
          padding: "15px",
          fontSize: "14px",
          color: color.cobe1.black,
          '& .MuiTypography-h5': {
            fontSize: "1.2rem",
          },
        }
      },

    },
    MuiDialogContentText: {
      styleOverrides: {
        root: {
          //marginLeft: "5px",
          //fontSize:'20px', //this works, but marginLeft doesn't
        }
      }
    },
    MuiAppBar: {},
    MuiAlert: {
      styleOverrides: {
        root: {
          "&.MuiAlert-colorError": {
            "& .MuiSvgIcon-root": {
              color: color.cobe1.red,
            },
          },
          '& .MuiTypography-root': {
            paddingLeft: "0px",
          },
          svg: {
            color: color.cobe1.black,
          }
        },
      },
    },
    MuiAccordion: {
    },
    // MuiSvgIcon: {
    //   styleOverrides: {
    //     root: {
    //     },
    //   }
    // },

    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          backgroundColor: color.primary.white,
          //color: color.primary.blue,
          // fontSize: "1.2rem",
          // fontWeight: "500",
          // padding: "2px",
          // paddingLeft: "0.5rem",
          border: `1px solid ${color.secondary.grey500}`,
          // minHeight: 32,
          // maxHeight: 32,
        },
      },
      variants: [
        {
          props: { variant: "noborder" },
          style: {
            border: `1px solid ${color.primary.white}`
          }
        }
      ]
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          backgroundColor: color.primary.white,
          color: color.primary.blue,
          fontSize: "1.2rem",
          fontWeight: "500",
          padding: "2px",
          paddingLeft: "0.5rem",
          border: `1px solid ${color.secondary.grey500}`,
          minHeight: 32,
          margin: "0px",
          '& .MuiAccordionSummary-expandIconWrapper': {
            alignSelf: "start",
            marginTop: "16px",
          },
          '& .Mui-expanded': {
            alignSelf: "start",
            marginTop: "24px",
          },
          '& .MuiSvgIcon-root': {
            color: color.cobe1.grey,
          },
        },
      }, variants: [
        {
          props: { variant: "noborder" },
          style: {
            border: `1px solid ${color.primary.white}`
          }
        }
      ]
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          "& input[type='hidden']+fieldset": {
            display: "none",
          },
        },
      },
      variants: [
        {
          props: { variant: "noborder" },
          style: {
            border: `1px solid ${color.primary.white}`
          }
        }
      ]
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          fontSize: "0rem",
          minWidth: "20px",
          '&.MuiButton-root': {
            svg: {
              color: color.cobe1.white,
            },
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          width: "20px",
          height: "20px",
          color: color.cobe1.lightGray,
          '&.Mui-checked': {
            color: color.cobe1.blue,
          },
          '&:hover': {
            color: color.cobe1.blue,
          },
        },
      },
    },
    MuiListItem: {
      // root:{
      //   paddingTop:'2.5px',
      //   paddingBottom: '2.5px',
      //   color:color.primary.blue,
      // }
    },
    //   MuiButton:{
    //     styleOverrides: {
    //       root: {
    //         backgroundColor: color.secondary.blueShade,
    //         color: color.primary.blue,
    //       }
    //   }
    // },
    MuiIconButton: {},
    MuiFormControl: {
      // root: { marginTop: "10px", marginBottom: "10px" },
      styleOverrides: {
        root: {
          display: "flex",
          position: "relative",
          '.MuiFormLabel-root': {
            position: "relative",
            transform: "none",
            fontFamily: "Connections, Calibri, sans-serif",
            color: "#333",
            fontSize: "14px",
          },
          '.MuiInputBase-input': {
            padding: "8.5px 5px 8.5px 5px",
          },
          '.MuiOutlinedInput-notchedOutline': {
            top: '0px',
          },
          legend: {
            display: "none",
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          margin: "0px",
          display: "flex",
          alignItems: "center",
          justifyContent: "start",
          width: "fit-content",
          input: {
            position: "relative",
          },
          '.MuiTypography-root': {
            paddingLeft: "10px",
          },
          '.PrivateSwitchBase-input': {
            height: "20px",
            width: "20px",
          },
          '.MuiSvgIcon-root': {

          },
        },
      },
      variants: [
        {
          props: { variant: "h1" },
          style: {
            fontSize: "1.2rem",
            color: color.primary.blue,
            fontWeight: 500,
          }
        }
      ]
    },
    PrivateSwitchBase: {
      styleOverrides: {
        input: {
          height: "20px",
          width: "20px",
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          paddingLeft: "10px",
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          //due to info icon, had to make this blue
          svg: {
            // color: color.cobe1.blue,//.gray,
          },
          '&.MuiAutocomplete-hasClearIcon': {
            '&.MuiAutocomplete-hasPopupIcon': {
              '.MuiOutlinedInput-root': {
                paddingRight: "0px",
              }
            }
          }
        },
        inputRoot: {
          padding: "0px",
          '.MuiInputBase-input': {
            padding: "8.5px 35px 8.5px 5px",
            '&:hover': {
              paddingRight: "60px",
            },
            '&:focus': {
              paddingRight: "60px",
            }
          },
        },
        listbox: {
          borderTop: "1px solid #d1c9c0",
          borderRight: "1px solid #d1c9c0",
          borderBottom: "1px solid #d1c9c0",
          borderLeft: "1px solid #d1c9c0",
          padding: "0px",
          background: color.cobe1.white,
          '.MuiAutocomplete-option.Mui-focused': {
            color: color.cobe1.white,
            backgroundColor: color.cobe1.blue,
          },
          '.MuiAutocomplete-option[aria-selected="true"].Mui-focused': {
            backgroundColor: color.cobe1.blue,
            color: color.cobe1.white,
          },
        },
      },
    },
    MuiInputLabel: {
      // root: {
      //   color: color.secondary.blue700,
      // },
      styleOverrides: {
        root: {
          color: color.cobe1.black,
          zIndex: 0,
        },
      }
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          padding: '0px',
          width: "20px",
          height: "20px",
          color: color.cobe1.lightGray,
          '&.Mui-checked': {
            color: color.cobe1.blue,
          },
          '&:hover': {
            color: color.cobe1.blue,
          },
        }
      }
    },
    MuiTextField: {
      // root: {
      //   marginTop: "10px",
      //   marginBottom: "10px",
      // },
      styleOverrides: {
        root: {
          alignSelf: "flex-start",
        }
      },
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: {
          margin: "5px",
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: color.cobe1.black,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: "0px",
          display: "flex",
          padding: "0px",
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            border: `1px solid ${color.cobe1.blue}`,
          },
        },
      },
    },
    MuiDrawer: {
      // paper: {
      //   backgroundColor: color.secondary.almostGrey;
      // }
    },
    MuiToolbar: {
      //   dense: {
      //     minHeight: '0px',
      //   }
      // }
    },
    MuiTreeItem: {
      styleOverrides: {
        root: {

          //  borderBottom : 'solid 1px lightgray',
        },

      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: "#f9f9f9",
          },
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: color.primary.blue,
          color: "#fff",
        },
      }
    },
    MuiDataGrid: {
      styleOverrides: {
        columnHeader: {
          fontWeight: 'bold',
          color: color.primary.header,
        },
        cell: {
          color: color.primary.black,
        },
        sortIcon: {
          color: color.primary.blue,
          //  backgroundColor: color.primary.red,
          opacity: 1
        }
      }
    }
    ,
  },
});

//const drawerWidth = 215;
export const StyledAccordionSummary = styled(AccordionSummary)({
  minHeight: 30,
  maxHeight: 30,
  '&.Mui-expanded': {
    minHeight: 30,
    maxHeight: 30,
  },
  fontSize: "1.2rem",
  padding: "2px",
  paddingLeft: "0.5rem",
  border: "1px solid white"
});

