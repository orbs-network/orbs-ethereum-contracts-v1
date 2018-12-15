// import chai from 'chai';

// const { expect } = chai;

// const DateTimeWrapper = artifacts.require('./DateTimeWrapper.sol');

// contract('DateTime', () => {
//   let dateTime;

//   beforeEach(async () => {
//     dateTime = await DateTimeWrapper.new();
//   });

//   describe('getDay', async () => {
//     [
//       // Non leap year.
//       { input: 0, res: 1 },
//     ].forEach((spec) => {
//       const { input, res } = spec;

//       it(`should return ${res} for ${input}`, async () => {
//         expect(await dateTime.getDay.call(input)).to.be.bignumber.equal(res);
//       });
//     });
//   });

//   describe('getHour', async () => {
//     [
//       { input: 63071999, res: 23 },
//     ].forEach((spec) => {
//       const { input, res } = spec;

//       it(`should return ${res} for ${input}`, async () => {
//         expect(await dateTime.getHour.call(input)).to.be.bignumber.equal(res);
//       });
//     });
//   });

//   describe('isLeapYear', async () => {
//     const LEAP_YEARS = [
//       1972,
//     ];

//     [...Array(234).keys()].map(i => i + 1970).forEach((year) => {
//       const leap = LEAP_YEARS.indexOf(year) !== -1;

//       it(`${year} should ${leap ? 'be' : 'not be'} a leap year`, async () => {
//         expect(await dateTime.isLeapYear.call(year)).to.be.eql(leap);
//       });
//     });
//   });

//   describe('getMinute', async () => {
//     [
//       { input: 63071999, res: 59 },
//     ].forEach((spec) => {
//       const { input, res } = spec;

//       it(`should return ${res} for ${input}`, async () => {
//         expect(await dateTime.getMinute.call(input)).to.be.bignumber.equal(res);
//       });
//     });
//   });

//   describe('getMonth', async () => {
//     [
//       // Non leap year.
//       { input: 0, res: 1 },
//     ].forEach((spec) => {
//       const { input, res } = spec;

//       it(`should return ${res} for ${input}`, async () => {
//         expect(await dateTime.getMonth.call(input)).to.be.bignumber.equal(res);
//       });
//     });
//   });

//   describe('getSecond', async () => {
//     [
//       { input: 63071999, res: 59 },
//     ].forEach((spec) => {
//       const { input, res } = spec;

//       it(`should return ${res} for ${input}`, async () => {
//         expect(await dateTime.getSecond.call(input)).to.be.bignumber.equal(res);
//       });
//     });
//   });

//   describe('getBeginningOfMonth', async () => {
//     [
//       {
//         date: { year: 1970, month: 1 },
//         res: 0,
//       },
//       {
//         date: { year: 1970, month: 12 },
//         res: 28857600,
//       },
//       {
//         date: { year: 2018, month: 4 },
//         res: 1522540800,
//       },
//       {
//         date: { year: 1999, month: 2 },
//         res: 917827200,
//       },
//       {
//         date: { year: 2018, month: 11 },
//         res: 1541030400,
//       },
//     ].forEach((spec) => {
//       const { date, res } = spec;

//       it(`should return ${res} for ${JSON.stringify(date)}`, async () => {
//         expect(await dateTime.getBeginningOfMonth.call(date.year, date.month)).to.be.bignumber.equal(res);
//       });
//     });
//   });

//   describe('getNextMonth', async () => {
//     [
//       {
//         date: { year: 1970, month: 1 },
//         res: { year: 1970, month: 2 },
//       },
//     ].forEach((spec) => {
//       const { date, res } = spec;

//       it(`should return ${JSON.stringify(res)} for ${JSON.stringify(date)}`, async () => {
//         const nextMonth = await dateTime.getNextMonth.call(date.year, date.month);
//         expect(nextMonth[0]).to.be.bignumber.equal(res.year);
//         expect(nextMonth[1]).to.be.bignumber.equal(res.month);
//       });
//     });
//   });

//   describe('toTimeStamp', async () => {
//     [
//       {
//         date: {
//           year: 1970, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0,
//         },
//         res: 0,
//       },
//     ].forEach((spec) => {
//       const { date, res } = spec;

//       it(`should return ${JSON.stringify(res)} for ${JSON.stringify(date)}`, async () => {
//         if (!date.hours && !date.minutes && !date.seconds) {
//           expect(await dateTime.toTimestamp.call(date.year, date.month, date.day)).to.be.bignumber.equal(res);
//         } else {
//           expect(await dateTime.toTimestampFull.call(date.year, date.month, date.day, date.hours, date.minutes,
//             date.seconds)).to.be.bignumber.equal(res);
//         }
//       });
//     });
//   });

//   describe('getWeekday', async () => {
//     [
//       { input: 67737599, res: 3 },
//     ].forEach((spec) => {
//       const { input, res } = spec;

//       it(`should return ${res} for ${input}`, async () => {
//         expect(await dateTime.getWeekday.call(input)).to.be.bignumber.equal(res);
//       });
//     });
//   });

//   describe('getWeekday', async () => {
//     [
//       { input: 0, res: 1970 },
//     ].forEach((spec) => {
//       const { input, res } = spec;

//       it(`should return ${res} for ${input}`, async () => {
//         expect(await dateTime.getYear.call(input)).to.be.bignumber.equal(res);
//       });
//     });
//   });
// });
