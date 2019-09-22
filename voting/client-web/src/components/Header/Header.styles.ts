export const HOVER_COLOR = '#16faff';

export const HeaderStyles = theme => ({
  logo: {
    width: 70,
  },
  nav: {
    display: 'inherit',
  },
  toolbar: {
    justifyContent: 'space-between',
  },
  headerButtonsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    padding: `${theme.spacing.unit * 2}px ${theme.spacing.unit * 8}px`,
  },
  displayInMetamaskButton: {
    marginRight: `${theme.spacing.unit * 3}px`,
  },
  movedDown: {
    paddingTop: 48,
  },
  link: {
    color: '#ffffffb3',
    marginLeft: 30,
    transition: 'color 0.4s ease-in-out',
    '&:hover': {
      color: HOVER_COLOR,
    },
  },
});
