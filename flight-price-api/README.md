# Flight Price API

A REST API built with Node.js and Express that fetches flight information using the AviationStack API.

## Features

- Fetch flight data with pricing information (when available)
- Pagination support with cursor-based navigation
- Comprehensive error handling
- Environment variable configuration

## Setup

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Get an API key from [AviationStack](https://aviationstack.com/) and add it to your `.env` file:
   ```
   AVIATIONSTACK_API_KEY=your_actual_api_key
   ```

5. Start the server:
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:3000` by default.

## API Endpoint

### GET /api/flights

Fetch flight information between two airports on a specific date.

#### Query Parameters

- `origin` (required): IATA code of departure airport (e.g., JFK)
- `destination` (required): IATA code of arrival airport (e.g., LAX)
- `date` (required): Flight date in YYYY-MM-DD format
- `cursor` (optional): Offset for pagination (number)

#### Example Request

```bash
curl "http://localhost:3000/api/flights?origin=JFK&destination=LAX&date=2024-12-25"
```

#### Response Format

```json
{
  "flights": [
    {
      "flight_number": "AA100",
      "airline": "American Airlines",
      "departure_time": "2024-12-25T10:00:00+00:00",
      "arrival_time": "2024-12-25T13:30:00+00:00",
      "price": 299.99,
      "currency": "USD"
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "count": 1,
    "total": 1,
    "next_cursor": null
  }
}
```

## Error Handling

The API handles various error scenarios:

- **400 Bad Request**: Missing or invalid parameters
- **401 Unauthorized**: Invalid API key
- **429 Too Many Requests**: Rate limit exceeded
- **503 Service Unavailable**: Unable to connect to AviationStack API
- **500 Internal Server Error**: Unexpected server errors

## Notes

- AviationStack primarily provides flight tracking data. Pricing information may not always be available in the API response.
- The API uses cursor-based pagination as provided by AviationStack.
- All times are in UTC (ISO 8601 format).

## Health Check

GET /health - Returns server status