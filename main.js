document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const introScreen = document.getElementById('intro-screen');
    const gameContainer = document.getElementById('game-container');

    startButton.addEventListener('click', () => {
        introScreen.style.opacity = '0';
        setTimeout(() => {
            introScreen.classList.add('hidden');
            gameContainer.classList.remove('hidden');
            startGame();
        }, 1000);
    });
});

function startGame() {
    // DOM 요소 (모든 UI 요소를 여기서 한 번에 찾습니다)
    const gameWorld = document.getElementById('game-world');
    const backgroundLayer = document.getElementById('background-layer');
    const playerHpEl = document.getElementById('player-hp');
    const playerMaxHpEl = document.getElementById('player-max-hp');
    const playerHealthBarEl = document.getElementById('player-health-bar');
    const playerLevelEl = document.getElementById('player-level');
    const playerXpEl = document.getElementById('player-xp');
    const playerXpNeededEl = document.getElementById('player-xp-needed');
    const playerXpBarEl = document.getElementById('player-xp-bar');
    const playerJobEl = document.getElementById('player-job');
    const playerGoldEl = document.getElementById('player-gold');
    const gameOverScreen = document.getElementById('game-over-screen');
    const restartButton = document.getElementById('restart-button');
    const shopWindow = document.getElementById('shop-window');
    const closeShopButton = document.getElementById('close-shop-button');
    const itemListEl = document.getElementById('item-list');
    const playerInventoryEl = document.getElementById('player-inventory');

    // 게임 설정
    const playerSpeed = 5;
    let isGameOver = false;

    // 플레이어 DOM 요소 생성 및 설정
    const playerEl = document.createElement('div');
    playerEl.id = 'player';
    backgroundLayer.appendChild(playerEl);

    // 게임 객체
    const monsters = [];
    const obstacles = [];
    const projectiles = [];
    let shopkeeper;
    let jobChanger;

    const player = {
        element: playerEl,
        x: 1500, 
        y: 1700,
        width: 30, height: 30,
        hp: 100, maxHp: 100,
        gold: 0,
        inventory: [],
        direction: 'w',
        baseAttackPower: 5, // 기본 공격력
        attackPower: 5,     // 최종 공격력 (무기 포함)
        isAttacking: false,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        job: '없음',
        equippedWeapon: null,
    };

    function savePlayerData() {
        const playerData = {
            level: player.level,
            xp: player.xp,
            xpToNextLevel: player.xpToNextLevel,
            gold: player.gold,
            inventory: player.inventory,
            equippedWeapon: player.equippedWeapon,
            maxHp: player.maxHp,
            baseAttackPower: player.baseAttackPower,
            job: player.job,
        };
        localStorage.setItem('rpgPlayerData', JSON.stringify(playerData));
    }

    function loadPlayerData() {
        const savedData = localStorage.getItem('rpgPlayerData');
        if (savedData) {
            const playerData = JSON.parse(savedData);
            player.level = playerData.level;
            player.xp = playerData.xp;
            player.xpToNextLevel = playerData.xpToNextLevel;
            player.gold = playerData.gold;
            player.inventory = playerData.inventory;
            player.equippedWeapon = playerData.equippedWeapon;
            player.maxHp = playerData.maxHp;
            player.baseAttackPower = playerData.baseAttackPower;
            player.job = playerData.job;
            
            player.hp = player.maxHp; // 부활 시 체력은 최대로
            updateAttackPower();
            updatePlayerVisuals();
        }
    }

    const shopItems = [
        { name: 'HP 포션', price: 50, type: 'potion' },
        { name: '낡은 검', price: 100, type: 'sword', power: 5 },
        { name: '낡은 지팡이', price: 150, type: 'wand', power: 7 },
        { name: '낡은 권총', price: 75, type: 'gun', power: 4 },
    ];

    // --- 충돌 감지 함수 ---
    function isColliding(el1, el2) {
        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();
        return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);
    }

    // --- 월드 생성 ---
    function createWorld() {
        const housePositions = [ { x: 1650, y: 1250 }, { x: 1150, y: 1650 }, { x: 1650, y: 1650 }];
        housePositions.forEach(pos => {
            const house = document.createElement('div');
            house.className = 'house';
            house.style.left = `${pos.x}px`;
            house.style.top = `${pos.y}px`;
            const wall = document.createElement('div');
            wall.className = 'wall';
            const roof = document.createElement('div');
            roof.className = 'roof';
            house.appendChild(roof);
            house.appendChild(wall);
            backgroundLayer.appendChild(house);
            obstacles.push(house);
        });

        const shopEl = document.createElement('div');
        shopEl.className = 'shop';
        shopEl.style.left = '1150px';
        shopEl.style.top = '1250px';
        const wall = document.createElement('div');
        wall.className = 'wall';
        const roof = document.createElement('div');
        roof.className = 'roof';
        const sign = document.createElement('div');
        sign.className = 'sign';
        sign.textContent = '상점';
        shopEl.appendChild(roof);
        shopEl.appendChild(wall);
        shopEl.appendChild(sign);
        backgroundLayer.appendChild(shopEl);
        obstacles.push(shopEl);

        const shopkeeperEl = document.createElement('div');
        shopkeeperEl.className = 'shopkeeper';
        shopkeeperEl.style.left = `${1150 + (250 / 2) - 16}px`;
        shopkeeperEl.style.top = `${1250 + 150}px`;
        backgroundLayer.appendChild(shopkeeperEl);
        shopkeeper = { element: shopkeeperEl };

        const jobChangerEl = document.createElement('div');
        jobChangerEl.className = 'job-changer';
        jobChangerEl.style.left = '1500px';
        jobChangerEl.style.top = '1400px';
        backgroundLayer.appendChild(jobChangerEl);
        jobChanger = { element: jobChangerEl };

        const area = { x: 2000, y: 500, width: 1000, height: 2000 };
        const ground = document.createElement('div');
        ground.className = 'hunting-ground';
        ground.style.left = `${area.x}px`;
        ground.style.top = `${area.y}px`;
        ground.style.width = `${area.width}px`;
        ground.style.height = `${area.height}px`;
        backgroundLayer.appendChild(ground);

        for (let i = 0; i < 15; i++) {
            createMonster(area);
        }
    }

    function createMonster(area) {
        const monsterEl = document.createElement('div');
        monsterEl.className = 'monster';
        const healthBarContainer = document.createElement('div');
        healthBarContainer.className = 'health-bar-container';
        const healthBar = document.createElement('div');
        healthBar.className = 'health-bar';
        healthBarContainer.appendChild(healthBar);
        monsterEl.appendChild(healthBarContainer);

        const monster = {
            element: monsterEl,
            healthBar: healthBar,
            x: area.x + Math.random() * (area.width - 30),
            y: area.y + Math.random() * (area.height - 30),
            hp: 50, maxHp: 50,
            xpValue: 40,
            speed: 0.5 + Math.random() * 0.5, // 몬스터 속도
        };
        monster.element.style.left = `${monster.x}px`;
        monster.element.style.top = `${monster.y}px`;
        monsters.push(monster);
        backgroundLayer.appendChild(monster.element);
    }
    
    function respawnMonster() {
        setTimeout(() => {
            if (monsters.length < 15) {
                const area = { x: 2000, y: 500, width: 1000, height: 2000 };
                createMonster(area);
            }
        }, 5000);
    }

    // --- 전투, 레벨업, 장착 관련 함수 ---
    function gainXp(amount) {
        player.xp += amount;
        while (player.xp >= player.xpToNextLevel) {
            levelUp();
        }
        updateUI();
    }

    function levelUp() {
        player.level++;
        player.xp -= player.xpToNextLevel;
        player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);
        player.maxHp += 20;
        player.hp = player.maxHp;
        player.baseAttackPower += 2; // 레벨업 시 기본 공격력도 소폭 상승
        updateAttackPower();
        player.element.style.filter = 'brightness(3)';
        setTimeout(() => { player.element.style.filter = 'brightness(1)'; }, 200);
        savePlayerData();
    }

    function updateAttackPower() {
        const weaponPower = player.equippedWeapon ? player.equippedWeapon.power : 0;
        player.attackPower = player.baseAttackPower + weaponPower;
    }

    function updatePlayerVisuals() {
        // 기존 무기 제거
        const existingWeapon = player.element.querySelector('.player-weapon');
        if (existingWeapon) {
            existingWeapon.remove();
        }

        // 새 무기 추가
        if (player.equippedWeapon) {
            const weaponEl = document.createElement('div');
            weaponEl.className = `player-weapon ${player.equippedWeapon.type}`;
            player.element.appendChild(weaponEl);
        }
    }

    function equipWeapon() {
        // 인벤토리에서 장착 가능한 가장 좋은 무기를 찾음
        let bestWeapon = null;
        for (const itemName of player.inventory) {
            const item = shopItems.find(shopItem => shopItem.name === itemName);
            if (item && item.power) { // 무기인 경우
                if (!bestWeapon || item.power > bestWeapon.power) {
                    bestWeapon = item;
                }
            }
        }

        if (bestWeapon) {
            player.equippedWeapon = bestWeapon;
            updateAttackPower();
            updatePlayerVisuals();
            alert(`${bestWeapon.name}을(를) 장착했습니다! (공격력: ${player.attackPower})`);
            savePlayerData();
        } else {
            alert("장착할 무기가 없습니다.");
        }
    }

    function playerAttack() {
        if (player.isAttacking) return;

        // 직업에 따라 공격 방식 분기
        if (player.job === '건슬링어' || player.job === '마법사') {
            fireProjectile();
        } else {
            // 기존 근접 공격
            player.isAttacking = true;
            const attackRange = 50;
            const attackEffect = document.createElement('div');
            attackEffect.className = 'attack-effect';
            
            const playerRect = player.element.getBoundingClientRect();
            let hitboxRect = { top: 0, left: 0, width: 0, height: 0 };

            if (player.direction === 'w') hitboxRect = { top: playerRect.top - attackRange, left: playerRect.left, width: playerRect.width, height: attackRange };
            else if (player.direction === 's') hitboxRect = { top: playerRect.bottom, left: playerRect.left, width: playerRect.width, height: attackRange };
            else if (player.direction === 'a') hitboxRect = { top: playerRect.top, left: playerRect.left - attackRange, width: attackRange, height: playerRect.height };
            else if (player.direction === 'd') hitboxRect = { top: playerRect.top, left: playerRect.right, width: attackRange, height: playerRect.height };

            const backgroundRect = backgroundLayer.getBoundingClientRect();
            attackEffect.style.left = `${hitboxRect.left - backgroundRect.left}px`;
            attackEffect.style.top = `${hitboxRect.top - backgroundRect.top}px`;
            attackEffect.style.width = `${hitboxRect.width}px`;
            attackEffect.style.height = `${hitboxRect.height}px`;
            backgroundLayer.appendChild(attackEffect);

            for (let i = monsters.length - 1; i >= 0; i--) {
                const monster = monsters[i];
                if (isColliding(attackEffect, monster.element)) {
                    monster.hp -= player.attackPower;
                    if (monster.hp <= 0) {
                        gainXp(monster.xpValue);
                        player.gold += 30;
                        monster.element.remove();
                        monsters.splice(i, 1);
                        respawnMonster();
                    } else {
                        monster.healthBar.style.width = `${(monster.hp / monster.maxHp) * 100}%`;
                    }
                }
            }

            setTimeout(() => {
                attackEffect.remove();
                player.isAttacking = false;
            }, 200);
        }
    }

    function fireProjectile() {
        player.isAttacking = true;

        const projectileEl = document.createElement('div');
        projectileEl.className = 'projectile';
        if (player.job === '건슬링어') {
            projectileEl.classList.add('bullet');
        } else {
            projectileEl.classList.add('magic-missile');
        }

        const projectile = {
            element: projectileEl,
            x: player.x + player.width / 2 - 5, // 중앙에서 발사
            y: player.y + player.height / 2 - 5,
            direction: player.direction,
            speed: 8,
            range: 300, // 사정거리
            traveled: 0,
        };

        projectiles.push(projectile);
        backgroundLayer.appendChild(projectileEl);

        // 공격 딜레이
        setTimeout(() => {
            player.isAttacking = false;
        }, 500);
    }

    // --- 상점 및 전직 관련 함수 ---
    function changeJob() {
        if (player.level < 3) {
            alert("레벨 3 이상만 전직할 수 있습니다.");
            return;
        }
        if (player.job !== '없음') {
            alert("이미 전직했습니다.");
            return;
        }

        const rand = Math.random() * 100;
        let newJob = '';
        if (rand <= 1) newJob = '마검사';
        else if (rand <= 34) newJob = '전사';
        else if (rand <= 67) newJob = '마법사';
        else newJob = '건슬링어';
        
        player.job = newJob;
        alert(`${newJob}(으)로 전직했습니다!`);
        updateUI();
        savePlayerData();
    }

    function openShop() {
        shopWindow.classList.remove('hidden');
        itemListEl.innerHTML = '';
        shopItems.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.name}</span><span>${item.price} G</span><button>구매</button>`;
            
            const button = li.querySelector('button');
            let canBuy = false;
            // 전직 전에는 포션만 구매 가능하도록 수정
            if (player.job === '없음') {
                canBuy = item.type === 'potion';
            } else {
                switch (player.job) {
                    case '전사': canBuy = item.type === 'sword' || item.type === 'potion'; break;
                    case '마법사': canBuy = item.type === 'wand' || item.type === 'potion'; break;
                    case '건슬링어': canBuy = item.type === 'gun' || item.type === 'potion'; break;
                    case '마검사': canBuy = item.type === 'sword' || item.type === 'wand' || item.type === 'potion'; break;
                }
            }

            if (!canBuy) {
                button.disabled = true;
                li.style.color = '#888';
            }

            button.addEventListener('click', () => buyItem(item));
            itemListEl.appendChild(li);
        });
        updateUI();
    }

    function closeShop() {
        shopWindow.classList.add('hidden');
    }

    function buyItem(item) {
        if (player.gold >= item.price) {
            player.gold -= item.price;
            player.inventory.push(item.name);
            updateUI();
            if (item.type !== 'potion') {
                alert(`${item.name}을(를) 구매했습니다! 'E' 키를 눌러 장착하세요.`);
            }
            savePlayerData();
        } else {
            alert('골드가 부족합니다!');
        }
    }
    
    function updateUI() {
        playerHpEl.textContent = player.hp;
        playerMaxHpEl.textContent = player.maxHp;
        playerHealthBarEl.style.width = `${(player.hp / player.maxHp) * 100}%`;
        playerLevelEl.textContent = player.level;
        playerXpEl.textContent = player.xp;
        playerXpNeededEl.textContent = player.xpToNextLevel;
        playerXpBarEl.style.width = `${(player.xp / player.xpToNextLevel) * 100}%`;
        playerJobEl.textContent = player.job;
        playerGoldEl.textContent = player.gold;
        if (playerInventoryEl) {
            playerInventoryEl.textContent = player.inventory.join(', ') || '없음';
        }
    }

    // --- 게임 루프 ---
    const keysPressed = {};
    let gameLoopTimeout;

    function gameLoop() {
        if (isGameOver) return;

        let moveX = 0;
        let moveY = 0;
        if (keysPressed['w']) { moveY = -playerSpeed; player.direction = 'w'; }
        if (keysPressed['s']) { moveY = playerSpeed; player.direction = 's'; }
        if (keysPressed['a']) { moveX = -playerSpeed; player.direction = 'a'; }
        if (keysPressed['d']) { moveX = playerSpeed; player.direction = 'd'; }

        if (moveX !== 0 || moveY !== 0) {
            // 1. 먼저 플레이어의 논리적 위치를 이동시킵니다.
            player.x += moveX;
            player.y += moveY;

            // 2. 이동한 위치를 기준으로 플레이어 DOM 요소의 위치를 업데이트합니다.
            player.element.style.left = `${player.x}px`;
            player.element.style.top = `${player.y}px`;

            // 3. 화면에 그려진 DOM 요소를 기준으로 충돌을 확인합니다.
            let isCollidingWithObstacle = false;
            for (const obstacle of obstacles) {
                if (isColliding(player.element, obstacle)) {
                    isCollidingWithObstacle = true;
                    break;
                }
            }

            // 4. 만약 충돌했다면, 논리적 위치를 다시 원래대로 되돌립니다.
            if (isCollidingWithObstacle) {
                player.x -= moveX;
                player.y -= moveY;
            }
            
            // 5. 최종 위치를 다시 DOM 요소에 반영합니다.
            player.element.style.left = `${player.x}px`;
            player.element.style.top = `${player.y}px`;
        }

        // 몬스터 AI: 플레이어 추적
        const aggroRange = 250; // 몬스터가 플레이어를 인지하는 범위
        for (const monster of monsters) {
            const dx = player.x - monster.x;
            const dy = player.y - monster.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < aggroRange) {
                // 플레이어 방향으로 이동
                const angle = Math.atan2(dy, dx);
                monster.x += Math.cos(angle) * monster.speed;
                monster.y += Math.sin(angle) * monster.speed;
                monster.element.style.left = `${monster.x}px`;
                monster.element.style.top = `${monster.y}px`;
            }
        }

        // 투사체 업데이트
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            let moveX = 0;
            let moveY = 0;

            if (p.direction === 'w') moveY = -p.speed;
            if (p.direction === 's') moveY = p.speed;
            if (p.direction === 'a') moveX = -p.speed;
            if (p.direction === 'd') moveX = p.speed;

            p.x += moveX;
            p.y += moveY;
            p.traveled += p.speed;

            p.element.style.left = `${p.x}px`;
            p.element.style.top = `${p.y}px`;

            // 사정거리 체크
            if (p.traveled >= p.range) {
                p.element.remove();
                projectiles.splice(i, 1);
                continue;
            }

            // 몬스터와 충돌 체크
            for (let j = monsters.length - 1; j >= 0; j--) {
                const monster = monsters[j];
                if (isColliding(p.element, monster.element)) {
                    monster.hp -= player.attackPower;
                    p.element.remove();
                    projectiles.splice(i, 1);

                    if (monster.hp <= 0) {
                        gainXp(monster.xpValue);
                        player.gold += 30;
                        monster.element.remove();
                        monsters.splice(j, 1);
                        respawnMonster();
                    } else {
                        monster.healthBar.style.width = `${(monster.hp / monster.maxHp) * 100}%`;
                    }
                    break; // 투사체는 하나의 몬스터만 맞춤
                }
            }
        }

        for (let i = monsters.length - 1; i >= 0; i--) {
            const monster = monsters[i];
            if (isColliding(player.element, monster.element)) {
                player.hp -= 10;
                monster.element.remove();
                monsters.splice(i, 1);
                respawnMonster();
                if (player.hp <= 0) {
                    isGameOver = true;
                    savePlayerData();
                    gameOverScreen.classList.remove('hidden');
                }
                break;
            }
        }
        
        updateUI();
        const cameraX = -player.x + (window.innerWidth / 2);
        const cameraY = -player.y + (window.innerHeight / 2);
        backgroundLayer.style.transform = `translate(${cameraX}px, ${cameraY}px)`;
        
        gameLoopTimeout = requestAnimationFrame(gameLoop);
    }

    // --- 이벤트 리스너 ---
    document.addEventListener('keydown', (event) => {
        if (isGameOver) return;
        const key = event.key.toLowerCase();
        keysPressed[key] = true;

        if (key === 'f') {
            if (isColliding(player.element, shopkeeper.element)) {
                shopWindow.classList.toggle('hidden');
                if (!shopWindow.classList.contains('hidden')) openShop();
            }
            if (isColliding(player.element, jobChanger.element)) {
                changeJob();
            }
        }
        if (key === 'e') { // 'E' 키로 장착
            equipWeapon();
        }
    });

    document.addEventListener('keyup', (event) => {
        keysPressed[event.key.toLowerCase()] = false;
    });
    
    gameWorld.addEventListener('mousedown', (event) => {
        if (isGameOver || !shopWindow.classList.contains('hidden')) return;
        if (event.button === 0) {
            playerAttack();
        }
    });
    
    restartButton.addEventListener('click', () => location.reload());
    closeShopButton.addEventListener('click', closeShop);

    // --- 게임 시작 ---
    createWorld();
    loadPlayerData();
    updateUI();
    gameLoop();
}