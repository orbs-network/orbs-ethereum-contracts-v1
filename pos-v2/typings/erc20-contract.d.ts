declare namespace Contracts {
    import TransactionDetails = Truffle.TransactionDetails;
    import TransactionResponse = Truffle.TransactionResponse;

    export interface ERC20Contract extends Contract {
        assign(to: string, amount: number|BN, params?: TransactionDetails): Promise<TransactionResponse>
        approve(address: string, firstPayment: number|BN, params?: TransactionDetails): Promise<TransactionResponse>
        balanceOf(address: string, params?: TransactionDetails): Promise<string>
    }
}


