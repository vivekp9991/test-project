import * as cdk from 'aws-cdk-lib';
import { GetSSMValue } from '@bmo-cdk/common';
import { BMOSSMConstruct } from '@bmo-cdk/ssm-parameter';
import {
  BMOCWLGConstruct,
  BMOCWEConstruct,
  BMOCWAConstruct,
  BMOCWSConstruct,
} from '@bmo-cdk/cloudwatch';
import { BMOLambdaConstruct } from '@bmo-cdk/lambdafunction';
import { BMOAPISTAGEConstruct } from '@bmo-cdk/apigateway';
import { globals as G, taggingVars } from './globals';
import { CustomResource } from 'aws-cdk-lib';

import { Construct } from 'constructs';
//import { BMOLambdaDeploymentGroupConstruct, CANARY_10PERCENT_5MINUTES } from '@bmo-cdk/codedeploy';

interface FunctionStackProps extends cdk.StackProps {
  readonly timeout: BMOSSMConstruct;
  readonly memsize: BMOSSMConstruct;
  readonly concexe: BMOSSMConstruct;
  readonly apiId: string;
  readonly ProductTableName: BMOSSMConstruct;
  // readonly SandboxAPiKey: BMOSSMConstruct;
  readonly StageValue: BMOSSMConstruct;
}

export class FunctionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FunctionStackProps) {
    super(scope, id, props);

    let Stage = this.node.tryGetContext('Stage');
    let accountID = this.node.tryGetContext('accountID');
    let stageShortCode = this.node.tryGetContext('stageShortCode');
    let regionShortCode = this.node.tryGetContext('regionShortCode');
    let Region = process.env.TargetAccountRegion;

    let ServiceName = G.serviceName;

    // --------------- MAPPING ------------- //
    let myMappedVariable;
    let lambdaLayer,
      dcHost,
      CLIENTISSUINGCERTSCRTID,
      CLIENTROOTCERTSCRTID,
      SERVERCERTSCRTID,
      SERVERKEYSCRTID,
      dcHost_NCCS;
    let chaosLambdaLayer;
    switch (Stage) {
      case 'sandbox':
        myMappedVariable = 'string';
        lambdaLayer = GetSSMValue(this, [
          `/tie/cea/sandboxftr4/${Region}/lambda/dynatrace/layer/nodejs`,
        ]);
        dcHost = GetSSMValue(
          this,
          `/SCCG/DC-PersonalLoanPlanArrangement/CDK/APIGateway/Id`
        );
        dcHost_NCCS = 'o0pb092dgl.execute-api.us-east-1.amazonaws.com';
        break;
      case 'dev':
        myMappedVariable = 'string';
        lambdaLayer = GetSSMValue(this, [
          `/tie/cea/${Stage}/${Region}/lambda/dynatrace/layer/nodejs`,
        ]);
        dcHost = GetSSMValue(
          this,
          `/SCCG/DC-PersonalLoanPlanArrangement/CDK/APIGateway/Id`
        );
        dcHost_NCCS = GetSSMValue(
          this,
          `/SCCG/SCCG-LineOfCreditArangementReport/CDK/GWHost`
        );
        break;
      case 'sit2':
        myMappedVariable = 'string';
        dcHost = GetSSMValue(
          this,
          `/SCCG/DC-PersonalLoanPlanArrangement/CDK/APIGateway/Id`
        );
        dcHost_NCCS = GetSSMValue(
          this,
          `/SCCG/SCCG-LineOfCreditArangementReport/CDK/GWHost`
        );
        break;
      case 'sit3':
        myMappedVariable = 'string';
        dcHost = GetSSMValue(
          this,
          `/SCCG/DC-PersonalLoanPlanArrangement/CDK/APIGateway/Id`
        );
        dcHost_NCCS = GetSSMValue(
          this,
          `/SCCG/SCCG-LineOfCreditArangementReport/CDK/GWHost`
        );
        break;
      case 'perf':
        myMappedVariable = 'string';
        lambdaLayer = GetSSMValue(this, [
          `/tie/cea/${Stage}/${Region}/lambda/dynatrace/layer/nodejs`,
        ]);
        dcHost = GetSSMValue(
          this,
          `/SCCG/DC-PersonalLoanPlanArrangement/CDK/APIGateway/Id`
        );
        dcHost_NCCS = GetSSMValue(
          this,
          `/SCCG/SCCG-LineOfCreditArangementReport/CDK/GWHost`
        );
        chaosLambdaLayer =
          'arn:aws:lambda:ca-central-1:015329035773:layer:bmo-gremlin-layer-develop:12';
        break;
      case 'prod':
        myMappedVariable = 'string';
        lambdaLayer = GetSSMValue(this, [
          `/tie/cea/${Stage}/${Region}/lambda/dynatrace/layer/nodejs`,
        ]);
        dcHost = GetSSMValue(
          this,
          `/SCCG/DC-PersonalLoanPlanArrangement/CDK/APIGateway/Id`
        );
        break;
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

    if (Stage == 'dev') {
      CLIENTISSUINGCERTSCRTID = `/tie/cea/sit2/${Region}/26777/DP/MutualCerts/ClientSideCerts/ClientIssuingCert`;
      CLIENTROOTCERTSCRTID = `/tie/cea/sit2/${Region}/26777/DP/MutualCerts/ClientSideCerts/ClientRootCert`;
      SERVERCERTSCRTID = `/tie/cea/sit2/${Region}/26777/IngressNLB/MutualCerts/ServerSideCerts/ServerCert`;
      SERVERKEYSCRTID = `/tie/cea/sit2/${Region}/26777/IngressNLB/MutualCerts/ServerSideCerts/ServerKey`;
    } else {
      CLIENTISSUINGCERTSCRTID = `/tie/cea/${Stage}/${Region}/26777/DP/MutualCerts/ClientSideCerts/ClientIssuingCert`;
      CLIENTROOTCERTSCRTID = `/tie/cea/${Stage}/${Region}/26777/DP/MutualCerts/ClientSideCerts/ClientRootCert`;
      SERVERCERTSCRTID = `/tie/cea/${Stage}/${Region}/26777/IngressNLB/MutualCerts/ServerSideCerts/ServerCert`;
      SERVERKEYSCRTID = `/tie/cea/${Stage}/${Region}/26777/IngressNLB/MutualCerts/ServerSideCerts/ServerKey`;
    }

    var apiId;

    if (isAccountStage) {
      apiId = props.apiId;
    } else {
      apiId = GetSSMValue(this, `/${ServiceName}/CDK/APIGateway/Id`);
    }
    // --------------- ENVIRONMENT VARIABLES ------------- //
    var environmentVariables = {
      LOGGING_LEVEL: 'DEBUG',
      REGION: Region ? Region : '',
      STAGE: Stage ? Stage : '',
      SERVICE_NAME: ServiceName ? ServiceName : '',
      CLIENTISSUINGCERTSCRTID: CLIENTISSUINGCERTSCRTID,
      CLIENTROOTCERTSCRTID: CLIENTROOTCERTSCRTID,
      SERVERCERTSCRTID: SERVERCERTSCRTID,
      SERVERKEYSCRTID: SERVERKEYSCRTID,
      DT_OPEN_TELEMETRY_ENABLE_INTEGRATION: 'true',
      SRE_DT_CW_LOGS_INTEGRATION_ENABLED: 'true',
      AWS_LAMBDA_EXEC_WRAPPER: '/opt/dynatrace',
      Product_Table: props.ProductTableName.ssmparameter.value,
      // Sandbox_APiKey: props.SandboxAPiKey.ssmparameter.value,
      StageValue: props.StageValue.ssmparameter.value,
      CERT_CENTRALIZED_LB: `/tie/cea/sharedservices/centralized/${Region}/TLS/ClientRootCert`,
      NLB_CENTRALIZED: GetSSMValue(
        this,
        `/tie/cea/sharedservices/centralized/${Region}/nlb`
      ),
      dcHost: dcHost,
      dcHost_NCCS: dcHost_NCCS,
    };

    let SubnetIds = [
      `/tie/cea/${Stage}/${Region}/subnet-id-priv1`,
      `/tie/cea/${Stage}/${Region}/subnet-id-priv2`,
    ];
    if (Stage == 'prod') {
      SubnetIds.push(`/tie/cea/${Stage}/${Region}/subnet-id-priv3`);
    }

    // --------------- LAMBDA FUNCTION ---------------- //
    // 2 functions: 1 get values from db based on product code. 2. write to db like write an update.
    console.log(
      'Setting Reserved Concurrency --> ' + Stage == 'prod' ? '1' : 'none'
    );

    const GetProduct_Lambda = new BMOLambdaConstruct(
      this,
      'Lambda-Get-Product',
      {
        functionName: `MLC-${Stage}-Lambda-Get-Product`,
        functionRelativePath: '../service/lambda-functions',
        handler: 'index.getProduct',
        //functionLayerARNs: GetSSMValue(this,[`/tie/cea/${Stage}/${Region}/lambda/dynatrace/layer/nodejs`]),
        resourceBasedPolicyConf: [
          {
            principal: 'apigateway.amazonaws.com',
            action: 'lambda:InvokeFunction',
            sourceArn: `arn:aws:execute-api:${Region}:${accountID}:${apiId}/*/*/*`,
          },
        ],
        environmentVariables: environmentVariables,
        runtime: 'nodejs18.x',
        tags: taggingVars,
        subnetIds: GetSSMValue(this, SubnetIds),
        securityGroupIds: GetSSMValue(this, [
          `/tie/cea/${Stage}/${Region}/vpcsecuritygroupid`,
        ]),
        lambdaLogGroupKmsKeyArn:
          `arn:aws:kms:${Region}:${accountID}:key/` +
          GetSSMValue(
            this,
            `/tie/cea/${Stage}/${Region}/cloudwatch/kms/key/name`
          ),
        lambdaLogRetentionInDays: 30,
        // Custom role
        reservedConcurrentExecutions: Stage == 'prod' ? 10 : undefined,
        existingRoleArn: `arn:aws:iam::${accountID}:role/${taggingVars.AppCatID}/intrapetmlcloanmaintenanceproduct/${G.ProjectName}-${stageShortCode}-mainFunction`,
        // Sandbox 1 debug role
        //existingRoleArn: `arn:aws:iam::${accountID}:role/lambda-role/hub-cg-${stageShortCode}-${regionShortCode}-sccg-PAR-GetFinSnapshotRole`,
        // Sandbox 2 debug role
        //existingRoleArn: `arn:aws:iam::015329035773:role/lambda-role/tie-hc-sbx01-ue1-ApiDeploymentCustomResource-LambdaRole`,
        dynatraceConfig: true,
        timeout: parseInt(props.timeout.ssmparameter.value),
        memorySize: 256,
      } as any
    );

    const UpdateProduct_Lambda = new BMOLambdaConstruct(
      this,
      'Lambda-Update-Product',
      {
        functionName: `MLC-${Stage}-Lambda-Update-Product`,
        functionRelativePath: '../service/lambda-functions',
        handler: 'index.updateProduct',
        //functionLayerARNs: GetSSMValue(this,[`/tie/cea/${Stage}/${Region}/lambda/dynatrace/layer/nodejs`]),
        resourceBasedPolicyConf: [
          {
            principal: 'events.amazonaws.com',
            action: 'lambda:InvokeFunction',
            sourceArn: `arn:aws:events:${Region}:${accountID}:rule/${G.mlcEventRuleName}`,
          },
        ],
        environmentVariables: environmentVariables,
        runtime: 'nodejs18.x',
        tags: taggingVars,
        subnetIds: GetSSMValue(this, SubnetIds),
        securityGroupIds: GetSSMValue(this, [
          `/tie/cea/${Stage}/${Region}/vpcsecuritygroupid`,
        ]),
        lambdaLogGroupKmsKeyArn:
          `arn:aws:kms:${Region}:${accountID}:key/` +
          GetSSMValue(
            this,
            `/tie/cea/${Stage}/${Region}/cloudwatch/kms/key/name`
          ),
        lambdaLogRetentionInDays: 30,
        // Custom role
        reservedConcurrentExecutions: Stage == 'prod' ? 10 : undefined,
        existingRoleArn: `arn:aws:iam::${accountID}:role/${taggingVars.AppCatID}/intrapetmlcloanmaintenanceproduct/${G.ProjectName}-${stageShortCode}-mainFunction`,
        // Sandbox 1 debug role
        //existingRoleArn: `arn:aws:iam::${accountID}:role/lambda-role/hub-cg-${stageShortCode}-${regionShortCode}-sccg-PAR-GetFinSnapshotRole`,
        // Sandbox 2 debug role
        //existingRoleArn: `arn:aws:iam::015329035773:role/lambda-role/tie-hc-sbx01-ue1-ApiDeploymentCustomResource-LambdaRole`,
        dynatraceConfig: true,
        timeout: parseInt(props.timeout.ssmparameter.value),
        memorySize: 256,
      } as any
    );

    // --------------- API DEPLOYMENT CUSTOM RESOURCE ------------- //

    const APIDeploymentCustom = new CustomResource(this, 'ApiDeployment', {
      serviceToken: GetSSMValue(
        this,
        `/tie/hc/ApiDeploymentCustomResource/${Stage}/${process.env.TargetAccountRegion}/LambdaArn`
      ),
      properties: {
        ForceUpdateValue: GetSSMValue(
          this,
          '/tie/hc/CustomResourceForceUpdate/Value'
        ),
        ApiId: apiId,
      },
    });
    console.log(
      `/tie/hc/ApiDeploymentCustomResource/${Stage}/${process.env.TargetAccountRegion}/LambdaArn`
    );
    console.log(apiId);

    // --------------- API LOG GROUP ------------- //

    const API_LogGroup = new BMOCWLGConstruct(this, 'APILogGroup', {
      logGroupName: `/aws/apigateway/accesslogs/${ServiceName}-CDK-API-${Stage}`,
      retentionInDays: 30,
      kmsMasterKeyId:
        `arn:aws:kms:${Region}:${accountID}:key/` +
        GetSSMValue(
          this,
          `/tie/cea/${Stage}/${Region}/cloudwatch/kms/key/name`
        ),
      tags: taggingVars,
    });

    // --------------- API STAGE DEPLOYMENT ------------- //

    const API_Stage = new BMOAPISTAGEConstruct(this, 'APIStage', {
      description: 'API Stage for MLC-Loan-Maintenance-Product-CDK-API',
      restApiId: apiId,
      deploymentId: APIDeploymentCustom.getAttString('DeploymentId'),
      stageName: Stage,
      methodSettings: [
        {
          httpMethod: '*',
          resourcePath: '/*',
          loggingLevel: 'INFO',
        },
      ],
      variables: { Stage: Stage },
      accessLogSetting: {
        destinationArn: API_LogGroup.cwlLogGroup.attrArn,
        format:
          '{"_index":"awslogstash-$context.requestTime","_type":"doc","_id":"$context.requestId","_version":1,"_source":{"offset":2582,"appRuntime":"SCCG-PartyArrangementReport","functionName":"$context.domainName","corrId":"$context.requestId","logger":"$context.apiId","input_type":"log","source":"/aws/api/$context.apiId","epochMillis":$context.requestTimeEpoch,"type":"aws:api","serviceName":"SCCG-SCCG-PartyArrangementReport","tags":[],"jobID":"$context.requestId","logstash":{"hostName":"","location":"hub"},"@timestamp":"$context.requestTime","logLevel":"INFO","@version":"1","beat":{"hostname":"","name":"","version":""},"host":"$context.domainName","inputType":"cloudwatch","detail":"{context.apiId:$context.apiId,context.authorizer.claims.property:$context.authorizer.claims.property,context.authorizer.principalId:$context.authorizer.principalId,context.awsEndpointRequestId:$context.awsEndpointRequestId,context.domainName:$context.domainName,context.domainPrefix:$context.domainPrefix,context.error.message:$context.error.message,context.error.messageString:$context.error.messageString,context.error.responseType:$context.error.responseType,context.error.validationErrorString:$context.error.validationErrorString,context.extendedRequestId:$context.extendedRequestId,context.httpMethod:$context.httpMethod,context.identity.accountId:$context.identity.accountId,context.identity.apiKey:$context.identity.apiKey,context.identity.apiKeyId:$context.identity.apiKeyId,context.identity.caller:$context.identity.caller,context.identity.sourceIp:$context.identity.sourceIp,context.identity.user:$context.identity.user,context.identity.userAgent:$context.identity.userAgent,context.identity.userArn:$context.identity.userArn,context.path:$context.path,context.protocol:$context.protocol,context.requestId:$context.requestId,context.responseOverride.status:$context.responseOverride.status,context.requestTime:$context.requestTime,context.requestTimeEpoch:$context.requestTimeEpoch,context.resourceId:$context.resourceId,context.resourcePath:$context.resourcePath,context.stage:$context.stage,context.wafResponseCode:$context.wafResponseCode,context.webaclArn:$context.webaclArn,context.xrayTraceId:$context.xrayTraceId}","esTimestamp":"$context.requestTime","fields":{"appCatCode":"6184","cioName":"smartCore","docType":"aws","environmentType":"$context.stage"}},"fields":{"@timestamp":["$context.requestTime"],"esTimestamp":["$context.requestTime"]},"highlight":{"serviceName":["@kibana-highlighted-field@SCCG-SCCG-PartyArrangementReport@/kibana-highlighted-field@"]},"sort":[$context.requestTimeEpoch]}',
      },
      tags: taggingVars,
    });

    // --------------- CLOUDWATCH BLUE / GREEN CANARY DEPLOYMENT ALARM  ------------- //

    const getProduct_alarm = new BMOCWAConstruct(this, 'GET-Product-Alarm', {
      comparisonOperator: 'GreaterThanThreshold',
      threshold: 1, // alarm threshold
      period: 60,
      evaluationPeriods: 1, // all the data points within each evaluation period must be greater than or equal to the threshold for the alarm to trigger
      datapointsToAlarm: 1, // the number of data points within the Evaluation Periods that must be breaching to cause the alarm to go to the ALARM state. The breaching data points don't have to be consecutive, they just must all be within the last number of data points equal to Evaluation Period
      alarmName: `${ServiceName}-${Stage}-GetProduct-DeploymentAlarm`,
      alarmDescription: `Lambda CloudWatch Alarm for MLC-${Stage}-Lambda-Get-Product`,
      metricName: 'Errors', // ask cloud team for array of string inputs
      metricNamespace: `AWS/Lambda`,
      dimensions: [
        { name: 'FunctionName', value: `MLC-${Stage}-Lambda-Get-Product` },
      ],
      statistic: 'Sum',
    });

    const updateProduct_alarm = new BMOCWAConstruct(
      this,
      'Update-Product-Alarm',
      {
        comparisonOperator: 'GreaterThanThreshold',
        threshold: 1, // alarm threshold
        period: 60,
        evaluationPeriods: 1, // all the data points within each evaluation period must be greater than or equal to the threshold for the alarm to trigger
        datapointsToAlarm: 1, // the number of data points within the Evaluation Periods that must be breaching to cause the alarm to go to the ALARM state. The breaching data points don't have to be consecutive, they just must all be within the last number of data points equal to Evaluation Period
        alarmName: `${ServiceName}-${Stage}-UpdateProduct-DeploymentAlarm`,
        alarmDescription: `Lambda CloudWatch Alarm for MLC-${Stage}-Lambda-Update-Product`,
        metricName: 'Errors', // ask cloud team for array of string inputs
        metricNamespace: `AWS/Lambda`,
        dimensions: [
          { name: 'FunctionName', value: `MLC-${Stage}-Lambda-Update-Product` },
        ],
        statistic: 'Sum',
      }
    );

    // new BMOLambdaDeploymentGroupConstruct (this, "deployment", {
    //   alias: Boilerplate_Lambda.lambdaFunction.currentVersion.addAlias('lambdaDeploy'),
    //   alarms: [alarm.cwAlarm.attrArn], // Code deploy will auto-rollback to previous version if cloudwatch alarm threshold is breached,
    //   role:`arn:aws:iam::${accountID}:role/Lambda-Service-Role-CodeDeploy`, // used to identify a particular resource in the Amazon Web Services (AWS) public cloud (ask cloud team to create a role for both codedeploy and cloudwatch)
    //   deploymentGroupName: `${ServiceName}-CDK-${Stage}-myLambdaFunction-DeploymentGroup`,
    //   deploymentConfig: CANARY_10PERCENT_5MINUTES, // 10% is shifted from the original to the new lambda version, and then after 5 minutes, if there are no errors then the rest (90%) will shift to new lambda
    //   autoRollback: {
    //     failedDeployment: true,
    //     stoppedDeployment: true,
    //     deploymentInAlarm: true
    //   },
    // });
  }
}
