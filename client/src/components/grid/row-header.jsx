import { color } from "@/theme-material";
import { Grid2 as Grid } from "@mui/material";
import { isEmpty } from "lodash";

export const RowHeader = (props) => {
  const { leftcontent,rightcontent,children,backgroundColor,size,...rest } = props;

  const leftcontent2 = props.leftcontent || props.children;
  const rightcontent2 = props.rightcontent || "";
  const backgroundColor2 = props.backgroundColor || color.secondary.blue700;
  const textColor2 = props.color || color.primary.white;

  const sizeL = isEmpty(rightcontent) ? 12 : (size || 10);
  const sizeR = 12 - sizeL;

  return (
    <Grid
      container
      sx={{
        height: "35px",
        backgroundColor: backgroundColor2,
        color: textColor2,
        fontsize: "1.2rem",
        padding: "3px",
        paddingLeft: "0.5rem",
        paddingRight: "0.5rem",
      }}
      {...rest}
    >
      <Grid container item size={sizeL} justifyContent="flex-start">
        <div>{leftcontent2}</div>
      </Grid>
      {sizeL < 12 && (
        <Grid container item size={sizeR} justifyContent="flex-end">
          <div>{rightcontent2}</div>
        </Grid>
      )}
    </Grid>
  );
};
