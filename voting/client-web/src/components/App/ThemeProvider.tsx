/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { MuiThemeProvider, responsiveFontSizes } from '@material-ui/core/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppTheme } from './App.theme';

// DEV_NOTE : O.L : Temp solution for header sizing and buffering
export const HEADER_HEIGHT_REM = 8;

// TODO : ORL : Break this apart if not re-building
export const ThemeProvider: React.FC = ({ children }) => {
  const { t } = useTranslation();
  return <MuiThemeProvider theme={AppTheme(t('fontFamily'))}>{children}</MuiThemeProvider>;
};
