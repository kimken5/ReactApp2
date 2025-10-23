# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

This is a fullstack React + ASP.NET Core application with two main components:

- **ReactApp.Server** (.NET 8 ASP.NET Core Web API): Backend API server with Swagger integration
- **reactapp.client** (React + TypeScript + Vite): Frontend client application

The server proxies React development requests and serves the built React app in production via SPA proxy configuration.

## Development Commands

### Frontend (reactapp.client/)
```bash
npm run dev          # Start Vite dev server (https://localhost:5173)
npm run build        # Build for production (TypeScript compile + Vite build)
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend (ReactApp.Server/)
```bash
dotnet run           # Start ASP.NET Core server
dotnet build         # Build the project
dotnet test          # Run tests (if any exist)
```

### Full Application
Use Visual Studio to run the entire solution, or start both servers separately:
1. Start the React dev server: `cd reactapp.client && npm run dev`
2. Start the .NET server: `cd ReactApp.Server && dotnet run`

## Key Configuration

- **HTTPS Development Certificates**: Vite config automatically generates .NET dev certificates for HTTPS
- **Proxy Setup**: Vite proxies `/weatherforecast` requests to the ASP.NET Core server
- **SPA Integration**: ASP.NET Core serves React app via SpaProxy in development and static files in production

## Project Structure

- Frontend uses modern React 19.1 with TypeScript, Vite, and ESLint
- Backend uses minimal API pattern with controllers and Swagger documentation
- Example weather forecast endpoint demonstrates full-stack data flow from controller to React component