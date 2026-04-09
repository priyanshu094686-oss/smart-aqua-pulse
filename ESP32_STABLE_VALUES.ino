#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ================= WiFi CONFIG =================
const char* ssid = "Redmi";
const char* password = "zaambaba";

// ================= Supabase CONFIG =================
const char* supabaseUrl = "https://ayrejsbltaqqiojsybxd.supabase.co/rest/v1/sensor_readings";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5cmVqc2JsdGFxcWlvanN5YnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNzAyMzUsImV4cCI6MjA3Nzg0NjIzNX0.EUzbesJ3w8G41Q_3gZn3FjtUGCp-mDB86H0gzbhh2yc";
const char* deviceId = "device_001";

// ================= OLED DISPLAY =================
#define SCREEN_WIDTH  128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// ================= STABLE BASE VALUES =================
float currentTDS = 95.0;
float currentPH = 7.2;
float currentTemp = 22.5;
float currentTurbidity = 0.4;
float currentFlowRate = 0.8;
float currentTankLevel = 78.0;
float currentFilterLife = 82.0;

// ================= TIMING =================
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 5000;
unsigned long lastTankUpdate = 0;
unsigned long lastFilterUpdate = 0;

// ================= REALISTIC VARIATION =================
float stableVariation(float base, float minVal, float maxVal, float maxChange) {
  float change = (random(-100, 101) / 100.0) * maxChange;
  float newVal = base + change;
  if (newVal < minVal) newVal = minVal;
  if (newVal > maxVal) newVal = maxVal;
  return newVal;
}

// ================= WiFi =================
void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Failed!");
  }
}

// ================= SUPABASE =================
void sendToSupabase(float ph, float tds, float temp, float flow, float tank, float filter) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    return;
  }
  HTTPClient http;
  http.begin(supabaseUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  http.addHeader("Prefer", "return=minimal");

  StaticJsonDocument<512> doc;
  doc["device_id"] = deviceId;
  doc["ph"] = ph;
  doc["tds"] = tds;
  doc["temperature"] = temp;
  doc["flow_rate"] = flow;
  doc["tank_level"] = tank;
  doc["filter_life"] = filter;

  String payload;
  serializeJson(doc, payload);
  Serial.println(payload);

  int code = http.POST(payload);
  Serial.printf("HTTP: %d\n", code);
  http.end();
}

// ================= OLED =================
void updateDisplay(float ph, float tds, float temp, float flow, float tank, float filter) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.println("Smart Water Purifier");
  display.drawLine(0, 10, 128, 10, WHITE);
  display.setCursor(0, 14);
  display.printf("pH: %.2f  TDS: %.0f", ph, tds);
  display.setCursor(0, 24);
  display.printf("Temp: %.1fC", temp);
  display.setCursor(0, 34);
  display.printf("Flow: %.2f L/min", flow);
  display.setCursor(0, 44);
  display.printf("Tank: %.0f%%  Flt: %.0f%%", tank, filter);
  display.setCursor(0, 54);
  if (WiFi.status() == WL_CONNECTED) display.print("WiFi OK");
  else display.print("WiFi OFF");
  display.display();
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  delay(1000);
  randomSeed(analogRead(0));

  Wire.begin(21, 22);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED failed!");
  }
  display.clearDisplay();
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.println("Booting...");
  display.display();

  connectWiFi();
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Ready!");
  display.display();
  delay(1000);
}

// ================= LOOP =================
void loop() {
  unsigned long now = millis();

  // TDS: 50-150 ppm, tiny variation (~2 ppm drift)
  currentTDS = stableVariation(currentTDS, 50.0, 150.0, 2.0);

  // pH: 6.5-8.5, very small drift (~0.05)
  currentPH = stableVariation(currentPH, 6.5, 8.5, 0.05);

  // Temperature: 20-25°C, tiny drift (~0.3)
  currentTemp = stableVariation(currentTemp, 20.0, 25.0, 0.3);

  // Turbidity: 0.1-1.0 NTU, tiny drift (~0.02)
  currentTurbidity = stableVariation(currentTurbidity, 0.1, 1.0, 0.02);

  // Flow Rate: 0.1-2.0 L/min, small drift (~0.05)
  currentFlowRate = stableVariation(currentFlowRate, 0.1, 2.0, 0.05);

  // Tank Level: 70-85%, changes slowly every 5 min
  if (now - lastTankUpdate >= 300000) {
    currentTankLevel = stableVariation(currentTankLevel, 70.0, 85.0, 3.0);
    lastTankUpdate = now;
  }

  // Filter Life: 70-90%, decreases slowly every 1 min
  if (now - lastFilterUpdate >= 60000) {
    currentFilterLife -= 0.05;
    if (currentFilterLife < 70.0) currentFilterLife = 90.0;
    lastFilterUpdate = now;
  }

  // Serial output
  Serial.printf("pH:%.2f TDS:%.0f Temp:%.1f Turb:%.2f Flow:%.2f Tank:%.0f Flt:%.0f\n",
    currentPH, currentTDS, currentTemp, currentTurbidity,
    currentFlowRate, currentTankLevel, currentFilterLife);

  // Update OLED
  updateDisplay(currentPH, currentTDS, currentTemp, currentFlowRate, currentTankLevel, currentFilterLife);

  // Send to Supabase every 5 seconds
  if (now - lastSendTime >= SEND_INTERVAL) {
    sendToSupabase(currentPH, currentTDS, currentTemp, currentFlowRate, currentTankLevel, currentFilterLife);
    lastSendTime = now;
  }

  delay(1000);
}
