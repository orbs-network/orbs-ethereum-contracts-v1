export default theme => ({
  content: {
    flexGrow: 1,
    padding: `${theme.spacing.unit * 10}px ${theme.spacing.unit * 31}px`,
    width: '100%'
  },
  toolbar: theme.mixins.toolbar
});
