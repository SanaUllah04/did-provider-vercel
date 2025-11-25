/* app.js
   Single effective CAPTCHA - Slider Puzzle with behavior analysis
   DID storage in permanent "DID File.txt"
*/

const state = {
  captchaStart: 0,
  captchaComplete: false,
  interactionPattern: [],
  currentDID: null,
  sliderPosition: 0,
  targetPosition: 0
};

/* ---------- UI helpers ---------- */
const $ = id => document.getElementById(id);
const show = id => {
  document.querySelectorAll('.card.screen, .card').forEach(el => el.style.display = 'none');
  document.getElementById(id).style.display = 'block';
};
const logStep = (text) => {
  console.log('[GEN]', text);
  const el = $('genLog');
  if (el) el.textContent += text + '\n';
};

/* ---------- Initial wiring ---------- */
document.addEventListener('DOMContentLoaded', () => {
  $('signupDidBtn').addEventListener('click', startVerificationFlow);
  $('loginDidBtn').addEventListener('click', () => {
    show('loginScreen');
    $('loginMsg').textContent = '';
    $('loginDidInput').value = '';
  });

  $('backFromVerify').addEventListener('click', () => {
    resetVerificationState();
    show('homeScreen');
  });
  $('backFromLogin').addEventListener('click', () => show('homeScreen'));

  $('loginSubmit').addEventListener('click', async () => {
    const did = $('loginDidInput').value.trim();
    if (!did) { 
      $('loginMsg').textContent = 'Please enter a DID.'; 
      $('loginMsg').style.color = '#b91c1c';
      return; 
    }
    
    $('loginMsg').textContent = 'Verifying DID from DID File.txt...';
    $('loginMsg').style.color = '#6b7280';
    
    try {
      // Check DID against DID File.txt on server
      const res = await fetch('/verify-did', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did })
      });
      
      const result = await res.json();
      
      if (result.exists) {
        $('loginMsg').textContent = 'DID verified! Logging in...';
        $('loginMsg').style.color = '#059669';
        
        setTimeout(() => {
          $('dashboardDid').textContent = did;
          show('dashboardScreen');
        }, 800);
      } else {
        $('loginMsg').textContent = 'DID not found in DID File.txt. Please register first.';
        $('loginMsg').style.color = '#b91c1c';
      }
    } catch (e) {
      $('loginMsg').textContent = 'Cannot connect to server. Please ensure server is running.';
      $('loginMsg').style.color = '#b91c1c';
      console.error(e);
    }
  });

  $('logoutBtn').addEventListener('click', () => show('homeScreen'));
  $('retryBtn').addEventListener('click', startVerificationFlow);

  setupSliderCaptcha();
  show('homeScreen');
});

/* ---------- Verification flow ---------- */
function startVerificationFlow() {
  resetVerificationState();
  show('verificationScreen');
  
  // Hide all old challenge sections
  document.querySelectorAll('.challenge').forEach(el => el.style.display = 'none');
  
  // Hide progress elements if they exist
  if ($('progressBar')) $('progressBar').style.display = 'none';
  if ($('dots')) $('dots').style.display = 'none';
  
  // Show our single CAPTCHA
  initializeSliderCaptcha();
}

/* Reset verification state */
function resetVerificationState() {
  state.captchaStart = 0;
  state.captchaComplete = false;
  state.interactionPattern = [];
  state.sliderPosition = 0;
  $('genLog') && ($('genLog').textContent = '');
  $('didValue') && ($('didValue').textContent = '');
  $('nextBtn').style.display = 'none';
}

/* ---------- Slider Puzzle CAPTCHA ---------- */
function setupSliderCaptcha() {
  // Create CAPTCHA container in verification screen
  const verificationScreen = $('verificationScreen');
  
  // Remove old CAPTCHA if exists
  const oldCaptcha = $('sliderCaptchaContainer');
  if (oldCaptcha) oldCaptcha.remove();
  
  // Create new container
  const container = document.createElement('div');
  container.id = 'sliderCaptchaContainer';
  container.style.cssText = 'margin: 2rem 0; padding: 2rem; background: #f9fafb; border-radius: 8px; border: 2px solid #e5e7eb;';
  
  container.innerHTML = `
    <h3 style="margin: 0 0 1rem 0; color: #111827;">Human Verification Challenge</h3>
    <p style="margin: 0 0 1.5rem 0; color: #6b7280;">Slide the puzzle piece to complete the image</p>
    
    <div style="position: relative; width: 100%; max-width: 400px; margin: 0 auto 1.5rem;">
      <canvas id="sliderCanvas" width="400" height="250" style="width: 100%; border: 2px solid #d1d5db; border-radius: 8px; display: block; cursor: grab;"></canvas>
    </div>
    
    <div style="position: relative; width: 100%; max-width: 400px; margin: 0 auto 1rem;">
      <div id="sliderTrack" style="height: 50px; background: #e5e7eb; border-radius: 25px; position: relative; overflow: hidden;">
        <div id="sliderButton" style="position: absolute; left: 0; top: 0; width: 50px; height: 50px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 25px; cursor: grab; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2); transition: transform 0.1s;">
          <span style="color: white; font-size: 24px;">→</span>
        </div>
      </div>
    </div>
    
    <p id="sliderStatus" style="text-align: center; color: #6b7280; margin: 0; font-size: 14px;">Drag the slider to match the puzzle piece position</p>
  `;
  
  // Insert after the heading
  const heading = verificationScreen.querySelector('h2');
  heading.parentNode.insertBefore(container, heading.nextSibling);
}

function initializeSliderCaptcha() {
  const canvas = $('sliderCanvas');
  const ctx = canvas.getContext('2d');
  const sliderButton = $('sliderButton');
  const sliderTrack = $('sliderTrack');
  
  // Generate random target position
  state.targetPosition = 150 + Math.random() * 150; // Between 150-300px
  state.sliderPosition = 0;
  state.captchaStart = performance.now();
  state.interactionPattern = [];
  
  // Draw puzzle image
  drawPuzzleImage(ctx, canvas.width, canvas.height);
  
  let isDragging = false;
  let startX = 0;
  
  const onDragStart = (e) => {
    isDragging = true;
    startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    sliderButton.style.cursor = 'grabbing';
    state.interactionPattern.push({ time: performance.now(), type: 'start', x: startX });
  };
  
  const onDrag = (e) => {
    if (!isDragging) return;
    
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const diff = clientX - startX;
    const maxMove = sliderTrack.offsetWidth - 50;
    
    state.sliderPosition = Math.max(0, Math.min(maxMove, state.sliderPosition + diff));
    sliderButton.style.left = state.sliderPosition + 'px';
    startX = clientX;
    
    state.interactionPattern.push({ time: performance.now(), type: 'move', x: state.sliderPosition });
    
    // Update puzzle piece position
    drawPuzzleImage(ctx, canvas.width, canvas.height);
  };
  
  const onDragEnd = (e) => {
    if (!isDragging) return;
    isDragging = false;
    sliderButton.style.cursor = 'grab';
    
    state.interactionPattern.push({ time: performance.now(), type: 'end', x: state.sliderPosition });
    
    checkSliderMatch();
  };
  
  // Mouse events
  sliderButton.addEventListener('mousedown', onDragStart);
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', onDragEnd);
  
  // Touch events
  sliderButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    onDragStart(e);
  });
  document.addEventListener('touchmove', (e) => {
    if (isDragging) e.preventDefault();
    onDrag(e);
  });
  document.addEventListener('touchend', onDragEnd);
}

function drawPuzzleImage(ctx, width, height) {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw background image (gradient pattern)
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#dbeafe');
  gradient.addColorStop(0.5, '#bfdbfe');
  gradient.addColorStop(1, '#93c5fd');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Draw some pattern circles
  ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
  for (let i = 0; i < 10; i++) {
    const x = (i * 50 + 30) % width;
    const y = ((i * 37) % 5) * 40 + 30;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw puzzle piece cutout at target position
  const pieceWidth = 60;
  const pieceHeight = 60;
  const cutoutX = state.targetPosition;
  const cutoutY = height / 2 - pieceHeight / 2;
  
  // Draw dark overlay except for cutout
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(0, 0, width, height);
  
  ctx.globalCompositeOperation = 'destination-out';
  drawPuzzlePiece(ctx, cutoutX, cutoutY, pieceWidth, pieceHeight);
  ctx.globalCompositeOperation = 'source-over';
  
  // Draw the movable puzzle piece
  const maxMove = $('sliderTrack').offsetWidth - 50;
  const pieceX = (state.sliderPosition / maxMove) * (width - pieceWidth);
  
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  ctx.fillStyle = gradient;
  drawPuzzlePiece(ctx, pieceX, cutoutY, pieceWidth, pieceHeight);
  
  // Redraw pattern on piece
  ctx.clip();
  ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
  for (let i = 0; i < 10; i++) {
    const x = (i * 50 + 30) % width;
    const y = ((i * 37) % 5) * 40 + 30;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
  
  // Draw piece outline
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  drawPuzzlePiece(ctx, pieceX, cutoutY, pieceWidth, pieceHeight, true);
}

function drawPuzzlePiece(ctx, x, y, w, h, strokeOnly = false) {
  ctx.beginPath();
  const knobSize = 10;
  
  ctx.moveTo(x, y);
  ctx.lineTo(x + w/2 - knobSize, y);
  ctx.arc(x + w/2, y, knobSize, Math.PI, 0, true);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  
  if (strokeOnly) {
    ctx.stroke();
  } else {
    ctx.fill();
  }
}

function checkSliderMatch() {
  const maxMove = $('sliderTrack').offsetWidth - 50;
  const pieceX = (state.sliderPosition / maxMove) * (400 - 60);
  const tolerance = 15;
  
  const duration = (performance.now() - state.captchaStart) / 1000;
  const isMatch = Math.abs(pieceX - state.targetPosition) < tolerance;
  
  if (isMatch) {
    const isHumanLike = analyzeInteractionPattern(duration);
    
    if (isHumanLike) {
      state.captchaComplete = true;
      $('sliderStatus').textContent = `Perfect! Verified in ${duration.toFixed(1)}s ✓`;
      $('sliderStatus').style.color = '#059669';
      $('sliderButton').style.background = 'linear-gradient(135deg, #10b981, #059669)';
      
      // Show next button
      $('nextBtn').style.display = 'block';
      $('nextBtn').onclick = showResult;
    } else {
      $('sliderStatus').textContent = 'Suspicious activity detected. Please try again.';
      $('sliderStatus').style.color = '#b91c1c';
      setTimeout(() => {
        initializeSliderCaptcha();
      }, 2000);
    }
  } else {
    $('sliderStatus').textContent = 'Not quite right. Try again.';
    $('sliderStatus').style.color = '#f59e0b';
  }
}

function analyzeInteractionPattern(duration) {
  // Bot detection heuristics
  if (duration < 1) return false; // Too fast
  if (duration > 45) return false; // Too slow
  if (state.interactionPattern.length < 5) return false; // Too few interactions
  
  // Calculate movement smoothness
  const moves = state.interactionPattern.filter(p => p.type === 'move');
  if (moves.length < 3) return false;
  
  // Check for natural acceleration/deceleration
  let velocities = [];
  for (let i = 1; i < moves.length; i++) {
    const dt = moves[i].time - moves[i-1].time;
    const dx = moves[i].x - moves[i-1].x;
    if (dt > 0) velocities.push(Math.abs(dx / dt));
  }
  
  if (velocities.length === 0) return false;
  
  // Humans have varied velocities, bots are too uniform
  const avgVel = velocities.reduce((a,b) => a+b, 0) / velocities.length;
  const variance = velocities.reduce((sum, v) => sum + Math.pow(v - avgVel, 2), 0) / velocities.length;
  
  return variance > 0.01; // Sufficient variation indicates human
}

/* ---------- Results & DID generation ---------- */
async function showResult() {
  show('resultScreen');
  $('resultHeader').textContent = 'VERIFICATION SUCCESSFUL';
  $('resultText').textContent = 'You passed the human verification.';

  $('failArea').style.display = 'none';
  $('successArea').style.display = 'block';

  await generateAndStoreDID();
}

/* Generate DID and store in DID File.txt */
async function generateAndStoreDID() {
  logStep('Generating ECDSA keys...');
  const keyPair = await window.crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign","verify"]
  );
  logStep('Keys generated with P-256 curve.');
  
  const pubJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
  logStep('Public key (JWK): ' + JSON.stringify(pubJwk, null, 2));

  const encoder = new TextEncoder();
  const randomSeed = `${Date.now()}-${Math.random()}-${pubJwk.x || ''}-${pubJwk.y || ''}`;
  logStep('Hashing with SHA-256...');
  
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(randomSeed));
  const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('');
  const did = `did:human:${hex.substring(0,20)}`;
  
  $('didValue').textContent = did;
  state.currentDID = did;
  logStep('DID created: ' + did);

  // Save DID to permanent DID File.txt on server
  logStep('Saving DID to "DID File.txt"...');
  try {
    const res = await fetch('/save-did', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ did, timestamp: Date.now() })
    });
    
    const result = await res.json();
    
    if (result.success) {
      logStep('DID successfully saved to DID File.txt');
    } else {
      logStep('Failed to save DID: ' + result.message);
    }
  } catch (e) {
    logStep('Error: Cannot connect to server to save DID.');
    console.error(e);
  }

  let left = 5;
  const iv = setInterval(() => {
    $('resultText').textContent = `Returning to home in ${left}s...`;
    left--;
    if (left < 0) {
      clearInterval(iv);
      show('homeScreen');
    }
  }, 1000);
}