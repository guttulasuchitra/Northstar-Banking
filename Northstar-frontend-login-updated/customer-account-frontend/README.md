# Northstar Banking Frontend

React + TypeScript + Vite frontend for the Northstar Banking microservices project.

## Run locally (Windows)

1. Open a terminal in this folder (`customer-account-frontend`).
2. Install packages: `npm.cmd install`
3. Start the frontend: `npm.cmd run dev`
4. Open the URL printed by Vite (normally `http://localhost:5173`).

The Vite development server proxies `/api/*` requests to `http://localhost:8080` (API Gateway). The Docker Nginx configuration does the same using the Docker service name `api-gateway:8080`.

## Environment settings

The root `.env` file contains:

- `VITE_API_BASE_URL=` — leave empty to use relative `/api/...` URLs and avoid browser CORS issues by using the configured proxy.
- `VITE_AUTH_LOGIN_PATH=/api/auth/login` — expected login endpoint exposed by the API Gateway. Change this to match the route configured in your Gateway/Auth Service.

Restart Vite after changing `.env`.

## Auth Service integration note

The login form sends `POST` JSON to `VITE_AUTH_LOGIN_PATH` with `email`, `username`, and `password` fields. It expects a successful JSON response containing a token under one of `accessToken`, `access_token`, `token`, or `jwt` (also checks `data.accessToken` / `data.token`). The token is kept in `sessionStorage` and sent as `Authorization: Bearer <token>` for customer/account API calls. Sign out removes the session token.

**Important:** The provided frontend archive did not include the Auth Service source or API Gateway route configuration, so `/api/auth/login`, the request field names, and token response property must be checked against your actual backend. This frontend cannot make login succeed until the Gateway routes this path to the Auth Service and the backend's request/response format matches (or this small login handler is adjusted).

## Docker

Build the image from this folder using the existing Dockerfile. Ensure the frontend container and `api-gateway` are attached to the same Docker network, and that the gateway container/service is named `api-gateway`.
