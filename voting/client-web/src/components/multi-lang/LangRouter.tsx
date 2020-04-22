/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter as Router } from 'react-router-dom';
import i18n, { Resource } from 'i18next';
import { PreLangBasenameProvider } from './PreLangBasenameContext';
import { initReactI18next } from 'react-i18next';

function getForcedLanguage() {
  const langMatch = window.location.pathname.match(/\/(en|ko|jp)\//);
  return langMatch ? langMatch[1] : '';
}

function setupI18n(resources: Resource) {
  i18n
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
      resources,
      lng: 'en',
      keySeparator: false, // we do not use keys in form messages.welcome
      interpolation: {
        escapeValue: false, // react already safes from xss
      },
    });
}

interface IProps {
  preLangBasename?: string;
  resources: Resource;
}

export const LangRouter: React.FC<IProps> = ({ children, resources, preLangBasename = '' }) => {
  setupI18n(resources);
  const forcedLang = getForcedLanguage();
  let langBaseName = '';
  if (forcedLang) {
    langBaseName = `/${forcedLang}/`;
    if (i18n.language !== forcedLang) {
      i18n.changeLanguage(forcedLang);
    }
  } else {
    const navigatorLang = navigator.language.split('-')[0];
    if (i18n.languages.indexOf(navigatorLang) > -1) {
      if (i18n.language !== navigatorLang) {
        i18n.changeLanguage(navigatorLang);
      }
    }
  }

  return (
    <I18nextProvider i18n={i18n}>
      <PreLangBasenameProvider value={preLangBasename}>
        <Router basename={`${preLangBasename}${langBaseName}`}>{children}</Router>
      </PreLangBasenameProvider>
    </I18nextProvider>
  );
};
