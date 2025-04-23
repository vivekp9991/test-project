import * as cdk from 'aws-cdk-lib';
import { GetSSMValue } from '@bmo-cdk/common';
import { BMOCWAConstruct, BMOCWDConstruct } from '@bmo-cdk/cloudwatch';
import { globals as G } from './globals';
import { CustomResource } from 'aws-cdk-lib';

import { Construct } from 'constructs';

interface OperationsStackProps extends cdk.StackProps {
  // readonly apiId: String
  // readonly usagePlanId: String
}

export class OperationsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: OperationsStackProps) {
    super(scope, id, props);

    var Stage = this.node.tryGetContext('Stage');
    var accountID = this.node.tryGetContext('accountID');
    var stageShortCode = this.node.tryGetContext('stageShortCode');
    var regionShortCode = this.node.tryGetContext('regionShortCode');
    var Region = process.env.TargetAccountRegion;

    var ServiceName = G.serviceName;
    var opssns: string;
    switch (Stage) {
      case 'sandbox':
        opssns = `arn:aws:sns:${Region}:260773135411:BCOP-SNOW-UAT-USE1-CRITICAL-SNS`;
        break;
      case 'dev':
        opssns = `arn:aws:sns:${Region}:260773135411:BCOP-SNOW-UAT-CAC1-CRITICAL-SNS`;
        break;
      case 'sit2':
        opssns = `arn:aws:sns:${Region}:260773135411:BCOP-SNOW-UAT-CAC1-CRITICAL-SNS`;
        break;
      case 'sit3':
        opssns = `arn:aws:sns:${Region}:260773135411:BCOP-SNOW-UAT-CAC1-CRITICAL-SNS`;
        break;
      case 'sit4':
        opssns = `arn:aws:sns:${Region}:260773135411:BCOP-SNOW-UAT-CAC1-CRITICAL-SNS`;
        break;
      case 'perf':
        opssns = `arn:aws:sns:${Region}:260773135411:BCOP-SNOW-UAT-CAC1-CRITICAL-SNS`;
        break;
      case 'prod':
        opssns = `arn:aws:sns:${Region}:260773135411:BCOP-SNOW-PRD-CAC1-CRITICAL-SNS`;
        break;
    }
    // ---------- OPERATIONAL ALARMS -------- //
    const lambdaFunctions = [
      `MLC-${Stage}-Lambda-Get-Product`,
      `MLC-${Stage}-Lambda-Update-Product`,
    ];

    // Loop through each Lambda function and create both Error and Throttle alarms
    lambdaFunctions.forEach((lambdaName, index) => {
      const errorsAlarmID = `ErrorAlarm-${lambdaName}`;
      const throttleAlarmID = `ThrottleAlarm-${lambdaName}`;
      // Create Error Alarm
      new BMOCWAConstruct(this, errorsAlarmID, {
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        threshold: 1,
        period: 300,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        alarmName: `${lambdaName}-ErrorAlarm`,
        alarmDescription: `Lambda CloudWatch Alarm for ${lambdaName} Errors`,
        metricName: 'Errors',
        metricNamespace: `AWS/Lambda`,
        dimensions: [{ name: 'FunctionName', value: lambdaName }],
        statistic: 'Sum',
        alarmActions: [
          GetSSMValue(
            this,
            `/MLC/${Stage}/SNS/Topic/ARN/mlcCloudWatchNotificationTopic`
          ),
          opssns,
        ],
      });

      // Create Throttle Alarm
      new BMOCWAConstruct(this, throttleAlarmID, {
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        threshold: 1,
        period: 300,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        alarmName: `${lambdaName}-ThrottlesAlarm`,
        alarmDescription: `Lambda CloudWatch Alarm for ${lambdaName} Throttles`,
        metricName: 'Throttles',
        metricNamespace: `AWS/Lambda`,
        dimensions: [{ name: 'FunctionName', value: lambdaName }],
        statistic: 'Sum',
        alarmActions: [
          GetSSMValue(
            this,
            `/MLC/${Stage}/SNS/Topic/ARN/mlcCloudWatchNotificationTopic`
          ),
          opssns,
        ],
      });
    });
  }
}
