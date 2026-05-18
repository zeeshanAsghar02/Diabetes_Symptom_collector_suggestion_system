# Verified Atlas Connection String — ClusterDiavise

**Project:** diavise / ClusterDiavise (M0 free tier, AP_SOUTH_1)  
**Project ID:** `699987c2fe3dbc2df7883274`  
**User:** `diavise_admin`  
**Password:** `wasif`  
**Auth source:** `admin`  
**Replica set:** `atlas-taqw6t-shard-0`  
**MongoDB version:** 8.0.23 LTS  
**Region:** ap-south-1 (AWS)

## Connection string (verified 2026-05-18)

### SRV format (mongodb+srv — preferred)
```
mongodb+srv://diavise_admin:wasif@clusterdiavise.homdhu8.mongodb.net/diavise?ssl=true&retryWrites=true&w=majority&appName=ClusterDiavise
```

### Standard format (for Shell scripts, mongosh, etc.)
```
mongodb://ac-9qikkpw-shard-00-00.homdhu8.mongodb.net:27017,ac-9qikkpw-shard-00-01.homdhu8.mongodb.net:27017,ac-9qikkpw-shard-00-02.homdhu8.mongodb.net:27017/diavise?ssl=true&authSource=admin&replicaSet=atlas-taqw6t-shard-0&retryWrites=true&w=majority
```

### mongostat / mongotop
```bash
mongostat --uri "mongodb+srv://diavise_admin:wasif@clusterdiavise.homdhu8.mongodb.net/diavise?ssl=true&retryWrites=true&w=majority&appName=ClusterDiavise"
```

## Where to update the password

| Location | What to do |
|---|---|
| **GitHub Secrets → Environments → Staging → MONGO_URI** | Update the env var value to the SRV string above |
| **Azure Container App (staging) env var MONGO_URI** | `az containerapp update --name diavise-staging-api --resource-group diavise-staging-rg --set-env-vars MONGO_URI="mongodb+srv://..."` then restart |
| **Azure Key Vault `MONGO-URI`** (if used) | `az keyvault secret set --vault-name diavisestagingkv --name MONGO-URI --value "mongodb+srv://..."` |
| **`backend/.env`** (local dev) | Update MONGO_URI for local development |
| **Tell your colleague** | Share the password `wasif` or rotate it with a new password and re-verify |

## Health checks

| Check | Result |
|---|---|
| DNS resolution (SRV) | `clusterdiavise.homdhu8.mongodb.net` → `159.41.170.205` |
| TCP `159.41.170.205:27017` | TcpTestSucceeded: True |
| Atlas cluster state | active, LTS, not paused |
| Last verified | 2026-05-18T16:54+05:30 |

> ⚠️ If you reset the password again, update it in all three locations above and re-verify with `mongostat --uri`.
