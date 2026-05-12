targetScope = 'resourceGroup'

param projectName string = 'diavise'
param environmentName string
param location string = resourceGroup().location
param logRetentionDays int = 30
param uploadShareQuotaGiB int = 100
param backendImageName string
param backendImageTag string = 'latest'
param backendContainerPort int = 5000

@secure()
param mongoUri string

@secure()
param jwtSecret string

@secure()
param refreshTokenSecret string

@secure()
param jinaApiKey string

@secure()
param qdrantUrl string

@secure()
param qdrantApiKey string

@secure()
param llmApiUrl string

@secure()
param googleClientId string

@secure()
param emailUser string

@secure()
param emailPass string

param frontendOrigin string
param allowedOrigins string

var namePrefix = toLower('${projectName}-${environmentName}')
var tags = {
  project: projectName
  environment: environmentName
  managedBy: 'bicep'
}

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${namePrefix}-law'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: logRetentionDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${namePrefix}-appi'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: replace('${namePrefix}acr', '-', '')
  location: location
  tags: tags
  sku: {
    name: 'Premium'
  }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
    policies: {
      quarantinePolicy: {
        status: 'disabled'
      }
      trustPolicy: {
        type: 'Notary'
        status: 'disabled'
      }
      retentionPolicy: {
        days: 7
        status: 'enabled'
      }
    }
  }
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: replace('${namePrefix}store', '-', '')
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    publicNetworkAccess: 'Enabled'
  }
}

resource fileService 'Microsoft.Storage/storageAccounts/fileServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
}

resource uploadShare 'Microsoft.Storage/storageAccounts/fileServices/shares@2023-05-01' = {
  parent: fileService
  name: 'uploads'
  properties: {
    shareQuota: uploadShareQuotaGiB
  }
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: replace('${namePrefix}kv', '-', '')
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    publicNetworkAccess: 'Enabled'
  }
}

var logAnalyticsSharedKeys = logAnalytics.listKeys()

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${namePrefix}-cae'
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalyticsSharedKeys.primarySharedKey
      }
    }
  }
}

resource uploadsStorage 'Microsoft.App/managedEnvironments/storages@2024-03-01' = {
  parent: containerAppsEnvironment
  name: 'uploads'
  properties: {
    azureFile: {
      accountName: storageAccount.name
      accountKey: storageAccount.listKeys().keys[0].value
      shareName: uploadShare.name
      accessMode: 'ReadWrite'
    }
  }
}

resource backendApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: '${namePrefix}-api'
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: backendContainerPort
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          identity: 'system'
        }
      ]
      secrets: [
        {
          name: 'mongo-uri'
          value: mongoUri
        }
        {
          name: 'jwt-secret'
          value: jwtSecret
        }
        {
          name: 'refresh-token-secret'
          value: refreshTokenSecret
        }
        {
          name: 'jina-api-key'
          value: jinaApiKey
        }
        {
          name: 'qdrant-url'
          value: qdrantUrl
        }
        {
          name: 'qdrant-api-key'
          value: qdrantApiKey
        }
        {
          name: 'llm-api-url'
          value: llmApiUrl
        }
        {
          name: 'email-user'
          value: emailUser
        }
        {
          name: 'email-pass'
          value: emailPass
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'api'
          image: '${containerRegistry.properties.loginServer}/${backendImageName}:${backendImageTag}'
          resources: {
            cpu: json('1.0')
            memory: '2Gi'
          }
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: string(backendContainerPort)
            }
            {
              name: 'MONGO_URI'
              secretRef: 'mongo-uri'
            }
            {
              name: 'JWT_SECRET'
              secretRef: 'jwt-secret'
            }
            {
              name: 'REFRESH_TOKEN_SECRET'
              secretRef: 'refresh-token-secret'
            }
            {
              name: 'JINA_API_KEY'
              secretRef: 'jina-api-key'
            }
            {
              name: 'QDRANT_URL'
              secretRef: 'qdrant-url'
            }
            {
              name: 'QDRANT_API_KEY'
              secretRef: 'qdrant-api-key'
            }
            {
              name: 'LLM_API_URL'
              secretRef: 'llm-api-url'
            }
            {
              name: 'DIABETICA_HF_URL'
              secretRef: 'llm-api-url'
            }
            {
              name: 'GOOGLE_CLIENT_ID'
              value: googleClientId
            }
            {
              name: 'EMAIL_USER'
              secretRef: 'email-user'
            }
            {
              name: 'EMAIL_PASS'
              secretRef: 'email-pass'
            }
            {
              name: 'AUTH_COOKIE_CROSS_SITE'
              value: 'true'
            }
            {
              name: 'FRONTEND_URL'
              value: frontendOrigin
            }
            {
              name: 'ALLOWED_ORIGINS'
              value: '${frontendOrigin},${allowedOrigins}'
            }
            {
              name: 'RAG_ENABLED'
              value: 'false'
            }
            {
              name: 'SCHEDULER_STARTUP_RUN'
              value: 'false'
            }
          ]
          volumeMounts: [
            {
              volumeName: 'uploads'
              mountPath: '/app/uploads'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
      volumes: [
        {
          name: 'uploads'
          storageType: 'AzureFile'
          storageName: uploadsStorage.name
        }
      ]
    }
  }
}


output resourceGroupLocation string = location
output logAnalyticsWorkspaceId string = logAnalytics.id
output applicationInsightsConnectionString string = appInsights.properties.ConnectionString
output containerRegistryLoginServer string = containerRegistry.properties.loginServer
output containerAppsEnvironmentId string = containerAppsEnvironment.id
output backendContainerAppName string = backendApp.name
output backendContainerAppFqdn string = backendApp.properties.configuration.ingress.fqdn
output keyVaultName string = keyVault.name
output uploadFileShareName string = uploadShare.name
