import React, { DetailedHTMLProps } from 'react';
import { makeStyles } from '@material-ui/core/styles';

interface IProps {}

const useStyles = makeStyles(theme => ({
  section: {
    display: 'flex',
    flexWrap: 'wrap',
    maxWidth: '100%',
    overflowX: 'hidden',
    justifyItems: 'center',
  },
}));

type TSectionProps = DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;

export const PageSection = React.memo<IProps & TSectionProps>(props => {
  const { children, ...others } = props;
  return <section {...others}>{children}</section>;
});
