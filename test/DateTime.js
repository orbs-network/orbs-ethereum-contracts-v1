import chai from 'chai';
import dirtyChai from 'dirty-chai';

const { expect } = chai;
chai.use(dirtyChai);

const DateTime = artifacts.require('./DateTime.sol');

contract('DateTime', () => {
  let dateTime;

  beforeEach(async () => {
    dateTime = await DateTime.new();
  });

  describe('getDay', async () => {
    [
      // Non leap year.
      { input: 0, res: 1 },
      { input: 2678399, res: 31 },
      { input: 2678400, res: 1 },
      { input: 5097599, res: 28 },
      { input: 5097600, res: 1 },
      { input: 7775999, res: 31 },
      { input: 7776000, res: 1 },
      { input: 10367999, res: 30 },
      { input: 10368000, res: 1 },
      { input: 13046399, res: 31 },
      { input: 13046400, res: 1 },
      { input: 15638399, res: 30 },
      { input: 15638400, res: 1 },
      { input: 18316799, res: 31 },
      { input: 18316800, res: 1 },
      { input: 20995199, res: 31 },
      { input: 20995200, res: 1 },
      { input: 23587199, res: 30 },
      { input: 23587200, res: 1 },
      { input: 26265599, res: 31 },
      { input: 26265600, res: 1 },
      { input: 28857599, res: 30 },
      { input: 28857600, res: 1 },
      { input: 31535999, res: 31 },
      { input: 31536000, res: 1 },

      // Leap Year
      { input: 63071999, res: 31 }, // Dec 31 1971
      { input: 63072000, res: 1 }, // Jan 1 1972
      { input: 65750399, res: 31 },
      { input: 65750400, res: 1 }, // Feb 1 1972
      { input: 68255999, res: 29 },
      { input: 68256000, res: 1 }, // Mar 1 1972
      { input: 70934399, res: 31 },
      { input: 70934400, res: 1 }, // Apr 1 1972
      { input: 73526399, res: 30 },
      { input: 73526400, res: 1 }, // May 1 1972
      { input: 76204799, res: 31 },
      { input: 76204800, res: 1 }, // Jun 1 1972
      { input: 78796799, res: 30 },
      { input: 78796800, res: 1 }, // Jul 1 1972
      { input: 81475199, res: 31 },
      { input: 81475200, res: 1 }, // Aug 1 1972
      { input: 84153599, res: 31 },
      { input: 84153600, res: 1 }, // Sep 1 1972
      { input: 86745599, res: 30 },
      { input: 86745600, res: 1 }, // Oct 1 1972
      { input: 89423999, res: 31 },
      { input: 89424000, res: 1 }, // Nov 1 1972
      { input: 92015999, res: 30 },
      { input: 92016000, res: 1 }, // Dec 1 1972
      { input: 94694399, res: 31 },
      { input: 94694400, res: 1 }, // Jan 1 1972
    ].forEach((spec) => {
      const { input, res } = spec;

      it(`should return ${res} for ${input}`, async () => {
        expect(await dateTime.getDay.call(input)).to.be.bignumber.equal(res);
      });
    });
  });

  describe('getHour', async () => {
    [
      { input: 63071999, res: 23 },
      { input: 63072000, res: 0 },
      { input: 63075599, res: 0 },
      { input: 63075600, res: 1 },
      { input: 63079199, res: 1 },
      { input: 63079200, res: 2 },
      { input: 63082799, res: 2 },
      { input: 63082800, res: 3 },
      { input: 63086399, res: 3 },
      { input: 63086400, res: 4 },
      { input: 63089999, res: 4 },
      { input: 63090000, res: 5 },
      { input: 63093599, res: 5 },
      { input: 63093600, res: 6 },
      { input: 63097199, res: 6 },
      { input: 63097200, res: 7 },
      { input: 63100799, res: 7 },
      { input: 63100800, res: 8 },
      { input: 63104399, res: 8 },
      { input: 63104400, res: 9 },
      { input: 63107999, res: 9 },
      { input: 63108000, res: 10 },
      { input: 63111599, res: 10 },
      { input: 63111600, res: 11 },
      { input: 63115199, res: 11 },
      { input: 63115200, res: 12 },
      { input: 63118799, res: 12 },
      { input: 63118800, res: 13 },
      { input: 63122399, res: 13 },
      { input: 63122400, res: 14 },
      { input: 63125999, res: 14 },
      { input: 63126000, res: 15 },
      { input: 63129599, res: 15 },
      { input: 63129600, res: 16 },
      { input: 63133199, res: 16 },
      { input: 63133200, res: 17 },
      { input: 63136799, res: 17 },
      { input: 63136800, res: 18 },
      { input: 63140399, res: 18 },
      { input: 63140400, res: 19 },
      { input: 63143999, res: 19 },
      { input: 63144000, res: 20 },
      { input: 63147599, res: 20 },
      { input: 63147600, res: 21 },
      { input: 63151199, res: 21 },
      { input: 63151200, res: 22 },
      { input: 63154799, res: 22 },
      { input: 63154800, res: 23 },
      { input: 63158400, res: 0 },
    ].forEach((spec) => {
      const { input, res } = spec;

      it(`should return ${res} for ${input}`, async () => {
        expect(await dateTime.getHour.call(input)).to.be.bignumber.equal(res);
      });
    });
  });

  describe('isLeapYear', async () => {
    const LEAP_YEARS = [
      1972, 1976, 1980, 1984, 1988, 1992, 1996, 2000, 2004, 2008, 2012, 2016, 2020, 2024, 2028, 2032, 2036, 2040, 2044,
      2048, 2052, 2056, 2060, 2064, 2068, 2072, 2076, 2080, 2084, 2088, 2092, 2096, 2104, 2108, 2112, 2116, 2120, 2124,
      2128, 2132, 2136, 2140, 2144, 2148, 2152, 2156, 2160, 2164, 2168, 2172, 2176, 2180, 2184, 2188, 2192, 2196, 2204,
    ];

    [...Array(234).keys()].map(i => i + 1970).forEach((year) => {
      const leap = LEAP_YEARS.indexOf(year) !== -1;

      it(`${year} should ${leap ? 'be' : 'not be'} a leap year`, async () => {
        expect(await dateTime.isLeapYear.call(year)).to.be.eql(leap);
      });
    });
  });

  describe('getMinute', async () => {
    [
      { input: 63071999, res: 59 },
      { input: 63072000, res: 0 },
      { input: 63072059, res: 0 },
      { input: 63072060, res: 1 },
      { input: 63072119, res: 1 },
      { input: 63072120, res: 2 },
      { input: 63072179, res: 2 },
      { input: 63072180, res: 3 },
      { input: 63072239, res: 3 },
      { input: 63072240, res: 4 },
      { input: 63072299, res: 4 },
      { input: 63072300, res: 5 },
      { input: 63072359, res: 5 },
      { input: 63072360, res: 6 },
      { input: 63072419, res: 6 },
      { input: 63072420, res: 7 },
      { input: 63072479, res: 7 },
      { input: 63072480, res: 8 },
      { input: 63072539, res: 8 },
      { input: 63072540, res: 9 },
      { input: 63072599, res: 9 },
      { input: 63072600, res: 10 },
      { input: 63072659, res: 10 },
      { input: 63072660, res: 11 },
      { input: 63072719, res: 11 },
      { input: 63072720, res: 12 },
      { input: 63072779, res: 12 },
      { input: 63072780, res: 13 },
      { input: 63072839, res: 13 },
      { input: 63072840, res: 14 },
      { input: 63072899, res: 14 },
      { input: 63072900, res: 15 },
      { input: 63072959, res: 15 },
      { input: 63072960, res: 16 },
      { input: 63073019, res: 16 },
      { input: 63073020, res: 17 },
      { input: 63073079, res: 17 },
      { input: 63073080, res: 18 },
      { input: 63073139, res: 18 },
      { input: 63073140, res: 19 },
      { input: 63073199, res: 19 },
      { input: 63073200, res: 20 },
      { input: 63073259, res: 20 },
      { input: 63073260, res: 21 },
      { input: 63073319, res: 21 },
      { input: 63073320, res: 22 },
      { input: 63073379, res: 22 },
      { input: 63073380, res: 23 },
      { input: 63073439, res: 23 },
      { input: 63073440, res: 24 },
      { input: 63073499, res: 24 },
      { input: 63073500, res: 25 },
      { input: 63073559, res: 25 },
      { input: 63073560, res: 26 },
      { input: 63073619, res: 26 },
      { input: 63073620, res: 27 },
      { input: 63073679, res: 27 },
      { input: 63073680, res: 28 },
      { input: 63073739, res: 28 },
      { input: 63073740, res: 29 },
      { input: 63073799, res: 29 },
      { input: 63073800, res: 30 },
      { input: 63073859, res: 30 },
      { input: 63073860, res: 31 },
      { input: 63073919, res: 31 },
      { input: 63073920, res: 32 },
      { input: 63073979, res: 32 },
      { input: 63073980, res: 33 },
      { input: 63074039, res: 33 },
      { input: 63074040, res: 34 },
      { input: 63074099, res: 34 },
      { input: 63074100, res: 35 },
      { input: 63074159, res: 35 },
      { input: 63074160, res: 36 },
      { input: 63074219, res: 36 },
      { input: 63074220, res: 37 },
      { input: 63074279, res: 37 },
      { input: 63074280, res: 38 },
      { input: 63074339, res: 38 },
      { input: 63074340, res: 39 },
      { input: 63074399, res: 39 },
      { input: 63074400, res: 40 },
      { input: 63074459, res: 40 },
      { input: 63074460, res: 41 },
      { input: 63074519, res: 41 },
      { input: 63074520, res: 42 },
      { input: 63074579, res: 42 },
      { input: 63074580, res: 43 },
      { input: 63074639, res: 43 },
      { input: 63074640, res: 44 },
      { input: 63074699, res: 44 },
      { input: 63074700, res: 45 },
      { input: 63074759, res: 45 },
      { input: 63074760, res: 46 },
      { input: 63074819, res: 46 },
      { input: 63074820, res: 47 },
      { input: 63074879, res: 47 },
      { input: 63074880, res: 48 },
      { input: 63074939, res: 48 },
      { input: 63074940, res: 49 },
      { input: 63074999, res: 49 },
      { input: 63075000, res: 50 },
      { input: 63075059, res: 50 },
      { input: 63075060, res: 51 },
      { input: 63075119, res: 51 },
      { input: 63075120, res: 52 },
      { input: 63075179, res: 52 },
      { input: 63075180, res: 53 },
      { input: 63075239, res: 53 },
      { input: 63075240, res: 54 },
      { input: 63075299, res: 54 },
      { input: 63075300, res: 55 },
      { input: 63075359, res: 55 },
      { input: 63075360, res: 56 },
      { input: 63075419, res: 56 },
      { input: 63075420, res: 57 },
      { input: 63075479, res: 57 },
      { input: 63075480, res: 58 },
      { input: 63075539, res: 58 },
      { input: 63075540, res: 59 },
      { input: 63075599, res: 59 },
    ].forEach((spec) => {
      const { input, res } = spec;

      it(`should return ${res} for ${input}`, async () => {
        expect(await dateTime.getMinute.call(input)).to.be.bignumber.equal(res);
      });
    });
  });

  describe('getMonth', async () => {
    [
      // Non leap year.
      { input: 0, res: 1 },
      { input: 2678399, res: 1 },
      { input: 2678400, res: 2 },
      { input: 5097599, res: 2 },
      { input: 5097600, res: 3 },
      { input: 7775999, res: 3 },
      { input: 7776000, res: 4 },
      { input: 10367999, res: 4 },
      { input: 10368000, res: 5 },
      { input: 13046399, res: 5 },
      { input: 13046400, res: 6 },
      { input: 15638399, res: 6 },
      { input: 15638400, res: 7 },
      { input: 18316799, res: 7 },
      { input: 18316800, res: 8 },
      { input: 20995199, res: 8 },
      { input: 20995200, res: 9 },
      { input: 23587199, res: 9 },
      { input: 23587200, res: 10 },
      { input: 26265599, res: 10 },
      { input: 26265600, res: 11 },
      { input: 28857599, res: 11 },
      { input: 28857600, res: 12 },
      { input: 31535999, res: 12 },
      { input: 31536000, res: 1 },

      // Leap Year
      { input: 63071999, res: 12 },
      { input: 63072000, res: 1 },
      { input: 65750399, res: 1 },
      { input: 65750400, res: 2 },
      { input: 68255999, res: 2 },
      { input: 68256000, res: 3 },
      { input: 70934399, res: 3 },
      { input: 70934400, res: 4 },
      { input: 73526399, res: 4 },
      { input: 73526400, res: 5 },
      { input: 76204799, res: 5 },
      { input: 76204800, res: 6 },
      { input: 78796799, res: 6 },
      { input: 78796800, res: 7 },
      { input: 81475199, res: 7 },
      { input: 81475200, res: 8 },
      { input: 84153599, res: 8 },
      { input: 84153600, res: 9 },
      { input: 86745599, res: 9 },
      { input: 86745600, res: 10 },
      { input: 89423999, res: 10 },
      { input: 89424000, res: 11 },
      { input: 92015999, res: 11 },
      { input: 92016000, res: 12 },
      { input: 94694399, res: 12 },
      { input: 94694400, res: 1 },
    ].forEach((spec) => {
      const { input, res } = spec;

      it(`should return ${res} for ${input}`, async () => {
        expect(await dateTime.getMonth.call(input)).to.be.bignumber.equal(res);
      });
    });
  });

  describe('getSecond', async () => {
    [
      { input: 63071999, res: 59 },
      { input: 63072000, res: 0 },
      { input: 63072001, res: 1 },
      { input: 63072002, res: 2 },
      { input: 63072003, res: 3 },
      { input: 63072004, res: 4 },
      { input: 63072005, res: 5 },
      { input: 63072006, res: 6 },
      { input: 63072007, res: 7 },
      { input: 63072008, res: 8 },
      { input: 63072009, res: 9 },
      { input: 63072010, res: 10 },
      { input: 63072011, res: 11 },
      { input: 63072012, res: 12 },
      { input: 63072013, res: 13 },
      { input: 63072014, res: 14 },
      { input: 63072015, res: 15 },
      { input: 63072016, res: 16 },
      { input: 63072017, res: 17 },
      { input: 63072018, res: 18 },
      { input: 63072019, res: 19 },
      { input: 63072020, res: 20 },
      { input: 63072021, res: 21 },
      { input: 63072022, res: 22 },
      { input: 63072023, res: 23 },
      { input: 63072024, res: 24 },
      { input: 63072025, res: 25 },
      { input: 63072026, res: 26 },
      { input: 63072027, res: 27 },
      { input: 63072028, res: 28 },
      { input: 63072029, res: 29 },
      { input: 63072030, res: 30 },
      { input: 63072031, res: 31 },
      { input: 63072032, res: 32 },
      { input: 63072033, res: 33 },
      { input: 63072034, res: 34 },
      { input: 63072035, res: 35 },
      { input: 63072036, res: 36 },
      { input: 63072037, res: 37 },
      { input: 63072038, res: 38 },
      { input: 63072039, res: 39 },
      { input: 63072040, res: 40 },
      { input: 63072041, res: 41 },
      { input: 63072042, res: 42 },
      { input: 63072043, res: 43 },
      { input: 63072044, res: 44 },
      { input: 63072045, res: 45 },
      { input: 63072046, res: 46 },
      { input: 63072047, res: 47 },
      { input: 63072048, res: 48 },
      { input: 63072049, res: 49 },
      { input: 63072050, res: 50 },
      { input: 63072051, res: 51 },
      { input: 63072052, res: 52 },
      { input: 63072053, res: 53 },
      { input: 63072054, res: 54 },
      { input: 63072055, res: 55 },
      { input: 63072056, res: 56 },
      { input: 63072057, res: 57 },
      { input: 63072058, res: 58 },
      { input: 63072059, res: 59 },
      { input: 63072060, res: 0 },
    ].forEach((spec) => {
      const { input, res } = spec;

      it(`should return ${res} for ${input}`, async () => {
        expect(await dateTime.getSecond.call(input)).to.be.bignumber.equal(res);
      });
    });
  });

  describe('getBeginningOfMonth', async () => {
    [
      {
        date: { year: 1970, month: 1 },
        res: 0,
      },
      {
        date: { year: 1970, month: 12 },
        res: 28857600,
      },
      {
        date: { year: 2018, month: 4 },
        res: 1522540800,
      },
      {
        date: { year: 1999, month: 2 },
        res: 917827200,
      },
      {
        date: { year: 2018, month: 11 },
        res: 1541030400,
      },
    ].forEach((spec) => {
      const { date, res } = spec;

      it(`should return ${res} for ${JSON.stringify(date)}`, async () => {
        expect(await dateTime.getBeginningOfMonth.call(date.year, date.month)).to.be.bignumber.equal(res);
      });
    });
  });

  describe('getNextMonth', async () => {
    [
      {
        date: { year: 1970, month: 1 },
        res: { year: 1970, month: 2 },
      },
      {
        date: { year: 1970, month: 12 },
        res: { year: 1971, month: 1 },
      },
      {
        date: { year: 2018, month: 4 },
        res: { year: 2018, month: 5 },
      },
      {
        date: { year: 1989, month: 2 },
        res: { year: 1989, month: 3 },
      },
      {
        date: { year: 2018, month: 12 },
        res: { year: 2019, month: 1 },
      },
    ].forEach((spec) => {
      const { date, res } = spec;

      it(`should return ${JSON.stringify(res)} for ${JSON.stringify(date)}`, async () => {
        const nextMonth = await dateTime.getNextMonth.call(date.year, date.month);
        expect(nextMonth[0]).to.be.bignumber.equal(res.year);
        expect(nextMonth[1]).to.be.bignumber.equal(res.month);
      });
    });
  });

  describe('DateToUnix', async () => {
    [
      {
        date: {
          year: 1970, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0,
        },
        res: 0,
      },
      {
        date: {
          year: 1970, month: 12, day: 31, hours: 23, minutes: 59, seconds: 59,
        },
        res: 31535999,
      },
      {
        date: {
          year: 1971, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0,
        },
        res: 31536000,
      },
      {
        date: {
          year: 1971, month: 1, day: 0, hours: 0, minutes: 0, seconds: 0,
        },
        res: 31536000,
      },
      {
        date: {
          year: 2016, month: 2, day: 29, hours: 23, minutes: 59, seconds: 59,
        },
        res: 1456790399,
      },
      {
        date: {
          year: 2016, month: 3, day: 1, hours: 0, minutes: 0, seconds: 0,
        },
        res: 1456790400,
      },
    ].forEach((spec) => {
      const { date, res } = spec;

      it(`should return ${JSON.stringify(res)} for ${JSON.stringify(date)}`, async () => {
        if (!date.hours && !date.minutes && !date.seconds) {
          expect(await dateTime.DateToUnix.call(date.year, date.month, date.day)).to.be.bignumber.equal(res);
        } else {
          expect(await dateTime.DateTimeToUnix.call(date.year, date.month, date.day, date.hours, date.minutes,
            date.seconds)).to.be.bignumber.equal(res);
        }
      });
    });
  });

  describe('getWeekday', async () => {
    [
      { input: 67737599, res: 3 },
      { input: 67737600, res: 4 },
      { input: 67823999, res: 4 },
      { input: 67824000, res: 5 },
      { input: 67910399, res: 5 },
      { input: 67910400, res: 6 },
      { input: 67996799, res: 6 },
      { input: 67996800, res: 0 },
      { input: 68083199, res: 0 },
      { input: 68083200, res: 1 },
      { input: 68169599, res: 1 },
      { input: 68169600, res: 2 },
      { input: 68255999, res: 2 },
      { input: 68256000, res: 3 },
      { input: 68342399, res: 3 },
      { input: 68342400, res: 4 },
    ].forEach((spec) => {
      const { input, res } = spec;

      it(`should return ${res} for ${input}`, async () => {
        expect(await dateTime.getWeekday.call(input)).to.be.bignumber.equal(res);
      });
    });
  });

  describe('getWeekday', async () => {
    [
      { input: 0, res: 1970 },
      { input: 31536000, res: 1971 },
      { input: 31535999, res: 1970 },
      { input: 63072000, res: 1972 },
      { input: 63071999, res: 1971 },
      { input: 94694400, res: 1973 },
      { input: 94694399, res: 1972 },
      { input: 126230400, res: 1974 },
      { input: 126230399, res: 1973 },
      { input: 157766400, res: 1975 },
      { input: 157766399, res: 1974 },
      { input: 189302400, res: 1976 },
      { input: 189302399, res: 1975 },
      { input: 220924800, res: 1977 },
      { input: 220924799, res: 1976 },
      { input: 252460800, res: 1978 },
      { input: 252460799, res: 1977 },
      { input: 283996800, res: 1979 },
      { input: 283996799, res: 1978 },
      { input: 315532800, res: 1980 },
      { input: 315532799, res: 1979 },
      { input: 347155200, res: 1981 },
      { input: 347155199, res: 1980 },
      { input: 378691200, res: 1982 },
      { input: 378691199, res: 1981 },
      { input: 410227200, res: 1983 },
      { input: 410227199, res: 1982 },
      { input: 441763200, res: 1984 },
      { input: 441763199, res: 1983 },
      { input: 473385600, res: 1985 },
      { input: 473385599, res: 1984 },
      { input: 504921600, res: 1986 },
      { input: 504921599, res: 1985 },
      { input: 536457600, res: 1987 },
      { input: 536457599, res: 1986 },
      { input: 567993600, res: 1988 },
      { input: 567993599, res: 1987 },
      { input: 599616000, res: 1989 },
      { input: 599615999, res: 1988 },
      { input: 631152000, res: 1990 },
      { input: 631151999, res: 1989 },
      { input: 662688000, res: 1991 },
      { input: 662687999, res: 1990 },
      { input: 694224000, res: 1992 },
      { input: 694223999, res: 1991 },
      { input: 725846400, res: 1993 },
      { input: 725846399, res: 1992 },
      { input: 757382400, res: 1994 },
      { input: 757382399, res: 1993 },
      { input: 788918400, res: 1995 },
      { input: 788918399, res: 1994 },
      { input: 820454400, res: 1996 },
      { input: 820454399, res: 1995 },
      { input: 852076800, res: 1997 },
      { input: 852076799, res: 1996 },
      { input: 883612800, res: 1998 },
      { input: 883612799, res: 1997 },
      { input: 915148800, res: 1999 },
      { input: 915148799, res: 1998 },
      { input: 946684800, res: 2000 },
      { input: 946684799, res: 1999 },
      { input: 978307200, res: 2001 },
      { input: 978307199, res: 2000 },
      { input: 1009843200, res: 2002 },
      { input: 1009843199, res: 2001 },
      { input: 1041379200, res: 2003 },
      { input: 1041379199, res: 2002 },
      { input: 1072915200, res: 2004 },
      { input: 1072915199, res: 2003 },
      { input: 1104537600, res: 2005 },
      { input: 1104537599, res: 2004 },
      { input: 1136073600, res: 2006 },
      { input: 1136073599, res: 2005 },
      { input: 1167609600, res: 2007 },
      { input: 1167609599, res: 2006 },
      { input: 1199145600, res: 2008 },
      { input: 1199145599, res: 2007 },
      { input: 1230768000, res: 2009 },
      { input: 1230767999, res: 2008 },
      { input: 1262304000, res: 2010 },
      { input: 1262303999, res: 2009 },
      { input: 1293840000, res: 2011 },
      { input: 1293839999, res: 2010 },
      { input: 1325376000, res: 2012 },
      { input: 1325375999, res: 2011 },
      { input: 1356998400, res: 2013 },
      { input: 1356998399, res: 2012 },
      { input: 1388534400, res: 2014 },
      { input: 1388534399, res: 2013 },
      { input: 1420070400, res: 2015 },
      { input: 1420070399, res: 2014 },
      { input: 1451606400, res: 2016 },
      { input: 1451606399, res: 2015 },
      { input: 1483228800, res: 2017 },
      { input: 1483228799, res: 2016 },
      { input: 1514764800, res: 2018 },
      { input: 1514764799, res: 2017 },
      { input: 1546300800, res: 2019 },
      { input: 1546300799, res: 2018 },
      { input: 1577836800, res: 2020 },
    ].forEach((spec) => {
      const { input, res } = spec;

      it(`should return ${res} for ${input}`, async () => {
        expect(await dateTime.getYear.call(input)).to.be.bignumber.equal(res);
      });
    });
  });
});
