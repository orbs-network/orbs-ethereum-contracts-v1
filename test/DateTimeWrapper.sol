pragma solidity 0.4.25;

import "../contracts/DateTime.sol";


contract DateTimeWrapper {
    function isLeapYear(uint16 _year) public pure returns (bool) {
        return DateTime.isLeapYear(_year);
    }

    function leapYearsBefore(uint16 _year) public pure returns (uint) {
        return DateTime.leapYearsBefore(_year);
    }

    function getDaysInMonth(uint16 _year, uint8 _month) public pure returns (uint8) {
        return DateTime.getDaysInMonth(_year, _month);
    }

    function getYear(uint _timestamp) public pure returns (uint16) {
        return DateTime.getYear(_timestamp);
    }

    function getMonth(uint256 _timestamp) public pure returns (uint8) {
        return DateTime.getMonth(_timestamp);
    }

    function getDay(uint256 _timestamp) public pure returns (uint8) {
        return DateTime.getDay(_timestamp);
    }

    function getHour(uint256 _timestamp) public pure returns (uint8) {
        return DateTime.getHour(_timestamp);
    }

    function getMinute(uint256 _timestamp) public pure returns (uint8) {
        return DateTime.getMinute(_timestamp);
    }

    function getSecond(uint256 _timestamp) public pure returns (uint8) {
        return DateTime.getSecond(_timestamp);
    }

    function getWeekday(uint _timestamp) public pure returns (uint8) {
        return DateTime.getWeekday(_timestamp);
    }

    function getBeginningOfMonth(uint16 _year, uint8 _month) public pure returns (uint256) {
        return DateTime.getBeginningOfMonth(_year, _month);
    }

    function getNextMonth(uint16 _year, uint8 _month) public pure returns (uint16 year, uint8 month) {
        return DateTime.getNextMonth(_year, _month);
    }

    function toTimestamp(uint16 _year, uint8 _month, uint8 _day) public pure returns (uint) {
        return DateTime.toTimestamp(_year, _month, _day);
    }

    function toTimestampFull(uint16 _year, uint8 _month, uint8 _day, uint8 _hour, uint8 _minutes,
        uint8 _seconds) public pure returns (uint timestamp) {
        return DateTime.toTimestamp(_year, _month, _day, _hour, _minutes, _seconds);
    }
}
