# Lineup functions

Sous-projet Node/Azure Functions pour charger les lineups `defqon1` et `insane` dans Supabase.

- Pas de création de tables.
- Pas d'activation automatique.
- Insertion uniquement via la RPC existante `load_lineup_version(...)`.
- Une nouvelle version reste en `pending`.
- Si le hash existe déjà, rien n'est inséré.

## Installation locale

```powershell
cd azure-functions/lineup-functions
npm install
Copy-Item local.settings.json.example local.settings.json
notepad local.settings.json
```

Renseigner au minimum `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`.

## Tests sans Supabase

```powershell
npm run generate:insane
npm run generate:defqon1
```

## Chargement Supabase en pending

```powershell
npm run lineup:insane
npm run lineup:defqon1
```

## Azure Functions local, plus tard

```powershell
npm run start
```

Endpoints HTTP :

```txt
POST http://localhost:7071/api/lineup/defqon1/run
POST http://localhost:7071/api/lineup/insane/run
```

## Tests endpoints locaux

```powershell
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```
Puis,

```powershell
func start
```

Et dans un nouveau terminal :

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:7071/api/lineup/insane/run" `
  -ContentType "application/json" `
  -Body "{}" |
ConvertTo-Json -Depth 20
```

et,

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:7071/api/lineup/defqon1/run" `
  -ContentType "application/json" `
  -Body "{}" |
ConvertTo-Json -Depth 20
```

## Créer une fonction Azure

> Voir AZURE_FUNCTION.md

## Installer Azure CLI sur le PC

Si la commande de publication ne peut pas se connecter à Azure, installer Azure CLI :

```powershell
winget install --exact --id Microsoft.AzureCLI
```

Fermer puis rouvrir PowerShell.

Vérifier :

```powershell
az version
```

Se connecter :

```powershell
az login
```

ou,

```powershell
az login --use-device-code
```

Vérifier l’abonnement actif :

```powershell
az account show
```


## Déployer la Function depuis le PC

Depuis le dossier du projet Azure Functions :

```powershell
cd C:\wamp64\www\beeoinfo\defqon1\azure-functions\lineup-functions
```

Publier :

```powershell
func azure functionapp publish func-beeoinfo-lineup-prod
```

Si la Function App a un autre nom dans Azure, utiliser le nom exact affiché dans le portail.

---

## Tester les endpoints Azure

Tester Insane :

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "https://func-beeoinfo-lineup-prod-dzevggcvbpatf4h5.francecentral-01.azurewebsites.net/api/lineup/insane/run" `
  -ContentType "application/json" `
  -Body "{}" |
ConvertTo-Json -Depth 20
```

Tester Defqon :

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "https://func-beeoinfo-lineup-prod-dzevggcvbpatf4h5.francecentral-01.azurewebsites.net/api/lineup/defqon1/run" `
  -ContentType "application/json" `
  -Body "{}" |
ConvertTo-Json -Depth 20
```

Réponses attendues :

```json
{
  "status": "success",
  "action": "loaded_pending"
}
```

ou :

```json
{
  "status": "nothing",
  "action": "no_change"
}
```

ou :

```json
{
  "status": "error",
  "action": "failed"
}
```

---

## Utilisation finale frontend

Manual HTTP endpoints are public at Azure level (`authLevel: anonymous`) but protected by a Supabase admin bearer token.

The frontend must call the manual endpoint with:

```http
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

The function verifies:

1. the Supabase access token is valid;
2. the user is an active admin via `public.is_current_user_admin()`;
3. only then it generates and loads a pending lineup version.

Timers still use the server `SUPABASE_SERVICE_ROLE_KEY` and do not need a user token.

### Other required Azure variables

```txt
SUPABASE_ANON_KEY
ADMIN_ALLOWED_ORIGINS=http://localhost:5173,https://defqon.1.beeo.info,https://insane.beeo.info
```

### CORS Azure Function

Si le front affiche une erreur CORS, autoriser les domaines dans Azure :

```txt
Function App
→ API / CORS
```

Ajouter :

```txt
http://localhost:5173
https://defqon.1.beeo.info
https://insane.beeo.info
```

Ne pas mettre `*`.

CLI possible :

```powershell
az functionapp cors add `
  --resource-group func-beeoinfo-lineup-prod_group `
  --name func-beeoinfo-lineup-prod `
  --allowed-origins http://localhost:5173

az functionapp cors add `
  --resource-group func-beeoinfo-lineup-prod_group `
  --name func-beeoinfo-lineup-prod `
  --allowed-origins https://defqon.1.beeo.info

az functionapp cors add `
  --resource-group func-beeoinfo-lineup-prod_group `
  --name func-beeoinfo-lineup-prod `
  --allowed-origins https://insane.beeo.info
```

La sécurité reste portée par :

```http
Authorization: Bearer <supabase_access_token>
```

Do not set these in Azure unless you want to stop the timers:

```txt
AzureWebJobs.runDefqon1Timer.Disabled
AzureWebJobs.runInsaneTimer.Disabled
```
