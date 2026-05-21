# 🛡️ Aegis Myanmar — Interactive Seismic Hazard Monitor & Analysis Portal

A highly polished, premium, single-page interactive seismic activity dashboard visualizing historical earthquake datasets in Myanmar (Burma) from **March 2025 to May 2026**. 

Built entirely with modern web technologies, the portal features a rich dark glassmorphic design, customized responsive layouts, dynamic data visualizations, and an offline-first architecture.

👉 **[Live Interactive Demo](https://geonet-myanmar.github.io/mm-quakes-20250328-20260518/)**

---

## 🌟 Key Features

### 1. Multi-Mode Interactive Mapping (Leaflet)
* **Seismic Pins Layer**: Custom SVG indicators whose size scales proportionally to Richter magnitude, featuring ambient breathing pulse animations colored by focal depth.
* **Marker Clustering Layer**: Cleans up high-density seismic zones into beautiful consolidated clusters showing region-wide counts.
* **Seismic Heatmap Layer**: Evaluates and displays a dynamic intensity gradient showing hotspots of cumulative seismic energy release.
* **Custom Basemaps**: Smooth toggle selector supporting Dark Matter tiles, Voyager (Light), and high-resolution Esri Satellite imagery.

### 2. Live Analytics Dashboard (Chart.js)
* **Magnitude Distribution**: Neon-colored frequency vertical bar chart displaying counts across Richter scale ranges.
* **Focal Depth vs. Magnitude Scatter Plot**: Plots seismic events on a multi-dimensional matrix, mapped to depth colors, using a reverse depth scale illustrating subduction zones.

### 3. Chronological Time-Lapse Player
* A dynamic progression simulator that allows you to play back historical earthquake sequences sequentially.
* Fully loaded with **Play/Pause**, **Next Step**, **Previous Step**, and adjustable speeds (**1x, 2x, 5x, 10x**) to watch aftershocks build up over time.

### 4. Advanced Real-Time Filters & Search
* Live double-sided sliding filter for **Minimum Magnitude**.
* Tab filters for **Focal Depth Categories**:
  * 🟢 **Shallow (< 70 km)** — Primary crustal faults (Electric Cyan)
  * 🟡 **Medium (70 - 150 km)** — Subduction zone interactions (Gold)
  * 🔴 **Deep (> 150 km)** — Upper mantle slips (Crimson)
* **Smart Search**: Real-time keyword filter searching through locations, cities, distances, and regions instantly.

### 5. Spotlight Highlights Carousel
* Automatic sorting of massive historical tremors (magnitude $\ge 5.0$).
* Hover and click integrations: Clicking any event card triggers a dramatic camera glide (`flyTo`), focuses the viewport, and opens a glowing detailed glassmorphic details card.

---

## 💎 Offline-First Architecture & Performance
To bypass browser security restrictions (CORS) when loading local files and to guarantee **100% offline functionality**:
* **Data Pre-Compilation**: Uses a Python data packer (`csv_to_js.py`) to convert raw CSV data into a highly optimized, structured JavaScript constant database (`data.js`).
* **Local Library Caching**: Contains all required stylesheets and scripts (Leaflet, Leaflet MarkerCluster, Leaflet Heatmap, Chart.js, Lucide Icons) inside the local `lib/` directory.
* **Zero External Dependencies**: The entire portal initializes and runs instantly even without an internet connection! Just double-click `index.html` on your desktop.

---

## 📂 Project Structure

```
├── lib/                             # Localized offline dependencies
│   ├── leaflet.js                   # Leaflet mapping engine
│   ├── leaflet.min.css              # Leaflet styles
│   ├── leaflet.markercluster.js     # Marker clustering script
│   ├── MarkerCluster.css            # Clustering core styling
│   ├── MarkerCluster.Default.css    # Clustering visual styles
│   ├── leaflet-heat.js              # Energy heatmap generator
│   ├── chart.umd.min.js             # Chart.js analytics engine
│   └── lucide.min.js                # Beautiful modern vector icons
├── index.html                       # Semantic HTML5 layout and head metadata
├── style.css                        # Premium glassmorphic design system and CSS animations
├── app.js                           # State controller, Leaflet wrapper, & Chart hooks
├── data.js                          # Compiled chronological earthquake JSON database
├── myanmar_earthquakes.csv          # Raw CSV dataset
├── csv_to_js.py                     # Python parser (CSV -> JS array)
├── download_libs.py                 # Utility script to fetch offline dependencies
└── README.md                        # Documentation portal
```

---

## 🚀 How to Run Locally

### Option A: Direct Execution (No Internet / No Server)
Go to the project folder, locate **`index.html`**, and double-click it. It will open and run in your default web browser instantly.

### Option B: Local Development Server
Open your terminal inside the project directory and spin up a lightweight python server:
```bash
python -m http.server 8000
```
Then visit: **`http://localhost:8000`** in your browser.

---

## 📊 Dataset Insights
* **Total Events Recorded**: 146
* **Maximum Magnitude**: **7.7 Richter** (Mandalay Region)
* **Deepest Epicenter**: **141.5 km** (NNW of Meiktila)
* **Dataset Period**: March 28, 2025 to May 18, 2026
