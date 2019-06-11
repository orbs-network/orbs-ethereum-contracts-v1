/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import Link from '@material-ui/core/Link';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { content } from './content';
import { HomeStyles } from './Home.styles';

const HomeImpl = ({ classes }) => {
  const { t } = useTranslation();
  const translatedContent = content(t);
  return (
    <>
      <Typography variant='h2' component='h2' gutterBottom color='textPrimary'>
        {t('Participation Instructions')}
      </Typography>
      <Typography className={classes.explanations} variant='body1' gutterBottom color='textPrimary'>
        {t('Participation Instructions Content1')}
      </Typography>
      <Typography className={classes.explanations} variant='body1' gutterBottom color='textPrimary'>
        {t('Participation Instructions Content2')}
      </Typography>
      <article className={classes.article}>
        {translatedContent.map((section, idx) => (
          <React.Fragment key={section.title}>
            <section className={classes.section}>
              <div className={classes.imageBlock}>
                <img className={classes.image} src={section.imageUrl} alt={section.title} />
              </div>
              <div>
                <Typography variant='h4' gutterBottom color='textPrimary'>
                  {section.title}
                </Typography>
                <Typography variant='body1' gutterBottom color='textPrimary'>
                  {section.text}
                </Typography>
                <ul className={classes.links}>
                  {section.links.map((link, idx) => (
                    <li key={idx} className={classes.link}>
                      <Link variant='body1' color='secondary' href={link.url} target='_blank' rel='noopener'>
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  // @ts-ignore
                  component={NavLink}
                  to={section.cta.url}
                  className={classes.ctaButton}
                  variant='body1'
                  underline='none'
                >
                  {section.cta.label}
                </Link>
              </div>
            </section>
            {idx === translatedContent.length - 1 ? null : <hr className={classes.division} />}
          </React.Fragment>
        ))}
      </article>
    </>
  );
};

export const Home = withStyles(HomeStyles)(HomeImpl);
