# PostgreSQL Setup Guide for SULABH Application

## Prerequisites
This guide will help you set up PostgreSQL for the SULABH authentication system.

## Step 1: Install PostgreSQL

### For Windows:
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. During installation:
   - Choose a port (default: 5432)
   - Set a password for the `postgres` superuser (remember this!)
   - Choose default locale

### For macOS:
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

### For Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Step 2: Create Database and User

### Option 1: Using PostgreSQL Command Line
1. Open PostgreSQL command line (psql):
   ```bash
   # Windows (from Start Menu)
   SQL Shell (psql)
   
   # macOS/Linux
   sudo -u postgres psql
   ```

2. Run the setup script:
   ```sql
   \i path/to/database/setup-postgresql.sql
   ```

### Option 2: Manual Setup
1. Connect to PostgreSQL as superuser:
   ```bash
   psql -U postgres -h localhost
   ```

2. Run these commands:
   ```sql
   -- Create database
   CREATE DATABASE sulabh_db;
   
   -- Create user
   CREATE USER sulabh_user WITH PASSWORD 'sulabh_password';
   
   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE sulabh_db TO sulabh_user;
   
   -- Connect to the database
   \c sulabh_db;
   
   -- Grant schema privileges
   GRANT ALL ON SCHEMA public TO sulabh_user;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sulabh_user;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sulabh_user;
   
   -- Set default privileges
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO sulabh_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO sulabh_user;
   ```

## Step 3: Verify Database Connection

Test the connection using:
```bash
psql -U sulabh_user -d sulabh_db -h localhost
```

If successful, you should see:
```
sulabh_db=>
```

## Step 4: Alternative Database Credentials

If you prefer different credentials, update `application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/your_database_name
spring.datasource.username=your_username
spring.datasource.password=your_password
```

## Step 5: Start the Application

Once PostgreSQL is set up:
1. Start PostgreSQL service
2. Run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```

The application will automatically:
- Create necessary tables (users, accounts, transactions)
- Insert default users:
  - Admin: username=`admin`, email=`admin@sulabh.com`, password=`admin123`
  - Demo: username=`demo_user`, email=`user@sulabh.com`, password=`user123`

## Troubleshooting

### Connection Issues:
1. Ensure PostgreSQL service is running
2. Check if port 5432 is available
3. Verify credentials in `application.properties`
4. Check PostgreSQL configuration file (`postgresql.conf`) for connection settings

### Permission Issues:
```sql
-- Grant additional privileges if needed
GRANT USAGE ON SCHEMA public TO sulabh_user;
GRANT CREATE ON SCHEMA public TO sulabh_user;
```

### Reset Database:
```sql
-- Drop and recreate database if needed
DROP DATABASE IF EXISTS sulabh_db;
CREATE DATABASE sulabh_db;
GRANT ALL PRIVILEGES ON DATABASE sulabh_db TO sulabh_user;
```