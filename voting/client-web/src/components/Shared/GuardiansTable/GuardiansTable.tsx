import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Typography,
  Theme,
  Tooltip,
} from '@material-ui/core';
import useTheme from '@material-ui/core/styles/useTheme';
import makeStyles from '@material-ui/core/styles/makeStyles';
import React, { useCallback, useMemo } from 'react';
import MaterialTable, { Column, MTableToolbar } from 'material-table';
import styled from 'styled-components';
import { EMPTY_ADDRESS } from '../sharedConstants';
import IconButton from '@material-ui/core/IconButton';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
// import { ReactComponent as GlobeIcon } from '../../../assets/globe.svg';
import SvgIcon from '@material-ui/core/SvgIcon';
import { TABLE_ICONS } from '../tables/TableIcons';
import { Guardian } from '../../../services/v2/orbsNodeService/systemState';
import { GuardianQualifications } from './GuardianQualifications';
import { ICommitteeMemberData } from '../../../services/v2/orbsNodeService/OrbsNodeTypes';
import { Line } from 'rc-progress';
import { CommonActionButton } from '../base/CommonActionButton';
import { InTextLink } from '../texts/InTextLink';
import { toJS } from 'mobx';
import { ensurePrefix } from '../utils/stringUtils';

const asPercent = (num: number) =>
  (num * 100).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 }) + '%';

// DEV_NOTE : O.L : The '+' is a trick to get better display of round numbers
const secondsToDaysString = (seconds: number) => +(seconds / (60 * 60 * 24)).toFixed(2);

const getWebsiteAddress = (url: string) => (url.toLowerCase().indexOf('http') === 0 ? url : `http://${url}`);

const NameBox = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyItems: 'center',
}));

const useStyles = makeStyles((theme) => ({
  toolbarWrapper: {
    '& .MuiToolbar-gutters': {
      backgroundColor: theme.palette.primary.dark,
    },
  },

  selectButton: {
    minWidth: '130px',
  },
}));

type TGuardianSelectionMode = 'Select' | 'Change' | 'None';

interface IProps {
  guardianSelectionMode: TGuardianSelectionMode;
  guardians: Guardian[];
  committeeMembers: ICommitteeMemberData[];
  guardiansToDelegatorsCut: { [guardianAddress: string]: number };

  selectedGuardian?: string;
  onGuardianSelect?: (guardian: Guardian) => void;
  tableTestId?: string;
  extraStyle?: React.CSSProperties;
  tableTitle?: string;

  disableSelection?: boolean;

  // Styling
  densePadding?: boolean;
}

function compareGuardiansBySelectedAndThenStake(a: Guardian, b: Guardian, selectedGuardianAddress = '') {
  const selectedGuardianAddressLowerCase = selectedGuardianAddress.toLowerCase();
  if (a.EthAddress.toLowerCase() === selectedGuardianAddressLowerCase) {
    return -1;
  } else if (b.EthAddress.toLowerCase() === selectedGuardianAddressLowerCase) {
    return 1;
  } else {
    return b.EffectiveStake - a.EffectiveStake;
  }
}

export const GuardiansTable = React.memo<IProps>((props) => {
  const {
    guardianSelectionMode,
    guardians,
    onGuardianSelect,
    selectedGuardian,
    guardiansToDelegatorsCut,
    disableSelection,
    tableTestId,
    extraStyle,
    tableTitle,
    densePadding,
    committeeMembers,
  } = props;
  // const guardiansTableTranslations = useGuardiansTableTranslations();

  const classes = useStyles();
  const theme = useTheme();

  const getGuardianSelectionCellContent = useCallback(
    (g: Guardian) => {
      let selectedGuardianCell: JSX.Element | null = null;

      const actionButtonOnClick = () => (onGuardianSelect ? onGuardianSelect(g) : null);
      const isSelectedGuardian = g.EthAddress.toLowerCase() === selectedGuardian?.toLowerCase();

      switch (guardianSelectionMode) {
        case 'Select':
          selectedGuardianCell = (
            <CommonActionButton
              disabled={disableSelection}
              variant={'outlined'}
              onClick={actionButtonOnClick}
              fullWidth
            >
              {/*{guardiansTableTranslations(isSelectedGuardian ? 'action_keep' : 'action_select')}*/}
              {isSelectedGuardian ? 'Keep' : 'select'}
            </CommonActionButton>
          );
          break;
        case 'Change':
          const enabled = !!onGuardianSelect;
          const actionButtonIcon = isSelectedGuardian ? (
            <CheckCircleOutlineIcon data-testid={'selected-guardian-icon'} />
          ) : (
            <RadioButtonUncheckedIcon data-testid={'unselected-guardian-icon'} />
          );

          const iconColor = isSelectedGuardian ? theme.palette.secondary.main : theme.palette.grey['500'];

          selectedGuardianCell = (
            <Typography data-testid={`guardian-${g.EthAddress}-selected-status`}>
              <IconButton
                onClick={actionButtonOnClick}
                disabled={!enabled || disableSelection}
                style={{ color: iconColor }}
              >
                {actionButtonIcon}
              </IconButton>
            </Typography>
          );
          break;
        case 'None':
          selectedGuardianCell = null;
          break;
        default:
          throw new Error(`Invalid guardian selection mode of ${guardianSelectionMode}`);
      }

      return selectedGuardianCell;
    },
    [
      selectedGuardian,
      guardianSelectionMode,
      onGuardianSelect,
      disableSelection,
      theme.palette.secondary.main,
      theme.palette.grey,
    ],
  );

  const hasSelectedGuardian = !!selectedGuardian && selectedGuardian !== EMPTY_ADDRESS;
  const addSelectionColumn = hasSelectedGuardian || (onGuardianSelect && guardianSelectionMode === 'Select');

  const sortedGuardians = useMemo(
    () => guardians.slice().sort((a, b) => compareGuardiansBySelectedAndThenStake(a, b, selectedGuardian)),
    [guardians, selectedGuardian],
  );
  console.log('SOrted Guardians', sortedGuardians);

  console.log({ committeeMembers: toJS(committeeMembers) });

  const getCommitteeMemberData = useCallback(
    (guardianEthAddress: string) => {
      const committeeMemberData = committeeMembers.find(
        (committeeMember) =>
          ensurePrefix(committeeMember.EthAddress, '0x').toLowerCase() === guardianEthAddress.toLowerCase(),
      );

      return committeeMemberData;
    },
    [committeeMembers],
  );

  // TODO : ORL : TRANSLATIONS

  const columns = useMemo(() => {
    const columns: Column<Guardian>[] = [
      {
        title: '',
        field: '',
        render: (guardian) => (
          <GuardianQualifications
            guardian={guardian}
            committeeMembershipData={getCommitteeMemberData(guardian.EthAddress)}
          />
        ),
        width: 'fit-content',
      },
      {
        // title: guardiansTableTranslations('columnHeader_name'),
        title: 'Name',
        field: 'Name',
        render: (guardian) => (
          <NameBox data-testid={`guardian-${guardian.EthAddress}`}>
            <Typography>{guardian.Name}</Typography>
          </NameBox>
        ),
        headerStyle: {
          textAlign: 'left',
        },
      },
      {
        // title: guardiansTableTranslations('columnHeader_address'),
        title: 'Address',
        field: 'EthAddress',
        render: (guardian) => (
          <Tooltip title={<Typography>{guardian.EthAddress}</Typography>} arrow placement={'right'} interactive>
            <Typography style={{ fontFamily: 'monospace', textAlign: 'center' }}>
              <InTextLink
                href={`https://etherscan.io/address/${guardian.EthAddress}`}
                text={`${guardian.EthAddress.substring(0, 10)}...`}
              />
            </Typography>
          </Tooltip>
        ),
        // TODO : FUTURE : O.L : Adding "fontFamily: 'monospace'" to the cell makes the Typography text larger and better, understand whats going on.
        cellStyle: {
          fontFamily: 'monospace',
        },
      },
      {
        // title: guardiansTableTranslations('columnHeader_website'),
        title: 'Website',
        field: 'Website',
        render: (guardian) => (
          <Tooltip arrow title={<Typography>{guardian.Website}</Typography>}>
            <a
              data-testid={`guardian-${guardian.EthAddress}-website`}
              href={getWebsiteAddress(guardian.Website)}
              target='_blank'
              rel='noopener noreferrer'
            >
              {/*<SvgIcon component={GlobeIcon} />*/}
            </a>
          </Tooltip>
        ),
        cellStyle: {
          textAlign: 'center',
        },
        sorting: false,
      },
      {
        title: 'Reward % To Delegators',
        field: '',
        render: (guardian) => {
          const { EthAddress } = guardian;

          const hasData = guardiansToDelegatorsCut[EthAddress] != undefined;

          const text = hasData ? `${guardiansToDelegatorsCut[EthAddress]}%` : '--';

          return (
            <Tooltip
              arrow
              title={
                <>
                  <Typography>This Guardian gives {text} of the rewards to the Delegators</Typography>
                </>
              }
            >
              <Typography>{text}</Typography>
            </Tooltip>
          );
        },
        cellStyle: {
          textAlign: 'center',
        },
        customSort: (data1, data2) => {
          // DEV_NOTE : This is quick, might cause 'un-deterministic' sort, but it's acceptable
          const delegatorsCut1 = guardiansToDelegatorsCut[data1.EthAddress] || 0;
          const delegatorsCut2 = guardiansToDelegatorsCut[data2.EthAddress] || 0;

          return delegatorsCut2 - delegatorsCut1;
        },
        defaultSort: 'desc',
      },
      {
        title: 'Effective Stake',
        field: 'EffectiveStake',
        render: (guardian) => {
          const { EffectiveStake, SelfStake, DelegatedStake } = guardian;

          const effectiveStakeInUnits =
            EffectiveStake > 1_000_000
              ? `${(EffectiveStake / 1_000_000).toFixed(2).replace(/[.,]00$/, '')} M`
              : `${(EffectiveStake / 1_000).toFixed(2).replace(/[.,]00$/, '')} K`;

          return (
            <Tooltip
              arrow
              title={
                <>
                  <Typography>Self stake: {SelfStake?.toLocaleString()} ORBS</Typography>
                  <Typography>Delegated stake: {DelegatedStake?.toLocaleString()} ORBS</Typography>
                </>
              }
            >
              <Typography>{effectiveStakeInUnits}</Typography>
            </Tooltip>
          );
        },
        cellStyle: {
          textAlign: 'center',
        },
        defaultSort: 'desc',
      },
      {
        title: 'Participation',
        field: 'ParticipationPercentage',
        render: (guardian) => {
          const { ParticipationPercentage } = guardian;
          // TODO : ORL : Make this color gradient
          const color = ParticipationPercentage <= 30 ? 'red' : ParticipationPercentage <= 80 ? 'yellow' : 'green';

          return (
            <>
              <Line percent={ParticipationPercentage} strokeWidth={5} strokeColor={color} />
              <Typography>{ParticipationPercentage.toFixed(2)}%</Typography>
            </>
          );
        },
        cellStyle: {
          textAlign: 'center',
        },
        defaultSort: 'desc',
      },
      {
        title: 'Capacity',
        field: 'SelfStake',
        render: (guardian) => {
          const { Capacity, SelfStake, DelegatedStake } = guardian;
          const selfStakePercentage = +((SelfStake / DelegatedStake) * 100).toFixed(2);
          // TODO : ORL : Make this color gradient
          const color = Capacity <= 30 ? 'green' : Capacity <= 80 ? 'yellow' : 'red';

          return (
            <Tooltip
              arrow
              title={
                <>
                  <Typography>Self stake: {SelfStake?.toLocaleString()} ORBS</Typography>
                  <Typography>Delegated stake: {DelegatedStake?.toLocaleString()} ORBS</Typography>
                  <Typography>% self stake: {selfStakePercentage?.toLocaleString()}%</Typography>
                </>
              }
            >
              <div>
                <Line percent={Capacity} strokeWidth={5} strokeColor={color} />
                <Typography>{Capacity.toFixed(2)}%</Typography>
              </div>
            </Tooltip>
          );
        },
        cellStyle: {
          textAlign: 'center',
        },
        defaultSort: 'desc',
      },
    ];

    if (addSelectionColumn) {
      columns.push({
        // title: guardiansTableTranslations('columnHeader_selection'),
        title: 'Select',
        field: '',
        render: (extendedGuardianInfo) => {
          return getGuardianSelectionCellContent(extendedGuardianInfo);
        },
        cellStyle: {
          textAlign: 'center',
        },
      });
    }

    return columns;
  }, [
    addSelectionColumn,
    getCommitteeMemberData,
    getGuardianSelectionCellContent,
    // guardiansTableTranslations,
    guardiansToDelegatorsCut,
  ]);

  // DEV_NOTE : O.L : This prevents displaying of a large empty table if there are less than 50 Guardians.
  const pageSize = Math.min(50, guardians.length);

  return (
    <MaterialTable
      title={tableTitle || ''}
      columns={columns}
      data={sortedGuardians}
      icons={TABLE_ICONS}
      style={{ overflowX: 'auto' }}
      options={{
        padding: densePadding ? 'dense' : 'default',
        pageSize: pageSize,
        pageSizeOptions: [5, 10, pageSize],

        rowStyle: (guardian: Guardian) => ({
          backgroundColor:
            guardian.EthAddress.toLowerCase() === selectedGuardian?.toLowerCase()
              ? 'rgba(66,66, 66, 0.55)'
              : 'rgba(33,33, 33, 0.55)',
        }),
        headerStyle: {
          backgroundColor: theme.palette.primary.dark,
          textAlign: 'center',
        },
      }}
      components={{
        // DEV_NOTE : This 'Hack' to style the toolbar is taken from 'https://github.com/mbrn/material-table/issues/1690#issuecomment-603755197'
        Toolbar: (props) => (
          <div className={classes.toolbarWrapper}>
            <MTableToolbar {...props} />
          </div>
        ),
      }}
    />
  );
});
