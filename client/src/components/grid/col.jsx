import { Grid2 as Grid } from "@mui/material";
import { Item, ItemNoPadding } from "./item";
import { memo, useMemo } from 'react';

const defaultSize = 3;

const ColComponent = (props) => {
  const { children, size = defaultSize, ...rest } = props;
  
  const gridProps = useMemo(() => ({
    size,
    ...rest
  }), [size, rest]); // Note: Be careful with spreading rest in memo - see note below


  return (
    <Grid {...gridProps} {...rest}>
      <ItemNoPadding>{children}</ItemNoPadding>
    </Grid>
  );
};

export const Col = memo(ColComponent);

const ColPaddedComponent = (props) => {
  const { children, size = defaultSize, ...rest } = props;
  
  const gridProps = useMemo(() => ({
    size,
    ...rest
  }), [size, rest]);

  return (
    <Grid {...gridProps}>
          <Item>{children}</Item>
    </Grid>
  );
};

export const ColPadded = memo(ColPaddedComponent);