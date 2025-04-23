#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Aspects } from 'aws-cdk-lib';
import {globals as G} from "../lib/globals"; // Import Globals
import controller from '../../controller.json'
// ---------- STACK IMPORTS -------- //

import { FunctionStack } from '../lib/function_stack';  // point to the file name with your stack definition and uncomment this line
import { APIGatewayStack } from '../lib/api_stack';  // point to the file name with your stack definition and uncomment this line
import { SSMStack } from '../lib/ssm_stack';  // point to the file name with your stack definition and uncomment this line
import { OperationsStack } from '../lib/operations_stack';  // point to the file name with your stack definition and uncomment this line
import { DBStack } from '../lib/db_stack';  // point to the file name with your stack definition and uncomment this line
import { IamStack } from '../lib/iam_stack';
import { KMSStack } from '../lib/kms_stack';
import { UsagePlanStack } from '../lib/usageplan_stack';
import { EventStack } from '../lib/event_stack';

const app = new cdk.App();
const Stage = process.env.Stage;
// ------------ Update the stack name and uncomment the stack that that you would like to deploy ---------- //

var isAccountStage;


if (Stage == "sandbox" || Stage == "dev" || Stage == "prod" || Stage == "perf") {
    isAccountStage = true;
} else {
    isAccountStage = false;
}

// ~~~~~ Stacks to deploy ~~~~~

// Iam stack
export var iamStack:any;

// SSM stack
export var ssmStack:any;

// KMS stack
export var kmsStack:any;

// Api Gateway stack
export var apiGatewayStack: any;

// Lambda Function stack
export var functionStack:any;

//usage plan stack
export var usageplanStack:any;

// Operations stack
export var operationsStack:any;

// Event Rule stack
export var eventRuleStack:any;

// Database stack
export var dbStack: any;

// ~~~~~ Choose to deploy your IAM roles or the BMO-CDK pipeline kit ~~~~

// Configure 'stacks' variable in ./controller.json
// stacks = KMS : KMS STACK , stacks = IAM : IAM STACK , stacks = MAIN : DB stack, stacks = MAIN : FULL SERVERLESS STACK
// NOTE: *If first deployment of template, please deploy your IAM stack before the full serverless stack, i.e set stacks = I and deploy, then stacks = A and re-deploy.

// KMS
if (controller.stacks == 'KMS'){
    console.log("Building KMS stack")

    kmsStack = new KMSStack(
        app, G.ProjectName as string +'-'+ process.env.TargetAccountStage as string+'-KMSStack',
        {env: {account: process.env.TargetAccountNumber as string, region: process.env.TargetAccountRegion as string}, terminationProtection: false}
        );
    Aspects.of(kmsStack).add(new cdk.Tag('RepositoryName', process.env.PROJECT_NAME as string));
}

//  IAM STACK
else if (controller.stacks == 'IAM'){

    console.log("Building IAM stack")

    iamStack = new IamStack(
        app, G.ProjectName as string +'-'+ process.env.TargetAccountStage as string+'-IamStackV3',
        {env: {account: process.env.TargetAccountNumber as string, region: process.env.TargetAccountRegion as string}, terminationProtection: false}
        );
    Aspects.of(iamStack).add(new cdk.Tag('RepositoryName', process.env.PROJECT_NAME as string));

}
// SERVERLESS STACK
else if (controller.stacks == 'MAIN'){

    console.log('Building all stacks for pipeline')

    ssmStack = new SSMStack(app, G.ProjectName as string +'-'+ process.env.TargetAccountStage as string+'-SSMStackV1',{env: {account: process.env.TargetAccountNumber as string, region: process.env.TargetAccountRegion as string}, terminationProtection: false});
    Aspects.of(ssmStack).add(new cdk.Tag('RepositoryName', process.env.PROJECT_NAME as string));

    // export var apiGatewayStack: any;
    // if (isAccountStage){
    //     apiGatewayStack = new APIGatewayStack(app, process.env.PROJECT_NAME as string +'-'+ process.env.TargetAccountStage as string+'-APIGatewayStack', {
    //         usagePlan: ssmStack.myUsagePlanName,
    //         env: {account: process.env.TargetAccountNumber as string, region: process.env.TargetAccountRegion as string}, terminationProtection: false
    //     });
    //     Aspects.of(apiGatewayStack).add(new cdk.Tag('RepositoryName', process.env.PROJECT_NAME as string));
    //     apiGatewayStack.addDependency(ssmStack);
    // }
    if (isAccountStage){
        apiGatewayStack = new APIGatewayStack(app, G.ProjectName as string +'-'+ process.env.TargetAccountStage as string+'-APIGatewayStack',
        {env: {account: process.env.TargetAccountNumber as string, region: process.env.TargetAccountRegion as string}});
        Aspects.of(apiGatewayStack).add(new cdk.Tag('RepositoryName', process.env.PROJECT_NAME as string));
        apiGatewayStack.addDependency(ssmStack);
    }
    //console.log(`functionStack.usagePlanId: ${apiGatewayStack.usagePlanId}`)
    functionStack = new FunctionStack(app, G.ProjectName as string +'-'+ process.env.TargetAccountStage as string+'-FunctionStack',{
        apiId: (apiGatewayStack && apiGatewayStack.myapigw) ? apiGatewayStack.myapigw.api.ref : '',
        timeout: ssmStack.myLambdaFunctionTimeoutExport,
        memsize:ssmStack.myLambdaFunctionMemorySizeExport,
        concexe:ssmStack.myLambdaFunctionConcurrentExecutionsExport,
        ProductTableName:ssmStack.ProductTableName,
        // SandboxAPiKey:ssmStack.SandboxAPiKey,
        StageValue:ssmStack.Stage_Value,

        env: {account: process.env.TargetAccountNumber as string, region: process.env.TargetAccountRegion as string}});
    Aspects.of(functionStack).add(new cdk.Tag('RepositoryName', process.env.PROJECT_NAME as string));
    functionStack.addDependency(ssmStack);

    // Function stack deploys the API stage.
    usageplanStack = new UsagePlanStack(app, G.ProjectName as string +'-'+ process.env.TargetAccountStage as string+'-UsageplanStack', {
        apiId: (apiGatewayStack && apiGatewayStack.myapigw) ? apiGatewayStack.myapigw.api.ref : '',
        //usagePlanId: (apiGatewayStack  && apiGatewayStack.usagePlanId) ? apiGatewayStack.usagePlanId : '',
        env: {account: process.env.TargetAccountNumber as string, region: process.env.TargetAccountRegion as string}});
        Aspects.of(usageplanStack).add(new cdk.Tag('RepositoryName', process.env.PROJECT_NAME as string));
    usageplanStack.addDependency(functionStack)

    eventRuleStack = new EventStack(app, G.ProjectName as string +'-'+ process.env.TargetAccountStage as string+'-EventRuleStack', {
        env: {account: process.env.TargetAccountNumber as string, region: process.env.TargetAccountRegion as string
    }});
    Aspects.of(eventRuleStack).add(new cdk.Tag('RepositoryName', process.env.PROJECT_NAME as string));
    eventRuleStack.addDependency(functionStack);
}
else if (controller.stacks == 'DB'){
    dbStack = new DBStack(app, G.ProjectName as string +'-'+ process.env.TargetAccountStage as string+'-DBStack',{
        env: {account: process.env.TargetAccountNumber as string, region: process.env.TargetAccountRegion as string}, terminationProtection: false});
    Aspects.of(dbStack).add(new cdk.Tag('RepositoryName', process.env.PROJECT_NAME as string));
}
else if (controller.stacks == 'OP'){
    operationsStack = new OperationsStack(app, G.ProjectName as string +'-'+ process.env.TargetAccountStage as string+'-OperationsStack', {
        env: {account: process.env.TargetAccountNumber as string, region: process.env.TargetAccountRegion as string
    }});
    Aspects.of(operationsStack).add(new cdk.Tag('RepositoryName', process.env.PROJECT_NAME as string));
} 
