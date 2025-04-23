var framework = require('./common/logger/framework.js');
var AWSXRay = require('aws-xray-sdk-core');
// const AWS = AWSXRay.captureAWS(require("aws-sdk"));
const region = process.env.REGION || 'us-east-1';
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const sm = new AWS.SecretsManager();

// var dynamoDB = new AWS.DynamoDB({ apiVersion: "2012-08-10", region: region });

// const tableName = 'intrapet-mlc-loan-maintenance-product-sandbox-product-table';

const getProductFunction =
  require('./service/GetProductFunction.js').getProductFunction;
const updateProductFunction =
  require('./service/updateProductFunction.js').updateProductFunction;

exports.getProduct = (event, context, callback) => {
  var args = {
    sm: sm,
  };

  var options = {
    args: args,
    override: true,
    overrideError: true,
    overrideInfoBackendLogs: true,
    sanitizeArray: ['x-api-key'],
    // dynamodb: dynamoDB,
    callback: event.Records && event.Records.length > 0,
  };

  framework.execute(event, context, callback, getProductFunction, options);
};
