# IoT Device Integration Guide

This guide explains how to send sensor data from your IoT device to the AquaPure Monitor dashboard.

## API Endpoint

Your IoT device should send data to this endpoint:
```
POST /functions/v1/iot-data
```

## Data Format

Send JSON data with the following structure:

```json
{
  "device_id": "device_001",
  "tds": 45.2,
  "ph": 7.1,
  "temperature": 24.5,
  "flow_rate": 2.5,
  "tank_level": 85,
  "filter_life": 72
}
```

### Fields:
- `device_id` (required): Unique identifier for your water purifier device
- `tds`: Total Dissolved Solids in ppm (parts per million)
- `ph`: pH level (typically 6.5-8.5)
- `temperature`: Water temperature in °C
- `flow_rate`: Flow rate in liters per minute
- `tank_level`: Tank water level as percentage (0-100)
- `filter_life`: Filter remaining life as percentage (0-100)

## Example: Arduino/ESP32

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "YOUR_FUNCTION_URL/iot-data";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void sendSensorData(float tds, float ph, float temp, float flowRate, int tankLevel, int filterLife) {
  if(WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    StaticJsonDocument<256> doc;
    doc["device_id"] = "device_001";
    doc["tds"] = tds;
    doc["ph"] = ph;
    doc["temperature"] = temp;
    doc["flow_rate"] = flowRate;
    doc["tank_level"] = tankLevel;
    doc["filter_life"] = filterLife;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Send POST request
    int httpResponseCode = http.POST(jsonString);
    
    if(httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Response: " + response);
    } else {
      Serial.println("Error: " + String(httpResponseCode));
    }
    
    http.end();
  }
}

void loop() {
  // Read sensors (example values)
  float tds = analogRead(TDS_PIN) * 0.1;
  float ph = analogRead(PH_PIN) * 0.01;
  float temp = 24.5;
  float flowRate = 2.5;
  int tankLevel = 85;
  int filterLife = 72;
  
  // Send data every 5 seconds
  sendSensorData(tds, ph, temp, flowRate, tankLevel, filterLife);
  delay(5000);
}
```

## Example: Python (Raspberry Pi)

```python
import requests
import json
import time

API_URL = "YOUR_FUNCTION_URL/iot-data"
DEVICE_ID = "device_001"

def send_sensor_data(tds, ph, temperature, flow_rate, tank_level, filter_life):
    payload = {
        "device_id": DEVICE_ID,
        "tds": tds,
        "ph": ph,
        "temperature": temperature,
        "flow_rate": flow_rate,
        "tank_level": tank_level,
        "filter_life": filter_life
    }
    
    try:
        response = requests.post(API_URL, json=payload)
        if response.status_code == 200:
            print("Data sent successfully:", response.json())
        else:
            print(f"Error: {response.status_code}", response.text)
    except Exception as e:
        print(f"Failed to send data: {e}")

# Main loop
while True:
    # Read sensors (example values - replace with actual sensor readings)
    tds = 45.2
    ph = 7.1
    temperature = 24.5
    flow_rate = 2.5
    tank_level = 85
    filter_life = 72
    
    send_sensor_data(tds, ph, temperature, flow_rate, tank_level, filter_life)
    time.sleep(5)  # Send data every 5 seconds
```

## Testing with cURL

You can test the API endpoint using cURL:

```bash
curl -X POST YOUR_FUNCTION_URL/iot-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "device_001",
    "tds": 45.2,
    "ph": 7.1,
    "temperature": 24.5,
    "flow_rate": 2.5,
    "tank_level": 85,
    "filter_life": 72
  }'
```

## Real-time Updates

The dashboard automatically updates in real-time when new sensor data arrives. No refresh needed!

## Troubleshooting

1. **Connection Failed**: Check your WiFi credentials and network connection
2. **HTTP 400 Error**: Ensure `device_id` is included in the payload
3. **HTTP 500 Error**: Check the server logs for detailed error messages
4. **Data Not Showing**: Verify the `device_id` matches the one configured in the dashboard (default: "device_001")

## Security Notes

- This API is currently public for testing purposes
- For production use, implement device authentication
- Consider using HTTPS for encrypted communication
- Rotate device credentials regularly
