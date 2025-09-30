# Sulabh Banking Application

A modern, secure fullstack banking application built with Spring Boot backend and React frontend.

## 🚀 Live Demo

**Application URL:** [Coming Soon - Will be deployed on Railway]

## 🏗️ Technology Stack

### Backend
- **Framework:** Spring Boot 3.5.6
- **Language:** Java 17
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** Spring Security
- **Build Tool:** Maven

### Frontend
- **Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** React Context
- **HTTP Client:** Axios
- **Routing:** React Router v6

## ✨ Features

### 🔐 Authentication & Security
- JWT-based secure authentication
- Password encryption with BCrypt
- Protected routes and API endpoints
- Session management
- CORS configuration for cross-origin requests

### 💰 Banking Operations
- User registration with automatic account creation
- Account balance management
- Money transfers between accounts
- Transaction history and tracking
- Real-time balance updates

### 👤 User Management
- Profile management
- Password change functionality
- Account settings
- User dashboard with analytics

### 📱 Modern UI/UX
- Responsive design for all devices
- Clean, intuitive interface
- Real-time notifications
- Loading states and error handling
- Dark/light theme support

## 🚀 Quick Start

### Prerequisites
- Java 17 or higher
- Node.js 18 or higher
- PostgreSQL database
- Maven (or use included Maven wrapper)

### Local Development Setup

1. **Clone the repository:**
```bash
git clone https://github.com/TejaswiBhavani/sulabh-exp.git
cd sulabh-exp
```

2. **Setup PostgreSQL Database:**
```sql
CREATE DATABASE sulabh;
```

3. **Configure Environment Variables:**
Create `.env` file in the project root:
```env
DATABASE_URL=jdbc:postgresql://localhost:5432/sulabh
DB_USERNAME=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
```

4. **Build and Run:**

**Option 1: Automated Build (Recommended)**
```bash
# For Windows
./build.bat

# For Linux/Mac
./build.sh
```

**Option 2: Manual Build**
```bash
# Build frontend
cd temp-sulabh-frontend
npm install
npm run build
cd ..

# Copy frontend to Spring Boot
cp -r temp-sulabh-frontend/dist/* src/main/resources/static/

# Build and run Spring Boot
./mvnw clean package
java -jar target/sulabh-backend-0.0.1-SNAPSHOT.jar
```

5. **Access the Application:**
- Frontend + Backend: http://localhost:8080
- API Documentation: http://localhost:8080/api/docs (if Swagger is enabled)

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)
```bash
docker-compose up -d
```

### Manual Docker Build
```bash
docker build -t sulabh-banking-app .
docker run -p 8080:8080 \
  -e DATABASE_URL=your_db_url \
  -e DB_USERNAME=your_username \
  -e DB_PASSWORD=your_password \
  sulabh-banking-app
```

## ☁️ Cloud Deployment

### Railway Deployment
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Heroku Deployment
1. Create new Heroku app
2. Add PostgreSQL addon
3. Set environment variables
4. Deploy using Git or GitHub integration

### AWS/GCP/Azure
- Use the provided Dockerfile
- Configure database connection
- Set up load balancer and auto-scaling

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - User logout

### Account Management
- `GET /api/account` - Get account information
- `GET /api/account/balance` - Get account balance
- `POST /api/account/transfer` - Transfer money
- `POST /api/account/deposit` - Deposit money

### Transactions
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/{id}` - Get specific transaction

### User Profile
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change password

## 🛠️ Development

### Project Structure
```
sulabh-banking-app/
├── src/main/java/           # Spring Boot backend code
├── src/main/resources/      # Application properties & static files
├── temp-sulabh-frontend/    # React frontend source
├── target/                  # Maven build output
├── build.sh/.bat           # Build automation scripts
├── docker-compose.yml       # Local development setup
└── Dockerfile              # Production deployment
```

### Running Tests
```bash
# Backend tests
./mvnw test

# Frontend tests
cd temp-sulabh-frontend
npm test
```

### Code Quality
```bash
# Frontend linting
cd temp-sulabh-frontend
npm run lint

# Backend formatting (if configured)
./mvnw spotless:apply
```

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8080 |
| `DATABASE_URL` | PostgreSQL connection URL | jdbc:postgresql://localhost:5432/sulabh |
| `DB_USERNAME` | Database username | postgres |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRATION` | JWT expiration time (ms) | 86400000 |
| `CORS_ORIGINS` | Allowed CORS origins | * |

### Frontend Configuration
The frontend automatically connects to the backend API. For development with separate servers:
```env
# temp-sulabh-frontend/.env
VITE_API_URL=http://localhost:8081
```

## 🚀 Deployment Guide

### 1. Railway (Recommended)
1. Fork this repository
2. Connect to Railway
3. Add PostgreSQL service
4. Set environment variables
5. Deploy automatically

### 2. Heroku
```bash
# Install Heroku CLI and login
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set JWT_SECRET=your_secret
git push heroku main
```

### 3. AWS/GCP/Azure
- Use provided Dockerfile
- Set up managed database service
- Configure environment variables
- Deploy using container services

## 🔒 Security Features

- **JWT Authentication:** Secure token-based authentication
- **Password Hashing:** BCrypt encryption for user passwords
- **CORS Protection:** Configured for secure cross-origin requests
- **Input Validation:** Comprehensive request validation
- **SQL Injection Prevention:** JPA/Hibernate query protection
- **XSS Protection:** Content Security Policy headers

## 📊 Monitoring & Logging

- **Application Logs:** Structured logging with different levels
- **Health Checks:** Built-in health check endpoints
- **Error Tracking:** Comprehensive error handling and reporting
- **Performance Metrics:** Request/response time tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@sulabhbank.com
- Documentation: [Wiki/Docs link]

## 🔄 Version History

- **v1.0.0** - Initial release with core banking features
- **v1.1.0** - Enhanced security and UI improvements
- **v1.2.0** - Mobile responsive design and performance optimization

---

**Built with ❤️ for secure digital banking**
