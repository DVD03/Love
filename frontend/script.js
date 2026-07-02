// -----------------------------------------
// Global State & Configuration
// -----------------------------------------
const targetClicks = 15;
let currentClicks = 0;
let soundSynthesizer = null;
let musicPlaying = false;
let sealBroken = false;
let letterOpened = false;

// Default Anniversary date: 1 year ago today
const anniversaryDate = new Date();
anniversaryDate.setFullYear(anniversaryDate.getFullYear() - 1);
anniversaryDate.setHours(0, 0, 0, 0);

// -----------------------------------------
// Custom Cursor & Spotlight Light Effect
// -----------------------------------------
const cursor = document.getElementById('custom-cursor');
const spotlight = document.getElementById('spotlight');

window.addEventListener('mousemove', (e) => {
    if (cursor) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    }
    
    if (spotlight) {
        spotlight.style.background = `radial-gradient(circle 350px at ${e.clientX}px ${e.clientY}px, rgba(181, 23, 158, 0.12) 0%, rgba(15, 2, 36, 0) 100%)`;
    }
});

window.addEventListener('mousedown', () => {
    if (cursor) cursor.classList.add('clicking');
});

window.addEventListener('mouseup', () => {
    if (cursor) cursor.classList.remove('clicking');
});

// -----------------------------------------
// Canvas Heart & Star Particle System
// -----------------------------------------
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
let stars = [];
const mouse = { x: null, y: null };

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
}

window.addEventListener('resize', resizeCanvas);

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (Math.random() < 0.15) {
        createHeartParticle(mouse.x, mouse.y, true);
    }
});

window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        if (Math.random() < 0.2) {
            createHeartParticle(mouse.x, mouse.y, true);
        }
    }
});

// Particle Classes
class HeartParticle {
    constructor(x, y, fromMouse = false) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 12 + 6;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = fromMouse ? (Math.random() * -1.5 - 0.5) : (Math.random() * -2 - 1);
        this.opacity = 1;
        this.decay = Math.random() * 0.015 + 0.005;
        this.color = Math.random() < 0.5 ? '#b5179e' : '#f72585';
        this.angle = Math.random() * 360;
        this.spin = Math.random() * 2 - 1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity -= this.decay;
        this.angle += this.spin;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.angle * Math.PI) / 180);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-this.size/2, -this.size/2, -this.size, -this.size/3, -this.size, this.size/3);
        ctx.bezierCurveTo(-this.size, this.size, 0, this.size*1.6, 0, this.size*2);
        ctx.bezierCurveTo(0, this.size*1.6, this.size, this.size, this.size, this.size/3);
        ctx.bezierCurveTo(this.size, -this.size/3, this.size/2, -this.size/2, 0, 0);
        ctx.fill();
        ctx.restore();
    }
}

class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.brightness = Math.random();
        this.speed = Math.random() * 0.02 + 0.005;
    }

    update() {
        this.brightness += this.speed;
        if (this.brightness > 1 || this.brightness < 0) {
            this.speed = -this.speed;
        }
    }

    draw() {
        ctx.globalAlpha = this.brightness;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initStars() {
    stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 12000);
    for (let i = 0; i < count; i++) {
        stars.push(new Star());
    }
}

function createHeartParticle(x, y, fromMouse = false) {
    particles.push(new HeartParticle(x, y, fromMouse));
}

function triggerHeartBurst(x, y, count = 30) {
    for (let i = 0; i < count; i++) {
        const p = new HeartParticle(x, y);
        p.speedX = Math.random() * 8 - 4;
        p.speedY = Math.random() * 8 - 4;
        particles.push(p);
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    stars.forEach(star => {
        star.update();
        star.draw();
    });

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].opacity <= 0) {
            particles.splice(i, 1);
        }
    }
    
    requestAnimationFrame(animateParticles);
}

// -----------------------------------------
// Sound Synthesis Engine (Web Audio API)
// -----------------------------------------
class LoveSynth {
    constructor() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.audioCtx.createGain();
        this.gainNode.connect(this.audioCtx.destination);
        this.gainNode.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
        this.ambientSynthInterval = null;
    }

    resume() {
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    // Cartoon Chime Sound on click (Springy Bubbly Pop)
    playChime(pitchModifier = 0) {
        this.resume();
        const t = this.audioCtx.currentTime;
        
        const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
        const baseFreq = notes[pitchModifier % notes.length];

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, t);
        // Springy pitch bend upward
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, t + 0.15);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(t);
        osc.stop(t + 0.4);
    }

    // Pop sound when a bubble is clicked
    playBubblePop() {
        this.resume();
        const t = this.audioCtx.currentTime;
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.type = 'sine';
        // Fast pitch slide upward simulating popping bubble
        osc.frequency.setValueAtTime(500, t);
        osc.frequency.exponentialRampToValueAtTime(1600, t + 0.08);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        
        osc.start(t);
        osc.stop(t + 0.1);
    }

    // Boing sound effect when Runaway button moves
    playBoing() {
        this.resume();
        const t = this.audioCtx.currentTime;
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.type = 'triangle';
        // Falling and rising springy frequency
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.15);
        osc.frequency.exponentialRampToValueAtTime(220, t + 0.3);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        
        osc.start(t);
        osc.stop(t + 0.4);
    }

    playSealBreak() {
        this.resume();
        const t = this.audioCtx.currentTime;
        
        const osc1 = this.audioCtx.createOscillator();
        const gain1 = this.audioCtx.createGain();
        
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(200, t);
        osc1.frequency.linearRampToValueAtTime(80, t + 0.2);
        
        gain1.gain.setValueAtTime(0, t);
        gain1.gain.linearRampToValueAtTime(0.3, t + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        
        osc1.connect(gain1);
        gain1.connect(this.audioCtx.destination);
        
        osc1.start(t);
        osc1.stop(t + 0.3);
    }

    playHappyChords() {
        this.resume();
        const t = this.audioCtx.currentTime;
        const root = 261.63; // C4
        const ratio = [1, 1.25, 1.5, 1.875, 2, 2.5]; // Sweet arpeggio
        
        ratio.forEach((r, idx) => {
            const osc = this.audioCtx.createOscillator();
            const oscGain = this.audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(root * r, t + idx * 0.05);
            
            oscGain.gain.setValueAtTime(0, t + idx * 0.05);
            oscGain.gain.linearRampToValueAtTime(0.18, t + idx * 0.05 + 0.04);
            oscGain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
            
            osc.connect(oscGain);
            oscGain.connect(this.audioCtx.destination);
            osc.start(t + idx * 0.05);
            osc.stop(t + 2.0);
        });
    }

    startAmbientMelody() {
        this.resume();
        
        const playPad = (freq, duration, type = 'triangle', gainVal = 0.03) => {
            const t = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const oscGain = this.audioCtx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t);
            
            oscGain.gain.setValueAtTime(0, t);
            oscGain.gain.linearRampToValueAtTime(gainVal, t + 1.0);
            oscGain.gain.linearRampToValueAtTime(gainVal, t + duration - 1.0);
            oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
            
            osc.connect(oscGain);
            oscGain.connect(this.gainNode);
            osc.start(t);
            osc.stop(t + duration + 0.1);
        };

        const playArpNote = (freq, timeOffset, volume = 0.05) => {
            const t = this.audioCtx.currentTime + timeOffset;
            const osc = this.audioCtx.createOscillator();
            const oscGain = this.audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            
            oscGain.gain.setValueAtTime(0, t);
            oscGain.gain.linearRampToValueAtTime(volume, t + 0.1);
            oscGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
            
            osc.connect(oscGain);
            oscGain.connect(this.gainNode);
            osc.start(t);
            osc.stop(t + 1.5);
        };

        let loopCount = 0;
        const playProgression = () => {
            if (!musicPlaying) return;
            
            const chords = [
                { root: 130.81, notes: [261.63, 329.63, 392.00, 493.88] }, // Cmaj7
                { root: 110.00, notes: [220.00, 261.63, 329.63, 392.00] }, // Am7
                { root: 87.31,  notes: [174.61, 261.63, 349.23, 440.00] }, // Fmaj7
                { root: 98.00,  notes: [196.00, 293.66, 392.00, 440.00] }  // G6
            ];

            const currentChord = chords[loopCount % chords.length];
            
            playPad(currentChord.root, 4.0, 'triangle', 0.04);
            
            currentChord.notes.forEach((note, index) => {
                playArpNote(note, index * 0.6);
            });

            loopCount++;
            this.ambientSynthInterval = setTimeout(playProgression, 4000);
        };

        playProgression();
    }

    stopAmbientMelody() {
        if (this.ambientSynthInterval) {
            clearTimeout(this.ambientSynthInterval);
            this.ambientSynthInterval = null;
        }
    }
}

function getSynth() {
    if (!soundSynthesizer) {
        soundSynthesizer = new LoveSynth();
    }
    return soundSynthesizer;
}

// -----------------------------------------
// Music Toggle Button
// -----------------------------------------
const musicBtn = document.getElementById('music-btn');
musicBtn.addEventListener('click', () => {
    const synth = getSynth();
    synth.resume();
    
    if (musicPlaying) {
        musicPlaying = false;
        musicBtn.classList.remove('playing');
        synth.stopAmbientMelody();
    } else {
        musicPlaying = true;
        musicBtn.classList.add('playing');
        synth.startAmbientMelody();
    }
});

// -----------------------------------------
// Spawning Floating Popping Bubbles
// -----------------------------------------
const bubbleContainer = document.getElementById('bubble-container');

function spawnBubble() {
    if (!bubbleContainer) return;
    
    const bubble = document.createElement('div');
    bubble.classList.add('cartoon-bubble-item');
    
    // Randomize bubble size & coordinates
    const size = Math.floor(Math.random() * 45) + 30; // 30px to 75px
    const left = Math.floor(Math.random() * 85) + 5;  // 5% to 90%
    const duration = Math.random() * 4 + 6;           // 6s to 10s
    const wobbleX = Math.floor(Math.random() * 100) - 50; // -50px to 50px
    
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${left}%`;
    bubble.style.animationDuration = `${duration}s`;
    bubble.style.setProperty('--wobble-x', `${wobbleX}px`);
    
    // Click or touch to pop bubble
    const popAction = (e) => {
        e.stopPropagation();
        if (bubble.classList.contains('popping')) return;
        
        bubble.classList.add('popping');
        
        // Play Pop sound
        const synth = getSynth();
        synth.playBubblePop();
        
        // Pop particles burst on canvas
        const rect = bubble.getBoundingClientRect();
        triggerHeartBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 6);
        
        // Remove from DOM
        setTimeout(() => {
            bubble.remove();
        }, 200);
    };
    
    bubble.addEventListener('mousedown', popAction);
    bubble.addEventListener('touchstart', popAction);
    
    bubbleContainer.appendChild(bubble);
    
    // Auto cleanup if it floats past top
    setTimeout(() => {
        if (bubble.parentNode) {
            bubble.remove();
        }
    }, duration * 1000);
}

// Spawn bubble every 1.5 seconds
setInterval(spawnBubble, 1500);

// -----------------------------------------
// Intro: Growing Heart Interaction
// -----------------------------------------
const growHeartBtn = document.getElementById('grow-heart');
const clickCounter = document.getElementById('click-counter');
const progressBar = document.getElementById('intro-progress');
const progressHint = document.getElementById('progress-text');
const introScreen = document.getElementById('intro-screen');
const mainContent = document.getElementById('main-content');

let heartScale = 1;
const prompts = [
    "Click again! 💕",
    "Keep going! 🥰",
    "Pouring love... ✨",
    "Dona is my world! ❤️",
    "Almost there! 💖",
    "Dona & Dilum 🌟"
];

growHeartBtn.addEventListener('click', (e) => {
    const synth = getSynth();
    currentClicks++;
    
    heartScale += 0.07;
    growHeartBtn.style.transform = `scale(${heartScale})`;
    
    const rect = growHeartBtn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    triggerHeartBurst(centerX, centerY, 8);
    
    const clicksRemaining = targetClicks - currentClicks;
    clickCounter.textContent = clicksRemaining;
    
    const percentage = (currentClicks / targetClicks) * 100;
    progressBar.style.width = `${percentage}%`;
    
    synth.playChime(currentClicks);
    
    if (clicksRemaining > 0) {
        const promptIndex = Math.floor(currentClicks / 3) % prompts.length;
        progressHint.textContent = `${prompts[promptIndex]} (${clicksRemaining} more)`;
    } else {
        progressHint.textContent = "BURST! 🌟";
        clickCounter.style.display = 'none';
        
        triggerHeartBurst(centerX, centerY, 60);
        synth.playHappyChords();
        
        if (!musicPlaying) {
            musicPlaying = true;
            musicBtn.classList.add('playing');
            synth.startAmbientMelody();
        }

        setTimeout(() => {
            introScreen.classList.add('fade-out');
            mainContent.classList.add('active');
            startLoveTimer();
        }, 800);
    }
});

// -----------------------------------------
// Love Timer Logic
// -----------------------------------------
function startLoveTimer() {
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minsEl = document.getElementById('minutes');
    const secsEl = document.getElementById('seconds');
    
    function updateTimer() {
        const now = new Date();
        const difference = now - anniversaryDate;
        
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);
        
        daysEl.textContent = d.toString().padStart(2, '0');
        hoursEl.textContent = h.toString().padStart(2, '0');
        minsEl.textContent = m.toString().padStart(2, '0');
        secsEl.textContent = s.toString().padStart(2, '0');
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

// -----------------------------------------
// Polaroid Stack Shuffler
// -----------------------------------------
const polaroids = Array.from(document.querySelectorAll('.polaroid-stack .polaroid'));
let shufflingActive = false;

polaroids.forEach(card => {
    card.addEventListener('click', () => {
        if (shufflingActive || !card.classList.contains('polaroid-1')) return;
        
        shufflingActive = true;
        const synth = getSynth();
        synth.playChime(4);
        
        card.classList.add('shuffling');
        
        setTimeout(() => {
            const frontCard = document.querySelector('.polaroid-1');
            const middleCard = document.querySelector('.polaroid-2');
            const backCard = document.querySelector('.polaroid-3');
            
            frontCard.classList.remove('polaroid-1');
            frontCard.classList.add('polaroid-3');
            
            middleCard.classList.remove('polaroid-2');
            middleCard.classList.add('polaroid-1');
            
            backCard.classList.remove('polaroid-3');
            backCard.classList.add('polaroid-2');
        }, 350);
        
        setTimeout(() => {
            card.classList.remove('shuffling');
            shufflingActive = false;
        }, 700);
    });
});

// -----------------------------------------
// Envelope & Wax Seal Logic
// -----------------------------------------
const envelope = document.getElementById('envelope');
const envelopeWrapper = document.querySelector('.envelope-wrapper');
const envelopeSeal = document.getElementById('envelope-seal');
const envelopeActionText = document.getElementById('envelope-action-text');
const typewriterText = document.getElementById('typewriter-text');

const letterMessage = `My dearest Dona, 🌸

From the moment you walked into my life, you changed everything. Your beautiful, cute smile is my daily dose of happiness, and your laughter is the sweetest melody I've ever heard. 

Thank you for being my support system, my companion, and my greatest source of love. I cherish every single memory we've shared, and I look forward to building a lifetime of beautiful, bubbly tomorrows with you. 

You are my today and all of my futures. 

I love you with all my heart, forever and always.`;

let typewriterIndex = 0;
function typeLetter() {
    if (typewriterIndex < letterMessage.length) {
        const char = letterMessage.charAt(typewriterIndex);
        if (char === '\n') {
            typewriterText.innerHTML += '<br>';
        } else {
            typewriterText.innerHTML += char;
        }
        typewriterIndex++;
        
        const container = document.querySelector('.letter-text-container');
        container.scrollTop = container.scrollHeight;
        
        setTimeout(typeLetter, 30);
    }
}

// Break seal
envelopeSeal.addEventListener('click', (e) => {
    e.stopPropagation();
    if (sealBroken) return;
    
    sealBroken = true;
    const synth = getSynth();
    synth.playSealBreak();
    
    envelopeSeal.classList.add('broken');
    envelopeActionText.textContent = "Great! Now tap the envelope to slide open the letter. 💌";
    
    const rect = envelopeSeal.getBoundingClientRect();
    triggerHeartBurst(rect.left + rect.width/2, rect.top + rect.height/2, 12);
});

// Open envelope
envelope.addEventListener('click', () => {
    if (!sealBroken) {
        envelopeSeal.classList.add('pulse-fast');
        setTimeout(() => { envelopeSeal.classList.remove('pulse-fast'); }, 600);
        envelopeActionText.textContent = "Break the heart seal first! 💖";
        return;
    }
    
    if (!letterOpened) {
        envelopeWrapper.classList.add('open');
        letterOpened = true;
        envelopeActionText.style.opacity = '0';
        setTimeout(typeLetter, 800);
    } else {
        envelopeWrapper.classList.toggle('open');
    }
});

// -----------------------------------------
// Memory Cards Flipping Logic
// -----------------------------------------
const cards = document.querySelectorAll('.flip-card');
cards.forEach(card => {
    card.addEventListener('click', () => {
        card.classList.toggle('flipped');
        const synth = getSynth();
        synth.playChime(3);
    });
});

// -----------------------------------------
// Runaway No Button Game
// -----------------------------------------
const noBtn = document.getElementById('no-btn');
const yesBtn = document.getElementById('yes-btn');
const celebrationOverlay = document.getElementById('celebration-overlay');
const closeOverlayBtn = document.getElementById('close-overlay');

function moveNoButton() {
    const container = document.querySelector('.proposal-buttons');
    const containerRect = container.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();
    
    const maxX = containerRect.width - btnRect.width;
    const maxY = containerRect.height - btnRect.height;
    
    let randomX = Math.random() * maxX;
    let randomY = Math.random() * maxY;
    
    noBtn.style.left = `${randomX}px`;
    noBtn.style.top = `${randomY}px`;
    
    triggerHeartBurst(btnRect.left + btnRect.width/2, btnRect.top + btnRect.height/2, 4);
    
    // Play funny boing sound on runaway
    const synth = getSynth();
    synth.playBoing();
}

noBtn.addEventListener('mouseover', moveNoButton);
noBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    moveNoButton();
});

// Yes Celebration Actions
yesBtn.addEventListener('click', () => {
    const synth = getSynth();
    synth.playHappyChords();
    
    const rect = yesBtn.getBoundingClientRect();
    triggerHeartBurst(rect.left + rect.width/2, rect.top + rect.height/2, 80);
    
    const fireworksCount = 5;
    for(let i = 0; i < fireworksCount; i++) {
        setTimeout(() => {
            const rx = Math.random() * window.innerWidth;
            const ry = Math.random() * (window.innerHeight * 0.7);
            triggerHeartBurst(rx, ry, 40);
            synth.playHappyChords();
        }, i * 400);
    }
    
    celebrationOverlay.classList.add('active');
});

closeOverlayBtn.addEventListener('click', () => {
    celebrationOverlay.classList.remove('active');
});

// Initial Setup
resizeCanvas();
initStars();
animateParticles();
