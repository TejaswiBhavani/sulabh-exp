-- PostgreSQL setup script for SULABH application
-- Run this script to create the database and user

-- Create database
CREATE DATABASE sulabh_db;

-- Create user
CREATE USER sulabh_user WITH PASSWORD 'sulabh_password';

-- Grant all privileges on database to user
GRANT ALL PRIVILEGES ON DATABASE sulabh_db TO sulabh_user;

-- Connect to the database to grant schema privileges
\c sulabh_db;

-- Grant privileges on schema
GRANT ALL ON SCHEMA public TO sulabh_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sulabh_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sulabh_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO sulabh_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO sulabh_user;