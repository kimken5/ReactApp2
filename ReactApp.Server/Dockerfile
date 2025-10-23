# Multi-stage build for optimized production container
# Stage 1: Build environment
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r kindergarten && useradd -r -g kindergarten kindergarten

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Install Node.js 20.x for frontend build
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Copy project files
COPY ["ReactApp.Server/ReactApp.Server.csproj", "ReactApp.Server/"]
COPY ["reactapp.client/reactapp.client.esproj", "reactapp.client/"]

# Restore dependencies
RUN dotnet restore "ReactApp.Server/ReactApp.Server.csproj"

# Copy source code
COPY . .

# Build frontend
WORKDIR "/src/reactapp.client"
RUN npm ci --only=production
RUN npm run build

# Build backend
WORKDIR "/src/ReactApp.Server"
RUN dotnet build "ReactApp.Server.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "ReactApp.Server.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM base AS final
WORKDIR /app

# Copy published application
COPY --from=publish /app/publish .
COPY --from=build /src/reactapp.client/dist ./wwwroot

# Create required directories
RUN mkdir -p /app/logs /app/temp \
    && chown -R kindergarten:kindergarten /app

# Set up environment variables for production
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:80
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false
ENV TZ=Asia/Tokyo

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Switch to non-root user
USER kindergarten

# Set resource limits (will be overridden by orchestrator)
ENV DOTNET_GCHeapHardLimit=1073741824

ENTRYPOINT ["dotnet", "ReactApp.Server.dll"]