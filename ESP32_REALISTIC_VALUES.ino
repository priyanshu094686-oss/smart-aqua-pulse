#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ------------------- WiFi CONFIG -------------------
const char* ssid = "Redmi";
const char* password = "zaambaba";

// ------------------- Supabase CONFIG -------------------
const char* supabaseUrl = "https://ayrejsbltaqqiojsybxd.supabase.co/rest/v1/sensor_readings";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5cmVqc2JsdGFxcWlvanN5YnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNzAyMzUsImV4cCI6MjA3Nzg0NjIzNX0.EUzbesJ3w8G41Q_3gZn3FjtUGCp-mDB86H0gzbhh2yc";
const char* deviceId = "device_001";

// ------------------- OLED DISPLAY -------------------
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// ------------------- SIMULATION VARIABLES -------------------
float currentTDS = 100.0;
float currentPH = 6.8;
float currentTemp = 25.0;
float currentTankLevel = 75.0;
float currentFilterLife = 85.0;
float currentTurbidity = 0.5;
const float flowRate = 0.25;  // Fixed at 0.25 L/min

unsigned long lastTankUpdate = 0;
unsigned long lastFilterUpdate = 0;
const unsigned long tankUpdateInterval = 300000;  // 5 minutes in milliseconds
const unsigned long filterUpdateInterval = 60000;  // 1 minute

// ------------------- REALISTIC VALUE GENERATOR -------------------
float addRealisticVariation(float baseValue, float minVal, float maxVal, float variationPercent) {
  // Add small random variation
  float variation = baseValue * (variationPercent / 100.0);
  float randomChange = random(-100, 101) / 100.0 * variation;
  float newValue = baseValue + randomChange;
  
  // Constrain to min/max
  if (newValue < minVal) newValue = minVal;
  if (newValue > maxVal) newValue = maxVal;
  
  return newValue;
}

// ------------------- WIFI SETUP -------------------
void connectWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

// ------------------- SUPABASE POST FUNCTION -------------------
void sendToSupabase(float phValue, float tdsValue, float temperature, float flowRate, float tankLevel, float filterLife) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(supabaseUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabaseKey);
    http.addHeader("Authorization", String("Bearer ") + supabaseKey);
    http.addHeader("Prefer", "return=minimal");

    StaticJsonDocument<512> doc;
    doc["device_id"] = deviceId;
    doc["ph"] = phValue;
    doc["tds"] = tdsValue;
    doc["temperature"] = temperature;
    doc["flow_rate"] = flowRate;
    doc["tank_level"] = tankLevel;
    doc["filter_life"] = filterLife;

    String payload;
    serializeJson(doc, payload);

    Serial.println("Sending to Supabase:");
    Serial.println(payload);

    int httpResponseCode = http.POST(payload);
    if (httpResponseCode > 0) {
      Serial.printf("✓ Data sent successfully, code: %d\n", httpResponseCode);
    } else {
      Serial.printf("✗ Error: %s\n", http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  } else {
    Serial.println("✗ WiFi not connected!");
  }
}

// ----------------------------------------------
//                 SETUP
// ----------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== Smart Water Purifier Monitor ===");

  // Initialize random seed
  randomSeed(analogRead(0));

  // Initialize I2C for OLED
  Wire.begin(21, 22);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("✗ OLED not found!");
  } else {
    Serial.println("✓ OLED initialized");
  }

  display.clearDisplay();
  display.setTextColor(WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Booting...");
  display.display();

  // Connect to WiFi
  connectWiFi();

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("WiFi Connected!");
  display.setCursor(0, 10);
  display.println(WiFi.localIP());
  display.display();
  delay(2000);

  Serial.println("=== System Ready ===\n");
}

// ----------------------------------------------
//                 LOOP
// ----------------------------------------------
void loop() {
  unsigned long currentMillis = millis();

  // -------- TDS: 50-150 ppm with realistic variation --------
  currentTDS = addRealisticVariation(currentTDS, 50.0, 150.0, 5.0);

  // -------- pH: 6.0-7.6 with small variation --------
  currentPH = addRealisticVariation(currentPH, 6.0, 7.6, 2.0);

  // -------- Temperature: 20-30°C with small variation --------
  currentTemp = addRealisticVariation(currentTemp, 20.0, 30.0, 3.0);

  // -------- Turbidity: Less than 1 NTU --------
  currentTurbidity = addRealisticVariation(currentTurbidity, 0.1, 0.9, 10.0);

  // -------- Tank Level: Changes every 5 minutes --------
  if (currentMillis - lastTankUpdate >= tankUpdateInterval) {
    // Slowly decrease tank level (simulating water usage)
    currentTankLevel -= random(5, 15);  // Drop 5-15% every 5 minutes
    if (currentTankLevel < 20.0) {
      currentTankLevel = random(70, 95);  // Refill tank
    }
    lastTankUpdate = currentMillis;
  }
  // Small variations between updates
  float tankDisplay = currentTankLevel + (random(-20, 21) / 10.0);
  if (tankDisplay < 0) tankDisplay = 0;
  if (tankDisplay > 100) tankDisplay = 100;

  // -------- Filter Life: Decreases slowly --------
  if (currentMillis - lastFilterUpdate >= filterUpdateInterval) {
    currentFilterLife -= 0.1;  // Decrease 0.1% per minute
    if (currentFilterLife < 0) currentFilterLife = 0;
    lastFilterUpdate = currentMillis;
  }

  // ---------------- SERIAL OUTPUT ----------------
  Serial.println("--- Sensor Readings ---");
  Serial.printf("pH: %.2f\n", currentPH);
  Serial.printf("TDS: %.1f ppm\n", currentTDS);
  Serial.printf("Temperature: %.1f °C\n", currentTemp);
  Serial.printf("Flow Rate: %.2f L/min\n", flowRate);
  Serial.printf("Tank Level: %.1f %%\n", tankDisplay);
  Serial.printf("Filter Life: %.1f %%\n", currentFilterLife);
  Serial.printf("Turbidity: %.2f NTU\n", currentTurbidity);
  Serial.println();

  // ---------------- OLED DISPLAY ----------------
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Smart Water Purifier");
  display.drawLine(0, 10, 128, 10, WHITE);

  display.setCursor(0, 14);
  display.printf("pH: %.2f  TDS:%.0f", currentPH, currentTDS);

  display.setCursor(0, 24);
  display.printf("Temp: %.1fC", currentTemp);

  display.setCursor(0, 34);
  display.printf("Flow: %.2f L/m", flowRate);

  display.setCursor(0, 44);
  display.printf("Turb: %.2f NTU", currentTurbidity);

  display.setCursor(0, 54);
  display.printf("Tank:%.0f%% Flt:%.0f%%", tankDisplay, currentFilterLife);
  display.display();

  // ---------------- SEND TO SUPABASE ----------------
  sendToSupabase(currentPH, currentTDS, currentTemp, flowRate, tankDisplay, currentFilterLife);

  delay(5000);  // Send data every 5 seconds
}
