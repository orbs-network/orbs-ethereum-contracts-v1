pragma solidity ^0.4.25;

import "subscription/contracts/DateTime.sol";

contract LeapYear {

    function isLeapYear(uint16 year) public view returns (bool) {
        return DateTime.isLeapYear(year);
    }
}
