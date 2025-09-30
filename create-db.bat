@echo off
REM Create database if it doesn't exist
echo CREATE DATABASE sulabh; | "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -p 5433

