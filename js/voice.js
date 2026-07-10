/**
 * SafeHer Voice Activation & Speech Recognition Module
 */

class VoiceTriggerAssistant {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    
    // UI Elements
    this.badgeBtn = document.getElementById('btn-toggle-voice');
    this.badgeText = document.getElementById('voice-badge-text');
    this.badgeIcon = this.badgeBtn.querySelector('i');
    
    this.triggerKeywords = ['help', 'sos', 'emergency', 'save me', 'safeher', 'safe her'];
    
    this.initSpeechEngine();
  }

  initSpeechEngine() {
    // Check browser compatibility
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      this.badgeText.innerText = "Speech Not Supported";
      this.badgeBtn.title = "Your browser does not support Speech Recognition APIs";
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    // Bind event hooks
    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateUIState();
    };

    this.recognition.onend = () => {
      // Auto-restart if we intended it to be active
      if (this.isListening) {
        this.recognition.start();
      } else {
        this.updateUIState();
      }
    };

    this.recognition.onerror = (e) => {
      console.warn("Speech recognition error:", e.error);
      if (e.error === 'not-allowed') {
        this.isListening = false;
        this.updateUIState();
        if (window.appRouter) {
          window.appRouter.showAppAlert("Microphone permission denied. Voice activation disabled.", "warning");
        }
      }
    };

    this.recognition.onresult = (event) => {
      const resultIndex = event.resultIndex;
      const transcript = event.results[resultIndex][0].transcript.toLowerCase().trim();
      
      console.log(`Speech detected transcript: "${transcript}"`);
      
      // Match keywords
      const match = this.triggerKeywords.some(keyword => transcript.includes(keyword));
      
      if (match) {
        console.warn("SOS Voice Trigger Detected!");
        this.triggerEmergencySOS(transcript);
      }
    };

    // Click handler to toggle listening
    this.badgeBtn.addEventListener('click', () => this.toggleListening());
  }

  toggleListening() {
    if (!this.recognition) {
      if (window.appRouter) {
        window.appRouter.showAppAlert("Speech recognition is not supported in this browser version. Use Google Chrome or MS Edge.", "warning");
      }
      return;
    }

    if (this.isListening) {
      this.isListening = false;
      this.recognition.stop();
    } else {
      try {
        this.recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  }

  updateUIState() {
    if (this.isListening) {
      this.badgeBtn.classList.add('listening');
      this.badgeText.innerText = "Voice Assistant Active";
      this.badgeIcon.className = "fa-solid fa-microphone";
    } else {
      this.badgeBtn.classList.remove('listening');
      this.badgeText.innerText = "Voice Detection Off";
      this.badgeIcon.className = "fa-solid fa-microphone-slash";
    }
  }

  triggerEmergencySOS(matchedPhrase) {
    if (window.appRouter) {
      window.appRouter.showAppAlert(`Voice trigger detected: "${matchedPhrase}". Engaging SOS Console...`, "danger");
      window.appRouter.triggerGlobalSOS();
    }
  }
}

// Instantiate globally
window.voiceTriggerAssistant = new VoiceTriggerAssistant();
