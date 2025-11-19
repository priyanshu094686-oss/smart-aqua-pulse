# Smart Water Purifier IoT Dashboard - Feature Guide

This document describes all features implemented based on the ESP32 Water Quality IoT System research paper.

## Dashboard Features

### 1. Real-Time Monitoring Dashboard
- **Live Metrics Display**: Displays 6 key parameters in real-time:
  - TDS (Total Dissolved Solids) - Normal range: 50-150 ppm
  - pH Level - Optimal range: 6.5-7.5
  - Temperature - Typical range: 20-30°C
  - Flow Rate - Measured in L/min
  - Tank Level - Percentage of tank capacity
  - Filter Life - Remaining filter capacity

### 2. Multi-Parameter Charts with Time Range Selection
Each parameter has its own dedicated chart with multiple time range options:
- **Live**: Last hour with 12 data points
- **1h**: Last 1 hour
- **6h**: Last 6 hours
- **1d**: Last 24 hours (1 day)
- **1w**: Last 7 days (1 week)
- **1m**: Last 30 days (1 month)
- **3m**: Last 90 days (3 months)

#### Available Charts:
1. **TDS Chart**: Monitors total dissolved solids over time
   - Color: Primary blue
   - Unit: ppm (parts per million)
   - Normal range: <150 ppm for drinking water

2. **pH Level Chart**: Tracks water acidity/alkalinity
   - Color: Secondary cyan
   - Unit: pH scale (0-14)
   - Optimal range: 6.5-7.5 (neutral water)

3. **Temperature Chart**: Monitors water temperature
   - Color: Warning orange
   - Unit: °C (Celsius)
   - Typical range: 20-30°C

4. **Turbidity Chart**: Measures water clarity
   - Color: Accent teal
   - Unit: NTU (Nephelometric Turbidity Units)
   - Clear water: <5 NTU

5. **Water Flow Chart**: Tracks water consumption
   - Color: Success green
   - Unit: L/min (liters per minute)
   - Shows flow patterns over time

6. **Tank Level Chart**: Monitors water storage
   - Color: Light blue
   - Unit: Percentage (%)
   - Shows tank capacity utilization

### 3. Device Location Tracking (GPS)
- Displays device ID
- Shows physical location name
- Provides GPS coordinates (latitude, longitude)
- Useful for maintenance teams to locate devices quickly

**Example Location Data:**
- Device ID: device_001
- Location: Smart Water Purifier - Main Tank
- Coordinates: 17.385°N, 78.4867°E

### 4. Device Control Panel
Remote control capabilities for:

#### A. Water Pump Control
- **Status Display**: Shows if pump is running or stopped
- **Toggle Switch**: Turn pump on/off remotely
- **Visual Indicator**: Color changes based on status
  - Green: Pump running
  - Gray: Pump stopped
- **Notifications**: Toast notification on status change

#### B. Solenoid Valve Control
- **Status Display**: Shows if valve is open or closed
- **Toggle Switch**: Open/close valve remotely
- **Visual Indicator**: Color changes based on status
  - Green: Valve open
  - Gray: Valve closed
- **Notifications**: Toast notification on status change

### 5. Intelligent Alert System
Monitors all parameters and generates alerts:
- **Success Alerts**: Water quality excellent, all parameters normal
- **Info Alerts**: Scheduled maintenance reminders (filter replacement)
- **Warning Alerts**: Unusual consumption patterns, parameter drift
- **Critical Alerts**: Parameters out of safe range, immediate action needed

### 6. Status Indicators
Visual status displays for:
- **Primary Filter**: Shows remaining life percentage with color coding
  - Green: >50% (Good)
  - Orange: 25-50% (Warning)
  - Red: <25% (Critical - Replace Soon)
- **Membrane Filter**: Similar status display

## Data Storage and Real-Time Updates

### Database Structure (Supabase)
Table: `sensor_readings`
- device_id: Text (device identifier)
- tds: Numeric (TDS value in ppm)
- ph: Numeric (pH level)
- temperature: Numeric (temperature in °C)
- flow_rate: Numeric (flow rate in L/min)
- tank_level: Numeric (tank level in %)
- filter_life: Numeric (filter life in %)
- created_at: Timestamp (automatic)

### Real-Time Synchronization
- Uses Supabase Realtime for instant updates
- New sensor data appears immediately on dashboard
- No page refresh required
- Toast notifications for new readings

## ESP32 Integration

### Sending Data to Dashboard
Your ESP32 device should send data to the Supabase REST API endpoint:

**Endpoint**: See `ESP32_SUPABASE_GUIDE.md` for complete setup

**Data Format (JSON)**:
```json
{
  "device_id": "device_001",
  "tds": 120.5,
  "ph": 7.2,
  "temperature": 25.3,
  "flow_rate": 3.5,
  "tank_level": 85.0,
  "filter_life": 65.0
}
```

**Required Headers**:
- Content-Type: application/json
- apikey: Your Supabase anon key
- Authorization: Bearer [your anon key]
- Prefer: return=minimal

### Data Update Frequency
- Recommended: Every 5 seconds for live monitoring
- Minimum: Every 30 seconds
- Maximum: Every 1 second (may increase database load)

## Water Quality Standards (WHO Guidelines)

### pH Level
- Acceptable: 6.5 - 8.5
- Optimal: 7.0 - 7.5
- Below 6.5: Acidic water (corrosive)
- Above 8.5: Alkaline water (scale formation)

### TDS (Total Dissolved Solids)
- Excellent: <300 ppm
- Good: 300-600 ppm
- Fair: 600-900 ppm
- Poor: >900 ppm

### Turbidity
- Clear water: <5 NTU
- Acceptable: <10 NTU
- Cloudy: >10 NTU

### Temperature
- Optimal drinking: 10-15°C (chilled)
- Room temperature: 20-25°C
- Warm: 25-30°C

## Usage Tips

1. **Monitor Trends**: Use different time ranges to identify patterns
   - Daily patterns: Use 1d view
   - Weekly consumption: Use 1w view
   - Long-term trends: Use 1m or 3m views

2. **Preventive Maintenance**: 
   - Check filter life regularly
   - Replace filters before they reach critical level
   - Monitor for unusual parameter changes

3. **Energy Saving**:
   - Turn off pump when tank is full
   - Close valve when not in use
   - Monitor flow rate for leaks

4. **Water Quality**:
   - Check all parameters daily
   - Respond to alerts promptly
   - Maintain TDS below 150 ppm for drinking

5. **System Health**:
   - Verify real-time updates are working
   - Check connection status
   - Review alert history

## Technical Implementation Details

### Frontend Technologies
- React 18 with TypeScript
- Recharts for data visualization
- Shadcn/ui components
- Tailwind CSS for styling
- Real-time updates via Supabase

### Backend Technologies
- Supabase (PostgreSQL database)
- Supabase Realtime
- Row-Level Security (RLS) policies
- REST API for ESP32 integration

### Features Similar to Research Paper
Based on: "ESP32 Based Implementation of Water Quality and Quantity Regulating System"
- ✅ Multiple parameter monitoring (TDS, pH, Temperature, Turbidity, Flow, Level)
- ✅ Real-time data visualization
- ✅ Historical data with multiple time ranges
- ✅ GPS location tracking
- ✅ Remote pump control
- ✅ Remote valve control
- ✅ Alert system
- ✅ Cloud connectivity (Blynk → Supabase)
- ✅ ESP32 microcontroller support
- ✅ IoT architecture

## Future Enhancements
- Mobile app integration
- SMS/Email alerts
- Predictive maintenance using AI
- Water consumption analytics
- Multi-device support
- User authentication
- Historical data export
- Custom alert thresholds
