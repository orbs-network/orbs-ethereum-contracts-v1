/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import styles from './styles';
import { NavLink } from 'react-router-dom';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import content from './content';

const Home = ({ classes }) => {
  return (
    <>
      <Typography variant="h2" component="h2" gutterBottom color="textPrimary">
        Participation Instructions
      </Typography>
      <article className={classes.article}>
        {content.map((section, idx) => (
          <React.Fragment key={section.title}>
            <section className={classes.section}>
              <div className={classes.imageBlock}>
                <img className={classes.image} src={section.imageUrl} alt={section.title} />
              </div>
              <div>
                <Typography variant="h4" gutterBottom color="textPrimary">
                  {section.title}
                </Typography>
                <Typography variant="body1" gutterBottom color="textPrimary">
                  {section.text}
                </Typography>
                <ul className={classes.links}>
                  {section.links.map((link, idx) => (
                    <li key={idx} className={classes.link}>
                      <Link variant="body1" color="secondary" href={link.url} target="_blank" rel="noopener">{link.title}</Link>
                    </li>
                  ))}
                </ul>
                <Link
                  // @ts-ignore
                  component={NavLink}
                  to={section.cta.url}
                  className={classes.ctaButton}
                  variant="body1"
                  underline="none"
                >
                  {section.cta.label}
                </Link>
              </div>
            </section>
            {idx === content.length - 1 ? null : <hr className={classes.division}/>}
          </React.Fragment>
        ))}
      </article>
    </>
  );
};

export default withStyles(styles)(Home);
