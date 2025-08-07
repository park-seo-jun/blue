document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const introScreen = document.getElementById('intro-screen');
    const gameContainer = document.getElementById('game-container');

    // 원래의 '게임 시작' 버튼 클릭 이벤트를 사용합니다.
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
    // DOM 요소
    const gameWorld = document.getElementById('game-world');
    const backgroundLayer = document.getElementById('background-layer');
    const playerHpEl = document.getElementById('player-hp');
    const playerHealthBarEl = document.getElementById('player-health-bar');
    const playerMpEl = document.getElementById('player-mp');
    const playerGoldEl = document.getElementById('player-gold');
    const shopWindow = document.getElementById('shop-window');
    const itemListEl = document.getElementById('item-list');
    const closeShopButton = document.getElementById('close-shop-button');
    const playerInventoryEl = document.getElementById('player-inventory');
    const gameOverScreen = document.getElementById('game-over-screen');
    const restartButton = document.getElementById('restart-button');

    // 게임 설정
    const world = { width: 3000, height: 3000 };
    const villageCenter = { x: world.width / 2, y: world.height / 2 };
    const playerSpeed = 5;

    // 게임 상태
    let isGameOver = false;

    // 게임 객체
    const obstacles = [];
    const monsters = [];
    let shopkeeper;

    // 플레이어 데이터
    const player = {
        x: villageCenter.x, 
        y: villageCenter.y + 200,
        width: 30, height: 30,
        hp: 100, maxHp: 100,
        mp: 50, maxMp: 50,
        gold: 1000,
        inventory: [],
        direction: 'w',
        attackPower: 25,
        isAttacking: false,
    };

    const shopItems = [
        { name: 'HP 포션', price: 50 },
        { name: 'MP 포션', price: 70 },
        { name: '강철 검', price: 500 },
        { name: '가죽 갑옷', price: 300 },
    ];

    function updateScreen() {
        playerHpEl.textContent = player.hp;
        playerMpEl.textContent = player.mp;
        playerGoldEl.textContent = player.gold;
        playerInventoryEl.textContent = player.inventory.join(', ') || '없음';
        playerHealthBarEl.style.width = `${(player.hp / player.maxHp) * 100}%`;

        const cameraX = -player.x + (window.innerWidth / 2);
        const cameraY = -player.y + (window.innerHeight / 2);
        backgroundLayer.style.transform = `translate(${cameraX}px, ${cameraY}px)`;
    }

    function isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    function generateGrass(count) {
        for (let i = 0; i < count; i++) {
            const grass = document.createElement('div');
            grass.classList.add('grass');
            grass.textContent = '^';
            grass.style.left = `${Math.random() * world.width}px`;
            grass.style.top = `${Math.random() * world.height}px`;
            backgroundLayer.appendChild(grass);
        }
    }

    function generateHouses() {
        const housePositions = [
            { x: villageCenter.x + 150, y: villageCenter.y - 250 },
            { x: villageCenter.x - 350, y: villageCenter.y + 150 },
            { x: villageCenter.x + 150, y: villageCenter.y + 150 },
        ];
        const houseSize = { width: 180, height: 120 };
        housePositions.forEach((pos) => {
            const house = document.createElement('div');
            house.className = 'house';
            const wall = document.createElement('div');
            wall.className = 'wall';
            const roof = document.createElement('div');
            roof.className = 'roof';
            house.appendChild(roof);
            house.appendChild(wall);
            house.style.left = `${pos.x}px`;
            house.style.top = `${pos.y}px`;
            backgroundLayer.appendChild(house);
            obstacles.push({ x: pos.x, y: pos.y, width: houseSize.width, height: houseSize.height });
        });
    }

    function generateShop() {
        const pos = { x: villageCenter.x - 350, y: villageCenter.y - 250 };
        const shopSize = { width: 250, height: 150 };
        const shop = document.createElement('div');
        shop.className = 'shop';
        const wall = document.createElement('div');
        wall.className = 'wall';
        const roof = document.createElement('div');
        roof.className = 'roof';
        const sign = document.createElement('div');
        sign.className = 'sign';
        sign.textContent = '상점';
        shop.appendChild(roof);
        shop.appendChild(wall);
        shop.appendChild(sign);
        shop.style.left = `${pos.x}px`;
        shop.style.top = `${pos.y}px`;
        backgroundLayer.appendChild(shop);
        obstacles.push({ x: pos.x, y: pos.y, width: shopSize.width, height: shopSize.height });

        shopkeeper = {
            element: document.createElement('div'),
            x: pos.x + (shopSize.width / 2) - 16,
            y: pos.y + shopSize.height,
            width: 32, height: 32,
        };
        shopkeeper.element.className = 'shopkeeper';
        shopkeeper.element.style.left = `${shopkeeper.x}px`;
        shopkeeper.element.style.top = `${shopkeeper.y}px`;
        backgroundLayer.appendChild(shopkeeper.element);
    }
    
    function generateHuntingGround() {
        const area = { x: 2000, y: 500, width: 1000, height: 2000 };
        const ground = document.createElement('div');
        ground.className = 'hunting-ground';
        ground.style.left = `${area.x}px`;
        ground.style.top = `${area.y}px`;
        ground.style.width = `${area.width}px`;
        ground.style.height = `${area.height}px`;
        backgroundLayer.appendChild(ground);
        generateMonsters(15, area);
    }

    function generateMonsters(count, area) {
        for (let i = 0; i < count; i++) {
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
                width: 30, height: 30,
                hp: 50, maxHp: 50,
                speed: 1 + Math.random(),
                dx: 0, dy: 0,
                moveTimer: 0,
            };
            monster.element.style.left = `${monster.x}px`;
            monster.element.style.top = `${monster.y}px`;
            monsters.push(monster);
            backgroundLayer.appendChild(monster.element);
        }
    }

    function updateMonsters() {
        monsters.forEach(monster => {
            monster.moveTimer--;
            if (monster.moveTimer <= 0) {
                monster.dx = (Math.random() - 0.5) * monster.speed;
                monster.dy = (Math.random() - 0.5) * monster.speed;
                monster.moveTimer = 60 + Math.random() * 120;
            }
            monster.x += monster.dx;
            monster.y += monster.dy;
            monster.element.style.left = `${monster.x}px`;
            monster.element.style.top = `${monster.y}px`;
        });
    }

    function playerAttack() {
        if (player.isAttacking) return;
        player.isAttacking = true;

        const attackRange = 50;
        const attackEffect = document.createElement('div');
        attackEffect.className = 'attack-effect';

        const hitbox = { x: 0, y: 0, width: 0, height: 0 };

        if (player.direction === 'w') {
            hitbox.width = player.width;
            hitbox.height = attackRange;
            hitbox.x = player.x;
            hitbox.y = player.y - attackRange;
        } else if (player.direction === 's') {
            hitbox.width = player.width;
            hitbox.height = attackRange;
            hitbox.x = player.x;
            hitbox.y = player.y + player.height;
        } else if (player.direction === 'a') {
            hitbox.width = attackRange;
            hitbox.height = player.height;
            hitbox.x = player.x - attackRange;
            hitbox.y = player.y;
        } else if (player.direction === 'd') {
            hitbox.width = attackRange;
            hitbox.height = player.height;
            hitbox.x = player.x + player.width;
            hitbox.y = player.y;
        }

        attackEffect.style.left = `${hitbox.x}px`;
        attackEffect.style.top = `${hitbox.y}px`;
        attackEffect.style.width = `${hitbox.width}px`;
        attackEffect.style.height = `${hitbox.height}px`;
        backgroundLayer.appendChild(attackEffect);

        for (let i = monsters.length - 1; i >= 0; i--) {
            const monster = monsters[i];
            if (isColliding(hitbox, monster)) {
                monster.hp -= player.attackPower;
                monster.element.style.filter = 'brightness(2)';
                setTimeout(() => { monster.element.style.filter = 'brightness(1)'; }, 100);

                if (monster.hp <= 0) {
                    monster.element.remove();
                    monsters.splice(i, 1);
                } else {
                    monster.healthBar.style.width = `${(monster.hp / monster.maxHp) * 100}%`;
                }
            }
        }

        setTimeout(() => {
            attackEffect.remove();
            player.isAttacking = false;
        }, 150);
    }

    function checkPlayerCollision() {
        for (let i = monsters.length - 1; i >= 0; i--) {
            const monster = monsters[i];
            if (isColliding(player, monster)) {
                player.hp -= 10;
                if (player.hp < 0) player.hp = 0;
                
                if (player.direction === 'w') player.y += 40;
                if (player.direction === 's') player.y -= 40;
                if (player.direction === 'a') player.x += 40;
                if (player.direction === 'd') player.x -= 40;

                monster.element.remove();
                monsters.splice(i, 1);
                
                if (player.hp <= 0) {
                    gameOverScreen.classList.remove('hidden');
                    isGameOver = true;
                    return true;
                }
                break;
            }
        }
        return false;
    }

    function openShop() {
        shopWindow.classList.remove('hidden');
        cancelAnimationFrame(gameLoopTimeout);
    }

    function closeShop() {
        shopWindow.classList.add('hidden');
        gameLoop();
    }

    function buyItem(item) {
        if (player.gold >= item.price) {
            player.gold -= item.price;
            player.inventory.push(item.name);
            updateScreen();
            alert(`${item.name}을(를) 구매했습니다!`);
        } else {
            alert('골드가 부족합니다!');
        }
    }

    // --- 초기화 ---
    generateGrass(200);
    generateHouses();
    generateShop();
    generateHuntingGround();
    updateScreen();

    // --- 키보드 입력 및 게임 루프 ---
    const keysPressed = {};
    let gameLoopTimeout;

    function gameLoop() {
        let moveX = 0;
        let moveY = 0;
        if (keysPressed['w']) { moveY = -playerSpeed; player.direction = 'w'; }
        if (keysPressed['s']) { moveY = playerSpeed; player.direction = 's'; }
        if (keysPressed['a']) { moveX = -playerSpeed; player.direction = 'a'; }
        if (keysPressed['d']) { moveX = playerSpeed; player.direction = 'd'; }

        if (moveX !== 0 || moveY !== 0) {
            const nextPos = { ...player, x: player.x + moveX, y: player.y + moveY };
            
            let isCollidingWithObstacle = false;
            for (const obstacle of obstacles) {
                if (isColliding(nextPos, obstacle)) {
                    isCollidingWithObstacle = true;
                    break;
                }
            }

            if (!isCollidingWithObstacle) {
                player.x = nextPos.x;
                player.y = nextPos.y;
            }
        }

        updateMonsters();
        if (checkPlayerCollision()) {
            cancelAnimationFrame(gameLoopTimeout);
            updateScreen();
            return;
        }

        updateScreen();
        gameLoopTimeout = requestAnimationFrame(gameLoop);
    }

    document.addEventListener('keydown', (event) => {
        if (isGameOver) return;

        const key = event.key.toLowerCase();
        if (shopWindow.classList.contains('hidden')) {
            keysPressed[key] = true;
        }

        if (key === 'f') {
            if (!shopWindow.classList.contains('hidden')) {
                closeShop();
                return;
            }
            const dx = (player.x + player.width / 2) - (shopkeeper.x + shopkeeper.width / 2);
            const dy = (player.y + player.height / 2) - (shopkeeper.y + shopkeeper.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 50) {
                openShop();
            }
        }
    });

    document.addEventListener('keyup', (event) => {
        if (isGameOver) return;
        keysPressed[event.key.toLowerCase()] = false;
    });
    
    gameWorld.addEventListener('mousedown', (event) => {
        if (isGameOver) return;
        if (shopWindow.classList.contains('hidden')) {
            if (event.button === 0) { // 0은 좌클릭
                playerAttack();
            }
        }
    });

    closeShopButton.addEventListener('click', closeShop);
    
    restartButton.addEventListener('click', () => {
        location.reload();
    });

    gameLoop();
}
