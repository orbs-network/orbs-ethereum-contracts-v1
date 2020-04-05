pragma solidity 0.5.16;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestingERC20 is ERC20 {
    function assign(address _account, uint256 _value) public {
        _burn(_account, balanceOf(_account));
        _mint(_account, _value);
    }
}
