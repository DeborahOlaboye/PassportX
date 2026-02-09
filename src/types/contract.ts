export type ContractCallStatus = 'pending' | 'confirmed' | 'failed';

export interface BaseContractResponse {
  txId: string;
  status: ContractCallStatus;
}
