export default () => ({
  root: {
    display: 'flex',
    backgroundColor: '#06142e',
    backgroundRepeat: 'repeat-y',
    backgroundImage:
      'url(https://orbs.live.strattic.io/wp-content/uploads/2019/02/technology-background1.png)',
    backgroundAttachment: 'scroll',
    backgroundPosition: 'top center',
    height: '100%'
  },
  glass: {
    backgroundColor: 'black',
    width: '100%',
    height: '100%',
    opacity: 0.7,
    zIndex: 100000,
    position: 'absolute' as any,
    top: 0,
    left: 0
  },
  glassLabel: {
    width: '100%',
    height: '100%',
    zIndex: 100001,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute' as any,
    top: 0,
    left: 0
  },
  blurred: {
    filter: 'blur(2px)'
  }
});
