/**
 * SafeHer Route Risk Analysis & Route Finder Module
 */

class SafeRouter {
  constructor() {
    this.startInput = document.getElementById('route-start');
    this.destInput = document.getElementById('route-dest');
    this.riskCard = document.getElementById('route-risk-badge-box');
    
    // Safety badge elements
    this.riskStatus = document.getElementById('route-risk-status');
    this.timeVal = document.getElementById('route-val-time');
    this.distVal = document.getElementById('route-val-dist');
    this.lightsVal = document.getElementById('route-val-lights');
    this.crowdVal = document.getElementById('route-val-crowd');
    this.adviceVal = document.getElementById('route-safety-advice-text');
  }

  geocodeMock(address) {
    const clean = address.toLowerCase().trim();
    
    // 1. Check dictionary of preset locations
    if (clean.includes('my location') || clean.includes('current location') || clean === 'here') {
      return [window.currentUserPosition.lat, window.currentUserPosition.lng];
    }
    if (clean.includes('central park')) {
      return [40.7736, -73.9715];
    }
    if (clean.includes('metro') || clean.includes('grand station') || clean.includes('grand central')) {
      return [40.7527, -73.9772];
    }
    if (clean.includes('times square')) {
      return [40.7580, -73.9855];
    }
    if (clean.includes('empire state')) {
      return [40.7484, -73.9857];
    }
    if (clean.includes('brooklyn bridge')) {
      return [40.7061, -73.9969];
    }
    if (clean.includes('home')) {
      return [window.currentUserPosition.lat, window.currentUserPosition.lng];
    }
    if (clean.includes('work')) {
      return [window.currentUserPosition.lat + 0.005, window.currentUserPosition.lng - 0.004];
    }

    // 2. Fallback: Generate custom offset coordinates based on text hash
    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
      hash = clean.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert hash to deterministic offset between -0.015 and +0.015 degrees
    const latOffset = (hash % 150) / 10000;
    const lngOffset = ((hash >> 8) % 150) / 10000;

    return [
      window.currentUserPosition.lat + latOffset,
      window.currentUserPosition.lng + lngOffset
    ];
  }

  generatePath(start, end, deviation) {
    const latDiff = end[0] - start[0];
    const lngDiff = end[1] - start[1];

    // Build 4 points to form a realistic path grid
    const mid1 = [
      start[0] + latDiff * 0.35 + deviation * 0.001,
      start[1] + lngDiff * 0.25 - deviation * 0.0015
    ];
    const mid2 = [
      start[0] + latDiff * 0.70 - deviation * 0.0015,
      start[1] + lngDiff * 0.80 + deviation * 0.001
    ];

    return [start, mid1, mid2, end];
  }

  calculateSafeRoute() {
    const startText = this.startInput.value.trim();
    const destText = this.destInput.value.trim();
    
    if (!startText || !destText) {
      alert("Please fill in both Starting Location and Destination.");
      return;
    }

    const startCoord = this.geocodeMock(startText);
    const destCoord = this.geocodeMock(destText);

    // Calculate approximate distance based on coordinates (1 degree lat ~= 111km)
    const latDiff = destCoord[0] - startCoord[0];
    const lngDiff = destCoord[1] - startCoord[1];
    const rawDist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
    const distanceText = rawDist.toFixed(1) + " km";
    
    // Estimate transit times (assuming ~15km/h average walking/traffic speed)
    const timeMins = Math.round((rawDist / 15) * 60) + 2;
    const timeText = timeMins + " mins";

    // Dynamic risk percentage based on distance & destination hash
    const hasRiskKeywords = destText.toLowerCase().includes('dark') || destText.toLowerCase().includes('alley') || destText.toLowerCase().includes('construction');
    const lightsCover = hasRiskKeywords ? "38%" : (85 + (Math.abs(startCoord[0]) % 15)).toFixed(0) + "%";
    const riskLevel = hasRiskKeywords ? "High Risk" : (rawDist > 5 ? "Moderate Risk" : "Low Risk");
    const badgeClass = riskLevel === "Low Risk" ? "safe" : (riskLevel === "Moderate Risk" ? "moderate" : "high");
    
    const safestPath = this.generatePath(startCoord, destCoord, 1);
    const alternativePath = this.generatePath(startCoord, destCoord, -1.8);

    const routeData = {
      safest: {
        path: safestPath,
        distance: distanceText,
        time: timeText,
        lights: lightsCover + " Cover",
        crowd: riskLevel === "Low Risk" ? "High (Safe Transit)" : "Low (Unmonitored Zone)",
        risk: riskLevel,
        badgeClass: badgeClass,
        advice: riskLevel === "Low Risk" 
          ? "✅ RECOMMENDED: High illumination index detected along commercial lanes. Standard safety rating."
          : `⚠️ ALERT: This path involves areas with lower security profiles. Consider using our voice assistant or sharing progress.`
      },
      alternative: {
        path: alternativePath,
        distance: (rawDist * 1.2).toFixed(1) + " km",
        time: (timeMins + 4) + " mins",
        lights: "42% Cover",
        crowd: "Very Low",
        risk: "Moderate Risk",
        badgeClass: "moderate",
        advice: "Alternative route bypasses main streets and uses side avenues."
      }
    };

    // Update safety assessment scorecard values
    this.riskCard.className = "card-glass risk-score-card active";
    this.riskStatus.innerText = routeData.safest.risk;
    this.riskStatus.className = `risk-level-badge ${routeData.safest.badgeClass}`;
    this.timeVal.innerText = routeData.safest.time;
    this.distVal.innerText = routeData.safest.distance;
    this.lightsVal.innerText = routeData.safest.lights;
    this.crowdVal.innerText = routeData.safest.crowd;
    this.adviceVal.innerHTML = routeData.safest.advice;

    // Log this search into user dashboard travel history
    if (window.appRouter) {
      window.appRouter.addTravelHistory(startText, destText, routeData.safest.risk, routeData.safest.time);
    }

    // Call Leaflet Map instance to draw routes
    if (window.leafletMapHelper) {
      window.leafletMapHelper.drawRoutesOnMap(routeData.safest, routeData.alternative);
    }
  }
}

// Instantiate globally
window.safeRouter = new SafeRouter();
