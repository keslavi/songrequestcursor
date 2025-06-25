import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import { NavLink } from "react-router-dom";
import { color } from "@/theme-material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { store } from "@/store/store";
import { useAuth0 } from "@auth0/auth0-react";

const settings = ["Profile", "Account", "Dashboard", "Logout"];

const headerTheme = createTheme({
  palette: {
    primary: {
      main: "#1976d2", // your custom blue
    },
  },
});

export const Header = (props) => {
  const { menu } = props;
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  
  // Get user data from both Auth0 (for social auth) and local store
  const { user: auth0User, logout: auth0Logout } = useAuth0();
  const user = store.use.user();
  const logout = store.use.logout();
  const isAuthenticated = store.use.isAuthenticated();

  const onOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const onOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const onCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const onCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    onCloseUserMenu();
    // Logout from both Auth0 and local store
    if (auth0User) {
      auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    }
    logout();
  };

  // Get profile picture from either Auth0 or local user data
  const getProfilePicture = () => {
    // Priority: Auth0 user picture > local user profile picture > default avatar
    return auth0User?.picture || user?.profile?.picture || null;
  };

  // Get user name for avatar alt text
  const getUserName = () => {
    return auth0User?.name || user?.profile?.name || user?.username || "User";
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    const name = getUserName();
    if (!name) return "U";
    
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const renderMenu = (menu) => {
    return menu.map((x) => {
      if (x.items) {
        return renderMenu(x.items);
      }
      return (
        <NavLink to={x.link} key={x.link}>
          {({ isActive }) => (
            <Button
              color="inherit"
              sx={{
                padding: 0,
                my: 2,
                color: 'white',
                display: "block",
                marginRight: "10px",
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'none',
                  backgroundColor: 'transparent'
                },
                ...(isActive && {
                  borderBottom: '2px solid white'
                })
              }}
            >
              {x.text}
            </Button>
          )}
        </NavLink>
      );
    });
  };

  const renderMenuXs = (menu) => {
    return menu.map((x) => {
      if (x.items) {
        return renderMenuXs(x.items);
      }
      return (
        <NavLink to={x.link} key={x.link}>
          {({ isActive }) => (
            <MenuItem onClick={onCloseNavMenu} selected={isActive}>
              <Typography textAlign="center">{x.text}</Typography>
            </MenuItem>
          )}
        </NavLink>
      );
    });
  };

  return (
    <ThemeProvider theme={headerTheme}>
      <AppBar
        position="fixed"
        sx={{
          bgcolor: color.primary.blue,
          color: color.white,
          boxShadow: "none",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters variant="dense">
            <Typography
              variant="h6"
              noWrap
              component="a"
              href="#app-bar-with-responsive-menu"
              sx={{
                mr: 2,
                display: { xs: "none", md: "flex" },
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: ".3rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              SONG REQUEST
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={onOpenNavMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "left",
                }}
                open={Boolean(anchorElNav)}
                onClose={onCloseNavMenu}
                sx={{ display: { xs: "block", md: "none" } }}
              >
                {renderMenuXs(menu)}
              </Menu>
            </Box>
            <img
              src="/src/components/header/songrequest_logo.png"
              alt="Song Request"
              style={{
                display: { xs: "flex", md: "none" },
                marginRight: "8px",
                height: "32px",
                width: "auto",
                borderRadius: "50%"
              }}
            />
            <Typography
              variant="h5"
              noWrap
              component="a"
              href="#app-bar-with-responsive-menu"
              sx={{
                mr: 2,
                display: { xs: "flex", md: "none" },
                flexGrow: 1,
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: ".3rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              SONG REQUEST
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
              {renderMenu(menu)}
            </Box>
            {isAuthenticated && (
              <Box sx={{ flexGrow: 0 }}>
                <Tooltip title={getUserName()}>
                  <IconButton onClick={onOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar 
                      alt={getUserName()} 
                      src={getProfilePicture()}
                      sx={{ 
                        bgcolor: getProfilePicture() ? 'transparent' : color.primary.blue,
                        color: getProfilePicture() ? 'inherit' : 'white'
                      }}
                    >
                      {!getProfilePicture() && getInitials()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: "45px" }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={onCloseUserMenu}
                >
                  {settings.map((setting) => (
                    <MenuItem 
                      key={setting} 
                      onClick={setting === "Logout" ? handleLogout : onCloseUserMenu}
                    >
                      <Typography sx={{ textAlign: "center" }}>
                        {setting}
                      </Typography>
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      <br/>
      <br/>
    </ThemeProvider>
  );
};

export default Header;
