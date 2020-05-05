/* eslint-disable @typescript-eslint/camelcase */
import i18n, { Resource } from 'i18next';

export const resources: Resource = {
  jp: {
    translation: {
      fontFamily: 'Meiryo,Hiragino Kaku Gothic ProN,MS PGothic,sans-serif',
      delegateMessage: '手動で他のガーディアンに委任したいですか？<1>ここ</1>をクリック',
      'Participation Instructions Content1':
        'Orbsのユニークな特徴の一つは、ネットワークの管理を他の分散型ネットワーク上で実行しているという点です。この設計があるがため、ネットワークオペレータが自分自身に投票することを防止することができます。これらの権限の分離は、すべてのPoSの投票と委任に外部から分散された保証を提供することに繋がります。',
      'Participation Instructions Content2':
        'これを実現するために、ガーディアンへの投票権委任と、ガーディアンによるバリデータの投票は、標準イーサリアムウォレットを用いたイーサリアムネットワーク上のスマートコントラクトに管理されます。',
      'Delegators Description':
        'ORBSトークンホルダーとして、投票権を信頼するガーディアンに委任してOrbsユニバースに参加することは、参加者自身の判断のもとで行われます。委任いただくことにより、信頼性の高いバリデータがネットワークを運営することに繋がり、ネットワークのセキュリティに寄与することになります。委任は一度しておけば、他のガーディアンに変えない限り、継続的に有効です。委任は、一般的なイーサリアムウォレットを利用して、簡単なイーサリアムトランザクションをするだけで行われます。方法はいくつかあり、参加者にとって最も簡単な方法をご選択いただけます。',
      'Guardians Description':
        '誰でもガーディアンになってバリデータに投票することができます。ガーディアンは、バリデータを評価し、ノード操作を監視し、ネットワークの監査を実行する重要な役割を担っています。ガーディアンになることは、責任と努力が必要です。',
      'Validators Description':
        'バリデータは、Orbsネットワークの運営者です。ブロックの生成と検証に参加し、ブロックの履歴とネットワークの正常運営を遂行してくれます。バリデータは、専門的スキルをもち、ノードのセキュリティを維持するための高水準のサービスを提供することができる能力と接続性を要求されます。',
      'Manual Delegation Description':
        '誰にでも委任することができます。委任された者は、最終的に自分自身と委任者のステークをガーディアンに委任する必要があります。有効なガーディアンに委任した場合にのみ報酬が支払われます。',
      'Your vote has not been delegated yet.': '委任が完了していません。',
      'Your vote has been delegated to': 'こちらのガーディアンに委任済み',
      'Delegate Ethereum Address': '委任したいガーディアンのアドレス',
      Vote: '投票',
      'Check delegation status': '委任状況の確認',
      'Check your delegation status': '委任状況の確認',
      'Your name': 'あなたの名前',
      'Your website': 'あなたのウェブサイト',
      Add: '追加',
      'Your IP Address': 'あなたのIPアドレス',
      'Your Orbs Address': 'あなたのOrbsアドレス',
      'Enter your address in order to check to whom your stake is delegated.':
        'お持ちのアドレスをご入力いただくと、誰に委任しているかが確認できます。',
      Check: '確認',
      Close: '閉じる',
      'Guardians List': 'ガーディアンリスト',
      'Next election round will take place at Ethereum block': '次回の投票実施時のイーサリアムブロック',
      'Participating stake': '全体ステーキング参加量',
      Delegate: '委任する',
      Name: '名前',
      Address: 'アドレス',
      Website: 'ウェブサイト',
      '% in last election': '前回選挙時のシェア（%）',
      'Voted for next elections': '次回選挙への参加権利',
      'Vote Out': '反対票の投票',
      'Keep everyone': '全員をキープ',
      'Guardian did not vote before': '過去に投票しなかったガーディアン',
      'Validators List': 'バリデータリスト',
      'Become a guardian': 'ガーディアンになる',
      'Your most recent vote was against': '最新の投票での反対票',
      'You have not voted yet': '投票が完了していません',
      Home: 'ホーム',
      Guardians: 'ガーディアン',
      Validators: 'バリデータ',
      'Elected Validators': '選出されたバリデータ',
      Rewards: 'リワード',
      Delegators: 'デリゲータ',
      'Delegating using Metamask': 'Metamaskを使って委任',
      'Delegating by sending 0.07 ORBS directly': '0.07ORBSを送信して委任',
      'Delegating using MyCrypto': 'MyCryptoを使って委任',
      'Becoming a Guardian': 'ガーディアンになる',
      'Voting using MyCrypto': 'MyCryptoを使って委任',
      'Becoming a Validator': 'バリデータになる',
      Explore: '詳細',
      'Participation Instructions': '参加方法',
      'Delegated To': '委任先',
      'Guardian voted in previous elections': '前回選挙に投票したガーディアン',
      'Guardian voted for next elections': '次回選挙に投票したガーディアン',
      'Delegation method': '委任方法',
      'Delegation timestamp': '委任タイムスタンプ',
      'Delegation block number': '委任ブロック番号',
      'Rewards & Delegation Info': 'リワードと委任情報',
      'Enter the address': 'アドレスを入力',
      Submit: '確認',
      'Delegation Details': '委任の詳細',
      'The information above corresponds to elections at block number': '上記の情報は、次回の選挙時のブロック番号：',
      'Delegator Reward': 'デリゲータリワード',
      'Guardian Excellency Reward': 'トップガーディアンリワード',
      'Validator Reward': 'バリデータリワード',
      'Total Reward': '合計リワード',
      'Become a validator': 'バリデータになる',
      'Ethereum Address': 'イーサリアムアドレス',
      'Orbs Address': 'Orbsアドレス',
      Stake: 'ステーク',
      Yes: 'Yes',
      No: 'No',
      Distributed: '配布済み',
      'Distribution Event': '配布イベント',
      'Transaction Hash': '取引情報',
      Amount: '数量',
      'Total Distributed': '総配布量',
      "Delegator's ORBS Balance": 'デリゲータのORBS保有数',
      'Last election votes against (%)': '前回投票時の反対票（%）',
      'Manually Delegate Your Stake': '手動でステークを委任する',
      Cancel: 'キャンセル',
      'Display ORBS in metamask': 'ORBSをメタマスクに表示',

      // *************************
      // Well formatted messages
      // *************************
      // Rewards table
      delegatorNonStakedOrbs: 'デリゲータの未ステーキングORBS',
      delegatorStakedOrbs: 'デリゲータのステーキング済みORBS',

      // Alerts
      alert_stakingWithoutGuardian:
        '注意：このアドレスは既にORBSをステーキングしていますが、まだガーディアンを選択していないため、リワードが発生していません',
      alert_notParticipating: '通知：このアドレスにORBSは入っていますが、ステーキングされていません',
      action_goToTetra: '{{tetraLink}}を参照',
      action_youCanStakeYourORBSAndSelectAGuardianWithTetra:
        'ORBSのステーキングとガーディアンの選択は{{tetraLink}}を参照',
      text_tetraName: 'Tetra',
    },
  },
  en: {
    translation: {
      fontFamily: 'Montserrat',
      delegateMessage: 'Want to delegate manually to another address? Click <1>here</1>.',
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
        'You can delegate your stake to anyone. They will need to delegate\ntheir own stake & your stake to a guardian. Only stake delegated to a\nvoting guardian will be rewarded.',

      // *************************
      // Well formatted messages
      // *************************

      // Rewards table
      delegatorNonStakedOrbs: 'Delegator’s  non-staked ORBS',
      delegatorStakedOrbs: 'Delegator’s staked ORBS',

      // Alerts
      alert_stakingWithoutGuardian:
        'Warning - this address has staked ORBS but no selected Guardian. No rewards will be accumulated',
      alert_notParticipating: 'Notice : This address has ORBS but none of them are staked',
      action_goToTetra: 'Go to {{tetraLink}}',
      action_youCanStakeYourORBSAndSelectAGuardianWithTetra:
        'You can stake your ORBS and select a guardian with {{tetraLink}}',
      text_tetraName: 'Tetra',
    },
  },
  ko: {
    translation: {
      fontFamily: 'Montserrat',
      delegateMessage: '직접 다른 주소로 위임하고 싶으신가요? <1>여기를</1> 클릭하세요.',
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
      'Your vote has been delegated to': '다음의 주소로 위임되어 있습니다',
      'Check delegation status': '위임 상태 확인하기',
      'Check your delegation status': '위임 상태를 확인하세요',
      'Enter your address in order to check to whom your stake is delegated.':
        '여러분의 주소를 입력하여 누구에게 위임중인지 확인할 수 있습니다.',
      Check: '확인하기',
      'Delegate Ethereum Address': '위임받을 ETH 주소',
      Vote: '투표하기',
      'Your name': '등록할 이름',
      'Your website': '웹사이트 주소',
      Add: '추가하기',
      'Your IP Address': '노드 IP 주소',
      'Your Orbs Address': 'Orbs 주소',
      Close: '닫기',
      'Guardians List': '가디언 목록',
      'Next election round will take place at Ethereum block': '다음 선거가 예정되어 있는 이더리움 블록번호',
      'Participating stake': '전체 스테이킹 참여수량',
      'Want to delegate manually to another address? Click {{here}}.': '직접 다른 주소로 위임하고 싶으신가요?',
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
      'Your most recent vote was against': '최근 반대표를 다음에 투표하였습니다',
      'You have not voted yet': '아직 투표하지 않았습니다',
      Home: '홈',
      Guardians: '가디언',
      Validators: '밸리데이터',
      'Elected Validators': '선출된 밸리데이터',
      Rewards: '보상조회',
      Delegators: '델리게이터',
      'Delegating using Metamask': '메타마스크(Metamask)를 이용하여 위임하기',
      'Delegating by sending 0.07 ORBS directly': '직접 0.07 ORBS 송금으로 위임하기',
      'Delegating using MyCrypto': '마이크립토(MyCrypto)지갑을 이용하여 위임하기',
      'Becoming a Guardian': '가디언 등록하기',
      'Voting using MyCrypto': '마이크립토(MyCrypto)를 이용하여 투표하기',
      'Becoming a Validator': '밸리데이터 등록하기',
      Explore: '밸리데이터 확인',
      'Participation Instructions': '참여 안내',
      'Delegated To': '위임받은 곳',
      'Guardian voted in previous elections': '위임받은 가디언의 지난 번 투표 여부',
      'Guardian voted for next elections': '위임받은 가디언의 다음 투표 유효성 여부',
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
      Distributed: '배포됨',
      'Distribution Event': '배포 이벤트',
      'Transaction Hash': '트랜잭션 정보',
      Amount: '수량',
      'Total Distributed': '총 배포수량',
      "Delegator's ORBS Balance": '위임한 ORBS 수량',
      'Last election votes against (%)': '지난 선거에서 받은 반대표(%)',
      'Manually Delegate Your Stake': '직접 수동으로 위임하기',
      Cancel: '취소하기',
      'Display ORBS in metamask': '메타마스크에 있는 ORBS 표시',

      // *************************
      // Well formatted messages
      // *************************

      // Rewards table
      delegatorNonStakedOrbs: '스테이킹하고 있지 않는 ORBS',
      delegatorStakedOrbs: '스테이킹 참여 중인 ORBS',

      // Alerts
      alert_stakingWithoutGuardian:
        '주의 - 이 주소는 스테이킹에 하고 있지만 가디언에게 위임하지 않았습니다. 이 경우, 리워드가 적립되지 않습니다',
      alert_notParticipating: '알림: 이 주소는 ORBS를 보유하고 있지만 스테이킹하고 있지 않습니다',
      action_goToTetra: '{{tetraLink}}로 이동',
      action_youCanStakeYourORBSAndSelectAGuardianWithTetra:
        '{{tetraLink}}에서 ORBS스테이킹과 가디언위임 선택이 가능합니다',
      text_tetraName: 'Tetra',
    },
  },
};
