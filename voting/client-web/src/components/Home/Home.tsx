/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import Link from '@material-ui/core/Link';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { content } from './content';
import { Page } from '../structure/Page';

// DEV_NOTE : O.L : The responsiveness here is achieved with idea from https://heydonworks.com/article/the-flexbox-holy-albatross/

const useStyles = makeStyles((theme) => ({
  explanations: {
    // TODO : O.L : Check if we really need hard-coded value
    maxWidth: '49em',
  },
  article: {
    // marginTop: 90,
    marginTop: theme.spacing(10),
    maxWidth: '100%',
  },
  section: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyItems: 'center',
    '--multiplier': 'calc(40rem - 100%)',
    '--margin': '1rem',
    // margin: 'calc(var(--margin) * -1)',

    // marginBottom: 20,
    overflowX: 'hidden',
    '& > *': {
      maxWidth: '100%',
      // minWidth: '33%',
      flexGrow: 1,
      flexBasis: 'calc(var(--multiplier) * 999)',
    },
  },
  imageBlock: {
    marginRight: 'auto',
    marginLeft: 'auto',
    // minWidth: 'minmax(242px, 30%)',
    // minWidth: 'calc(242px -(var(--margin) * 2)',
    minWidth: '242px',
  },
  textBlock: {
    // minWidth: 'calc(65% -(var(--margin) * 2)',
    minWidth: '65%',
  },
  image: {
    maxWidth: '100%',
  },
  division: {
    border: '1px solid #192a44',
    margin: '70px 0',
  },
  links: {
    color: 'white',
    paddingLeft: 16,
  },
  link: {
    lineHeight: '1.8em',
  },
  ctaButton: {
    display: 'inline-block',
    background: '#16faff',
    border: 0,
    borderRadius: '100px',
    padding: '.8em 1.6em',
    '&:hover': {
      opacity: 0.9,
    },
  },
}));

export const Home = React.memo((props) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const translatedContent = content(t);
  return (
    <Page>
      <Typography variant='h2' gutterBottom color='textPrimary'>
        {t('Participation Instructions')}
      </Typography>
      <Typography className={classes.explanations} variant='body1' gutterBottom color='textPrimary'>
        {t('Participation Instructions Content1')}
      </Typography>
      <br />
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
              <div className={classes.textBlock}>
                <Typography variant='h4' gutterBottom color='textPrimary'>
                  {section.title}
                </Typography>
                <Typography variant='body1' gutterBottom color='textPrimary'>
                  {section.text}
                </Typography>

                {!section.text2 ? null : (
                  <>
                    <br />
                    <Typography variant='body1' gutterBottom color='textPrimary'>
                      {section.text2}
                    </Typography>
                  </>
                )}

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
            {/* TODO : O.L : Understand the purpose of this line */}
            {idx === translatedContent.length - 1 ? null : <hr className={classes.division} />}
          </React.Fragment>
        ))}
      </article>
    </Page>
  );
});
