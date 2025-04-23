import * as cdk from 'aws-cdk-lib';
import { GetSSMValue } from '@bmo-cdk/common';
import { BMOAPIConstruct, BMOAPISTAGEConstruct } from '@bmo-cdk/apigateway';
import { CustomResource } from 'aws-cdk-lib';
import { BMOSSMConstruct } from '@bmo-cdk/ssm-parameter';
import { globals as G, taggingVars } from './globals';

import { Construct } from 'constructs';

export class SSMStack extends cdk.Stack {
  public readonly ServiceName: string;
  public readonly myLambdaFunctionTimeoutExport: BMOSSMConstruct;
  public readonly myLambdaFunctionMemorySizeExport: BMOSSMConstruct;
  public readonly myLambdaFunctionConcurrentExecutionsExport: BMOSSMConstruct;
  public readonly myUsagePlanName: BMOSSMConstruct;
  public readonly ProductTableName: BMOSSMConstruct;
  // public readonly SandboxAPiKey: BMOSSMConstruct;
  public readonly Stage_Value: BMOSSMConstruct;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    var Stage = this.node.tryGetContext('Stage');
    var accountID = this.node.tryGetContext('accountID');
    var stageShortCode = this.node.tryGetContext('stageShortCode');
    var regionShortCode = this.node.tryGetContext('regionShortCode');
    var Region = process.env.TargetAccountRegion;

    this.ServiceName = G.serviceName;

    // ---- SSM Parameter ------ //

    new BMOSSMConstruct(this, 'SSM-API-Name-Parameter', {
      ssmName: `/${this.ServiceName}/${Stage}/CDK/APIGateway/Name`,
      ssmDescription:
        'API Parameter for MLC loan maintenance product CDK Version',
      ssmType: 'String',
      ssmValue: `${this.ServiceName}-${Stage}-API`,
      tags: taggingVars,
    });

    new BMOSSMConstruct(this, 'SSM-Service-Name-Parameter', {
      ssmName: `/${this.ServiceName}/${Stage}/CDK/ServiceName`,
      ssmDescription:
        'API Parameter for MLC loan maintenance product CDK Version',
      ssmType: 'String',
      ssmValue: this.ServiceName,
      tags: taggingVars,
    });

    const FunctionLogLevelExport = new BMOSSMConstruct(
      this,
      'SSM-Function-Log-Level-Parameter',
      {
        ssmName: `/${this.ServiceName}/${Stage}/CDK/Lambda/LogLevel`,
        ssmDescription:
          'API Parameter for MLC loan maintenance product CDK Version',
        ssmType: 'String',
        ssmValue: 'DEBUG',
        tags: taggingVars,
      }
    );

    // GetFinancialSnapshot Lambda

    const FunctionTracingExport = new BMOSSMConstruct(
      this,
      'SSM-Function-Tracing-Parameter',
      {
        ssmName: `/${this.ServiceName}/${Stage}/CDK/Lambda/myLambdaFunction/Tracing`,
        ssmDescription:
          'API Parameter for MLC loan maintenance product CDK Version',
        ssmType: 'String',
        ssmValue: 'Active',
        tags: taggingVars,
      }
    );

    const myLambdaFunctionNameExport = new BMOSSMConstruct(
      this,
      'SSM-Function-Name-Parameter',
      {
        ssmName: `/${this.ServiceName}/${Stage}/CDK/Lambda/myLambdaFunction/FunctionName`,
        ssmDescription:
          'API Parameter for MLC loan maintenance product CDK Version',
        ssmType: 'String',
        ssmValue: `${this.ServiceName}-CDK-${Stage}-myLambdaFunction-Lambda`,
        tags: taggingVars,
      }
    );

    this.myLambdaFunctionConcurrentExecutionsExport = new BMOSSMConstruct(
      this,
      'SSM-Concurrent-Executions-Parameter',
      {
        ssmName: `/${this.ServiceName}/${Stage}/CDK/Lambda/myLambdaFunction/ReservedConcurrentExecutions`,
        ssmDescription:
          'API Parameter for MLC loan maintenance product CDK Version',
        ssmType: 'String',
        ssmValue: '20',
        tags: taggingVars,
      }
    );

    this.myLambdaFunctionTimeoutExport = new BMOSSMConstruct(
      this,
      'SSM-Timeout-Parameter',
      {
        ssmName: `/${this.ServiceName}/${Stage}/CDK/Lambda/myLambdaFunction/Timeout`,
        ssmDescription:
          'API Parameter for MLC loan maintenance product CDK Version',
        ssmType: 'String',
        ssmValue: '31', //28
        tags: taggingVars,
      }
    );

    this.myLambdaFunctionMemorySizeExport = new BMOSSMConstruct(
      this,
      'SSM-Memory-Size-Parameter',
      {
        ssmName: `/${this.ServiceName}/${Stage}/CDK/Lambda/myLambdaFunction/MemorySize`,
        ssmDescription:
          'API Parameter for MLC loan maintenance product CDK Version',
        ssmType: 'String',
        ssmValue: '2048',
        tags: taggingVars,
      }
    );

    this.ProductTableName = new BMOSSMConstruct(this, 'SSM-Product-Table', {
      ssmName: `/${this.ServiceName}/${Stage}/CDK/product-table`,
      ssmDescription:
        'API Parameter for MLC loan maintenance product CDK Version',
      ssmType: 'String',
      ssmValue: `intrapet-mlc-loan-maintenance-product-${Stage}-product-table`,
      tags: taggingVars,
    });

    // this.SandboxAPiKey = new BMOSSMConstruct(this, 'Sandbox-apikey', {
    //   ssmName: `/PBB/DeploymentConfig/MLC/intrapet-mlc-loan-maintenance-product-CDK-API/ApiKey/Sandbox/Value`,
    //   ssmDescription: 'Sandbox API Key for MLC loan maintenance product CDK Version',
    //   ssmType: 'String',
    //   ssmValue: `0U0FBhE7ja5YmG5RmslmQ8TwztMWQ9TV68De6oi6`,
    //   tags: taggingVars
    // });

    this.Stage_Value = new BMOSSMConstruct(this, 'Stage-value', {
      ssmName: `/${this.ServiceName}/${Stage}/CDK/Stage_Value`,
      ssmDescription:
        'Stage-value for MLC loan maintenance product CDK Version',
      ssmType: 'String',
      ssmValue: `${Stage}`,
      tags: taggingVars,
    });
  }
}
