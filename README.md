# Shop App

Applicazione e-commerce full-stack con autenticazione Google OAuth2, gestione carrello, checkout e pannelli amministrativi per ruoli differenziati.

---

## Indice

1. [Panoramica del progetto](#1-panoramica-del-progetto)
2. [Prerequisiti e dipendenze](#2-prerequisiti-e-dipendenze)
3. [Variabili d'ambiente](#3-variabili-dambiente)
4. [Setup ed esecuzione con Docker Compose](#4-setup-ed-esecuzione-con-docker-compose)
5. [Migrazioni, seed e comandi database](#5-migrazioni-seed-e-comandi-database)
6. [Setup senza Docker (sviluppo locale nativo)](#6-setup-senza-docker-sviluppo-locale-nativo)
7. [Struttura del codice e architettura](#7-struttura-del-codice-e-architettura)
8. [API: endpoint disponibili](#8-api-endpoint-disponibili)
9. [Schema del database e migrazioni](#9-schema-del-database-e-migrazioni)
10. [Comandi principali usati durante lo sviluppo](#10-comandi-principali-usati-durante-lo-sviluppo)
11. [Istruzioni passo-passo per replicare il progetto da zero](#11-istruzioni-passo-passo-per-replicare-il-progetto-da-zero)
12. [Problemi noti e soluzioni](#12-problemi-noti-e-soluzioni)

---

## 1. Panoramica del progetto

### Descrizione funzionale

`shop_app` è un'applicazione e-commerce completa che permette agli utenti di:

- sfogliare un catalogo di prodotti e cercarli per nome o descrizione
- aggiungere prodotti al carrello (anche senza essere autenticati, con sincronizzazione automatica al login)
- autenticarsi tramite **Google OAuth2** (nessuna password locale)
- completare un ordine inserendo i dati cliente e l'indirizzo di spedizione (checkout)
- consultare lo storico degli ordini personali
- gestire prodotti tramite un pannello dedicato ai **vendor**
- gestire utenti e ruoli tramite un pannello dedicato agli **admin**

### Ruoli utente

Il sistema prevede tre ruoli con permessi differenziati:

| Ruolo | Valore DB | Permessi |
|-------|-----------|----------|
| `user` | 0 | Navigazione, carrello, checkout, storico ordini |
| `admin` | 1 | Tutto + gestione utenti (assegnazione ruoli, eliminazione) |
| `vendor` | 2 | Tutto + creazione/modifica/eliminazione dei propri prodotti |

Un admin può modificare e cancellare qualsiasi prodotto; un vendor può operare solo sui propri.

### Stack tecnologico

| Layer | Tecnologia | Versione |
|-------|-----------|---------|
| Frontend | Angular | 21.1.x |
| UI components | Angular Material + Angular CDK | 21.1.x |
| Linguaggio frontend | TypeScript | 5.9.x |
| Backend | Ruby on Rails (API mode) | 8.1.2 |
| Linguaggio backend | Ruby | 3.2.3 |
| Web server | Puma (dev) / Thruster+Puma (prod) | ≥ 5.0 |
| Database | PostgreSQL | 15 |
| Autenticazione | Google OAuth2 (OmniAuth) + JWT | — |
| Containerizzazione | Docker + Docker Compose v2 | — |
| Web server frontend (prod) | Nginx | alpine |

### Architettura generale

```
┌───────────────────────────────────────────────────────────────────┐
│                           Browser                                 │
│                                                                   │
│  Angular SPA (porta 4200 dev / 8080 prod)                        │
│  - Routing client-side, stato globale con Signals                │
│  - Allega il JWT a ogni richiesta HTTP (interceptor)             │
└──────────────────────────┬────────────────────────────────────────┘
                           │ HTTP + JSON
                           │ Authorization: Bearer <jwt>
                           ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Rails API (porta 3000)                         │
│  - Espone endpoint REST che rispondono sempre in JSON            │
│  - Autentica le richieste decodificando il JWT                   │
│  - OmniAuth gestisce il flusso Google OAuth2                     │
│  - ActiveRecord gestisce persistenza e validazioni               │
└──────────────────────────┬────────────────────────────────────────┘
                           │ ActiveRecord / SQL
                           ▼
┌───────────────────────────────────────────────────────────────────┐
│               PostgreSQL 15 (porta 5432)                         │
│  Tabelle: users, products, orders, order_items, cart_items       │
└───────────────────────────────────────────────────────────────────┘
```

**Flusso di autenticazione:**

```
1. Utente clicca "Accedi" nel frontend
2. Frontend reindirizza a: GET http://localhost:3000/auth/google_oauth2
3. OmniAuth avvia il flusso OAuth con Google
4. Google reindirizza a: GET /auth/google_oauth2/callback
5. Rails crea/trova l'utente per email, genera un JWT (scadenza: 24 ore)
6. Rails reindirizza il browser a:
   http://localhost:4200/login/success?token=<jwt>
7. LoginSuccessComponent estrae il token dall'URL e lo salva in localStorage
8. Da questo momento il token viene allegato automaticamente a ogni
   richiesta HTTP dall'interceptor Angular
```

---

## 2. Prerequisiti e dipendenze

### Per eseguire il progetto con Docker (metodo consigliato)

| Software | Versione minima | Come installare |
|----------|----------------|----------------|
| Docker Desktop | 24.x | https://docs.docker.com/get-docker/ |
| Docker Compose | v2.x | Incluso in Docker Desktop |
| GNU Make | qualsiasi | macOS: `xcode-select --install` |

Verificare l'installazione:
```bash
docker --version           # Es: Docker version 24.0.7
docker compose version     # Es: Docker Compose version v2.24.0
make --version             # Es: GNU Make 3.81
```

### Per lo sviluppo locale senza Docker (opzionale)

| Software | Versione | Note |
|----------|---------|------|
| Ruby | 3.2.3 (esatta) | Raccomandato con `rbenv` o `rvm` |
| Bundler | 2.x | `gem install bundler` |
| Node.js | 20.x LTS | https://nodejs.org |
| npm | 11.x | Incluso con Node.js |
| Angular CLI | 21.x | `npm install -g @angular/cli@21` |
| PostgreSQL | 15 | Con utente `postgres` e password `password` |

---

## 3. Variabili d'ambiente

Il progetto usa **due file `.env`** distinti, entrambi esclusi da git per ragioni di sicurezza.

### File `shop_app/.env` — configurazione Docker Compose

```bash
# Porta esposta dal container Rails (visibile su http://localhost:3000)
BACKEND_PORT=3000

# Thread massimi Puma
RAILS_MAX_THREADS=5

# URL di connessione al database usato da Rails
# Il nome host "db" corrisponde al nome del servizio PostgreSQL in Docker Compose
DATABASE_URL=postgres://postgres:password@db:5432/shop_app_development

# Porta frontend dev server Angular (http://localhost:4200)
FRONTEND_PORT_DEV=4200

# Porta frontend nginx produzione (http://localhost:8080)
FRONTEND_PORT_PROD=8080

# Credenziali PostgreSQL usate dall'immagine postgres:15 per creare il superutente
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
```

### File `shop_app/backend/.env` — credenziali Rails

```bash
# Client ID dell'applicazione OAuth2 (da Google Cloud Console)
GOOGLE_CLIENT_ID=<tuo-client-id>.apps.googleusercontent.com

# Client Secret dell'applicazione OAuth2
GOOGLE_CLIENT_SECRET=GOCSPX-<tuo-secret>

# Chiave master Rails — corrisponde al contenuto di backend/config/master.key
# Usata per decrittare credentials.yml.enc e come secret_key_base
RAILS_MASTER_KEY=<contenuto-di-backend/config/master.key>
```

#### Come ottenere le credenziali Google OAuth2

1. Aprire [Google Cloud Console](https://console.cloud.google.com)
2. Creare un progetto o selezionarne uno esistente
3. Navigare su **API e servizi → Credenziali**
4. Cliccare **Crea credenziali → ID client OAuth2**
5. Tipo applicazione: **Applicazione web**
6. In **URI di reindirizzamento autorizzati** aggiungere:
   ```
   http://localhost:3000/auth/google_oauth2/callback
   ```
7. Copiare **Client ID** e **Client secret** nel file `backend/.env`

#### Come trovare RAILS_MASTER_KEY

Il valore si trova nel file `backend/config/master.key` (non committato in git). Se stai lavorando su una macchina nuova senza quel file, vedi la [sezione 12 — Problema 8](#problema-8--masterkey-mancante).

---

## 4. Setup ed esecuzione con Docker Compose

### Struttura dei file Docker Compose

Il progetto usa un sistema di **file sovrapposti** (merge/override):

| File | Scopo |
|------|-------|
| `docker-compose.yml` | Base: definisce `db`, `api`, `web`, profili di test |
| `docker-compose.dev.yml` | Override dev: aggiunge il servizio `frontend` (Angular dev server con hot-reload), sovrascrive il comando di avvio di `api` con `db:prepare` |
| `docker-compose.prod.yml` | Override prod: espone l'API sulla porta 3000 |

### Descrizione dei servizi

#### `db` — PostgreSQL 15

- **Immagine:** `postgres:15`
- **Porta:** `5432:5432`
- **Credenziali:** `POSTGRES_USER` / `POSTGRES_PASSWORD` dal file `.env` radice
- **Volume:** `postgres_data` (persistente tra riavvii — `docker compose down` non cancella i dati)
- **Health check:** il servizio `api` non si avvia finché il DB non è pronto

#### `api` — Rails 8.1 (backend)

- **Build:** da `./backend/Dockerfile` (immagine multi-stage con Ruby 3.2.3)
- **Porta:** `${BACKEND_PORT}:3000` — di default `3000:3000`
- **In modalità dev:** esegue `bin/rails db:prepare` (crea DB + migrazioni) poi avvia Puma
- **Volume:** `./backend:/rails` (bind mount — le modifiche al codice Rails sono immediatamente visibili senza rebuild)
- **Dipende da:** `db` (attende il health check)

#### `web` — nginx (frontend produzione)

- **Build:** da `./frontend/Dockerfile` (build Angular multi-stage + nginx alpine)
- **Porta:** `${FRONTEND_PORT_PROD}:80` — di default `8080:80`
- **Serve:** i file statici compilati da `ng build --configuration production`
- **Routing:** gestisce il routing client-side Angular con `try_files $uri $uri/ /index.html`

#### `frontend` — Angular dev server (solo overlay `docker-compose.dev.yml`)

- **Immagine:** `node:20`
- **Porta:** `4200:4200`
- **Comando:** `npm ci && npm run start -- --host 0.0.0.0 --port 4200 --poll 2000`
- **Volume:** bind mount su `./frontend` + volume separato `frontend_node_modules` (evita conflitti con `node_modules` locali)
- **Differenza da `web`:** supporta hot-reload e ricompila il codice ad ogni salvataggio

### Avviare in modalità sviluppo

```bash
# Dalla directory radice shop_app/
make dev
```

Equivalente a:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build db api frontend
```

**URL disponibili dopo l'avvio** (attendere 3-7 minuti al primo build):

| Servizio | URL | Note |
|---------|-----|------|
| Frontend Angular (hot-reload) | http://localhost:4200 | Da usare in sviluppo |
| Backend Rails API | http://localhost:3000 | |
| Health check Rails | http://localhost:3000/up | Verde = OK |
| Frontend nginx (prod) | http://localhost:8080 | Solo se avviato in modalità prod |

> **Importante:** usare sempre la porta **4200** durante lo sviluppo. La porta **8080** serve l'app Angular compilata tramite nginx e non riflette le modifiche al codice senza un rebuild completo.

### Avviare in modalità produzione

```bash
make prod
# equivalente a:
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build db api web
```

### Fermare i container

```bash
# Ferma i container, mantiene i dati del DB
make down
# oppure:
docker compose down

# Ferma i container e cancella tutti i volumi (AZZERA IL DATABASE)
docker compose down -v
```

### Visualizzare i log

```bash
# Log di tutti i servizi (ultime 200 righe + follow)
make logs

# Log di un singolo servizio
docker compose logs --tail=200 -f api
docker compose logs --tail=200 -f frontend
```

---

## 5. Migrazioni, seed e comandi database

### Migrazioni automatiche all'avvio (modalità dev)

In `docker-compose.dev.yml`, il container `api` esegue automaticamente al bootstrap:

```bash
bin/rails db:prepare
```

Questo comando: crea il database se non esiste, applica tutte le migrazioni pendenti. **Non è necessario eseguirle manualmente al primo avvio in modalità dev.**

### Migrazioni manuali

```bash
# Applica le migrazioni pendenti
make migrate
# oppure:
docker compose exec api bin/rails db:migrate

# Visualizza lo stato di ogni migrazione (up / down)
docker compose exec api bin/rails db:migrate:status

# Annulla l'ultima migrazione
docker compose exec api bin/rails db:rollback
```

### Seed del database

Il seed popola il database con dati di esempio:

```bash
make seed
# oppure:
docker compose exec api bin/rails db:seed
```

**Cosa crea il seed:**

Tre utenti di test:

| Email | Ruolo |
|-------|-------|
| `claudio.astolfi@edu.unife.it` | admin |
| `vendor@shop.com` | vendor |
| `user@shop.com` | user |

Sedici prodotti di esempio in tre categorie: elettronica (MacBook, cuffie, tastiera, fotocamera, smartwatch, mouse, drone, monitor), moda/accessori (zaino, occhiali, sneakers, orologio), casa (lampada, macchina caffè, pianta, diffusore).

> **Nota:** questi account vengono creati nel DB ma l'accesso avviene tramite Google OAuth2. Per usarli in test, l'email Google dell'account con cui si fa login deve corrispondere a una di quelle elencate.

> **Attenzione:** il seed esegue `Product.destroy_all` e `User.destroy_all` prima di ricreare i dati. Non eseguirlo su dati che si vuole preservare.

### Reset completo del database

```bash
docker compose down -v    # rimuove i volumi (cancella il DB)
make dev                   # ricrea i container e il DB
make seed                  # ripopola con i dati di test
```

### Accedere alla console Rails nel container

```bash
make console
# oppure:
docker compose exec api bin/rails console
```

### Accedere alla shell del container backend

```bash
make bash
# oppure:
docker compose exec api bash
```

---

## 6. Setup senza Docker (sviluppo locale nativo)

Questa modalità è utile quando non si vuole usare Docker, ma richiede che Ruby, Node.js e PostgreSQL siano installati localmente.

### Clonare il repository

```bash
git clone <url-del-repository> shop_app
cd shop_app
```

### Backend Rails

Tutti i comandi vanno eseguiti dalla directory `shop_app/backend/`.

```bash
cd backend

# 1. Installa tutte le gemme Ruby definite in Gemfile
bundle install

# 2. Crea il file backend/.env con le credenziali (vedi sezione 3)

# 3. Assicurati che PostgreSQL 15 sia in esecuzione su localhost:5432
#    con utente "postgres" e password "password"
#    (o aggiorna le variabili nel .env di conseguenza)

# 4. Crea i database development e test
bin/rails db:create

# 5. Applica tutte le migrazioni
bin/rails db:migrate

# 6. (Opzionale) Popola con i dati di esempio
bin/rails db:seed

# 7. Avvia il server Rails
bin/rails server -b 0.0.0.0 -p 3000
```

Il backend sarà disponibile su `http://localhost:3000`.

> **Nota sulla configurazione del database:** `config/database.yml` usa come fallback `host: localhost`, `username: postgres`, `password: password`. Se la tua installazione locale usa credenziali diverse, sovrascrivile con le variabili d'ambiente `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DB_HOST`.

### Frontend Angular

Tutti i comandi vanno eseguiti dalla directory `shop_app/frontend/`.

```bash
cd frontend

# 1. Installa le dipendenze Node.js (Angular, Angular Material, RxJS, ecc.)
npm install

# 2. Verifica l'URL del backend in src/environments.ts
#    Il valore di default è già corretto per sviluppo locale:
#    { production: false, apiUrl: 'http://localhost:3000' }

# 3. Avvia il dev server Angular con hot-reload
npm start
# oppure: npx ng serve
```

Il frontend sarà disponibile su `http://localhost:4200`.

### Build di produzione del frontend (standalone)

```bash
cd frontend
npm run build:prod
# Output: dist/shop/browser/  (da servire con nginx o qualsiasi web server statico)
```

---

## 7. Struttura del codice e architettura

### Frontend Angular — struttura delle directory

```
frontend/src/
├── environments.ts                      # URL del backend (apiUrl)
├── main.ts                              # Bootstrap Angular
├── styles.scss                          # Stili globali
└── app/
    ├── app.ts                           # Root component (ospita il router-outlet)
    ├── app.routes.ts                    # Definizione di tutte le route con lazy loading
    ├── app.config.ts                    # Providers: router, HttpClient, interceptors
    │
    ├── core/                            # Logica condivisa, non legata a una pagina specifica
    │   ├── models/
    │   │   ├── product.ts               # Interfaccia Product
    │   │   └── order.ts                 # Interfacce Order, Customer, Address, ecc.
    │   ├── services/
    │   │   ├── auth.ts                  # Autenticazione: token JWT, login/logout, ruoli
    │   │   ├── cart.ts                  # Carrello: stato (signal) + sync locale/server
    │   │   ├── products.ts              # GET /products, GET /products/:id
    │   │   ├── order.ts                 # GET/POST /orders
    │   │   ├── vendor.ts                # POST/PATCH/DELETE /vendor/products
    │   │   └── admin.ts                 # GET/PATCH/DELETE /admin/users
    │   ├── interceptors/
    │   │   ├── auth.ts                  # Aggiunge JWT all'header + prefissa URL con apiUrl
    │   │   └── http.error.ts            # Gestione errori HTTP globale (es: logout su 401)
    │   └── guard/
    │       ├── auth-guard.ts            # Rotte accessibili solo agli utenti autenticati
    │       ├── admin-guard.ts           # Rotte accessibili solo agli admin
    │       ├── vendor-guard.ts          # Rotte accessibili a vendor e admin
    │       └── checkout-guard.ts        # Protegge il checkout (es: carrello non vuoto)
    │
    ├── features/                        # Componenti delle pagine
    │   ├── product/
    │   │   └── product-list.ts          # Catalogo prodotti con ricerca full-text
    │   ├── product-detail-page/
    │   │   └── product-detail-page.ts   # Dettaglio singolo prodotto
    │   ├── checkout/
    │   │   ├── checkout.ts              # Form checkout (dati cliente + indirizzo)
    │   │   └── checkout.html            # Template con riepilogo carrello e form reattivo
    │   ├── orders/
    │   │   └── orders.ts                # Storico ordini dell'utente autenticato
    │   ├── auth/
    │   │   └── login-success.ts         # Riceve il token JWT dall'URL dopo il redirect OAuth
    │   ├── admin/
    │   │   └── admin-dashboard.ts       # Pannello admin: lista utenti, cambia ruolo, elimina
    │   └── vendor/
    │       └── vendor-dashboard/
    │           └── vendor-dashboard.ts  # Pannello vendor: CRUD prodotti propri
    │
    └── shared/
        ├── component/
        │   ├── header.ts                # Barra di navigazione con carrello e stato login
        │   └── confirm.ts               # Dialog di conferma generica
        └── http/
            └── http-state-card/         # Componente per gestire stati: loading/error/vuoto
```

#### Routing dell'applicazione

| Route | Componente | Guard | Lazy? |
|-------|-----------|-------|-------|
| `/` | redirect a `/products` | — | — |
| `/products` | `ProductListComponent` | — | sì |
| `/products/:id` | `ProductDetailPage` | — | no |
| `/checkout` | `CheckoutComponent` | `checkoutGuard` | sì |
| `/login/success` | `LoginSuccessComponent` | — | sì |
| `/orders` | `OrdersComponent` | `authGuard` | sì |
| `/admin/dashboard` | `AdminDashboardComponent` | `adminGuard` | sì |
| `/vendor/dashboard` | `VendorDashboardComponent` | `vendorGuard` | sì |

#### Come viene configurato l'URL del backend

L'URL del backend è definito in `frontend/src/environments.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

L'interceptor `auth.ts` legge `environment.apiUrl` e lo usa come prefisso per **tutte le richieste HTTP che iniziano con `/`**. I servizi Angular usano quindi path relativi (`/products`, `/orders`, ecc.) senza URL assoluto: è l'interceptor che completa l'URL.

#### Gestione del carrello e sincronizzazione

Il `CartService` usa Angular Signals per lo stato reattivo e gestisce due scenari distinti:

- **Utente non autenticato:** il carrello è salvato in `sessionStorage` (viene cancellato alla chiusura del tab)
- **Utente autenticato:** il carrello è persistito nel database tramite API
- **Al login:** `syncLocalCartToServer()` sposta il contenuto locale nel server e poi cancella lo storage

### Backend Rails — struttura delle directory

```
backend/app/
├── controllers/
│   ├── application_controller.rb        # Base: autenticazione JWT, require_admin!, require_vendor!
│   ├── callbacks_controller.rb          # Google OAuth2 callback → crea utente → genera JWT → redirect
│   ├── products_controller.rb           # Endpoint pubblici: GET /products, GET /products/:id
│   ├── carts_controller.rb              # Carrello autenticato: show, add_item, remove_item, update_item
│   ├── orders_controller.rb             # Ordini autenticati: index, show, create
│   ├── admin/
│   │   └── users_controller.rb          # Admin: lista, modifica ruolo, elimina utenti
│   └── vendor/
│       └── products_controller.rb       # Vendor: crea, modifica (solo propri), elimina (solo propri)
│
├── models/
│   ├── user.rb          # enum role {user:0, admin:1, vendor:2}, validazioni, associazioni
│   ├── product.rb       # belongs_to :vendor (optional), validates :title, :price
│   ├── order.rb         # belongs_to :user, has_many :order_items
│   ├── order_item.rb    # belongs_to :order, belongs_to :product
│   └── cart_item.rb     # belongs_to :user, belongs_to :product, unicità per (user, product)
│
└── config/
    ├── routes.rb                        # Definizione di tutti gli endpoint
    ├── initializers/
    │   ├── cors.rb                      # Permette richieste da localhost:4200 e localhost:8080
    │   └── omniauth.rb                  # Configura Google OAuth2 con le credenziali da .env
    └── database.yml                     # Configurazione PostgreSQL (sovrascritta da DATABASE_URL)
```

#### Autenticazione nelle richieste API

Ogni controller che richiede autenticazione chiama `before_action :authenticate_user!` (definito in `ApplicationController`), che:

1. Legge l'header `Authorization: Bearer <token>`
2. Decodifica il JWT usando `Rails.application.credentials.secret_key_base`
3. Trova l'utente per `user_id` nel payload
4. Espone l'utente come `@current_user` per l'azione del controller

Se il token è mancante, scaduto o non valido, risponde con `401 Unauthorized`.

### Flusso tipico di utilizzo (dal punto di vista dell'utente)

```
1. Apertura dell'app → redirect automatico a /products
   → GET /products                      (pubblico)

2. Clic su un prodotto → /products/:id
   → GET /products/:id                  (pubblico)

3. "Aggiungi al carrello"
   → se non autenticato: salva in sessionStorage
   → se autenticato: POST /cart/add/:product_id

4. Clic su "Login" → redirect Google OAuth2
   → al ritorno: token JWT salvato in localStorage
   → carrello locale sincronizzato: POST /cart/add/:id per ogni item

5. /checkout: inserisci dati cliente e indirizzo
   → POST /orders { customer: {...}, address: {...} }
   → il backend crea l'ordine, svuota il carrello del DB, restituisce l'ordine

6. /orders: storico ordini
   → GET /orders                        (autenticato)

7. (Admin) /admin/dashboard
   → GET /admin/users                   (solo admin)
   → PATCH /admin/users/:id { role: "vendor" }

8. (Vendor) /vendor/dashboard
   → POST /vendor/products              (vendor/admin)
   → PATCH /vendor/products/:id         (solo prodotti propri per vendor; tutti per admin)
```

---

## 8. API: endpoint disponibili

Tutti gli endpoint rispondono in JSON. Gli endpoint protetti richiedono l'header:
```
Authorization: Bearer <jwt_token>
```

### Prodotti (endpoint pubblici)

| Metodo | Path | Descrizione |
|--------|------|-------------|
| `GET` | `/products` | Lista tutti i prodotti ordinati per data (più recenti prima). Supporta `?q=termine` per ricerca su titolo e descrizione |
| `GET` | `/products/:id` | Dettaglio di un singolo prodotto |

### Carrello (richiede autenticazione)

| Metodo | Path | Descrizione |
|--------|------|-------------|
| `GET` | `/cart` | Carrello dell'utente corrente con prodotti inclusi |
| `POST` | `/cart/add/:product_id` | Aggiunge 1 unità del prodotto. Se è già nel carrello, incrementa la quantità |
| `DELETE` | `/cart/remove/:product_id` | Rimuove completamente il prodotto dal carrello |
| `PATCH` | `/cart/update/:product_id` | Imposta la quantità esatta. Body: `{ "quantity": N }` (minimo 1) |

### Ordini (richiede autenticazione)

| Metodo | Path | Descrizione |
|--------|------|-------------|
| `GET` | `/orders` | Lista degli ordini dell'utente corrente (id, created_at, status, total) |
| `GET` | `/orders/:id` | Dettaglio ordine con righe (order_items) e prodotti inclusi |
| `POST` | `/orders` | Crea un ordine dal carrello corrente e lo svuota. Richiede body con dati cliente e indirizzo |

**Payload per `POST /orders`:**
```json
{
  "customer": {
    "firstName": "Mario",
    "lastName": "Rossi",
    "email": "mario@esempio.it"
  },
  "address": {
    "street": "Via Roma 1",
    "city": "Roma",
    "zip": "00100"
  }
}
```

**Risposta `POST /orders` (201 Created):**
```json
{
  "id": 42,
  "status": "completato",
  "total": "3148.9",
  "created_at": "2026-05-19T10:30:00.000Z"
}
```

### Admin (richiede ruolo `admin`)

| Metodo | Path | Descrizione |
|--------|------|-------------|
| `GET` | `/admin/users` | Lista tutti gli utenti (id, name, email, role) |
| `PATCH` | `/admin/users/:id` | Cambia il ruolo dell'utente. Body: `{ "role": "vendor" }`. Non si può modificare il proprio ruolo |
| `DELETE` | `/admin/users/:id` | Elimina un utente. Non si può eliminare il proprio account |

### Vendor (richiede ruolo `vendor` o `admin`)

| Metodo | Path | Descrizione |
|--------|------|-------------|
| `POST` | `/vendor/products` | Crea un nuovo prodotto associato all'utente corrente come vendor |
| `PATCH` | `/vendor/products/:id` | Modifica un prodotto. Un vendor può modificare solo i propri; un admin può modificare tutti |
| `DELETE` | `/vendor/products/:id` | Elimina un prodotto con le stesse regole di ownership |

**Payload per `POST/PATCH /vendor/products`:**
```json
{
  "product": {
    "title": "Nome prodotto",
    "description": "Descrizione del prodotto",
    "price": 99.99,
    "original_price": 129.99,
    "sale": true,
    "thumbnail": "https://esempio.com/immagine.jpg"
  }
}
```

### Autenticazione e health check

| Metodo | Path | Descrizione |
|--------|------|-------------|
| `GET` | `/auth/google_oauth2` | Avvia il flusso OAuth con Google (gestito da OmniAuth) |
| `GET` | `/auth/google_oauth2/callback` | Callback OAuth: crea l'utente se necessario, genera JWT, redirect al frontend |
| `GET` | `/up` | Health check Rails standard — risponde 200 se l'app è avviata |

---

## 9. Schema del database e migrazioni

### Schema attuale (versione 2026-05-18-000002)

```
users
  id              bigserial PRIMARY KEY
  email           varchar    NOT NULL UNIQUE
  name            varchar
  role            integer    DEFAULT 0   -- 0=user, 1=admin, 2=vendor
  created_at      timestamp  NOT NULL
  updated_at      timestamp  NOT NULL

products
  id              bigserial PRIMARY KEY
  title           varchar
  description     text
  price           decimal
  original_price  decimal
  sale            boolean
  thumbnail       varchar
  vendor_id       bigint     REFERENCES users(id)  -- nullable: prodotti senza vendor
  created_at      timestamp  NOT NULL
  updated_at      timestamp  NOT NULL

orders
  id              bigserial PRIMARY KEY
  user_id         bigint     NOT NULL REFERENCES users(id)
  customer        jsonb      -- { "firstName": "...", "lastName": "...", "email": "..." }
  address         jsonb      -- { "street": "...", "city": "...", "zip": "..." }
  total           decimal
  status          varchar    -- es: "completato"
  created_at      timestamp  NOT NULL
  updated_at      timestamp  NOT NULL

order_items
  id              bigserial PRIMARY KEY
  order_id        bigint     NOT NULL REFERENCES orders(id)
  product_id      bigint     NOT NULL REFERENCES products(id)
  quantity        integer    NOT NULL
  price           decimal    -- prezzo al momento dell'acquisto (snapshot)
  created_at      timestamp  NOT NULL
  updated_at      timestamp  NOT NULL

cart_items
  id              bigserial PRIMARY KEY
  user_id         bigint     NOT NULL REFERENCES users(id)
  product_id      bigint     NOT NULL REFERENCES products(id)
  quantity        integer    NOT NULL DEFAULT 1
  created_at      timestamp  NOT NULL
  updated_at      timestamp  NOT NULL
  UNIQUE (user_id, product_id)   -- un utente non può avere lo stesso prodotto due volte
```

**Note di design importanti:**
- `orders.customer` e `orders.address` sono colonne **JSONB**: i dati dell'acquirente e dell'indirizzo sono uno snapshot al momento dell'ordine, non un join a tabelle separate. Questo garantisce che gli ordini rimangano corretti anche se i dati dell'utente cambiano in futuro.
- `order_items.price` è anch'essa uno snapshot del prezzo al momento dell'acquisto.
- `cart_items` ha un vincolo `UNIQUE (user_id, product_id)`: ogni prodotto può apparire una sola volta nel carrello di un utente, con una quantità > 0.
- `products.vendor_id` è nullable: i prodotti creati prima dell'introduzione dei vendor (o dal seed) non hanno un vendor associato.

### Cronologia delle migrazioni

Tutte le migrazioni si trovano in `backend/db/migrate/`. Vengono applicate in ordine cronologico (per timestamp nel nome file).

---

#### `20260224213948_create_products`

Crea la tabella `products` con i campi fondamentali: `title` (nome), `description` (testo lungo), `price` e `original_price` (prezzi decimali), `sale` (booleano per indicare se il prodotto è in saldo), `thumbnail` (URL immagine), più i timestamp standard `created_at`/`updated_at`.

```ruby
create_table :products do |t|
  t.string  :title
  t.text    :description
  t.decimal :price
  t.decimal :original_price
  t.boolean :sale
  t.string  :thumbnail
  t.timestamps
end
```

**Necessaria per:** mostrare il catalogo prodotti.

---

#### `20260305171050_create_orders`

Crea la tabella `orders` con tre colonne JSONB (`customer`, `address`, `items`) e il totale decimale. La colonna `items` verrà rimossa in seguito (vedi migrazione 8).

```ruby
create_table :orders do |t|
  t.jsonb   :customer
  t.jsonb   :address
  t.jsonb   :items     # ← verrà rimossa dalla migrazione 20260518000001
  t.decimal :total
  t.timestamps
end
```

**Necessaria per:** creare ordini (struttura iniziale).

---

#### `20260305185050_create_users`

Crea la tabella `users` con `email` e `name`. L'email viene usata come identificatore univoco durante il flusso OAuth2.

```ruby
create_table :users do |t|
  t.string :email
  t.string :name
  t.timestamps
end
```

**Necessaria per:** creare gli utenti al primo login Google.

---

#### `20260309170908_add_role_to_users`

Aggiunge la colonna `role` (intero) agli utenti con default 0 (= `user`). Questo abilita il sistema di permessi basato su ruoli (`user`, `admin`, `vendor`).

```ruby
add_column :users, :role, :integer, default: 0
```

**Necessaria per:** differenziare i permessi tra utenti normali, admin e vendor.

---

#### `20260312151133_create_cart_items`

Crea la tabella `cart_items` per gestire i carrelli persistenti degli utenti autenticati. Ogni riga rappresenta "l'utente X ha il prodotto Y in quantità Z nel carrello".

```ruby
create_table :cart_items do |t|
  t.references :user,    null: false, foreign_key: true
  t.references :product, null: false, foreign_key: true
  t.integer    :quantity
  t.timestamps
end
```

**Necessaria per:** il carrello degli utenti autenticati.

---

#### `20260312161304_create_order_items`

Crea la tabella `order_items` per le righe di ogni ordine. Ogni riga è lo snapshot di "prodotto X, quantità Y, al prezzo Z" al momento dell'acquisto. Il prezzo viene copiato da `product.price` al momento della conferma dell'ordine, non è un foreign key al prezzo corrente.

```ruby
create_table :order_items do |t|
  t.references :order,   null: false, foreign_key: true
  t.references :product, null: false, foreign_key: true
  t.integer    :quantity
  t.decimal    :price
  t.timestamps
end
```

**Necessaria per:** dettaglio degli ordini con i prodotti acquistati.

---

#### `20260312162107_add_user_and_status_to_orders`

Aggiunge a `orders` il riferimento all'utente che ha effettuato l'ordine (`user_id`) e il campo `status` (stringa, es. `"completato"`). Prima di questa migrazione gli ordini non erano associati a nessun utente.

```ruby
add_reference :orders, :user, null: false, foreign_key: true
add_column    :orders, :status, :string
```

**Necessaria per:** associare ogni ordine al suo proprietario e visualizzare lo storico per utente.

---

#### `20260518000001_clean_up_schema`

Migrazione di pulizia dello schema con tre operazioni:

1. **Rimuove `orders.items`** (colonna JSONB): con l'introduzione di `order_items`, la lista prodotti non viene più salvata come JSON denormalizzato nell'ordine, ma in righe separate della tabella `order_items`.

2. **Rende `cart_items.quantity` NOT NULL con default 1**: garantisce che ogni riga del carrello abbia sempre una quantità valida. Il default 1 a livello database è importante: senza questo, quando Rails usa `find_or_initialize_by`, il campo `quantity` del nuovo record risulterebbe `nil` anziché 1.

3. **Rende `order_items.quantity` NOT NULL**: ogni riga di un ordine deve avere una quantità definita.

```ruby
remove_column    :orders,      :items,    :jsonb
change_column_null    :cart_items, :quantity, false, 1
change_column_default :cart_items, :quantity, from: nil, to: 1
change_column_null    :order_items, :quantity, false, 1
```

**Necessaria per:** pulizia del modello dati e prevenzione di stati inconsistenti nel carrello.

---

#### `20260518000002_add_vendor_to_products`

Aggiunge la colonna `vendor_id` alla tabella `products`. È una foreign key nullable che punta a `users`: ogni prodotto può (ma non deve) avere un vendor associato. Questo abilita la funzionalità multi-vendor, dove ogni vendor può gestire solo i propri prodotti.

```ruby
add_reference :products, :vendor, foreign_key: { to_table: :users }, null: true
```

**Necessaria per:** il pannello vendor e la logica di ownership dei prodotti.

---

## 10. Comandi principali usati durante lo sviluppo

### Creazione iniziale del progetto

Questi comandi sono stati eseguiti **una sola volta** per creare lo scheletro dell'applicazione. Chi clona il repository **non deve eseguirli**.

```bash
# Nella directory shop_app/ — crea il progetto Rails in modalità API con PostgreSQL
rails new backend --api --database=postgresql

# Nella directory shop_app/ — crea il progetto Angular con componenti standalone e SCSS
ng new frontend --style=scss --ssr=false
```

### Generazione componenti Angular

Eseguiti in `shop_app/frontend/`. **Solo per scaffolding iniziale, non necessari per chi clona.**

```bash
# Componenti delle pagine (features)
ng generate component features/product/product-list
ng generate component features/product-detail-page/product-detail-page
ng generate component features/checkout/checkout
ng generate component features/orders/orders
ng generate component features/auth/login-success
ng generate component features/admin/admin-dashboard
ng generate component features/vendor/vendor-dashboard/vendor-dashboard

# Componenti condivisi
ng generate component shared/component/header
ng generate component shared/component/confirm

# Servizi
ng generate service core/services/auth
ng generate service core/services/cart
ng generate service core/services/products
ng generate service core/services/order
ng generate service core/services/vendor
ng generate service core/services/admin

# Guards (protezione delle route)
ng generate guard core/guard/auth-guard
ng generate guard core/guard/admin-guard
ng generate guard core/guard/vendor-guard
ng generate guard core/guard/checkout-guard

# Interceptors HTTP
ng generate interceptor core/interceptors/auth
ng generate interceptor core/interceptors/http.error
```

### Generazione modelli e controller Rails

Eseguiti in `shop_app/backend/`. **Solo per scaffolding iniziale, non necessari per chi clona.**

```bash
# Modelli (generano anche le migrazioni corrispondenti)
rails generate model Product title:string description:text price:decimal \
  original_price:decimal sale:boolean thumbnail:string

rails generate model Order customer:jsonb address:jsonb items:jsonb total:decimal

rails generate model User email:string name:string

rails generate model CartItem user:references product:references quantity:integer

rails generate model OrderItem order:references product:references \
  quantity:integer price:decimal

# Migrazioni aggiuntive (non legate a un modello nuovo)
rails generate migration AddRoleToUsers role:integer
rails generate migration AddUserAndStatusToOrders user:references status:string
rails generate migration CleanUpSchema
rails generate migration AddVendorToProducts

# Controller
rails generate controller Products index show
rails generate controller Orders index show create
rails generate controller Carts show
rails generate controller Callbacks google_oauth2
rails generate controller Admin::Users index update destroy
rails generate controller Vendor::Products create update destroy
```

### Comandi di gestione del database

Questi comandi sono necessari sia in fase di sviluppo che per chi clona il progetto.

```bash
# ── Via Docker (dalla directory shop_app/) ──────────────────────────────────

# Crea il DB se non esiste + applica tutte le migrazioni pendenti (usato all'avvio)
docker compose exec api bin/rails db:prepare

# Applica solo le migrazioni pendenti (da usare dopo aver aggiunto nuove migrazioni)
docker compose exec api bin/rails db:migrate

# Verifica lo stato di ogni migrazione (up = applicata, down = non ancora applicata)
docker compose exec api bin/rails db:migrate:status

# Popola il DB con i dati di esempio (utenti e prodotti)
docker compose exec api bin/rails db:seed

# Annulla l'ultima migrazione applicata
docker compose exec api bin/rails db:rollback

# ── Via Makefile (abbreviazioni per i comandi più usati) ───────────────────

make migrate   # equivale a: docker compose exec api bin/rails db:migrate
make seed      # equivale a: docker compose exec api bin/rails db:seed
make console   # apre la Rails console nel container
make bash      # apre bash nel container api
```

### Comandi Docker Compose

Eseguiti dalla directory radice `shop_app/`.

```bash
# ── Avvio ──────────────────────────────────────────────────────────────────

# Modalità sviluppo (con Angular dev server hot-reload)
make dev
# equivalente a:
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build db api frontend

# Modalità produzione (con nginx)
make prod
# equivalente a:
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build db api web

# ── Stop ───────────────────────────────────────────────────────────────────

make down                        # ferma i container, conserva i dati del DB
make down-v                      # ferma i container E cancella i volumi (azzera il DB)

# ── Monitoraggio ───────────────────────────────────────────────────────────

make logs                        # log di tutti i servizi (ultime 200 righe + follow)
docker compose logs -f api       # solo backend Rails
docker compose logs -f frontend  # solo Angular dev server

# Verifica stato dei container (tutti devono essere "running")
docker compose ps

# ── Build ──────────────────────────────────────────────────────────────────

# Ricostruisce solo l'immagine del backend (dopo modifiche al Gemfile o Dockerfile)
docker compose build api

# Ricostruisce solo l'immagine del frontend di produzione
docker compose build web

```

---

## 11. Istruzioni passo-passo per replicare il progetto da zero

Segui questa checklist nell'ordine indicato. Non saltare nessun passo.

### Prerequisiti (verifica prima di iniziare)

- [ ] Docker Desktop installato e in esecuzione (`docker ps` non dà errori)
- [ ] `make` disponibile nel terminale (`make --version`)
- [ ] Credenziali Google OAuth2 pronte (Client ID e Client Secret)
- [ ] File `backend/config/master.key` disponibile (da chi ha creato il progetto originariamente)

---

### Passo 1 — Clona il repository

```bash
git clone <url-del-repository> shop_app
cd shop_app
```

---

### Passo 2 — Crea il file `.env` nella directory radice

Verifica che esista il file `shop_app/.env`. Se non esiste, crealo:

```bash
cat > .env << 'EOF'
BACKEND_PORT=3000
RAILS_MAX_THREADS=5
DATABASE_URL=postgres://postgres:password@db:5432/shop_app_development
FRONTEND_PORT_DEV=4200
FRONTEND_PORT_PROD=8080
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
EOF
```

---

### Passo 3 — Crea il file `backend/.env` con le credenziali

```bash
cat > backend/.env << 'EOF'
GOOGLE_CLIENT_ID=<il-tuo-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<il-tuo-client-secret>
RAILS_MASTER_KEY=<contenuto-di-backend/config/master.key>
EOF
```

Sostituisci i placeholder con i valori reali:
- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`: da Google Cloud Console (vedi sezione 3)
- `RAILS_MASTER_KEY`: contenuto del file `backend/config/master.key`

---

### Passo 4 — Verifica che `backend/config/master.key` esista

```bash
cat backend/config/master.key
```

Se il file non esiste, vedi [Problema 8](#problema-8--masterkey-mancante) nella sezione 12.

---

### Passo 5 — Avvia l'ambiente di sviluppo

```bash
# Dalla directory shop_app/
make dev
```

Al **primo avvio** questo comando:
1. Scarica le immagini Docker base (può richiedere qualche minuto)
2. Compila l'immagine del backend (installa le gemme Ruby)
3. Avvia PostgreSQL, Rails API e l'Angular dev server
4. Il container `api` esegue automaticamente `db:prepare` (crea il DB + migrazioni)

**Tempo stimato al primo lancio:** 5-10 minuti (dipende dalla connessione internet)  
**Avvii successivi:** 30-60 secondi (le immagini sono già buildate)

---

### Passo 6 — Verifica che tutti i container siano attivi

```bash
docker compose ps
```

Output atteso (tutti i servizi in stato `running` o `healthy`):

```
NAME                    STATUS
shop_app-db-1           running (healthy)
shop_app-api-1          running
shop_app-frontend-1     running
```

Se qualcuno è in `exited`, controlla i log:
```bash
docker compose logs --tail=50 api
docker compose logs --tail=50 frontend
```

---

### Passo 7 — Verifica il backend

Apri nel browser:
```
http://localhost:3000/up
```
Risposta attesa: pagina verde con "OK".

```
http://localhost:3000/products
```
Risposta attesa: array JSON vuoto `[]` (prima del seed) o con prodotti (dopo il seed).

---

### Passo 8 — Popola il database con i dati di esempio

```bash
make seed
```

Output atteso:
```
Creati 3 utenti.
Creati 16 prodotti.
```

---

### Passo 9 — Verifica il frontend

Apri nel browser:
```
http://localhost:4200
```

Deve apparire il catalogo con 16 prodotti. Il frontend ha **hot-reload**: le modifiche ai file TypeScript/HTML/SCSS vengono ricompilate automaticamente (attendi 2-5 secondi dopo il salvataggio).

---

### Passo 10 — Verifica il login con Google

1. Clicca sul pulsante "Accedi" (o "Login") nell'header
2. Viene aperta la pagina di autenticazione Google
3. Dopo l'autenticazione vieni reindirizzato a `http://localhost:4200/login/success?token=...`
4. L'header mostra il nome dell'utente autenticato

---

### Passo 11 — Verifica il flusso di acquisto

1. Aggiungi un prodotto al carrello → il contatore nell'header deve mostrare **1** (non 2)
2. Vai su `/checkout` → appare il riepilogo carrello e il form di checkout
3. Compila tutti i campi (nome, cognome, email, indirizzo) e conferma
4. Vai su `/orders` → deve apparire l'ordine appena creato

---

### Passo 12 (opzionale) — Avvia in modalità produzione

```bash
# Ferma prima l'ambiente di sviluppo
make down

# Avvia in produzione (compila Angular con ng build --configuration production)
make prod
```

L'applicazione sarà disponibile su:
- Frontend (nginx): http://localhost:8080
- Backend (Rails): http://localhost:3000

---

## 12. Problemi noti e soluzioni

### Problema 1 — Il carrello aggiunge 2 prodotti invece di 1

**Sintomo:** al primo click su "Aggiungi al carrello", il contatore mostra 2 invece di 1. Gli aggiungimenti successivi sono corretti (incrementano di 1).

**Causa:** la colonna `quantity` in `cart_items` ha `DEFAULT 1` a livello di database. Quando Rails chiama `find_or_initialize_by`, il record viene inizializzato con `quantity = 1` (dal default DB), e il vecchio codice sommava `(1 || 0) + 1 = 2`.

**Soluzione applicata** in `carts_controller.rb`:
```ruby
cart_item.quantity = cart_item.new_record? ? 1 : cart_item.quantity + 1
```

---

### Problema 2 — Gli item nel checkout si scambiano di posizione

**Sintomo:** aumentando o diminuendo la quantità nel riepilogo del checkout, i prodotti cambiano posizione nell'elenco.

**Causa:** `updateQuantity` nel `CartService` eliminava tutte le copie del prodotto dall'array e le aggiungeva in coda, cambiando l'ordine di inserimento nella `Map` usata per raggruppare gli item.

**Soluzione applicata** in `cart.ts`: la funzione itera sull'array preservando la posizione originale e sostituisce in-place le occorrenze del prodotto.

---

### Problema 3 — Il login non funziona dopo il riavvio dei container

**Sintomo:** dopo `docker compose down` e riavvio, il login con Google fallisce o rimanda a una pagina di errore.

**Causa — Token scaduto:** il JWT aveva scadenza di 30 minuti nella versione iniziale. Se il frontend era aperto da prima del riavvio, il token risultava scaduto.

**Soluzione applicata** in `callbacks_controller.rb`:
```ruby
exp: 24.hours.from_now.to_i   # scadenza 24 ore invece di 30 minuti
```

---

### Problema 4 — Le modifiche al codice non appaiono su porta 8080

**Sintomo:** si modificano file del frontend ma non si vedono cambiamenti aprendo `localhost:8080`.

**Causa:** la porta 8080 serve l'app Angular **compilata** tramite nginx (modalità produzione). Non supporta hot-reload e non riflette le modifiche senza un `docker compose build web`.

**Soluzione:** durante lo sviluppo, usare sempre la porta **4200** (Angular dev server con hot-reload).

---

### Problema 5 — Porta già in uso all'avvio

**Messaggio di errore:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use
```

**Causa:** un altro processo (o un container Docker non fermato correttamente) occupa la porta.

**Soluzione:**
```bash
# Trova il processo che usa la porta 3000
lsof -i :3000

# Terminalo
kill -9 <PID>

# Oppure ferma tutti i container Docker
docker compose down

# Come alternativa, cambia la porta nel file .env
# BACKEND_PORT=3001
```

---

### Problema 6 — Errore CORS nel browser

**Messaggio di errore:**
```
Access to XMLHttpRequest at 'http://localhost:3000/products'
from origin 'http://localhost:4200' has been blocked by CORS policy
```

**Causa:** `backend/config/initializers/cors.rb` accetta richieste solo da `localhost:4200` e `localhost:8080`. Se il frontend gira su una porta diversa, le richieste vengono bloccate.

**Soluzione:** aggiungere l'origine mancante in `cors.rb`:
```ruby
origins "http://localhost:4200", "http://localhost:8080", "http://localhost:<tua_porta>"
```
Poi riavviare il container:
```bash
docker compose restart api
```

---

### Problema 7 — Database non raggiungibile all'avvio

**Messaggio di errore nei log:**
```
PG::ConnectionBad: could not connect to server: Connection refused
```

**Causa:** il container `api` si avvia prima che PostgreSQL sia pronto.

**Soluzione:** il `docker-compose.yml` già include un `healthcheck` su `db` e `depends_on: condition: service_healthy`. Se il problema persiste, riavvia il container `api`:
```bash
docker compose restart api
# oppure attendi 30 secondi e riprovare
```

---

### Problema 8 — `master.key` mancante su una nuova macchina

**Messaggio di errore:**
```
ArgumentError: Missing `secret_key_base` for 'production' environment
# oppure:
ActiveSupport::MessageEncryptor::InvalidMessage
```

**Causa:** `backend/config/master.key` non è nel repository git (escluso da `.gitignore`). È necessario per decrittare `credentials.yml.enc` e come base per `secret_key_base`.

**Soluzione A (consigliata):** ottenere il file `master.key` da chi ha creato il progetto e copiarlo in `backend/config/master.key`.

**Soluzione B:** impostare `RAILS_MASTER_KEY` nel file `backend/.env` con il valore del file `master.key` originale (già previsto nel template della sezione 3).

**Soluzione C (rigenera da zero — ATTENZIONE: invalida i credentials esistenti):**
```bash
cd backend
rm -f config/credentials.yml.enc config/master.key
EDITOR="nano" bin/rails credentials:edit
# Salva e chiudi l'editor: viene generata una nuova master.key
```
Aggiornare poi `RAILS_MASTER_KEY` in `backend/.env` con il nuovo valore.

---

### Problema 9 — Hot reload del frontend non funziona

**Sintomo:** le modifiche ai file Angular non appaiono nel browser anche aspettando.

**Causa:** la cache di Angular (`frontend/.angular`) può diventare inconsistente con il volume Docker.

**Soluzione:**
```bash
# Cancella la cache Angular
rm -rf frontend/.angular

# Riavvia il container frontend
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart frontend

# Se ancora non funziona, rebuild completo
make down
make dev
```

---

### Problema 10 — `COPY vendor/* ./vendor/` fallisce durante il build

**Messaggio di errore:**
```
COPY failed: file not found in build context or excluded by .dockerignore: vendor/*
```

**Causa:** il `Dockerfile` del backend ha `COPY vendor/* ./vendor/` ma la directory `vendor/` potrebbe non esistere o essere vuota.

**Soluzione:**
```bash
mkdir -p backend/vendor
touch backend/vendor/.keep
# poi ricostruisci:
docker compose build api
```
