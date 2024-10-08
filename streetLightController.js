const mqtt = require('mqtt');

// Replace with your MQTT broker URL, e.g., 'mqtt://broker.hivemq.com'
const brokerUrl = 'mqtts://dmp-tata.orbiwise.com:8883';

// Define the base topic for street light controllers
const topicBase = 'streetlight/controller';

// Define the number of street light controllers (SLC devices)
const Devices = [{"deviceId":"SLCILM0001","username":"3UUBsUUZa7DgVbheMX8jrDAB0","password":"Dyfs5rI3gMYWyDt76SKKmqOqLqOD"},{"deviceId":"SLCILM0002","username":"3UUBsUUZa7DgVbheMX8jrDAB0","password":"Dyfs5rI3gMYWyDt76SKKmqOqLqOD"},{"deviceId":"SLCILM0003","username":"3UUBsUUZa7DgVbheMX8jrDAB0","password":"Dyfs5rI3gMYWyDt76SKKmqOqLqOD"},{"deviceId":"SLCILM0004","username":"3UUBsUUZa7DgVbheMX8jrDAB0","password":"Dyfs5rI3gMYWyDt76SKKmqOqLqOD"},{"deviceId":"SLCILM0005","username":"3UUBsUUZa7DgVbheMX8jrDAB0","password":"Dyfs5rI3gMYWyDt76SKKmqOqLqOD"}];
//const Devices = [{"deviceId":"SLCILM0003","username":"3UUBsUUZa7DgVbheMX8jrDAB0","password":"Dyfs5rI3gMYWyDt76SKKmqOqLqOD"}];

const https = require('https');

const getData = () => {
  const url = 'https://slcsimulator.onrender.com/';

  https.get(url, (response) => {
    let data = '';

    // A chunk of data has been received.
    response.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received.
    response.on('end', () => {
      console.log(data); // Handle the response data
    });

  }).on('error', (error) => {
    console.error('Error calling the API:', error);
  });
};

setInterval(() => {
  getData()
}, 10 * 60 * 1000);

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
    //num: device.number,
    // brightness: 0,
    client
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
    const intervalId = setInterval(() => {
      sendStatusUpdate(slcDevice, statusTopic);
    }, data[device.deviceId]["interval"] * 60 * 1000); // 15 minutes interval
    //data[device.deviceId]["intervalId"] = intervalId
    intervals[device.deviceId] = intervalId
  });
  client.on('error',(error)=>{console.log(error,"error!",device)})
  // Handle incoming commands
  client.on('message', (topic, message) => {
    if (topic === controlTopic) {
      const payload = JSON.parse(message.toString());
      console.log(payload,"payload")
      handleCommand(slcDevice, payload,statusTopic);
    }
  });

  slcDevices.push(slcDevice);
}

// Function to send a status update for each device
function sendStatusUpdate(device, topic) {
  data[device.id]["Voltage Value"] = parseFloat(getRandomVoltage())
  if(data[device.id]["Load On Off Status"]){
    //data[device.id]["Current Value"] = parseFloat(getRandomFloat(currentData[device.id]["min"],currentData[device.id]["max"]))
    data[device.id]["Current Value"] = parseFloat(getRandomCurrent())
    data[device.id]["Power Factor Value"] = parseFloat(getRandomPowerFactor())
    data[device.id]["Active Power Value"] = parseFloat(calculateRealPower(data[device.id]["Voltage Value"],data[device.id]["Current Value"],data[device.id]["Power Factor Value"]))
    data[device.id]["Apparent Power Value"] = parseFloat(calculateApparentPower(data[device.id]["Voltage Value"], data[device.id]["Current Value"]))
  }else{
    data[device.id]["Current Value"] = 0
    data[device.id]["Power Factor Value"] = 0
    data[device.id]["Active Power Value"] = 0
    data[device.id]["Apparent Power Value"] = 0
  }
  const statusMessage = JSON.stringify({ 
    deveui: device.id, 
    //status: device.status, 
    //brightness: device.brightness,
    ...data[device.id]
  });

  // Publish status update to the broker
  device.client.publish(topic, statusMessage);
  console.log(`Device ${device.id} published status: ${statusMessage}`);
}

// Function to handle incoming control commands
function handleCommand(device, payload, topic) {
  console.log(payload,"here is the pay.oad")
  const { command, value } = payload;
  data[device.id]["Voltage Value"] = parseFloat(getRandomVoltage())
  switch (command) {
    case 'ON':
      data[device.id]["Load On Off Status"] = true
      //device.status = 'ON';
      data[device.id]["Dimming Value"] = value || 100;
      //data[device.id]["Current Value"] = parseFloat(getRandomFloat(currentData[device.id]["min"],currentData[device.id]["max"]))
      data[device.id]["Current Value"] = parseFloat(getRandomCurrent())
      data[device.id]["Power Factor Value"] = parseFloat(getRandomPowerFactor())
      data[device.id]["Active Power Value"] = parseFloat(calculateRealPower(data[device.id]["Voltage Value"],data[device.id]["Current Value"],data[device.id]["Power Factor Value"]))
      data[device.id]["Apparent Power Value"] = parseFloat(calculateApparentPower(data[device.id]["Voltage Value"], data[device.id]["Current Value"]))
      break;
    case 'OFF':
      data[device.id]["Load On Off Status"] = false;
      data[device.id]["Dimming Value"] = 0;
      data[device.id]["Current Value"] = 0
      data[device.id]["Power Factor Value"] = 0
      data[device.id]["Active Power Value"] = 0
      data[device.id]["Apparent Power Value"] = 0
      break;
    case 'DIM':
      data[device.id]["Load On Off Status"] = 'ON';
      data[device.id]["Dimming Value"] = value;
      break;
    case 'INTERVAL':
      data[device.id]["interval"] = value
      if(intervals[device.id]){
        clearInterval(intervals[device.id])
      }
      const intervalId = setInterval(() => {
        sendStatusUpdate(device, topic);
      }, data[device.id]["interval"] * 60 * 1000); // 15 minutes interval
      intervals[device.id] = intervalId
      break;
    default:
      console.log(`Unknown command received for Device ${device.id}`);
  }
  
  let status = { 
    deveui: device.id,
    //packetType : "service", 
    //status: device.status, 
    //brightness: device.brightness,
    ...data[device.id]
  }
  status['packetType'] = "service"
  //status['Voltage Value'] = getRandomVoltage()
  console.log(status,"status")
  let statusMessage = JSON.stringify(status);
  //statusMessage['packetType'] = "service" 
  console.log(topic,statusMessage,"pppppp")
  device.client.publish(topic,statusMessage)
  console.log(`Device ${device.id} updated`);
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


const data = {
  "SLCILM0001": {
    "Port":10,
    "packetType": "normal",
    "Packet":"Device Status Change Message",
    "AC Mains Status":true,
    "Load On Off Status" : false,
    "Dimming Value": 0,
    "Lux Sensor Value" : 0,
    "CT Current Value" : 255,
    //"Device Mode" : 2,
    //"Device Dimming Profile" : 0,
    //"Device Calendar Profile" : 1,
    //"Device Mode Description" : "Schedule Mode",
    //"Device Dimming Profile Description" : "No Dimming Applied",
    //"Device Calendar Profile Description" : "User Calendar 1",
    // Controller Running Hour Counter : 4913
    // Controller Running Hour Minutes = 12
    // Load Burn Hour Counter = 1705
    // Load Burn Hour Minutes = 39
    // Load ON Event Counter = 257
    // Load OFF Event Counter = 299
    // Alarm Message Counter = 1178
    // Device SW Reset Counter = 516
    "Metering Energy kWH Counter" : 25.25,
    "Burning Hours" : 1705.65,
    "Voltage Value" : 229.33,
    "Current Value" : 0,
    "Active Power Value" : 0.00,
    "Reactive Power Value" : 0,
    "Frequency" : 50,
    "Power Factor Value": 0,
    "Active Energy Value" : 25.25,
    "Apparent Power Value" : 0,
    "Apparent Energy Value" : 0.00,
    "Reactive Energy Value" : 0.00,
    // RSSI = 0
    // SNR = 0
    "Time Date" : "17:42:49 13-09-2024",
    "Battery Percentage" : 2,
    "Battery Value" : 2,
    "timestamp" : "2024-09-13T12:17:47.735Z",
    //"deveui" : "3cc1f605000601c1"
    "interval":15
    },
  "SLCILM0002":{
    "Port":10,
    "packetType": "normal",
    "Packet":"Device Status Change Message",
    "AC Mains Status":true,
    "Load On Off Status" : false,
    "Dimming Value": 0,
    "Lux Sensor Value" : 0,
    "CT Current Value" : 255,
    //"Device Mode" : 2,
    //"Device Dimming Profile" : 0,
    //"Device Calendar Profile" : 1,
    //"Device Mode Description" : "Schedule Mode",
    //"Device Dimming Profile Description" : "No Dimming Applied",
    //"Device Calendar Profile Description" : "User Calendar 1",
    // Controller Running Hour Counter : 4913
    // Controller Running Hour Minutes = 12
    // Load Burn Hour Counter = 1705
    // Load Burn Hour Minutes = 39
    // Load ON Event Counter = 257
    // Load OFF Event Counter = 299
    // Alarm Message Counter = 1178
    // Device SW Reset Counter = 516
    "Metering Energy kWH Counter" : 25.25,
    "Burning Hours" : 1705.65,
    "Voltage Value" : 229.33,
    "Current Value" : 0,
    "Active Power Value" : 0.00,
    "Reactive Power Value" : 0,
    "Frequency" : 50,
    "Power Factor Value": 0,
    "Active Energy Value" : 25.25,
    "Apparent Power Value" : 0,
    "Apparent Energy Value" : 0.00,
    "Reactive Energy Value" : 0.00,
    // RSSI = 0
    // SNR = 0
    "Time Date" : "17:42:49 13-09-2024",
    "Battery Percentage" : 2,
    "Battery Value" : 2,
    "timestamp" : "2024-09-13T12:17:47.735Z",
    "interval":15
    //"deveui" : "3cc1f605000601c1"
    },
  "SLCILM0003": {
    "Port":10,
    "packetType": "normal",
    "Packet":"Device Status Change Message",
    "AC Mains Status":true,
    "Load On Off Status" : true,
    "Dimming Value": 100,
    "Lux Sensor Value" : 0,
    "CT Current Value" : 255,
    //"Device Mode" : 2,
    //"Device Dimming Profile" : 0,
    //"Device Calendar Profile" : 1,
    //"Device Mode Description" : "Schedule Mode",
    //"Device Dimming Profile Description" : "No Dimming Applied",
    //"Device Calendar Profile Description" : "User Calendar 1",
    // Controller Running Hour Counter : 4913
    // Controller Running Hour Minutes = 12
    // Load Burn Hour Counter = 1705
    // Load Burn Hour Minutes = 39
    // Load ON Event Counter = 257
    // Load OFF Event Counter = 299
    // Alarm Message Counter = 1178
    // Device SW Reset Counter = 516
    "Metering Energy kWH Counter" : 25.25,
    "Burning Hours" : 1705.65,
    "Voltage Value" : 229.11,
    "Current Value" : 0,
    "Active Power Value" : 0.00,
    "Reactive Power Value" : 0,
    "Frequency" : 50,
    "Power Factor Value": 0,
    "Active Energy Value" : 25.25,
    "Apparent Power Value" : 0,
    "Apparent Energy Value" : 0.00,
    "Reactive Energy Value" : 0.00,
    // RSSI = 0
    // SNR = 0
    "Time Date" : "17:42:49 13-09-2024",
    "Battery Percentage" : 2,
    "Battery Value" : 2,
    "timestamp" : "2024-09-13T12:17:47.735Z",
    "interval": 15
    //"deveui" : "3cc1f605000601c1"
    },
  "SLCILM0004" : {
    "Port":10,
    "packetType": "normal",
    "Packet":"Device Status Change Message",
    "AC Mains Status":true,
    "Load On Off Status" : false,
    "Dimming Value": 0,
    "Lux Sensor Value" : 0,
    "CT Current Value" : 255,
    //"Device Mode" : 2,
    //"Device Dimming Profile" : 0,
    //"Device Calendar Profile" : 1,
    //"Device Mode Description" : "Schedule Mode",
    //"Device Dimming Profile Description" : "No Dimming Applied",
    //"Device Calendar Profile Description" : "User Calendar 1",
    // Controller Running Hour Counter : 4913
    // Controller Running Hour Minutes = 12
    // Load Burn Hour Counter = 1705
    // Load Burn Hour Minutes = 39
    // Load ON Event Counter = 257
    // Load OFF Event Counter = 299
    // Alarm Message Counter = 1178
    // Device SW Reset Counter = 516
    "Metering Energy kWH Counter" : 25.25,
    "Burning Hours" : 1705.65,
    "Voltage Value" : 229.33,
    "Current Value" : 0,
    "Active Power Value" : 0.00,
    "Reactive Power Value" : 0,
    "Frequency" : 50,
    "Power Factor Value": 0,
    "Active Energy Value" : 25.25,
    "Apparent Power Value" : 0,
    "Apparent Energy Value" : 0.00,
    "Reactive Energy Value" : 0.00,
    // RSSI = 0
    // SNR = 0
    "Time Date" : "17:42:49 13-09-2024",
    "Battery Percentage" : 2,
    "Battery Value" : 2,
    "timestamp" : "2024-09-13T12:17:47.735Z",
    "interval":15
    //"deveui" : "3cc1f605000601c1"
    },
  "SLCILM0005" :{
    "Port":10,
    "packetType": "normal",
    "Packet":"Device Status Change Message",
    "AC Mains Status":true,
    "Load On Off Status" : false,
    "Dimming Value": 0,
    "Lux Sensor Value" : 0,
    "CT Current Value" : 255,
    //"Device Mode" : 2,
    //"Device Dimming Profile" : 0,
    //"Device Calendar Profile" : 1,
    //"Device Mode Description" : "Schedule Mode",
    //"Device Dimming Profile Description" : "No Dimming Applied",
    //"Device Calendar Profile Description" : "User Calendar 1",
    // Controller Running Hour Counter : 4913
    // Controller Running Hour Minutes = 12
    // Load Burn Hour Counter = 1705
    // Load Burn Hour Minutes = 39
    // Load ON Event Counter = 257
    // Load OFF Event Counter = 299
    // Alarm Message Counter = 1178
    // Device SW Reset Counter = 516
    "Metering Energy kWH Counter" : 25.25,
    "Burning Hours" : 1705.65,
    "Voltage Value" : 229.33,
    "Current Value" : 0,
    "Active Power Value" : 0.00,
    "Reactive Power Value" : 0,
    "Frequency" : 50,
    "Power Factor Value": 0,
    "Active Energy Value" : 25.25,
    "Apparent Power Value" : 0,
    "Apparent Energy Value" : 0.00,
    "Reactive Energy Value" : 0.00,
    // RSSI = 0
    // SNR = 0
    "Time Date" : "17:42:49 13-09-2024",
    "Battery Percentage" : 2,
    "Battery Value" : 2,
    "timestamp" : "2024-09-13T12:17:47.735Z",
    //"deveui" : "3cc1f605000601c1"
    "interval":15
    }
}


//const currentData = {"SLCILM0001":{"min":0.5,"max":2},"SLCILM0002":{"min":0.5,"max":2},"SLCILM0003":{"min":2,"max":10},"SLCILM0004":{"min":2,"max":10},"SLCILM0005":{"min":5,"max":20}}
//const currentData = {"SLCILM0001":{"min":0.5,"max":2},"SLCILM0002":{"min":0.5,"max":2},"SLCILM0003":{"min":0.5,"max":2},"SLCILM0004":{"min":0.5,"max":2},"SLCILM0005":{"min":0.5,"max":2}}


function getRandomFloat(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}
const MIN_CURRENT = 0.5;  // Minimum safe current in Amperes
const MAX_CURRENT = 2.0;  // Maximum safe current in Amperes

// Function to generate random current, occasionally going below or above thresholds
function getRandomCurrent() {
    const randomFactor = Math.random();
    let current;

    // 10% chance of going beyond limits (either above or below)
    if (randomFactor < 0.05) {  // 5% chance to be below MIN_CURRENT
        current = MIN_CURRENT - Math.random() * 0.5; // Up to 0.5A below MIN_CURRENT
    } else if (randomFactor > 0.95) {  // 5% chance to be above MAX_CURRENT
        current = MAX_CURRENT + Math.random() * 0.5; // Up to 0.5A above MAX_CURRENT
    } else {  // Normal range 90% of the time
        current = Math.random() * (MAX_CURRENT - MIN_CURRENT) + MIN_CURRENT; // Normal range
    }

    return current.toFixed(2); // Return a float with 2 decimal places
}

// Voltage threshold limits
const MIN_VOLTAGE = 220;  // Minimum safe voltage
const MAX_VOLTAGE = 240;  // Maximum safe voltage

// Function to generate random voltage, occasionally going below or above thresholds
function getRandomVoltage() {
    const randomFactor = Math.random();
    let voltage;

    // 10% chance of going beyond limits (either above or below)
    if (randomFactor < 0.05) {
        voltage = MIN_VOLTAGE - Math.random() * 10; // Below threshold
    } else if (randomFactor > 0.95) {
        voltage = MAX_VOLTAGE + Math.random() * 10; // Above threshold
    } else {
        voltage = Math.random() * (MAX_VOLTAGE - MIN_VOLTAGE) + MIN_VOLTAGE; // Normal range
    }

    return voltage.toFixed(2); // Return a float with 2 decimal places
}

// function getRandomPowerFactor() {
//   const MIN_POWER_FACTOR = 0.7; // Minimum power factor
//   const MAX_POWER_FACTOR = 1.0; // Maximum power factor (pure resistive load)
//   return (Math.random() * (MAX_POWER_FACTOR - MIN_POWER_FACTOR) + MIN_POWER_FACTOR).toFixed(2);
// }
const MIN_POWER_FACTOR = 0.85;  // Minimum normal power factor
const MAX_POWER_FACTOR = 1.0;   // Maximum power factor (unity)
const THRESHOLD = 0.75;         // Threshold for power factor dip

// Function to generate random power factor, occasionally going below threshold
function getRandomPowerFactor() {
    const randomFactor = Math.random();
    let powerFactor;

    // 2% chance of going below the threshold
    if (randomFactor < 0.02) {  
        powerFactor = Math.random() * (MIN_POWER_FACTOR - THRESHOLD) + THRESHOLD; // Below normal range
    } else {
        powerFactor = Math.random() * (MAX_POWER_FACTOR - MIN_POWER_FACTOR) + MIN_POWER_FACTOR; // Normal range
    }

    return powerFactor.toFixed(2); // Return a float with 2 decimal places
}
// Function to calculate apparent power (S = V * I)
function calculateApparentPower(voltage, current) {
  return (voltage * current).toFixed(2);
}

// Function to calculate real power (P = V * I * cos(phi))
function calculateRealPower(voltage, current, powerFactor) {
  return (voltage * current * powerFactor).toFixed(2);
}


const intervals = {
  "SLCILM0001":null,"SLCILM0002":null,"SLCILM0003":null,"SLCILM0004":null,"SLCILM0005":null
}



