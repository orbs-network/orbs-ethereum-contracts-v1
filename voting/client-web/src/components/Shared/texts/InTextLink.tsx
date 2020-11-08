import React, { DetailedHTMLProps } from 'react';
import { makeStyles } from '@material-ui/core/styles';

interface IProps {
  text: string;
  href?: string;
}

const useStyles = makeStyles((theme) => ({
  link: {
    color: theme.palette.secondary.light,
    '&:hover': {
      color: theme.palette.secondary.main,
    },
  },
}));

export const InTextLink = React.memo<
  IProps & DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>
>((props) => {
  const classes = useStyles();
  const { text, href, ...others } = props;
  return (
    <a
      className={classes.link}
      href={href || ''}
      target={'_blank'}
      rel={'noopener noreferrer'}
      // style={{ display: "inline" }}
      {...others}
    >
      {text}
    </a>
  );
});
