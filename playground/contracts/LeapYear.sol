pragma solidity ^0.4.24;

import "../../deprecated-federation/contracts/DateTime.sol";

contract LeapYear {

    function isLeapYear(uint16 year) public view returns (bool) {
        return DateTime.isLeapYear(year);
    }
}
