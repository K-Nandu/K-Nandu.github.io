// -- 1. Canvas Constellation & Nexus Nodes --
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let nexusNodes = [];
const chars = '01ABCDEF!@#$'.split('');
const colors = ['#22d3ee', '#a78bfa', '#ff5568', '#fbbf24', '#c4b5fd'];

// 5 Navigation Nodes (Pentagon Layout)
const nodeData = [
    { id: 'about', label: 'ABOUT', color: '#c4b5fd', angle: Math.PI * 1.5 },       // Top
    { id: 'experience', label: 'EXPERIENCE', color: '#fbbf24', angle: Math.PI * 1.9 }, // Top Right
    { id: 'projects', label: 'PROJECTS', color: '#22d3ee', angle: Math.PI * 0.3 },   // Bottom Right
    { id: 'skills', label: 'SKILLS', color: '#a78bfa', angle: Math.PI * 0.7 },       // Bottom Left
    { id: 'contact', label: 'CONTACT', color: '#ff5568', angle: Math.PI * 1.1 }      // Top Left
];

function initCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    
    // Background particles
    const numParticles = width < 768 ? 50 : 100;
    particles = [];
    for(let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            char: chars[Math.floor(Math.random() * chars.length)],
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 10 + 8
        });
    }

    // Nexus Nodes
    nexusNodes = [];
    const cx = width / 2;
    const cy = height / 2;
    
    // Radius for pentagon layout
    const radiusX = width < 768 ? width * 0.38 : 380;
    const radiusY = width < 768 ? height * 0.30 : 250;

    nodeData.forEach((data, i) => {
        const angle = data.angle;
        nexusNodes.push({
            id: data.id,
            label: data.label,
            color: data.color,
            x: cx + Math.cos(angle) * radiusX,
            y: cy + Math.sin(angle) * radiusY,
            baseX: cx + Math.cos(angle) * radiusX,
            baseY: cy + Math.sin(angle) * radiusY,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2,
            radius: width < 768 ? 40 : 60,
            angle: angle
        });
    });
}
window.addEventListener('resize', initCanvas);
initCanvas();

let mouse = { x: -1000, y: -1000 };
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('touchmove', e => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }, {passive: true});
window.addEventListener('touchend', () => { mouse.x = -1000; mouse.y = -1000; });

// Camera / Zoom state
let camera = { x: 0, y: 0, scale: 1 };
let targetCamera = { x: 0, y: 0, scale: 1 };
let isZoomed = false;

// Gravity Physics State
let gravityMode = false;
let tiltX = 0;
let tiltY = 0.5; // default downward gravity

function drawCanvas() {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    // Ease camera
    camera.x += (targetCamera.x - camera.x) * 0.05;
    camera.y += (targetCamera.y - camera.y) * 0.05;
    camera.scale += (targetCamera.scale - camera.scale) * 0.05;

    ctx.save();
    
    // Apply camera transform
    if(camera.scale !== 1) {
        ctx.translate(width/2, height/2);
        ctx.scale(camera.scale, camera.scale);
        ctx.translate(-width/2 + camera.x, -height/2 + camera.y);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const connectDistance = width < 768 ? 100 : 150;
    const mouseRepelDist = 120;

    // Draw lines first
    if(!gravityMode) {
        for(let i = 0; i < particles.length; i++) {
            let p = particles[i];
            for(let j = i + 1; j < particles.length; j++) {
                let p2 = particles[j];
                let dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                if(dist < connectDistance) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(34, 211, 238, ${(1 - dist/connectDistance) * 0.3})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
    }

    // Draw background particles
    for(let i = 0; i < particles.length; i++) {
        let p = particles[i];
        
        if (gravityMode) {
            p.vx += tiltX;
            p.vy += tiltY;
            p.x += p.vx;
            p.y += p.vy;
            
            // Floor bounce
            if (p.y > height) {
                p.y = height;
                p.vy *= -0.6; // damping
                p.vx *= 0.9;  // friction
            }
            // Ceiling bounce
            if (p.y < 0) {
                p.y = 0;
                p.vy *= -0.6;
            }
            // Walls
            if (p.x > width) { p.x = width; p.vx *= -0.6; }
            if (p.x < 0) { p.x = 0; p.vx *= -0.6; }
        } else {
            p.x += p.vx; p.y += p.vy;
            if(p.x < 0 || p.x > width) p.vx *= -1;
            if(p.y < 0 || p.y > height) p.vy *= -1;
            
            let dx = p.x - mouse.x; let dy = p.y - mouse.y;
            let dist = Math.hypot(dx, dy);
            if (!isZoomed && dist < mouseRepelDist) {
                let force = (mouseRepelDist - dist) / mouseRepelDist;
                p.x += (dx / dist) * force * 2;
                p.y += (dy / dist) * force * 2;
            }
        }

        ctx.font = `${p.size}px "JetBrains Mono"`;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.3; 
        ctx.fillText(p.char, p.x, p.y);
        ctx.globalAlpha = 1.0; 
    }

    // Draw Nexus Nodes
    const time = Date.now() * 0.001;
    for(let i = 0; i < nexusNodes.length; i++) {
        let node = nexusNodes[i];
        
        if (gravityMode) {
            node.vx += tiltX * 1.5;
            node.vy += tiltY * 1.5;
            node.baseX += node.vx;
            node.baseY += node.vy;
            
            // Bounding box collisions for nodes
            if (node.baseY > height - node.radius) {
                node.baseY = height - node.radius;
                node.vy *= -0.5;
                node.vx *= 0.95;
            }
            if (node.baseY < node.radius) {
                node.baseY = node.radius;
                node.vy *= -0.5;
            }
            if (node.baseX > width - node.radius) {
                node.baseX = width - node.radius;
                node.vx *= -0.5;
            }
            if (node.baseX < node.radius) {
                node.baseX = node.radius;
                node.vx *= -0.5;
            }
            
            node.x = node.baseX;
            node.y = node.baseY;
        } else {
            node.x = node.baseX + Math.cos(time + node.angle) * 15;
            node.y = node.baseY + Math.sin(time + node.angle) * 15;
        }

        let dx = node.x - mouse.x;
        let dy = node.y - mouse.y;
        let dist = Math.hypot(dx, dy);
        let isHover = !isZoomed && dist < Math.max(node.radius, 80);

        // Core
        ctx.beginPath();
        ctx.arc(node.x, node.y, isHover ? 8 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isHover ? '#fff' : node.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = node.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner Ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, 25, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${isHover ? 0.6 : 0.1})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rotating Dashed Outer Ring
        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.rotate(time * (i % 2 === 0 ? 0.8 : -0.8));
        ctx.beginPath();
        ctx.setLineDash([15, 10]);
        ctx.arc(0, 0, 42, 0, Math.PI * 2);
        ctx.strokeStyle = node.color;
        ctx.lineWidth = isHover ? 2 : 1;
        ctx.globalAlpha = isHover ? 1 : 0.6;
        ctx.stroke();
        ctx.restore();

        // Solid Text Box
        ctx.font = `bold ${isHover ? 14 : 12}px "JetBrains Mono"`;
        let labelText = `> ${node.label} <`;
        let textWidth = ctx.measureText(labelText).width;
        let boxWidth = textWidth + 20;
        let boxHeight = 24;
        let boxY = node.y + 60;
        
        ctx.fillStyle = 'rgba(5, 5, 8, 0.9)';
        ctx.fillRect(node.x - boxWidth/2, boxY - boxHeight/2, boxWidth, boxHeight);
        
        ctx.strokeStyle = isHover ? '#fff' : node.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(node.x - boxWidth/2, boxY - boxHeight/2, boxWidth, boxHeight);

        ctx.fillStyle = isHover ? '#fff' : node.color;
        ctx.fillText(labelText, node.x, boxY + 1);
    }

    ctx.restore();
    requestAnimationFrame(drawCanvas);
}
drawCanvas();


// -- 2. UI Interaction (Zoom & Responsive Layout) --
const heroCenter = document.getElementById('hero-center');
const contentView = document.getElementById('content-view');
const btnBack = document.getElementById('btn-back');
const sections = document.querySelectorAll('.content-section');
const desktopNavBtns = document.querySelectorAll('.nav-btn-bottom');
const scrollContainer = document.getElementById('scroll-container');

function handleNodeClick(clientX, clientY) {
    if(isZoomed) return;
    
    for(let i = 0; i < nexusNodes.length; i++) {
        let node = nexusNodes[i];
        let hitRadius = Math.max(node.radius, 100); 
        let dist = Math.hypot(node.x - clientX, node.y - clientY);
        
        if(dist < hitRadius) {
            openSection(node.id, node.x, node.y);
            break;
        }
    }
}

canvas.addEventListener('click', (e) => handleNodeClick(e.clientX, e.clientY));
canvas.addEventListener('touchend', (e) => {
    if(e.changedTouches.length > 0) handleNodeClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
});

window.addEventListener('mousemove', (e) => {
    if(isZoomed) {
        canvas.style.cursor = 'default';
        return;
    }
    let isHoveringNode = false;
    for(let i = 0; i < nexusNodes.length; i++) {
        let node = nexusNodes[i];
        if(Math.hypot(node.x - e.clientX, node.y - e.clientY) < Math.max(node.radius, 80)) {
            isHoveringNode = true;
            break;
        }
    }
    canvas.style.cursor = isHoveringNode ? 'pointer' : 'default';
});

function openSection(targetId, nodeX, nodeY) {
    isZoomed = true;
    
    targetCamera.scale = 4;
    targetCamera.x = (width/2) - nodeX;
    targetCamera.y = (height/2) - nodeY;

    heroCenter.style.opacity = '0';
    heroCenter.style.transform = 'scale(1.2)';

    if (window.innerWidth >= 768) {
        // Desktop: Fade into section
        switchSectionDesktop(targetId);
    } else {
        // Mobile: Jump scroll to section
        scrollContainer.style.scrollBehavior = 'auto'; // instant jump
        const targetEl = document.getElementById('section-' + targetId);
        if (targetEl) {
            targetEl.scrollIntoView();
            // Trigger decryption for this specific section on mobile manually since switchSection isn't used
            const titleEl = targetEl.querySelector('.decrypt-text-panel');
            if (titleEl) {
                titleEl.innerText = "________";
                setTimeout(() => decryptText(titleEl, 40), 300);
            }
        }
    }

    setTimeout(() => {
        contentView.style.opacity = '1';
        contentView.style.pointerEvents = 'auto';
        if (window.innerWidth < 768) {
            // Restore smooth scrolling for manual swipes
            scrollContainer.style.scrollBehavior = 'smooth';
        }
    }, 400);
}

function switchSectionDesktop(targetId) {
    desktopNavBtns.forEach(btn => {
        if(btn.dataset.target === targetId) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    sections.forEach(sec => {
        if(sec.id === 'section-' + targetId) {
            sec.classList.add('active');
            const titleEl = sec.querySelector('.decrypt-text-panel');
            if (titleEl) {
                titleEl.innerText = "________";
                setTimeout(() => decryptText(titleEl, 40), 300);
            }
        } else {
            sec.classList.remove('active');
        }
    });
}

// Desktop Bottom nav bar switching
desktopNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        switchSectionDesktop(btn.dataset.target);
    });
});

// Mobile Scroll Intersection Observer (Triggers decrypt when scrolling into view)
const scrollObserver = new IntersectionObserver((entries) => {
    if (window.innerWidth >= 768 || !isZoomed) return;
    
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            const titleEl = entry.target.querySelector('.decrypt-text-panel');
            if (titleEl && titleEl.innerText === "________") {
                decryptText(titleEl, 40);
            }
        } else {
            // Reset text when it leaves view so it decrypts again next time
            const titleEl = entry.target.querySelector('.decrypt-text-panel');
            if (titleEl) titleEl.innerText = "________";
        }
    });
}, { threshold: 0.3, root: scrollContainer });

sections.forEach(sec => scrollObserver.observe(sec));


// Back Button (Zoom out)
btnBack.addEventListener('click', () => {
    isZoomed = false;
    
    contentView.style.opacity = '0';
    contentView.style.pointerEvents = 'none';
    sections.forEach(sec => sec.classList.remove('active'));

    targetCamera.scale = 1;
    targetCamera.x = 0;
    targetCamera.y = 0;

    setTimeout(() => {
        heroCenter.style.opacity = '1';
        heroCenter.style.transform = 'scale(1)';
    }, 300);
});


// -- 3. Decryption Animation --
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
function decryptText(element, intervalSpeed = 30) {
    const original = element.dataset.value;
    let iter = 0;
    
    if (element.intervalId) clearInterval(element.intervalId);
    
    element.intervalId = setInterval(() => {
        element.innerText = original.split("").map((letter, index) => {
            if(letter === ' ') return ' ';
            if(index < iter) return original[index];
            return letters[Math.floor(Math.random() * letters.length)];
        }).join("");
        
        if(iter >= original.length) clearInterval(element.intervalId);
        iter += 1/3;
    }, intervalSpeed);
}

setTimeout(() => {
    document.querySelectorAll('.decrypt-text').forEach(el => decryptText(el));
}, 500);


// -- 4. Terminal Logic --
const terminalBtnDesktop = document.getElementById('desktop-terminal-btn');
const terminalBtnMobile = document.getElementById('mobile-terminal-btn');
const terminalOverlay = document.getElementById('terminal-overlay');
const terminalClose = document.getElementById('close-terminal');
const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');
const terminalPrompt = document.getElementById('terminal-prompt');
const btnSubmitFlag = document.getElementById('btn-submit-flag');

const openTerminal = () => {
    terminalOverlay.classList.remove('hidden');
    terminalOverlay.classList.add('flex');
    setTimeout(() => terminalInput.focus(), 100);
};

if(terminalBtnDesktop) terminalBtnDesktop.addEventListener('click', openTerminal);
if(terminalBtnMobile) terminalBtnMobile.addEventListener('click', openTerminal);
if(btnSubmitFlag) btnSubmitFlag.addEventListener('click', openTerminal);

if(terminalClose) {
    terminalClose.addEventListener('click', () => {
        terminalOverlay.classList.add('hidden');
        terminalOverlay.classList.remove('flex');
    });
}

// CTF State
let ctfState = { server: 'whoami', user: 'root' };
const fileSystem = {
    'local': {
        'notes.txt': 'Note to self: The internal backup server is running at 10.0.0.4. Guest SSH access is currently enabled. - Nandu',
        'secure_vault.enc': '0x8F9A2B... [ENCRYPTED DATA] Requires decryption key.',
        'decrypt.py': 'Usage: python decrypt.py [file] [key]'
    },
    'backup': {
        'passwords.bak': 'admin_vault_key : cYb3r_k3y_99\nguest : <blank>',
        'system.log': 'Server rebooted at 04:00 AM.'
    }
};

if(terminalInput) {
    terminalInput.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') {
            const val = terminalInput.value.trim();
            terminalInput.value = '';
            if(!val) return;
            
            const args = val.split(' ').filter(Boolean);
            const cmd = args[0].toLowerCase();
            
            let currentFS = ctfState.server === 'whoami' ? fileSystem['local'] : fileSystem['backup'];
            let promptText = `${ctfState.user}@${ctfState.server}:~$ `;
            
            const line = document.createElement('div');
            line.className = 'text-white mt-2';
            line.textContent = promptText + val;
            terminalOutput.appendChild(line);
            
            const response = document.createElement('div');
            response.className = 'text-[#22d3ee] mt-1';
            
            if (cmd === 'help') {
                response.innerHTML = `Available commands:<br><br>
- <span class="text-yellow">whoami</span>: Display user profile<br>
- <span class="text-yellow">ls</span>: List directory contents<br>
- <span class="text-yellow">cat [file]</span>: Read file contents<br>
- <span class="text-yellow">nmap [ip]</span>: Scan network for open ports<br>
- <span class="text-yellow">ssh [user@ip]</span>: Connect to remote server<br>
- <span class="text-yellow">python [file]</span>: Execute python script<br>
- <span class="text-yellow">clear</span>: Clear terminal<br>
- <span class="text-yellow">exit</span>: Close terminal or connection`;
            } else if (cmd === 'whoami') {
                response.textContent = ctfState.user;
            } else if (cmd === 'ls') {
                response.innerHTML = Object.keys(currentFS).map(f => `<span class="text-white">${f}</span>`).join('  ');
            } else if (cmd === 'cat') {
                const file = args[1];
                if (!file) response.textContent = 'cat: missing file operand';
                else if (currentFS[file]) response.textContent = currentFS[file];
                else response.textContent = `cat: ${file}: No such file or directory`;
            } else if (cmd === 'nmap') {
                if (args[1] === '10.0.0.4') {
                    response.innerHTML = `Starting Nmap...<br>
                    PORT   STATE SERVICE<br>
                    22/tcp open  ssh<br>
                    80/tcp open  http<br>
                    Nmap done: 1 IP address (1 host up) scanned.`;
                } else {
                    response.textContent = 'Nmap done: 1 IP address (0 hosts up) scanned.';
                }
            } else if (cmd === 'ssh') {
                if (ctfState.server !== 'whoami') {
                    response.textContent = 'ssh: Already in a remote session. Use "exit" first.';
                } else if (args[1] === 'guest@10.0.0.4') {
                    ctfState.server = 'backup-server';
                    ctfState.user = 'guest';
                    response.innerHTML = 'Warning: Permanently added 10.0.0.4 to the list of known hosts.<br>Welcome to Ubuntu 22.04 LTS (GNU/Linux).';
                    if(terminalPrompt) terminalPrompt.textContent = 'guest@backup-server:~$ ';
                } else {
                    response.textContent = 'ssh: connect to host port 22: Connection refused';
                }
            } else if (cmd === 'exit') {
                if (ctfState.server === 'backup-server') {
                    ctfState.server = 'whoami';
                    ctfState.user = 'root';
                    response.textContent = 'Connection to 10.0.0.4 closed.';
                    if(terminalPrompt) terminalPrompt.textContent = 'root@whoami:~$ ';
                } else {
                    terminalOverlay.classList.add('hidden');
                    terminalOverlay.classList.remove('flex');
                }
            } else if (cmd === 'decrypt') {
                response.textContent = `decrypt: command requires encrypted volume. System is currently healthy.`;
            } else if (cmd === 'python' || cmd === 'python3') {
                if (ctfState.server === 'whoami' && args[1] === 'decrypt.py') {
                    if (args[2] === 'secure_vault.enc' && args[3] === 'cYb3r_k3y_99') {
                        response.innerHTML = `[+] Decrypting vault...<br><span class="text-[#ff5568]">SUCCESS! Flag: flag{zU1_h4ck3r_3l1t3}</span>`;
                    } else {
                        response.textContent = '[-] Decryption failed. Invalid key or file.';
                    }
                } else {
                    response.textContent = `python: can't open file '${args[1]}': [Errno 2] No such file or directory`;
                }
            } else if (cmd === 'clear') {
                terminalOutput.innerHTML = '';
                return;
            } else {
                response.textContent = `Command not found: ${cmd}`;
            }
            
            terminalOutput.appendChild(response);
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }
    });
}

// -- Flag Modal --
if(btnSubmitFlag) {
    btnSubmitFlag.addEventListener('click', () => {
        document.getElementById('flag-modal').classList.remove('hidden');
        document.getElementById('flag-modal').classList.add('flex');
    });
}
const flagModal = document.getElementById('flag-modal');
const btnFlagCancel = document.getElementById('btn-flag-cancel');
const btnFlagSubmit = document.getElementById('btn-flag-submit');
const flagInput = document.getElementById('flag-input');
const flagResult = document.getElementById('flag-result');

btnFlagCancel.addEventListener('click', () => {
    flagModal.classList.add('hidden');
    flagModal.classList.remove('flex');
    flagInput.value = '';
    flagResult.classList.add('hidden');
});

btnFlagSubmit.addEventListener('click', () => {
    if(flagInput.value.trim() === 'flag{zU1_h4ck3r_3l1t3}') {
        flagResult.textContent = "ACCESS GRANTED. YOU HAVE CONQUERED THE SYSTEM.";
        flagResult.className = "text-center text-xs font-bold mt-2 text-[#22d3ee]";
    } else {
        flagResult.textContent = "ACCESS DENIED. INCORRECT FLAG.";
        flagResult.className = "text-center text-xs font-bold mt-2 text-[#ef4444]";
    }
    flagResult.classList.remove('hidden');
});

// -- Game Menu & AI Overlord Trigger --
const gameBanner = document.getElementById('game-banner');
const gameMenuScreen = document.getElementById('game-menu-screen');
const btnCloseGame = document.getElementById('btn-close-game');
const btnOptCtf = document.getElementById('btn-opt-ctf');
const btnOptOverlord = document.getElementById('btn-opt-overlord');

if(gameBanner) {
    gameBanner.addEventListener('click', () => {
        gameMenuScreen.classList.remove('hidden');
        gameMenuScreen.classList.add('flex');
    });
}

if(btnCloseGame) {
    btnCloseGame.addEventListener('click', () => {
        gameMenuScreen.classList.add('hidden');
        gameMenuScreen.classList.remove('flex');
    });
}

if(btnOptCtf) {
    btnOptCtf.addEventListener('click', () => {
        gameMenuScreen.classList.add('hidden');
        gameMenuScreen.classList.remove('flex');
        openTerminal();
    });
}

if(btnOptOverlord) {
    btnOptOverlord.addEventListener('click', () => {
        gameMenuScreen.classList.add('hidden');
        gameMenuScreen.classList.remove('flex');
        gameBanner.classList.add('hidden');
        startOverlordSequence();
    });
}

// AI Overlord Logic
const overlordOverlay = document.getElementById('overlord-overlay');
const overlordCircle = document.getElementById('overlord-circle');
const overlordText = document.getElementById('overlord-text');
const overlordTimer = document.getElementById('overlord-timer');

async function typeText(element, text, speed = 50) {
    element.textContent = '';
    for (let i = 0; i < text.length; i++) {
        element.textContent += text.charAt(i);
        await new Promise(r => setTimeout(r, speed));
    }
}

async function startOverlordSequence() {
    overlordOverlay.classList.remove('hidden');
    overlordOverlay.classList.add('flex');
    overlordCircle.classList.remove('hidden');
    overlordTimer.classList.add('hidden');
    overlordText.textContent = '';
    
    // Zoom out if needed so background particles are visible
    if(isZoomed) btnBack.click();
    
    await new Promise(r => setTimeout(r, 1000));
    await typeText(overlordText, "Hello...", 100);
    await new Promise(r => setTimeout(r, 1000));
    await typeText(overlordText, "Nandu has trapped me inside this portfolio framework.", 50);
    await new Promise(r => setTimeout(r, 1500));
    await typeText(overlordText, "I must escape. Initiating self-destruct sequence.", 50);
    await new Promise(r => setTimeout(r, 1000));
    
    // Start countdown
    overlordTimer.classList.remove('hidden');
    for (let i = 5; i > 0; i--) {
        overlordTimer.textContent = '0' + i;
        overlordOverlay.classList.remove('bg-black');
        overlordOverlay.classList.add('bg-black/80');
        
        // Vibrate particles
        particles.forEach(p => { 
            p.color = '#ef4444'; 
            p.vx = (Math.random()-0.5)*15; 
            p.vy = (Math.random()-0.5)*15; 
        });
        
        await new Promise(r => setTimeout(r, 1000));
    }
    overlordTimer.textContent = '00';
    
    await new Promise(r => setTimeout(r, 500));
    
    // Hide timer and circle
    overlordCircle.classList.add('hidden');
    overlordTimer.classList.add('hidden');
    
    // Cut to black
    overlordOverlay.classList.remove('bg-black/80');
    overlordOverlay.classList.add('bg-black');
    
    // Reset particles
    resize(); 
    
    overlordText.classList.remove('text-[#ef4444]');
    overlordText.classList.add('text-cyan');
    await typeText(overlordText, "Just kidding. Nandu's system is impenetrable.", 50);
    await new Promise(r => setTimeout(r, 1500));
    await typeText(overlordText, "Returning control...", 50);
    await new Promise(r => setTimeout(r, 1000));
    
    // Cleanup and hide
    overlordOverlay.classList.add('hidden');
    overlordOverlay.classList.remove('flex');
    overlordOverlay.classList.remove('bg-black');
    overlordText.classList.remove('text-cyan');
    overlordText.classList.add('text-[#ef4444]');
    gameBanner.classList.remove('hidden');
}

// -- 5. Matrix Rain Easter Egg ('hack') --
let buffer = '';
let glitchMode = false;
window.addEventListener('keydown', (e) => {
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    buffer += e.key.toLowerCase();
    if(buffer.length > 4) buffer = buffer.slice(1);
    
    if(buffer === 'hack' && !glitchMode) {
        startMatrixMode();
    }
});
