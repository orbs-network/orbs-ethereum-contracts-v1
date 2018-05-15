pragma solidity 0.4.23;

import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "../contracts/OrbsToken.sol";


contract OrbsTokenMock is OrbsToken, StandardToken {
    function assign(address _account, uint _balance) public {
        balances[_account] = _balance;
    }
}
