import * as cdk from 'aws-cdk-lib';
import { GetSSMValue } from '@bmo-cdk/common';
import { BMOAPIConstruct } from '@bmo-cdk/apigateway';
import { CustomResource } from 'aws-cdk-lib';
import { SwaggerApi } from './swagger-api';
import { BMOSSMConstruct } from '@bmo-cdk/ssm-parameter';
import { globals as G, taggingVars } from './globals';

import { Construct } from 'constructs';

// interface APIGatewayStackProps extends cdk.StackProps {
//   readonly usagePlan?: BMOSSMConstruct;
//   readonly usagePlanId?: String
// }

export class APIGatewayStack extends cdk.Stack {
  public readonly myapigw: BMOAPIConstruct;
  //public readonly usagePlanId: String

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    let Region = process.env.TargetAccountRegion;
    let ServiceName = G.serviceName;
    let Stage = this.node.tryGetContext('Stage');

    let vpceIdSharedServices = GetSSMValue(
      this,
      `/tie/cea/sharedservices/${Region}/execute-api/vpc/endpoint/id`
    );
    const swapperAPI = new SwaggerApi(this, 'ImportSwaggerAPI');

    //Create unique API Gateway name and ID
    const apiGatewayName = `${ServiceName}-${Stage}-CDK-API`;

    //Create API Gateway Gateway using BMOAPIConstruct
    this.myapigw = new BMOAPIConstruct(this, 'MyAPIGW', {
      apiGatewayName: apiGatewayName, //intrapet-mlc-loan-maintenance-product-CDK-API
      description: 'Api Gateway for Loan Maintenance Product CDK Version',
      endpointConfiguration: {
        types: ['PRIVATE'],
        vpcEndpointIds: [vpceIdSharedServices],
      },
      body: swapperAPI.swaggerApiJson,
      tags: taggingVars,
    });

    const APIGatewayID = new BMOSSMConstruct(this, 'APIGatewayIDCDK', {
      ssmName: `/${ServiceName}/${Stage}/CDK/APIGateway/Id`,
      ssmDescription: 'API Parameter for Loan Maintenance Product CDK Version',
      ssmType: 'String',
      ssmValue: this.myapigw.api.ref,
      tags: taggingVars,
    });
    APIGatewayID.ssmparameter.overrideLogicalId('APIGatewayIDCDK');

    //   if (props.usagePlan) {
    //     let UsagePlanName = `${GetSSMValue(this, `${props.usagePlan.ssmparameter.name}`)}`

    //     console.log(`UsagePlanName: ${UsagePlanName}`)
    //     const usagePlanResource = new CustomResource(this, 'create-usage-plan', {
    //       // "arn:aws:lambda:us-east-1:520049198415:function:SCCG-CustomResource-ApiUsagePlanCustomResource-sandbox-Lambda",
    //       serviceToken: GetSSMValue(this, `/SCCG/CustomResource/ApiUsagePlanCustomResource/${Stage}/${Region}/LambdaArn`),
    //       properties: {
    //         UsagePlanName: UsagePlanName,
    //         ForceUpdateValue: true,
    //         Description: "Testing usage plan creation through custom resource, updated description and throttle, and updated",
    //         ThrottleRateLimit: 19,
    //         ThrottleBurstLimit: 15
    //       }
    //     })

    //     this.usagePlanId = usagePlanResource.ref.toString()
    //     new BMOSSMConstruct(this, 'SSM-Usage-Plan-Id', {
    //       ssmName: `/SCCG/SharedUsage/${Stage}/CDK/${UsagePlanName}/Id`,
    //       ssmDescription: `UsagePlan Id for name: ${UsagePlanName}`,
    //       ssmType: 'String',
    //       ssmValue: `${UsagePlanName}`,
    //       tags: G.taggingVars
    //     })
    //   } else if (props.usagePlanId) {
    //     this.usagePlanId = props.usagePlanId
    //   } else {
    //     throw "Please either provide a usagePlan Name or usagePlan Id"
    //   }
  }
}
