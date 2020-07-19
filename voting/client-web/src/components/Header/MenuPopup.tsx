import React, { createRef, useCallback, useMemo, useRef } from 'react';
import { Button, IconButton, Menu, MenuItem, Popover, Typography } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles } from '@material-ui/core/styles';
import Link from '@material-ui/core/Link';
import { NavLink } from 'react-router-dom';
import { HOVER_COLOR } from './Header';
import { useLinkDescriptors } from './links';
import { useBoolean } from 'react-hanger';

const useStyles = makeStyles(theme => ({
  menuButton: {
    // marginRight: theme.spacing(2),
  },
  typography: {
    padding: theme.spacing(2),
  },
  link: {
    width: '100%',
    color: '#ffffffb3',
    // marginLeft: 30,
    transition: 'color 0.4s ease-in-out',
    '&:hover': {
      color: HOVER_COLOR,
    },
  },
}));

export const MenuPopup = React.memo(props => {
  const classes = useStyles();
  const linkDescriptors = useLinkDescriptors();
  console.log('Render menu');

  const { setFalse, setTrue, value } = useBoolean(false);

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setTrue();
      setAnchorEl(event.currentTarget);
    },
    [setTrue],
  );

  const handleClose = useCallback(() => {
    setFalse();
    setAnchorEl(null);
  }, [setFalse]);

  const menuItemLinks = useMemo(() => {
    return linkDescriptors.map(({ label, url }, idx) => (
      <MenuItem onClick={() => undefined} key={label + url}>
        <Link
          onClick={setFalse}
          // @ts-ignore
          component={NavLink}
          key={idx}
          exact={true}
          className={classes.link}
          activeStyle={{ color: HOVER_COLOR }}
          underline='none'
          to={url}
          variant='h6'
          noWrap
        >
          {label}
        </Link>
      </MenuItem>
    ));
  }, [classes.link, linkDescriptors, setFalse]);

  const id = value ? 'links-popover-menu' : undefined;

  return (
    <div style={{ border: '1px solid red' }}>
      <IconButton onClick={handleClick} className={classes.menuButton} color='inherit' aria-label='menu'>
        <MenuIcon />
      </IconButton>
      {/* TODO : O.L : Think about using 'Menu' instead of 'Popover' */}
      <Popover
        id={id}
        open={value}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        {menuItemLinks}
      </Popover>
    </div>
  );
});
