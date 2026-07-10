/**
 * SafeHer Central SPA Application Controller & State Manager
 */

class AppRouter {
  constructor() {
    // Nav elements
    this.menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
    this.pageTitle = document.getElementById('app-current-page-title');
    
    // Alert Notification container
    this.alertArea = document.getElementById('alert-notification-area');
    
    // Core State Variables
    this.user = null;
    this.contacts = [];
    this.savedLocations = [];
    this.alertHistory = [];
    this.travelHistory = [];
    
    // SOS state
    this.countdownTimer = null;
    this.sosInterval = null;
    this.sosActive = false;
    this.audioContext = null;
    this.sirenOscillator = null;
    this.sirenGainNode = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    
    // Global User Geolocation state
    window.currentUserPosition = { lat: 40.7736, lng: -73.9715 };
    this.startGeolocationTracking();
    
    // Load from local storage or set defaults
    this.initLocalStorageState();
    this.bindEvents();
    this.renderInitialUI();

    // Initialize Theme settings on page load
    const savedTheme = localStorage.getItem('safeher_theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      const themeBtn = document.getElementById('btn-toggle-theme');
      if (themeBtn) themeBtn.querySelector('i').className = "fa-solid fa-sun";
      setTimeout(() => {
        if (window.leafletMapHelper) window.leafletMapHelper.toggleMapTileset(true);
      }, 600);
    }
  }

  // --- Geolocation Tracking Engine ---
  startGeolocationTracking() {
    if (navigator.geolocation) {
      const updatePosition = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            window.currentUserPosition.lat = position.coords.latitude;
            window.currentUserPosition.lng = position.coords.longitude;
            
            // Notify leaflet map helper of dynamic location changes
            if (window.leafletMapHelper) {
              window.leafletMapHelper.updateUserMarkerPosition(
                window.currentUserPosition.lat,
                window.currentUserPosition.lng
              );
            }
          },
          (error) => {
            console.warn("Live Geolocation tracking error:", error.message);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      };

      // Poll coordinates exactly every second to keep status current
      updatePosition();
      setInterval(updatePosition, 1000);
    } else {
      console.warn("Geolocation API not supported by browser.");
    }
  }

  // --- State Initialization ---
  initLocalStorageState() {
    // 1. User profile
    const storedUser = localStorage.getItem('safeher_user');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    } else {
      // Default Mock User Profile
      this.user = {
        name: "Jane Doe",
        email: "jane.doe@example.com",
        phone: "+1 555-019-2834",
        bloodGroup: "O+",
        medicalNotes: "No major allergies. Wears contact lenses."
      };
      localStorage.setItem('safeher_user', JSON.stringify(this.user));
    }

    // 2. Contacts CRUD List
    const storedContacts = localStorage.getItem('safeher_contacts');
    if (storedContacts) {
      this.contacts = JSON.parse(storedContacts);
    } else {
      this.contacts = [
        { id: "c1", name: "David Doe (Father)", phone: "+1 555-010-9831", email: "david.doe@example.com", relation: "Parent", isPrimary: true },
        { id: "c2", name: "Sarah Doe (Sister)", phone: "+1 555-012-7492", email: "sarah.doe@example.com", relation: "Sibling", isPrimary: false }
      ];
      localStorage.setItem('safeher_contacts', JSON.stringify(this.contacts));
    }

    // 3. Saved Safe Locations
    const storedLocs = localStorage.getItem('safeher_locations');
    if (storedLocs) {
      this.savedLocations = JSON.parse(storedLocs);
    } else {
      this.savedLocations = [
        { id: "l1", name: "Home Sanctuary", address: "124 Central Park West, New York, NY" },
        { id: "l2", name: "Work Corporate Office", address: "767 5th Ave, New York, NY" }
      ];
      localStorage.setItem('safeher_locations', JSON.stringify(this.savedLocations));
    }

    // 4. Alerts Log History
    const storedAlerts = localStorage.getItem('safeher_alerts');
    if (storedAlerts) {
      this.alertHistory = JSON.parse(storedAlerts);
    } else {
      this.alertHistory = [
        { id: "a1", title: "SOS Broadcast Triggered", time: "2 hours ago", subtitle: "Grand Central Station area", status: "Alert Complete", isCrisis: true },
        { id: "a2", title: "Safe Check-in Logged", time: "Yesterday", subtitle: "Home Sanctuary", status: "Checked In", isCrisis: false }
      ];
      localStorage.setItem('safeher_alerts', JSON.stringify(this.alertHistory));
    }

    // 5. Travel route history
    const storedTravel = localStorage.getItem('safeher_travel');
    if (storedTravel) {
      this.travelHistory = JSON.parse(storedTravel);
    } else {
      this.travelHistory = [
        { id: "t1", start: "Central Park Plaza", dest: "Metro Grand Station", risk: "Low Risk", time: "14 mins" }
      ];
      localStorage.setItem('safeher_travel', JSON.stringify(this.travelHistory));
    }
  }

  // --- Bind Event Handlers ---
  bindEvents() {
    // Menu routing clicks
    this.menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = item.dataset.view;
        this.navigateTo(viewId);
      });
    });

    // Top Header SOS Trigger Button
    document.getElementById('btn-header-sos-trigger').addEventListener('click', () => {
      this.triggerGlobalSOS();
    });

    // Main circular dashboard SOS Trigger Button
    document.getElementById('btn-main-big-sos').addEventListener('click', () => {
      this.triggerGlobalSOS();
    });

    // Cancel Button in the global Emergency countdown overlay
    document.getElementById('btn-cancel-sos-overlay').addEventListener('click', () => {
      this.abortGlobalSOS();
    });

    // Bind settings dropdown changes
    document.getElementById('set-countdown-val').addEventListener('change', (e) => {
      this.showAppAlert(`Emergency countdown updated to ${e.target.value}s`, "success");
    });

    // Feedback message stars active states toggling
    const stars = document.querySelectorAll('.feedback-star');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const rating = parseInt(star.dataset.rating);
        stars.forEach(s => {
          if (parseInt(s.dataset.rating) <= rating) {
            s.classList.add('active');
          } else {
            s.classList.remove('active');
          }
        });
        star.parentElement.dataset.value = rating;
      });
    });

    // Theme Toggle click listener
    const themeBtn = document.getElementById('btn-toggle-theme');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.toggleAppTheme();
      });
    }

    // Mobile Bottom Nav Routing Clicks
    const bottomNavLinks = document.querySelectorAll('.mobile-bottom-nav .nav-link');
    bottomNavLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = link.dataset.view;
        this.navigateTo(viewId);
      });
    });
  }

  // --- Toggle Application Themes (Light / Dark) ---
  toggleAppTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    const themeBtn = document.getElementById('btn-toggle-theme');
    
    if (themeBtn) {
      const icon = themeBtn.querySelector('i');
      if (isLight) {
        icon.className = "fa-solid fa-sun";
        localStorage.setItem('safeher_theme', 'light');
      } else {
        icon.className = "fa-solid fa-moon";
        localStorage.setItem('safeher_theme', 'dark');
      }
    }
    
    // Toggle Leaflet maps tile layer providers
    if (window.leafletMapHelper) {
      window.leafletMapHelper.toggleMapTileset(isLight);
    }
    
    this.showAppAlert(`Theme changed to ${isLight ? 'Light' : 'Dark'} Mode`, "success");
  }

  // --- Navigation Router ---
  navigateTo(viewId) {
    // Deactivate all views
    document.querySelectorAll('.view-section').forEach(view => {
      view.classList.remove('active');
    });

    // Deactivate all menu items
    this.menuItems.forEach(item => {
      item.classList.remove('active');
    });

    // Activate selected view section
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) {
      targetView.classList.add('active');
      
      // Highlight matching menu item
      const menuItem = Array.from(this.menuItems).find(item => item.dataset.view === viewId);
      if (menuItem) menuItem.classList.add('active');

      // Highlight matching mobile bottom nav item
      const bottomNavLinks = document.querySelectorAll('.mobile-bottom-nav .nav-link');
      bottomNavLinks.forEach(link => {
        if (link.dataset.view === viewId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
      
      // Update page title label in header
      const pageTitles = {
        'home': 'Home Page',
        'about': 'About SafeHer',
        'features': 'Safety Features',
        'registration': 'User Registration',
        'dashboard': 'User Dashboard Console',
        'admin': 'Admin Analytics Dashboard',
        'emergency': 'Emergency Console',
        'chatbot': 'AI Safety Assistant',
        'route': 'Safe Route Finder',
        'services': 'Nearby Emergency Services',
        'contacts': 'Emergency Contacts Circle',
        'resources': 'Safety Guides & Resources',
        'contact-us': 'Feedback & FAQs'
      };
      this.pageTitle.innerText = pageTitles[viewId] || 'SafeHer';
      
      // Render/Init leaflet maps if loading related views
      if (viewId === 'route' || viewId === 'services') {
        // Yield thread to let DOM compute block layouts, ensuring Leaflet handles dimensions correctly
        setTimeout(() => {
          if (window.leafletMapHelper) {
            window.leafletMapHelper.initMaps();
          }
        }, 150);
      }
    }
  }

  // --- Render Profile and Lists UI ---
  renderInitialUI() {
    this.updateProfileDisplays();
    this.renderContactsList();
    this.renderLocationsList();
    this.renderAlertsHistory();
    this.renderTravelHistory();
  }

  updateProfileDisplays() {
    const initial = this.user.name.charAt(0);
    
    // Sidebar mini profile card
    document.getElementById('mini-profile-avatar').innerText = initial;
    document.getElementById('mini-profile-name').innerText = this.user.name;
    document.getElementById('mini-profile-status').innerText = "Account Secured";

    // Auth Sidebar label update
    const authMenuItem = document.getElementById('sidebar-auth-item');
    if (authMenuItem) {
      authMenuItem.querySelector('span').innerText = "Edit Profile";
      authMenuItem.querySelector('i').className = "fa-solid fa-user-gear";
    }

    // Dashboard panel displays
    document.getElementById('dash-profile-avatar').innerText = initial;
    document.getElementById('dash-profile-name').innerText = this.user.name;
    document.getElementById('dash-profile-email').innerText = this.user.email;
    document.getElementById('dash-profile-phone').innerText = this.user.phone;
    document.getElementById('dash-profile-blood').innerText = this.user.bloodGroup;
    document.getElementById('dash-profile-medical').innerText = this.user.medicalNotes;

    // Prefill Registration inputs if user edits profile
    document.getElementById('register-name').value = this.user.name;
    document.getElementById('register-email').value = this.user.email;
    document.getElementById('register-phone').value = this.user.phone;
    document.getElementById('register-blood').value = this.user.bloodGroup;
    document.getElementById('register-medical').value = this.user.medicalNotes;
  }

  // Render Contacts CRUD list
  renderContactsList() {
    const list = document.getElementById('contacts-manager-list');
    if (!list) return;
    list.innerHTML = '';

    this.contacts.forEach(contact => {
      const card = document.createElement('div');
      card.className = 'card-glass contact-item-card';
      card.innerHTML = `
        <div class="contact-avatar">${contact.name.charAt(0)}</div>
        <div class="contact-details">
          <div class="contact-name">
            ${contact.name}
            ${contact.isPrimary ? '<span class="primary-badge"><i class="fa-solid fa-star"></i> Primary</span>' : ''}
          </div>
          <div class="contact-relation">${contact.relation} • ${contact.phone}</div>
        </div>
        <div class="contact-actions">
          <button class="btn-contact-action" onclick="window.appRouter.setPrimaryContact('${contact.id}')" title="Set Primary Contact">
            <i class="fa-${contact.isPrimary ? 'solid' : 'regular'} fa-star" style="color: ${contact.isPrimary ? 'var(--color-warning)' : 'var(--text-muted)'}"></i>
          </button>
          <button class="btn-contact-action delete" onclick="window.appRouter.deleteContact('${contact.id}')" title="Delete Contact">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;
      list.appendChild(card);
    });

    if (this.contacts.length === 0) {
      list.innerHTML = `<div style="text-align:center; padding:32px 0; color:var(--text-muted);">Your contacts list is empty. Add a contact on the right.</div>`;
    }

    this.calculateAppSafetyScore();
  }

  // Render Locations CRUD list
  renderLocationsList() {
    const list = document.getElementById('dash-locations-list');
    if (!list) return;
    list.innerHTML = '';

    this.savedLocations.forEach(loc => {
      const item = document.createElement('li');
      item.className = 'saved-loc-item';
      item.innerHTML = `
        <div>
          <div class="saved-loc-name"><i class="fa-solid fa-location-dot" style="color:var(--primary);"></i> ${loc.name}</div>
          <div class="saved-loc-address">${loc.address}</div>
        </div>
        <button class="btn-delete-loc" onclick="window.appRouter.deleteLocation('${loc.id}')" title="Delete Location">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      `;
      list.appendChild(item);
    });

    if (this.savedLocations.length === 0) {
      list.innerHTML = `<li style="color:var(--text-muted); font-size:0.85rem; padding:12px; text-align:center;">No locations saved yet.</li>`;
    }
  }

  // Render alerts history logs
  renderAlertsHistory() {
    const list = document.getElementById('dash-alerts-list');
    if (!list) return;
    list.innerHTML = '';

    this.alertHistory.forEach(alert => {
      const item = document.createElement('li');
      item.className = 'log-item';
      item.innerHTML = `
        <div class="log-item-left">
          <i class="fa-solid ${alert.isCrisis ? 'fa-circle-exclamation log-icon-sos' : 'fa-circle-check log-icon-check'}"></i>
          <div>
            <div class="log-title">${alert.title}</div>
            <div class="log-time">${alert.time} • ${alert.subtitle}</div>
          </div>
        </div>
        <span class="log-item-right" style="color: ${alert.isCrisis ? 'var(--accent-sos)' : 'var(--color-success)'};">${alert.status}</span>
      `;
      list.appendChild(item);
    });
  }

  // Render Travel paths history logs
  renderTravelHistory() {
    const list = document.getElementById('dash-travel-list');
    if (!list) return;
    list.innerHTML = '';

    this.travelHistory.forEach(item => {
      const el = document.createElement('li');
      el.className = 'log-item';
      el.innerHTML = `
        <div class="log-item-left">
          <i class="fa-solid fa-route" style="color:var(--color-info);"></i>
          <div>
            <div class="log-title">${item.start} ➜ ${item.dest}</div>
            <div class="log-time">Calculated safe route • ${item.time} duration</div>
          </div>
        </div>
        <span class="log-item-right" style="color: ${item.risk === 'Low Risk' ? 'var(--color-success)' : 'var(--accent-sos)'};">${item.risk}</span>
      `;
      list.appendChild(el);
    });
  }

  // Dynamic calculation for Dashboard safety score metric
  calculateAppSafetyScore() {
    let score = 40; // Base score
    const detailsAdvice = [];

    // Prioritize Primary contacts check
    const hasPrimary = this.contacts.some(c => c.isPrimary);
    if (this.contacts.length > 0) {
      score += 20;
      if (hasPrimary) score += 10;
      else detailsAdvice.push("Designate a primary contact to optimize SMS notifications.");
    } else {
      detailsAdvice.push("Add emergency contacts to boost safety alert distributions.");
    }

    // Voice Activation Check
    const voiceBadge = document.getElementById('voice-badge-text').innerText;
    if (voiceBadge.includes("Active")) {
      score += 15;
    } else {
      detailsAdvice.push("Enable Voice Recognition to allow hands-free SOS activation.");
    }

    // Saved Locations Check
    if (this.savedLocations.length > 0) {
      score += 15;
    } else {
      detailsAdvice.push("Add Safe Location checkpoints for rapid transit check-ins.");
    }

    // Bind updates to Dashboard GUI widgets
    const percentageText = document.getElementById('score-percentage-text');
    const statusText = document.getElementById('score-rating-status');
    const adviceText = document.getElementById('score-rating-advice');
    const circleFill = document.getElementById('score-circle-fill');

    if (percentageText) {
      percentageText.innerText = `${score}%`;
      
      // Update circle progress bar stroke offset
      // Circular path radius is 60, circumference is 2 * pi * 60 = 377
      const offset = 377 - (377 * score) / 100;
      circleFill.style.strokeDashoffset = offset;
      circleFill.style.strokeDasharray = 377;

      if (score >= 85) {
        statusText.innerText = "Highly Secured";
        statusText.style.color = "var(--color-success)";
        circleFill.style.stroke = "var(--color-success)";
      } else if (score >= 60) {
        statusText.innerText = "Moderate Protection";
        statusText.style.color = "var(--color-warning)";
        circleFill.style.stroke = "var(--color-warning)";
      } else {
        statusText.innerText = "Security Vulnerabilities";
        statusText.style.color = "var(--accent-sos)";
        circleFill.style.stroke = "var(--accent-sos)";
      }

      adviceText.innerHTML = detailsAdvice.length > 0 
        ? `💡 Suggestions: ${detailsAdvice.slice(0, 2).join(' ')}`
        : "✅ Awesome! Your SafeHer configurations provide premium safety shielding. Keep it up!";
    }
  }

  // --- CRUD Submission Handlers ---
  handleLoginSubmit() {
    const email = document.getElementById('login-email').value.trim();
    
    // Simulate Login
    this.user.email = email;
    this.user.name = email.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    localStorage.setItem('safeher_user', JSON.stringify(this.user));
    
    this.updateProfileDisplays();
    this.showAppAlert("Authentication successful! Welcome to SafeHer.", "success");
    this.navigateTo('dashboard');
  }

  handleRegisterSubmit() {
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    const blood = document.getElementById('register-blood').value;
    const medical = document.getElementById('register-medical').value.trim();

    this.user = {
      name: name,
      email: email,
      phone: phone,
      bloodGroup: blood,
      medicalNotes: medical || "None"
    };

    localStorage.setItem('safeher_user', JSON.stringify(this.user));
    this.updateProfileDisplays();
    this.showAppAlert("Safety Profile updated successfully!", "success");
    this.navigateTo('dashboard');
  }

  handleLogout() {
    localStorage.removeItem('safeher_user');
    this.user = { name: "Guest User", email: "guest@safeher.org", phone: "--", bloodGroup: "O+", medicalNotes: "None" };
    this.updateProfileDisplays();
    this.showAppAlert("Signed out of safety profile.", "warning");
    this.navigateTo('registration');
  }

  handleAddContactSubmit() {
    const name = document.getElementById('contact-input-name').value.trim();
    const phone = document.getElementById('contact-input-phone').value.trim();
    const email = document.getElementById('contact-input-email').value.trim();
    const relation = document.getElementById('contact-input-relation').value;
    const isPrimary = document.getElementById('contact-input-primary').checked;

    // Reset primary flags if new one is primary
    if (isPrimary) {
      this.contacts.forEach(c => c.isPrimary = false);
    }

    const newContact = {
      id: "c_" + Date.now(),
      name: name,
      phone: phone,
      email: email || "None",
      relation: relation,
      isPrimary: isPrimary
    };

    this.contacts.push(newContact);
    localStorage.setItem('safeher_contacts', JSON.stringify(this.contacts));
    
    // Reset inputs
    document.getElementById('form-add-contact').reset();
    
    this.renderContactsList();
    this.showAppAlert(`Added contact "${name}" to trusted network.`, "success");
  }

  setPrimaryContact(id) {
    this.contacts.forEach(c => {
      c.isPrimary = (c.id === id);
    });
    localStorage.setItem('safeher_contacts', JSON.stringify(this.contacts));
    this.renderContactsList();
    this.showAppAlert("Primary emergency contact updated.", "success");
  }

  deleteContact(id) {
    this.contacts = this.contacts.filter(c => c.id !== id);
    localStorage.setItem('safeher_contacts', JSON.stringify(this.contacts));
    this.renderContactsList();
    this.showAppAlert("Contact removed from safety network.", "warning");
  }

  handleSaveLocation() {
    const name = document.getElementById('new-loc-name').value.trim();
    const address = document.getElementById('new-loc-address').value.trim();

    const newLoc = {
      id: "l_" + Date.now(),
      name: name,
      address: address
    };

    this.savedLocations.push(newLoc);
    localStorage.setItem('safeher_locations', JSON.stringify(this.savedLocations));
    
    document.getElementById('form-save-location').reset();
    
    this.renderLocationsList();
    this.calculateAppSafetyScore();
    this.showAppAlert(`Safe location "${name}" added.`, "success");
  }

  deleteLocation(id) {
    this.savedLocations = this.savedLocations.filter(l => l.id !== id);
    localStorage.setItem('safeher_locations', JSON.stringify(this.savedLocations));
    this.renderLocationsList();
    this.calculateAppSafetyScore();
    this.showAppAlert("Safe location removed.", "warning");
  }

  addTravelHistory(start, dest, risk, time) {
    const newTravel = {
      id: "t_" + Date.now(),
      start: start,
      dest: dest,
      risk: risk,
      time: time
    };
    this.travelHistory.unshift(newTravel);
    // Limit log length
    if (this.travelHistory.length > 5) this.travelHistory.pop();
    localStorage.setItem('safeher_travel', JSON.stringify(this.travelHistory));
    this.renderTravelHistory();
  }

  handleFeedbackSubmit() {
    const name = document.getElementById('contact-feedback-name').value;
    const ratingBox = document.getElementById('feedback-stars-box');
    const rating = ratingBox.dataset.value || 5;

    this.showAppAlert(`Thank you for submitting feedback! Rated: ${rating} Stars.`, "success");
    document.getElementById('form-contact-feedback').reset();
    
    // Clear stars rating styling
    document.querySelectorAll('.feedback-star').forEach(s => s.classList.remove('active'));
  }

  // --- SOS Activation Lifecycle Logic ---
  triggerGlobalSOS() {
    if (this.sosActive) {
      this.showAppAlert("SOS alarm is already active. Continuous rescue tracking running.", "danger");
      return;
    }

    const overlay = document.getElementById('global-emergency-overlay');
    const timerText = document.getElementById('overlay-countdown-timer');
    const fillCircle = document.getElementById('overlay-countdown-fill');
    
    // Read countdown delay from settings
    let count = parseInt(document.getElementById('set-countdown-val').value) || 5;
    
    // Display global countdown overlay
    overlay.classList.add('active');
    timerText.innerText = count;
    
    // Circumference of countdown path is 2 * pi * 90 = 565
    fillCircle.style.strokeDasharray = 565;
    fillCircle.style.strokeDashoffset = 0;
    
    // Start Audio Siren LFO Synthesizer using Web Audio API if enabled
    const alarmEnabled = document.getElementById('set-siren-sound').checked;
    if (alarmEnabled) {
      this.startSirenSynthesizer();
    }

    // Tick down countdown timer
    let initialCount = count;
    this.countdownTimer = setInterval(() => {
      count--;
      timerText.innerText = count;
      
      const offset = 565 - (565 * (initialCount - count)) / initialCount;
      fillCircle.style.strokeDashoffset = offset;
      
      if (count <= 0) {
        clearInterval(this.countdownTimer);
        this.engageEmergencyDispatch();
      }
    }, 1000);
  }

  // Web Audio API Pulse alarm generator
  startSirenSynthesizer() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      
      // Main oscillator and LFO
      this.sirenOscillator = this.audioContext.createOscillator();
      this.sirenGainNode = this.audioContext.createGain();
      
      this.sirenOscillator.type = 'sawtooth';
      this.sirenOscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // Standard concert A
      
      // Siren wobble LFO
      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();
      lfo.frequency.value = 2.5; // Pulsing speed Hz
      lfoGain.gain.value = 150;  // Pitch wobble range
      
      lfo.connect(lfoGain);
      lfoGain.connect(this.sirenOscillator.frequency);
      
      this.sirenOscillator.connect(this.sirenGainNode);
      this.sirenGainNode.connect(this.audioContext.destination);
      
      // Volume settings
      this.sirenGainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
      
      lfo.start();
      this.sirenOscillator.start();
    } catch (e) {
      console.warn("Web Audio API not supported/allowed:", e);
    }
  }

  stopSirenSynthesizer() {
    if (this.sirenOscillator) {
      try {
        this.sirenOscillator.stop();
        this.audioContext.close();
      } catch (err) {
        console.warn(err);
      }
      this.sirenOscillator = null;
      this.audioContext = null;
    }
  }

  // Cancel counting down
  abortGlobalSOS() {
    clearInterval(this.countdownTimer);
    this.stopSirenSynthesizer();
    
    document.getElementById('global-emergency-overlay').classList.remove('active');
    this.showAppAlert("SOS emergency countdown cancelled. Danger status cleared.", "success");
  }

  // Countdown reaches zero: activate active tracking logs and triggers
  engageEmergencyDispatch() {
    this.sosActive = true;
    
    // Hide overlay
    document.getElementById('global-emergency-overlay').classList.remove('active');
    this.navigateTo('emergency');
    
    // Update Badge
    const activeBadge = document.getElementById('sos-active-badge');
    activeBadge.innerText = "ACTIVE ALERT IN PROGRESS";
    activeBadge.style.backgroundColor = "rgba(255, 42, 84, 0.15)";
    activeBadge.style.color = "var(--accent-sos)";
    
    // Alert user
    this.showAppAlert("🚨 EMERGENCY PROTOCOLS ENGAGED: Location coordinates shared and audio recording commenced.", "danger");

    // Stepper status updates with visual delay effects
    const steps = [
      { id: 'step-gps', action: () => this.startMockGPSTracking() },
      { id: 'step-sms', action: () => this.simulateSmsTransmission() },
      { id: 'step-audio', action: () => this.startEvidenceAudioRecorder() },
      { id: 'step-police', action: () => this.simulatePoliceLink() }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        const item = document.getElementById(step.id);
        if (item) {
          item.className = "tracking-step active-step";
          step.action();
          setTimeout(() => {
            item.className = "tracking-step done";
            const check = item.querySelector('i');
            check.className = "fa-solid fa-circle-check";
          }, 800);
        }
      }, idx * 1000);
    });

    // Record Alert event into state logs
    const newAlert = {
      id: "a_" + Date.now(),
      title: "SOS emergency alarm triggered",
      time: "Just Now",
      subtitle: "Active GPS coordinates stream shared",
      status: "Dispatched",
      isCrisis: true
    };
    this.alertHistory.unshift(newAlert);
    localStorage.setItem('safeher_alerts', JSON.stringify(this.alertHistory));
    this.renderAlertsHistory();
  }

  // Multi-step SOS operational logic:
  // Step 1: Active Mock location streaming
  startMockGPSTracking() {
    const latEl = document.getElementById('sos-coord-lat');
    const lngEl = document.getElementById('sos-coord-lng');

    this.sosInterval = setInterval(() => {
      // Pull live coordinate updates from active Geolocation state
      const currentLat = window.currentUserPosition.lat;
      const currentLng = window.currentUserPosition.lng;

      latEl.innerText = currentLat.toFixed(6);
      lngEl.innerText = currentLng.toFixed(6);
    }, 1000);
  }

  // Step 2: SMS notification output log
  simulateSmsTransmission() {
    this.contacts.forEach(c => {
      console.log(`[SafeHer SMS Service] Sent distress SMS to ${c.name} (${c.phone}): "HELP! Jane Doe is in danger. Live location coordinates: https://safeher.org/track/jane"`);
    });
  }

  // Step 3: Continuously capture sound logs during SOS state
  startEvidenceAudioRecorder() {
    const audioRecEnabled = document.getElementById('set-audio-rec').checked;
    if (!audioRecEnabled) return;

    const audioViz = document.getElementById('sos-audio-viz');
    const recText = document.getElementById('audio-rec-text');
    
    audioViz.classList.add('recording');
    recText.innerText = "Recording Environmental Audio...";

    // Try HTML5 MediaRecorder
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then(stream => {
        this.mediaRecorder = new MediaRecorder(stream);
        this.recordedChunks = [];
        
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.recordedChunks.push(e.data);
        };
        
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
          console.log("Audio evidence capture completed. Saved payload bytes:", blob.size);
          // Stop stream tracks
          stream.getTracks().forEach(t => t.stop());
        };

        this.mediaRecorder.start();
      })
      .catch(err => {
        console.warn("Microphone access denied or not available. Running simulation mode.", err);
      });
  }

  // Step 4: Dispatch details to closest local authorities
  simulatePoliceLink() {
    console.log("[SafeHer Police Dispatcher API] distress ping relayed to New York Central Park Precinct desk command logs.");
  }

  // Turn off Emergency State
  stopSOSAlerts() {
    this.sosActive = false;
    clearInterval(this.sosInterval);
    this.stopSirenSynthesizer();

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        console.error(e);
      }
    }

    // Reset Dashboard state indicators
    const activeBadge = document.getElementById('sos-active-badge');
    activeBadge.innerText = "Inactive State";
    activeBadge.style.backgroundColor = "rgba(255,255,255,0.04)";
    activeBadge.style.color = "var(--text-main)";

    const audioViz = document.getElementById('sos-audio-viz');
    const recText = document.getElementById('audio-rec-text');
    audioViz.classList.remove('recording');
    recText.innerText = "Microphone Idle";

    // Reset Stepper items styles
    const stepperIds = ['step-gps', 'step-sms', 'step-audio', 'step-police'];
    stepperIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.className = "tracking-step pending";
        const icon = el.querySelector('i');
        // Reset classes
        if (id === 'step-gps') icon.className = "fa-solid fa-location-arrow";
        if (id === 'step-sms') icon.className = "fa-solid fa-comment-sms";
        if (id === 'step-audio') icon.className = "fa-solid fa-microphone";
        if (id === 'step-police') icon.className = "fa-solid fa-user-shield";
      }
    });

    document.getElementById('sos-coord-lat').innerText = "--.------";
    document.getElementById('sos-coord-lng').innerText = "--.------";

    this.showAppAlert("SOS safety alerts reset. Safe mode activated.", "success");
  }

  // --- UI Alert notification helper ---
  showAppAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `app-alert ${type}`;
    
    const icon = {
      'success': 'fa-solid fa-circle-check',
      'warning': 'fa-solid fa-triangle-exclamation',
      'danger': 'fa-solid fa-circle-exclamation'
    }[type] || 'fa-solid fa-bell';

    alert.innerHTML = `
      <i class="${icon}"></i>
      <span style="flex-grow:1;">${message}</span>
      <button onclick="this.parentElement.remove()" style="background:transparent; border:none; color:inherit; cursor:pointer; font-size:1.1rem; font-weight:700;"><i class="fa-solid fa-xmark"></i></button>
    `;

    this.alertArea.appendChild(alert);

    // Auto delete after 5s
    setTimeout(() => {
      alert.style.transition = 'opacity 0.5s ease';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 500);
    }, 5000);
  }

  // --- Accordion details toggle ---
  toggleAccordion(element) {
    element.classList.toggle('active');
    const body = element.querySelector('.accordion-body');
    if (element.classList.contains('active')) {
      body.style.maxHeight = body.scrollHeight + 'px';
    } else {
      body.style.maxHeight = '0';
    }
  }

  // --- Toggle resource view tabs ---
  toggleResourceTab(tabName) {
    document.querySelectorAll('#view-resources .resource-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('#view-resources .resources-content-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `resource-pane-${tabName}`);
    });
  }

  // --- Toggle registration tabs ---
  toggleAuthTab(mode) {
    document.getElementById('tab-login').classList.toggle('active', mode === 'login');
    document.getElementById('tab-register').classList.toggle('active', mode === 'register');
    document.getElementById('panel-login').classList.toggle('active', mode === 'login');
    document.getElementById('panel-register').classList.toggle('active', mode === 'register');
  }
}

// Instantiate and start app router globally
window.appRouter = new AppRouter();

// Add secondary trigger hooks to manage SOS overrides via consoles
document.addEventListener('DOMContentLoaded', () => {
  // Bind close buttons and toggle commands for test overrides
  const resetBtn = document.createElement('button');
  resetBtn.className = "btn-secondary";
  resetBtn.style.marginTop = "20px";
  resetBtn.style.borderColor = "var(--accent-sos)";
  resetBtn.style.color = "var(--accent-sos)";
  resetBtn.innerHTML = '<i class="fa-solid fa-power-off"></i> RESET SOS / STAND DOWN';
  resetBtn.onclick = () => window.appRouter.stopSOSAlerts();
  
  const emergencyInfoPanel = document.querySelector('.emergency-info-panel');
  if (emergencyInfoPanel) {
    emergencyInfoPanel.appendChild(resetBtn);
  }
});
