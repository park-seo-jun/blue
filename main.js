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
    // DOM 요소
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
    const dialogueBox = document.getElementById('dialogue-box');
    const npcNameEl = document.getElementById('npc-name');
    const dialogueTextEl = document.getElementById('dialogue-text');
    const dialogueActionsEl = document.getElementById('dialogue-actions');
    const closeDialogueButton = document.getElementById('close-dialogue-button');
    const questTracker = document.getElementById('quest-tracker');
    const questTitleEl = document.getElementById('quest-title');
    const questObjectiveEl = document.getElementById('quest-objective');

    // 게임 설정
    const playerSpeed = 5;
    let isGameOver = false;

    // 플레이어 DOM 요소
    const playerEl = document.createElement('div');
    playerEl.id = 'player';
    backgroundLayer.appendChild(playerEl);

    // 게임 객체
    const monsters = [];
    const obstacles = [];
    const projectiles = [];
    const npcs = [];
    let shopkeeper, jobChanger, jobResetter, levelResetter, skillMaster, questGiver;

    const player = {
        element: playerEl,
        x: 1500, y: 1700,
        width: 30, height: 30,
        hp: 100, maxHp: 100,
        gold: 0,
        inventory: [],
        direction: 'w',
        baseAttackPower: 5,
        attackPower: 5,
        isAttacking: false,
        isConversing: false,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        job: '없음',
        equippedWeapon: null,
        skills: [],
        skillCooldowns: {},
        activeQuest: null,
        questProgress: {},
    };

    const questsData = {
        'slimeSlayer': {
            title: "초보 모험가의 증명",
            objective: "슬라임 10마리 처치",
            target: 'slime',
            count: 10,
            reward: { xp: 150, gold: 300 }
        }
    };

    const skillsData = {
        '강타': { job: '전사', cost: 500, damage: 2.5, cooldown: 3000, description: '전방의 적에게 강력한 일격을 날립니다.' },
        '파워샷': { job: '궁수', cost: 500, damage: 2.0, cooldown: 2000, description: '강화된 화살을 발사합니다.' },
        '파이어볼': { job: '마법사', cost: 500, damage: 3.0, cooldown: 4000, description: '화염구를 날려 적을 공격합니다.' },
        '발도술': { job: '검사', cost: 500, damage: 3.5, cooldown: 5000, description: '순간적으로 전방을 빠르게 벱니다.' },
        '퀵샷': { job: '건슬링어', cost: 500, damage: 1.8, cooldown: 1500, description: '빠르게 총을 발사합니다.' },
        '마나 슬래시': { job: '마검사', cost: 500, damage: 4.0, cooldown: 6000, description: '마나가 담긴 검기를 날립니다.' },
    };
    
    const dialogueData = {
        'shopkeeper': { name: '상점 주인', lines: ["어서오세요! 없는 것 빼고 다 있답니다.", "오늘은 뭐가 필요하신가요?"], action: { text: '상점 열기', handler: openShop } },
        'jobChanger': { name: '전직 교관', lines: ["자네의 잠재력이 보이는군. 새로운 길을 개척해보겠나?", "강해지고 싶다면 언제든지 찾아오게."], action: { text: '전직하기', handler: changeJob } },
        'skillMaster': { name: '스킬 마스터', lines: ["기술이야말로 자신을 지키는 최고의 무기지.", "자네의 직업에 맞는 기술을 알려줄 수 있네."], action: { text: '스킬 배우기', handler: learnSkill } },
        'jobResetter': { name: '망각의 현자', lines: ["과거의 선택을 후회하는가...?", "새로운 시작에는 대가가 따르는 법."], action: { text: '직업 초기화', handler: resetJob } },
        'levelResetter': { name: '윤회의 석공', lines: ["그대의 여정은 너무 멀리 와버렸군.", "처음의 열정을 되찾고 싶다면 나를 찾아오게."], action: { text: '레벨 초기화', handler: resetLevel } },
        'questGiver': { name: '모험가 길드장', lines: ["마을 근처의 슬라임들 때문에 주민들이 불안에 떨고 있네. 자네가 좀 처리해주지 않겠나?"], },
        'npc': { name: '마을 주민', lines: ["요즘 몬스터들 때문에 걱정이 이만저만이 아니에요.", "저기 사냥터 쪽으로는 가지 않는 게 좋을 거예요.", "전설에 따르면 이 땅 어딘가에 푸른 보석이 잠들어 있대요."] }
    };

    function savePlayerData() {
        const playerData = {
            level: player.level, xp: player.xp, xpToNextLevel: player.xpToNextLevel,
            gold: player.gold, inventory: player.inventory, equippedWeapon: player.equippedWeapon,
            maxHp: player.maxHp, baseAttackPower: player.baseAttackPower, job: player.job, skills: player.skills,
            activeQuest: player.activeQuest, questProgress: player.questProgress,
        };
        localStorage.setItem('rpgPlayerData', JSON.stringify(playerData));
    }

    function loadPlayerData() {
        const savedData = localStorage.getItem('rpgPlayerData');
        if (savedData) {
            const playerData = JSON.parse(savedData);
            Object.assign(player, { 
                ...playerData, 
                hp: playerData.maxHp, 
                skills: playerData.skills || [],
                activeQuest: playerData.activeQuest || null,
                questProgress: playerData.questProgress || {},
            });
            updateAttackPower();
            updatePlayerVisuals();
            updateQuestUI();
        }
    }

    const shopItems = [
        { name: 'HP 포션', price: 50, type: 'potion' }, { name: '낡은 검', price: 100, type: 'sword', power: 5 },
        { name: '낡은 지팡이', price: 150, type: 'wand', power: 7 }, { name: '낡은 권총', price: 75, type: 'gun', power: 4 },
        { name: '낡은 활', price: 120, type: 'bow', power: 6 }, { name: '카타나', price: 110, type: 'katana', power: 5 },
    ];

    function isColliding(el1, el2) {
        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();
        return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);
    }

    function createWorld() {
        const housePositions = [
            { x: 1650, y: 1250 }, { x: 1150, y: 1650 }, { x: 1650, y: 1650 },
            { x: 1350, y: 1100 }, { x: 1850, y: 1500 }, { x: 1350, y: 1850 }
        ];
        housePositions.forEach(pos => {
            const house = document.createElement('div');
            house.className = 'house';
            house.style.left = `${pos.x}px`; house.style.top = `${pos.y}px`;
            const wall = document.createElement('div'); wall.className = 'wall';
            const roof = document.createElement('div'); roof.className = 'roof';
            const door = document.createElement('div'); door.className = 'door';
            const window1 = document.createElement('div'); window1.className = 'window window-left';
            const window2 = document.createElement('div'); window2.className = 'window window-right';
            wall.appendChild(door); wall.appendChild(window1); wall.appendChild(window2);
            house.appendChild(roof); house.appendChild(wall);
            backgroundLayer.appendChild(house);
            obstacles.push(house);
        });

        const shopEl = document.createElement('div');
        shopEl.className = 'shop'; shopEl.style.left = '1150px'; shopEl.style.top = '1250px';
        const wall = document.createElement('div'); wall.className = 'wall';
        const roof = document.createElement('div'); roof.className = 'roof';
        const sign = document.createElement('div'); sign.className = 'sign'; sign.textContent = '상점';
        shopEl.appendChild(roof); shopEl.appendChild(wall); shopEl.appendChild(sign);
        backgroundLayer.appendChild(shopEl);
        obstacles.push(shopEl);

        shopkeeper = { element: document.createElement('div'), type: 'shopkeeper' };
        shopkeeper.element.className = 'shopkeeper'; shopkeeper.element.style.left = `${1150 + (250 / 2) - 16}px`; shopkeeper.element.style.top = `${1250 + 150}px`;
        backgroundLayer.appendChild(shopkeeper.element);

        jobChanger = { element: document.createElement('div'), type: 'jobChanger' };
        jobChanger.element.className = 'job-changer'; jobChanger.element.style.left = '1500px'; jobChanger.element.style.top = '1500px';
        backgroundLayer.appendChild(jobChanger.element);

        skillMaster = { element: document.createElement('div'), type: 'skillMaster' };
        skillMaster.element.className = 'skill-master'; skillMaster.element.style.left = '1550px'; skillMaster.element.style.top = '1500px';
        backgroundLayer.appendChild(skillMaster.element);

        jobResetter = { element: document.createElement('div'), type: 'jobResetter' };
        jobResetter.element.className = 'job-resetter'; jobResetter.element.style.left = '1900px'; jobResetter.element.style.top = '1450px';
        backgroundLayer.appendChild(jobResetter.element);

        levelResetter = { element: document.createElement('div'), type: 'levelResetter' };
        levelResetter.element.className = 'level-resetter'; levelResetter.element.style.left = '1200px'; levelResetter.element.style.top = '1850px';
        backgroundLayer.appendChild(levelResetter.element);

        questGiver = { element: document.createElement('div'), type: 'questGiver' };
        questGiver.element.className = 'quest-giver'; questGiver.element.style.left = '1400px'; questGiver.element.style.top = '1650px';
        backgroundLayer.appendChild(questGiver.element);

        const pathSegments = [
            { x: 1450, y: 1450, width: 150, height: 150 }, { x: 1500, y: 1600, width: 50, height: 200 },
            { x: 1500, y: 1300, width: 50, height: 150 }, { x: 1250, y: 1500, width: 200, height: 50 },
            { x: 1600, y: 1500, width: 200, height: 50 },
        ];
        pathSegments.forEach(seg => {
            const pathEl = document.createElement('div');
            pathEl.className = 'path';
            pathEl.style.left = `${seg.x}px`; pathEl.style.top = `${seg.y}px`;
            pathEl.style.width = `${seg.width}px`; pathEl.style.height = `${seg.height}px`;
            backgroundLayer.appendChild(pathEl);
        });

        for (let i = 0; i < 4; i++) createNpc();
        const area = { x: 2000, y: 500, width: 1000, height: 2000 };
        for (let i = 0; i < 15; i++) createMonster(area);
        
        const fenceSegments = [
            { x: area.x, y: area.y, width: 300, height: 20 },
            { x: area.x + 400, y: area.y, width: area.width - 400, height: 20 },
            { x: area.x, y: area.y + area.height - 20, width: area.width, height: 20 },
            { x: area.x + area.width - 20, y: area.y, width: 20, height: area.height },
        ];
        fenceSegments.forEach(seg => {
            const fenceEl = document.createElement('div');
            fenceEl.className = 'fence';
            fenceEl.style.left = `${seg.x}px`; fenceEl.style.top = `${seg.y}px`;
            fenceEl.style.width = `${seg.width}px`; fenceEl.style.height = `${seg.height}px`;
            backgroundLayer.appendChild(fenceEl);
            obstacles.push(fenceEl);
        });
    }

    function createMonster(area) {
        const monsterEl = document.createElement('div');
        monsterEl.className = 'monster slime';
        const healthBarContainer = document.createElement('div'); healthBarContainer.className = 'health-bar-container';
        const healthBar = document.createElement('div'); healthBar.className = 'health-bar';
        healthBarContainer.appendChild(healthBar);
        monsterEl.appendChild(healthBarContainer);
        const monster = {
            element: monsterEl, healthBar: healthBar, type: 'slime',
            x: area.x + Math.random() * (area.width - 30), y: area.y + Math.random() * (area.height - 30),
            hp: 50, maxHp: 50, xpValue: 40, speed: 0.5 + Math.random() * 0.5,
        };
        monster.element.style.left = `${monster.x}px`; monster.element.style.top = `${monster.y}px`;
        monsters.push(monster);
        backgroundLayer.appendChild(monster.element);
    }

    function createNpc() {
        const npcEl = document.createElement('div');
        npcEl.className = 'npc';
        const villageArea = { x: 1000, y: 1100, width: 900, height: 800 };
        const npc = {
            element: npcEl, type: 'npc',
            x: villageArea.x + Math.random() * (villageArea.width - 30), y: villageArea.y + Math.random() * (villageArea.height - 30),
            width: 30, height: 30, moveTimer: Math.random() * 200, moveInterval: 100 + Math.random() * 200,
            speed: 1, direction: null,
        };
        npc.element.style.left = `${npc.x}px`; npc.element.style.top = `${npc.y}px`;
        backgroundLayer.appendChild(npc.element);
        const thingsToAvoid = [...obstacles, shopkeeper.element, jobChanger.element, jobResetter.element, levelResetter.element, skillMaster.element, questGiver.element, ...npcs.map(n => n.element)];
        if (thingsToAvoid.some(thing => thing && isColliding(npc.element, thing))) {
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

    function gainXp(amount) {
        player.xp += amount;
        while (player.xp >= player.xpToNextLevel) levelUp();
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
                const bowLimb = document.createElement('div'); bowLimb.className = 'bow-limb';
                const bowGrip = document.createElement('div'); bowGrip.className = 'bow-grip';
                weaponEl.appendChild(bowLimb); weaponEl.appendChild(bowGrip);
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
            if (item && item.power && (!bestWeapon || item.power > bestWeapon.power)) {
                bestWeapon = item;
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

    function handleMonsterKill(monster, giveRewards = true) {
        if (giveRewards) {
            gainXp(monster.xpValue);
            player.gold += 30;
        }

        if (player.activeQuest) {
            const quest = questsData[player.activeQuest];
            if (quest.target === monster.type) {
                player.questProgress[quest.target] = (player.questProgress[quest.target] || 0) + 1;
                updateQuestUI();
                savePlayerData(); // 퀘스트 진행도 즉시 저장
            }
        }

        monster.element.remove();
        const index = monsters.indexOf(monster);
        if (index > -1) {
            monsters.splice(index, 1);
        }
        respawnMonster();
    }

    function playerAttack() {
        if (player.isAttacking || player.isConversing) return;
        if (['건슬링어', '마법사', '궁수'].includes(player.job)) {
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
            let hitboxRect;
            if (player.direction === 'w') hitboxRect = { top: playerRect.top - attackRange, left: playerRect.left, width: playerRect.width, height: attackRange };
            else if (player.direction === 's') hitboxRect = { top: playerRect.bottom, left: playerRect.left, width: playerRect.width, height: attackRange };
            else if (player.direction === 'a') hitboxRect = { top: playerRect.top, left: playerRect.left - attackRange, width: attackRange, height: playerRect.height };
            else hitboxRect = { top: playerRect.top, left: playerRect.right, width: attackRange, height: playerRect.height };
            const backgroundRect = backgroundLayer.getBoundingClientRect();
            Object.assign(attackEffect.style, {
                left: `${hitboxRect.left - backgroundRect.left}px`, top: `${hitboxRect.top - backgroundRect.top}px`,
                width: `${hitboxRect.width}px`, height: `${hitboxRect.height}px`
            });
            backgroundLayer.appendChild(attackEffect);
            for (let i = monsters.length - 1; i >= 0; i--) {
                const monster = monsters[i];
                if (isColliding(attackEffect, monster.element)) {
                    monster.hp -= player.attackPower;
                    if (monster.hp <= 0) {
                        handleMonsterKill(monster);
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
        let projectileType = '', speed = 8, range = 300, damage = player.attackPower;
        if (skillName) {
            const skill = skillsData[skillName];
            damage = player.attackPower * skill.damage;
            if (skillName === '파이어볼') projectileType = 'fireball';
            else if (skillName === '파워샷') projectileType = 'power-shot';
            else if (skillName === '퀵샷') projectileType = 'quick-shot';
            else if (skillName === '마나 슬래시') projectileType = 'mana-slash';
        } else {
            if (player.job === '건슬링어') projectileType = 'bullet';
            else if (player.job === '마법사') projectileType = 'magic-missile';
            else if (player.job === '궁수') projectileType = 'arrow';
        }
        if (projectileType) projectileEl.classList.add(projectileType);
        const projectile = {
            element: projectileEl, x: player.x + player.width / 2 - 5, y: player.y + player.height / 2 - 5,
            direction: player.direction, speed, range, traveled: 0, damage,
        };
        projectiles.push(projectile);
        backgroundLayer.appendChild(projectileEl);
        setTimeout(() => { player.isAttacking = false; }, 500);
    }

    function showDialogue(npc) {
        const data = dialogueData[npc.type];
        if (!data) return;
        player.isConversing = true;
        npcNameEl.textContent = data.name;
        dialogueActionsEl.innerHTML = '';

        if (npc.type === 'questGiver') {
            const questId = 'slimeSlayer';
            const quest = questsData[questId];
            const progress = player.questProgress[quest.target] || 0;

            if (!player.activeQuest) {
                dialogueTextEl.textContent = "마을 근처의 슬라임들 때문에 주민들이 불안에 떨고 있네. 자네가 좀 처리해주지 않겠나?";
                const button = document.createElement('button');
                button.textContent = `[수락] ${quest.title}`;
                button.onclick = () => {
                    player.activeQuest = questId;
                    player.questProgress[quest.target] = 0;
                    updateQuestUI();
                    savePlayerData();
                    hideDialogue();
                };
                dialogueActionsEl.appendChild(button);
            } else if (player.activeQuest === questId) {
                if (progress >= quest.count) {
                    dialogueTextEl.textContent = "훌륭하군! 덕분에 마을이 한시름 놓게 됐어. 이건 약속된 보상일세.";
                    const button = document.createElement('button');
                    button.textContent = `[완료] 보상 받기`;
                    button.onclick = () => {
                        gainXp(quest.reward.xp);
                        player.gold += quest.reward.gold;
                        player.activeQuest = null;
                        player.questProgress = {};
                        updateQuestUI();
                        savePlayerData();
                        hideDialogue();
                    };
                    dialogueActionsEl.appendChild(button);
                } else {
                    dialogueTextEl.textContent = `아직 임무를 완수하지 못한 모양이군. 서둘러주게. (${progress}/${quest.count})`;
                }
            }
        } else {
            dialogueTextEl.textContent = data.lines[Math.floor(Math.random() * data.lines.length)];
            if (data.action) {
                const button = document.createElement('button');
                button.textContent = data.action.text;
                button.onclick = () => {
                    data.action.handler();
                    hideDialogue();
                };
                dialogueActionsEl.appendChild(button);
            }
        }
        dialogueBox.classList.remove('hidden');
    }

    function hideDialogue() {
        player.isConversing = false;
        dialogueBox.classList.add('hidden');
    }

    function learnSkill() {
        const availableSkill = Object.entries(skillsData).find(([name, data]) => data.job === player.job);
        if (!availableSkill) { alert("이 직업은 배울 수 있는 스킬이 없습니다."); return; }
        const [skillName, skillInfo] = availableSkill;
        if (player.skills.includes(skillName)) { alert(`이미 '${skillName}' 스킬을 배웠습니다.`); return; }
        if (player.gold < skillInfo.cost) { alert(`골드가 부족합니다. (${skillInfo.cost} G 필요)`); return; }
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
        if (player.isConversing || player.skills.length === 0) return;
        const skillName = player.skills[0];
        const skillInfo = skillsData[skillName];
        const now = Date.now();
        if (now - (player.skillCooldowns[skillName] || 0) < skillInfo.cooldown) return;
        player.skillCooldowns[skillName] = now;
        switch (skillName) {
            case '강타':
            case '발도술':
                player.isAttacking = true;
                const attackEffect = document.createElement('div');
                attackEffect.className = 'attack-effect';
                const playerRect = player.element.getBoundingClientRect();
                let range, duration, effectClass;
                if (skillName === '발도술') { range = 150; duration = 250; effectClass = 'baldosul-slash-effect'; }
                else { range = 80; duration = 200; effectClass = 'gangta-effect'; }
                attackEffect.classList.add(effectClass);
                let hitboxRect;
                if (player.direction === 'w') hitboxRect = { top: playerRect.top - range, left: playerRect.left - 20, width: playerRect.width + 40, height: range };
                else if (player.direction === 's') hitboxRect = { top: playerRect.bottom, left: playerRect.left - 20, width: playerRect.width + 40, height: range };
                else if (player.direction === 'a') hitboxRect = { top: playerRect.top - 20, left: playerRect.left - range, width: range, height: playerRect.height + 40 };
                else hitboxRect = { top: playerRect.top - 20, left: playerRect.right, width: range, height: playerRect.height + 40 };
                const backgroundRect = backgroundLayer.getBoundingClientRect();
                Object.assign(attackEffect.style, {
                    left: `${hitboxRect.left - backgroundRect.left}px`, top: `${hitboxRect.top - backgroundRect.top}px`,
                    width: `${hitboxRect.width}px`, height: `${hitboxRect.height}px`
                });
                backgroundLayer.appendChild(attackEffect);
                for (let i = monsters.length - 1; i >= 0; i--) {
                    const monster = monsters[i];
                    if (isColliding(attackEffect, monster.element)) {
                        monster.hp -= player.attackPower * skillInfo.damage;
                        if (monster.hp <= 0) handleMonsterKill(monster);
                        else monster.healthBar.style.width = `${(monster.hp / monster.maxHp) * 100}%`;
                    }
                }
                setTimeout(() => {
                    attackEffect.remove();
                    player.isAttacking = false;
                }, duration);
                break;
            case '파이어볼': case '파워샷': case '퀵샷': case '마나 슬래시':
                fireProjectile(skillName);
                break;
        }
    }

    function changeJob() {
        if (player.level < 3) { alert("레벨 3 이상만 전직할 수 있습니다."); return; }
        if (player.job !== '없음') { alert("이미 전직했습니다."); return; }
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
            if (player.job === '없음') canBuy = item.type === 'potion';
            else {
                switch (player.job) {
                    case '전사': canBuy = ['sword', 'potion'].includes(item.type); break;
                    case '마법사': canBuy = ['wand', 'potion'].includes(item.type); break;
                    case '건슬링어': canBuy = ['gun', 'potion'].includes(item.type); break;
                    case '궁수': canBuy = ['bow', 'potion'].includes(item.type); break;
                    case '검사': canBuy = ['katana', 'potion'].includes(item.type); break;
                    case '마검사': canBuy = ['sword', 'wand', 'potion'].includes(item.type); break;
                }
            }
            if (!canBuy) { button.disabled = true; li.style.color = '#888'; }
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
            if (item.type !== 'potion') alert(`${item.name}을(를) 구매했습니다! 'E' 키를 눌러 장착하세요.`);
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
        if (playerInventoryEl) playerInventoryEl.textContent = player.inventory.join(', ') || '없음';
    }

    function updateQuestUI() {
        if (player.activeQuest) {
            const quest = questsData[player.activeQuest];
            const progress = player.questProgress[quest.target] || 0;
            questTracker.classList.remove('hidden');
            questTitleEl.textContent = quest.title;
            questObjectiveEl.textContent = `${quest.objective} (${progress}/${quest.count})`;
        } else {
            questTracker.classList.add('hidden');
        }
    }

    const keysPressed = {};
    let gameLoopTimeout;

    function gameLoop() {
        if (isGameOver) return;
        let moveX = 0, moveY = 0;
        if (!player.isConversing) {
            if (keysPressed['w']) { moveY = -playerSpeed; player.direction = 'w'; }
            if (keysPressed['s']) { moveY = playerSpeed; player.direction = 's'; }
            if (keysPressed['a']) { moveX = -playerSpeed; player.direction = 'a'; }
            if (keysPressed['d']) { moveX = playerSpeed; player.direction = 'd'; }
        }
        if (moveX !== 0 || moveY !== 0) {
            player.x += moveX; player.y += moveY;
            player.element.style.left = `${player.x}px`; player.element.style.top = `${player.y}px`;
            if (obstacles.some(obstacle => isColliding(player.element, obstacle))) {
                player.x -= moveX; player.y -= moveY;
            }
            player.element.style.left = `${player.x}px`; player.element.style.top = `${player.y}px`;
        }

        npcs.forEach(npc => {
            npc.moveTimer++;
            if (npc.moveTimer > npc.moveInterval) {
                const directions = ['w', 's', 'a', 'd', null, null, null];
                npc.direction = directions[Math.floor(Math.random() * directions.length)];
                npc.moveTimer = 0;
                npc.moveInterval = 100 + Math.random() * 200;
            }
            let npcMoveX = 0, npcMoveY = 0;
            if (npc.direction === 'w') npcMoveY = -npc.speed;
            if (npc.direction === 's') npcMoveY = npc.speed;
            if (npc.direction === 'a') npcMoveX = -npc.speed;
            if (npc.direction === 'd') npcMoveX = npc.speed;
            if (npcMoveX !== 0 || npcMoveY !== 0) {
                const originalX = npc.x, originalY = npc.y;
                npc.x += npcMoveX; npc.y += npcMoveY;
                npc.element.style.left = `${npc.x}px`; npc.element.style.top = `${npc.y}px`;
                const collidables = [...obstacles, player.element, shopkeeper.element, jobChanger.element, jobResetter.element, levelResetter.element, skillMaster.element, questGiver.element, ...npcs.filter(other => other !== npc).map(o => o.element)];
                if (collidables.some(item => item && isColliding(npc.element, item))) {
                    npc.x = originalX; npc.y = originalY;
                    npc.element.style.left = `${npc.x}px`; npc.element.style.top = `${npc.y}px`;
                    npc.direction = null;
                }
            }
        });

        const aggroRange = 250;
        monsters.forEach(monster => {
            const dx = player.x - monster.x, dy = player.y - monster.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < aggroRange) {
                const angle = Math.atan2(dy, dx);
                monster.x += Math.cos(angle) * monster.speed;
                monster.y += Math.sin(angle) * monster.speed;
                monster.element.style.left = `${monster.x}px`; monster.element.style.top = `${monster.y}px`;
            }
        });

        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            let moveX = 0, moveY = 0;
            if (p.direction === 'w') moveY = -p.speed;
            if (p.direction === 's') moveY = p.speed;
            if (p.direction === 'a') moveX = -p.speed;
            if (p.direction === 'd') moveX = p.speed;
            p.x += moveX; p.y += moveY; p.traveled += p.speed;
            p.element.style.left = `${p.x}px`; p.element.style.top = `${p.y}px`;
            if (p.traveled >= p.range) {
                p.element.remove(); projectiles.splice(i, 1); continue;
            }
            for (let j = monsters.length - 1; j >= 0; j--) {
                const monster = monsters[j];
                if (isColliding(p.element, monster.element)) {
                    monster.hp -= p.damage;
                    p.element.remove(); projectiles.splice(i, 1);
                    if (monster.hp <= 0) handleMonsterKill(monster);
                    else monster.healthBar.style.width = `${(monster.hp / monster.maxHp) * 100}%`;
                    break;
                }
            }
        }

        for (let i = monsters.length - 1; i >= 0; i--) {
            const monster = monsters[i];
            if (isColliding(player.element, monster.element)) {
                player.hp -= 10;
                handleMonsterKill(monster, false); // 보상 없이 몬스터 제거 및 퀘스트 카운트
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

    document.addEventListener('keydown', (event) => {
        if (isGameOver) return;
        const key = event.key.toLowerCase();
        if (key === 'escape' && player.isConversing) {
            hideDialogue();
            return;
        }
        keysPressed[key] = true;
        if (player.isConversing) return;

        if (key === 'f') {
            const allNpcs = [shopkeeper, jobChanger, skillMaster, jobResetter, levelResetter, questGiver, ...npcs];
            for (const npc of allNpcs) {
                if (npc && npc.element && isColliding(player.element, npc.element)) {
                    showDialogue(npc);
                    break;
                }
            }
        }
        if (key === 'e') equipWeapon();
        if (key === 'q') usePotion();
        if (key === '1') useSkill();
    });

    function usePotion() {
        const potionIndex = player.inventory.findIndex(item => item === 'HP 포션');
        if (potionIndex === -1) { alert("HP 포션이 없습니다."); return; }
        if (player.hp >= player.maxHp) { alert("체력이 이미 가득 찼습니다."); return; }
        player.inventory.splice(potionIndex, 1);
        player.hp = Math.min(player.maxHp, player.hp + 30);
        alert("HP 포션을 사용하여 30의 체력을 회복했습니다!");
        updateUI();
        savePlayerData();
    }

    function resetLevel() {
        if (player.level === 1) { alert("이미 레벨 1입니다."); return; }
        if (player.gold < 500) { alert("골드가 부족합니다. (500 G 필요)"); return; }
        if (confirm("500 골드를 사용하여 레벨과 직업을 1로 초기화하시겠습니까? 모든 능력치와 소지품이 초기화됩니다.")) {
            player.gold -= 500;
            Object.assign(player, {
                level: 1, xp: 0, xpToNextLevel: 100, maxHp: 100, hp: 100,
                baseAttackPower: 5, job: '없음', inventory: [], equippedWeapon: null, skills: [],
                activeQuest: null, questProgress: {}
            });
            updateAttackPower();
            updatePlayerVisuals();
            updateQuestUI();
            alert("레벨, 직업, 소지품이 초기화되었습니다.");
            savePlayerData();
            updateUI();
        }
    }

    function resetJob() {
        if (player.job === '없음') { alert("초기화할 직업이 없습니다."); return; }
        if (player.gold < 100) { alert("골드가 부족합니다. (100 G 필요)"); return; }
        if (confirm(`100 골드를 사용하여 ${player.job} 직업을 초기화하시겠습니까? 소지품도 모두 사라집니다.`)) {
            player.gold -= 100;
            Object.assign(player, { job: '없음', inventory: [], equippedWeapon: null, skills: [] });
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

    document.addEventListener('mousedown', (event) => {
        if (isGameOver || !shopWindow.classList.contains('hidden') || player.isConversing) return;
        if (event.button === 0) playerAttack();
    });

    restartButton.addEventListener('click', () => location.reload());
    closeShopButton.addEventListener('click', closeShop);
    closeDialogueButton.addEventListener('click', hideDialogue);

    createWorld();
    loadPlayerData();
    updateUI();
    gameLoop();
}
