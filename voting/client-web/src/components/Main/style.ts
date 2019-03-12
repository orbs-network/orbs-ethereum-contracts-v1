export default theme => ({
  content: {
    flexGrow: 1,
    padding: `${theme.spacing.unit * 5}px`,
    width: '100%'
  },
  toolbar: theme.mixins.toolbar
});
