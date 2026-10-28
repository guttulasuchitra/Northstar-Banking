# ClientHub — Customer & Account Frontend

A standalone React + TypeScript + Vite frontend for the Customer Service and Account Service Spring Boot APIs.

## What is included
- Overview dashboard with customer/account counts and combined balance
- Customer list, search, create, and delete
- Account list, search, create, and delete
- API error messages and refresh action
- Responsive layout for desktop and mobile

## Requirements
- Node.js 20.19+ or 22.12+
- Customer Service running on `http://localhost:8081`
- Account Service running on `http://localhost:8082`

## Run on Windows
1. Extract this ZIP into a separate folder. It does not need to be inside either backend project.
2. Open Command Prompt in the extracted `customer-account-frontend` folder.
3. Install frontend dependencies:
   ```cmd
   npm install
   ```
4. Start the frontend:
   ```cmd
   npm run dev
   ```
5. Open the URL printed by Vite, normally `http://localhost:5173`.

## API integration
The frontend uses the endpoints found in the supplied backend projects:
- `GET/POST /api/customers`
- `DELETE /api/customers/{id}`
- `GET/POST /api/accounts`
- `DELETE /api/accounts/{id}`

The Vite development server proxies `/api/customers` to `http://localhost:8081` and `/api/accounts` to `http://localhost:8082`, so browser requests use the same frontend origin and avoid development CORS issues.

If the backend host ports change, update `vite.config.ts`. These proxy settings are for local development; they are not a production reverse proxy.

## Important backend note
The supplied backend services store records in in-memory maps, not a database. Records can disappear when a service restarts. The Account API also expects a positive balance and a non-empty customer ID/account type.

## Production build
```cmd
npm run build
```
The generated static files are placed in `dist/`.


## Dockerize the frontend

The frontend has a multi-stage `Dockerfile`: Node builds the production React app and Nginx serves it. Nginx forwards `/api/customers` to `customer-service:8081` and `/api/accounts` to `account-service:8082` when those backend containers are attached to the same Docker network and use those names.

Build the image from this folder:

```powershell
docker build -t customer-account-frontend:latest .
```

Run the frontend container:

```powershell
docker run -d --name customer-account-frontend -p 5173:80 customer-account-frontend:latest
```

Open `http://localhost:5173`. This starts the frontend container independently. API actions will not work until the backend containers are running and attached to the same Docker network with names `customer-service` and `account-service` (or the Nginx proxy targets are updated to match your actual container names). The frontend image itself can be built before the backend containers are ready.

To see logs:

```powershell
docker logs customer-account-frontend
```

To stop and remove the frontend container:

```powershell
docker stop customer-account-frontend
docker rm customer-account-frontend
```
