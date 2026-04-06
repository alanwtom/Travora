const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(express.json());

// Route to fetch flight prices
app.get('/api/flights', async (req, res) => {
  try {
    const { origin, destination, date, cursor } = req.query;

    // Validate required parameters
    if (!origin || !destination || !date) {
      return res.status(400).json({
        error: 'Missing required parameters: origin, destination, date'
      });
    }

    // Validate IATA codes (simple check: 3 letters)
    if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
      return res.status(400).json({
        error: 'Invalid IATA codes. Must be 3 uppercase letters.'
      });
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD.'
      });
    }

    // Get API key from environment
    const apiKey = process.env.AVIATIONSTACK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'API key not configured'
      });
    }

    // Build AviationStack API URL
    // Note: AviationStack provides flight data, not direct pricing.
    // We'll fetch flight information and include any available price data.
    let apiUrl = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&dep_iata=${origin}&arr_iata=${destination}&flight_date=${date}`;

    if (cursor) {
      apiUrl += `&offset=${cursor}`;
    }

    // Make request to AviationStack API
    const response = await axios.get(apiUrl);

    if (response.data.error) {
      return res.status(400).json({
        error: response.data.error.message || 'AviationStack API error'
      });
    }

    // Transform the data to match the required format
    const flights = response.data.data.map(flight => ({
      flight_number: flight.flight.iata || flight.flight.icao,
      airline: flight.airline.name,
      departure_time: flight.departure.scheduled,
      arrival_time: flight.arrival.scheduled,
      price: flight.price || null, // AviationStack may not provide pricing
      currency: flight.currency || 'USD' // Default if not provided
    }));

    // Pagination metadata
    const pagination = {
      limit: response.data.pagination.limit,
      offset: response.data.pagination.offset,
      count: response.data.pagination.count,
      total: response.data.pagination.total,
      next_cursor: response.data.pagination.offset + response.data.pagination.limit < response.data.pagination.total
        ? response.data.pagination.offset + response.data.pagination.limit
        : null
    };

    res.json({
      flights,
      pagination
    });

  } catch (error) {
    console.error('Error fetching flight data:', error);

    if (error.response) {
      // API error
      if (error.response.status === 401) {
        return res.status(401).json({
          error: 'Invalid API key'
        });
      } else if (error.response.status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded'
        });
      } else {
        return res.status(error.response.status).json({
          error: error.response.data?.error?.message || 'AviationStack API error'
        });
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Unable to connect to AviationStack API'
      });
    } else {
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Flight Price API server running on port ${PORT}`);
});

module.exports = app;