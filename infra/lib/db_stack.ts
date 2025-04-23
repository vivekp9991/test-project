import * as cdk from 'aws-cdk-lib';
import { globals as G, taggingVars } from './globals';
import { BMODDBConstruct } from '@bmo-cdk/dynamodb';
import { GetSSMValue } from '@bmo-cdk/common';
import { Construct } from 'constructs';

export class DBStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ---------- STACK PARAMETERS -------- //

    var Stage = this.node.tryGetContext('Stage');
    var accountID = this.node.tryGetContext('accountID');
    var stageShortCode = this.node.tryGetContext('stageShortCode');
    var regionShortCode = this.node.tryGetContext('regionShortCode');
    var Region = process.env.TargetAccountRegion;
    var ServiceName = G.serviceName;

    const dynamokms =
      `arn:aws:kms:${Region}:${accountID}:key/` +
      GetSSMValue(
        this,
        `/${G.serviceName}/${Stage}/mlc-loan-maintenance-product/DynamoDBKMSKey`
      );

    // ---------- DYNAMODB -------- //

    new BMODDBConstruct(this, 'MLCProductTable', {
      tableName: `${ServiceName}-${Stage}-product-table`,
      //billingMode: 'PAY_PER_REQUEST', //'PROVISIONED' or 'PAY_PER_REQUEST'
      keySchema: [
        {
          attributeName: 'ProductCode',
          keyType: 'HASH',
        },
      ],
      attributeDefinitions: [
        {
          attributeName: 'ProductCode',
          attributeType: 'S',
        },
      ],
      kmsMasterKeyId: dynamokms,
      tags: taggingVars,
      // exceptionCode: ["E060"],
      // globalSecondaryIndexes: [],
      // kinesisStreamArn: '',
      // localSecondaryIndexes: [],
      //pointInTimeRecoverySpecificationEnabled: true,
      // streamSpecification: {},
      // timeToLiveSpecification: {}
    } as any);
  }
}
