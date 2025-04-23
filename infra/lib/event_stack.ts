// Scheduled Cron Job → Event Rule → Lambda Function(Event rule triggers a lambda function at a specific time using a scheduled cron job)

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { globals as G, taggingVars } from './globals';
import { BMOEventRuleConstruct } from '@bmo-cdk/event-rule';
import moment from 'moment';

export class EventStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    let Stage = this.node.tryGetContext('Stage');
    let accountID = this.node.tryGetContext('accountID');
    let Region = process.env.TargetAccountRegion;

    const currentDate = moment();
    const updatedDate = currentDate.add(10, 'minutes'); // Add 10 minutes to the current time
    const currentMinute = updatedDate.minute();
    const currentHour = updatedDate.hour();
    const currentDayOfMonth = updatedDate.date();
    const currentMonth = updatedDate.month() + 1; // Months are 0-indexed in moment
    const currentYear = updatedDate.year();
    const cronSchedule = `cron(${currentMinute} ${currentHour} ${currentDayOfMonth} ${currentMonth} ? ${currentYear})`;

    new BMOEventRuleConstruct(this, 'mlc-udpate-product-event-rule', {
      name: G.mlcEventRuleName,
      eventBusName: 'default',
      roleArn: `arn:aws:iam::${accountID}:role/${taggingVars.AppCatID}/intrapetmlcloanmaintenanceproduct/${G.mainFunctionName}`,
      description: 'Event bridge rule to update products from RDM',
      tags: taggingVars,
      scheduleExpression: cronSchedule /** 10 min after deployment */,
      targets: [
        {
          id: `mlc-loan-maintenance-update-product-${Stage}-target`,
          arn: `arn:aws:lambda:${Region}:${accountID}:function:MLC-${Stage}-Lambda-Update-Product`,
        },
      ],
    });
  }
}
