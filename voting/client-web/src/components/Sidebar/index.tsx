import React from 'react';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';

const drawerWidth = 240;

const styles = theme => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0
  },
  drawerPaper: {
    width: drawerWidth
  },
  toolbar: theme.mixins.toolbar
});

const Sidebar = ({ classes }) => {
  return (
    <Drawer
      className={classes.drawer}
      variant="permanent"
      classes={{
        paper: classes.drawerPaper
      }}
    >
      <div className={classes.toolbar} />
      <List>
        <ListItem>
          <Link to="/">
            <ListItemText primary="Home" />
          </Link>
        </ListItem>
        <ListItem>
          <Link to="/stakeholder" data-hook="nav-stakeholder">
            <ListItemText primary="Stakeholder" />
          </Link>
        </ListItem>
        <ListItem>
          <Link to="/guardian" data-hook="nav-guardian">
            <ListItemText primary="Guardian" />
          </Link>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default withStyles(styles)(Sidebar);
