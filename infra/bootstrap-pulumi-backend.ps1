# Bootstrap script to create S3 bucket for Pulumi state storage
# Run this ONCE before using Pulumi

param(
    [Parameter(Mandatory=$false)]
    [string]$BucketName = "pulumi-state-560875410618",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "eu-central-1",
    
    [Parameter(Mandatory=$false)]
    [string]$Profile = "AdministratorAccess-560875410618"
)

Write-Host "Creating Pulumi state bucket: $BucketName in $Region" -ForegroundColor Cyan

# Create the S3 bucket
# Note: eu-central-1 requires LocationConstraint, us-east-1 does not
if ($Region -eq "us-east-1") {
    aws s3api create-bucket `
        --bucket $BucketName `
        --region $Region `
        --profile $Profile
} else {
    aws s3api create-bucket `
        --bucket $BucketName `
        --region $Region `
        --create-bucket-configuration LocationConstraint=$Region `
        --profile $Profile
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Bucket may already exist or there was an error. Continuing..." -ForegroundColor Yellow
}

# Enable versioning (important for state file safety)
Write-Host "Enabling versioning..." -ForegroundColor Cyan
aws s3api put-bucket-versioning `
    --bucket $BucketName `
    --versioning-configuration Status=Enabled `
    --region $Region `
    --profile $Profile

# Block all public access
Write-Host "Blocking public access..." -ForegroundColor Cyan
aws s3api put-public-access-block `
    --bucket $BucketName `
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" `
    --region $Region `
    --profile $Profile

# Enable server-side encryption
Write-Host "Enabling encryption..." -ForegroundColor Cyan
aws s3api put-bucket-encryption `
    --bucket $BucketName `
    --server-side-encryption-configuration '{\"Rules\":[{\"ApplyServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"AES256\"}}]}' `
    --region $Region `
    --profile $Profile

Write-Host ""
Write-Host "✅ Pulumi backend bucket ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Set your AWS profile: `$env:AWS_PROFILE = `"$Profile`"" -ForegroundColor White
Write-Host "2. Login to Pulumi backend: pulumi login s3://$BucketName" -ForegroundColor White
Write-Host "3. Initialize stack: cd infra && pulumi stack init dev" -ForegroundColor White
Write-Host "4. Run preview: pulumi preview" -ForegroundColor White
