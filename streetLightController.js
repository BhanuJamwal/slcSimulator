const mqtt = require('mqtt');

// Replace with your MQTT broker URL, e.g., 'mqtt://broker.hivemq.com'
const brokerUrl = 'mqtts://dmp-tata.orbiwise.com:8883';

// Define the base topic for street light controllers
const topicBase = 'streetlight/controller';

// Define the number of street light controllers (SLC devices)
const Devices = [{"deviceId":"SLCILM0001","username":"3UUBsUUZa7DgVbheMX8jrDAB0","password":"Dyfs5rI3gMYWyDt76SKKmqOqLqOD"},{"deviceId":"SLCILM0002","username":"3UUBsUUZa7DgVbheMX8jrDAB0","password":"Dyfs5rI3gMYWyDt76SKKmqOqLqOD"},{"deviceId":"SLCILM0003","username":"3UUBsUUZa7DgVbheMX8jrDAB0","password":"Dyfs5rI3gMYWyDt76SKKmqOqLqOD"},{"deviceId":"SLCILM0004","username":"3UUBsUUZa7DgVbheMX8jrDAB0","password":"Dyfs5rI3gMYWyDt76SKKmqOqLqOD"},{"deviceId":"SLCILM0005","username":"3UUBsUUZa7DgVbheMX8jrDAB0","password":"Dyfs5rI3gMYWyDt76SKKmqOqLqOD"}];
//const Devices = [{"deviceId":"SLCILM0001","username":"3UUBsUUZa7DgVbheMX8jrDAB0","password":"Dyfs5rI3gMYWyDt76SKKmqOqLqOD"}];

// Array to store each SLC device
const slcDevices = [];

// Function to initialize each SLC device as an MQTT client
function initializeDevice(device) {
  const client = mqtt.connect(brokerUrl,{username:device.username,password:device.password});
  const controlTopic = `${topicBase}/device${device.deviceId}/control`;  // Topic for receiving commands
  const statusTopic = `${topicBase}/device${device.deviceId}/status`;   // Topic for sending status updates

  // Each SLC device has its own status and brightness
  const slcDevice = {
    id: device.deviceId,
    status: 'OFF',
    brightness: 0,
    client,
  };

  client.on('connect', () => {
    console.log(`Device ${device.deviceId} connected to MQTT broker`);

    // Subscribe to its control topic to listen for commands
    client.subscribe(controlTopic, (err) => {
      if (err) {
        console.error(`Failed to subscribe for Device ${device.deviceId}:`, err);
      } else {
        console.log(`Device ${device.deviceId} subscribed to topic: ${controlTopic}`);
      }
    });

    // Periodically send status updates every 15 minutes
    setInterval(() => {
      sendStatusUpdate(slcDevice, statusTopic);
    }, 15 * 60 * 1000); // 15 minutes interval
  });

  // Handle incoming commands
  client.on('message', (topic, message) => {
    if (topic === controlTopic) {
      const payload = JSON.parse(message.toString());
      if(payload.command == "tick"){
        console.log("tick event!")
      }else{
        handleCommand(slcDevice, payload);

      }
    }
  });

  slcDevices.push(slcDevice);
}

// Function to send a status update for each device
function sendStatusUpdate(device, topic) {
  const statusMessage = JSON.stringify({ 
    id: device.id, 
    status: device.status, 
    brightness: device.brightness 
  });

  // Publish status update to the broker
  device.client.publish(topic, statusMessage);
  console.log(`Device ${device.id} published status: ${statusMessage}`);
}

// Function to handle incoming control commands
function handleCommand(device, payload) {
  const { command, value } = payload;

  switch (command) {
    case 'ON':
      device.status = 'ON';
      device.brightness = value || 100;
      break;
    case 'OFF':
      device.status = 'OFF';
      device.brightness = 0;
      break;
    case 'DIM':
      device.status = 'ON';
      device.brightness = value;
      break;
    default:
      console.log(`Unknown command received for Device ${device.id}`);
  }

  console.log(`Device ${device.id} updated: ${JSON.stringify(device)}`);
}

// Initialize the 5 SLC devices
for (let i = 0; i < Devices.length; i++) {
  initializeDevice(Devices[i]);
}

// Import the http module
const http = require('http');

// Define the port to listen on
const PORT = 3000;

// Create a server that listens to incoming requests
const server = http.createServer((req, res) => {
  // Set the response header
  res.writeHead(200, { 'Content-Type': 'text/plain' });

  // Respond with a message based on the request method and URL
  if (req.method === 'GET' && req.url === '/') {
    console.log("someone hit the server!")
    res.end('Welcome to the Home Page!');
  } else if (req.method === 'GET' && req.url === '/about') {
    res.end('This is the About Page!');
  } else {
    res.end('Page Not Found');
  }
});

// Open the server on the defined port
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Port = 10
// Packet = Device Status Change Message
// Regular Message Counter = 22296
// AC Mains Status = true
// Load On Off Status = false
// Dimming Value = 0
// Lux Sensor Value = 0
// CT Current Value = 255
// Device Mode = 2
// Device Dimming Profile = 0
// Device Calendar Profile = 1
// Device Mode Description = Schedule Mode
// Device Dimming Profile Description = No Dimming Applied
// Device Calendar Profile Description = User Calendar 1
// Controller Running Hour Counter = 4913
// Controller Running Hour Minutes = 12
// Load Burn Hour Counter = 1705
// Load Burn Hour Minutes = 39
// Load ON Event Counter = 257
// Load OFF Event Counter = 299
// Alarm Message Counter = 1178
// Device SW Reset Counter = 516
// Metering Energy kWH Counter = 25.25
// Burning Hours = 1705.65
// Voltage Value = 229.33
// Current Value = 0
// Active Power Value = 0.00
// Reactive Power Value = 0
// Frequency = 50
// Power Factor Value = 0
// Active Energy Value = 25.25
// Apparent Power Value = 0
// Apparent Energy Value = 0.00
// Reactive Energy Value = 0.00
// RSSI = 0
// SNR = 0
// Time Date = 17:42:49 13-09-2024
// Battery Percentage = 2
// Battery Value = 2
// timestamp = 2024-09-13T12:17:47.735Z
// deveui = 3cc1f605000601c1
