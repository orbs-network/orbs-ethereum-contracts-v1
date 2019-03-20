import React from 'react';
import styles from './styles';
import { NavLink } from 'react-router-dom';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import content from './content';

const Home = ({ classes }) => {
  return (
    <div className={classes.container}>
      <header className={classes.header}>
        <Typography variant="h2" color="textPrimary" noWrap>
          Who are you?
        </Typography>
      </header>
      <section className={classes.columns}>
        {content.map((passage, idx) => (
          <article key={idx} className={classes.column}>
            <div className={classes.columnText}>
              <Typography variant="h6" color="textPrimary">
                {passage.text}
              </Typography>
            </div>
            <Link
              // @ts-ignore
              component={NavLink}
              to={passage.cta.url}
              className={classes.ctaButton}
              variant="body1"
              underline="none"
            >
              {passage.cta.label}
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
};

export default withStyles(styles)(Home);
