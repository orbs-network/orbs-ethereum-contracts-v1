export default theme => ({
  mainText: {
    paddingTop: theme.spacing.unit * 10
  },
  container: {
    display: 'flex',
    width: '100%',
    height: '80vh',
    flexDirection: 'column' as any
  },
  header: {
    textAlign: 'center' as any,
    paddingBottom: 20
  },
  columns: {
    display: 'flex',
    height: '100%'
  },
  column: {
    flex: 1,
    padding: 20,
    textAlign: 'center' as any
  },
  columnText: {
    height: '90%',
    width: '90%',
    margin: '0 auto'
  }
});
