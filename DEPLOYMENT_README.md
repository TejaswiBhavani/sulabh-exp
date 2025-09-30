# Sulabh Fullstack Application - Deployment Guide

## 🎉 Application Successfully Deployed!

### Application Overview
This is a complete fullstack application that combines:
- **Backend**: Spring Boot 3.5.6 with Java 21
- **Frontend**: React + TypeScript + Vite + Tailwind CSS  
- **Database**: H2 in-memory database
- **Security**: JWT-based authentication
- **Build**: Maven for backend, integrated frontend build

### 🚀 How to Run the Application

#### Quick Start
```bash
# Navigate to project directory
cd C:\JFS\sulabh-backend

# Build the complete application (backend + frontend)
.\mvnw.cmd package -DskipTests

# Run the application
java -jar target\sulabh-backend-0.0.1-SNAPSHOT.jar
```

#### Application URLs
- **Main Application**: http://localhost:8081
- **H2 Database Console**: http://localhost:8081/h2-console
  - JDBC URL: `jdbc:h2:mem:sulabhdb`
  - Username: `SA`
  - Password: (leave empty)

### 🔐 Default Test Users
The application automatically creates these test users on startup:

1. **Admin User**:
   - Email: `admin@sulabh.com`
   - Password: `admin123`
   - Account: `ACC001` with balance ₹10,000.00

2. **Regular User**:
   - Email: `user@sulabh.com` 
   - Password: `user123`
   - Account: `ACC002` with balance ₹5,000.00

### 📡 API Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user info

#### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

#### Account Operations
- `GET /api/accounts` - Get user accounts
- `POST /api/accounts` - Create new account

#### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - Get user transactions

### 🏗️ Architecture

```
├── Spring Boot Backend (port 8081)
│   ├── REST API Controllers
│   ├── JWT Security Configuration
│   ├── JPA Entities & Repositories
│   ├── Business Services
│   └── H2 Database
│
└── React Frontend (served as static resources)
    ├── TypeScript + Vite build
    ├── Tailwind CSS styling
    ├── Authentication Context
    └── API Service Layer
```

### 🔧 Technology Stack

**Backend:**
- Java 21 LTS
- Spring Boot 3.5.6
- Spring Security 6 (JWT)
- Spring Data JPA
- H2 Database
- Maven

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Axios for API calls

### 📁 Project Structure

```
sulabh-backend/
├── src/main/java/com/sulabh/sulabh_backend/
│   ├── config/          # Security & Data configuration
│   ├── controller/      # REST API controllers
│   ├── dto/            # Data Transfer Objects
│   ├── entity/         # JPA entities
│   ├── repository/     # Data repositories
│   ├── security/       # JWT & Security components
│   └── service/        # Business logic services
├── src/main/resources/
│   ├── static/         # Built React frontend
│   └── application.properties
├── frontend/           # React source files
└── target/            # Built JAR file
```

### 🛠️ Build Process

The application uses a unified build process:
1. Maven builds the Spring Boot application
2. Frontend is built separately and copied to `src/main/resources/static/`
3. Spring Boot serves the React SPA as static resources
4. Single JAR file contains both backend and frontend

### 🔄 Development Workflow

1. **Backend Development**: Edit Java files in `src/main/java/`
2. **Frontend Development**: Edit React files in `frontend/src/`
3. **Build Frontend**: `cd frontend && npm run build`
4. **Copy Frontend**: Copy `frontend/dist/*` to `src/main/resources/static/`
5. **Build Backend**: `.\mvnw.cmd package`
6. **Run Application**: `java -jar target\sulabh-backend-0.0.1-SNAPSHOT.jar`

### 🚨 Troubleshooting

#### Port Already in Use
```bash
# Find process using port 8081
netstat -ano | findstr :8081

# Kill the process (replace PID)
taskkill /PID <process_id> /F
```

#### Database Issues
- H2 database is in-memory and resets on restart
- Check H2 console at `/h2-console` for data inspection
- Default users are recreated on each startup

### 🎯 Next Steps

1. **Deployment**: Consider deploying to cloud platforms (AWS, Azure, Heroku)
2. **Database**: Migrate from H2 to PostgreSQL/MySQL for production
3. **Security**: Add rate limiting, CORS configuration for production
4. **Testing**: Add comprehensive unit and integration tests
5. **Monitoring**: Add application monitoring and logging

---

## ✅ Success! 
Your fullstack Sulabh application is now running successfully on http://localhost:8081