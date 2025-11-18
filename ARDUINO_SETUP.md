# Arduino ESP8266 + Firebase Realtime Database Setup Guide

## 🔥 Firebase Realtime Database Structure

Your database should have this structure:

```
/
├── manualOpen: false
├── manualClose: false
└── waterSystem/
    ├── incoming: 0
    ├── outgoing: 0
    └── valveStatus: "OPEN"
```

## 📋 Step 1: Deploy Realtime Database Rules

Deploy the `realtime.rules` file to Firebase:

```bash
firebase deploy --only database
```

Or manually update in Firebase Console → Realtime Database → Rules

## 🔧 Step 2: Get Your Realtime Database URL

1. Go to Firebase Console → Realtime Database
2. Copy your database URL (looks like: `https://your-project-default-rtdb.firebaseio.com`)
3. Update `firebase.ts` with your `databaseURL`

## 🤖 Step 3: Arduino ESP8266 Code

Here's the complete Arduino code for your ESP8266:

```cpp
#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>

// WiFi credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase credentials
#define FIREBASE_HOST "water-management-9f786-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "YOUR_DATABASE_SECRET"

// Sensor pins
#define FLOW_SENSOR_IN D1  // Incoming flow sensor
#define FLOW_SENSOR_OUT D2 // Outgoing flow sensor
#define VALVE_PIN D3       // Solenoid valve control

FirebaseData firebaseData;

volatile int pulseCountIn = 0;
volatile int pulseCountOut = 0;
unsigned long oldTime = 0;
float flowRateIn = 0.0;
float flowRateOut = 0.0;

// Interrupt service routines
void ICACHE_RAM_ATTR pulseCounterIn() {
  pulseCountIn++;
}

void ICACHE_RAM_ATTR pulseCounterOut() {
  pulseCountOut++;
}

void setup() {
  Serial.begin(115200);
  
  // Setup pins
  pinMode(FLOW_SENSOR_IN, INPUT_PULLUP);
  pinMode(FLOW_SENSOR_OUT, INPUT_PULLUP);
  pinMode(VALVE_PIN, OUTPUT);
  
  // Attach interrupts
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_IN), pulseCounterIn, FALLING);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_OUT), pulseCounterOut, FALLING);
  
  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  
  // Initialize Firebase
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);
  
  Serial.println("Firebase Connected!");
}

void loop() {
  // Calculate flow rates every second
  if ((millis() - oldTime) > 1000) {
    detachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_IN));
    detachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_OUT));
    
    // Calculate flow rate (L/min)
    // YF-S201 sensor: 7.5 pulses per second = 1 L/min
    flowRateIn = (pulseCountIn / 7.5);
    flowRateOut = (pulseCountOut / 7.5);
    
    // Reset counters
    pulseCountIn = 0;
    pulseCountOut = 0;
    oldTime = millis();
    
    // Send to Firebase
    Firebase.setFloat(firebaseData, "/waterSystem/incoming", flowRateIn);
    Firebase.setFloat(firebaseData, "/waterSystem/outgoing", flowRateOut);
    
    Serial.print("Incoming: ");
    Serial.print(flowRateIn);
    Serial.print(" L/min | Outgoing: ");
    Serial.print(flowRateOut);
    Serial.println(" L/min");
    
    // Re-attach interrupts
    attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_IN), pulseCounterIn, FALLING);
    attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_OUT), pulseCounterOut, FALLING);
  }
  
  // Check manual valve control from Firebase
  if (Firebase.getBool(firebaseData, "/manualOpen")) {
    if (firebaseData.boolData()) {
      digitalWrite(VALVE_PIN, HIGH);
      Firebase.setString(firebaseData, "/waterSystem/valveStatus", "OPEN");
      Firebase.setBool(firebaseData, "/manualOpen", false);
      Serial.println("Valve OPENED");
    }
  }
  
  if (Firebase.getBool(firebaseData, "/manualClose")) {
    if (firebaseData.boolData()) {
      digitalWrite(VALVE_PIN, LOW);
      Firebase.setString(firebaseData, "/waterSystem/valveStatus", "CLOSED");
      Firebase.setBool(firebaseData, "/manualClose", false);
      Serial.println("Valve CLOSED");
    }
  }
  
  delay(100);
}
```

## 📦 Step 4: Install Arduino Libraries

Install these libraries in Arduino IDE:

1. **ESP8266WiFi** (Built-in with ESP8266 board)
2. **FirebaseESP8266** by Mobizt
   - Go to: Sketch → Include Library → Manage Libraries
   - Search for "Firebase ESP8266"
   - Install "Firebase Arduino Client Library for ESP8266"

## 🔌 Step 5: Hardware Connections

### YF-S201 Flow Sensors:
- **Incoming Sensor:**
  - Red → 5V
  - Black → GND
  - Yellow → D1 (GPIO5)

- **Outgoing Sensor:**
  - Red → 5V
  - Black → GND
  - Yellow → D2 (GPIO4)

### Solenoid Valve (with relay):
- **Relay Module:**
  - VCC → 3.3V
  - GND → GND
  - IN → D3 (GPIO0)
- **Solenoid:**
  - Connect to relay's NO (Normally Open) and COM terminals
  - Power from 12V external power supply

## 🌐 Step 6: Dashboard Features

Your web dashboard now has:

✅ **Real-time Flow Monitoring**
- Live incoming flow (L/min)
- Live outgoing flow (L/min)
- Updates every second from Arduino

✅ **Valve Control**
- Toggle switch to open/close valve
- Updates Arduino in real-time
- Shows current valve status

✅ **Leak Detection**
- Automatic detection when flow difference > 10 L/min
- Visual alert with red banner
- Green banner when system is normal

✅ **Live Status Indicators**
- Pulsing green dots show live data
- Color-coded status cards
- Real-time updates without page refresh

## 🚀 Step 7: Testing

1. **Upload Arduino code** to ESP8266
2. **Open Serial Monitor** (115200 baud) to see sensor data
3. **Login to web dashboard**
4. **Navigate to Readings page**
5. **Watch live data** update from Arduino
6. **Toggle valve** from dashboard
7. **Check Arduino Serial Monitor** to see valve commands

## 🔍 Troubleshooting

### Arduino not connecting to WiFi:
- Check WiFi credentials
- Make sure ESP8266 is in range
- Try 2.4GHz network only (5GHz not supported)

### Data not showing in dashboard:
- Verify Firebase Realtime Database URL
- Check database rules are deployed
- Open browser console for errors

### Valve not responding:
- Check relay connections
- Verify D3 pin in code matches hardware
- Test relay with simple digitalWrite test

### Flow sensors not working:
- Check sensor connections (especially ground)
- Verify interrupt pins (D1, D2)
- Test sensors with multimeter

## 📊 Data Structure Details

### Firebase Paths:

- **`/waterSystem/incoming`**: Float (L/min) - Updated every second by Arduino
- **`/waterSystem/outgoing`**: Float (L/min) - Updated every second by Arduino
- **`/waterSystem/valveStatus`**: String ("OPEN" or "CLOSED") - Set by Arduino
- **`/manualOpen`**: Boolean - Set by dashboard to open valve
- **`/manualClose`**: Boolean - Set by dashboard to close valve

## 🎯 Next Steps

1. **Add data logging** - Store historical data in Firestore
2. **Add charts** - Visualize flow trends over time
3. **Add notifications** - Email/SMS alerts for leaks
4. **Add more sensors** - Temperature, pressure, pH levels
5. **Add user profiles** - Track water usage per user

## 📞 Support

If you encounter issues:
1. Check Firebase Console for database connection
2. Open browser DevTools console for errors
3. Check Arduino Serial Monitor for sensor data
4. Verify all Firebase rules are deployed correctly

---

🎉 **Your Arduino-powered water management system is now live!**
