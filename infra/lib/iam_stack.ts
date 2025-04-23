//
//  IAM RESOURCES
//  - IAM resource changes will need cloud engineering approval. The webhook should be
//    changed to version=CloudEng (and changed back to version=v1 afterwards)
//  - CodeDeploy: the first time it runs when the prehool function is used it adds an IAM policy to the prehook function role,
//    subsequent runs will not create additional IAM changes
//

//  Stack for IAM roles
import * as cdk from 'aws-cdk-lib';
import { GetSSMValue } from '@bmo-cdk/common';
import { BMOIAMConstruct, BMOIAMPolicyConstruct } from '@bmo-cdk/iam';
import { globals as G, taggingVars } from './globals';
import { BMOKMSConstruct } from '@bmo-cdk/kms';
import { BMOSSMConstruct } from '@bmo-cdk/ssm-parameter';

import { Construct } from 'constructs';

export class IamStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //var _this: any = this;

    let Stage = this.node.tryGetContext('Stage');
    let accountID = this.node.tryGetContext('accountID');
    let Region = process.env.TargetAccountRegion;
    let stageShortCode = this.node.tryGetContext('stageShortCode');
    let regionShortCode = this.node.tryGetContext('regionShortCode');
    const subnetid1 = GetSSMValue(this, [
      `/tie/cea/${Stage}/${Region}/subnet-id-priv1`,
    ]);
    const subnetid2 = GetSSMValue(this, [
      `/tie/cea/${Stage}/${Region}/subnet-id-priv2`,
    ]);
    const subnetid3 = GetSSMValue(this, [
      `/tie/cea/${Stage}/${Region}/subnet-id-priv3`,
    ]);

    const kmsKey =
      `arn:aws:kms:${Region}:${accountID}:key/` +
      GetSSMValue(
        this,
        `/${G.serviceName}/${Stage}/mlc-loan-maintenance-product/DynamoDBKMSKey`
      );

    let policies = [
      {
        policyName: 'GetAccountsRoleSecretmanagerPolicy',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['secretsmanager:GetSecretValue'],
              Resource: [
                `arn:aws:secretsmanager:${Region}:${accountID}:secret:/tie/cea/${Stage}/${Region}/26777/*`,
                `arn:aws:secretsmanager:${Region}:${accountID}:secret:/tie/cea/sit2/${Region}/26777/*`,
                'arn:aws:secretsmanager:' +
                  Region +
                  ':' +
                  accountID +
                  ':secret:/tie/cea/sharedservices/centralized/' +
                  Region +
                  '/TLS/ClientRootCert',
              ],
            },
          ],
        },
      },
      {
        policyName: 'LambdaAccessPolicy',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['lambda:InvokeFunction'],
              Resource: [
                `arn:aws:lambda:${Region}:${accountID}:function:MLC-${Stage}-Lambda-Get-Product`,
                `arn:aws:lambda:${Region}:${accountID}:function:MLC-${Stage}-Lambda-Update-Product`,
                `arn:aws:kms:${Region}:${accountID}:key/`,
              ],
            },
            {
              Sid: 'DescribeQueryScanBooksTable',
              Effect: 'Allow',
              Action: [
                'dynamodb:DescribeTable',
                'dynamodb:Query',
                'dynamodb:Scan',
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:BatchGetItem',
                'dynamodb:BatchWriteItem',
              ],
              Resource: [
                `arn:aws:dynamodb:${Region}:${accountID}:table/${taggingVars.ServiceName}-${Stage}-product-table`,
              ],
            },
            {
              Sid: 'AllowUseOfKMSKey',
              Effect: 'Allow',
              Action: 'kms:*',
              Resource: kmsKey,
            },
          ],
        },
      },
      {
        policyName: 'VPCAccessPolicy',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'VisualEditor0',
              Effect: 'Allow',
              Action: [
                'ec2:CreateNetworkInterface',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DescribeVpcs',
                'ec2:DeleteNetworkInterface',
                'ec2:DescribeDhcpOptions',
                'ec2:DescribeSubnets',
                'ec2:DescribeSecurityGroups',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['ec2:CreateNetworkInterfacePermission'],
              Resource: `arn:aws:ec2:${Region}:${accountID}:network-interface/*`,
              Condition: {
                StringEquals: {
                  'ec2:AuthorizedService': 'codebuild.amazonaws.com',
                  'ec2:Subnet': [
                    `arn:aws:ec2:${Region}:${accountID}:subnet/${subnetid1}`,
                    `arn:aws:ec2:${Region}:${accountID}:subnet/${subnetid2}`,
                    `arn:aws:ec2:${Region}:${accountID}:subnet/${subnetid3}`,
                  ],
                },
              },
            },
          ],
        },
      },
      // {
      //   policyName: "KMSPolicy",
      //   policyDocument: {
      //     Version: "2012-10-17",
      //     Statement: [
      //       {
      //         Effect: "Allow",
      //         Action: [
      //           "kms:Decrypt",
      //           "kms:Encrypt",
      //           "kms:GenerateDataKey"
      //         ],
      //         Resource: [
      //           `arn:aws:kms:us-east-1:415882473606:key/*`,
      //           `arn:aws:kms:ca-central-1:415882473606:key/*`
      //         ],
      //       },
      //     ],
      //   },
      // },
    ];

    let crossRoleAccId;
    switch (Stage) {
      case 'sandbox':
        crossRoleAccId = '520049198415';
        break;
      case 'prod':
        crossRoleAccId = '334305563574';
        break;
    }
    if (Stage === 'sandbox' || Stage === 'prod') {
      policies.push({
        policyName: `AssumeRolePolicy`,
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['sts:AssumeRole', 'ssm:GetParameters'],
              Resource: [
                // assume role for the
                `arn:aws:iam::${crossRoleAccId}:role/COB-MLC-${stageShortCode}-${Region}-LOCAccRpt-param-cross-accn-role`,
              ],
            },
            {
              Effect: 'Allow',
              Action: ['ssm:GetParameter', 'ssm:GetParameters'],
              Resource: [
                `arn:aws:ssm:${Region}:${crossRoleAccId}:parameter/SCCG/SCCG-LineOfCreditArangementReport/CDK/GWHost`,
                `arn:aws:ssm:${Region}:${crossRoleAccId}:parameter/SCCG/DeploymentConfig/LOCAccRpt-Api/Lineofcreditarrangementreport/ApiKey/${Stage}/Value`,
              ],
            },
          ],
        },
      });
    }
    // mainFunction lambda role
    const mainFunctionRole = new BMOIAMConstruct(this, 'mainFunctionRole', {
      roleName: G.mainFunctionName,
      roleDescription: 'MainFunction role',
      assumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            //  can be run by lambda service
            Sid: 'LambdaAssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
          {
            Sid: 'EventBridgeAssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'events.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      managedPolicyArns: [
        //  basic managed policies
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
        `arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess`,
        `arn:aws:iam::${accountID}:policy/hub-cg-${stageShortCode}-${regionShortCode}-sccg-vpc-lambda-policy`,
        `arn:aws:iam::${accountID}:policy/tie-hc-${stageShortCode}-${regionShortCode}-cloudwatch-kms-access-policy`,
        `arn:aws:iam::${accountID}:policy/hub-cg-${stageShortCode}-${regionShortCode}-sccg-sqs-kms-access-policy`,
        `arn:aws:iam::${accountID}:policy/hub-cg-${stageShortCode}-${regionShortCode}-sccg-ssm-parameterStoreGetPolicy`,
        `arn:aws:iam::${accountID}:policy/tie-hc-${regionShortCode}-centralized-nlb-service-to-service-access-policy`,
        `arn:aws:iam::${accountID}:policy/hub-cg-${stageShortCode}-${regionShortCode}-sccg-dynamodb-kms-access-policy`,
        `arn:aws:iam::${accountID}:policy/hub-cg-${stageShortCode}-${regionShortCode}-sccg-secretmanager-kms-policy`,
        `arn:aws:iam::${accountID}:policy/hub-cg-${stageShortCode}-${regionShortCode}-sccg-s3-kms-access-policy`,
        // `arn:aws:iam::${accountID}:policy/hub-cg-sit02-${regionShortCode}-sccg-secretmanager-kms-policy`,
      ],
      policies: policies,
      associatedAppCatID: [taggingVars.AppCatID],
      tags: taggingVars,
      // exceptionCode: ["E043"],
    });
  }
}
