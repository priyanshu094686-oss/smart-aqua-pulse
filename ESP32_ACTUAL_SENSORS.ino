/*
 * Smart Water Purifier Monitor - ACTUAL SENSORS
 * 
 * Hardware:
 * - ESP32 Development Board
 * - PH-4502C pH Sensor with E201-BNC Electrode (Pin 34)
 * - TDS Meter V1.0 (Pin 32)
 * - Turbidity Sensor SEN0189 (Pin 33)
 * - DS18B20 Temperature Sensor (Pin 2)
 * - YF-S201 Flow Sensor (Pin 27)
 * - HC-SR04 Ultrasonic Sensor (Trig: 26, Echo: 25)
 * - SSD1306 OLED Display (SDA: 21, SCL: 22)
 * 
 * Libraries Required:
 * - Adafruit_GFX
 * - Adafruit_SSD1306
 * - ArduinoJson
 * - OneWire
 * - DallasTemperature
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ================= WiFi CONFIG =================
const char* ssid = "YOUR_WIFI_SSID";           // <-- Change this
const char* password = "YOUR_WIFI_PASSWORD";    // <-- Change this

// ================= Supabase CONFIG =================
const char* supabaseUrl = "https://ayrejsbltaqqiojsybxd.supabase.co/rest/v1/sensor_readings";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5cmVqc2JsdGFxcWlvanN5YnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNzAyMzUsImV4cCI6MjA3Nzg0NjIzNX0.EUzbesJ3w8G41Q_3gZn3FjtUGCp-mDB86H0gzbhh2yc";
const char* deviceId = "device_001";

// ================= PIN DEFINITIONS =================
#define TDS_PIN       32    // TDS Sensor Analog Pin
#define PH_PIN        34    // pH Sensor Analog Pin
#define TURB_PIN      33    // Turbidity Sensor Analog Pin
#define FLOW_PIN      27    // Flow Sensor Digital Pin
#define TRIG_PIN      26    // Ultrasonic Trigger Pin
#define ECHO_PIN      25    // Ultrasonic Echo Pin
#define TEMP_PIN      2     // DS18B20 Temperature Sensor (D2 = GPIO2)

// ================= OLED DISPLAY =================
#define SCREEN_WIDTH  128
#define SCREEN_HEIGHT 64
#define OLED_SDA      21
#define OLED_SCL      22
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// ================= DS18B20 TEMPERATURE SENSOR =================
OneWire oneWire(TEMP_PIN);
DallasTemperature tempSensor(&oneWire);

// ================= pH SENSOR CALIBRATION (PH-4502C) =================
// Calibration values - ADJUST THESE based on your calibration!
// Step 1: Put sensor in pH 7.0 buffer, note the voltage
// Step 2: Put sensor in pH 4.0 buffer, note the voltage
float ph7_voltage = 2.5;    // Voltage at pH 7.0 (adjust after calibration)
float ph4_voltage = 3.0;    // Voltage at pH 4.0 (adjust after calibration)
float ph_slope = 0.0;       // Calculated in setup

// ================= TDS SENSOR CALIBRATION =================
#define VREF 3.3            // ESP32 ADC reference voltage
#define ADC_RESOLUTION 4095.0

// ================= TURBIDITY SENSOR CALIBRATION (SEN0189) =================
// Clean water voltage (0 NTU) - measure with clean water
float cleanWaterVoltage = 4.1;  // Adjust after calibration

// ================= FLOW SENSOR (YF-S201) =================
volatile int flowPulseCount = 0;
float flowRate = 0.0;
float totalLiters = 0.0;
unsigned long oldFlowTime = 0;
// YF-S201: 450 pulses per liter (7.5 pulses per second per L/min)
const float FLOW_CALIBRATION = 7.5;

// ================= FILTER LIFE TRACKING =================
float filterLife = 100.0;
unsigned long filterTotalLiters = 0;
const unsigned long FILTER_CAPACITY = 5000;  // Filter capacity in liters

// ================= TANK SPECIFICATIONS =================
const float TANK_HEIGHT_CM = 100.0;   // Total tank height in cm
const float SENSOR_OFFSET_CM = 5.0;   // Distance from sensor to tank top

// ================= TIMING =================
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 5000;  // Send data every 5 seconds

// ================= FLOW SENSOR INTERRUPT =================
void IRAM_ATTR flowPulseCounter() {
  flowPulseCount++;
}

// ================= SENSOR READING FUNCTIONS =================

// Read pH Value (PH-4502C)
float readPH() {
  int samples = 10;
  float voltage = 0;
  
  for (int i = 0; i < samples; i++) {
    voltage += analogRead(PH_PIN);
    delay(10);
  }
  voltage = (voltage / samples) * (VREF / ADC_RESOLUTION);
  
  // Calculate pH using calibration
  float phValue = 7.0 + ((voltage - ph7_voltage) / ph_slope);
  
  // Constrain to valid pH range
  if (phValue < 0) phValue = 0;
  if (phValue > 14) phValue = 14;
  
  return phValue;
}

// Read TDS Value
float readTDS(float temperature) {
  int samples = 10;
  float voltage = 0;
  
  for (int i = 0; i < samples; i++) {
    voltage += analogRead(TDS_PIN);
    delay(10);
  }
  voltage = (voltage / samples) * (VREF / ADC_RESOLUTION);
  
  // Temperature compensation
  float compensationCoefficient = 1.0 + 0.02 * (temperature - 25.0);
  float compensatedVoltage = voltage / compensationCoefficient;
  
  // Convert voltage to TDS (based on TDS Meter V1.0 formula)
  float tdsValue = (133.42 * compensatedVoltage * compensatedVoltage * compensatedVoltage
                   - 255.86 * compensatedVoltage * compensatedVoltage
                   + 857.39 * compensatedVoltage) * 0.5;
  
  if (tdsValue < 0) tdsValue = 0;
  if (tdsValue > 1000) tdsValue = 1000;
  
  return tdsValue;
}

// Read Turbidity (SEN0189)
float readTurbidity() {
  int samples = 10;
  float voltage = 0;
  
  for (int i = 0; i < samples; i++) {
    voltage += analogRead(TURB_PIN);
    delay(10);
  }
  voltage = (voltage / samples) * (VREF / ADC_RESOLUTION);
  
  // Convert voltage to NTU
  // SEN0189: Higher voltage = cleaner water
  // Clean water (~4.1V) = 0 NTU, Dirty water (~2.5V) = high NTU
  float turbidity;
  if (voltage >= cleanWaterVoltage) {
    turbidity = 0;
  } else {
    // Linear approximation: 0-3000 NTU range
    turbidity = (cleanWaterVoltage - voltage) * 1000.0;
  }
  
  // For drinking water, we expect < 10 NTU
  if (turbidity < 0) turbidity = 0;
  if (turbidity > 10) turbidity = 10;  // Cap at 10 NTU for display
  
  return turbidity;
}

// Read Temperature (DS18B20)
float readTemperature() {
  tempSensor.requestTemperatures();
  float temperature = tempSensor.getTempCByIndex(0);
  
  // Check for read errors
  if (temperature == DEVICE_DISCONNECTED_C || temperature == -127.0) {
    Serial.println("⚠ Temperature sensor error!");
    return 25.0;  // Default value
  }
  
  return temperature;
}

// Read Flow Rate (YF-S201)
float readFlowRate() {
  // Calculate flow rate from pulse count
  unsigned long currentTime = millis();
  unsigned long elapsedTime = currentTime - oldFlowTime;
  
  if (elapsedTime >= 1000) {  // Calculate every second
    detachInterrupt(digitalPinToInterrupt(FLOW_PIN));
    
    // YF-S201: Frequency (Hz) = 7.5 * Flow rate (L/min)
    // Flow rate (L/min) = Pulse count / 7.5 / (elapsed time in seconds)
    flowRate = (flowPulseCount / FLOW_CALIBRATION);
    
    // Calculate liters used
    float litersUsed = flowRate / 60.0;  // Convert L/min to L/sec
    totalLiters += litersUsed;
    filterTotalLiters += litersUsed;
    
    // Update filter life
    filterLife = 100.0 - ((float)filterTotalLiters / FILTER_CAPACITY * 100.0);
    if (filterLife < 0) filterLife = 0;
    
    flowPulseCount = 0;
    oldFlowTime = currentTime;
    
    attachInterrupt(digitalPinToInterrupt(FLOW_PIN), flowPulseCounter, FALLING);
  }
  
  return flowRate;
}

// Read Tank Level (HC-SR04)
float readTankLevel() {
  // Send trigger pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read echo
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);  // 30ms timeout
  
  if (duration == 0) {
    Serial.println("⚠ Ultrasonic sensor timeout!");
    return 50.0;  // Default value
  }
  
  // Calculate distance in cm
  float distance = duration * 0.0343 / 2.0;
  
  // Calculate water level percentage
  float waterDistance = distance - SENSOR_OFFSET_CM;
  float waterLevel = ((TANK_HEIGHT_CM - waterDistance) / TANK_HEIGHT_CM) * 100.0;
  
  // Constrain to valid range
  if (waterLevel < 0) waterLevel = 0;
  if (waterLevel > 100) waterLevel = 100;
  
  return waterLevel;
}

// ================= SUPABASE FUNCTION =================
void sendToSupabase(float ph, float tds, float temperature, float turbidity, 
                    float flowRate, float tankLevel, float filterLife) {
  if (WiFi.status() == WL_CONNECTED) {
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
    doc["temperature"] = temperature;
    doc["turbidity"] = turbidity;
    doc["flow_rate"] = flowRate;
    doc["tank_level"] = tankLevel;
    doc["filter_life"] = filterLife;

    String payload;
    serializeJson(doc, payload);

    Serial.println("📤 Sending to Dashboard:");
    Serial.println(payload);

    int httpCode = http.POST(payload);
    if (httpCode > 0) {
      Serial.printf("✅ Success! HTTP Code: %d\n", httpCode);
    } else {
      Serial.printf("❌ Error: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  } else {
    Serial.println("❌ WiFi Disconnected!");
    connectWiFi();
  }
}

// ================= WiFi CONNECTION =================
void connectWiFi() {
  Serial.print("📶 Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("📍 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi Connection Failed!");
  }
}

// ================= OLED DISPLAY UPDATE =================
void updateDisplay(float ph, float tds, float temp, float turb, 
                   float flow, float tank, float filter) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  
  // Header
  display.setCursor(0, 0);
  display.println("Smart Water Purifier");
  display.drawLine(0, 10, 128, 10, WHITE);
  
  // Sensor values
  display.setCursor(0, 14);
  display.printf("pH: %.2f  TDS: %.0f", ph, tds);
  
  display.setCursor(0, 24);
  display.printf("Temp: %.1fC  Turb:%.1f", temp, turb);
  
  display.setCursor(0, 34);
  display.printf("Flow: %.2f L/min", flow);
  
  display.setCursor(0, 44);
  display.printf("Tank: %.0f%%", tank);
  
  display.setCursor(0, 54);
  display.printf("Filter: %.0f%%", filter);
  
  // WiFi status indicator
  if (WiFi.status() == WL_CONNECTED) {
    display.setCursor(110, 54);
    display.print("WiFi");
  }
  
  display.display();
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n========================================");
  Serial.println("   Smart Water Purifier - REAL SENSORS");
  Serial.println("========================================\n");
  
  // Initialize I2C for OLED
  Wire.begin(OLED_SDA, OLED_SCL);
  
  // Initialize OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("❌ OLED initialization failed!");
  } else {
    Serial.println("✅ OLED initialized");
  }
  
  display.clearDisplay();
  display.setTextColor(WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Initializing...");
  display.display();
  
  // Initialize DS18B20 temperature sensor
  tempSensor.begin();
  Serial.println("✅ Temperature sensor initialized");
  
  // Initialize ultrasonic pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  Serial.println("✅ Ultrasonic sensor initialized");
  
  // Initialize flow sensor with interrupt
  pinMode(FLOW_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_PIN), flowPulseCounter, FALLING);
  oldFlowTime = millis();
  Serial.println("✅ Flow sensor initialized");
  
  // Calculate pH slope from calibration values
  ph_slope = (ph4_voltage - ph7_voltage) / (4.0 - 7.0);
  Serial.printf("✅ pH sensor initialized (slope: %.4f)\n", ph_slope);
  
  Serial.println("✅ TDS sensor initialized");
  Serial.println("✅ Turbidity sensor initialized");
  
  // Connect to WiFi
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Connecting WiFi...");
  display.display();
  
  connectWiFi();
  
  if (WiFi.status() == WL_CONNECTED) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("WiFi Connected!");
    display.setCursor(0, 10);
    display.println(WiFi.localIP());
    display.display();
    delay(2000);
  }
  
  Serial.println("\n========================================");
  Serial.println("   System Ready - Reading Sensors");
  Serial.println("========================================\n");
}

// ================= MAIN LOOP =================
void loop() {
  // Read all sensors
  float temperature = readTemperature();
  float ph = readPH();
  float tds = readTDS(temperature);
  float turbidity = readTurbidity();
  float flow = readFlowRate();
  float tankLevel = readTankLevel();
  
  // Print sensor readings to Serial Monitor
  Serial.println("━━━━━━━ Sensor Readings ━━━━━━━");
  Serial.printf("🔬 pH:          %.2f\n", ph);
  Serial.printf("💧 TDS:         %.0f ppm\n", tds);
  Serial.printf("🌡️ Temperature: %.1f °C\n", temperature);
  Serial.printf("🌫️ Turbidity:   %.2f NTU\n", turbidity);
  Serial.printf("🚿 Flow Rate:   %.2f L/min\n", flow);
  Serial.printf("🪣 Tank Level:  %.0f %%\n", tankLevel);
  Serial.printf("🔧 Filter Life: %.0f %%\n", filterLife);
  Serial.println();
  
  // Update OLED display
  updateDisplay(ph, tds, temperature, turbidity, flow, tankLevel, filterLife);
  
  // Send to Supabase every 5 seconds
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    sendToSupabase(ph, tds, temperature, turbidity, flow, tankLevel, filterLife);
    lastSendTime = millis();
  }
  
  delay(500);  // Small delay for stability
}

/*
 * ================= CALIBRATION GUIDE =================
 * 
 * pH SENSOR CALIBRATION (PH-4502C):
 * 1. Prepare pH 7.0 and pH 4.0 buffer solutions
 * 2. Place sensor in pH 7.0 buffer, wait 1 minute
 * 3. Read voltage from Serial Monitor, update ph7_voltage
 * 4. Place sensor in pH 4.0 buffer, wait 1 minute
 * 5. Read voltage from Serial Monitor, update ph4_voltage
 * 
 * TURBIDITY SENSOR CALIBRATION (SEN0189):
 * 1. Place sensor in clean distilled water
 * 2. Read voltage from Serial Monitor
 * 3. Update cleanWaterVoltage value
 * 
 * TDS SENSOR CALIBRATION:
 * 1. Use a known TDS solution (e.g., 1000 ppm)
 * 2. Compare reading with known value
 * 3. Adjust formula coefficient if needed
 * 
 * TANK LEVEL CALIBRATION:
 * 1. Measure your tank's total height
 * 2. Update TANK_HEIGHT_CM
 * 3. Measure distance from sensor to tank top
 * 4. Update SENSOR_OFFSET_CM
 * 
 * ================= WIRING DIAGRAM =================
 * 
 * ESP32 Pin | Sensor
 * ----------|------------------
 * GPIO 34   | pH Sensor (Analog Out)
 * GPIO 32   | TDS Sensor (Analog Out)
 * GPIO 33   | Turbidity Sensor (Analog Out)
 * GPIO 2    | DS18B20 (Data) + 4.7kΩ pullup to 3.3V
 * GPIO 27   | YF-S201 Flow Sensor (Signal)
 * GPIO 26   | HC-SR04 (Trig)
 * GPIO 25   | HC-SR04 (Echo)
 * GPIO 21   | OLED SDA
 * GPIO 22   | OLED SCL
 * 3.3V      | Sensor VCC (where applicable)
 * 5V        | HC-SR04 VCC, Flow Sensor VCC
 * GND       | All sensor GND
 * 
 * NOTE: DS18B20 requires a 4.7kΩ pullup resistor between
 *       Data pin and 3.3V!
 */
