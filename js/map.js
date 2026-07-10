/**
 * SafeHer Leaflet Map and Nearby Services Controller Module
 */

class LeafletMapHelper {
  constructor() {
    this.routeMap = null;
    this.servicesMap = null;
    this.routeLayers = [];
    this.serviceMarkers = [];
    this.routeUserMarker = null;
    this.servicesUserMarker = null;
    this.routeTileLayer = null;
    this.servicesTileLayer = null;
    
    // Custom SVG Marker Icons styling for map points
    this.icons = {
      user: L.divIcon({
        html: '<div style="background-color: var(--primary); width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px var(--primary);"></div>',
        className: 'custom-user-marker',
        iconSize: [16, 16]
      }),
      start: L.divIcon({
        html: '<div style="background-color: #00E676; width:18px; height:18px; border-radius:50%; border:2px solid white; display:flex; align-items:center; justify-content:center; color:white; font-size:10px;"><i class="fa-solid fa-flag"></i></div>',
        className: 'custom-start-marker',
        iconSize: [18, 18]
      }),
      dest: L.divIcon({
        html: '<div style="background-color: var(--accent-sos); width:18px; height:18px; border-radius:50%; border:2px solid white; display:flex; align-items:center; justify-content:center; color:white; font-size:10px;"><i class="fa-solid fa-location-dot"></i></div>',
        className: 'custom-dest-marker',
        iconSize: [18, 18]
      }),
      police: L.divIcon({
        html: '<div style="background-color: #00B0FF; width:32px; height:32px; border-radius:50%; border:2px solid white; display:flex; align-items:center; justify-content:center; color:white; font-size:14px; box-shadow:0 2px 10px rgba(0,176,255,0.4);"><i class="fa-solid fa-building-shield"></i></div>',
        className: 'custom-service-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      }),
      hospital: L.divIcon({
        html: '<div style="background-color: #FF2A54; width:32px; height:32px; border-radius:50%; border:2px solid white; display:flex; align-items:center; justify-content:center; color:white; font-size:14px; box-shadow:0 2px 10px rgba(255,42,84,0.4);"><i class="fa-solid fa-hospital-user"></i></div>',
        className: 'custom-service-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      }),
      women: L.divIcon({
        html: '<div style="background-color: #00E676; width:32px; height:32px; border-radius:50%; border:2px solid white; display:flex; align-items:center; justify-content:center; color:white; font-size:14px; box-shadow:0 2px 10px rgba(0,230,118,0.4);"><i class="fa-solid fa-hands-holding-child"></i></div>',
        className: 'custom-service-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    };

    this.servicesDb = [];
  }

  generateNearbyServices(lat, lng) {
    this.servicesDb = [
      {
        id: "p1",
        name: "District Safety Police Precinct",
        type: "police",
        lat: lat + 0.003,
        lng: lng + 0.002,
        distance: "0.4 km",
        phone: "+1 555-011-9111",
        address: "Safety Command Lane, 1st Block"
      },
      {
        id: "p2",
        name: "Metropolitan Police Patrol Hub",
        type: "police",
        lat: lat - 0.005,
        lng: lng - 0.004,
        distance: "1.2 km",
        phone: "+1 555-011-9222",
        address: "Central Plaza Boulevard, Civic Sector"
      },
      {
        id: "h1",
        name: "General Hospital Crisis Clinic",
        type: "hospital",
        lat: lat + 0.008,
        lng: lng - 0.006,
        distance: "1.8 km",
        phone: "+1 555-019-3333",
        address: "Medical Center Drive, Emergency Gate"
      },
      {
        id: "h2",
        name: "St. Jude Women's Healthcare Wing",
        type: "hospital",
        lat: lat - 0.004,
        lng: lng + 0.005,
        distance: "1.6 km",
        phone: "+1 555-019-4444",
        address: "Caring Crossroad Way, East Avenue"
      },
      {
        id: "w1",
        name: "Sakhi Women One-Stop Center",
        type: "women",
        lat: lat + 0.001,
        lng: lng - 0.002,
        distance: "0.9 km",
        phone: "+1 555-014-5555",
        address: "Hope and Protection Center House"
      },
      {
        id: "w2",
        name: "SafeHorizon Female Crisis Desk",
        type: "women",
        lat: lat - 0.006,
        lng: lng + 0.003,
        distance: "1.5 km",
        phone: "+1 555-014-6666",
        address: "Empowerment Pathway, West Side"
      }
    ];
  }

  // Initialize Maps
  initMaps() {
    // Determine active tile provider based on current theme state
    const isLight = document.body.classList.contains('light-theme');
    const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const lightTileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const tileUrl = isLight ? lightTileUrl : darkTileUrl;
    
    const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    const currentLat = window.currentUserPosition.lat;
    const currentLng = window.currentUserPosition.lng;

    // 1. Setup Route Planner Map
    const routeNode = document.getElementById('map-route-node');
    if (routeNode) {
      if (!this.routeMap) {
        this.routeMap = L.map('map-route-node', { zoomControl: false }).setView([currentLat, currentLng], 14);
        this.routeTileLayer = L.tileLayer(tileUrl, { attribution: tileAttribution }).addTo(this.routeMap);
        L.control.zoom({ position: 'bottomright' }).addTo(this.routeMap);
        // Place user marker
        this.routeUserMarker = L.marker([currentLat, currentLng], { icon: this.icons.user }).addTo(this.routeMap).bindPopup("Current Location");
      } else {
        // Map container visibility changed - force recalculate sizes!
        this.routeMap.invalidateSize();
      }
    }

    // 2. Setup Services Map
    const servicesNode = document.getElementById('map-services-node');
    if (servicesNode) {
      if (!this.servicesMap) {
        this.servicesMap = L.map('map-services-node', { zoomControl: false }).setView([currentLat, currentLng], 14);
        this.servicesTileLayer = L.tileLayer(tileUrl, { attribution: tileAttribution }).addTo(this.servicesMap);
        L.control.zoom({ position: 'bottomright' }).addTo(this.servicesMap);
        // Place user marker
        this.servicesUserMarker = L.marker([currentLat, currentLng], { icon: this.icons.user }).addTo(this.servicesMap).bindPopup("Your Location");

        this.generateNearbyServices(currentLat, currentLng);
        this.renderServicePins();
        this.bindServiceFilters();
      } else {
        // Map container visibility changed - force recalculate sizes!
        this.servicesMap.invalidateSize();
      }
    }
  }

  toggleMapTileset(isLight) {
    const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const lightTileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const tileUrl = isLight ? lightTileUrl : darkTileUrl;
    
    if (this.routeTileLayer) {
      this.routeTileLayer.setUrl(tileUrl);
    }
    if (this.servicesTileLayer) {
      this.servicesTileLayer.setUrl(tileUrl);
    }
  }

  updateUserMarkerPosition(lat, lng) {
    const latlng = [lat, lng];
    if (this.routeUserMarker && this.routeMap) {
      this.routeUserMarker.setLatLng(latlng);
    }
    if (this.servicesUserMarker && this.servicesMap) {
      this.servicesUserMarker.setLatLng(latlng);
    }
  }

  // Draw routes for Route view
  drawRoutesOnMap(safest, alternative) {
    if (!this.routeMap) return;

    // Clear previous shapes
    this.routeLayers.forEach(layer => this.routeMap.removeLayer(layer));
    this.routeLayers = [];

    // Draw Safest Route (Glowing Solid Purple/Green Line)
    const safestPoly = L.polyline(safest.path, {
      color: '#00E676',
      weight: 6,
      opacity: 0.85,
      lineCap: 'round'
    }).addTo(this.routeMap);
    
    // Draw Alternative Route (Dashed Crimson Line)
    const alternativePoly = L.polyline(alternative.path, {
      color: '#FF2A54',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.65,
      lineCap: 'round'
    }).addTo(this.routeMap);

    this.routeLayers.push(safestPoly, alternativePoly);

    // Place flag markers
    const startPoint = safest.path[0];
    const destPoint = safest.path[safest.path.length - 1];
    
    const startMarker = L.marker(startPoint, { icon: this.icons.start }).addTo(this.routeMap).bindPopup("Start Point");
    const destMarker = L.marker(destPoint, { icon: this.icons.dest }).addTo(this.routeMap).bindPopup("Destination Point");
    
    this.routeLayers.push(startMarker, destMarker);

    // Fit map bounds
    const group = new L.featureGroup([safestPoly, alternativePoly]);
    this.routeMap.fitBounds(group.getBounds(), { padding: [40, 40] });
  }

  // Render Emergency Pins on Map and list in Sidebar
  renderServicePins() {
    if (!this.servicesMap) return;

    // Clear old markers
    this.serviceMarkers.forEach(m => this.servicesMap.removeLayer(m.marker));
    this.serviceMarkers = [];

    // Filter toggle states from UI
    const activeTypes = Array.from(document.querySelectorAll('.service-toggle-btn.active'))
                             .map(btn => btn.dataset.type);

    const cardsContainer = document.getElementById('nearby-services-cards');
    cardsContainer.innerHTML = '';

    // Populate filtered items
    this.servicesDb.forEach(item => {
      if (activeTypes.includes(item.type)) {
        // Place marker on map
        const marker = L.marker([item.lat, item.lng], { icon: this.icons[item.type] }).addTo(this.servicesMap);
        marker.bindPopup(`
          <div style="color:var(--text-dark); font-family:sans-serif; min-width:160px;">
            <h4 style="margin-bottom:4px; font-weight:700;">${item.name}</h4>
            <p style="font-size:11px; margin-bottom:8px;">${item.address}</p>
            <p style="font-size:12px; margin-bottom:4px;"><b>Contact:</b> ${item.phone}</p>
            <p style="font-size:12px; color:var(--primary); font-weight:bold;">Distance: ${item.distance}</p>
          </div>
        `);

        this.serviceMarkers.push({ info: item, marker: marker });

        // Add side panel card lists
        const card = document.createElement('div');
        card.className = 'service-item-card';
        card.innerHTML = `
          <div class="service-item-type">${item.type} • ${item.distance} away</div>
          <div class="service-item-header">
            <strong>${item.name}</strong>
          </div>
          <div style="color:var(--text-muted); font-size:11px; margin-bottom:6px;">${item.address}</div>
          <div class="service-item-actions">
            <a href="tel:${item.phone}" class="btn-primary btn-service-action"><i class="fa-solid fa-phone"></i> Call Service</a>
            <button class="btn-secondary btn-service-action" onclick="window.leafletMapHelper.centerMapOn([${item.lat}, ${item.lng}], 16)"><i class="fa-solid fa-location-arrow"></i> Navigate</button>
          </div>
        `;
        cardsContainer.appendChild(card);
      }
    });

    if (this.serviceMarkers.length === 0) {
      cardsContainer.innerHTML = `<div style="text-align:center; padding:32px 0; color:var(--text-muted);">No services matching active filters.</div>`;
    }
  }

  // Toggle button bindings
  bindServiceFilters() {
    const buttons = document.querySelectorAll('.service-toggle-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        // Update styling of children badge
        const badge = btn.querySelector('.primary-badge');
        if (btn.classList.contains('active')) {
          badge.innerText = "Active";
          badge.style.opacity = "1";
        } else {
          badge.innerText = "Hidden";
          badge.style.opacity = "0.5";
        }
        this.renderServicePins();
      });
    });
  }

  // Utility helper to pan map
  centerMapOn(coords, zoom) {
    if (this.servicesMap) {
      this.servicesMap.setView(coords, zoom, { animate: true, duration: 0.8 });
    }
  }
}

// Instantiate globally
window.leafletMapHelper = new LeafletMapHelper();
