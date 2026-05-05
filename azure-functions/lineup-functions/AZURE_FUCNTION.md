# Setup Azure Functions gratuit — Lineup jobs

Ce guide décrit uniquement la création et la configuration Azure pour héberger les fonctions de génération des line-ups.

Objectif :

```txt
2 scripts Node.js
1 déclenchement manuel HTTP par site
1 déclenchement automatique Timer par site
Plan Azure Functions Consumption
Application Insights désactivé
Coût visé : 0 € côté exécutions Functions
```

---

## 1. Choisir le bon plan Azure

Dans Azure Portal :

```txt
Créer une ressource
→ Function App
```

Choisir :

```txt
Plan d’hébergement
→ Consumption (Windows)
```

Ne pas choisir :

```txt
Consommation flexible
Functions Premium
App Service Plan
Container Apps
```

Pourquoi :

```txt
Consumption (Windows)
→ adapté aux petits scripts courts
→ paiement à l’exécution
→ compatible avec le quota gratuit classique Azure Functions
→ suffisant pour HTTP trigger + Timer trigger
```

Volume prévu :

```txt
Insane toutes les 30 min ≈ 1 440 exécutions/mois
Defqon tous les jours ≈ 30 exécutions/mois
Total ≈ 1 470 exécutions/mois
```

Ce volume est très inférieur au quota gratuit annoncé pour les Azure Functions Consumption.

> Note : Azure crée aussi un compte de stockage obligatoire. Il faut éviter les options de logs/monitoring inutiles pour limiter les coûts annexes.

---

## 2. Onglet Bases

Configuration recommandée :

```txt
Groupe de ressources
→ rg-beeoinfo-lineup-prod

Nom de l’application de fonction
→ func-beeoinfo-lineup-prod

Région
→ France Central
→ sinon West Europe

Pile d’exécution
→ Node.js

Version Node.js
→ Node.js 20 ou Node.js 22 selon disponibilité

Système d’exploitation
→ Windows

Plan
→ Consumption
```

Si le nom de Function App est refusé, choisir un nom unique, par exemple :

```txt
func-beeoinfo-lineup-prod-01
```

---

## 3. Onglet Stockage

Azure demande un compte de stockage.

Garder :

```txt
Compte de stockage
→ nouveau compte proposé par Azure
```

Garder aussi :

```txt
Ajouter une connexion Azure Files
→ coché
```

Pour les diagnostics Blob :

```txt
Options du diagnostic du service BLOB
→ Configurer ultérieurement
```

Ne pas activer de diagnostics avancés à cette étape.

---

## 4. Onglet Réseau

Garder les valeurs par défaut :

```txt
Activer l’accès public
→ Activé
```

```txt
Activer l’intégration de réseau virtuel
→ Désactivé
```

Pourquoi :

```txt
Les endpoints HTTP doivent être appelables par le bouton admin.
Les timers n’ont pas besoin de réseau privé.
Supabase est appelé en HTTPS public.
```

---

## 5. Onglet Surveillance

Désactiver Application Insights :

```txt
Activer Application Insights
→ Non
```

Pourquoi :

```txt
Pas nécessaire pour ce petit projet.
Évite une source de coût/logs supplémentaire.
Les runs sont déjà suivis côté Supabase.
```

---

## 6. Onglet Durable Functions

Le projet n’utilise pas Durable Functions.

Garder :

```txt
Apportez le vôtre : Stockage Azure
```

Ne pas choisir :

```txt
Géré par Azure : Planificateur de tâches durables
```

Les fonctions utilisées sont uniquement :

```txt
HTTP trigger
Timer trigger
```

---

## 7. Onglet Déploiement

Garder :

```txt
Déploiement continu
→ Désactivé
```

Le premier déploiement se fait depuis le PC avec Azure Functions Core Tools.

Ne pas connecter GitHub Actions à cette étape.

---

## 8. Onglet Authentification

Garder :

```txt
Stockage hôte AzureWebJobsStorage
→ Secrets
```

```txt
Azure Files
→ Secrets
```

Ne pas activer l’identité managée pour ce premier setup.

---

## 9. Onglet Balises

Laisser vide.

Les balises sont utiles pour classer les coûts dans de gros environnements, mais pas nécessaires ici.

---

## 10. Vérifier + créer

Avant de créer, vérifier :

```txt
Plan
→ Consumption

OS
→ Windows

Runtime
→ Node.js

Application Insights
→ Non

Accès public
→ Activé

Déploiement continu
→ Désactivé

Premium / Always On / Always Ready
→ non activé
```

Puis cliquer sur :

```txt
Créer
```

Attendre la fin du déploiement, puis ouvrir :

```txt
Accéder à la ressource
```

---

## 11. Variables d’environnement Azure

Dans la Function App :

```txt
Paramètres
→ Variables d’environnement
→ Paramètres d’application
```

Ajouter les variables suivantes.

### Supabase

```txt
SUPABASE_URL = https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY = xxx
```

Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté frontend.

### Cron des timers

```txt
DEFQON1_LINEUP_CRON = 0 0 6 * * *
INSANE_LINEUP_CRON = 0 */30 * * * *
```

Explication :

```txt
DEFQON1_LINEUP_CRON
→ tous les jours à 06:00 UTC

INSANE_LINEUP_CRON
→ toutes les 30 minutes
```

Azure Functions utilise un cron à 6 champs :

```txt
seconde minute heure jour mois jour-semaine
```

Exemples :

```txt
0 */30 * * * *
→ toutes les 30 minutes

0 0 6 * * *
→ tous les jours à 06:00 UTC
```

### Fenêtres d’activité

Insane :

```txt
INSANE_LINEUP_ACTIVE_FROM = 2026-04-01T00:00:00.000Z
INSANE_LINEUP_ACTIVE_TO = 2026-05-17T08:00:00.000Z
```

Defqon :

```txt
DEFQON1_LINEUP_ACTIVE_FROM = 2026-03-01T00:00:00.000Z
DEFQON1_LINEUP_ACTIVE_TO = 2026-06-30T08:00:00.000Z
```

Ces variables empêchent le traitement métier hors période.

Important :

```txt
ACTIVE_TO bloque le traitement.
Le timer Azure continue quand même à déclencher la Function.
```

Après le festival, pour arrêter réellement un timer, ajouter :

```txt
AzureWebJobs.runInsaneTimer.Disabled = true
```

ou :

```txt
AzureWebJobs.runDefqon1Timer.Disabled = true
```

À ne pas ajouter tant que les timers doivent tourner.

---

## 12. Case “paramètre de l’emplacement de déploiement”

Lors de la création des variables, laisser décoché :

```txt
Paramètre de l’emplacement de déploiement
→ décoché
```

Cette option sert aux deployment slots Azure. Le projet n’en utilise pas.

---

## 13. Sécurisation des endpoints manuels

Selon la configuration `authLevel`, Azure peut demander une clé de fonction.

Récupérer la clé ici :

```txt
Functions
→ Function App
```

And use default key

L’URL devient alors :

```txt
https://func-beeoinfo-lineup-prod.azurewebsites.net/api/lineup/insane/run?code=XXXX
```

Même principe pour Defqon.

Ne pas exposer une clé sensible directement dans un frontend public non protégé.

---

## 14. Budget de sécurité

Pour éviter toute surprise :

```txt
Azure Portal
→ Cost Management
→ Budgets
→ Create budget
```

Créer une alerte à :

```txt
1 €
```

Cette alerte ne bloque pas forcément automatiquement la dépense, mais elle permet d’être prévenu rapidement.

---