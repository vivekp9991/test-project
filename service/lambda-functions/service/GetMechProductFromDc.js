const clientRootCertId = process.env.CLIENTROOTCERTSCRTID;
const utils = require('./utils.js');
const NLBUrl = process.env.NLB_CENTRALIZED;
const Stage = process.env.StageValue;
const https = require('https');
const dcHost = process.env.dcHost;
var framework = require('../common/logger/framework.js');
var ssmvalue = require('./getssmValue.js');
var request = require('request');
var dcApiKey;
module.exports.mechproductCode = async function (
  loanAccountNumber,
  branchTransitNumber,
  originatorRequestId,
  originatorChannel,
  userIdentification,
  machineIdentifier,
  userID,
  mechTransitNumber,
  mechAccountNumber,
  args
) {
  framework.debug('NLBUrl ::-' + NLBUrl);
  framework.debug('loanAccountNumber ::-' + loanAccountNumber);
  framework.debug('Stage ::-' + Stage);
  let client_root_cert_value = await utils.getSecret(args.sm, clientRootCertId);
  let httpsAgent = new https.Agent({
    ca: [client_root_cert_value],
  });
  var apikey, URL;
  if (Stage == 'dev') {
    apikey =
      '/SCCG/DeploymentConfig/PersonalLoanPlanArrangement/DC-PersonalLoanPlanArrangement-CDK/ApiKey/sit2/Value';
    URL = `https://${NLBUrl}/sit2/consumer-loan/personal-loan-plan-arrangement/get`;
  } else {
    apikey = `/SCCG/DeploymentConfig/PersonalLoanPlanArrangement/DC-PersonalLoanPlanArrangement-CDK/ApiKey/${Stage}/Value`;
    URL = `https://${NLBUrl}/${Stage}/consumer-loan/personal-loan-plan-arrangement/get`;
  }

  if (apikey) {
    dcApiKey = await ssmvalue.getParam(apikey, true);
  }

  framework.debug('dcApiKey ::->' + dcApiKey);
  framework.debug('dcApiKey JSON::->' + JSON.stringify(dcApiKey));

  let payload = {
    originatorData: {
      branchTransitNumber: branchTransitNumber,
      originatorRequestId: originatorRequestId,
      originatorChannel: originatorChannel,
      userIdentification: userIdentification,
      machineIdentifier: machineIdentifier,
      userID: userID,
      transitNumber: '',
      operatorID: '',
      businessDate: '',
    },
    loanInquiryRequest: {
      mechTransitNumber: mechTransitNumber,
      mechAccountNumber: mechAccountNumber,
      effectiveDate: '        ',
      paymentFrequency: ' ',
      insuranceCoverage: '',
      nextPaymentDate: '        ',
    },
  };
  const options = {
    url: URL,
    method: 'POST',
    headers: {
      'x-apigw-api-id': dcHost.split('.')[0],
      'x-request-id': 'test2024',
      'x-api-key': dcApiKey,
      'x-app-cat-id': '78093',
      'x-fapi-financial-id': '001',
    },
    body: payload,
    agent: httpsAgent,
    json: true,
  };
  framework.debug('options::->' + JSON.stringify(options));
  return new Promise(async function (resolve, reject) {
    await request(options, async (error, response, body) => {
      framework.debug('body :--> ' + JSON.stringify(body));
      framework.debug('response :--> ' + JSON.stringify(response));
      framework.debug('error :--> ' + JSON.stringify(error));
      if (!error && response.statusCode >= 200 && response.statusCode <= 299) {
        framework.debug(
          JSON.stringify(body),
          'productCode Response: ',
          global.correlationId
        );
        resolve(body);
      } else if (!error && body.status === 400) {
        framework.debug(
          JSON.stringify(body),
          'productCode Response: ',
          global.correlationId
        );
        resolve(body);
      } else if (!error && body.status === 500) {
        framework.debug(
          JSON.stringify(body),
          'productCode Response: ',
          global.correlationId
        );
        resolve(body);
      } else {
        framework.debug(
          JSON.stringify(body),
          'productCode Response: ',
          global.correlationId
        );
        resolve(body);
      }
    });
  });
};
