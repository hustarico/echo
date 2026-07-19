# Echo — Real-Time Private Chat Backend

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.16-brightgreen)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17-blue)](https://openjdk.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-red)](https://jwt.io/)
[![WebSocket](https://img.shields.io/badge/WebSocket-STOMP%20%2F%20SockJS-purple)](https://spring.io/guides/gs/messaging-stomp-websocket/)

Echo is a **real-time private messaging backend** built with Spring Boot. It provides JWT-authenticated REST APIs and WebSocket (STOMP over SockJS) endpoints for direct user-to-user chat, with all messages persisted to MySQL via JPA/Hibernate.

---

## Features

- **JWT Authentication** — Register and login with BCrypt-hashed passwords; stateless 24h JWT tokens
- **REST Messaging** — Send messages and retrieve conversation history via standard HTTP
- **Real-Time WebSocket** — STOMP broker with SockJS fallback for instant message delivery
- **Private Chat** — Messages routed directly to the intended recipient's user channel
- **User Search** — Look up other users by username
- **Global Exception Handling** — Consistent JSON error responses with proper HTTP status codes
- **CORS Enabled** — Configured for `localhost:3000` frontend development

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Spring Boot 3.5.16** | Application framework |
| **Java 17** | Runtime |
| **Spring Security** | Authentication & authorization |
| **JWT (jjwt 0.12.6)** | Stateless token auth (HS256) |
| **Spring WebSocket** | Real-time messaging (STOMP) |
| **Spring Data JPA / Hibernate** | ORM & persistence |
| **MySQL** | Database |
| **Lombok** | Boilerplate reduction |
| **Spring Boot Actuator** | Health & monitoring endpoints |
| **Spring Validation** | Request validation (`@Valid`) |
| **DevTools** | Hot reload during development |

---

## Project Structure

```
src/main/java/com/hustarico/echo/
├── EchoApplication.java                          # Entry point
├── auth/                                         # Authentication
│   ├── AuthController.java                       # POST /auth/register, /auth/login
│   ├── AuthService.java                          # Registration & login logic
│   ├── AuthenticationRequest.java                # Login DTO
│   ├── AuthenticationResponse.java               # JWT response DTO
│   └── RegisterRequest.java                      # Registration DTO
├── config/                                       # Infrastructure
│   ├── ApplicationConfig.java                    # Security beans (AuthProvider, PasswordEncoder, etc.)
│   ├── JwtService.java                           # JWT token generation & validation
│   ├── JwtAuthenticationFilter.java              # Bearer token extraction filter
│   ├── SecurityConfig.java                       # HTTP security, CORS, session policy
│   ├── WebSocketConfig.java                      # STOMP broker, endpoints
│   ├── WebSocketAuthInterceptor.java             # JWT validation on WS connect
│   └── WebSocketService.java                     # User-targeted message push
├── message/                                      # Messaging domain
│   ├── Message.java                              # JPA entity
│   ├── MessageDTO.java                           # Immutable transfer object (record)
│   ├── MessageRequest.java                       # Inbound message DTO (record)
│   ├── MessageRepository.java                    # JPA queries for conversations
│   ├── MessageRestController.java                # REST: POST /messages, GET /messages/history/{user}
│   ├── MessageService.java                       # Business logic
│   └── MessageWsController.java                  # STOMP: /app/chat.private
├── user/                                         # User domain
│   ├── Role.java                                 # Enum: USER, ADMIN
│   ├── User.java                                 # JPA entity implementing UserDetails
│   ├── UserController.java                       # GET /users/{name}
│   ├── UserRepository.java                       # JPA queries
│   ├── UserService.java                          # Search users
│   ├── UserNotFoundException.java
│   └── UsernameAlreadyExistsException.java
└── exception/
    └── GlobalExceptionHandler.java               # @ControllerAdvice
```

---

## API Reference

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Create a new account | None |
| `POST` | `/auth/login` | Authenticate and receive JWT | None |

**Register Request:**
```json
{ "username": "alice", "password": "secret123" }
```

**Login Request:**
```json
{ "username": "alice", "password": "secret123" }
```

**Response:**
```json
{ "jwt": "eyJhbGciOiJIUzI1NiJ9..." }
```

### Messaging (REST)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/messages` | Send a private message | JWT |
| `GET` | `/messages/history/{username}` | Get conversation with another user | JWT |

**Send Message:**
```json
{ "text": "Hey!", "sentTo": "bob" }
```

**History Response:**
```json
[
  {
    "id": 1,
    "senderUsername": "alice",
    "receiverUsername": "bob",
    "text": "Hey!",
    "sentAt": "2026-07-19T12:00:00"
  }
]
```

### Messaging (WebSocket)

Connect to `ws://localhost:8080/ws` (STOMP over SockJS) with the JWT in the `Authorization` header.

| STOMP Destination | Direction | Description |
|---|---|---|
| `/app/chat.private` | Client → Server | Send a private message |
| `/user/topic` | Server → Client | Receive incoming messages |

### Users

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/users/{name}` | Search users by username | JWT |

---

## Quick Start

### Prerequisites

- Java 17+
- MySQL 8.0+
- Maven (or use the included Maven wrapper)

### Setup

```bash
# 1. Create the database
mysql -u root -p -e "CREATE DATABASE echo"

# 2. Update credentials (optional)
# Edit src/main/resources/application.properties

# 3. Run the application
./mvnw spring-boot:run
```

The server starts on `http://localhost:8080`.

---

## Configuration

All settings in `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/echo
spring.datasource.username=root
spring.datasource.password=0000

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

---

## Development

```bash
# Run with hot reload
./mvnw spring-boot:run

# Build (skip tests)
./mvnw clean package -DskipTests

# Run tests
./mvnw test
```

---

## Acknowledgements

Built with [Spring Boot](https://spring.io/projects/spring-boot) and the amazing Spring ecosystem.
