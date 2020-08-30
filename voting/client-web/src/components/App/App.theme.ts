import { createMuiTheme, responsiveFontSizes } from '@material-ui/core/styles';

export const AppTheme = (fontFamily: string) =>
  responsiveFontSizes(
    createMuiTheme({
      palette: {
        type: 'dark',
        primary: { main: '#09142c' },
        secondary: { main: '#74f6fd' },
        background: {
          default: '#0a0f25',
          paper: '#192a45',
        },
      },
      typography: {
        fontFamily,
      },
      overrides: {
        MuiTypography: {
          body1: {
            fontWeight: 500,
          },
          h4: {
            fontWeight: 600,
          },
        },
        MuiTableCell: {
          body: { fontWeight: 500 },
        },
      },
    }),
  );
