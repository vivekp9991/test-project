import * as cdk from 'aws-cdk-lib';

import { Construct } from 'constructs';
//
//  Configuration variables - custom_prefix_for_service
//

//
//  CREATE STACKS
//  - stacks  I = iam stack only (api/main stacks are independent of iam stack)
//            A = all stacks (used for production single pass deployment)
//  - 2 stacks are used for the following reasons
//      1. IAM creates all roles and policies, other stacks can be deployed without CloudEng approvals
//      2. All stacks (used for production single pass deployment)
//  - when deleting stacks (if they were initially deployed all at once) they must be deleted one at a time in the following order to avoid orphan resources
//      1.
//      2. the IAM resources stack
//  - for development environments, to allow production single pass deployment stacks to be deleted without requiring the IAM stack to also be deleted,
//    the stacks can be created in 2 deployments. This will make the IAM stack independent of the rest of the stacks
//      1. deploy 'I' stack (iam)
//      2. deploy 'A' stack (all), production single pass deployment
//  - for production the stacks can be deployed all at once
//      1. deploy 'A' all stacks
//  Note    - set the web hook as needed (version=CloudEng for IAM, v1 for main/api)
//          - http://bitbucket-cloud-webhook.hcloud.bmogc.net/bitbucket/cdk/deployment?sandbox=1&version=CloudEng
//

/**
 * Edit this variable before *your first* deployment, doesnt need to change on every deployment.
	Please ensure this value is less than 5 Characters long.
*/
const custom_service_prefix = 'intrapet-mlc';

//
//  Calculated global values below here (no need to edit these)
//

//Service name
const serviceName = custom_service_prefix + '-loan-maintenance-product'; //change service name to maintenance-product, i.e "intrapet-mlc-loan-maintenance-product"

//
//  Project and environment variables
//  - this code will allow the values to be retreived from either command line parameters
//    or environment variables
//  - the created variables are used in naming all resources
//

//  Environment variable examples
// - Stage							sandbox
// - accountId						520049198415
// - stageShortCode			    	sbx01		<< not used anywhere in code
// - regionShortCode				ue1 ca1
// - Region						    us-east-1
// ...the following variables are used in the pipeline
// - TargetAccountNumber			520049198415
// - TargetAccountRegion			us-east-1
// - TargetAccountRegionShortCode	ue1
// - TargetAccountStage			    sbx01
// - process.env.PROJECT_NAME		sccg-cial-cdk-alan
const stageShortCode = process.env.TargetAccountStage;
const ProjectName = 'MLC-LoanMaintenanceProduct-CDK';
const applicationName = `${ProjectName}-${stageShortCode}`; // MLC-LoanMaintenanceProduct-CDK-sbx01

//Role Names
const mainFunctionName: any = `${applicationName}-mainFunction`; // MLC-LoanMaintenanceProduct-CDK-sbx01-mainFunction
const codeDeployRoleName: any = `${applicationName}-codeDeploy`;
const prehookFunctionName: any = `${applicationName}-prehookFunction`;
const scannerFunctionName: any = `${applicationName}-scannerFunction`;
const mlcEventRuleName: any = `${applicationName}-eventRule`;

//
//  NOTE: Roles are created automatically for all lambda functions
//  - the name of the role is the same as the function but with "-Role-${Region}" added to the end
//
console.log(process.env.Stage);
// --------- Make sure to update the tags values based on your project --------- //
export var taggingVars = {
  AppCatID: '78093', // Please change this value to your AppCatID
  'App CAT Name': 'Mortgage and Loan Calculators',
  'Solution Type': 'D',
  'Associated Pilot/POC': 'INTRAPET',
  'Business Unit': 'PBB',
  'Expiration Date': 'Indefinite',
  Purpose: 'CDK for MLC Loan Maintenance Product',
  Cost_Center: 'H9009', // Please change this value to a valid cost center
  Environment: process.env.Stage as string, // process.env.Stage
  'Support-Team': 'BLD_MLC_PC_CAN',
  Description: 'CDK SERVERLESS Stack for MLC Loan Maintenance Product',
  Stage: process.env.Stage as string,
  ServiceName: serviceName,
};

export const globals: any = {
  custom_service_prefix,
  ProjectName,
  serviceName,
  mainFunctionName,
  codeDeployRoleName,
  prehookFunctionName,
  scannerFunctionName,
  mlcEventRuleName,
  rolePath: `${taggingVars.AppCatID}/${taggingVars.ServiceName}/`, //  extra path required in role ARNs (ie. 'arn:aws:iam::015329035773:role/26777/CDKBaseTooling/sccg-opex-api-test-sbx01-mainFunction')
};

export const taggingVarsArray: any = []; //  some bmo modules want an array of tags instead of a single object
Object.entries(taggingVars).forEach(([key, value]) => {
  taggingVarsArray.push({ key, value });
});
