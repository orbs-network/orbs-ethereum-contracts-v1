import chai from 'chai';
import dirtyChai from 'dirty-chai';
import BigNumber from 'bignumber.js';
import moment from 'moment';

import expectRevert from './helpers/expectRevert';
import time from './helpers/time';

const { expect } = chai;
chai.use(dirtyChai);

const TEST_ACCOUNTS = require('./accounts.json').accounts;

const OrbsTokenMock = artifacts.require('./OrbsTokenMock.sol');
const SubscriptionBillingMock = artifacts.require('./SubscriptionBillingMock.sol');

contract('SubscriptionBilling', (accounts) => {
  let token;

  const VERSION = '0.1';
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

  const subscribe = async (billing, id, profile, value, from, current) => {
    const orbs = OrbsTokenMock.at(await billing.orbs.call());
    await orbs.approve(billing.address, value, { from });
    const method = current ? billing.subscribeForCurrentMonth : billing.subscribeForNextMonth;
    return method(toBytes32(id), profile, value, { from });
  };

  const subscribeForCurrentMonth = async (billing, id, profile, value, from) =>
    subscribe(billing, id, profile, value, from, true);

  const subscribeForNextMonth = async (billing, id, profile, value, from) =>
    subscribe(billing, id, profile, value, from, false);

  const getCurrentMonthlySubscription = async (billing, id) => {
    const subscription = await billing.getSubscriptionData.call(toBytes32(id));
    return {
      id: subscription[0],
      profile: subscription[1],
      startTime: subscription[2],
      tokens: subscription[3],
    };
  };

  const getMonthlySubscription = async (billing, id, year, month) => {
    const subscription = await billing.getSubscriptionDataByTime.call(toBytes32(id), year, month);
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
  });

  describe('construction', async () => {
    const federationMembers = [accounts[7], accounts[8], accounts[9]];
    const minimalMonthlySubscription = 100;

    it('should not allow to initialize with a null token', async () => {
      await expectRevert(SubscriptionBillingMock.new(null, federationMembers, minimalMonthlySubscription));
    });

    it('should not allow to initialize with an empty array of federation members', async () => {
      await expectRevert(SubscriptionBillingMock.new(token.address, [], minimalMonthlySubscription));
    });

    it('should not allow to initialize with too many federation members', async () => {
      const tooManyCooks = TEST_ACCOUNTS.slice(0, MAX_FEDERATION_MEMBERS + 1);
      expect(tooManyCooks).to.have.length.above(MAX_FEDERATION_MEMBERS);

      await expectRevert(SubscriptionBillingMock.new(token.address, tooManyCooks, minimalMonthlySubscription));
    });

    it('should not allow to initialize with 0x address federation members', async () => {
      const invalidFederationMembers = [accounts[7], accounts[8], null, accounts[9]];

      await expectRevert(SubscriptionBillingMock.new(token.address, invalidFederationMembers, minimalMonthlySubscription));
    });

    it('should not allow to initialize with duplicate federation members', async () => {
      const duplicateMembers = [accounts[1], accounts[0], accounts[1], accounts[3]];

      await expectRevert(SubscriptionBillingMock.new(token.address, duplicateMembers, minimalMonthlySubscription));
    });

    it('should not allow to initialize with a 0 minimal subscription allocation', async () => {
      await expectRevert(SubscriptionBillingMock.new(token.address, federationMembers, 0));
    });

    it('should correctly initialize the minimal monthly subscription', async () => {
      const billing = await SubscriptionBillingMock.new(token.address, federationMembers, minimalMonthlySubscription);

      expect(await billing.minimalMonthlySubscription.call()).to.be.bignumber.equal(minimalMonthlySubscription);
    });

    it('should report version', async () => {
      const billing = await SubscriptionBillingMock.new(token.address, federationMembers, minimalMonthlySubscription);

      expect(await billing.VERSION.call()).to.be.bignumber.equal(VERSION);
    });
  });

  describe('subscription and fees', async () => {
    [
      { federationMembers: [accounts[7]] },
      { federationMembers: [accounts[3], accounts[5]] },
      { federationMembers: [accounts[3], accounts[4], accounts[5]] },
      { federationMembers: [accounts[3], accounts[4], accounts[5], accounts[7]] },
      { federationMembers: [accounts[3], accounts[4], accounts[5], accounts[7], accounts[8]] },
      { federationMembers: [accounts[3], accounts[4], accounts[5], accounts[7], accounts[8], accounts[9]] },
      { federationMembers: TEST_ACCOUNTS.slice(30, 50) },
      { federationMembers: TEST_ACCOUNTS.slice(0, MAX_FEDERATION_MEMBERS) },
    ].forEach((spec) => {
      context(`with ${spec.federationMembers.length} federation members`, async () => {
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
        let billing;

        const goToNextMonth = async () => {
          const beginningOfNextMonth = moment.unix(now).utc().add(1, 'month').startOf('month');
          await increaseTime(beginningOfNextMonth.unix() - now);
        };

        const checkSubscription = async (subscriptionBilling, subscriptionId, subscriptionProfile, startTime, year,
          month, subscriptionValue) => {
          const subscription = await getMonthlySubscription(subscriptionBilling, subscriptionId, year, month);
          expect(subscription.id).to.eql(subscriptionId);
          expect(subscription.tokens).to.be.bignumber.equal(subscriptionValue);

          const timeNow = getCurrentTime();
          if (year === timeNow.year && month === timeNow.month) {
            const currentSubscription = await getCurrentMonthlySubscription(subscriptionBilling, subscriptionId);
            expect(currentSubscription.id).to.eql(subscriptionId);
            expect(currentSubscription.profile).to.eql(subscriptionProfile);
            expect(currentSubscription.startTime.toNumber()).to.be.closeTo(startTime, TIME_ERROR_MARGIN);
            expect(currentSubscription.tokens).to.be.bignumber.equal(subscriptionValue);
          }
        };

        const checkTotal = async (subscriptionBilling, year, month, totalValue) => {
          expect(await subscriptionBilling.getTotalMonthlySubscriptionsTokens.call(year, month))
            .to.be.bignumber.equal(totalValue);
        };

        beforeEach(async () => {
          // Always start from a predictable beginning of the month.
          await goToNextMonth();

          await token.assign(user1, initialValue);
          await token.assign(user2, initialValue);

          billing = await SubscriptionBillingMock.new(token.address, spec.federationMembers,
            minimalMonthlySubscription);
        });

        it('should error when called with an empty id', async () => {
          await expectRevert(subscribeForCurrentMonth(billing, '', profile, value, user1));
          await expectRevert(subscribeForNextMonth(billing, '', profile, value, user1));
        });

        it('should error when called with an empty profile', async () => {
          await expectRevert(subscribeForCurrentMonth(billing, id, '', value, user1));
          await expectRevert(subscribeForNextMonth(billing, id, '', value, user1));
        });

        it('should error when called with no tokens', async () => {
          await expectRevert(subscribeForCurrentMonth(billing, id, profile, 0, user1));
          await expectRevert(subscribeForNextMonth(billing, id, profile, 0, user1));
        });

        it('should error when called with not enough tokens', async () => {
          await expectRevert(subscribeForCurrentMonth(billing, id, profile, minimalMonthlySubscription - 1, user1));
          await expectRevert(subscribeForNextMonth(billing, id, profile, minimalMonthlySubscription - 1, user1));
        });

        it('should error when called without prior funding', async () => {
          await expectRevert(billing.subscribeForCurrentMonth(id, profile, value));
          await expectRevert(billing.subscribeForNextMonth(id, profile, value));
        });

        it('should error when called with more tokens than the user has', async () => {
          const userTokens = (await token.balanceOf.call(user1)).toNumber();
          await expectRevert(subscribeForCurrentMonth(billing, id, profile, userTokens + 1, user1));
          await expectRevert(subscribeForNextMonth(billing, id, profile, userTokens + 1, user1));
        });

        it('should error when directly called with a past date', async () => {
          const lastYear = moment.unix(now).utc().subtract(1, 'year').unix();
          await expectRevert(billing.subscribeByTime(id, profile, value, lastYear));
        });

        it('should error when fetching current monthly subscription with an empty id', async () => {
          await expectRevert(getCurrentMonthlySubscription(billing, ''));
        });

        it('should error when fetching monthly subscription with an empty id', async () => {
          const currentTime = getCurrentTime();
          await expectRevert(getMonthlySubscription(billing, '', currentTime.year, currentTime.month));
        });

        it('should not allow to distribute future fees', async () => {
          const values = [value, 3 * value, value2, 1];
          await subscribeForCurrentMonth(billing, id, profile, values[0], user1);
          await subscribeForCurrentMonth(billing, id, profile, values[1], user2);
          await subscribeForCurrentMonth(billing, id2, profile2, values[2], user1);
          await subscribeForCurrentMonth(billing, id, profile, values[3], user2);

          const nextMonthValues = [100 * value, 300 * value, 1000 * value2];
          await subscribeForNextMonth(billing, id, profile, nextMonthValues[0], user1);
          await subscribeForNextMonth(billing, id, profile, nextMonthValues[1], user2);
          await subscribeForNextMonth(billing, id2, profile2, nextMonthValues[2], user1);

          const currentTime = getCurrentTime();
          const beginningOfNextMonth = getBeginningOfNextMonth();

          const total = values.reduce((res, i) => new BigNumber(res).plus(i));
          await checkTotal(billing, currentTime.year, currentTime.month, total.toNumber());

          const nextMonthTotal = nextMonthValues.reduce((res, i) => new BigNumber(res).plus(i));
          await checkTotal(billing, beginningOfNextMonth.year, beginningOfNextMonth.month, nextMonthTotal.toNumber());

          expectRevert(billing.distributeFeesByTime(currentTime.year + 1, currentTime.month));
          expectRevert(billing.distributeFeesByTime(beginningOfNextMonth.year, beginningOfNextMonth.month));
        });

        context('this month', async () => {
          let currentTime;

          beforeEach(async () => {
            currentTime = getCurrentTime();
          });

          it('should subscribe to a single subscription', async () => {
            await subscribeForCurrentMonth(billing, id, profile, value, user1);
            await checkSubscription(billing, id, profile, now, currentTime.year, currentTime.month, value);
            await checkTotal(billing, currentTime.year, currentTime.month, value);
          });

          it('should subscribe to multiple subscriptions', async () => {
            await subscribeForCurrentMonth(billing, id, profile, value, user1);
            await subscribeForCurrentMonth(billing, id2, profile2, value2, user1);

            await checkSubscription(billing, id, profile, now, currentTime.year, currentTime.month, value);
            await checkSubscription(billing, id2, profile2, now, currentTime.year, currentTime.month, value2);
            await checkTotal(billing, currentTime.year, currentTime.month, value + value2);
          });

          it('should be able to top-up the subscription', async () => {
            const values = [value, 2 * value, value2, 1];
            await subscribeForCurrentMonth(billing, id, profile, values[0], user1);
            await subscribeForCurrentMonth(billing, id, profile, values[1], user2);
            await subscribeForCurrentMonth(billing, id, profile, values[2], user1);
            await subscribeForCurrentMonth(billing, id, profile, values[3], user2);

            const total = values.reduce((res, i) => new BigNumber(res).plus(i));
            await checkSubscription(billing, id, profile, now, currentTime.year, currentTime.month, total);
            await checkTotal(billing, currentTime.year, currentTime.month, total);
          });

          it('should not be able to change the profile during top-up of the subscription', async () => {
            await subscribeForCurrentMonth(billing, id, profile, value, user1);
            await checkSubscription(billing, id, profile, now, currentTime.year, currentTime.month, value);

            await subscribeForCurrentMonth(billing, id, profile2, 2 * value, user2);
            await checkSubscription(billing, id, profile, now, currentTime.year, currentTime.month, 3 * value);
          });

          it('should distribute the fees between the federation members', async () => {
            const values = [value, 3 * value, value2, 1];
            await subscribeForCurrentMonth(billing, id, profile, values[0], user1);
            await subscribeForCurrentMonth(billing, id, profile, values[1], user2);
            await subscribeForCurrentMonth(billing, id2, profile2, values[2], user1);
            await subscribeForCurrentMonth(billing, id, profile, values[3], user2);

            // Add next months subscriptions, which shouldn't affect this distribution of this month.
            const nextMonthValues = [100 * value, 300 * value, 1000 * value2];
            await subscribeForNextMonth(billing, id, profile, nextMonthValues[0], user1);
            await subscribeForNextMonth(billing, id, profile, nextMonthValues[1], user2);
            await subscribeForNextMonth(billing, id2, profile2, nextMonthValues[2], user1);

            for (const member of spec.federationMembers) {
              expect(await token.balanceOf.call(member)).to.be.bignumber.equal(0);
            }

            const total = values.reduce((res, i) => new BigNumber(res).plus(i));
            await checkTotal(billing, currentTime.year, currentTime.month, total.toNumber());

            const fee = total.idiv(spec.federationMembers.length);
            const remainder = total.mod(spec.federationMembers.length);

            await billing.distributeFees();

            for (const member of spec.federationMembers) {
              let memberFee = fee;
              if (member === spec.federationMembers[0]) {
                memberFee = memberFee.plus(remainder);
              }

              expect(await token.balanceOf.call(member)).to.be.bignumber.equal(memberFee);
            }

            await checkTotal(billing, currentTime.year, currentTime.month, 0);

            // Make sure that distributed again fees, since there are no active subscriptions present.
            await expectRevert(billing.distributeFees());

            // Subscribe again and distribute the fees once more.
            await subscribeForCurrentMonth(billing, id2, profile2, value, user2);
            const total2 = new BigNumber(value);
            await checkTotal(billing, currentTime.year, currentTime.month, total2.toNumber());

            const fee2 = total2.idiv(spec.federationMembers.length);
            const remainder2 = total2.mod(spec.federationMembers.length);

            await billing.distributeFees();

            for (const member of spec.federationMembers) {
              let memberFee = fee.plus(fee2);
              if (member === spec.federationMembers[0]) {
                memberFee = memberFee.plus(remainder).plus(remainder2);
              }

              expect(await token.balanceOf.call(member)).to.be.bignumber.equal(memberFee);
            }

            await checkTotal(billing, currentTime.year, currentTime.month, 0);

            // Make sure that distributed again fees, since there are no active subscriptions present.
            await expectRevert(billing.distributeFees());
          });
        });

        context('next month', async () => {
          let beginningOfNextMonth;

          beforeEach(async () => {
            beginningOfNextMonth = getBeginningOfNextMonth();
          });

          it('should subscribe to a single subscription', async () => {
            await subscribeForNextMonth(billing, id, profile, value, user1);
            await checkSubscription(billing, id, profile, beginningOfNextMonth.time, beginningOfNextMonth.year,
              beginningOfNextMonth.month, value);
            await checkTotal(billing, beginningOfNextMonth.year, beginningOfNextMonth.month, value);
          });

          it('should subscribe to multiple subscriptions', async () => {
            await subscribeForNextMonth(billing, id, profile, value, user1);
            await subscribeForNextMonth(billing, id2, profile2, value2, user1);

            await checkSubscription(billing, id, profile, beginningOfNextMonth.time, beginningOfNextMonth.year,
              beginningOfNextMonth.month, value);
            await checkSubscription(billing, id2, profile2, beginningOfNextMonth.time, beginningOfNextMonth.year,
              beginningOfNextMonth.month, value2);
            await checkTotal(billing, beginningOfNextMonth.year, beginningOfNextMonth.month, value + value2);
          });

          it('should not be able to change the profile during top-up of the subscription', async () => {
            await subscribeForNextMonth(billing, id, profile, value, user1);
            await checkSubscription(billing, id, profile, beginningOfNextMonth.time, beginningOfNextMonth.year,
              beginningOfNextMonth.month, value);

            await subscribeForNextMonth(billing, id, profile2, 2 * value, user2);
            await checkSubscription(billing, id, profile, beginningOfNextMonth.time, beginningOfNextMonth.year,
              beginningOfNextMonth.month, 3 * value);
          });

          it('should be able to top-up the subscription', async () => {
            const values = [value, 2 * value, value2, 1];
            await subscribeForNextMonth(billing, id, profile, values[0], user1);
            await subscribeForNextMonth(billing, id, profile, values[1], user2);
            await subscribeForNextMonth(billing, id, profile, values[2], user1);
            await subscribeForNextMonth(billing, id, profile, values[3], user2);

            const total = values.reduce((res, i) => new BigNumber(res).plus(i));
            await checkSubscription(billing, id, profile, beginningOfNextMonth.time, beginningOfNextMonth.year,
              beginningOfNextMonth.month, total);
            await checkTotal(billing, beginningOfNextMonth.year, beginningOfNextMonth.month, total);
          });

          it('should distribute the fees between the federation members', async () => {
            const nextMonthValues = [100 * value, 300 * value, 1000 * value2];
            await subscribeForNextMonth(billing, id, profile, nextMonthValues[0], user1);
            await subscribeForNextMonth(billing, id, profile, nextMonthValues[1], user2);
            await subscribeForNextMonth(billing, id2, profile2, nextMonthValues[2], user1);

            for (const member of spec.federationMembers) {
              expect(await token.balanceOf.call(member)).to.be.bignumber.equal(0);
            }

            const total = nextMonthValues.reduce((res, i) => new BigNumber(res).plus(i));
            await checkTotal(billing, beginningOfNextMonth.year, beginningOfNextMonth.month, total.toNumber());

            const fee = total.idiv(spec.federationMembers.length);
            const remainder = total.mod(spec.federationMembers.length);

            // It's shouldn't be possible to distribute future funds.
            await expectRevert(billing.distributeFeesByTime(beginningOfNextMonth.year, beginningOfNextMonth.month));
            await goToNextMonth();
            await billing.distributeFees();

            for (const member of spec.federationMembers) {
              let memberFee = fee;
              if (member === spec.federationMembers[0]) {
                memberFee = memberFee.plus(remainder);
              }

              expect(await token.balanceOf.call(member)).to.be.bignumber.equal(memberFee);
            }

            await checkTotal(billing, beginningOfNextMonth.year, beginningOfNextMonth.month, 0);

            // Make sure that distributed again fees, since there are no active subscriptions present.
            await expectRevert(billing.distributeFees());
          });
        });

        context('during 3 months', async () => {
          // This is a mixed test which verifies the subscription model end-to-end.
          it('should distribute the fees between the federation members', async () => {
            const nextMonthValue = 1201;
            const nextMonthValue2 = 8872;

            const fees = [];

            let currentTime = getCurrentTime();
            fees[0] = {};
            fees[0].year = currentTime.year;
            fees[0].month = currentTime.month;

            let currentMonthValues = [5 * value, value, 2 * value2];
            await subscribeForCurrentMonth(billing, id, profile, currentMonthValues[0], user1);
            await subscribeForCurrentMonth(billing, id, profile, currentMonthValues[1], user2);
            await subscribeForCurrentMonth(billing, id2, profile2, currentMonthValues[2], user1);

            let nextMonthValues = [2 * nextMonthValue, nextMonthValue, 20 * nextMonthValue2];
            await subscribeForNextMonth(billing, id, profile, nextMonthValues[0], user1);
            await subscribeForNextMonth(billing, id, profile, nextMonthValues[1], user2);
            await subscribeForNextMonth(billing, id2, profile2, nextMonthValues[2], user1);

            fees[0].total = currentMonthValues.reduce((res, i) => new BigNumber(res).plus(i));
            fees[0].fee = fees[0].total.idiv(spec.federationMembers.length);
            fees[0].remainder = fees[0].total.mod(spec.federationMembers.length);
            await checkTotal(billing, fees[0].year, fees[0].month, fees[0].total.toNumber());

            await goToNextMonth();

            currentTime = getCurrentTime();
            fees[1] = {};
            fees[1].year = currentTime.year;
            fees[1].month = currentTime.month;

            currentMonthValues = [value, value2, 2 * value2];
            await subscribeForCurrentMonth(billing, id, profile, currentMonthValues[0], user1);
            await subscribeForCurrentMonth(billing, id, profile, currentMonthValues[1], user2);
            await subscribeForCurrentMonth(billing, id2, profile2, currentMonthValues[2], user1);

            fees[1].total = currentMonthValues.reduce((res, i) => new BigNumber(res).plus(i))
              .plus(nextMonthValues.reduce((res, i) => new BigNumber(res).plus(i)));
            fees[1].fee = fees[1].total.idiv(spec.federationMembers.length);
            fees[1].remainder = fees[1].total.mod(spec.federationMembers.length);
            await checkTotal(billing, fees[1].year, fees[1].month, fees[1].total.toNumber());

            await goToNextMonth();

            currentTime = getCurrentTime();
            fees[2] = {};
            fees[2].year = currentTime.year;
            fees[2].month = currentTime.month;

            currentMonthValues = [value2, 2 * value2, 3 * value];
            await subscribeForCurrentMonth(billing, id, profile, value2, user1);
            await subscribeForCurrentMonth(billing, id, profile, 2 * value2, user2);
            await subscribeForCurrentMonth(billing, id2, profile2, 3 * value, user1);

            nextMonthValues = [nextMonthValue, 20 * nextMonthValue2, 3 * nextMonthValue2];
            await subscribeForNextMonth(billing, id, profile, nextMonthValues[0], user1);
            await subscribeForNextMonth(billing, id, profile, nextMonthValues[1], user2);
            await subscribeForNextMonth(billing, id2, profile2, nextMonthValues[2], user1);

            fees[2].total = currentMonthValues.reduce((res, i) => new BigNumber(res).plus(i));
            fees[2].fee = fees[2].total.idiv(spec.federationMembers.length);
            fees[2].remainder = fees[2].total.mod(spec.federationMembers.length);
            await checkTotal(billing, fees[2].year, fees[2].month, fees[2].total.toNumber());

            await goToNextMonth();

            // Distribute the monthly fees.
            for (const fee of fees) {
              const balances = {};
              for (const member of spec.federationMembers) {
                balances[member] = await token.balanceOf.call(member);
              }

              await billing.distributeFeesByTime(fee.year, fee.month);

              for (const member of spec.federationMembers) {
                let memberBalance = balances[member].plus(fee.fee);
                if (member === spec.federationMembers[0]) {
                  memberBalance = memberBalance.plus(fee.remainder);
                }

                expect(await token.balanceOf.call(member)).to.be.bignumber.equal(memberBalance);
              }

              await checkTotal(billing, fee.year, fee.month, 0);

              // Make sure that distributed again fees, since there are no active subscriptions present.
              await expectRevert(billing.distributeFeesByTime(fee.year, fee.month));
            }
          });
        });
      });
    });
  });
});
