import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

const links = [
  // { translationKey: 'Home', url: '/' },
  { translationKey: 'Guardians', url: '/delegator' },
  // { translationKey: 'Validators', url: '/guardian' },
  // { translationKey: 'Elected Validators', url: '/validator' },
  { translationKey: 'Rewards', url: '/reward' },
];

export type TLinkDescriptor = {
  label: string;
  url: string;
};

export const useLinkDescriptors = () => {
  const { t } = useTranslation();
  const linkDescriptors = useMemo<TLinkDescriptor[]>(() => {
    return links.map((link) => ({ url: link.url, label: t(link.translationKey) }));
  }, [t]);

  return linkDescriptors;
};
