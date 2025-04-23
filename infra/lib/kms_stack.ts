import * as cdk from 'aws-cdk-lib';
import { BMOSSMConstruct } from '@bmo-cdk/ssm-parameter';
import { globals as G, taggingVars } from './globals';
import { BMOKMSConstruct } from '@bmo-cdk/kms';

import { Construct } from 'constructs';

export class KMSStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    var Stage = this.node.tryGetContext('Stage');
    var accountID = this.node.tryGetContext('accountID');

    var kmsKey = new BMOKMSConstruct(this, 'KMSKeyConstruct', {
      alias: `${G.serviceName}-${Stage}-dynamodb-kms-key-v1`,
      keyType: 'application', //'platform' or 'application' - will automatically add keyPolicy defined here - https://confluence.bmogc.net/display/IE/KMS+CMK+keys+policy+pattern
      applicationKeyAppCatIdForTagBasedAccess: taggingVars.AppCatID, // conditional - needs to be specified if keyType is application
      description: 'MLC Loan Maintenance Product KMSkey for Dynamo DB',
      enabled: true,
      keyUsage: 'ENCRYPT_DECRYPT',
      // pendingWindowInDaysForDeletion: 30,
      keyPolicy: {
        // optional - only specify if additional policy statements need to be added on top of platform or application key policy
        Version: '2012-10-17',
        Id: 'allowKMSActions',
        Statement: [
          {
            Sid: 'AllowUseOfKMSKey',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${accountID}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
        ],
      },
      tags: taggingVars,
      // exceptionCode: ["E000"]
    });

    const KMSKeyID = new BMOSSMConstruct(this, 'MLCKMSKeyCDK', {
      ssmName: `/${G.serviceName}/${Stage}/mlc-loan-maintenance-product/DynamoDBKMSKey`,
      ssmDescription: 'KMS Key',
      ssmType: 'String',
      ssmValue: kmsKey.kmsKey.ref,
      tags: taggingVars,
    });
    KMSKeyID.ssmparameter.overrideLogicalId('MLCKMSKeyCDK');
  }
}
