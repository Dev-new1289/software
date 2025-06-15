import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Toolbar,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import GroupIcon from "@mui/icons-material/Group";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import InventoryIcon from "@mui/icons-material/Inventory";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { useNavigate } from "react-router-dom";

const AppSidebar = ({ isSidebarOpen, toggleSidebar, drawerWidth = 240 }) => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = React.useState({ 
    dashboard: false, 
    settings: false,
    customers: false 
  });

  const handleToggle = (menu) => {
    setOpenMenu((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const menuItems = [
    { text: "Home", icon: <HomeIcon />, path: "/" },
    {
      text: "Customers",
      icon: <GroupIcon />,
      children: [
        {
          text: "Customer List",
          icon: <PersonIcon />,
          path: "/dashboard/customer-managment",
        },
        {
          text: "Area Management",
          icon: <LocationOnIcon />,
          path: "/dashboard/area-management",
        }
      ]
    },
    {
      text: "Sales",
      icon: <ShoppingCartIcon />,
      path: "/dashboard/sales-management",
    },
    {
      text: "Inventory",
      icon: <InventoryIcon />,
      path: "/dashboard/inventory-management",
    },
    {
      text: "Cash Management",
      icon: <AttachMoneyIcon />,
      path: "/dashboard/cash-management",
    },
    {
      text: "Income Report",
      icon: <AssessmentIcon />,
      path: "/dashboard/income-report",
    },
    {
      text: "Account Receivable",
      icon: <AccountBalanceIcon />,
      path: "/dashboard/account-receivable",
    },
    {text: "Customer Ledger",
      icon: <ReceiptIcon />,
      path: "/dashboard/customer-ledger",
    },
/*    {
      text: "Service Management",
      icon: <RoomServiceIcon />,
      path: "/dashboard/service-managment",
    },
    {
      text: "Booking History",
      icon: <HistoryIcon />,
      path: "/dashboard/booking-history",
    },
    {
      text: "System Logs",
      icon: <StorageIcon />,
      path: "/dashboard/systemLogs",
    },
    {
      text: "Weather Conditions",
      icon: <AcUnitIcon />,
      path: "/dashboard/weatherDashboard",
    },
    {
      text: "Settings",
      icon: <SettingsIcon />,
      path: "/dashboard/settings",
    },*/
  ];

  return (
    <Drawer
      variant={isSidebarOpen ? "persistent" : "temporary"}
      open={isSidebarOpen}
      onClose={toggleSidebar}
      sx={{
        width: isSidebarOpen ? drawerWidth : 0,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#282c34",
          color: "#fff",
        },
        display: { xs: "block", sm: "block" },
      }}
      ModalProps={{
        keepMounted: true,
      }}
    >
      <Toolbar>
        <IconButton
          onClick={toggleSidebar}
          sx={{ display: { sm: "none" }, color: "#fff" }}
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" noWrap sx={{ ml: 2 }}>
          Hotel Manager
        </Typography>
      </Toolbar>
      <Box
        sx={{
          overflow: "auto",
          "&::-webkit-scrollbar": {
            width: "8px", // Width of the scrollbar
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#2c2f34", // Track color
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#50597b", // Thumb color
            borderRadius: "4px", // Rounded edges
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#3f51b5", // Thumb hover color
          },
        }}
      >
        <List>
          {menuItems.map((item, index) => (
            <React.Fragment key={index}>
              {item.children ? (
                <>
                  <ListItem
                    onClick={() => handleToggle(item.text.toLowerCase())}
                    sx={{
                      padding: "10px 20px",
                      cursor: "pointer",
                      backgroundColor: openMenu[item.text.toLowerCase()] ? "#3f51b5" : "transparent",
                      "&:hover": { backgroundColor: "#3f51b5" },
                      borderLeft: openMenu[item.text.toLowerCase()] ? "4px solid #fff" : "none",
                    }}
                  >
                    <ListItemIcon sx={{ color: "#fff" }}>{item.icon}</ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: openMenu[item.text.toLowerCase()] ? "bold" : "normal"
                      }}
                    />
                    {openMenu[item.text.toLowerCase()] ? <ExpandLess /> : <ExpandMore />}
                  </ListItem>
                  <Collapse
                    in={openMenu[item.text.toLowerCase()]}
                    timeout="auto"
                    unmountOnExit
                  >
                    <List component="div" disablePadding>
                      {item.children.map((subItem, subIndex) => (
                        <ListItem
                          key={subIndex}
                          onClick={() => navigate(subItem.path)}
                          sx={{
                            pl: 6,
                            padding: "8px 20px",
                            cursor: "pointer",
                            backgroundColor: "#1a1d24",
                            "&:hover": { backgroundColor: "#50597b" },
                            borderLeft: "2px solid #3f51b5",
                            marginLeft: "8px",
                            marginRight: "8px",
                            borderRadius: "0 4px 4px 0",
                          }}
                        >
                          <ListItemIcon sx={{ color: "#fff", minWidth: "36px" }}>
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary={subItem.text}
                            primaryTypographyProps={{
                              fontSize: "0.9rem"
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </>
              ) : (
                <ListItem
                  onClick={() => {
                    item.action ? item.action() : navigate(item.path);
                  }}
                  sx={{
                    padding: "10px 20px",
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#3f51b5" },
                  }}
                >
                  <ListItemIcon sx={{ color: "#fff" }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              )}
            </React.Fragment>
          ))}
        </List>
      </Box>

    </Drawer>
  );
};

export default AppSidebar;