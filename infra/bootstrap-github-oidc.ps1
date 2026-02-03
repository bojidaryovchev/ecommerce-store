# Bootstrap script to create GitHub OIDC provider and IAM role for GitHub Actions
# Run this ONCE to enable passwordless AWS auth from GitHub Actions

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubOrg,  # Your GitHub username or organization
    
    [Parameter(Mandatory=$true)]
    [string]$GitHubRepo, # Your repository name (e.g., "ecommerce-store")
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "eu-central-1",
    
    [Parameter(Mandatory=$false)]
    [string]$Profile = "AdministratorAccess-560875410618",
    
    [Parameter(Mandatory=$false)]
    [string]$RoleName = "github-actions-pulumi"
)

$AccountId = "560875410618"

Write-Host "Setting up GitHub OIDC for $GitHubOrg/$GitHubRepo" -ForegroundColor Cyan

# Step 1: Create OIDC Identity Provider (may already exist)
Write-Host "`nStep 1: Creating GitHub OIDC Provider..." -ForegroundColor Yellow

$oidcArn = "arn:aws:iam::${AccountId}:oidc-provider/token.actions.githubusercontent.com"

# Check if provider exists
$existingProvider = aws iam get-open-id-connect-provider --open-id-connect-provider-arn $oidcArn --profile $Profile 2>$null

if ($LASTEXITCODE -ne 0) {
    # Get GitHub's thumbprint (this is the current valid thumbprint for GitHub Actions)
    aws iam create-open-id-connect-provider `
        --url "https://token.actions.githubusercontent.com" `
        --client-id-list "sts.amazonaws.com" `
        --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" "1c58a3a8518e8759bf075b76b750d4f2df264fcd" `
        --profile $Profile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ OIDC Provider created" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed to create OIDC Provider" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✅ OIDC Provider already exists" -ForegroundColor Green
}

# Step 2: Create IAM Role Trust Policy
Write-Host "`nStep 2: Creating IAM Role..." -ForegroundColor Yellow

# Build trust policy as escaped JSON string for CLI
$trustPolicyJson = "{`"Version`":`"2012-10-17`",`"Statement`":[{`"Effect`":`"Allow`",`"Principal`":{`"Federated`":`"arn:aws:iam::${AccountId}:oidc-provider/token.actions.githubusercontent.com`"},`"Action`":`"sts:AssumeRoleWithWebIdentity`",`"Condition`":{`"StringEquals`":{`"token.actions.githubusercontent.com:aud`":`"sts.amazonaws.com`"},`"StringLike`":{`"token.actions.githubusercontent.com:sub`":`"repo:${GitHubOrg}/${GitHubRepo}:*`"}}}]}"

# Create the role
aws iam create-role `
    --role-name $RoleName `
    --assume-role-policy-document $trustPolicyJson `
    --description "Role for GitHub Actions to deploy Pulumi infrastructure" `
    --profile $Profile 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ IAM Role created" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Role may already exist, updating trust policy..." -ForegroundColor Yellow
    aws iam update-assume-role-policy `
        --role-name $RoleName `
        --policy-document $trustPolicyJson `
        --profile $Profile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Trust policy updated" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed to update trust policy" -ForegroundColor Red
    }
}

# Step 3: Attach policies to the role
Write-Host "`nStep 3: Attaching policies..." -ForegroundColor Yellow

# Attach AdministratorAccess (you may want to scope this down for production)
aws iam attach-role-policy `
    --role-name $RoleName `
    --policy-arn "arn:aws:iam::aws:policy/AdministratorAccess" `
    --profile $Profile

Write-Host "  ✅ AdministratorAccess policy attached" -ForegroundColor Green
Write-Host "  ⚠️  Consider using a more restrictive policy for production!" -ForegroundColor Yellow

# Output
$roleArn = "arn:aws:iam::${AccountId}:role/${RoleName}"

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " ✅ GitHub OIDC Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Add these secrets to your GitHub repository:" -ForegroundColor Yellow
Write-Host "  Settings -> Secrets and variables -> Actions -> New repository secret" -ForegroundColor White
Write-Host ""
Write-Host "  AWS_ROLE_ARN:" -ForegroundColor Cyan
Write-Host "    $roleArn" -ForegroundColor White
Write-Host ""
Write-Host "  PULUMI_CONFIG_PASSPHRASE:" -ForegroundColor Cyan
Write-Host "    (the passphrase you set when creating the Pulumi stack)" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
