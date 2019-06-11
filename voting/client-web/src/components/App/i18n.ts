import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// the translations
// (tip move them in a JSON file and import them)
const resources = {
  en: {
    translation: {
      'Participation Instructions Content1':
        'One of the unique features of Orbs, is that the administration of the\nnetwork’s institutes is performed on another decentralized network. With\nthis architecture, we can avoid letting network operators execute the\nprocedures for their own election. This separation of powers provides an\nexternal decentralized guarantee to all PoS votes and delegations.',
      'Participation Instructions Content2':
        'To make this possible, delegation of voting power to guardians, and\nvoting on validators by the guardians are managed by smart contracts on\nthe Ethereum network using standard Ethereum wallets.',
      'Delegators Description':
        'As an ORBS token holder, it is your responsibility to participate in the Orbs Universe by delegating your voting power to a Guardian you trust. This contributes to the network security by making sure a trustworthy group of validators is running the network.\nDelegation only needs to be performed once and remains valid unless modified to a different Guardian. Delegation takes place by making a simple Ethereum transaction using a standard Ethereum wallet. There are multiple ways to delegate, choose the easiest one for you:',
      'Guardians Description':
        'Anyone can become an active Guardian and participate in the daily voting to approve Validators. Guardians are key players that review validators, monitor their operations and audit the network. Being a Guardian requires commitment and effort.',
      'Validators Description':
        'Validators run Orbs network. They participate in the block creation and validation and maintain the state and block history. Validators are skilled professionals, capable of maintaining their node security, availability and connectivity and providing the required quality of service.',
      'Manual Delegation Description':
        'You can delegate your stake to anyone. They will need to delegate\ntheir own stake & your stake to a guardian. Only stake delegated to a\nvoting guardian will be rewarded.'
    }
  },
  ko: {
    translation: {
      'Participation Instructions Content1':
        'Orbs의 고유 기능 중 하나는, 네트워크 기관 관리가 다른 탈중앙 네트워크에서 수행된다는 점입니다. 이 설계를 바탕으로, 네트워크 운영자가 자기 자신에게 투표하는 것을 방지할 수 있습니다. 이러한 권한의 분리는 모든 PoS 투표와 위임에 대한 외부의 분산된 보증을 제공합니다.',
      'Participation Instructions Content2':
        '이를 실현하기 위해서, 가디언에게로의 투표권 위임과,  밸리데이터에 대한 가디언의 투표는 표준 이더리움 지갑을 이용한 이더리움 네트워크에서의 스마트 컨트랙트로 관리됩니다.',
      'Delegators Description':
        'ORBS 토큰 홀더로서, 투표권을 신뢰하는 가디언에게 위임하여 Orbs 생태계에 참여하는 것은 본인의 책임하에 이루어집니다. 위임함으로써 믿을만한 밸리데이터 그룹이 네트워크를 운영하게 하여 네트워크 보안에 기여하게 됩니다.\n위임작업은 한 번만 해두면 다른 가디언으로 바꾸지 않는 한 계속 유효합니다. 위임작업은 표준 이더리움 지갑을 이용하여 간단한 이더리움 트랜잭션만으로 이루어집니다. 위임하는 여러 방법들이 있지만, 여러분에게 가장 쉬운 방법을 선택하세요.',
      'Guardians Description':
        '누구나 가디언이 되어 밸리데이터에게 매일 투표할 수 있습니다. 가디언은 밸리데이터를 확인하고 노드 운영을 감시하고 네트워크 감사를 수행하는 핵심 역할을 맡고 있습니다. 가디언이 되는 것에는 헌신과 노력이 필요합니다.',
      'Validators Description':
        '밸리데이터는 Orbs 네트워크를 운영합니다. 이들은 블록 생성과 검증에 참여하며 블록 히스토리와 네트워크를 유지시켜줍니다. 밸리데이터는 전문적 스킬과 노드 보안 유지 능력, 고수준의 서비스를 제공할 수 있는 능력과 연결성을 지녀야 합니다.',
      'Manual Delegation Description':
        '누구에게나 위임할 수 있습니다. 위임받은 자는 최종적으로 자신과 여러분의 자산을 가디언에게 위임해야합니다. 등록된 가디언에게 위임한 경우에만 보상이 지급됩니다.',
      'Your vote has not been delegated yet.': '아직 위임되지 않았습니다.',
      'Your vote has been delegated to ': '다음의 주소로 위임되어 있습니다 ',
      'Check delegation status': '위임 상태 확인하기',
      'Check your delegation status': '위임 상태를 확인하세요',
      'Enter your address in order to check to whom your stake is delegated.':
        '여러분의 주소를 입력하여 누구에게 위임중인지 확인할 수 있습니다.',
      Check: '확인하기',
      Close: '닫기',
      'Guardians List': '가디언즈 목록',
      'Next election round will take place at Ethereum block':
        '다음 선거가 예정되어 있는 이더리움 블록번호',
      'Participating stake': '전체 스테이킹 참여수량',
      'Want to delegate manually to another address?':
        '직접 다른 주소로 위임하고 싶으신가요?',
      'Click here': '여기를 클릭하세요',
      Delegate: '위임하기',
      Name: '이름',
      Address: '주소',
      Website: '웹사이트',
      '% in last election': '지난 선거 점유율(%)',
      'Voted for next elections': '다음 투표 완료 여부',
      'Vote Out': '반대표 투표',
      'Keep everyone': '전체 유지 투표',
      'Guardian did not vote before': '가디언이 투표하지 않았습니다.',
      'Validators List': '밸리데이터 목록',
      'Become a guardian': '가디언 등록하기',
      'Your most recent vote was against':
        '최근 반대표를 다음에 투표하였습니다',
      'You have not voted yet': '아직 투표하지 않았습니다',
      Home: '홈',
      Guardians: '가디언즈',
      Validators: '밸리데이터',
      'Elected Validators': '선출된 밸리데이터',
      Rewards: '보상조회',
      Delegators: '델리게이터',
      'Delegating using Metamask': '메타마스크(Metamask)를 이용하여 위임하기',
      'Delegating by sending 0.07 ORBS directly':
        '직접 0.07 ORBS 송금으로 위임하기',
      'Delegating using MyCrypto':
        '마이크립토(MyCrypto)지갑을 이용하여 위임하기',
      'Becoming a Guardian': '가디언 등록하기',
      'Voting using MyCrypto': '마이크립토(MyCrypto)를 이용하여 투표하기',
      'Becoming a Validator': '밸리데이터 등록하기',
      Explore: '밸리데이터 확인',
      'Participation Instructions': '참여 안내',
      'Delegated To': '위임받은 곳',
      'Guardian voted in previous elections':
        '위임받은 가디언의 지난 번 투표 여부',
      'Guardian voted for next elections':
        '위임받은 가디언의 다음 투표 유효성 여부',
      'Delegation method': '위임한 방법',
      'Delegation timestamp': '위임했던 실제시간',
      'Delegation block number': '위임했던 블록번호',
      'Rewards & Delegation Info': '보상 및 위임 정보',
      'Enter the address': '주소를 입력해주세요',
      Submit: '제출',
      'Delegation Details': '자세한 위임 현황',
      'The information above corresponds to elections at block number':
        '위 정보는 다음 블록에서 진행된 투표 기준으로 제공됩니다',
      'Delegator Reward': '델리게이터 보상',
      'Guardian Excellency Reward': '우수 가디언 보상',
      'Validator Reward': '밸리데이터 보상',
      'Total Reward': '전체 보상',
      'Become a validator': '밸리데이터 등록하기',
      'Ethereum Address': '이더리움 주소',
      'Orbs Address': 'Orbs 주소',
      Stake: '스테이킹 수량',
      Yes: 'Yes',
      No: 'No',
      "Delegator's ORBS Balance": '위임한 ORBS 수량',
      'Last election votes against (%)': '지난 선거에서 받은 반대표(%)',
      'Manually Delegate Your Stake': '직접 수동으로 위임하기',
      Cancel: '취소하기'
    }
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: 'en',

    keySeparator: false, // we do not use keys in form messages.welcome

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
