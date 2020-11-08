import React, { useMemo } from 'react';
import { Guardian } from '../../../services/v2/orbsNodeService/systemState';
import { Icon, SvgIcon, Tooltip, Typography } from '@material-ui/core';
import { ICommitteeMemberData } from '../../../services/v2/orbsNodeService/OrbsNodeTypes';
// import { ReactComponent as GuardianShield } from './assets/guardian_normal.svg';
// import { ReactComponent as CommitteeGuardianShield } from './assets/guardian_committee.svg';
// import { ReactComponent as CertifiedCommitteeGuardianShield } from './assets/guardian_commitee_certified.svg';
import Moment from 'moment';
import makeStyles from '@material-ui/core/styles/makeStyles';
import useTheme from '@material-ui/core/styles/useTheme';

interface IProps {
  guardian: Guardian;
  committeeMembershipData?: ICommitteeMemberData;
}

const useStyles = makeStyles((theme) => ({
  tooltip: {
    // width: 'max-content',
    width: 400,
    maxWidth: 'min(600px, 90%)',
  },
}));

export const GuardianQualifications = React.memo<IProps>((props) => {
  const { guardian, committeeMembershipData } = props;
  const classes = useStyles();

  // const SelectedIcon = committeeMembershipData
  //   ? guardian.IsCertified
  //     ? CertifiedCommitteeGuardianShield
  //     : CommitteeGuardianShield
  //   : GuardianShield;

  return (
    <Tooltip
      classes={{ tooltip: classes.tooltip }}
      enterTouchDelay={0}
      title={<GuardianQualificationsTooltip committeeMembershipData={committeeMembershipData} guardian={guardian} />}
      arrow
      placement={'right'}
    >
      <div style={{ height: '3rem', width: '3rem', position: 'relative', cursor: 'pointer' }}>
        {/*<SvgIcon component={SelectedIcon} viewBox='0 0 40.371 47.178' style={{ height: '100%', width: '100%' }} />*/}
        {/*{committeeMembershipData ? 'In committee' : null}*/}
        {/*{guardian.IsCertified ? 'Certified' : null}*/}
        {/*<Typography*/}
        {/*  style={{*/}
        {/*    position: 'absolute',*/}
        {/*    top: '50%',*/}
        {/*    left: '50%',*/}
        {/*    transform: 'translateX(-55%) translateY(-50%)',*/}
        {/*  }}*/}
        {/*  color={'secondary'}*/}
        {/*>*/}
        {/*  {guardian.IsCertified ? 'V' : '?'}*/}
        {/*</Typography>*/}
      </div>
    </Tooltip>
  );
});

const useStylesTooltip = makeStyles((theme) => ({
  textField: {
    fontWeight: 'bold',
    display: 'inline',
    color: theme.palette.secondary.main,
  },
  textValue: {
    fontWeight: 'bold',
    display: 'inline',
  },
}));

const GuardianQualificationsTooltip = React.memo<{
  guardian: Guardian;
  committeeMembershipData?: ICommitteeMemberData;
}>((props) => {
  const { guardian, committeeMembershipData } = props;
  const classes = useStylesTooltip();
  const theme = useTheme();

  const isInCommittee = !!committeeMembershipData;

  const EnterTime = committeeMembershipData?.EnterTime;

  // TODO : ORL : TRANSLATIONS
  const committeePart = useMemo(() => {
    let committeeMessage;

    if (isInCommittee) {
      committeeMessage = (
        <Typography className={classes.textValue} style={{ color: theme.palette.success.main }}>
          - In committee{' '}
          <Typography className={classes.textValue} style={{ color: theme.palette.text.primary }}>
            (since{' '}
            {Moment.unix(EnterTime || 0)
              .utc()
              .format('DD/MM/YYYY hh:mm')}
            )
          </Typography>
        </Typography>
      );
    } else {
      committeeMessage = <Typography>Not in committee</Typography>;
    }

    return (
      <>
        {/*<Typography className={classes.textField}>Committee membership: </Typography> */}
        {committeeMessage}
      </>
    );
  }, [EnterTime, classes.textValue, isInCommittee, theme.palette.success.main, theme.palette.text.primary]);

  const committeeNote = useMemo(() => {
    if (!isInCommittee) {
      return (
        <>
          <Typography className={classes.textField}>Note: </Typography>
          <Typography className={classes.textValue}>
            only committee members and their delegators are entitled to rewards
          </Typography>
          <br />
        </>
      );
    } else {
      return null;
    }
  }, [classes.textField, classes.textValue, isInCommittee]);

  const registeredSincePart = useMemo(() => {
    if (guardian.RegistrationTime) {
      return (
        <>
          {/*<Typography className={classes.textField}>Registered since: </Typography>*/}
          <Typography className={classes.textValue}>
            {Moment.unix(guardian.RegistrationTime).utc().format('DD/MM/YYYY')}
          </Typography>
          <br />
        </>
      );
    } else {
      return null;
    }
  }, [classes.textValue, guardian.RegistrationTime]);

  const certifiedMessage = guardian.IsCertified ? 'Certified' : 'Not certified';

  return (
    <>
      {/* Committee */}
      {committeePart}
      <br />

      {/* Committee note */}
      {committeeNote}

      {/* Certified */}
      {/*<Typography className={classes.textField}>Certification: </Typography>*/}
      <Typography
        className={classes.textValue}
        style={{ color: guardian.IsCertified ? theme.palette.success.main : theme.palette.warning.main }}
      >
        - {certifiedMessage}
      </Typography>
      <br />

      {/* Registered since */}
      {registeredSincePart}
    </>
  );
});
