const express = require('express');
const { Kafka } = require('kafkajs');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3001; // Port for the backend service

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

const KAFKA_TOPIC = 'movie-search-topic';
const LOG_FILE_PATH = path.join(__dirname, 'search_queries.jsonl');

const kafka = new Kafka({
  clientId: 'kafka-backend-app',
  brokers: ['kafka:29092'] // Kafka broker running in Docker
});

const producer = kafka.producer();

// Connect to Kafka on startup
const connectKafkaProducer = async () => {
  try {
    await producer.connect();
    console.log('Kafka producer connected successfully');
  } catch (error) {
    console.error('Error connecting Kafka producer:', error);
    // Implement retry logic or graceful shutdown if connection fails
  }
};

connectKafkaProducer();

app.post('/send-message', async (req, res) => {
  const { searchFilters } = req.body;

  if (!searchFilters) {
    return res.status(400).send('Search filters are required');
  }

  try {
    await producer.send({
      topic: KAFKA_TOPIC,
      messages: [
        { value: JSON.stringify(searchFilters) }, // Stringify the entire filters object
      ],
    });

    const logEntry = { timestamp: new Date().toISOString(), searchFilters: searchFilters };
    fs.appendFileSync(LOG_FILE_PATH, JSON.stringify(logEntry) + '\n');

    console.log(`Search filters sent to Kafka and logged: ${JSON.stringify(searchFilters)}`);
    res.status(200).send('Search filters sent to Kafka and logged');
  } catch (error) {
    console.error('Error sending search filters to Kafka or logging:', error);
    res.status(500).send('Failed to send search filters to Kafka or log');
  }
});

// Disconnect producer on shutdown
process.on('SIGTERM', async () => {
  console.log('Disconnecting Kafka producer...');
  await producer.disconnect();
  console.log('Kafka producer disconnected.');
});

app.listen(port, () => {
  console.log(`Kafka backend listening at http://localhost:${port}`);
}); 