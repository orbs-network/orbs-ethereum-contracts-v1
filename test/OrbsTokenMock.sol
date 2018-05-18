pragma solidity 0.4.23;

import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";


contract OrbsTokenMock is StandardToken {
    function assign(address _account, uint _balance) public {
        balances[_account] = _balance;
    }
}
