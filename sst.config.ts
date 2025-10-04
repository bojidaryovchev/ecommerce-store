// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

// Utility function to determine if the stage is production
const isProd = (stage: string) => stage.startsWith("prod");

// Interface for additional email identities
interface Identity {
  name: string;
  sender: string;
}

export default $config({
  app(input) {
    return {
      name: "pinref-com",
      removal: isProd(input.stage) ? "retain" : "remove",
      home: "aws",
    };
  },

  // The main run function where all Pulumi resources are defined
  async run() {
    // Determine the domain name based on the deployment stage
    const domainName = isProd($app.stage) ? "pinref.com" : `${$app.stage}.pinref.com`;

    // Create a SES domain identity with DMARC policy for email sending
    const domainIdentity = new sst.aws.Email("NextEmail", {
      sender: domainName,
      dmarc: "v=DMARC1; p=quarantine; adkim=s; aspf=s;",
    });

    const emailIdentities: Identity[] = [{ name: "SupportEmail", sender: "support@pinref.com" }];

    const identities = [
      domainIdentity,
      ...emailIdentities.map((identity) =>
        isProd($app.stage)
          ? sst.aws.Email.get(identity.name, identity.sender)
          : new sst.aws.Email(identity.name, { sender: identity.sender }),
      ),
    ];

    const uploadsBucketName = `pinref-uploads-${$app.stage}`;
    const uploadsBucketArgs: sst.aws.BucketArgs = {
      access: "public",
      cors: {
        allowHeaders: ["*"],
        allowMethods: ["GET", "PUT", "POST", "HEAD"],
        allowOrigins: ["http://localhost:3000", `https://${domainName}`],
        exposeHeaders: [],
      },
      transform: {
        bucket: {
          bucket: uploadsBucketName,
        },
      },
    };

    const uploadsBucket = new sst.aws.Bucket("Uploads", uploadsBucketArgs);

    // Deploy the Next.js application with specified domain
    new sst.aws.Nextjs("NextApp", {
      domain: {
        name: domainName,
        dns: sst.aws.dns({
          zone: "Z00860783LFS4Z4XIHT4N",
        }),
      },
      server: {
        architecture: "arm64",
      },
      environment: {
        DEPLOYMENT_ENV: $app.stage,
        AUTH_SECRET: process.env.AUTH_SECRET!,
        AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID!,
        AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET!,
        NEXT_PUBLIC_APP_URL: `https://${domainName}`,
      },
      link: [...identities, uploadsBucket],
    });
  },
});
