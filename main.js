document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const introScreen = document.getElementById('intro-screen');
    const gameContainer = document.getElementById('game-container');

    startButton.addEventListener('click', () => {
        // 게임 화면 전환
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
    const npcs = [];
    let shopkeeper;
    let jobChanger;
    let jobResetter;
    let levelResetter;
    let skillMaster;

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
        skills: [],
        skillCooldowns: {},
    };

    const skillsData = {
        '강타': { job: '전사', cost: 500, damage: 2.5, cooldown: 3000, description: '전방의 적에게 강력한 일격을 날립니다.' },
        '파워샷': { job: '궁수', cost: 500, damage: 2.0, cooldown: 2000, description: '강화된 화살을 발사합니다.' },
        '파이어볼': { job: '마법사', cost: 500, damage: 3.0, cooldown: 4000, description: '화염구를 날려 적을 공격합니다.' },
        '발도술': { job: '검사', cost: 500, damage: 3.5, cooldown: 5000, description: '순간적으로 넓은 범위를 벱니다.' },
        '퀵샷': { job: '건슬링어', cost: 500, damage: 1.8, cooldown: 1500, description: '빠르게 총을 발사합니다.' },
        '마나 슬래시': { job: '마검사', cost: 500, damage: 4.0, cooldown: 6000, description: '마나가 담긴 검기를 날립니다.' },
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
            skills: player.skills,
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
            player.skills = playerData.skills || [];
            
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
        { name: '낡은 활', price: 120, type: 'bow', power: 6 },
        { name: '카타나', price: 110, type: 'katana', power: 5 },
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

        const jobResetterEl = document.createElement('div');
        jobResetterEl.className = 'job-resetter';
        jobResetterEl.style.left = '1710px'; // 중앙 위쪽 집 앞
        jobResetterEl.style.top = '1400px';  // 중앙 위쪽 집 앞
        backgroundLayer.appendChild(jobResetterEl);
        jobResetter = { element: jobResetterEl };

        const levelResetterEl = document.createElement('div');
        levelResetterEl.className = 'level-resetter';
        levelResetterEl.style.left = '1710px'; // 아래쪽 집 앞
        levelResetterEl.style.top = '1780px';  // 아래쪽 집 앞
        backgroundLayer.appendChild(levelResetterEl);
        levelResetter = { element: levelResetterEl };

        const skillMasterEl = document.createElement('div');
        skillMasterEl.className = 'skill-master';
        skillMasterEl.style.left = '1300px';
        skillMasterEl.style.top = '1550px';
        backgroundLayer.appendChild(skillMasterEl);
        skillMaster = { element: skillMasterEl };

        for (let i = 0; i < 4; i++) {
            createNpc();
        }

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
        monsterEl.className = 'monster slime';
        const healthBarContainer = document.createElement('div');
        healthBarContainer.className = 'health-bar-container';
        const healthBar = document.createElement('div');
        healthBar.className = 'health-bar';
        healthBarContainer.appendChild(healthBar);
        monsterEl.appendChild(healthBarContainer);

        const monster = {
            element: monsterEl,
            healthBar: healthBar,
            type: 'slime',
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

    function createNpc() {
        const npcEl = document.createElement('div');
        npcEl.className = 'npc';
        
        const villageArea = { x: 1000, y: 1100, width: 900, height: 800 };

        const npc = {
            element: npcEl,
            x: villageArea.x + Math.random() * (villageArea.width - 30),
            y: villageArea.y + Math.random() * (villageArea.height - 30),
            width: 30, height: 30,
            moveTimer: Math.random() * 200,
            moveInterval: 100 + Math.random() * 200,
            speed: 1,
            direction: null,
        };

        npc.element.style.left = `${npc.x}px`;
        npc.element.style.top = `${npc.y}px`;
        
        backgroundLayer.appendChild(npc.element); 

        let isCollidingOnSpawn = false;
        const thingsToAvoid = [...obstacles, shopkeeper.element, jobChanger.element, jobResetter.element, levelResetter.element, skillMaster.element, ...npcs.map(n => n.element)];

        for(const thing of thingsToAvoid) {
            if (thing && isColliding(npc.element, thing)) {
                isCollidingOnSpawn = true;
                break;
            }
        }

        if (isCollidingOnSpawn) {
            npc.element.remove();
            createNpc();
            return;
        }

        npcs.push(npc);
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
        savePlayerData();
    }

    function levelUp() {
        player.level++;
        player.xp -= player.xpToNextLevel;
        player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);
        player.maxHp += 20;
        player.hp = player.maxHp;
        player.baseAttackPower += 2;
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
        const existingWeapon = player.element.querySelector('.player-weapon');
        if (existingWeapon) existingWeapon.remove();
        const existingSheath = player.element.querySelector('.katana-sheath');
        if (existingSheath) existingSheath.remove();

        if (player.equippedWeapon) {
            const weaponEl = document.createElement('div');
            weaponEl.className = `player-weapon ${player.equippedWeapon.type}`;

            if (player.equippedWeapon.type === 'bow') {
                const bowLimb = document.createElement('div');
                bowLimb.className = 'bow-limb';
                const bowGrip = document.createElement('div');
                bowGrip.className = 'bow-grip';
                weaponEl.appendChild(bowLimb);
                weaponEl.appendChild(bowGrip);
            }
            
            player.element.appendChild(weaponEl);

            if (player.job === '검사' && player.equippedWeapon.type === 'katana') {
                const sheathEl = document.createElement('div');
                sheathEl.className = 'katana-sheath';
                player.element.appendChild(sheathEl);
            }
        }
    }

    function equipWeapon() {
        let bestWeapon = null;
        for (const itemName of player.inventory) {
            const item = shopItems.find(shopItem => shopItem.name === itemName);
            if (item && item.power) {
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

        if (player.job === '건슬링어' || player.job === '마법사' || player.job === '궁수') {
            fireProjectile();
        } else {
            player.isAttacking = true;
            
            let attackRange = 50;
            const attackEffect = document.createElement('div');
            attackEffect.className = 'attack-effect';

            if (player.job === '검사') {
                attackRange = 70;
                attackEffect.classList.add('slash');
            }
            
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

    function fireProjectile(skillName = null) {
        player.isAttacking = true;

        const projectileEl = document.createElement('div');
        projectileEl.className = 'projectile';
        
        let projectileType = '';
        let speed = 8;
        let range = 300;
        let damage = player.attackPower;

        if (skillName) {
            const skill = skillsData[skillName];
            damage = player.attackPower * skill.damage; // 스킬 대미지 계산 수정
            if (skillName === '파이어볼') projectileType = 'fireball';
            if (skillName === '파워샷') projectileType = 'power-shot';
            if (skillName === '퀵샷') projectileType = 'quick-shot';
            if (skillName === '마나 슬래시') projectileType = 'mana-slash';
        } else {
            if (player.job === '건슬링어') projectileType = 'bullet';
            else if (player.job === '마법사') projectileType = 'magic-missile';
            else if (player.job === '궁수') projectileType = 'arrow';
        }
        
        if(projectileType) projectileEl.classList.add(projectileType);

        const projectile = {
            element: projectileEl,
            x: player.x + player.width / 2 - 5,
            y: player.y + player.height / 2 - 5,
            direction: player.direction,
            speed: speed,
            range: range,
            traveled: 0,
            damage: damage,
        };

        projectiles.push(projectile);
        backgroundLayer.appendChild(projectileEl);

        setTimeout(() => {
            player.isAttacking = false;
        }, 500);
    }

    // --- 스킬 관련 함수 ---
    function learnSkill() {
        const availableSkill = Object.entries(skillsData).find(([name, data]) => data.job === player.job);

        if (!availableSkill) {
            alert("이 직업은 배울 수 있는 스킬이 없습니다.");
            return;
        }

        const [skillName, skillInfo] = availableSkill;

        if (player.skills.includes(skillName)) {
            alert(`이미 '${skillName}' 스킬을 배웠습니다.`);
            return;
        }

        if (player.gold < skillInfo.cost) {
            alert(`골드가 부족합니다. (${skillInfo.cost} G 필요)`);
            return;
        }

        if (confirm(`'${skillName}' 스킬을 배우시겠습니까?

${skillInfo.description}
가격: ${skillInfo.cost} G`)) {
            player.gold -= skillInfo.cost;
            player.skills.push(skillName);
            alert(`'${skillName}' 스킬을 배웠습니다!`);
            savePlayerData();
            updateUI();
        }
    }

    function useSkill() {
        if (player.skills.length === 0) return;
        const skillName = player.skills[0]; // 현재는 스킬 1개만 가정
        const skillInfo = skillsData[skillName];

        const now = Date.now();
        const lastUsed = player.skillCooldowns[skillName] || 0;

        if (now - lastUsed < skillInfo.cooldown) {
            // alert("스킬 쿨타임입니다.");
            return;
        }
        
        player.skillCooldowns[skillName] = now;

        switch (skillName) {
            case '강타':
            case '발도술':
                player.isAttacking = true;
                const attackEffect = document.createElement('div');
                attackEffect.className = `attack-effect`;
                
                const playerRect = player.element.getBoundingClientRect();
                let range, duration, effectClass;

                if (skillName === '발도술') {
                    range = 150; // 발도술의 리치
                    duration = 250;
                    effectClass = 'baldosul-slash-effect';
                } else { // 강타
                    range = 80;
                    duration = 200;
                    effectClass = 'gangta-effect';
                }
                attackEffect.classList.add(effectClass);

                let hitboxRect = { top: 0, left: 0, width: 0, height: 0 };
                
                // 발도술과 강타 모두 전방 공격으로 변경
                if (player.direction === 'w') hitboxRect = { top: playerRect.top - range, left: playerRect.left - 20, width: playerRect.width + 40, height: range };
                else if (player.direction === 's') hitboxRect = { top: playerRect.bottom, left: playerRect.left - 20, width: playerRect.width + 40, height: range };
                else if (player.direction === 'a') hitboxRect = { top: playerRect.top - 20, left: playerRect.left - range, width: range, height: playerRect.height + 40 };
                else if (player.direction === 'd') hitboxRect = { top: playerRect.top - 20, left: playerRect.right, width: range, height: playerRect.height + 40 };
                

                const backgroundRect = backgroundLayer.getBoundingClientRect();
                attackEffect.style.left = `${hitboxRect.left - backgroundRect.left}px`;
                attackEffect.style.top = `${hitboxRect.top - backgroundRect.top}px`;
                attackEffect.style.width = `${hitboxRect.width}px`;
                attackEffect.style.height = `${hitboxRect.height}px`;
                backgroundLayer.appendChild(attackEffect);

                for (let i = monsters.length - 1; i >= 0; i--) {
                    const monster = monsters[i];
                    if (isColliding(attackEffect, monster.element)) {
                        monster.hp -= player.attackPower * skillInfo.damage;
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
                }, duration);
                break;
            
            case '파이어볼':
            case '파워샷':
            case '퀵샷':
            case '마나 슬래시':
                fireProjectile(skillName);
                break;
        }
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
        if (rand <= 5) newJob = '마검사';
        else if (rand <= 20) newJob = '건슬링어';
        else if (rand <= 35) newJob = '검사';
        else if (rand <= 55) newJob = '전사';
        else if (rand <= 75) newJob = '궁수';
        else newJob = '마법사';
        
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
            if (player.job === '없음') {
                canBuy = item.type === 'potion';
            } else {
                switch (player.job) {
                    case '전사': canBuy = item.type === 'sword' || item.type === 'potion'; break;
                    case '마법사': canBuy = item.type === 'wand' || item.type === 'potion'; break;
                    case '건슬링어': canBuy = item.type === 'gun' || item.type === 'potion'; break;
                    case '궁수': canBuy = item.type === 'bow' || item.type === 'potion'; break;
                    case '검사': canBuy = item.type === 'katana' || item.type === 'potion'; break;
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
            player.x += moveX;
            player.y += moveY;
            player.element.style.left = `${player.x}px`;
            player.element.style.top = `${player.y}px`;

            let isCollidingWithObstacle = false;
            for (const obstacle of obstacles) {
                if (isColliding(player.element, obstacle)) {
                    isCollidingWithObstacle = true;
                    break;
                }
            }

            if (isCollidingWithObstacle) {
                player.x -= moveX;
                player.y -= moveY;
            }
            
            player.element.style.left = `${player.x}px`;
            player.element.style.top = `${player.y}px`;
        }

        for (const npc of npcs) {
            npc.moveTimer++;
            if (npc.moveTimer > npc.moveInterval) {
                const directions = ['w', 's', 'a', 'd', null, null, null];
                npc.direction = directions[Math.floor(Math.random() * directions.length)];
                npc.moveTimer = 0;
                npc.moveInterval = 100 + Math.random() * 200;
            }

            let moveX = 0;
            let moveY = 0;
            if (npc.direction === 'w') moveY = -npc.speed;
            if (npc.direction === 's') moveY = npc.speed;
            if (npc.direction === 'a') moveX = -npc.speed;
            if (npc.direction === 'd') moveX = npc.speed;

            if (moveX !== 0 || moveY !== 0) {
                const originalX = npc.x;
                const originalY = npc.y;

                npc.x += moveX;
                npc.y += moveY;
                npc.element.style.left = `${npc.x}px`;
                npc.element.style.top = `${npc.y}px`;

                let isCollidingWithSomething = false;
                const collidables = [ ...obstacles, player.element, shopkeeper.element, jobChanger.element, jobResetter.element, levelResetter.element, skillMaster.element ];

                for (const item of collidables) {
                    if (item && isColliding(npc.element, item)) {
                        isCollidingWithSomething = true;
                        break;
                    }
                }

                if (!isCollidingWithSomething) {
                    for (const otherNpc of npcs) {
                        if (npc !== otherNpc && isColliding(npc.element, otherNpc.element)) {
                            isCollidingWithSomething = true;
                            break;
                        }
                    }
                }

                if (isCollidingWithSomething) {
                    npc.x = originalX;
                    npc.y = originalY;
                    npc.element.style.left = `${npc.x}px`;
                    npc.element.style.top = `${npc.y}px`;
                    npc.direction = null;
                }
            }
        }

        const aggroRange = 250;
        for (const monster of monsters) {
            const dx = player.x - monster.x;
            const dy = player.y - monster.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < aggroRange) {
                const angle = Math.atan2(dy, dx);
                monster.x += Math.cos(angle) * monster.speed;
                monster.y += Math.sin(angle) * monster.speed;
                monster.element.style.left = `${monster.x}px`;
                monster.element.style.top = `${monster.y}px`;
            }
        }

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

            if (p.traveled >= p.range) {
                p.element.remove();
                projectiles.splice(i, 1);
                continue;
            }

            for (let j = monsters.length - 1; j >= 0; j--) {
                const monster = monsters[j];
                if (isColliding(p.element, monster.element)) {
                    monster.hp -= p.damage;
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
                    break;
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
            if (jobResetter && isColliding(player.element, jobResetter.element)) {
                resetJob();
            }
            if (levelResetter && isColliding(player.element, levelResetter.element)) {
                resetLevel();
            }
            if (skillMaster && isColliding(player.element, skillMaster.element)) {
                learnSkill();
            }
        }
        if (key === 'e') {
            equipWeapon();
        }
        if (key === 'q') {
            usePotion();
        }
        if (key === '1') {
            useSkill();
        }
    });

    function usePotion() {
        const potionIndex = player.inventory.findIndex(item => item === 'HP 포션');

        if (potionIndex === -1) {
            alert("HP 포션이 없습니다.");
            return;
        }

        if (player.hp >= player.maxHp) {
            alert("체력이 이미 가득 찼습니다.");
            return;
        }

        player.inventory.splice(potionIndex, 1);
        player.hp = Math.min(player.maxHp, player.hp + 30);

        alert("HP 포션을 사용하여 30의 체력을 회복했습니다!");
        updateUI();
        savePlayerData();
    }

    function resetLevel() {
        if (player.level === 1) {
            alert("이미 레벨 1입니다.");
            return;
        }

        if (player.gold < 500) {
            alert("골드가 부족합니다. (500 G 필요)");
            return;
        }

        if (confirm("500 골드를 사용하여 레벨과 직업을 1로 초기화하시겠습니까? 모든 능력치와 소지품이 초기화됩니다.")) {
            player.gold -= 500;
            player.level = 1;
            player.xp = 0;
            player.xpToNextLevel = 100;
            player.maxHp = 100;
            player.hp = 100;
            player.baseAttackPower = 5;
            player.job = '없음';
            player.inventory = [];
            player.equippedWeapon = null;
            player.skills = [];
            
            updateAttackPower();
            updatePlayerVisuals();
            alert("레벨, 직업, 소지품이 초기화되었습니다.");
            savePlayerData();
            updateUI();
        }
    }

    function resetJob() {
        if (player.job === '없음') {
            alert("초기화할 직업이 없습니다.");
            return;
        }

        if (player.gold < 100) {
            alert("골드가 부족합니다. (100 G 필요)");
            return;
        }

        if (confirm(`100 골드를 사용하여 ${player.job} 직업을 초기화하시겠습니까? 소지품도 모두 사라집니다.`)) {
            player.gold -= 100;
            player.job = '없음';
            player.inventory = [];
            player.equippedWeapon = null;
            player.skills = [];
            updateAttackPower();
            updatePlayerVisuals();
            alert("직업과 소지품이 초기화되었습니다.");
            savePlayerData();
            updateUI();
        }
    }

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