import { Toolbar, Box, Typography } from "@mui/material";
import { color } from "@/theme-material";

export const Navbar = ({ alignRight, style, children }) => {
    <>
        <Box
            xs={{ flexGrow: 1 }}
            style={style || {}}>
            <Toolbar
                disableGutters
                variant="dense"
                style={{
                    backgroundColor: color.primary.white,
                    minHeight: "35px",
                    width: "96%",
                    zIndex: 3000,
                    padding: "3px 0px",
                    display: "flex",
                }}
                sx={{
                    boxShadow: "none",
                    bgcolor: color.primary.white,
                    color: color.primary.blue,
                }}
            >
            </Toolbar>
            <Typography
            component="div"
            sx={{flexGrow:1}}>
                {children}
            </Typography>
            {alignRight}
        </Box>
        <br/>
        <br/>
    </>
}