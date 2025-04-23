import * as cdk from 'aws-cdk-lib';
import { GetSSMValue } from '@bmo-cdk/common';
import { CustomResource } from 'aws-cdk-lib';
import {
  BMOUSAGEPLANKEYConstruct,
  BMOAPIKEYConstruct,
  BMOAPIUSAGEPLANConstruct,
} from '@bmo-cdk/apigateway';
import { BMOSSMConstruct } from '@bmo-cdk/ssm-parameter';
import { globals as G, taggingVars } from './globals';

import { Construct } from 'constructs';

interface OperationsStackProps extends cdk.StackProps {
  readonly apiId: String;
  //readonly usagePlanId: String;
}

export class UsagePlanStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: OperationsStackProps) {
    super(scope, id, props);

    var Stage = this.node.tryGetContext('Stage');
    var accountID = this.node.tryGetContext('accountID');
    var stageShortCode = this.node.tryGetContext('stageShortCode');
    var regionShortCode = this.node.tryGetContext('regionShortCode');
    var Region = process.env.TargetAccountRegion;
    var ServiceName = G.serviceName;

    let apiKeyId;
    if (Stage === 'sandbox') {
      const apikey = new BMOAPIKEYConstruct(this, 'myApikey', {
        name: `${ServiceName}-${Stage}-API-key`,
        description: `API key for lambda, usage plan, gateway integration`,
        tags: taggingVars,
      });

      // use our own api key.
      apiKeyId = apikey.key.attrApiKeyId;
    } else {
      // CPS team will provision the api key
      apiKeyId = GetSSMValue(
        this,
        `/PBB/DeploymentConfig/MLC/intrapet-mlc-loan-maintenance-product-CDK-API/ApiKey/${Stage}/Id`
      );
    }

    var isAccountStage;
    if (
      Stage == 'sandbox' ||
      Stage == 'dev' ||
      Stage == 'prod' ||
      Stage == 'perf'
    ) {
      isAccountStage = true;
    } else {
      isAccountStage = false;
    }

    var apiId;

    if (isAccountStage) {
      apiId = props.apiId;
    } else {
      apiId = GetSSMValue(this, `/${ServiceName}/CDK/APIGateway/Id`);
    }

    const usageplan = new BMOAPIUSAGEPLANConstruct(
      this,
      'MlcLMAUsageplan-cdk',
      {
        apiStages: [
          {
            apiId: apiId,
            stage: Stage,
          },
        ],
        usagePlanName: `${ServiceName}-${Stage}-usage-plan`,
        description: 'Usage Plan for MLC Loan Maintenance Product API',
        quota: {
          limit: 500000,
          period: 'DAY',
        },
        throttle: {
          burstLimit: 1000,
          rateLimit: 1000,
        },
        tags: taggingVars,
      }
    );

    const key = new BMOUSAGEPLANKEYConstruct(this, 'MlcLMAUsagePlanKey', {
      keyId: apiKeyId,
      keyType: 'API_KEY',
      usagePlanId: usageplan.usg.ref,
    });

    // ---------------- BASE SSM PARAMETERS -------------- //
    const MlcUsagePlanId = new BMOSSMConstruct(this, 'MlcUsagePlanLMAIdCDK', {
      ssmName: `/${ServiceName}/UsagePlansCDK/${Stage}/Id`,
      ssmDescription: 'MLC Loan Maintenance Product Usage Plan ID CDK',
      ssmType: 'String',
      ssmValue: usageplan.usg.ref,
      tags: taggingVars,
    });
    MlcUsagePlanId.ssmparameter.overrideLogicalId('MlcUsagePlanLMAIdCDK');

    const MlcUsagePlanName = new BMOSSMConstruct(
      this,
      'MlcLMAUsagePlanNameCDK',
      {
        ssmName: `/${ServiceName}/UsagePlansCDK/${Stage}/Name`,
        ssmDescription: 'MLC Loan Maintenance Product Usage Plan Name CDK',
        ssmType: 'String',
        ssmValue: `${ServiceName}-${Stage}-mlc-api`,
        tags: taggingVars,
      }
    );
    MlcUsagePlanName.ssmparameter.overrideLogicalId('MlcLMAUsagePlanNameCDK');
  }
}
