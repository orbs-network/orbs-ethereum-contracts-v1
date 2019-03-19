const {BigNumber} = require('bignumber.js');
const moment = require('moment');
const {expectRevert} = require('./assertExtensions');

const time = require('./time');

const TEST_ACCOUNTS = require('./accounts.json');

const TEST_ACCOUNTS_ADDRESSES = TEST_ACCOUNTS.map(account => account.address);

const OrbsTokenMock = artifacts.require('./OrbsTokenMock.sol');
const OrbsSubscriptionsMock = artifacts.require('./OrbsSubscriptionsMock.sol');
const OrbsValidatorsMock = artifacts.require('./OrbsValidatorsMock.sol');
const DateTime = artifacts.require('./DateTime');

contract('OrbsSubscriptions', (accounts) => {
  let token;
  const owner = accounts[0];

  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const VERSION = 2;
  const MAX_FEDERATION_MEMBERS = 100;
  const TIME_ERROR_MARGIN = 60; // 60 seconds

  let now;

  const increaseTime = async (by) => {
    await time.increaseTime(by);
    now += by;
  };

  // Get block timestamp.
  beforeEach(async () => {
    now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
  });

  const toBytes32 = (data) => {
    let bytes = data;

    if (!bytes.startsWith('0x')) {
      bytes = `0x${bytes}`;
    }

    const strLength = 2 + (2 * 32); // '0x' + 32 words.
    return bytes.padEnd(strLength, '0');
  };

  const subscribe = async (subsc, id, profile, value, from, current) => {
    console.log(`ERC20: ${await subsc.orbs.call()}`);
    const orbs = OrbsTokenMock.at(await subsc.orbs.call());
    await orbs.approve.send(subsc.address, value, { from });
    const method = current ? subsc.subscribeForCurrentMonth : subsc.subscribeForNextMonth;
    return method(toBytes32(id), profile, value, { from });
  };

  /* eslint-disable implicit-arrow-linebreak */
  const subscribeForCurrentMonth = async (subsc, id, profile, value, from) =>
    subscribe(subsc, id, profile, value, from, true);

  const subscribeForNextMonth = async (subsc, id, profile, value, from) =>
    subscribe(subsc, id, profile, value, from, false);

  /* eslint-enable implicit-arrow-linebreak */

  const getCurrentMonthlySubscription = async (subsc, id) => {
    const subscription = await subsc.getSubscriptionData.call(toBytes32(id));
    return {
      id: subscription[0],
      profile: subscription[1],
      startTime: subscription[2],
      tokens: subscription[3],
    };
  };

  const getMonthlySubscription = async (subsc, id, year, month) => {
    const subscription = await subsc.getSubscriptionDataByTime.call(toBytes32(id), year, month);
    return {
      id: subscription[0],
      profile: subscription[1],
      startTime: subscription[2],
      tokens: subscription[3],
    };
  };

  const getCurrentTime = () => {
    const timeNow = moment.unix(now).utc();

    return {
      time: timeNow.unix(),
      year: timeNow.year(),
      month: timeNow.month() + 1,
    };
  };

  const getBeginningOfNextMonth = () => {
    const beginningOfNextMonth = moment.unix(now).utc().add(1, 'month').startOf('month');

    return {
      time: beginningOfNextMonth.unix(),
      year: beginningOfNextMonth.year(),
      month: beginningOfNextMonth.month() + 1,
    };
  };

  beforeEach(async () => {
    token = await OrbsTokenMock.new();
    console.log(`Deployed ERC20: ${token.address}`);

    const dateTime = await DateTime.new();
    await OrbsSubscriptionsMock.link(DateTime, dateTime.address);
  });

  describe('construction', async () => {
    let validators;
    const minimalMonthlySubscription = 100;

    beforeEach(async () => {
      const federationMembers = accounts.slice(7, 10);
      validators = await OrbsValidatorsMock.new(federationMembers, { from: owner });
    });

    it('should not allow to initialize with a 0x0 token', async () => {
      await expectRevert(OrbsSubscriptionsMock.new(ZERO_ADDRESS, validators.address, minimalMonthlySubscription,
        { from: owner }));
    });

    it('should not allow to initialize with a 0x0 validators', async () => {
      await expectRevert(OrbsSubscriptionsMock.new(token.address, ZERO_ADDRESS, minimalMonthlySubscription,
        { from: owner }));
    });

    it('should not allow to initialize with a 0 minimal subscription allocation', async () => {
      await expectRevert(OrbsSubscriptionsMock.new(token.address, validators.address, 0, { from: owner }));
    });

    it('should correctly initialize fields', async () => {
      const subscMock = await OrbsSubscriptionsMock.new(token.address, validators.address, minimalMonthlySubscription,
        { from: owner });

      expect(await subscMock.orbs.call()).to.eql(token.address);
      expect(await subscMock.validators.call()).to.eql(validators.address);
      expect((await subscMock.minimalMonthlySubscription.call()).toNumber()).to.be.equal(minimalMonthlySubscription);
    });

    it('should report version', async () => {
      const subscMock = await OrbsSubscriptionsMock.new(token.address, validators.address, minimalMonthlySubscription,
        { from: owner });

      expect((await subscMock.VERSION.call()).toNumber()).to.be.equal(VERSION);
    });
  });

  describe('subscription and fees', async () => {
    [
      { federationMembers: [accounts[7]] },
      { federationMembers: [accounts[3], accounts[5]] },
      { federationMembers: accounts.slice(3, 6) },
      { federationMembers: accounts.slice(3, 7) },
      { federationMembers: accounts.slice(3, 8) },
      { federationMembers: accounts.slice(3, 10) },
      { federationMembers: TEST_ACCOUNTS_ADDRESSES.slice(30, 50) },
      { federationMembers: TEST_ACCOUNTS_ADDRESSES.slice(0, MAX_FEDERATION_MEMBERS) },
    ].forEach((spec) => {
      let validators;

      beforeEach(async () => {
        validators = await OrbsValidatorsMock.new(spec.federationMembers, { from: owner });
      });

      context(`with ${spec.federationMembers.length} validators `, async () => {
        const minimalMonthlySubscription = 100;
        const initialValue = 100000000;
        const user1 = accounts[1];
        const user2 = accounts[2];
        const id = toBytes32('0x123');
        const id2 = toBytes32('0xdeadbeef');
        const profile = 'ALPHA_MONTHLY_1';
        const profile2 = 'BETA_MONTHLY_X';
        const value = 123;
        const value2 = 1000;
        let subsc;

        const goToNextMonth = async () => {
          const beginningOfNextMonth = moment.unix(now).utc().add(1, 'month').startOf('month');
          await increaseTime(beginningOfNextMonth.unix() - now);
        };

        const checkSubscription = async (subscriptionManager, subscriptionId, subscriptionProfile, startTime, year,
          month, subscriptionValue) => {
          const subscription = await getMonthlySubscription(subscriptionManager, subscriptionId, year, month);
          expect(subscription.id).to.eql(subscriptionId);
          expect((subscription.tokens).toNumber()).to.be.equal(subscriptionValue);

          const timeNow = getCurrentTime();
          if (year === timeNow.year && month === timeNow.month) {
            const currentSubscription = await getCurrentMonthlySubscription(subscriptionManager, subscriptionId);
            expect(currentSubscription.id).to.eql(subscriptionId);
            expect(currentSubscription.profile).to.eql(subscriptionProfile);
            expect(currentSubscription.startTime.toNumber()).to.be.closeTo(startTime, TIME_ERROR_MARGIN);
            expect((currentSubscription.tokens).toNumber()).to.be.equal(subscriptionValue);
          }
        };

        const checkTotal = async (subscriptionManager, year, month, totalValue) => {
          expect(await subscriptionManager.getTotalMonthlySubscriptionsTokens.call(year, month))
            .to.be.bignumber.equal(totalValue);
        };

        beforeEach(async () => {
          // Always start from a predictable beginning of the month.
          await goToNextMonth();

          await token.assign(user1, initialValue);
          await token.assign(user2, initialValue);

          subsc = await OrbsSubscriptionsMock.new(token.address, validators.address, minimalMonthlySubscription,
            { from: owner });
        });

        it('should error when called with an empty id', async () => {
          await expectRevert(subscribeForCurrentMonth(subsc, '', profile, value, user1));
          await expectRevert(subscribeForNextMonth(subsc, '', profile, value, user1));
        });

        it('should error when called with an empty profile', async () => {
          await expectRevert(subscribeForCurrentMonth(subsc, id, '', value, user1));
          await expectRevert(subscribeForNextMonth(subsc, id, '', value, user1));
        });

        it('should error when called with no tokens', async () => {
          await expectRevert(subscribeForCurrentMonth(subsc, id, profile, 0, user1));
          await expectRevert(subscribeForNextMonth(subsc, id, profile, 0, user1));
        });

        it('should error when called with not enough tokens', async () => {
          await expectRevert(subscribeForCurrentMonth(subsc, id, profile, minimalMonthlySubscription - 1, user1));
          await expectRevert(subscribeForNextMonth(subsc, id, profile, minimalMonthlySubscription - 1, user1));
        });

        it('should error when called without prior funding', async () => {
          await expectRevert(subsc.subscribeForCurrentMonth(id, profile, value));
          await expectRevert(subsc.subscribeForNextMonth(id, profile, value));
        });

        it('should error when called with more tokens than the user has', async () => {
          const userTokens = (await token.balanceOf.call(user1)).toNumber();
          await expectRevert(subscribeForCurrentMonth(subsc, id, profile, userTokens + 1, user1));
          await expectRevert(subscribeForNextMonth(subsc, id, profile, userTokens + 1, user1));
        });

        it('should error when directly called with a past date', async () => {
          const lastYear = moment.unix(now).utc().subtract(1, 'year').unix();
          await expectRevert(subsc.subscribeByTime(id, profile, value, lastYear));
        });

        it('should error when fetching current monthly subscription with an empty id', async () => {
          await expectRevert(getCurrentMonthlySubscription(subsc, ''));
        });

        it('should error when fetching monthly subscription with an empty id', async () => {
          const currentTime = getCurrentTime();
          await expectRevert(getMonthlySubscription(subsc, '', currentTime.year, currentTime.month));
        });

        it('should not allow to distribute future fees', async () => {
          const values = [value, 3 * value, value2, 1];
          await subscribeForCurrentMonth(subsc, id, profile, values[0], user1);
          await subscribeForCurrentMonth(subsc, id, profile, values[1], user2);
          await subscribeForCurrentMonth(subsc, id2, profile2, values[2], user1);
          await subscribeForCurrentMonth(subsc, id, profile, values[3], user2);

          const nextMonthValues = [100 * value, 300 * value, 1000 * value2];
          await subscribeForNextMonth(subsc, id, profile, nextMonthValues[0], user1);
          await subscribeForNextMonth(subsc, id, profile, nextMonthValues[1], user2);
          await subscribeForNextMonth(subsc, id2, profile2, nextMonthValues[2], user1);

          const currentTime = getCurrentTime();
          const beginningOfNextMonth = getBeginningOfNextMonth();

          const total = values.reduce((res, i) => new BigNumber(res).plus(i));
          await checkTotal(subsc, currentTime.year, currentTime.month, total.toNumber());

          const nextMonthTotal = nextMonthValues.reduce((res, i) => new BigNumber(res).plus(i));
          await checkTotal(subsc, beginningOfNextMonth.year, beginningOfNextMonth.month, nextMonthTotal.toNumber());

          expectRevert(subsc.distributeFeesByTime(currentTime.year + 1, currentTime.month));
          expectRevert(subsc.distributeFeesByTime(beginningOfNextMonth.year, beginningOfNextMonth.month));
        });

        context('this month', async () => {
          let currentTime;

          beforeEach(async () => {
            currentTime = getCurrentTime();
          });

          it('should subscribe to a single subscription', async () => {
            await subscribeForCurrentMonth(subsc, id, profile, value, user1);
            await checkSubscription(subsc, id, profile, now, currentTime.year, currentTime.month, value);
            await checkTotal(subsc, currentTime.year, currentTime.month, value);
          });

          it('should subscribe to multiple subscriptions', async () => {
            await subscribeForCurrentMonth(subsc, id, profile, value, user1);
            await subscribeForCurrentMonth(subsc, id2, profile2, value2, user1);

            await checkSubscription(subsc, id, profile, now, currentTime.year, currentTime.month, value);
            await checkSubscription(subsc, id2, profile2, now, currentTime.year, currentTime.month, value2);
            await checkTotal(subsc, currentTime.year, currentTime.month, value + value2);
          });

          it('should be able to top-up the subscription', async () => {
            const values = [value, 2 * value, value2, 1];
            await subscribeForCurrentMonth(subsc, id, profile, values[0], user1);
            await subscribeForCurrentMonth(subsc, id, profile, values[1], user2);
            await subscribeForCurrentMonth(subsc, id, profile, values[2], user1);
            await subscribeForCurrentMonth(subsc, id, profile, values[3], user2);

            const total = values.reduce((res, i) => new BigNumber(res).plus(i));
            await checkSubscription(subsc, id, profile, now, currentTime.year, currentTime.month, total);
            await checkTotal(subsc, currentTime.year, currentTime.month, total);
          });

          it('should not be able to change the profile during top-up of the subscription', async () => {
            await subscribeForCurrentMonth(subsc, id, profile, value, user1);
            await checkSubscription(subsc, id, profile, now, currentTime.year, currentTime.month, value);

            await subscribeForCurrentMonth(subsc, id, profile2, 2 * value, user2);
            await checkSubscription(subsc, id, profile, now, currentTime.year, currentTime.month, 3 * value);
          });

          it('should distribute the fees between the validators members', async () => {
            const values = [value, 3 * value, value2, 1];
            await subscribeForCurrentMonth(subsc, id, profile, values[0], user1);
            await subscribeForCurrentMonth(subsc, id, profile, values[1], user2);
            await subscribeForCurrentMonth(subsc, id2, profile2, values[2], user1);
            await subscribeForCurrentMonth(subsc, id, profile, values[3], user2);

            // Add next months subscriptions, which shouldn't affect this distribution of this month.
            const nextMonthValues = [100 * value, 300 * value, 1000 * value2];
            await subscribeForNextMonth(subsc, id, profile, nextMonthValues[0], user1);
            await subscribeForNextMonth(subsc, id, profile, nextMonthValues[1], user2);
            await subscribeForNextMonth(subsc, id2, profile2, nextMonthValues[2], user1);

            for (const member of spec.federationMembers) {
              expect((await token.balanceOf.call(member)).toNumber()).to.be.equal(0);
            }

            const total = values.reduce((res, i) => new BigNumber(res).plus(i));
            await checkTotal(subsc, currentTime.year, currentTime.month, total.toNumber());

            const fee = total.idiv(spec.federationMembers.length);
            const remainder = total.mod(spec.federationMembers.length);

            await subsc.distributeFees();

            for (const member of spec.federationMembers) {
              let memberFee = fee;
              if (member === spec.federationMembers[0]) {
                memberFee = memberFee.plus(remainder);
              }

              expect((await token.balanceOf.call(member)).toNumber()).to.be.equal(memberFee);
            }

            await checkTotal(subsc, currentTime.year, currentTime.month, 0);

            // Make sure that distributed again fees, since there are no active subscriptions present.
            await expectRevert(subsc.distributeFees());

            // Subscribe again and distribute the fees once more.
            await subscribeForCurrentMonth(subsc, id2, profile2, value, user2);
            const total2 = new BigNumber(value);
            await checkTotal(subsc, currentTime.year, currentTime.month, total2.toNumber());

            const fee2 = total2.idiv(spec.federationMembers.length);
            const remainder2 = total2.mod(spec.federationMembers.length);

            await subsc.distributeFees();

            for (const member of spec.federationMembers) {
              let memberFee = fee.plus(fee2);
              if (member === spec.federationMembers[0]) {
                memberFee = memberFee.plus(remainder).plus(remainder2);
              }

              expect((await token.balanceOf.call(member)).toNumber()).to.be.equal(memberFee);
            }

            await checkTotal(subsc, currentTime.year, currentTime.month, 0);

            // Make sure that distributed again fees, since there are no active subscriptions present.
            await expectRevert(subsc.distributeFees());
          });

          // it('should be able to subscribe after an upgrade', async () => {
          //   await subscribeForCurrentMonth(subsc, id, profile, value, user1);
          //   await checkSubscription(subsc, id, profile, now, currentTime.year, currentTime.month, value);
          //   await checkTotal(subsc, currentTime.year, currentTime.month, value);
          //
          //   const newManager = await OrbsSubscriptionsMock.new(token.address, validators.address,
          //     minimalMonthlySubscription, { from: owner });
          //   await newManager.transferOwnership(validators.address);
          //   await validators.upgradeSubscriptionManager(newManager.address, { from: owner });
          //   expect(await validators.subscriptionManager.call()).to.eql(newManager.address);
          //
          //   await subscribeForCurrentMonth(newManager, id, profile, value * 2, user1);
          //   await checkSubscription(newManager, id, profile, now, currentTime.year, currentTime.month, value * 2);
          //   await checkTotal(newManager, currentTime.year, currentTime.month, value * 2);
          // });
        });

        context('next month', async () => {
          let beginningOfNextMonth;

          beforeEach(async () => {
            beginningOfNextMonth = getBeginningOfNextMonth();
          });

          it('should subscribe to a single subscription', async () => {
            await subscribeForNextMonth(subsc, id, profile, value, user1);
            await checkSubscription(subsc, id, profile, beginningOfNextMonth.time, beginningOfNextMonth.year,
              beginningOfNextMonth.month, value);
            await checkTotal(subsc, beginningOfNextMonth.year, beginningOfNextMonth.month, value);
          });

          it('should subscribe to multiple subscriptions', async () => {
            await subscribeForNextMonth(subsc, id, profile, value, user1);
            await subscribeForNextMonth(subsc, id2, profile2, value2, user1);

            await checkSubscription(subsc, id, profile, beginningOfNextMonth.time, beginningOfNextMonth.year,
              beginningOfNextMonth.month, value);
            await checkSubscription(subsc, id2, profile2, beginningOfNextMonth.time, beginningOfNextMonth.year,
              beginningOfNextMonth.month, value2);
            await checkTotal(subsc, beginningOfNextMonth.year, beginningOfNextMonth.month, value + value2);
          });

          it('should not be able to change the profile during top-up of the subscription', async () => {
            await subscribeForNextMonth(subsc, id, profile, value, user1);
            await checkSubscription(subsc, id, profile, beginningOfNextMonth.time, beginningOfNextMonth.year,
              beginningOfNextMonth.month, value);

            await subscribeForNextMonth(subsc, id, profile2, 2 * value, user2);
            await checkSubscription(subsc, id, profile, beginningOfNextMonth.time, beginningOfNextMonth.year,
              beginningOfNextMonth.month, 3 * value);
          });

          it('should be able to top-up the subscription', async () => {
            const values = [value, 2 * value, value2, 1];
            await subscribeForNextMonth(subsc, id, profile, values[0], user1);
            await subscribeForNextMonth(subsc, id, profile, values[1], user2);
            await subscribeForNextMonth(subsc, id, profile, values[2], user1);
            await subscribeForNextMonth(subsc, id, profile, values[3], user2);

            const total = values.reduce((res, i) => new BigNumber(res).plus(i));
            await checkSubscription(subsc, id, profile, beginningOfNextMonth.time, beginningOfNextMonth.year,
              beginningOfNextMonth.month, total);
            await checkTotal(subsc, beginningOfNextMonth.year, beginningOfNextMonth.month, total);
          });

          it('should distribute the fees between the validators members', async () => {
            const nextMonthValues = [100 * value, 300 * value, 1000 * value2];
            await subscribeForNextMonth(subsc, id, profile, nextMonthValues[0], user1);
            await subscribeForNextMonth(subsc, id, profile, nextMonthValues[1], user2);
            await subscribeForNextMonth(subsc, id2, profile2, nextMonthValues[2], user1);

            for (const member of spec.federationMembers) {
              expect((await token.balanceOf.call(member)).toNumber()).to.be.equal(0);
            }

            const total = nextMonthValues.reduce((res, i) => new BigNumber(res).plus(i));
            await checkTotal(subsc, beginningOfNextMonth.year, beginningOfNextMonth.month, total.toNumber());

            const fee = total.idiv(spec.federationMembers.length);
            const remainder = total.mod(spec.federationMembers.length);

            // It's shouldn't be possible to distribute future funds.
            await expectRevert(subsc.distributeFeesByTime(beginningOfNextMonth.year, beginningOfNextMonth.month));
            await goToNextMonth();
            await subsc.distributeFees();

            for (const member of spec.federationMembers) {
              let memberFee = fee;
              if (member === spec.federationMembers[0]) {
                memberFee = memberFee.plus(remainder);
              }

              expect((await token.balanceOf.call(member)).toNumber()).to.be.equal(memberFee);
            }

            await checkTotal(subsc, beginningOfNextMonth.year, beginningOfNextMonth.month, 0);

            // Make sure that distributed again fees, since there are no active subscriptions present.
            await expectRevert(subsc.distributeFees());
          });

          // it('should be able to subscribe after an upgrade', async () => {
          //   await subscribeForNextMonth(subsc, id, profile, value, user1);
          //   await checkSubscription(subsc, id, profile, beginningOfNextMonth.time, beginningOfNextMonth.year,
          //     beginningOfNextMonth.month, value);
          //   await checkTotal(subsc, beginningOfNextMonth.year, beginningOfNextMonth.month, value);
          //
          //   const newManager = await OrbsSubscriptionsMock.new(token.address, validators.address,
          //     minimalMonthlySubscription, { from: owner });
          //   await newManager.transferOwnership(validators.address);
          //   await validators.upgradeSubscriptionManager(newManager.address, { from: owner });
          //   expect(await validators.subscriptionManager.call()).to.eql(newManager.address);
          //
          //   await subscribeForNextMonth(newManager, id, profile, value * 2, user1);
          //   await checkSubscription(newManager, id, profile, beginningOfNextMonth.time, beginningOfNextMonth.year,
          //     beginningOfNextMonth.month, value * 2);
          //   await checkTotal(newManager, beginningOfNextMonth.year, beginningOfNextMonth.month, value * 2);
          // });
        });

        context('during 3 months', async () => {
          // This is a mixed test which verifies the subscription model end-to-end.
          it('should distribute the fees between the validators members', async () => {
            const nextMonthValue = 1201;
            const nextMonthValue2 = 8872;

            const fees = [];

            let currentTime = getCurrentTime();
            fees[0] = {};
            fees[0].year = currentTime.year;
            fees[0].month = currentTime.month;

            let currentMonthValues = [5 * value, value, 2 * value2];
            await subscribeForCurrentMonth(subsc, id, profile, currentMonthValues[0], user1);
            await subscribeForCurrentMonth(subsc, id, profile, currentMonthValues[1], user2);
            await subscribeForCurrentMonth(subsc, id2, profile2, currentMonthValues[2], user1);

            let nextMonthValues = [2 * nextMonthValue, nextMonthValue, 20 * nextMonthValue2];
            await subscribeForNextMonth(subsc, id, profile, nextMonthValues[0], user1);
            await subscribeForNextMonth(subsc, id, profile, nextMonthValues[1], user2);
            await subscribeForNextMonth(subsc, id2, profile2, nextMonthValues[2], user1);

            fees[0].total = currentMonthValues.reduce((res, i) => new BigNumber(res).plus(i));
            fees[0].fee = fees[0].total.idiv(spec.federationMembers.length);
            fees[0].remainder = fees[0].total.mod(spec.federationMembers.length);
            await checkTotal(subsc, fees[0].year, fees[0].month, fees[0].total.toNumber());

            await goToNextMonth();

            currentTime = getCurrentTime();
            fees[1] = {};
            fees[1].year = currentTime.year;
            fees[1].month = currentTime.month;

            currentMonthValues = [value, value2, 2 * value2];
            await subscribeForCurrentMonth(subsc, id, profile, currentMonthValues[0], user1);
            await subscribeForCurrentMonth(subsc, id, profile, currentMonthValues[1], user2);
            await subscribeForCurrentMonth(subsc, id2, profile2, currentMonthValues[2], user1);

            fees[1].total = currentMonthValues.reduce((res, i) => new BigNumber(res).plus(i))
              .plus(nextMonthValues.reduce((res, i) => new BigNumber(res).plus(i)));
            fees[1].fee = fees[1].total.idiv(spec.federationMembers.length);
            fees[1].remainder = fees[1].total.mod(spec.federationMembers.length);
            await checkTotal(subsc, fees[1].year, fees[1].month, fees[1].total.toNumber());

            await goToNextMonth();

            currentTime = getCurrentTime();
            fees[2] = {};
            fees[2].year = currentTime.year;
            fees[2].month = currentTime.month;

            currentMonthValues = [value2, 2 * value2, 3 * value];
            await subscribeForCurrentMonth(subsc, id, profile, value2, user1);
            await subscribeForCurrentMonth(subsc, id, profile, 2 * value2, user2);
            await subscribeForCurrentMonth(subsc, id2, profile2, 3 * value, user1);

            nextMonthValues = [nextMonthValue, 20 * nextMonthValue2, 3 * nextMonthValue2];
            await subscribeForNextMonth(subsc, id, profile, nextMonthValues[0], user1);
            await subscribeForNextMonth(subsc, id, profile, nextMonthValues[1], user2);
            await subscribeForNextMonth(subsc, id2, profile2, nextMonthValues[2], user1);

            fees[2].total = currentMonthValues.reduce((res, i) => new BigNumber(res).plus(i));
            fees[2].fee = fees[2].total.idiv(spec.federationMembers.length);
            fees[2].remainder = fees[2].total.mod(spec.federationMembers.length);
            await checkTotal(subsc, fees[2].year, fees[2].month, fees[2].total.toNumber());

            await goToNextMonth();

            // Distribute the monthly fees.
            for (const fee of fees) {
              const balances = {};
              for (const member of spec.federationMembers) {
                balances[member] = await token.balanceOf.call(member);
              }

              await subsc.distributeFeesByTime(fee.year, fee.month);

              for (const member of spec.federationMembers) {
                let memberBalance = balances[member].plus(fee.fee);
                if (member === spec.federationMembers[0]) {
                  memberBalance = memberBalance.plus(fee.remainder);
                }

                expect((await token.balanceOf.call(member)).toNumber()).to.be.equal(memberBalance);
              }

              await checkTotal(subsc, fee.year, fee.month, 0);

              // Make sure that distributed again fees, since there are no active subscriptions present.
              await expectRevert(subsc.distributeFeesByTime(fee.year, fee.month));
            }
          });
        });
      });
    });
  });
});
