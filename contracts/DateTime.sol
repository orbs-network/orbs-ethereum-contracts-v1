pragma solidity 0.4.23;

import "zeppelin-solidity/contracts/math/SafeMath.sol";


/// @title Date and Time utilities for Ethereum contracts.
library DateTime {
    using SafeMath for uint256;
    using SafeMath for uint16;
    using SafeMath for uint8;

    struct DT {
        uint16 year;
        uint8 month;
        uint8 day;
        uint8 hour;
        uint8 minute;
        uint8 second;
        uint8 weekday;
    }

    uint public constant SECONDS_IN_DAY = 86400;
    uint public constant SECONDS_IN_YEAR = 31536000;
    uint public constant SECONDS_IN_LEAP_YEAR = 31622400;
    uint public constant DAYS_IN_WEEK = 7;
    uint public constant HOURS_IN_DAY = 24;
    uint public constant MINUTES_IN_HOUR = 60;
    uint public constant SECONDS_IN_HOUR = 3600;
    uint public constant SECONDS_IN_MINUTE = 60;

    uint16 public constant ORIGIN_YEAR = 1970;

    /// @dev Returns whether the specified year is a leap year.
    /// @param _year uint16 The year to check.
    function isLeapYear(uint16 _year) public pure returns (bool) {
        if (_year % 4 != 0) {
            return false;
        }

        if (_year % 100 != 0) {
            return true;
        }

        if (_year % 400 != 0) {
            return false;
        }

        return true;
    }

    /// @dev Returns how many leap years were before the specified year.
    /// @param _year uint16 The year to check.
    function leapYearsBefore(uint16 _year) public pure returns (uint16) {
        _year = uint16(_year.sub(1));
        return uint16(_year.div(4).sub(_year.div(100)).add(_year.div(400)));
    }

    /// @dev Returns how many days are there in a specified month.
    /// @param _year uint16 The year of the month to check.
    /// @param _month uint8 The month to check.
    function getDaysInMonth(uint16 _year, uint8 _month) public pure returns (uint8) {
        if (_month == 1 || _month == 3 || _month == 5 || _month == 7 || _month == 8 || _month == 10 || _month == 12) {
            return 31;
        }

        if (_month == 4 || _month == 6 || _month == 9 || _month == 11) {
            return 30;
        }

        if (isLeapYear(_year)) {
            return 29;
        }

        return 28;
    }

    /// @dev Returns the year of the current UNIX timestamp.
    /// @param _timestamp uint256 The UNIX timestamp to parse.
    function getYear(uint256 _timestamp) public pure returns (uint16 year) {
        uint256 secondsAccountedFor;
        uint16 numLeapYears;

        // Year
        year = uint16(ORIGIN_YEAR.add(_timestamp.div(SECONDS_IN_YEAR)));
        numLeapYears = uint16(leapYearsBefore(year).sub(leapYearsBefore(ORIGIN_YEAR)));

        secondsAccountedFor = secondsAccountedFor.add(SECONDS_IN_LEAP_YEAR.mul(numLeapYears));
        secondsAccountedFor = secondsAccountedFor.add(SECONDS_IN_YEAR.mul((year.sub(ORIGIN_YEAR).sub(numLeapYears))));

        while (secondsAccountedFor > _timestamp) {
            if (isLeapYear(uint16(year.sub(1)))) {
                secondsAccountedFor = secondsAccountedFor.sub(SECONDS_IN_LEAP_YEAR);
            } else {
                secondsAccountedFor = secondsAccountedFor.sub(SECONDS_IN_YEAR);
            }

            year = uint16(year.sub(1));
        }
    }

    /// @dev Returns the month of the current UNIX timestamp.
    /// @param _timestamp uint256 The UNIX timestamp to parse.
    function getMonth(uint256 _timestamp) public pure returns (uint8) {
        return parseTimestamp(_timestamp).month;
    }

    /// @dev Returns the day of the current UNIX timestamp.
    /// @param _timestamp uint256 The UNIX timestamp to parse.
    function getDay(uint256 _timestamp) public pure returns (uint8) {
        return parseTimestamp(_timestamp).day;
    }

    /// @dev Returns the hour of the current UNIX timestamp.
    /// @param _timestamp uint256 The UNIX timestamp to parse.
    function getHour(uint256 _timestamp) public pure returns (uint8) {
        return uint8((_timestamp.div(SECONDS_IN_HOUR)) % HOURS_IN_DAY);
    }

    /// @dev Returns the minutes of the current UNIX timestamp.
    /// @param _timestamp uint256 The UNIX timestamp to parse.
    function getMinute(uint256 _timestamp) public pure returns (uint8) {
        return uint8((_timestamp.div(SECONDS_IN_MINUTE)) % MINUTES_IN_HOUR);
    }

    /// @dev Returns the seconds of the current UNIX timestamp.
    /// @param _timestamp uint256 The UNIX timestamp to parse.
    function getSecond(uint256 _timestamp) public pure returns (uint8) {
        return uint8(_timestamp % SECONDS_IN_MINUTE);
    }

    /// @dev Returns the weekday of the current UNIX timestamp.
    /// @param _timestamp uint256 The UNIX timestamp to parse.
    function getWeekday(uint256 _timestamp) public pure returns (uint8) {
        return uint8((_timestamp.div(SECONDS_IN_DAY).add(4)) % DAYS_IN_WEEK);
    }

    /// @dev Returns the timestamp of the beginning of the month.
    /// @param _month uint8 The month to check.
    /// @param _year uint16 The year of the month to check.
    function getBeginningOfMonth(uint16 _year, uint8 _month) public pure returns (uint256) {
        return toTimestamp(_year, _month, 1);
    }

    /// @dev Returns the timestamp of the beginning of the month.
    /// @param _month uint8 The month to check.
    /// @param _year uint16 The year of the month to check.
    function getNextMonth(uint16 _year, uint8 _month) public pure returns (uint16 year, uint8 month) {
        if (_month == 12) {
            year = uint16(_year.add(1));
            month = 1;
        } else {
            year = _year;
            month = uint8(_month.add(1));
        }
    }

    /// @dev Converts date to timestamp.
    /// @param _year uint16 The year of the date.
    /// @param _month uint8 The month of the date.
    function toTimestamp(uint16 _year, uint8 _month) public pure returns (uint) {
        return toTimestamp(_year, _month, 0, 0, 0, 0);
    }

    /// @dev Converts date to timestamp.
    /// @param _year uint16 The year of the date.
    /// @param _month uint8 The month of the date.
    /// @param _day uint8 The day of the date.
    function toTimestamp(uint16 _year, uint8 _month, uint8 _day) public pure returns (uint) {
        return toTimestamp(_year, _month, _day, 0, 0, 0);
    }

    /// @dev Converts date to timestamp.
    /// @param _year uint16 The year of the date.
    /// @param _month uint8 The month of the date.
    /// @param _day uint8 The day of the date.
    /// @param _hour uint8 The hour of the date.
    /// @param _minutes uint8 The minutes of the date.
    /// @param _seconds uint8 The seconds of the date.
    function toTimestamp(uint16 _year, uint8 _month, uint8 _day, uint8 _hour, uint8 _minutes,
        uint8 _seconds) public pure returns (uint256 timestamp) {
        uint16 i;

        // Year
        for (i = ORIGIN_YEAR; i < _year; ++i) {
            if (isLeapYear(i)) {
                timestamp = timestamp.add(SECONDS_IN_LEAP_YEAR);
            } else {
                timestamp = timestamp.add(SECONDS_IN_YEAR);
            }
        }

        // Month
        uint8[12] memory monthDayCounts;
        monthDayCounts[0] = 31;
        if (isLeapYear(_year)) {
            monthDayCounts[1] = 29;
        } else {
            monthDayCounts[1] = 28;
        }
        monthDayCounts[2] = 31;
        monthDayCounts[3] = 30;
        monthDayCounts[4] = 31;
        monthDayCounts[5] = 30;
        monthDayCounts[6] = 31;
        monthDayCounts[7] = 31;
        monthDayCounts[8] = 30;
        monthDayCounts[9] = 31;
        monthDayCounts[10] = 30;
        monthDayCounts[11] = 31;

        for (i = 1; i < _month; ++i) {
            timestamp = timestamp.add(SECONDS_IN_DAY.mul(monthDayCounts[i.sub(1)]));
        }

        // Day
        timestamp = timestamp.add(SECONDS_IN_DAY.mul(_day == 0 ? 0 : _day.sub(1)));

        // Hour
        timestamp = timestamp.add(SECONDS_IN_HOUR.mul(_hour));

        // Minutes
        timestamp = timestamp.add(SECONDS_IN_MINUTE.mul(_minutes));

        // Seconds
        timestamp = timestamp.add(_seconds);
    }

    /// @dev Parses a UNIX timestamp to a DT struct.
    /// @param _timestamp uint256 The UNIX timestamp to parse.
    function parseTimestamp(uint256 _timestamp) internal pure returns (DT dt) {
        uint256 secondsAccountedFor;
        uint256 buf;
        uint8 i;

        // Year
        dt.year = getYear(_timestamp);
        buf = leapYearsBefore(dt.year) - leapYearsBefore(ORIGIN_YEAR);

        secondsAccountedFor = secondsAccountedFor.add(SECONDS_IN_LEAP_YEAR.mul(buf));
        secondsAccountedFor = secondsAccountedFor.add(SECONDS_IN_YEAR.mul((dt.year.sub(ORIGIN_YEAR).sub(buf))));

        // Month
        uint256 secondsInMonth;
        for (i = 1; i <= 12; ++i) {
            secondsInMonth = SECONDS_IN_DAY.mul(getDaysInMonth(dt.year, i));
            if (secondsInMonth.add(secondsAccountedFor) > _timestamp) {
                dt.month = i;
                break;
            }
            secondsAccountedFor = secondsAccountedFor.add(secondsInMonth);
        }

        // Day
        for (i = 1; i <= getDaysInMonth(dt.year, dt.month); ++i) {
            if (SECONDS_IN_DAY.add(secondsAccountedFor) > _timestamp) {
                dt.day = i;
                break;
            }
            secondsAccountedFor = secondsAccountedFor.add(SECONDS_IN_DAY);
        }

        // Hour
        dt.hour = getHour(_timestamp);

        // Minute
        dt.minute = getMinute(_timestamp);

        // Second
        dt.second = getSecond(_timestamp);

        // Day of week.
        dt.weekday = getWeekday(_timestamp);
    }
}
