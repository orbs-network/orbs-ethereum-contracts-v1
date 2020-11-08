// TODO : ORL : Read it from a shared library.

export interface IEthereumWriterStatusResponse {
  Status: string;
  Timestamp: string;
  Payload: {
    VchainSyncStatus: string;
    EthereumSyncStatus: string;
    EtherBalance: string;
  };
}
