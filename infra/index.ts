import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const stack = pulumi.getStack();

// Get current AWS account ID dynamically
const callerIdentity = aws.getCallerIdentity({});
const accountId = callerIdentity.then((id) => id.accountId);

// S3 bucket for file uploads (account ID in name ensures global uniqueness)
const uploadsBucket = new aws.s3.Bucket("uploads", {
  bucket: pulumi.interpolate`ecommerce-uploads-${accountId}-${stack}`,
  forceDestroy: stack !== "prod", // Allow deletion in non-prod environments
});

// Allow public read access for images (but not uploads/writes)
const publicAccessBlock = new aws.s3.BucketPublicAccessBlock("uploads-public-access-block", {
  bucket: uploadsBucket.id,
  blockPublicAcls: false,
  blockPublicPolicy: false,
  ignorePublicAcls: false,
  restrictPublicBuckets: false,
});

// Bucket policy to allow public read access
new aws.s3.BucketPolicy(
  "uploads-public-read-policy",
  {
    bucket: uploadsBucket.id,
    policy: pulumi.jsonStringify({
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "PublicReadGetObject",
          Effect: "Allow",
          Principal: "*",
          Action: "s3:GetObject",
          Resource: pulumi.interpolate`${uploadsBucket.arn}/*`,
        },
      ],
    }),
  },
  { dependsOn: [publicAccessBlock] },
);

// CORS configuration for the bucket
new aws.s3.BucketCorsConfiguration("uploads-cors", {
  bucket: uploadsBucket.id,
  corsRules: [
    {
      allowedHeaders: ["*"],
      allowedMethods: ["GET", "PUT", "POST", "HEAD"],
      allowedOrigins: stack === "prod" ? ["https://yourdomain.com"] : ["http://localhost:3000"],
      exposeHeaders: ["ETag"],
      maxAgeSeconds: 3600,
    },
  ],
});

// IAM user for application access to S3
const uploadsUser = new aws.iam.User("uploads-user", {
  name: `ecommerce-uploads-${stack}`,
});

// IAM policy for S3 access
const uploadsPolicy = new aws.iam.Policy("uploads-policy", {
  name: `ecommerce-uploads-${stack}`,
  policy: pulumi.jsonStringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
        Resource: [uploadsBucket.arn, pulumi.interpolate`${uploadsBucket.arn}/*`],
      },
    ],
  }),
});

// Attach policy to user
new aws.iam.UserPolicyAttachment("uploads-policy-attachment", {
  user: uploadsUser.name,
  policyArn: uploadsPolicy.arn,
});

// Create access key for the user (store these securely!)
const uploadsAccessKey = new aws.iam.AccessKey("uploads-access-key", {
  user: uploadsUser.name,
});

// ============================================================================
// UPLOAD CLEANUP LAMBDA
// ============================================================================

// Get config values
const config = new pulumi.Config();
const appUrl = config.get("appUrl") ?? (stack === "prod" ? "https://yourdomain.com" : "http://localhost:3000");
const cleanupSecret = config.requireSecret("uploadCleanupSecret");

// IAM role for Lambda
const cleanupLambdaRole = new aws.iam.Role("cleanup-lambda-role", {
  name: `ecommerce-cleanup-lambda-${stack}`,
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Principal: { Service: "lambda.amazonaws.com" },
        Effect: "Allow",
      },
    ],
  }),
});

// Attach basic Lambda execution policy
new aws.iam.RolePolicyAttachment("cleanup-lambda-basic-execution", {
  role: cleanupLambdaRole.name,
  policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

// Lambda function for cleanup
const cleanupLambda = new aws.lambda.Function("cleanup-lambda", {
  name: `ecommerce-upload-cleanup-${stack}`,
  runtime: "nodejs20.x",
  handler: "upload-cleanup.handler",
  role: cleanupLambdaRole.arn,
  timeout: 60, // 1 minute timeout
  memorySize: 256,
  environment: {
    variables: {
      APP_URL: appUrl,
      CLEANUP_SECRET: cleanupSecret,
    },
  },
  code: new pulumi.asset.AssetArchive({
    "upload-cleanup.mjs": new pulumi.asset.FileAsset("./lambdas/upload-cleanup.mjs"),
  }),
});

// EventBridge rule to trigger cleanup daily at 3 AM UTC
const cleanupSchedule = new aws.cloudwatch.EventRule("cleanup-schedule", {
  name: `ecommerce-upload-cleanup-${stack}`,
  description: "Trigger upload cleanup Lambda daily",
  scheduleExpression: "cron(0 3 * * ? *)", // Every day at 3 AM UTC
});

// Permission for EventBridge to invoke Lambda
new aws.lambda.Permission("cleanup-lambda-permission", {
  action: "lambda:InvokeFunction",
  function: cleanupLambda.name,
  principal: "events.amazonaws.com",
  sourceArn: cleanupSchedule.arn,
});

// EventBridge target to invoke Lambda
new aws.cloudwatch.EventTarget("cleanup-target", {
  rule: cleanupSchedule.name,
  arn: cleanupLambda.arn,
});

// Exports
export const bucketName = uploadsBucket.bucket;
export const bucketArn = uploadsBucket.arn;
export const accessKeyId = uploadsAccessKey.id;
export const secretAccessKey = uploadsAccessKey.secret;
export const cleanupLambdaArn = cleanupLambda.arn;
export const cleanupScheduleArn = cleanupSchedule.arn;
