# DevOps Setup Guide

This guide explains how to set up the infrastructure and CI/CD pipeline for the Smart Cloud File Manager.

## 1. Prerequisites
- [Azure Account](https://azure.microsoft.com/)
- [GitHub Repository](https://github.com/)
- [Terraform CLI](https://www.terraform.io/) (for local testing)

## 2. GitHub Secrets Setup
To enable the pipeline, add the following secrets in your GitHub repository settings under **Settings > Secrets and variables > Actions**:

| Secret Name | Description |
|-------------|-------------|
| `AZURE_CLIENT_ID` | Application (client) ID from App Registration |
| `AZURE_CLIENT_SECRET` | Client secret from App Registration |
| `AZURE_SUBSCRIPTION_ID` | Your Azure Subscription ID |
| `AZURE_TENANT_ID` | Your Azure Tenant ID |
| `AZURE_CREDENTIALS` | Full JSON output from `az ad sp create-for-rbac` |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Downloadable from Azure Portal under Web App "Get publish profile" |

## 3. Terraform Infrastructure
The infrastructure is defined in the `/terraform` directory.
- **Resource Group**: Centralized location for all project resources.
- **Cosmos DB**: High-performance metadata storage.
- **Blob Storage**: Scalable file chunk storage.
- **App Service**: Managed hosting for the Node.js/React application.

### Configuration
You can customize the project name and region in `terraform/variables.tf`.

## 4. CI/CD Workflow
The pipeline in `.github/workflows/deploy.yml` performs the following steps on every push to `main`:
1. **Terraform Validation**: Automatically plans and applies infrastructure changes.
2. **Build**: Compiles the React frontend and installs backend dependencies.
3. **Deploy**: Syncs the artifacts to the Azure App Service.

## 5. Local Execution
If you wish to run Terraform locally:
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

> [!IMPORTANT]
> Ensure you have an active Azure CLI session (`az login`) before running terraform locally.
