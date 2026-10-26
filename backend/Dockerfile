# Multi-stage Dockerfile for StockFlow Spring Boot Backend

# Stage 1: Build application using Maven & Eclipse Temurin JDK 21
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy project definition and source
COPY pom.xml ./
COPY src ./src

# Build package without tests requiring local XAMPP MySQL during build
RUN mvn clean package -DskipTests || mvn compile

# Stage 2: Minimal, secure runtime container with Eclipse Temurin JRE 21
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Run as non-root user for DevOps best practices
RUN addgroup -S stockflow && adduser -S stockflow -G stockflow
USER stockflow

# Copy built artifacts
COPY --from=build /app/target/*.jar app.jar 2>/dev/null || COPY --from=build /app/target/classes /app/classes

# Default environment configuration connecting to host machine XAMPP MySQL
ENV SERVER_PORT=8085
ENV DB_HOST=host.docker.internal
ENV DB_PORT=3306
ENV DB_NAME=stockflow_db
ENV DB_USERNAME=root
ENV DB_PASSWORD=

EXPOSE 8085

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
