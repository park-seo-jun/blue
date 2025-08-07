// --- DOM Elements ---
const introScreen = document.getElementById('intro-screen');
const gameContainer = document.getElementById('game-container');
const startButton = document.getElementById('start-button');
const inventoryContainer = document.getElementById('inventory-container');
const inventorySlots = document.getElementById('inventory-slots');
const closeInventoryButton = document.getElementById('close-inventory');
const rewardScreen = document.getElementById('reward-screen');
const rewardOptions = document.getElementById('reward-options');
const combatConfirmationPopup = document.getElementById('combat-confirmation-popup');
const confirmCombatYes = document.getElementById('confirm-combat-yes');
const confirmCombatNo = document.getElementById('confirm-combat-no');
const combatHint = document.getElementById('combat-hint');
const healthBarsContainer = document.getElementById('health-bars-container');
const gameOverScreen = document.getElementById('game-over-screen');
const restartButton = document.getElementById('restart-button');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// --- Game State & Components ---
let player, camera;
let npcs = [], collidableObjects = [];
const keysPressed = {};
const mapSize = 2000;
let isGamePaused = false;
let targetNPC = null;
let lastTime = 0;

// --- Game State & Stats ---
const playerStats = {
    hp: 100, maxHp: 100, mp: 50, maxMp: 50, attack: 10, defense: 1,
    level: 1, xp: 0, xpToNextLevel: 100
};
let inventory = [];
const maxInventorySlots = 20;

// --- Camera ---
class Camera {
    constructor(target, worldSize) {
        this.target = target;
        this.worldSize = worldSize;
        this.x = 0;
        this.y = 0;
        this.width = canvas.width;
        this.height = canvas.height;
    }

    update() {
        // Center camera on player, but clamp to world boundaries
        this.x = this.target.x - this.width / 2;
        this.y = this.target.y - this.height / 2;

        this.x = Math.max(0, Math.min(this.x, this.worldSize - this.width));
        this.y = Math.max(0, Math.min(this.y, this.worldSize - this.height));
    }
}


// --- Initialization ---
function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    player = new Player(mapSize / 2, mapSize / 2);
    camera = new Camera(player, mapSize);
    
    collidableObjects.push(player);

    generateNPCs(15);

    // Event Listeners
    document.addEventListener('keydown', (e) => { keysPressed[e.key.toLowerCase()] = true; handleKeydown(e); });
    document.addEventListener('keyup', (e) => { keysPressed[e.key.toLowerCase()] = false; });
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousedown', handleMouseDown);

    // Start Game Loop
    requestAnimationFrame(animate);
}

// --- Game Loop ---
function animate(timestamp) {
    const deltaTime = (timestamp - (lastTime || timestamp)) / 1000;
    lastTime = timestamp;

    if (!isGamePaused) {
        update(deltaTime);
        draw();
        updateHealthBars();
        updateUIHints();
    }
    
    requestAnimationFrame(animate);
}

// --- Update Function ---
function update(delta) {
    player.update(delta);
    npcs.forEach(npc => npc.update(delta, player));

    camera.update();

    // --- Combat Resolution Logic ---
    if (player.inCombat && targetNPC) {
        // Flee condition
        const distance = Math.hypot(player.x - targetNPC.x, player.y - targetNPC.y);
        if (distance > 300) {
            console.log("Player fled from combat.");
            endCombat();
        }
        // Win condition
        else if (targetNPC.stats.hp <= 0) {
            console.log(`Player defeated ${targetNPC.type.name}!`);
            gainXP(targetNPC.type.stats.xp);
            
            // Remove NPC
            healthBarsContainer.removeChild(targetNPC.healthBar);
            npcs = npcs.filter(n => n !== targetNPC);
            collidableObjects = collidableObjects.filter(obj => obj !== targetNPC);
            
            endCombat();
            showRewardScreen();
        }
        // Lose condition
        else if (playerStats.hp <= 0) {
            endCombat();
            showGameOverScreen();
        }
    }
}

// --- Draw Function ---
function draw() {
    // Clear canvas
    ctx.fillStyle = '#78a860'; // Grassy color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply camera transform
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw a grid for visual reference
    drawGrid();

    // Draw game objects
    npcs.forEach(npc => npc.draw(ctx));
    player.draw(ctx);

    // Restore context
    ctx.restore();
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for(let x = 0; x < mapSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, mapSize);
        ctx.stroke();
    }
    for(let y = 0; y < mapSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(mapSize, y);
        ctx.stroke();
    }
}

function endCombat() {
    if (player.inCombat) {
        player.inCombat = false;
        if (player.healthBar) player.healthBar.style.display = 'none';
    }
    if (targetNPC && targetNPC.inCombat) {
        targetNPC.inCombat = false;
        if (targetNPC.healthBar) targetNPC.healthBar.style.display = 'none';
        targetNPC = null;
    }
}

// --- Object Classes ---
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = 200;
        this.color = '#007bff';
        this.inCombat = false;
        this.attackCooldown = 0;
        this.isAttacking = false;
        this.attackAnimTimer = 0;
        this.dealtDamageThisAttack = false;
        this.healthBar = this.createHealthBar('player');
    }

    createHealthBar(type) {
        const bar = document.createElement('div');
        bar.className = `health-bar ${type}`;
        bar.innerHTML = '<div class="health-bar-inner"></div>';
        bar.style.display = 'none';
        healthBarsContainer.appendChild(bar);
        return bar;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        // Draw attack animation
        if (this.isAttacking) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            const attackRadius = 25;
            const animProgress = 1 - (this.attackAnimTimer / 0.3);
            ctx.beginPath();
            ctx.arc(this.x, this.y, attackRadius * animProgress, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    update(delta) {
        if (this.attackCooldown > 0) this.attackCooldown -= delta;

        if (this.isAttacking) {
            this.attackAnimTimer -= delta;
            if (this.attackAnimTimer <= 0) {
                this.isAttacking = false;
            } else {
                // Deal damage
                if (!this.dealtDamageThisAttack && this.attackAnimTimer < 0.15) {
                    if (targetNPC) {
                        const distance = Math.hypot(this.x - targetNPC.x, this.y - targetNPC.y);
                        if (distance < this.width / 2 + targetNPC.width / 2 + 20) { // 20 is attack range
                            const damage = Math.max(1, playerStats.attack - targetNPC.stats.defense);
                            targetNPC.stats.hp -= damage;
                            console.log(`Player dealt ${damage} damage to ${targetNPC.type.name}.`);
                        }
                    }
                    this.dealtDamageThisAttack = true;
                }
            }
            return; // No movement during attack
        }

        let moveX = 0;
        let moveY = 0;
        if (keysPressed['w']) moveY -= 1;
        if (keysPressed['s']) moveY += 1;
        if (keysPressed['a']) moveX -= 1;
        if (keysPressed['d']) moveX += 1;

        if (moveX !== 0 || moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            const moveVectorX = (moveX / length) * this.speed * delta;
            const moveVectorY = (moveY / length) * this.speed * delta;

            this.x += moveVectorX;
            this.y += moveVectorY;
        }

        // Clamp position to map boundaries
        this.x = Math.max(this.width / 2, Math.min(mapSize - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(mapSize - this.height / 2, this.y));
    }
}

const enemyTypes = [
    { name: 'Goblin', color: '#8BC34A', width: 25, height: 25, stats: { hp: 30, attack: 5, defense: 2, xp: 25 } },
    { name: 'Orc', color: '#795548', width: 40, height: 40, stats: { hp: 50, attack: 8, defense: 4, xp: 40 } },
    { name: 'Slime', color: '#00BCD4', width: 35, height: 35, stats: { hp: 25, attack: 4, defense: 5, xp: 30 } }
];

class NPC {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = type.width;
        this.height = type.height;
        this.speed = 100;
        this.stats = { ...type.stats, hp: type.stats.hp };
        this.inCombat = false;
        this.attackCooldown = Math.random() * 2 + 1;
        this.healthBar = this.createHealthBar('enemy');
    }

    createHealthBar(type) {
        const bar = document.createElement('div');
        bar.className = `health-bar ${type}`;
        bar.innerHTML = '<div class="health-bar-inner"></div>';
        bar.style.display = 'none';
        healthBarsContainer.appendChild(bar);
        return bar;
    }

    draw(ctx) {
        ctx.fillStyle = this.type.color;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }

    update(delta, player) {
        if (this.attackCooldown > 0) this.attackCooldown -= delta;

        const distanceToPlayer = Math.hypot(this.x - player.x, this.y - player.y);

        if (this.inCombat) {
            if (distanceToPlayer > this.width / 2 + player.width / 2 + 10) {
                // Move towards player
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                this.x += Math.cos(angle) * this.speed * delta;
                this.y += Math.sin(angle) * this.speed * delta;
            } else {
                // Attack
                if (this.attackCooldown <= 0) {
                    const damage = Math.max(1, this.stats.attack - playerStats.defense);
                    takePlayerDamage(damage);
                    console.log(`${this.type.name} dealt ${damage} damage to Player.`);
                    this.attackCooldown = 2.0; // Reset cooldown
                }
            }
        }
    }
}

function generateNPCs(count) {
    for (let i = 0; i < count; i++) {
        const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const x = Math.random() * (mapSize - 100) + 50;
        const z = Math.random() * (mapSize - 100) + 50;
        const npc = new NPC(x, z, randomType);
        npcs.push(npc);
        collidableObjects.push(npc);
    }
}

function updateHealthBars() {
    const characters = [player, ...npcs];
    for (const char of characters) {
        if (!char.healthBar || !char.inCombat) {
            if(char.healthBar) char.healthBar.style.display = 'none';
            continue;
        };

        char.healthBar.style.display = 'block';
        
        // Position health bar based on 2D coordinates relative to camera
        const screenX = char.x - camera.x;
        const screenY = char.y - camera.y;

        // Only display if on screen
        if (screenX > -50 && screenX < camera.width + 50 && screenY > -50 && screenY < camera.height + 50) {
            char.healthBar.style.left = `${screenX}px`;
            char.healthBar.style.top = `${screenY - char.height / 2 - 20}px`; // Position above the character
            const hpPercent = (char === player ? playerStats.hp / playerStats.maxHp : char.stats.hp / char.type.stats.hp) * 100;
            char.healthBar.querySelector('.health-bar-inner').style.width = `${hpPercent}%`;
        } else {
            char.healthBar.style.display = 'none';
        }
    }
}

function updateUIHints() {
    const combatRange = 100;
    const canFight = !player.inCombat && npcs.some(npc => Math.hypot(player.x - npc.x, player.y - npc.y) < combatRange);
    combatHint.style.display = canFight ? 'block' : 'none';
}

// --- UI & Event Handlers ---
function updatePlayerStatsDisplay() {
    playerStats.hp = Math.round(playerStats.hp);
    document.getElementById('player-hp').textContent = playerStats.hp;
    document.getElementById('player-max-hp').textContent = playerStats.maxHp;
    document.getElementById('player-mp').textContent = playerStats.mp;
    document.getElementById('player-max-mp').textContent = playerStats.maxMp;
    document.getElementById('player-level').textContent = playerStats.level;
    document.getElementById('player-xp').textContent = playerStats.xp;
    document.getElementById('player-xp-to-next-level').textContent = playerStats.xpToNextLevel;
    document.getElementById('player-attack').textContent = playerStats.attack;
    document.getElementById('player-defense').textContent = playerStats.defense;
}

function updateInventoryDisplay() {
    inventorySlots.innerHTML = '';
    for (let i = 0; i < maxInventorySlots; i++) {
        const slot = document.createElement('div');
        slot.classList.add('inventory-slot');
        if (inventory[i]) {
            slot.textContent = inventory[i].substring(0, 3);
        }
        inventorySlots.appendChild(slot);
    }
}

function handleMouseDown(e) {
    if (e.button === 0 && player.inCombat && player.attackCooldown <= 0 && !player.isAttacking) {
        player.attackCooldown = 1.0;
        player.isAttacking = true;
        player.attackAnimTimer = 0.3;
        player.dealtDamageThisAttack = false;
    }
}

function handleKeydown(e) {
    const key = e.key.toLowerCase();
    if (key === 'i') {
        const isVisible = inventoryContainer.style.display === 'flex';
        inventoryContainer.style.display = isVisible ? 'none' : 'flex';
    } else if (key === 'f') {
        initiateCombat();
    }
}

function onWindowResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (camera) {
        camera.width = canvas.width;
        camera.height = canvas.height;
    }
}

// --- Combat & Reward Logic ---
function takePlayerDamage(damage) {
    playerStats.hp -= damage;
    if (playerStats.hp < 0) {
        playerStats.hp = 0;
    }
    updatePlayerStatsDisplay();
}

function initiateCombat() {
    if (isGamePaused) return;
    const combatRange = 100;
    const closestNPC = npcs.find(npc => Math.hypot(player.x - npc.x, player.y - npc.y) < combatRange && !npc.inCombat);

    if (closestNPC) {
        targetNPC = closestNPC;
        showCombatConfirmation();
    }
}

function showCombatConfirmation() {
    isGamePaused = true;
    combatConfirmationPopup.style.display = 'flex';
}

function hideCombatConfirmation() {
    isGamePaused = false;
    combatConfirmationPopup.style.display = 'none';
    if (!player.inCombat) { // Don't nullify if combat was confirmed
        targetNPC = null;
    }
}

function executeCombat() {
    if (!targetNPC) {
        hideCombatConfirmation();
        return;
    }

    isGamePaused = false;
    combatConfirmationPopup.style.display = 'none';

    player.inCombat = true;
    targetNPC.inCombat = true;
    
    player.healthBar.style.display = 'block';
    targetNPC.healthBar.style.display = 'block';
}

function gainXP(amount) {
    playerStats.xp += amount;
    if (playerStats.xp >= playerStats.xpToNextLevel) {
        levelUp();
    }
    updatePlayerStatsDisplay();
}

function levelUp() {
    playerStats.level++;
    playerStats.xp -= playerStats.xpToNextLevel;
    playerStats.xpToNextLevel = Math.floor(playerStats.xpToNextLevel * 1.5);
    playerStats.maxHp += 10;
    playerStats.hp = playerStats.maxHp;
    playerStats.attack += 2;
    playerStats.defense += 1;
    console.log("Level Up!");
}

const rewardPool = [
    { type: 'stat', stat: 'maxHp', value: 20, title: "Vitality Boost", description: "+20 Max HP" },
    { type: 'stat', stat: 'attack', value: 5, title: "Strength Surge", description: "+5 Attack" },
    { type: 'stat', stat: 'defense', value: 3, title: "Iron Skin", description: "+3 Defense" },
    { type: 'stat', stat: 'maxMp', value: 15, title: "Mind Expansion", description: "+15 Max MP" },
    { type: 'heal', value: 0.5, title: "Healing Aura", description: "Heal 50% HP" },
];

function showRewardScreen() {
    isGamePaused = true;
    rewardOptions.innerHTML = '';

    const availableRewards = [...rewardPool];
    const chosenRewards = [];
    for (let i = 0; i < 3; i++) {
        if (availableRewards.length === 0) break;
        const randomIndex = Math.floor(Math.random() * availableRewards.length);
        chosenRewards.push(availableRewards.splice(randomIndex, 1)[0]);
    }

    chosenRewards.forEach(reward => {
        const card = document.createElement('div');
        card.classList.add('reward-card');
        card.innerHTML = `<h3>${reward.title}</h3><p>${reward.description}</p>`;
        card.onclick = () => selectReward(reward);
        rewardOptions.appendChild(card);
    });

    rewardScreen.style.display = 'flex';
}

function selectReward(reward) {
    if (reward.type === 'stat') {
        playerStats[reward.stat] += reward.value;
        if (reward.stat === 'maxHp') {
            playerStats.hp += reward.value;
        }
    } else if (reward.type === 'heal') {
        playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + playerStats.maxHp * reward.value);
    }
    hideRewardScreen();
}

function hideRewardScreen() {
    isGamePaused = false;
    rewardScreen.style.display = 'none';
    updatePlayerStatsDisplay();
}

function showGameOverScreen() {
    isGamePaused = true;
    gameOverScreen.style.display = 'flex';
}

function restartGame() {
    location.reload();
}

// --- Game Start ---
startButton.addEventListener('click', () => {
    introScreen.style.transition = 'opacity 1s ease';
    introScreen.style.opacity = '0';
    setTimeout(() => {
        introScreen.style.display = 'none';
    }, 1000);
    
    gameContainer.style.display = 'block';
    
    updatePlayerStatsDisplay();
    updateInventoryDisplay();

    init();
});

restartButton.addEventListener('click', restartGame);
confirmCombatYes.addEventListener('click', executeCombat);
confirmCombatNo.addEventListener('click', hideCombatConfirmation);
closeInventoryButton.addEventListener('click', () => {
    inventoryContainer.style.display = 'none';
});