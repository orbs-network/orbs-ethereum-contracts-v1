/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const { WebClient } = require('@slack/web-api');

const slackChannel = 'prod-monitoring';
const slackUserName = 'ElectionMonitor';
const slackUserEmoji = ':cat2:';

async function sendSlack(message) {
    if (process.env.SLACK_TOKEN) {
        let slackToken = process.env.SLACK_TOKEN;
        let slack = await new WebClient(slackToken);
        await slack.chat.postMessage({text : message, username: slackUserName, icon_emoji: slackUserEmoji, channel: slackChannel});
    }
}

module.exports = {
    sendSlack,
};

