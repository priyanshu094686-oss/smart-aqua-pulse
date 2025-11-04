# ESP32 to Supabase REST API Integration Guide

This guide shows you how to connect your ESP32 device directly to Supabase using REST API to send water purifier sensor data.

## Prerequisites

1. ESP32 board
2. Arduino IDE with ESP32 board support
3. Required Arduino libraries:
   - WiFi (built-in)
   - HTTPClient (built-in)
   - ArduinoJson (install from Library Manager)

## Supabase Configuration

**Supabase URL:** `https://ayrejsbltaqqiojsybxd.supabase.co`  
**Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5cmVqc2JsdGFxcWlvanN5YnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNzAyMzUsImV4cCI6MjA3Nzg0NjIzNX0.EUzbesJ3w8G41Q_3gZn3FjtUGCp-mDB86H0gzbhh2yc`

**REST API Endpoint:** `https://ayrejsbltaqqiojsybxd.supabase.co/rest/v1/sensor_readings`

## Complete ESP32 Arduino Code

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Supabase configuration
const char* supabaseUrl = "https://ayrejsbltaqqiojsybxd.supabase.co/rest/v1/sensor_readings";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5cmVqc2JsdGFxcWlvanN5YnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNzAyMzUsImV4cCI6MjA3Nzg0NjIzNX0.EUzbesJ3w8G41Q_3gZn3FjtUGCp-mDB86H0gzbhh2yc";

// Device ID - Change this for each device
const char* deviceId = "device_001";

// Sensor pins (adjust according to your setup)
#define TDS_PIN 34
#define PH_PIN 35
#define TEMP_PIN 32
#define FLOW_PIN 33

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  // Initialize sensor pins
  pinMode(TDS_PIN, INPUT);
  pinMode(PH_PIN, INPUT);
  pinMode(TEMP_PIN, INPUT);
  pinMode(FLOW_PIN, INPUT);
  
  // Connect to WiFi
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // Read sensor values
    float tds = readTDS();
    float ph = readPH();
    float temperature = readTemperature();
    float flowRate = readFlowRate();
    int tankLevel = readTankLevel();
    int filterLife = readFilterLife();
    
    // Send data to Supabase
    bool success = sendToSupabase(tds, ph, temperature, flowRate, tankLevel, filterLife);
    
    if (success) {
      Serial.println("✓ Data sent successfully!");
    } else {
      Serial.println("✗ Failed to send data");
    }
  } else {
    Serial.println("WiFi disconnected. Reconnecting...");
    WiFi.reconnect();
  }
  
  // Send data every 5 seconds
  delay(5000);
}

bool sendToSupabase(float tds, float ph, float temp, float flowRate, int tankLevel, int filterLife) {
  HTTPClient http;
  
  // Configure HTTP client
  http.begin(supabaseUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  http.addHeader("Prefer", "return=representation");
  
  // Create JSON payload
  StaticJsonDocument<300> doc;
  doc["device_id"] = deviceId;
  doc["tds"] = tds;
  doc["ph"] = ph;
  doc["temperature"] = temp;
  doc["flow_rate"] = flowRate;
  doc["tank_level"] = tankLevel;
  doc["filter_life"] = filterLife;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Print payload for debugging
  Serial.println("\nSending data:");
  Serial.println(jsonString);
  
  // Send POST request
  int httpResponseCode = http.POST(jsonString);
  
  // Handle response
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);
  } else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
    Serial.println(http.errorToString(httpResponseCode));
  }
  
  http.end();
  
  return (httpResponseCode == 201 || httpResponseCode == 200);
}

// Sensor reading functions
// Replace these with your actual sensor reading logic

float readTDS() {
  // Read TDS sensor
  // Example: Convert analog reading to TDS value
  int analogValue = analogRead(TDS_PIN);
  float voltage = analogValue * (3.3 / 4095.0);
  float tds = voltage * 133.42; // Calibration factor
  return constrain(tds, 0, 1000);
}

float readPH() {
  // Read pH sensor
  // Example: Convert analog reading to pH value
  int analogValue = analogRead(PH_PIN);
  float voltage = analogValue * (3.3 / 4095.0);
  float ph = 7.0 + ((2.5 - voltage) / 0.18); // Calibration
  return constrain(ph, 0, 14);
}

float readTemperature() {
  // Read temperature sensor (DS18B20, DHT22, etc.)
  // Example: using analog temperature sensor
  int analogValue = analogRead(TEMP_PIN);
  float voltage = analogValue * (3.3 / 4095.0);
  float temperature = (voltage - 0.5) * 100.0; // For LM35 sensor
  return constrain(temperature, 0, 100);
}

float readFlowRate() {
  // Read flow sensor (YF-S201, etc.)
  // Example: Calculate from pulse count
  // This is a simplified example
  int pulseCount = analogRead(FLOW_PIN);
  float flowRate = pulseCount / 450.0; // Calibration factor
  return constrain(flowRate, 0, 10);
}

int readTankLevel() {
  // Read ultrasonic or float sensor
  // Example: Convert distance to percentage
  // Simplified example
  int level = map(analogRead(34), 0, 4095, 0, 100);
  return constrain(level, 0, 100);
}

int readFilterLife() {
  // Calculate filter life based on usage
  // This could be stored in EEPROM and decremented
  // Simplified example - returns fixed value
  static int filterLife = 100;
  
  // Decrement slowly over time
  if (millis() % 60000 == 0) { // Every minute
    filterLife = max(0, filterLife - 1);
  }
  
  return filterLife;
}
```

## Simplified Testing Version

If you don't have sensors connected yet, use this simplified version with simulated data:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Supabase configuration
const char* supabaseUrl = "https://ayrejsbltaqqiojsybxd.supabase.co/rest/v1/sensor_readings";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5cmVqc2JsdGFxcWlvanN5YnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNzAyMzUsImV4cCI6MjA3Nzg0NjIzNX0.EUzbesJ3w8G41Q_3gZn3FjtUGCp-mDB86H0gzbhh2yc";

const char* deviceId = "device_001";

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    http.begin(supabaseUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabaseKey);
    http.addHeader("Authorization", String("Bearer ") + supabaseKey);
    http.addHeader("Prefer", "return=representation");
    
    // Simulated sensor data with random variations
    StaticJsonDocument<300> doc;
    doc["device_id"] = deviceId;
    doc["tds"] = 45.0 + random(-50, 50) / 10.0;
    doc["ph"] = 7.0 + random(-5, 5) / 10.0;
    doc["temperature"] = 24.0 + random(-20, 20) / 10.0;
    doc["flow_rate"] = 2.5 + random(-10, 10) / 10.0;
    doc["tank_level"] = random(70, 95);
    doc["filter_life"] = random(60, 90);
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    Serial.println("\n📤 Sending:");
    Serial.println(jsonString);
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode == 201 || httpResponseCode == 200) {
      Serial.println("✓ Success! Data sent to Supabase");
      String response = http.getString();
      Serial.println(response);
    } else {
      Serial.print("✗ Error: ");
      Serial.println(httpResponseCode);
    }
    
    http.end();
  } else {
    Serial.println("WiFi disconnected!");
    WiFi.reconnect();
  }
  
  delay(5000); // Send every 5 seconds
}
```

## Installation Steps

1. **Install Arduino IDE** (if not already installed)
2. **Add ESP32 Board Support:**
   - Go to File → Preferences
   - Add to "Additional Board Manager URLs": 
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to Tools → Board → Board Manager
   - Search "ESP32" and install "esp32 by Espressif Systems"

3. **Install ArduinoJson Library:**
   - Go to Tools → Manage Libraries
   - Search "ArduinoJson"
   - Install "ArduinoJson by Benoit Blanchon" (version 6.x)

4. **Configure the Code:**
   - Replace `YOUR_WIFI_SSID` with your WiFi network name
   - Replace `YOUR_WIFI_PASSWORD` with your WiFi password
   - Change `deviceId` if you have multiple devices

5. **Upload to ESP32:**
   - Connect ESP32 via USB
   - Select correct board: Tools → Board → ESP32 Dev Module
   - Select correct port: Tools → Port
   - Click Upload button

## Monitoring

Open Serial Monitor (Tools → Serial Monitor) at 115200 baud to see:
- WiFi connection status
- Data being sent
- Response from Supabase
- Any error messages

## Troubleshooting

### WiFi Not Connecting
- Check SSID and password
- Make sure ESP32 is within WiFi range
- Try restarting ESP32

### HTTP Error 401
- Check that supabaseKey is correct
- Verify both apikey and Authorization headers are set

### HTTP Error 400
- Check JSON format
- Ensure device_id is included

### HTTP Error 500
- Check Supabase database is accessible
- Verify table exists and RLS policies allow inserts

### Data Not Showing on Dashboard
- Verify device_id matches (default: "device_001")
- Check Serial Monitor for successful responses
- Open browser console on dashboard for errors

## Next Steps

1. Connect your actual sensors (TDS, pH, temperature, flow, etc.)
2. Calibrate sensor readings
3. Adjust data sending frequency based on your needs
4. Add error handling and retry logic
5. Implement deep sleep mode for battery-powered devices
6. Add OTA (Over-The-Air) update capability

## Security Recommendations

For production use:
1. Store credentials in a separate config file
2. Implement device authentication
3. Use HTTPS (already enabled with Supabase)
4. Regularly update firmware
5. Monitor for unusual data patterns
