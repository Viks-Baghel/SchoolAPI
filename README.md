# Educare School API

Educare is a small Express and TypeScript API for storing schools and listing them by distance from a user's location. It uses MySQL through `mysql2/promise`, validates incoming coordinates, and calculates distance with the Haversine formula.

## Tech Stack

- Node.js
- Express 5
- TypeScript
- MySQL
- `mysql2/promise`
- `dotenv`

## Project Structure

```text
.
+-- server.ts
+-- src
|   +-- config
|   |   +-- db.ts
|   +-- controllers
|   |   +-- schoolController.ts
|   +-- middlewares
|   |   +-- validate.ts
|   +-- routes
|   |   +-- schoolRoutes.ts
|   +-- utils
|       +-- distance.ts
+-- sql
|   +-- schema.sql
+-- .env.example
+-- package.json
+-- tsconfig.json
```

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Configure the environment variables:

```env
PORT=3000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=school_management
```

The application also reads `DB_PORT` in `src/config/db.ts`. Add it if your MySQL server does not use the default port:

```env
DB_PORT=3306
```

## Database Setup

Create the database:

```sql
CREATE DATABASE school_management;
USE school_management;
```

Create the `schools` table expected by the API:

```sql
CREATE TABLE schools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

The current implementation runs this insert:

```sql
INSERT INTO schools (name, address, latitude, longitude)
VALUES (?, ?, ?, ?);
```

The list endpoint reads all schools:

```sql
SELECT * FROM schools;
```

## Running the API

Start the development server:

```bash
npm run dev
```

Build TypeScript:

```bash
npm run build
```

Run the compiled server:

```bash
npm start
```

By default, the API runs on:

```text
http://localhost:3000
```

The server listens on `0.0.0.0`, so it can also accept connections from other devices on the same network when the host and firewall allow it.

## API Routes

Routes are mounted from `src/routes/schoolRoutes.ts` at the root path.

### Health Check

```http
GET /health
```

Returns a simple success response to confirm the server is running.

Successful response:

```json
{
  "success": true,
  "message": "Health Endpoint created successfully"
}
```

### Add School

```http
POST /addSchool
```

Adds a new school to the MySQL `schools` table.

Request body:

```json
{
  "name": "Delhi Public School",
  "address": "Mathura Road, New Delhi",
  "latitude": 28.5896,
  "longitude": 77.2507
}
```

Validation rules:

- `name` is required and must be a non-empty string.
- `address` is required and must be a non-empty string.
- `latitude` is required and must be a number from `-90` to `90`.
- `longitude` is required and must be a number from `-180` to `180`.

The validation middleware trims `name` and `address`, parses the coordinates as numbers, and stores the sanitized data in `res.locals.sanitised`.

Successful response:

```json
{
  "success": true,
  "message": "School added successfully.",
  "data": {
    "id": 1,
    "name": "Delhi Public School",
    "address": "Mathura Road, New Delhi",
    "latitude": 28.5896,
    "longitude": 77.2507
  }
}
```

Validation error response:

```json
{
  "success": false,
  "errors": [
    "name is required and must be a non-empty string.",
    "latitude must be a valid number between -90 and 90."
  ]
}
```

Example cURL:

```bash
curl -X POST http://localhost:3000/addSchool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Delhi Public School",
    "address": "Mathura Road, New Delhi",
    "latitude": 28.5896,
    "longitude": 77.2507
  }'
```

### List Schools

```http
GET /listSchools?latitude=28.6139&longitude=77.2090
```

Lists all schools sorted by distance from the user's latitude and longitude.

Query parameters:

- `latitude` is required and must be a number from `-90` to `90`.
- `longitude` is required and must be a number from `-180` to `180`.

The validation middleware parses the user coordinates as numbers and stores them in `res.locals.userCoords`.

Successful response:

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "name": "Delhi Public School",
      "address": "Mathura Road, New Delhi",
      "latitude": "28.58960000",
      "longitude": "77.25070000",
      "created_at": "2026-05-09T08:00:00.000Z",
      "distance_km": 4.89
    },
    {
      "id": 2,
      "name": "Another School",
      "address": "Gurugram, Haryana",
      "latitude": "28.45950000",
      "longitude": "77.02660000",
      "created_at": "2026-05-09T08:10:00.000Z",
      "distance_km": 24.75
    }
  ]
}
```

Validation error response:

```json
{
  "success": false,
  "errors": [
    "latitude query parameter is required.",
    "longitude query parameter is required."
  ]
}
```

Example cURL:

```bash
curl "http://localhost:3000/listSchools?latitude=28.6139&longitude=77.2090"
```

## Distance Calculation

`src/utils/distance.ts` implements the Haversine formula. It uses Earth's radius as `6371` kilometers and returns the distance between two latitude and longitude pairs.

`listSchools` adds a `distance_km` field to each school:

```ts
distance_km: parseFloat(
  haversineDistance(userLat, userLon, school.latitude, school.longitude).toFixed(2)
)
```

Results are sorted in ascending order, so the nearest school appears first.

## Error Handling

Validation errors return:

```http
400 Bad Request
```

Database or server failures return:

```http
500 Internal Server Error
```

Unknown routes return:

```http
404 Not Found
```

Response body:

```json
{
  "success": false,
  "message": "Route not found."
}
```

## Implementation Flow

### Adding a School

1. Client sends `POST /addSchool` with school details.
2. `validateAddSchool` checks required fields and coordinate ranges.
3. Sanitized data is attached to `res.locals.sanitised`.
4. `addSchool` inserts the school into MySQL.
5. API returns the inserted school data with the generated ID.

### Listing Schools

1. Client sends `GET /listSchools` with user coordinates in the query string.
2. `validateListSchools` checks coordinate presence and ranges.
3. Parsed user coordinates are attached to `res.locals.userCoords`.
4. `listSchools` fetches all schools from MySQL.
5. The controller calculates `distance_km` for every school.
6. Results are sorted from nearest to farthest.
7. API returns the sorted list and total count.

## Notes

- The MySQL pool is created in `src/config/db.ts` with `connectionLimit: 10`.
- SSL is enabled with `rejectUnauthorized: false`, which can be useful for hosted MySQL providers. For local MySQL, adjust this if your server does not accept SSL connections.
- The API currently fetches all schools before sorting. For a very large dataset, consider adding geospatial indexing or database-side bounding-box filtering before calculating exact distances.
