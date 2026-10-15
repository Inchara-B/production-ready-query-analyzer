# Production-Ready Query Analyzer

A full-stack application built with **Java, Spring Boot, Spring Data JPA, React, and Vite** to demonstrate database query analysis and optimization, including the N+1 query problem.

## Overview

Database inefficiencies can cause applications to execute unnecessary SQL queries, increasing database load and response time. This project demonstrates how inefficient data fetching can be compared with an optimized approach using JPA fetch joins.

## Tech Stack

**Backend**
- Java 17
- Spring Boot
- Maven

**Frontend**
- React
- JavaScript
- Vite
- HTML and CSS

## Key Features

- **N+1 Query Demonstration:** Shows how lazy loading can lead to repeated database queries when accessing related entities.
- **Optimized Data Fetching:** Demonstrates `LEFT JOIN FETCH` to retrieve users and their related orders more efficiently.
- **Performance Comparison:** Provides a comparison of average execution times across multiple runs.
- **REST API Integration:** Connects the React frontend to the Spring Boot backend.
- **Interactive Dashboard:** Presents query analysis and performance comparison results.

## Architecture

The application follows a frontend–backend architecture:

1. **React frontend:** Displays query analysis and performance information.
2. **Spring Boot backend:** Exposes REST endpoints and processes application requests.
3. **Spring Data JPA and Hibernate:** Handle database access and entity relationships.
4. **H2 database:** Stores the application data.

## How to Run

### Prerequisites

- Java 17
- Node.js and npm
- Git

### 1. Start the backend

Navigate to the Spring Boot example application directory:

```bash
cd query-analyzer-examples/example-basic
```

Run the application using the Maven wrapper from that directory:

```bash
../../mvnw.cmd spring-boot:run
```

The backend runs at:

`http://localhost:8081`

### 2. Start the frontend

Open another terminal and navigate to the frontend directory:

```bash
cd query-analyzer-frontend
npm install
npm run dev
```

Open the local URL printed by Vite, typically:

`http://localhost:5173`

### 3. Explore the application

Use the dashboard to inspect the available query-analysis examples and compare the lazy-loading and optimized-fetching approaches.

## Learning Outcomes

- Understanding the N+1 query problem
- Working with Spring Boot REST APIs
- Managing entity relationships using Spring Data JPA
- Optimizing data retrieval with JPQL fetch joins
- Integrating a React frontend with a Java backend
- Comparing execution timings and interpreting performance measurements
