(function() {
    function initApp() {
        // Global State Management
        const state = {
            rawData: [],
            filteredData: [],
            chronologicalData: [], // Sorted oldest to newest for timeline
            activeFilters: {
                searchQuery: "",
                minMag: 3.0,
                depthCategory: "all"
            },
            visualizationMode: "markers", // 'markers', 'clusters', 'heatmap'
            map: {
                instance: null,
                markersGroup: null,
                clusterGroup: null,
                heatLayer: null,
                baseLayers: {},
                activeBaseLayer: "Dark Matter"
            },
            charts: {
                magnitudeDist: null,
                depthScatter: null
            },
            playback: {
                isPlaying: false,
                currentIndex: 0,
                intervalId: null,
                speeds: [1, 2, 5, 10],
                speedIndex: 0 // Default 1x (translates to tick duration)
            }
        };

        try {
            // 1. Verify library dependencies are loaded
            if (typeof lucide === 'undefined') throw new Error("Lucide Icons library is not loaded. Ensure local/CDN script is active.");
            if (typeof L === 'undefined') throw new Error("Leaflet Mapping library is not loaded. Ensure local/CDN script is active.");
            if (typeof Chart === 'undefined') throw new Error("Chart.js library is not loaded. Ensure local/CDN script is active.");
            if (typeof EARTHQUAKE_DATA === 'undefined') throw new Error("EARTHQUAKE_DATA database (data.js) is not loaded.");

            // 2. Initialize Lucide Icons
            lucide.createIcons();

            // 3. Load & sort data
            state.rawData = [...EARTHQUAKE_DATA];
            state.chronologicalData = [...state.rawData].sort((a, b) => new Date(a.time) - new Date(b.time));
        // Initialize application components
        initMap();
        initCharts();
        initFilters();
        initTimeline();
        
        // First paint
        applyFilters();
    } catch (error) {
        console.error("Aegis Myanmar Initialization Failed:", error);
        
        // Display diagnostic glassmorphic error panel directly in map container
        const mapContainer = document.getElementById("map");
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(13, 18, 32, 0.95);
                    border: 1px solid var(--crimson);
                    border-radius: var(--radius-md);
                    padding: 30px;
                    max-width: 500px;
                    text-align: center;
                    box-shadow: var(--shadow-box);
                    z-index: 9999;
                    backdrop-filter: blur(10px);
                ">
                    <i data-lucide="alert-triangle" style="color: var(--crimson); width: 48px; height: 48px; margin-bottom: 16px; display: inline-block;"></i>
                    <h3 style="font-family: var(--font-mono); color: var(--text-primary); margin-bottom: 12px; letter-spacing: 1px;">INITIALIZATION FAILURE</h3>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 16px; line-height: 1.5;">
                        The dashboard application failed to initialize due to a runtime exception.
                    </p>
                    <div style="
                        background: rgba(0,0,0,0.3);
                        border: 1px solid rgba(255,255,255,0.05);
                        padding: 12px;
                        border-radius: var(--radius-sm);
                        font-family: monospace;
                        font-size: 0.75rem;
                        color: var(--crimson);
                        text-align: left;
                        overflow-x: auto;
                        white-space: pre-wrap;
                    ">${error.stack || error.message || error}</div>
                </div>
            `;
            // Re-render icons inside error panel
            if (window.lucide) {
                lucide.createIcons();
            }
        }
    }

    // ----------------------------------------------------
    // Map Initialization
    // ----------------------------------------------------
    function initMap() {
        // Center of Myanmar coordinates
        const myanmarCenter = [21.5, 96.0];
        const defaultZoom = 6;

        // Initialize Map Instance
        state.map.instance = L.map("map", {
            center: myanmarCenter,
            zoom: defaultZoom,
            zoomControl: false, // Customized position below
            attributionControl: true
        });

        // Add custom positioned zoom controls
        L.control.zoom({ position: 'topright' }).addTo(state.map.instance);

        // Define beautiful, professional basemaps
        state.map.baseLayers = {
            "Dark Matter": L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }),
            "Voyager (Light)": L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }),
            "Satellite Imagery": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            })
        };

        // Set default layer
        state.map.baseLayers["Dark Matter"].addTo(state.map.instance);

        // Add layer selector control
        L.control.layers(state.map.baseLayers, null, { position: 'topright' }).addTo(state.map.instance);

        // Listen for base layer changes to adjust aesthetics if necessary
        state.map.instance.on('baselayerchange', (e) => {
            state.map.activeBaseLayer = e.name;
        });

        // Create overlay layers
        state.map.markersGroup = L.featureGroup().addTo(state.map.instance);
        
        state.map.clusterGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            iconCreateFunction: function(cluster) {
                const childCount = cluster.getChildCount();
                let cClass = ' cluster-small';
                if (childCount > 15) {
                    cClass = ' cluster-medium';
                }
                if (childCount > 40) {
                    cClass = ' cluster-large';
                }
                return new L.DivIcon({ 
                    html: `<div><span>${childCount}</span></div>`, 
                    className: 'marker-cluster-custom' + cClass, 
                    iconSize: new L.Point(40, 40) 
                });
            }
        });
    }

    // ----------------------------------------------------
    // Dynamic Rendering Engine (Markers, Clusters, Heatmaps)
    // ----------------------------------------------------
    function renderMapData() {
        // Clear previous layer objects
        state.map.markersGroup.clearLayers();
        state.map.clusterGroup.clearLayers();
        if (state.map.heatLayer) {
            state.map.instance.removeLayer(state.map.heatLayer);
            state.map.heatLayer = null;
        }

        const dataToRender = state.playback.isPlaying 
            ? state.chronologicalData.slice(0, state.playback.currentIndex + 1)
            : state.filteredData;

        if (state.visualizationMode === "markers") {
            dataToRender.forEach(eq => {
                const marker = createCustomMarker(eq);
                state.map.markersGroup.addLayer(marker);
            });
            state.map.instance.addLayer(state.map.markersGroup);
        } 
        else if (state.visualizationMode === "clusters") {
            dataToRender.forEach(eq => {
                const marker = createCustomMarker(eq);
                state.map.clusterGroup.addLayer(marker);
            });
            state.map.instance.addLayer(state.map.clusterGroup);
        } 
        else if (state.visualizationMode === "heatmap") {
            // Setup heatmap arrays: [lat, lng, weight]
            // Scale weight by magnitude raised to highlight strong tremors
            const heatPoints = dataToRender.map(eq => [
                eq.latitude,
                eq.longitude,
                Math.max(0.1, (eq.mag - 2.5) / 5) 
            ]);

            state.map.heatLayer = L.heatLayer(heatPoints, {
                radius: 25,
                blur: 15,
                maxZoom: 10,
                gradient: {
                    0.2: '#00f2fe',  // Cyan
                    0.5: '#ffd200',  // Gold
                    0.8: '#ff0055',  // Crimson
                    1.0: '#ff00ff'   // Magenta glow
                }
            }).addTo(state.map.instance);
        }
    }

    // Custom proportional pulsing SVG marker factory
    function createCustomMarker(eq) {
        const magnitude = parseFloat(eq.mag);
        const depth = parseFloat(eq.depth);
        
        // Define color category based on depth
        let colorClass = "shallow";
        let markerColor = "var(--depth-shallow)";
        let shadowColor = "var(--cyan-glow)";
        
        if (depth >= 70 && depth <= 150) {
            colorClass = "intermediate";
            markerColor = "var(--depth-intermediate)";
            shadowColor = "var(--gold-glow)";
        } else if (depth > 150) {
            colorClass = "deep";
            markerColor = "var(--depth-deep)";
            shadowColor = "var(--crimson-glow)";
        }

        // Proportional sizing: base 10px, scaling up based on Richter magnitude
        const size = Math.max(12, 10 + (magnitude - 3.0) * 8);
        const pulseSize = size * (magnitude >= 5.5 ? 3.0 : 2.2);

        // Select pulsing speed based on magnitude severity
        const pulseClass = magnitude >= 5.5 ? "animate-pulse-fast" : "animate-pulse-slow";

        const customIcon = L.divIcon({
            className: "custom-seismic-marker",
            html: `
                <div class="marker-ring-container" style="width: ${pulseSize}px; height: ${pulseSize}px;">
                    <div class="marker-pulse ${pulseClass}" style="
                        width: 100%; 
                        height: 100%; 
                        background-color: ${markerColor};
                        box-shadow: 0 0 12px ${shadowColor};
                    "></div>
                    <div class="marker-core" style="
                        width: ${size}px; 
                        height: ${size}px; 
                        background: radial-gradient(circle, #ffffff 10%, ${markerColor} 100%);
                        box-shadow: 0 0 8px rgba(0,0,0,0.8);
                    "></div>
                </div>
            `,
            iconSize: [pulseSize, pulseSize],
            iconAnchor: [pulseSize/2, pulseSize/2]
        });

        const marker = L.marker([eq.latitude, eq.longitude], { icon: customIcon });

        // Build premium, glassmorphic detailed popups
        const placeName = eq.place.replace(', Burma (Myanmar)', '').replace(', Myanmar', '');
        const dateObj = new Date(eq.time);
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
            year: 'numeric', month: 'short', day: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
        });

        const popupHTML = `
            <div class="popup-card">
                <div class="popup-header">
                    <div class="popup-mag ${colorClass}">
                        <span style="font-size: 0.65rem; text-transform: uppercase; font-family: var(--font-sans); font-weight: 500; margin-bottom: -2px;">Mag</span>
                        ${magnitude.toFixed(1)}
                    </div>
                    <div class="popup-title-area">
                        <div class="popup-title">${placeName}</div>
                        <div class="popup-time">${formattedDate}</div>
                    </div>
                </div>
                <div class="popup-body">
                    <div class="popup-grid">
                        <div class="popup-grid-item">
                            <span class="popup-grid-label">Focal Depth</span>
                            <span class="popup-grid-val">${depth.toFixed(1)} km</span>
                        </div>
                        <div class="popup-grid-item">
                            <span class="popup-grid-label">Seismic Class</span>
                            <span class="popup-grid-val" style="text-transform: capitalize; color: ${markerColor}; font-weight: 600;">${colorClass}</span>
                        </div>
                        <div class="popup-grid-item">
                            <span class="popup-grid-label">Latitude</span>
                            <span class="popup-grid-val">${parseFloat(eq.latitude).toFixed(4)}&deg; N</span>
                        </div>
                        <div class="popup-grid-item">
                            <span class="popup-grid-label">Longitude</span>
                            <span class="popup-grid-val">${parseFloat(eq.longitude).toFixed(4)}&deg; E</span>
                        </div>
                    </div>
                </div>
                <div class="popup-footer">
                    <button class="popup-btn" id="popup-btn-${eq.id}">Center Dashboard</button>
                </div>
            </div>
        `;

        marker.bindPopup(popupHTML);

        // Add event listener inside popup when opened
        marker.on('popupopen', () => {
            const btn = document.getElementById(`popup-btn-${eq.id}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    focusEventOnDashboard(eq);
                });
            }
        });

        return marker;
    }

    // ----------------------------------------------------
    // Filters Panel Engine
    // ----------------------------------------------------
    function initFilters() {
        // Keyword Search input
        const searchInput = document.getElementById("search-filter");
        searchInput.addEventListener("input", (e) => {
            state.activeFilters.searchQuery = e.target.value.trim();
            // Stop playback if user searches to prevent jarring views
            stopTimelinePlayback();
            applyFilters();
        });

        // Magnitude Slider
        const magSlider = document.getElementById("mag-filter");
        const magSliderLabel = document.getElementById("mag-filter-val");
        magSlider.addEventListener("input", (e) => {
            const val = parseFloat(e.target.value);
            state.activeFilters.minMag = val;
            magSliderLabel.textContent = `${val.toFixed(1)} M`;
            stopTimelinePlayback();
            applyFilters();
        });

        // Depth Tabs Selector
        const depthTabs = document.querySelectorAll("#depth-filter-tabs .filter-tab");
        depthTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                depthTabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                state.activeFilters.depthCategory = tab.getAttribute("data-depth");
                stopTimelinePlayback();
                applyFilters();
            });
        });

        // Visualizations Layer Mode toggles
        const visOptions = document.querySelectorAll(".vis-option");
        visOptions.forEach(opt => {
            opt.addEventListener("click", () => {
                visOptions.forEach(o => o.classList.remove("active"));
                opt.classList.add("active");
                state.visualizationMode = opt.getAttribute("data-vis");
                renderMapData();
            });
        });

        // Mobile toggle filters drawer
        const mobileToggle = document.getElementById("mobile-toggle");
        const sidebar = document.getElementById("sidebar-filters");
        mobileToggle.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }

    function applyFilters() {
        const filters = state.activeFilters;
        
        state.filteredData = state.rawData.filter(eq => {
            const magVal = parseFloat(eq.mag);
            const depthVal = parseFloat(eq.depth);
            const placeStr = eq.place.toLowerCase();

            // 1. Min Magnitude filter
            if (magVal < filters.minMag) return false;

            // 2. Focal Depth category filter
            if (filters.depthCategory !== "all") {
                if (filters.depthCategory === "shallow" && depthVal >= 70) return false;
                if (filters.depthCategory === "inter" && (depthVal < 70 || depthVal > 150)) return false;
                if (filters.depthCategory === "deep" && depthVal <= 150) return false;
            }

            // 3. Place keyword filter
            if (filters.searchQuery) {
                if (!placeStr.includes(filters.searchQuery.toLowerCase())) return false;
            }

            return true;
        });

        // Update statistics metrics inside header
        updateHeaderStats();

        // Update analytical widgets
        updateCharts();

        // Refresh Map pins
        renderMapData();

        // Refresh Major Events Carousel list
        renderFeaturedEvents();
    }

    // ----------------------------------------------------
    // Dynamic Stats Panels Updates
    // ----------------------------------------------------
    function updateHeaderStats() {
        const activeData = state.filteredData;
        const totalCount = activeData.length;
        
        document.getElementById("stat-total-count").textContent = totalCount;

        if (totalCount > 0) {
            const magnitudes = activeData.map(e => parseFloat(e.mag));
            const depths = activeData.map(e => parseFloat(e.depth));
            const majorCount = activeData.filter(e => parseFloat(e.mag) >= 5.5).length;

            const maxMag = Math.max(...magnitudes);
            const deepest = Math.max(...depths);

            document.getElementById("stat-max-mag").textContent = maxMag.toFixed(1);
            document.getElementById("stat-deepest").textContent = `${deepest.toFixed(1)} km`;
            document.getElementById("stat-major-count").textContent = majorCount;
        } else {
            document.getElementById("stat-max-mag").textContent = "0.0";
            document.getElementById("stat-deepest").textContent = "0.0 km";
            document.getElementById("stat-major-count").textContent = 0;
        }
    }

    // ----------------------------------------------------
    // Chart.js Dashboard Engine
    // ----------------------------------------------------
    function initCharts() {
        // Global Chart Defaults styling for gorgeous dark theme integration
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = "'Outfit', sans-serif";
        Chart.defaults.font.size = 11;

        // 1. Magnitude Distribution Chart
        const magCtx = document.getElementById("chart-magnitude").getContext("2d");
        
        // Define gorgeous gradients
        const cyanGrad = magCtx.createLinearGradient(0, 0, 0, 140);
        cyanGrad.addColorStop(0, 'rgba(0, 242, 254, 0.8)');
        cyanGrad.addColorStop(1, 'rgba(0, 242, 254, 0.1)');

        state.charts.magnitudeDist = new Chart(magCtx, {
            type: 'bar',
            data: {
                labels: ['3.0-3.9', '4.0-4.9', '5.0-5.9', '6.0-6.9', '7.0+'],
                datasets: [{
                    label: 'Quake Count',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: cyanGrad,
                    borderColor: 'var(--cyan)',
                    borderWidth: 1.5,
                    borderRadius: 4,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(13, 18, 32, 0.95)',
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                        borderWidth: 1,
                        titleFont: { family: "'Space Grotesk', sans-serif", weight: 'bold' },
                        bodyFont: { family: "'Outfit', sans-serif" }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.04)' },
                        ticks: { precision: 0 }
                    }
                }
            }
        });

        // 2. Depth vs Magnitude Scatter Chart
        const scatterCtx = document.getElementById("chart-depth-mag").getContext("2d");
        state.charts.depthScatter = new Chart(scatterCtx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Shallow (<70km)',
                        data: [],
                        backgroundColor: 'rgba(0, 242, 254, 0.75)',
                        borderColor: 'var(--cyan)',
                        borderWidth: 1,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Medium (70-150km)',
                        data: [],
                        backgroundColor: 'rgba(255, 210, 0, 0.75)',
                        borderColor: 'var(--gold)',
                        borderWidth: 1,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Deep (>150km)',
                        data: [],
                        backgroundColor: 'rgba(255, 0, 85, 0.75)',
                        borderColor: 'var(--crimson)',
                        borderWidth: 1,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Save space on widgets
                    },
                    tooltip: {
                        backgroundColor: 'rgba(13, 18, 32, 0.95)',
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                        borderWidth: 1,
                        titleFont: { family: "'Space Grotesk', sans-serif", weight: 'bold' },
                        bodyFont: { family: "'Outfit', sans-serif" },
                        callbacks: {
                            label: function(context) {
                                return `Mag: ${context.parsed.x.toFixed(1)} | Depth: ${context.parsed.y.toFixed(1)} km`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Magnitude (Richter)', color: 'var(--text-secondary)' },
                        grid: { color: 'rgba(255, 255, 255, 0.03)' },
                        min: 3.0,
                        max: 8.0
                    },
                    y: {
                        title: { display: true, text: 'Focal Depth (km)', color: 'var(--text-secondary)' },
                        grid: { color: 'rgba(255, 255, 255, 0.03)' },
                        reverse: true, // Deep is down
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function updateCharts() {
        const activeData = state.playback.isPlaying
            ? state.chronologicalData.slice(0, state.playback.currentIndex + 1)
            : state.filteredData;

        // 1. Compute Magnitude distribution bins
        const bins = [0, 0, 0, 0, 0]; // 3.x, 4.x, 5.x, 6.x, 7.x+
        
        // Scatter data lists
        const shallowPoints = [];
        const mediumPoints = [];
        const deepPoints = [];

        activeData.forEach(eq => {
            const mag = parseFloat(eq.mag);
            const depth = parseFloat(eq.depth);

            // Bins
            if (mag >= 3.0 && mag < 4.0) bins[0]++;
            else if (mag >= 4.0 && mag < 5.0) bins[1]++;
            else if (mag >= 5.0 && mag < 6.0) bins[2]++;
            else if (mag >= 6.0 && mag < 7.0) bins[3]++;
            else if (mag >= 7.0) bins[4]++;

            // Scatter mapping
            const pt = { x: mag, y: depth };
            if (depth < 70) shallowPoints.push(pt);
            else if (depth >= 70 && depth <= 150) mediumPoints.push(pt);
            else if (depth > 150) deepPoints.push(pt);
        });

        // Update Chart 1 data
        if (state.charts.magnitudeDist) {
            state.charts.magnitudeDist.data.datasets[0].data = bins;
            state.charts.magnitudeDist.update('none'); // Animate smoothly
        }

        // Update Chart 2 scatter datasets
        if (state.charts.depthScatter) {
            state.charts.depthScatter.data.datasets[0].data = shallowPoints;
            state.charts.depthScatter.data.datasets[1].data = mediumPoints;
            state.charts.depthScatter.data.datasets[2].data = deepPoints;
            state.charts.depthScatter.update('none');
        }
    }

    // ----------------------------------------------------
    // Historical Highlights Carousel (Major Events)
    // ----------------------------------------------------
    function renderFeaturedEvents() {
        const container = document.getElementById("featured-events-carousel");
        container.innerHTML = "";

        // Filter events magnitude >= 5.0 and sort by magnitude descending
        const featured = state.filteredData
            .filter(eq => parseFloat(eq.mag) >= 5.0)
            .sort((a, b) => parseFloat(b.mag) - parseFloat(a.mag));

        if (featured.length === 0) {
            container.innerHTML = `
                <div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 20px;">
                    No events matching filter &ge; 5.0 M
                </div>
            `;
            return;
        }

        featured.forEach(eq => {
            const depthVal = parseFloat(eq.depth);
            const magVal = parseFloat(eq.mag);
            
            let colorClass = "shallow";
            if (depthVal >= 70 && depthVal <= 150) colorClass = "intermediate";
            else if (depthVal > 150) colorClass = "deep";

            const placeClean = eq.place.replace(', Burma (Myanmar)', '').replace(', Myanmar', '');
            const yearStr = new Date(eq.time).getFullYear();

            // Set dynamic card severity highlights for massive events like the 7.7 Mandalay Earthquake
            const cardSeverityClass = magVal >= 6.5 ? "featured-card severe" : "featured-card";

            const card = document.createElement("div");
            card.className = cardSeverityClass;
            card.innerHTML = `
                <div class="featured-mag-badge ${colorClass}">
                    ${magVal.toFixed(1)}
                    <span style="font-size: 0.5rem; font-weight: 500; margin-top: -2px;">Mag</span>
                </div>
                <div class="featured-card-info">
                    <div class="featured-card-place" title="${eq.place}">${placeClean}</div>
                    <div class="featured-card-meta">
                        <span>Depth: ${depthVal.toFixed(0)} km</span>
                        <span>Year: ${yearStr}</span>
                    </div>
                </div>
            `;

            card.addEventListener("click", () => {
                flyToEarthquake(eq);
            });

            container.appendChild(card);
        });
    }

    // Camera dramatic fly-to with highlighting ring pulse
    function flyToEarthquake(eq) {
        // Fly camera
        state.map.instance.flyTo([eq.latitude, eq.longitude], 9, {
            animate: true,
            duration: 1.8
        });

        // Trigger dynamic highlighting ripple ring
        state.map.instance.once("zoomend moveend", () => {
            // Find active layers in map markers group
            let foundMarker = null;
            
            // Search either cluster layer or standard marker layer
            const targetGroup = state.visualizationMode === "clusters" 
                ? state.map.clusterGroup 
                : state.map.markersGroup;

            targetGroup.eachLayer(layer => {
                const latlng = layer.getLatLng();
                if (latlng.lat === parseFloat(eq.latitude) && latlng.lng === parseFloat(eq.longitude)) {
                    foundMarker = layer;
                }
            });

            if (foundMarker) {
                // Open Marker Popup programmatically
                foundMarker.openPopup();
            } else if (state.visualizationMode === "heatmap") {
                // Bind temporary popup if in heatmap mode
                const tempPopup = L.popup()
                    .setLatLng([eq.latitude, eq.longitude])
                    .setContent(`
                        <div style="font-family: var(--font-sans); color: var(--text-primary); padding: 8px 12px; font-size: 0.8rem;">
                            <strong>${eq.place}</strong><br>
                            Mag: ${parseFloat(eq.mag).toFixed(1)} | Depth: ${parseFloat(eq.depth).toFixed(1)} km
                        </div>
                    `)
                    .openOn(state.map.instance);
            }
        });
    }

    // When clicking "Center Dashboard" inside map popup
    function focusEventOnDashboard(eq) {
        // Highlight in statistics panel
        document.getElementById("stat-max-mag").textContent = parseFloat(eq.mag).toFixed(1);
        document.getElementById("stat-deepest").textContent = `${parseFloat(eq.depth).toFixed(1)} km`;

        // Pulse the statistics ticker to highlight focus
        const ticker = document.getElementById("header-metrics-banner");
        ticker.style.border = "1px solid var(--cyan)";
        ticker.style.boxShadow = "0 0 15px var(--cyan-glow)";
        
        setTimeout(() => {
            ticker.style.border = "none";
            ticker.style.boxShadow = "none";
        }, 1500);

        // Flash chart matching point
        if (state.charts.depthScatter) {
            // Highlighting point can be done by filtering or updating state,
            // but just keeping stats pulsed is extremely sleek!
        }
    }

    // ----------------------------------------------------
    // Chronological Playback Simulator (Time-lapse)
    // ----------------------------------------------------
    function initTimeline() {
        const playBtn = document.getElementById("timeline-play");
        const playIcon = document.getElementById("play-icon");
        const prevBtn = document.getElementById("timeline-prev");
        const nextBtn = document.getElementById("timeline-next");
        const speedBtn = document.getElementById("timeline-speed");
        const progressSlider = document.getElementById("timeline-progress");
        const dateLabel = document.getElementById("timeline-date-label");

        // Set max limit of progress bar based on dataset size
        progressSlider.max = state.chronologicalData.length - 1;
        progressSlider.value = 0;

        // Ticking loop function
        function playbackTick() {
            if (state.playback.currentIndex < state.chronologicalData.length - 1) {
                state.playback.currentIndex++;
                progressSlider.value = state.playback.currentIndex;
                updateTimelineFrame();
            } else {
                // End of timeline, loop back or stop
                stopTimelinePlayback();
            }
        }

        function startTimelinePlayback() {
            if (state.playback.isPlaying) return;
            state.playback.isPlaying = true;
            playIcon.setAttribute("data-lucide", "pause");
            lucide.createIcons();

            // If starting from very end, loop to start
            if (state.playback.currentIndex >= state.chronologicalData.length - 1) {
                state.playback.currentIndex = 0;
                progressSlider.value = 0;
            }

            // Map speed factor to interval milliseconds
            // speeds: [1x, 2x, 5x, 10x] maps to [400ms, 200ms, 80ms, 40ms]
            const activeSpeed = state.playback.speeds[state.playback.speedIndex];
            const intervalMs = Math.max(30, 400 / activeSpeed);

            state.playback.intervalId = setInterval(playbackTick, intervalMs);
            updateTimelineFrame();
        }

        function stopTimelinePlayback() {
            if (!state.playback.isPlaying) return;
            state.playback.isPlaying = false;
            playIcon.setAttribute("data-lucide", "play");
            lucide.createIcons();

            clearInterval(state.playback.intervalId);
            state.playback.intervalId = null;
        }

        // Action: Play/Pause button
        playBtn.addEventListener("click", () => {
            if (state.playback.isPlaying) {
                stopTimelinePlayback();
            } else {
                startTimelinePlayback();
            }
        });

        // Action: Slider drag
        progressSlider.addEventListener("input", (e) => {
            state.playback.currentIndex = parseInt(e.target.value);
            updateTimelineFrame();
        });

        // Action: Previous Step
        prevBtn.addEventListener("click", () => {
            stopTimelinePlayback();
            if (state.playback.currentIndex > 0) {
                state.playback.currentIndex--;
                progressSlider.value = state.playback.currentIndex;
                updateTimelineFrame();
            }
        });

        // Action: Next Step
        nextBtn.addEventListener("click", () => {
            stopTimelinePlayback();
            if (state.playback.currentIndex < state.chronologicalData.length - 1) {
                state.playback.currentIndex++;
                progressSlider.value = state.playback.currentIndex;
                updateTimelineFrame();
            }
        });

        // Action: Speed Control Toggle (1x, 2x, 5x, 10x)
        speedBtn.addEventListener("click", () => {
            state.playback.speedIndex = (state.playback.speedIndex + 1) % state.playback.speeds.length;
            const multiplier = state.playback.speeds[state.playback.speedIndex];
            speedBtn.querySelector("span").textContent = `${multiplier}x`;

            // If active playing, restart tick timer with new speed
            if (state.playback.isPlaying) {
                stopTimelinePlayback();
                startTimelinePlayback();
            }
        });

        // External listener to halt timeline playback if other widgets interact
        state.stopPlayback = stopTimelinePlayback;

        // Initialize label with first date
        if (state.chronologicalData.length > 0) {
            const firstDate = new Date(state.chronologicalData[0].time);
            dateLabel.textContent = firstDate.toLocaleDateString();
        }
    }

    // Refresh frames, updating labels, map rendering, and charts data chronologically
    function updateTimelineFrame() {
        const dateLabel = document.getElementById("timeline-date-label");
        const idx = state.playback.currentIndex;
        
        if (idx < 0 || idx >= state.chronologicalData.length) return;

        const eq = state.chronologicalData[idx];
        const dateObj = new Date(eq.time);
        
        // Update Label
        dateLabel.textContent = dateObj.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        }) + ` (${idx + 1} / ${state.chronologicalData.length})`;

        // Re-paint map content representing chronology
        renderMapData();

        // Update charts to reflect cumulative timeline data
        updateCharts();
    }

    // Helper hook to stop timeline playback when search filters are changed
    function stopTimelinePlayback() {
        if (state.stopPlayback) {
            state.stopPlayback();
        }
    }
    }

    // Safely trigger initialization immediately if DOM is already loaded
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initApp);
    } else {
        initApp();
    }
})();
