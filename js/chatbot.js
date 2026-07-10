/**
 * SafeHer AI Safety Assistant Chatbot Module
 */

class SafetyChatbot {
  constructor() {
    this.msgLog = document.getElementById('chat-conversation-log');
    this.inputBox = document.getElementById('chatbot-user-msg');
    this.typingIndicator = document.getElementById('chat-bot-typing');
    
    // Safety Intent Responses Dictionary
    this.intents = [
      {
        keywords: ['unsafe', 'danger', 'stalk', 'follow', 'help', 'threat', 'scared'],
        response: `⚠️ <strong>IMMEDIATE EMERGENCY ACTION PROTOCOL:</strong><br><br>
        1. <strong>Head to a public area:</strong> Walk towards a bright, populated zone (gas station, shop, restaurant).<br>
        2. <strong>Activate SOS immediately:</strong> Tap the red <strong style="color:var(--accent-sos);">SOS</strong> button on the header of this application or trigger the voice mode.<br>
        3. <strong>Call the Police (112 / 1091):</strong> Do not hesitate. If you suspect you are being followed, make a voice call immediately.<br>
        4. <strong>Keep moving:</strong> Do not stop or look down at your phone. Keep your chin up and walk with purpose.<br>
        5. <strong>Act noisy:</strong> If someone approaches, scream 'FIRE!' or use a whistle. Attackers avoid attention.`
      },
      {
        keywords: ['number', 'phone', 'hotline', 'helpline', 'contact', 'call'],
        response: `📞 <strong>CRITICAL WOMEN SAFETY HOTLINES:</strong><br><br>
        • <strong>National Women Helpline:</strong> Dial <strong style="color:var(--primary);">1091</strong> (Free, 24/7 support)<br>
        • <strong>Universal Emergency Desk:</strong> Dial <strong style="color:var(--primary);">112</strong> (Police, Fire, Medical)<br>
        • <strong>Domestic Violence Desk:</strong> Dial <strong style="color:var(--primary);">181</strong><br>
        • <strong>Cyber Crime Reporting Portal:</strong> Dial <strong style="color:var(--primary);">1930</strong><br>
        • <strong>Child Helpline desk:</strong> Dial <strong style="color:var(--primary);">1098</strong><br><br>
        <em>Tip: You can dial any of these immediately on your keypad. Keep these saved on speed-dial.</em>`
      },
      {
        keywords: ['self-defense', 'defense', 'fight', 'grab', 'attack', 'strike', 'move'],
        response: `🥋 <strong>CORE SELF-DEFENSE POSTURES & TACTICS:</strong><br><br>
        • <strong>The Palm Strike (Aim: Nose/Face):</strong> Forcefully thrust the heel of your open palm upward into the attacker's nose. Use your full body mass for leverage.<br>
        • <strong>The Groin Kick:</strong> Swing your leg upward using your shin/shoelaces to hit the groin. Ensure your standing leg is balanced.<br>
        • <strong>The Elbow Strike (Close Range):</strong> If grabbed, slam your elbow backward into their ribs, chin, or solar plexus.<br>
        • <strong>Vulnerable Targets:</strong> Eyes, throat, nose, ears, and groin. A quick jab to these areas buys you precious seconds to run.`
      },
      {
        keywords: ['legal', 'rights', 'fir', 'arrest', 'zero fir', 'police', 'law'],
        response: `⚖️ <strong>YOUR LEGAL PROTECTION RIGHTS (India/General):</strong><br><br>
        • <strong>Right to Zero FIR:</strong> You can file a complaint at ANY police station, regardless of where the incident occurred. The desk cannot refuse it.<br>
        • <strong>Sunset Arrest Rule (Section 46 CrPC):</strong> Women cannot be arrested after sunset (6 PM) and before sunrise (6 AM), except with magistrate clearance, and only by a female officer.<br>
        • <strong>Identity Protection:</strong> Your identity/name cannot be disclosed or published in cases relating to sexual threats/harassments.<br>
        • <strong>Free Legal Aid:</strong> Under the law, women are eligible for free, state-sponsored legal representatives.`
      },
      {
        keywords: ['cab', 'taxi', 'uber', 'travel', 'night', 'bus', 'metro', 'transit'],
        response: `🚗 <strong>SAFE NIGHT TRANSIT GUIDANCE:</strong><br><br>
        1. <strong>Confirm Vehicle Details:</strong> Verify the driver photo, plate digits, and vehicle model in your booking app before stepping inside.<br>
        2. <strong>Enable Live Route Maps:</strong> Open SafeHer's Route Finder to monitor if the vehicle matches correct routes.<br>
        3. <strong>Share Ride Progress:</strong> Send your live location tracking coordinates to family or contacts.<br>
        4. <strong>Check Child Locks:</strong> Inspect the rear passenger doors to confirm child-lock switches are disengaged before closing the door.<br>
        5. <strong>Avoid unlit pathways:</strong> Request drop-offs in well-lit, active public spots rather than dark alleys.`
      },
      {
        keywords: ['shelter', 'hospital', 'service', 'women help', 'police station', 'nearby'],
        response: `🏢 <strong>FINDING LOCAL SERVICES:</strong><br><br>
        Navigate to our **Nearby Emergency** view on the navigation menu. SafeHer uses interactive maps to locate Police Stations, Emergency Clinics, and Sakhi (One Stop) Women Help Shelters near your coordinates.<br><br>
        You can filter locations and access directions/contacts instantly. <a href="#" onclick="event.preventDefault(); window.appRouter.navigateTo('services')">Go to Nearby Services Map</a>.`
      }
    ];
  }

  // Handle user typing and submitting messages
  handleSendMessage() {
    const text = this.inputBox.value.trim();
    if (!text) return;
    
    // Add User message
    this.appendMessage(text, 'user');
    this.inputBox.value = '';
    
    // Show typing effect
    this.showTyping(true);
    
    // Generate AI response after simulated latency
    setTimeout(() => {
      this.showTyping(false);
      const reply = this.generateResponse(text);
      this.appendMessage(reply, 'bot');
    }, 1000);
  }

  // Triggered when user clicks sidebar quick links
  askQuickPrompt(promptText) {
    this.inputBox.value = promptText;
    this.handleSendMessage();
  }

  // Generate dynamic response using keyword matching
  generateResponse(inputText) {
    const cleanText = inputText.toLowerCase();
    
    for (const intent of this.intents) {
      const match = intent.keywords.some(keyword => cleanText.includes(keyword));
      if (match) {
        return intent.response;
      }
    }
    
    // Fallback response if no keywords match
    return `🤖 <strong>I'm here to help with your safety.</strong><br><br>
    I didn't quite capture your specific query, but you can ask me about:<br>
    • <em>Self-defense moves</em> ("Show me self defense tips")<br>
    • <em>Women's legal rights</em> ("What is a Zero FIR?")<br>
    • <em>Safety hotlines</em> ("Give me emergency numbers")<br>
    • <em>Night travel tips</em> ("How to stay safe in a taxi?")<br><br>
    If you are in immediate danger, click the <strong style="color:var(--accent-sos);">SOS</strong> button immediately.`;
  }

  // Helper: append messages to log container
  appendMessage(htmlContent, sender) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.innerHTML = htmlContent;
    this.msgLog.appendChild(bubble);
    this.msgLog.scrollTop = this.msgLog.scrollHeight;
  }

  // Helper: toggle bot typing indicators
  showTyping(show) {
    if (show) {
      this.typingIndicator.style.display = 'flex';
      this.msgLog.appendChild(this.typingIndicator);
      this.msgLog.scrollTop = this.msgLog.scrollHeight;
    } else {
      this.typingIndicator.style.display = 'none';
    }
  }
}

// Instantiate globally
window.safetyChatbot = new SafetyChatbot();
