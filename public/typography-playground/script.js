/**
 * TYPOGRAPHY PLAYGROUND // Handmade Textile & Woven Typographic Object
 * Pure Vanilla JavaScript (Zero external libraries)
 */

(function () {
  'use strict';

  // --- 1. NATIVE WEB AUDIO SYNTHESIZER (Tactile Woolly Pops & Boings) ---
  let audioCtx = null;
  let soundEnabled = true;

  function initAudio() {
    if (!audioCtx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
  }

  function playTactileSound(type = 'pop') {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      if (type === 'pop') {
        // Soft woolly yarn plop
        const baseFreq = 260 + Math.random() * 180;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, now + 0.07);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'weird') {
        // Playful cartoon spring boing
        const baseFreq = 220 + Math.random() * 120;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.8, now + 0.16);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.32);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
      } else if (type === 'tickle') {
        // Gentle thread rustle
        const freq = 440 + Math.random() * 260;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // --- 2. RETRO YARN COLOR PALETTE (From Reference Poster) ---
  const YARN_COLORS = [
    '#E0401D', // Vermilion Orange
    '#1864AB', // Cobalt Blue
    '#099268', // Jade Green
    '#D63384', // Rose Pink
    '#1A1918', // Deep Charcoal Black
    '#E67700', // Golden Amber
    '#C92A2A', // Crimson Red
    '#78350F'  // Leather Brown
  ];

  // --- 3. DOM ELEMENTS ---
  const sentenceInput = document.getElementById('sentenceInput');
  const clearInputBtn = document.getElementById('clearInputBtn');
  const presetChips = document.querySelectorAll('.preset-chip');
  const textContainer = document.getElementById('textContainer');
  const posterCanvas = document.getElementById('posterCanvas');
  const posterStage = document.getElementById('posterStage');
  const modeButtons = document.querySelectorAll('.mode-button');
  const makeItWeirdBtn = document.getElementById('makeItWeirdBtn');
  const interactionStatus = document.getElementById('interactionStatus');
  const fontButtons = document.querySelectorAll('.seg-btn');
  const textureToggleBtn = document.getElementById('textureToggleBtn');
  const resetAllBtn = document.getElementById('resetAllBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');

  // State
  let currentSentence = 'WEAVING & SOLVING';
  let currentMode = 'bouncy';
  let isWeirdActive = false;
  let isTextureActive = true;

  const MODE_INFO = {
    bouncy: 'BOUNCY (Letters gently move up and down as soft objects)',
    wiggly: 'WIGGLY (Each letter slightly rotates & deforms independently)',
    handmade: 'HANDMADE (Random width, height, rotation & spacing craft layout)',
    wave: 'WAVE (Letters arranged along a large organic wave)',
    circle: 'CIRCLE (Imperfect hand-drawn circular loop)',
    melt: 'MELT (Letters stretch vertically & horizontally like pulled wool)',
    stack: 'STACK (Dense poster grid inspired by Weaving & Solving poster)'
  };

  // --- 4. LETTER SPLITTING & TACTILE CRAFT OBJECT GENERATION ---
  function renderHandmadeLetters(text) {
    currentSentence = text.trim() === '' ? 'WEAVING' : text.trim();
    textContainer.innerHTML = '';

    const chars = currentSentence.split('');
    const totalChars = chars.length;
    const angleStep = 360 / Math.max(totalChars, 1);

    chars.forEach((char, index) => {
      const charSpan = document.createElement('span');

      if (char === ' ') {
        charSpan.className = 'char-space';
        charSpan.innerHTML = '&nbsp;';
      } else {
        charSpan.className = 'char';
        charSpan.dataset.char = char;

        // Custom properties per character
        charSpan.style.setProperty('--i', index);
        charSpan.style.setProperty('--total', totalChars);
        charSpan.style.setProperty('--angle', `${(index * angleStep).toFixed(1)}deg`);

        // Subtle organic rotation & dimension imperfections per letter
        const tilt = (Math.sin(index * 2.7) * 9).toFixed(1);
        const randW = (0.92 + Math.abs(Math.sin(index * 1.5)) * 0.18).toFixed(2);
        const randH = (0.92 + Math.abs(Math.cos(index * 1.8)) * 0.18).toFixed(2);
        const randY = (Math.sin(index * 3.1) * 6).toFixed(1);
        const randSpacing = (0.02 + Math.abs(Math.sin(index)) * 0.04).toFixed(3);

        charSpan.style.setProperty('--rand-rot', `${tilt}deg`);
        charSpan.style.setProperty('--rand-w', randW);
        charSpan.style.setProperty('--rand-h', randH);
        charSpan.style.setProperty('--rand-y', `${randY}px`);
        charSpan.style.setProperty('--rand-spacing', `${randSpacing}em`);
        charSpan.style.setProperty('--rand-scale', 1);

        // Yarn color cycling
        const yarnColor = YARN_COLORS[index % YARN_COLORS.length];
        charSpan.style.setProperty('--char-yarn-color', yarnColor);
        charSpan.style.color = yarnColor;

        // Inner nested span for clean transform isolation
        const innerSpan = document.createElement('span');
        innerSpan.className = 'char-inner';
        innerSpan.textContent = char;
        charSpan.appendChild(innerSpan);

        // Hover touch interaction
        charSpan.addEventListener('mouseenter', () => {
          playTactileSound('tickle');
        });
      }

      textContainer.appendChild(charSpan);
    });
  }

  // --- 5. TEXT INPUT & PRESETS ---
  sentenceInput.addEventListener('input', (e) => {
    renderHandmadeLetters(e.target.value);
    playTactileSound('pop');
    presetChips.forEach((chip) => chip.classList.remove('active'));
  });

  clearInputBtn.addEventListener('click', () => {
    sentenceInput.value = '';
    sentenceInput.focus();
    renderHandmadeLetters('TEXTILE');
    playTactileSound('pop');
  });

  presetChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      presetChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const phrase = chip.dataset.text;
      sentenceInput.value = phrase;
      renderHandmadeLetters(phrase);
      playTactileSound('pop');
    });
  });

  // --- 6. 7 TYPOGRAPHIC BEHAVIORS SWITCHER ---
  const ALL_MODES = ['bouncy', 'wiggly', 'handmade', 'wave', 'circle', 'melt', 'stack'];

  function switchMode(newMode) {
    currentMode = newMode;
    ALL_MODES.forEach((m) => document.body.classList.remove(`mode-${m}`));
    document.body.classList.add(`mode-${newMode}`);

    // Update buttons UI
    modeButtons.forEach((btn) => {
      if (btn.dataset.mode === newMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update Status Bar
    if (interactionStatus && MODE_INFO[newMode]) {
      interactionStatus.querySelector('.status-text').textContent = `CURRENT MODE: ${MODE_INFO[newMode]}`;
    }

    playTactileSound('pop');
  }

  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      switchMode(btn.dataset.mode);
    });
  });

  // --- 7. VARIABLE FONT & MOUSE COORDINATE MODULATION ---
  posterStage.addEventListener('mousemove', (e) => {
    const rect = posterCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = Math.max(0, Math.min(1, x / rect.width));
    const normY = Math.max(0, Math.min(1, y / rect.height));

    if (!isWeirdActive) {
      // Horizontal mouse: left -> narrower, right -> wider (font-stretch & width factor)
      const stretchFactor = (0.75 + normX * 0.65).toFixed(2);
      const letterSpacing = (-0.02 + normX * 0.12).toFixed(3);
      document.documentElement.style.setProperty('--letter-spacing', `${letterSpacing}em`);
      document.documentElement.style.setProperty('--font-stretch-pct', `${Math.round(stretchFactor * 100)}%`);

      // Apply dynamic width stretch to characters
      const chars = document.querySelectorAll('.char');
      chars.forEach((c) => {
        c.style.setProperty('--rand-w', stretchFactor);
      });

      // Vertical mouse: top -> lighter (300-400), bottom -> heavier & chunky (900+)
      const dynamicWeight = Math.floor(300 + normY * 600);
      document.documentElement.style.setProperty('--font-weight', dynamicWeight);

      // Wonkiness and softness for Fraunces
      const wonkVal = (0.3 + normY * 0.7).toFixed(2);
      document.documentElement.style.setProperty('--font-wonk', wonkVal);

      // Wave & Melt modulation
      const waveAmp = Math.round(18 + normY * 28);
      document.documentElement.style.setProperty('--wave-amplitude', `${waveAmp}px`);

      const meltY = (0.9 + normY * 0.5).toFixed(2);
      const meltX = (1.2 - normY * 0.4).toFixed(2);
      document.documentElement.style.setProperty('--melt-stretch-y', meltY);
      document.documentElement.style.setProperty('--melt-stretch-x', meltX);
    }
  });

  posterStage.addEventListener('mouseleave', () => {
    if (!isWeirdActive) {
      document.documentElement.style.setProperty('--font-weight', 800);
      document.documentElement.style.setProperty('--letter-spacing', '0.04em');
      document.documentElement.style.setProperty('--wave-amplitude', '30px');
      document.documentElement.style.setProperty('--melt-stretch-y', 1.15);
      document.documentElement.style.setProperty('--melt-stretch-x', 0.9);

      const chars = document.querySelectorAll('.char');
      chars.forEach((c, idx) => {
        const defaultW = (0.92 + Math.abs(Math.sin(idx * 1.5)) * 0.18).toFixed(2);
        c.style.setProperty('--rand-w', defaultW);
      });
    }
  });

  // --- 8. “MAKE IT WEIRD!” ENGINE (Total Creative Scramble) ---
  function makeItWeird() {
    isWeirdActive = true;
    playTactileSound('weird');

    // Yarn & Wool particle explosion
    createYarnBurst(makeItWeirdBtn);

    // Randomize global axes
    const randWeight = Math.floor(300 + Math.random() * 600);
    const randSpacing = (-0.04 + Math.random() * 0.18).toFixed(3);
    const randWave = Math.floor(18 + Math.random() * 34);

    document.documentElement.style.setProperty('--font-weight', randWeight);
    document.documentElement.style.setProperty('--letter-spacing', `${randSpacing}em`);
    document.documentElement.style.setProperty('--wave-amplitude', `${randWave}px`);
    document.documentElement.style.setProperty('--font-wonk', (0.5 + Math.random() * 0.5).toFixed(2));
    document.documentElement.style.setProperty('--font-soft', Math.floor(40 + Math.random() * 60));

    // Randomize individual character properties (Tactile handmade variety)
    const chars = document.querySelectorAll('.char');
    chars.forEach((c) => {
      const rot = (-28 + Math.random() * 56).toFixed(1);
      const width = (0.7 + Math.random() * 0.65).toFixed(2);
      const height = (0.7 + Math.random() * 0.65).toFixed(2);
      const scale = (0.8 + Math.random() * 0.45).toFixed(2);
      const yShift = (-16 + Math.random() * 32).toFixed(1);

      // Random yarn color shuffle
      const randColor = YARN_COLORS[Math.floor(Math.random() * YARN_COLORS.length)];

      c.style.setProperty('--rand-rot', `${rot}deg`);
      c.style.setProperty('--rand-w', width);
      c.style.setProperty('--rand-h', height);
      c.style.setProperty('--rand-scale', scale);
      c.style.setProperty('--rand-y', `${yShift}px`);
      c.style.color = randColor;
    });

    if (interactionStatus) {
      interactionStatus.querySelector('.status-text').textContent =
        'CURRENT MOOD: MAXIMUM WEIRDNESS ACTIVATED! (Randomized craft objects)';
    }
  }

  makeItWeirdBtn.addEventListener('click', makeItWeird);

  // Yarn Burst Particle Effect
  function createYarnBurst(sourceEl) {
    const rect = sourceEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const craftIcons = ['🧶', '🧵', '✂️', '✦', '✿', '★', '●', '✨', '🧶'];
    const count = 16;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'yarn-particle';
      p.textContent = craftIcons[Math.floor(Math.random() * craftIcons.length)];

      const angle = (i / count) * 2 * Math.PI;
      const distance = 50 + Math.random() * 95;
      const tx = (Math.cos(angle) * distance).toFixed(1);
      const ty = (Math.sin(angle) * distance - 25).toFixed(1);
      const rot = (-90 + Math.random() * 180).toFixed(1);

      p.style.left = `${centerX}px`;
      p.style.top = `${centerY}px`;
      p.style.setProperty('--tx', `${tx}px`);
      p.style.setProperty('--ty', `${ty}px`);
      p.style.setProperty('--rot', `${rot}deg`);

      document.body.appendChild(p);

      setTimeout(() => {
        p.remove();
      }, 900);
    }
  }

  // --- 9. TYPEFACE & TEXTURE SWITCHERS ---
  const FONT_CLASSES = ['font-jacquard-12', 'font-jacquard-24', 'font-fraunces'];
  fontButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      fontButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const fontKey = btn.dataset.font;
      FONT_CLASSES.forEach((cls) => document.body.classList.remove(cls));
      document.body.classList.add(`font-${fontKey}`);
      playTactileSound('pop');
    });
  });

  textureToggleBtn.addEventListener('click', () => {
    isTextureActive = !isTextureActive;
    if (isTextureActive) {
      document.body.classList.add('texture-on');
      textureToggleBtn.classList.add('active');
      textureToggleBtn.querySelector('span').textContent = 'Yarn Texture: ON';
    } else {
      document.body.classList.remove('texture-on');
      textureToggleBtn.classList.remove('active');
      textureToggleBtn.querySelector('span').textContent = 'Yarn Texture: OFF';
    }
    playTactileSound('pop');
  });

  // --- 10. RESET & SOUND TOGGLE ---
  resetAllBtn.addEventListener('click', () => {
    isWeirdActive = false;
    document.documentElement.style.setProperty('--font-weight', 800);
    document.documentElement.style.setProperty('--letter-spacing', '0.04em');
    document.documentElement.style.setProperty('--font-wonk', 0.8);
    document.documentElement.style.setProperty('--font-soft', 70);
    document.documentElement.style.setProperty('--wave-amplitude', '30px');
    document.documentElement.style.setProperty('--melt-stretch-y', 1.15);
    document.documentElement.style.setProperty('--melt-stretch-x', 0.9);

    renderHandmadeLetters(sentenceInput.value);
    switchMode('bouncy');
    playTactileSound('pop');
  });

  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    const label = soundToggleBtn.querySelector('.sound-label');
    const icon = soundToggleBtn.querySelector('.sound-icon');

    if (soundEnabled) {
      label.textContent = 'Sound: ON';
      icon.textContent = '🔔';
      playTactileSound('pop');
    } else {
      label.textContent = 'Sound: OFF';
      icon.textContent = '🔕';
    }
  });

  // --- 11. INITIALIZATION ---
  renderHandmadeLetters(sentenceInput.value);
})();
