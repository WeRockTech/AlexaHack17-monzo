/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
'use strict';

const Alexa = require('alexa-sdk');
const https = require('https');

const baseUrl = process.env.BASE_URL;
const accountId = process.env.ACCOUNT_ID;
const accessToken = process.env.ACCESS_TOKEN;

const languageStrings = {
    'en': {
        translation: {
            SKILL_NAME: 'Monzo',
            HELP_MESSAGE: 'Check your Monzo balance',
            HELP_REPROMPT: 'Ask for your balance',
            STOP_MESSAGE: 'Goodbye!',
        },
    },
};

const handlers = {
    'LaunchRequest': function () {
        this.emit('GetBalance');
    },
    'GetBalanceIntent': function () {
        this.emit('GetBalance');
    },
    'GetBalance': function () {
      const alexa = this;
      getBalance(accountId, function (err, balance) {
        if (!err) {
          console.log(`Balance is ${balance}`)
          alexa.emit(':tell', `You have ${formatCurrency(balance)} in your Monzo account`);
        }
      });
    },
    'GetLastTransactionIntent': function () {
        this.emit('GetLastTransaction');
    },
    'GetLastTransaction': function () {
      const alexa = this;
      getLastTransaction(accountId, function (err, transaction) {
        if (!err) {
          console.log(`Transaction: ${transaction}`)
          alexa.emit(':tell', `Your last transaction was ${formatTransaction(transaction)}`);
        }
      });
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
      this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};

const formatCurrency = function (pennies) {
  if (pennies === 0) {
    return "Nothing";
  }

  const pounds = Math.floor(Math.abs(pennies) / 100);
  const littlePennies = Math.abs(pennies) % 100;

  if (littlePennies === 0) {
    return `${pounds} pounds`;
  }

  return `${pounds} pounds ${littlePennies}`;
}

const getBalance = function (accountId, callback) {
  console.log('Getting the balance');

  https.get({
    host: baseUrl,
    path: `/balance?account_id=${accountId}`,
    headers: {
      'Authorization': accessToken
    }
  }, (res) => {
    if (res.statusCode !== 200) {
      callback("Something went wrong", null);
    }

    let body = '';

    res.on('data', function (chunk) {
      body += chunk;
    });

    res.on('end', function () {
      const balance = JSON.parse(body).balance;
      callback(null, balance);
    });
  });
};

const formatTransaction = function (transaction) {
  const fromTo = transaction.local_amount < 0 ? 'to' : 'from';
  return `${formatCurrency(transaction.local_amount)} ${fromTo} ${transaction.description}`
}

const getLastTransaction = function (accountId, callback) {
  console.log('Getting the balance');

  https.get({
    host: baseUrl,
    path: `/transactions?account_id=${accountId}`,
    headers: {
      'Authorization': accessToken
    }
  }, (res) => {
    if (res.statusCode !== 200) {
      callback("Something went wrong", null);
    }

    let body = '';

    res.on('data', function (chunk) {
      body += chunk;
    });

    res.on('end', function () {
      const transactions = JSON.parse(body).transactions;
      const last = transactions[transactions.length - 1];
      callback(null, last);
    });
  });
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = process.env.APP_ID;

    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
