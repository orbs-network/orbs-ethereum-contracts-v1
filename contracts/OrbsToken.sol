pragma solidity 0.4.23;

import "zeppelin-solidity/contracts/ownership/HasNoContracts.sol";
import "zeppelin-solidity/contracts/ownership/HasNoTokens.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract OrbsToken is HasNoTokens, HasNoContracts, ERC20 {
    // solhint-disable const-name-snakecase
    string public constant name = "Orbs";
    string public constant symbol = "ORBS";
    uint8 public constant decimals = 18;
    // solhint-enable const-name-snakecase
}
