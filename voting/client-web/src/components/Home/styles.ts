export default () => ({
  article: {
    marginTop: 90
  },
  explanations: {
    width: '49em'
  },
  section: {
    display: 'flex',
    flexDirection: 'row' as any,
    marginBottom: 20
  },
  imageBlock: {
    marginRight: 70
  },
  image: {
    width: 242
  },
  content: {
    marginLeft: 70
  },
  division: {
    border: '1px solid #192a44',
    margin: '70px 0' 
  },
  links: {
    color: 'white',
    paddingLeft: 16
  },
  link: {
    lineHeight: '1.8em'
  },
  ctaButton: {
    display: 'inline-block',
    background: '#16faff',
    border: 0,
    borderRadius: '100px',
    padding: '.8em 1.6em',
    '&:hover': {
      opacity: 0.9
    }
  }
});
