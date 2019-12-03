/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { useLocation } from 'react-router';
import React, { useContext } from 'react';
import { PreLangBasenameContext } from './PreLangBasenameContext';

function addLangToCurrentLocation(location, preLangBasename: string, lang: string) {
  const langRegexp = /\/(en|ko|jp)\//;
  return location.pathname.match(langRegexp)
    ? location.pathname.replace(langRegexp, `/${lang}/`)
    : `${preLangBasename}/${lang}${location.pathname}`;
}

interface IProps {
  lang: string;
}

export const ChangeLangLink: React.FC<IProps> = ({ lang, children }) => {
  const location = useLocation();
  const preLangBasename = useContext(PreLangBasenameContext);
  return <a href={addLangToCurrentLocation(location, preLangBasename, lang)}>{children}</a>;
};
