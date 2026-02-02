import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const stack = pulumi.getStack();

// S3 bucket for file uploads
const uploadsBucket = new aws.s3.Bucket("uploads", {
  bucket: `ecommerce-uploads-${stack}`,
  forceDestroy: stack !== "prod", // Allow deletion in non-prod environments
});

// Enable public access block settings (secure by default)
new aws.s3.BucketPublicAccessBlock("uploads-public-access-block", {
  bucket: uploadsBucket.id,
  blockPublicAcls: true,
  blockPublicPolicy: true,
  ignorePublicAcls: true,
  restrictPublicBuckets: true,
});

// CORS configuration for the bucket
new aws.s3.BucketCorsConfigurationV2("uploads-cors", {
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

// Exports
export const bucketName = uploadsBucket.bucket;
export const bucketArn = uploadsBucket.arn;
export const accessKeyId = uploadsAccessKey.id;
export const secretAccessKey = uploadsAccessKey.secret;
