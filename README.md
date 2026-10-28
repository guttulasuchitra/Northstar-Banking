# Northstar Banking - Spring Boot Microservices

| Module | Port | Role |
|---|---|---|
| eureka-server | 8761 | Service discovery |
| api-gateway | 8080 | Single entry point, validates JWT, routes requests |
| auth-service | 8083 | Register / login, issues JWT |
| customer-service | 8081 | Customer CRUD |
| account-service | 8082 | Account CRUD + deposit / withdraw |

Java 17+, Maven 3.9+.

## Run (start in this order)
```
mvn clean install
cd eureka-server    && mvn spring-boot:run
cd auth-service     && mvn spring-boot:run
cd customer-service && mvn spring-boot:run
cd account-service  && mvn spring-boot:run
cd api-gateway      && mvn spring-boot:run
```
In Eclipse: File > Import > Maven > Existing Maven Projects, select this folder,
then right-click each *Application.java > Run As > Java Application.

## Try it (Postman) - always call the gateway on :8080
1. `POST http://localhost:8080/api/auth/login`  body `{"username":"admin","password":"admin123"}` -> copy `token`
   (or register first: `POST /api/auth/register`)
2. Add header `Authorization: Bearer <token>` to everything below
3. `POST /api/customers`  `{"name":"Asha","email":"asha@mail.com","phone":"9999999999","address":"Mumbai"}`
4. `GET  /api/customers`
5. `POST /api/accounts`   `{"customerId":1,"type":"SAVINGS","balance":5000}`
6. `POST /api/accounts/1/deposit`  `{"amount":1000}`
7. `POST /api/accounts/1/withdraw` `{"amount":500}`

Without a token the gateway returns 401. Eureka dashboard: http://localhost:8761
Databases are in-memory H2 (data resets on restart); swap the datasource in each application.yml for MySQL if needed.
The JWT secret in auth-service and api-gateway application.yml must match.
To add a new service: create a module, add it to the parent pom <modules>, add the Eureka client
dependency, then add a route in api-gateway application.yml.

## Docker (jar -> volume -> network -> image -> container)
Each module has its own Dockerfile that copies the jar from its `target` folder.
Full copy-paste commands are in `docker-commands.txt`. Summary:
1. `mvn clean package -DskipTests`
2. `docker volume create auth-data customer-data account-data` (one per command)
3. `docker network create bank-network`
4. `docker build -t northstar/<module> .` inside each module folder
5. `docker run ...` one by one: eureka-server, auth-service, customer-service, account-service, api-gateway
