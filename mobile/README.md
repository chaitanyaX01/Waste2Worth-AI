# Waste2Worth Mobile Application (Flutter for Android)

Waste2Worth is a comprehensive mobile waste-management solution built with Flutter, Material Design 3, and integrated with an AI-powered ResNet-18 classification model, community reporting, predictive waste accumulation, and an EcoPoints reward ledger.

---

## 📱 Features

1. **Role-Based Workflows**:
   - **Citizen**: Community incident reporting, camera AI waste scanner, EcoPoints wallet, digital reward redemption, dynamic hotspots map.
   - **Waste Collector**: Assigned field task management, urgent collection prioritization, live route navigation, BEFORE and AFTER photo proof verification.
   - **Admin Mobile Monitor**: System statistics, report verification, collector task dispatching, hotspot and risk analytics.
2. **AI Waste Classification**:
   - Reuses existing trained PyTorch ResNet-18 model classifying 7 waste categories: *Cardboard, E-waste, Glass, Medical, Metal, Paper, Plastic*.
   - Specialized hazard handling and safety guidance for e-waste and medical waste.
3. **EcoPoints Reward Engine**:
   - Atomic ledger transactions (+10 for report submission, +20 upon verification, +50 upon verified collection).
   - Digital voucher redemption system with fraud prevention and balance checks.
4. **Predictive Waste Management**:
   - Transparent multi-factor risk-scoring baseline forecasting waste accumulation clusters within 24–48 hours.

---

## 🚀 Getting Started

### 1. Prerequisites (macOS)
Install Flutter SDK and Java JDK:
```bash
brew install --cask flutter
brew install openjdk@17
brew install --cask android-studio
```

Verify your setup:
```bash
flutter doctor
```

### 2. Configure Backend Connectivity
In `mobile/lib/core/constants/api_constants.dart`:
- Android Emulator: defaults to `http://10.0.2.2:8000`
- Physical Android Phone: update to your computer's local Wi-Fi IP (e.g., `http://192.168.1.100:8000`)

### 3. Run the App in Development
Ensure the backend is running (`./backend/run_backend.sh`), then execute:
```bash
cd mobile
flutter pub get
flutter run
```

### 4. Build the Android APK
Run the automated build script:
```bash
./mobile/build_apk.sh
```
Or run directly:
```bash
cd mobile
flutter pub get
flutter build apk --debug
```
**Compiled APK Output Location:**
```
mobile/build/app/outputs/flutter-apk/app-debug.apk
```

To install on a connected Android phone or emulator:
```bash
adb install -r mobile/build/app/outputs/flutter-apk/app-debug.apk
```

---

## 🔑 Demo Test Accounts

| Role | Email | Password |
|---|---|---|
| **Citizen** | `citizen@waste2worth.org` | `Citizen@123` |
| **Waste Collector** | `collector@waste2worth.org` | `Collector@123` |
| **Admin** | `admin@waste2worth.org` | `Admin@123` |

*Quick login chips are built into the mobile login screen for instant testing.*
