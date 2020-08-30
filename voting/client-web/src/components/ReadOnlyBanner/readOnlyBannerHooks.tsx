import { useApi } from '../../services/ApiContext';
import React, { useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import { Button } from '@material-ui/core';
import Link from '@material-ui/core/Link';

const actionBuilder = (closeSnackbar: (snackbarKey: any) => void) => (key: any) => (
  <>
    <Link href='https://metamask.io' target='_blank' rel='noreferrer'>
      <b>Install Metamask</b>
    </Link>
    <Button onClick={() => closeSnackbar(key)}>X</Button>
  </>
);

export const useNoMetaMaskSnackbar = () => {
  const { metamask } = useApi();
  const hasMetamask = useMemo(() => !!metamask, [metamask]);
  const [isNoMetamaskBannerOpen, setIsMetamaskBannerOpen] = useState(!hasMetamask);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  useEffect(() => {
    if (isNoMetamaskBannerOpen) {
      enqueueSnackbar(
        'Attention! You are in Read Only mode. Please, install MetaMask extension to unlock full functionality.',
        {
          autoHideDuration: null,
          variant: 'warning',
          action: actionBuilder(closeSnackbar),
        },
      );
    }
  }, [closeSnackbar, enqueueSnackbar, isNoMetamaskBannerOpen]);
};
