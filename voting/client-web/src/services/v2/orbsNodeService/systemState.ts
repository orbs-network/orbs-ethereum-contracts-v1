/* eslint-disable @typescript-eslint/interface-name-prefix,@typescript-eslint/no-inferrable-types */
export class SystemState {
  TimeSeconds = 0; // UTC seconds
  Timestamp: string = '';
  VirtualChains: VirtualChain[] = [];
  Services: Service[] = [];
  CommitteeNodes: Guardians = {};
  StandByNodes: Guardians = {};
}

export enum HealthLevel {
  Green = 'Green',
  Yellow = 'Yellow',
  Red = 'Red',
}

export interface VirtualChain {
  Id: string;
  Name: string;
  IsCertified: boolean;
  IsCanary: boolean;
  GenesisTimeSeconds: number;
  ExpirationTimeSeconds: number;
  SubscriptionStatus: HealthLevel;
  SubscriptionStatusToolTip: string;
  VirtualChainUrls: VirtualChainUrls;
}

export interface VirtualChainUrls {
  Prism: string;
  Subscription: string;
}

export class Service {
  constructor(readonly Name: string, readonly ServiceUrlName: string, readonly RepositoryPrefix: string) {}
  static VC = new Service('VC', 'vchains', 'https://github.com/orbs-network/orbs-network-go/tree/');
  static Boyar = new Service('Boyar', 'boyar', 'https://github.com/orbs-network/boyarin/tree/');
  static Signer = new Service('Signer', 'signer', 'https://github.com/orbs-network/signer-service/tree/');
  static EthereumWriter = new Service(
    'EthereumWriter',
    'ethereum-writer',
    'https://github.com/orbs-network/ethereum-writer/tree/',
  );
  static Rewards = new Service('Rewards', 'rewards-service', 'https://github.com/orbs-network/rewards-service/tree/');
  static Management = new Service(
    'Management',
    'management-service',
    'https://github.com/orbs-network/management-service/tree/',
  );
}

export interface Guardians {
  [key: string]: Guardian;
}
/// C.F.G : Add 'RegistrationTime' to the procssor.
export interface Guardian {
  EthAddress: string;
  Name: string;
  Ip: string;
  Website: string;
  EffectiveStake: number;
  IsCertified: boolean;
  OrbsAddress: string;
  NodeManagementURL: string;
  NodeVirtualChains: NodeVirtualChains;
  NodeServices: NodeServices;
  NodeReputation: NodeReputation;
  RegistrationTime: number;
  /**
   * In Seconds
   */
  DistributionFrequency: number;
  ParticipationPercentage: number;
  /**
   * Indicates how 'full' the guardian delegation is, under the requirement that he will hold a certain percent of its effective stake.
   */
  Capacity: number;
  DelegatedStake: number;
  SelfStake: number;
}

export interface NodeServiceUrls {
  Status: string;
  Logs: string;
  Version: string;
}

export interface NodeVirtualChainUrls extends NodeServiceUrls {
  Management: string;
}

export interface NodeVirtualChains {
  [key: string]: NodeVirtualChain;
}

export interface NodeVirtualChain {
  StatusMsg: string;
  Status: HealthLevel;
  StatusToolTip: string;
  Timestamp: string;
  Version: string;
  BlockHeight: number;
  BlockHeightToolTip: string;
  ProtocolVersion: number;
  URLs: NodeVirtualChainUrls;
}

export function nodeVirtualChainBuilder(
  urls: NodeVirtualChainUrls,
  statusMsg: string = '',
  status: HealthLevel = HealthLevel.Green,
  statusTooltip: string = '',
  timestamp: string = '',
  version: string = '',
  blockHeight: number = 0,
  blockHeightToolTip: string = '',
  protocolVersion: number = 0,
): NodeVirtualChain {
  return {
    StatusMsg: statusMsg,
    Status: status,
    StatusToolTip: statusTooltip,
    Timestamp: timestamp,
    Version: version,
    BlockHeight: blockHeight,
    BlockHeightToolTip: blockHeightToolTip,
    ProtocolVersion: protocolVersion,
    URLs: urls,
  };
}

export interface NodeServices {
  [key: string]: NodeService;
}

export interface NodeService {
  StatusMsg: string;
  Status: HealthLevel;
  StatusToolTip: string;
  Timestamp: string;
  Version: string;
  URLs: NodeServiceUrls;
}

export function nodeServiceBuilder(
  urls: NodeServiceUrls,
  statusMsg: string = '',
  status: HealthLevel = HealthLevel.Green,
  statusTooltip: string = '',
  timestamp: string = '',
  version: string = '',
): NodeService {
  return {
    StatusMsg: statusMsg,
    Status: status,
    StatusToolTip: statusTooltip,
    Timestamp: timestamp,
    Version: version,
    URLs: urls,
  };
}

export interface NodeReputation {
  NodeVirtualChainReputations: NodeVirtualChainReputations;
  NodeVirtualChainBadReputations: NodeVirtualChainBadReputations;
  ReputationStatus: HealthLevel;
  ReputationToolTip: string;
}

export interface NodeVirtualChainReputations {
  [key: string]: number;
}

export interface NodeVirtualChainBadReputations {
  [key: string]: number;
}
