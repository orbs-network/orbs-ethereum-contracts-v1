import React from 'react';
import styles from './styles';
import { Link } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import { Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import content from './content';

const Home = ({ classes }) => {
  return (
    <div className={classes.container}>
      <header className={classes.header}>
        <Typography variant="h3" color="textPrimary" noWrap>
          Who are you?
        </Typography>
      </header>
      <section className={classes.columns}>
        {content.map(passage => (
          <article className={classes.column}>
            <div className={classes.columnText}>
              <Typography variant="h6" color="textPrimary">
                {passage.text}
              </Typography>
            </div>
            <Button variant="outlined" color="secondary">
              <Link to={passage.cta.url}>
                <Typography variant="subtitle1" color="textSecondary">
                  {passage.cta.label}
                </Typography>
              </Link>
            </Button>
          </article>
        ))}
      </section>
    </div>
  );
};

export default withStyles(styles)(Home);
