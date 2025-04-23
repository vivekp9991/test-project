import * as cdk from 'aws-cdk-lib';
import { GetSSMValue } from '@bmo-cdk/common';
import { globals as G } from './globals';

import { Construct } from 'constructs';

// var VpcId;
// var VpcId;

export class SwaggerApi extends Construct {
  public readonly swaggerApiJson: any;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);
    const Stage = this.node.tryGetContext('Stage');
    const get_lambda_name = `MLC-${Stage}-Lambda-Get-Product`;
    const get_product_lambda_arn_invocation =
      'arn:aws:apigateway:' +
      process.env.TargetAccountRegion +
      ':lambda:path/2015-03-31/functions/arn:aws:lambda:' +
      process.env.TargetAccountRegion +
      ':' +
      process.env.TargetAccountNumber +
      ':function:' +
      get_lambda_name +
      '/invocations';
    const executeApiArn =
      'arn:aws:execute-api:' +
      process.env.TargetAccountRegion +
      ':' +
      process.env.TargetAccountNumber +
      ':*';

    var VpcId = GetSSMValue(
      this,
      `/tie/cea/${process.env.Stage}/${process.env.TargetAccountRegion}/vpc/id`
    );
    var VpcIdSharedServices = GetSSMValue(
      this,
      `/tie/cea/sharedservices/${process.env.TargetAccountRegion}/vpc/id`
    );

    this.swaggerApiJson = {
      swagger: '2.0',
      info: {
        description: 'A service for MLC Loan Maintenance Product CDK API', //change
        version: '1.0.0',
        title: 'MLC-Loan-Maintenance-Product-CDK-API', // change
      },
      schemes: ['https'],
      paths: {
        '/public-reference-data-management/mlc-products/get': {
          post: {
            operationId: 'GetFinancialSnapshot',
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
              {
                name: 'x-app-cat-id',
                in: 'header',
                required: true,
                type: 'string',
              },
              {
                name: 'x-request-id',
                in: 'header',
                required: true,
                type: 'string',
              },
              {
                name: 'x-fapi-financial-id',
                in: 'header',
                required: true,
                type: 'string',
              },
            ],
            responses: {
              '200': {
                description: '200 response',
                schema: {
                  $ref: '#/definitions/getFinancialSnapshotResponse',
                },
                headers: {
                  'x-request-id': {
                    type: 'string',
                  },
                  'x-fapi-interaction-id': {
                    type: 'string',
                  },
                },
              },
              '400': {
                description: '400 response',
                schema: {
                  $ref: '#/definitions/Problem',
                },
                headers: {
                  'x-request-id': {
                    type: 'string',
                  },
                  'x-session-id': {
                    type: 'string',
                  },
                  'x-fapi-interaction-id': {
                    type: 'string',
                  },
                },
              },
              '500': {
                description: '500 response',
                schema: {
                  $ref: '#/definitions/Problem',
                },
                headers: {
                  'x-request-id': {
                    type: 'string',
                  },
                  'x-fapi-interaction-id': {
                    type: 'string',
                  },
                },
              },
            },
            security: [
              {
                api_key: [],
              },
            ],
            'x-amazon-apigateway-request-validator':
              'Validate body, query string parameters, and headers',
            'x-amazon-apigateway-integration': {
              type: 'aws_proxy',
              httpMethod: 'POST',
              uri: get_product_lambda_arn_invocation,
              responses: {
                default: {
                  statusCode: '200',
                },
              },
              passthroughBehavior: 'when_no_match',
              contentHandling: 'CONVERT_TO_TEXT',
            },
          },
        },
      },
      securityDefinitions: {
        api_key: {
          type: 'apiKey',
          name: 'x-api-key',
          in: 'header',
        },
      },
      definitions: {
        getFinancialSnapshotResponse: {
          type: 'string',
        },
        Arrangement: {
          type: 'object',
          properties: {
            arrangementId: {
              type: 'string',
            },
          },
        },
        Problem: {
          type: 'object',
          properties: {
            instance: {
              type: 'string',
              format: 'uri',
              description:
                'An absolute URI that identifies the specific occurrence of the problem.\nIt may or may not yield further information if dereferenced.\n',
            },
            detail: {
              type: 'string',
              description:
                'A human readable explanation specific to this occurrence of the\nproblem.\n',
            },
            type: {
              type: 'string',
              format: 'uri',
              description:
                'An absolute URI that identifies the problem type.  When dereferenced,\nit SHOULD provide human-readable documentation for the problem type\n(e.g., using HTML).\n',
              default: 'about:blank',
            },
            title: {
              type: 'string',
              description:
                'A short, summary of the problem type. Written in english and readable\nfor engineers (usually not suited for non technical stakeholders and\nnot localized); example: Service Unavailable\n',
            },
            status: {
              type: 'integer',
              format: 'int32',
              description:
                'The HTTP status code generated by the origin server for this occurrence\nof the problem.\n',
              minimum: 100,
              maximum: 600,
              exclusiveMaximum: true,
            },
          },
        },
      },
      'x-amazon-apigateway-gateway-responses': {
        REQUEST_TOO_LARGE: {
          statusCode: 413,
        },
        API_CONFIGURATION_ERROR: {
          statusCode: 500,
        },
        UNSUPPORTED_MEDIA_TYPE: {
          statusCode: 415,
        },
        INTEGRATION_TIMEOUT: {
          statusCode: 504,
          responseTemplates: {
            'application/json':
              '{\r\n   "type": "https://devapiportal.bmogc.com/problem/schema.yaml#/Problem",\r\n   "title": "Failure",\r\n   "status": "504",\r\n   "detail": [$context.error.messageString]\r\n}',
          },
        },
        UNAUTHORIZED: {
          statusCode: 401,
        },
        INVALID_API_KEY: {
          statusCode: 403,
        },
        THROTTLED: {
          statusCode: 429,
        },
        DEFAULT_4XX: {
          responseTemplates: {
            'application/json':
              '{\r\n   "type": "https://devapiportal.bmogc.com/problem/schema.yaml#/Problem",\r\n   "title": "Failure",\r\n   "status": "400",\r\n   "detail": "Bad Request"\r\n}',
          },
        },
        DEFAULT_5XX: {
          responseTemplates: {
            'application/json':
              '{\r\n   "type": "https://devapiportal.bmogc.com/problem/schema.yaml#/Problem",\r\n   "title": "Failure",\r\n   "status": "500",\r\n   "detail": "Internal Server Error"\r\n}',
          },
        },
        AUTHORIZER_CONFIGURATION_ERROR: {
          statusCode: 500,
        },
        BAD_REQUEST_BODY: {
          statusCode: 400,
        },
        QUOTA_EXCEEDED: {
          statusCode: 429,
        },
        ACCESS_DENIED: {
          statusCode: 403,
        },
        BAD_REQUEST_PARAMETERS: {
          statusCode: 400,
        },
        RESOURCE_NOT_FOUND: {
          statusCode: 404,
        },
        AUTHORIZER_FAILURE: {
          statusCode: 500,
        },
        WAF_FILTERED: {
          statusCode: 403,
        },
        EXPIRED_TOKEN: {
          statusCode: 403,
        },
        INVALID_SIGNATURE: {
          statusCode: 403,
        },
        MISSING_AUTHENTICATION_TOKEN: {
          statusCode: 403,
        },
      },
      'x-amazon-apigateway-policy': {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: 'execute-api:Invoke',
            Resource: executeApiArn,
            Condition: {
              StringEquals: {
                'aws:SourceVpc': VpcId,
              },
            },
          },
          {
            Effect: 'Allow',
            Principal: '*',
            Action: 'execute-api:Invoke',
            Resource: executeApiArn,
            Condition: {
              StringEquals: {
                'aws:SourceVpc': VpcIdSharedServices,
              },
            },
          },
        ],
      },
      'x-amazon-apigateway-request-validators': {
        'Validate body, query string parameters, and headers': {
          validateRequestParameters: false,
        },
      },
    };
  }
}
