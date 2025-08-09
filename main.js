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
    const playerMpEl = document.getElementById('player-mp');
    const playerMaxMpEl = document.getElementById('player-max-mp');
    const playerMpBarEl = document.getElementById('player-mp-bar');
    const playerLevelEl = document.getElementById('player-level');
    const playerXpEl = document.getElementById('player-xp');
    const playerXpNeededEl = document.getElementById('player-xp-needed');
    const playerXpBarEl = document.getElementById('player-xp-bar');
    const playerJobEl = document.getElementById('player-job');
    const playerGoldEl = document.getElementById('player-gold');
    const playerDefenseEl = document.getElementById('player-defense'); // 방어력 DOM 요소 추가
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
    let hiddenJobMaster = null; // 히든 NPC 객체

    // 히든 NPC 출현 가능 위치
    const hiddenNpcSpawnPoints = [
        { x: 1200, y: 1050 }, // 마을 왼쪽 위
        { x: 1800, y: 1050 }, // 마을 오른쪽 위
        { x: 1100, y: 1950 }, // 마을 왼쪽 아래
        { x: 1900, y: 1950 }, // 마을 오른쪽 아래
        { x: 1575, y: 2050 }, // 마을 남쪽 입구 근처
    ];

    const player = {
        element: playerEl,
        x: 1500, y: 1700,
        width: 30, height: 30,
        hp: 100, maxHp: 100,
        mp: 50, maxMp: 50, // MP 속성 추가
        gold: 0,
        inventory: [],
        direction: 'w',
        baseAttackPower: 5,
        attackPower: 5,
        baseDefense: 0, 
        defense: 0,     
        isAttacking: false,
        isConversing: false,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        job: '없음',
        facing: 'right', // 바라보는 방향 추가
        equippedWeapon: null,
        equippedShield: null, 
        skills: [],
        skillCooldowns: {},
        activeQuest: null,
        questProgress: {},
        manaRegenTimer: 0, // 마나 회복 타이머
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
        // Tier 1
        '강타': { job: '전사', goldCost: 500, manaCost: 10, damage: 2.5, cooldown: 3000, description: '전방의 적에게 강력한 일격을 날립니다.', tier: 1 },
        '파워샷': { job: '궁수', goldCost: 500, manaCost: 8, damage: 2.0, cooldown: 2000, description: '강화된 화살을 발사합니다.', tier: 1 },
        '파이어볼': { job: '마법사', goldCost: 500, manaCost: 15, damage: 3.0, cooldown: 4000, description: '화염구를 날려 적을 공격합니다.', tier: 1 },
        '발도술': { job: '검사', goldCost: 500, manaCost: 12, damage: 3.5, cooldown: 5000, description: '순간적으로 전방을 빠르게 벱니다.', tier: 1 },
        '퀵샷': { job: '건슬링어', goldCost: 500, manaCost: 5, damage: 1.8, cooldown: 1500, description: '빠르게 총을 발사합니다.', tier: 1 },
        '마나 슬래시': { job: '마검사', goldCost: 500, manaCost: 20, damage: 4.0, cooldown: 6000, description: '마나가 담긴 검기를 날립니다.', tier: 1 },
        // Tier 2
        '약점 찌르기': { job: '전사', goldCost: 1000, manaCost: 20, damage: 1.5, cooldown: 5000, description: '적의 약점을 찔러 5초간 방어력을 감소시킵니다.', tier: 2, effect: 'defense_down', duration: 5000 },
        '속박의 화살': { job: '궁수', goldCost: 1000, manaCost: 18, damage: 1.2, cooldown: 7000, description: '적을 3초간 이동 불가 상태로 만듭니다.', tier: 2, effect: 'bind', duration: 3000 },
        '라이트닝': { job: '마법사', goldCost: 1000, manaCost: 40, damage: 5.0, cooldown: 8000, description: '강력한 번개를 소환하여 주변의 적들을 공격합니다.', tier: 2, area: 150 },
        '차지 슬래셔': { job: '검사', goldCost: 1000, manaCost: 30, damage: 6.0, cooldown: 10000, description: '기를 모아 전방으로 강력한 참격을 날립니다.', tier: 2, range: 200 },
        '빠른 연사': { job: '건슬링어', goldCost: 1000, manaCost: 15, damage: 1.0, cooldown: 6000, description: '3발의 총알을 빠르게 연사합니다.', tier: 2, shots: 3, interval: 200 },
        '마력 폭발': { job: '마검사', goldCost: 1000, manaCost: 50, damage: 7.0, cooldown: 12000, description: '자신 주변으로 마력을 폭발시켜 모든 적에게 피해를 줍니다.', tier: 2, area: 200 },
    };
    
    const dialogueData = {
        'shopkeeper': { name: '상점 주인', lines: ["어서오세요! 없는 것 빼고 다 있답니다.", "오늘은 뭐가 필요하신가요?"], action: { text: '상점 열기', handler: openShop } },
        'jobChanger': { name: '전직 교관', lines: ["자네의 잠재력이 보이는군. 새로운 길을 개척해보겠나?", "강해지고 싶다면 언제든지 찾아오게."], action: { text: '전직하기', handler: changeJob } },
        'skillMaster': { name: '스킬 마스터', lines: ["기술이야말로 자신을 지키는 최고의 무기지.", "자네의 직업에 맞는 기술을 알려줄 수 있네."], action: { text: '스킬 배우기', handler: learnSkill } },
        'jobResetter': { name: '망각의 현자', lines: ["과거의 선택을 후회하는가...?", "새로운 시작에는 대가가 따르는 법."], action: { text: '직업 초기화', handler: resetJob } },
        'levelResetter': { name: '윤회의 석공', lines: ["그대의 여정은 너무 멀리 와버렸군.", "처음의 열정을 되찾고 싶다면 나를 찾아오게."], action: { text: '레벨 초기화', handler: resetLevel } },
        'questGiver': { name: '모험가 길드장', lines: ["마을을 위해 힘써줄 모험가를 찾고 있네.", "자네, 모험에 관심 있나?"] },
        'hiddenJobMaster': { name: '가려진 현자', lines: ["세상에는 보편적인 길 말고도... 운명에 감춰진 길이 있다네.", "그대는... 그 길을 마주할 자격이 있는가?"] },
        'npc': { name: '마을 주민', lines: ["요즘 몬스터들 때문에 걱정이 이만저만이 아니에요.", "저기 사냥터 쪽으로는 가지 않는 게 좋을 거예요.", "전설에 따르면 이 땅 어딘가에 푸른 보석이 잠들어 있대요."] }
    };

    function savePlayerData() {
        const playerData = {
            level: player.level, xp: player.xp, xpToNextLevel: player.xpToNextLevel,
            gold: player.gold, inventory: player.inventory, 
            equippedWeapon: player.equippedWeapon, equippedShield: player.equippedShield,
            maxHp: player.maxHp, maxMp: player.maxMp, // maxMp 저장
            baseAttackPower: player.baseAttackPower, baseDefense: player.baseDefense, 
            job: player.job, skills: player.skills,
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
                mp: playerData.maxMp, // mp도 maxMp로 채워서 로드
                skills: playerData.skills || [],
                activeQuest: playerData.activeQuest || null,
                questProgress: playerData.questProgress || {},
                equippedShield: playerData.equippedShield || null, 
            });
            updateAttackPower();
            updateDefense(); 
            updatePlayerVisuals();
            updateQuestUI();
        }
    }

    const shopItems = [
        { name: 'HP 포션', price: 50, type: 'potion' }, { name: 'MP 포션', price: 70, type: 'mana-potion', recovery: 20 },
        { name: '낡은 검', price: 100, type: 'sword', power: 5 },
        { name: '낡은 방패', price: 80, type: 'shield', defense: 5 }, // 낡은 방패 아이템 추가
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
            // 왼쪽 줄
            { x: 1300, y: 1100 }, { x: 1300, y: 1350 }, { x: 1300, y: 1600 }, { x: 1300, y: 1850 },
            // 오른쪽 줄
            { x: 1700, y: 1100 }, { x: 1700, y: 1350 }, { x: 1700, y: 1600 }, { x: 1700, y: 1850 },
            // 외곽 집
            { x: 1050, y: 1250 }, { x: 1950, y: 1250 }
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
        shopEl.className = 'shop'; shopEl.style.left = '1475px'; shopEl.style.top = '950px';
        const wall = document.createElement('div'); wall.className = 'wall';
        const roof = document.createElement('div'); roof.className = 'roof';
        const sign = document.createElement('div'); sign.className = 'sign'; sign.textContent = '상점';
        shopEl.appendChild(roof); shopEl.appendChild(wall); shopEl.appendChild(sign);
        backgroundLayer.appendChild(shopEl);
        obstacles.push(shopEl);

        shopkeeper = { element: document.createElement('div'), type: 'shopkeeper' };
        shopkeeper.element.className = 'shopkeeper';
        shopkeeper.element.style.left = `${1475 + (250 / 2) - 16}px`;
        shopkeeper.element.style.top = `${950 + 150}px`;
        const shopkeeperNameTag = document.createElement('div');
        shopkeeperNameTag.className = 'npc-name-tag';
        shopkeeperNameTag.textContent = dialogueData.shopkeeper.name;
        shopkeeper.element.appendChild(shopkeeperNameTag);
        backgroundLayer.appendChild(shopkeeper.element);

        jobChanger = { element: document.createElement('div'), type: 'jobChanger' };
        jobChanger.element.className = 'job-changer';
        jobChanger.element.style.left = '1250px'; 
        jobChanger.element.style.top = '1160px';
        const jobChangerNameTag = document.createElement('div');
        jobChangerNameTag.className = 'npc-name-tag';
        jobChangerNameTag.textContent = dialogueData.jobChanger.name;
        jobChanger.element.appendChild(jobChangerNameTag);
        backgroundLayer.appendChild(jobChanger.element);

        skillMaster = { element: document.createElement('div'), type: 'skillMaster' };
        skillMaster.element.className = 'skill-master';
        skillMaster.element.style.left = '1880px';
        skillMaster.element.style.top = '1160px';
        const skillMasterNameTag = document.createElement('div');
        skillMasterNameTag.className = 'npc-name-tag';
        skillMasterNameTag.textContent = dialogueData.skillMaster.name;
        skillMaster.element.appendChild(skillMasterNameTag);
        backgroundLayer.appendChild(skillMaster.element);

        jobResetter = { element: document.createElement('div'), type: 'jobResetter' };
        jobResetter.element.className = 'job-resetter';
        jobResetter.element.style.left = '1970px';
        jobResetter.element.style.top = '1450px';
        const jobResetterNameTag = document.createElement('div');
        jobResetterNameTag.className = 'npc-name-tag';
        jobResetterNameTag.textContent = dialogueData.jobResetter.name;
        jobResetter.element.appendChild(jobResetterNameTag);
        backgroundLayer.appendChild(jobResetter.element);

        levelResetter = { element: document.createElement('div'), type: 'levelResetter' };
        levelResetter.element.className = 'level-resetter';
        levelResetter.element.style.left = '1100px';
        levelResetter.element.style.top = '1850px';
        const levelResetterNameTag = document.createElement('div');
        levelResetterNameTag.className = 'npc-name-tag';
        levelResetterNameTag.textContent = dialogueData.levelResetter.name;
        levelResetter.element.appendChild(levelResetterNameTag);
        backgroundLayer.appendChild(levelResetter.element);

        questGiver = { element: document.createElement('div'), type: 'questGiver' };
        questGiver.element.className = 'quest-giver';
        questGiver.element.style.left = '1570px';
        questGiver.element.style.top = '1170px';
        const questGiverNameTag = document.createElement('div');
        questGiverNameTag.className = 'npc-name-tag';
        questGiverNameTag.textContent = dialogueData.questGiver.name;
        questGiver.element.appendChild(questGiverNameTag);
        backgroundLayer.appendChild(questGiver.element);

        const pathSegments = [
            // Main Street
            { x: 1475, y: 1050, width: 200, height: 1000 },
            // Plaza in front of shop
            { x: 1425, y: 1050, width: 300, height: 100 },
            // Side paths to outer houses
            { x: 1150, y: 1300, width: 325, height: 50 },
            { x: 1675, y: 1300, width: 325, height: 50 },
        ];
        pathSegments.forEach(seg => {
            const pathEl = document.createElement('div');
            pathEl.className = 'path';
            pathEl.style.left = `${seg.x}px`; pathEl.style.top = `${seg.y}px`;
            pathEl.style.width = `${seg.width}px`; pathEl.style.height = `${seg.height}px`;
            backgroundLayer.appendChild(pathEl);
        });

        const treePositions = [
            // 마을 왼쪽 숲
            { x: 1050, y: 1050 }, { x: 1150, y: 1150 }, { x: 1050, y: 1450 }, 
            { x: 1150, y: 1550 }, { x: 1050, y: 1750 }, { x: 1150, y: 1850 },
            // 마을 오른쪽 숲
            { x: 1900, y: 1050 }, { x: 1800, y: 1150 }, { x: 1900, y: 1450 },
            { x: 1800, y: 1550 }, { x: 1900, y: 1750 }, { x: 1800, y: 1850 },
        ];
        treePositions.forEach(pos => createTree(pos.x, pos.y));

        // 잡초 생성
        const grassPositions = [];
        for (let i = 0; i < 50; i++) {
            // 마을 주변에 무작위로 배치
            grassPositions.push({ x: 1000 + Math.random() * 1200, y: 900 + Math.random() * 1300 });
        }
        grassPositions.forEach(pos => {
            const grassEl = document.createElement('div');
            grassEl.className = 'grass-patch';
            grassEl.textContent = '^^';
            grassEl.style.left = `${pos.x}px`;
            grassEl.style.top = `${pos.y}px`;
            // 길 위에는 잡초가 덜 보이도록 조정
            if (pathSegments.some(seg => pos.x > seg.x && pos.x < seg.x + seg.width && pos.y > seg.y && pos.y < seg.y + seg.height)) {
                 grassEl.style.opacity = '0.6';
            }
            backgroundLayer.appendChild(grassEl);
        });

        for (let i = 0; i < 4; i++) createNpc();

        // 기본 사냥터
        const area = { x: 3000, y: 500, width: 1000, height: 2000 };
        for (let i = 0; i < 15; i++) createMonster(area);
        
        const fenceSegments = [
            // Top (with exit to harder area)
            { x: area.x, y: area.y, width: (area.width / 2) - 50, height: 20 },
            { x: area.x + (area.width / 2) + 50, y: area.y, width: (area.width / 2) - 50, height: 20 },
            // Bottom
            { x: area.x, y: area.y + area.height - 20, width: area.width, height: 20 },
            // Left (with entrance from village)
            { x: area.x, y: area.y, width: 20, height: (area.height / 2) - 75 },
            { x: area.x, y: area.y + (area.height / 2) + 75, width: 20, height: (area.height / 2) - 75 },
            // Right
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

        // 상급 사냥터
        const harderArea = { x: 3000, y: -1600, width: 1000, height: 1500 };
        for (let i = 0; i < 10; i++) createHarderMonster(harderArea);

        const harderFenceSegments = [
            // Top
            { x: harderArea.x, y: harderArea.y, width: harderArea.width, height: 20 },
            // Bottom (with entrance from normal area)
            { x: harderArea.x, y: harderArea.y + harderArea.height - 20, width: (harderArea.width / 2) - 50, height: 20 },
            { x: harderArea.x + (harderArea.width / 2) + 50, y: harderArea.y + harderArea.height - 20, width: (harderArea.width / 2) - 50, height: 20 },
            // Left
            { x: harderArea.x, y: harderArea.y, width: 20, height: harderArea.height },
            // Right
            { x: harderArea.x + harderArea.width - 20, y: harderArea.y, width: 20, height: harderArea.height },
        ];
        harderFenceSegments.forEach(seg => {
            const fenceEl = document.createElement('div');
            fenceEl.className = 'fence';
            fenceEl.style.left = `${seg.x}px`; fenceEl.style.top = `${seg.y}px`;
            fenceEl.style.width = `${seg.width}px`; fenceEl.style.height = `${seg.height}px`;
            fenceEl.style.backgroundColor = '#A0522D'; // 다른 색 울타리
            backgroundLayer.appendChild(fenceEl);
            obstacles.push(fenceEl);
        });
    }

    function createTree(x, y) {
        const treeEl = document.createElement('div');
        treeEl.className = 'tree';
        treeEl.style.left = `${x}px`;
        treeEl.style.top = `${y}px`;

        const trunk = document.createElement('div');
        trunk.className = 'tree-trunk';
        
        const leaves = document.createElement('div');
        leaves.className = 'tree-leaves';

        treeEl.appendChild(leaves);
        treeEl.appendChild(trunk);
        backgroundLayer.appendChild(treeEl);
        obstacles.push(treeEl);
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
            hp: 50, maxHp: 50, xpValue: 40, goldValue: 30, speed: 0.5 + Math.random() * 0.5,
            effects: [],
        };
        monster.element.style.left = `${monster.x}px`; monster.element.style.top = `${monster.y}px`;
        monsters.push(monster);
        backgroundLayer.appendChild(monster.element);
    }

    function createHarderMonster(area) {
        const monsterEl = document.createElement('div');
        monsterEl.className = 'monster golem';
        const healthBarContainer = document.createElement('div'); healthBarContainer.className = 'health-bar-container';
        const healthBar = document.createElement('div'); healthBar.className = 'health-bar';
        healthBarContainer.appendChild(healthBar);
        monsterEl.appendChild(healthBarContainer);
        const monster = {
            element: monsterEl, healthBar: healthBar, type: 'golem',
            x: area.x + Math.random() * (area.width - 45), y: area.y + Math.random() * (area.height - 45),
            hp: 150, maxHp: 150, xpValue: 100, goldValue: 80, speed: 0.3 + Math.random() * 0.3,
            effects: [],
        };
        monster.element.style.left = `${monster.x}px`; monster.element.style.top = `${monster.y}px`;
        monsters.push(monster);
        backgroundLayer.appendChild(monster.element);
    }

    function createNpc() {
        const npcEl = document.createElement('div');
        npcEl.className = 'npc';
        const villageArea = { x: 1475, y: 1250, width: 200, height: 750 }; // Main street area
        const npc = {
            element: npcEl, type: 'npc',
            x: villageArea.x + Math.random() * (villageArea.width - 30), y: villageArea.y + Math.random() * (villageArea.height - 30),
            width: 30, height: 30, moveTimer: Math.random() * 200, moveInterval: 100 + Math.random() * 200,
            speed: 1, direction: null,
        };
        npc.element.style.left = `${npc.x}px`; npc.element.style.top = `${npc.y}px`;

        const nameTag = document.createElement('div');
        nameTag.className = 'npc-name-tag';
        nameTag.textContent = dialogueData.npc.name;
        npc.element.appendChild(nameTag);

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
            const slimeCount = monsters.filter(m => m.type === 'slime').length;
            if (slimeCount < 15) {
                const area = { x: 3000, y: 500, width: 1000, height: 2000 };
                createMonster(area);
            }
        }, 5000);
    }

    function respawnHarderMonster() {
        setTimeout(() => {
            const golemCount = monsters.filter(m => m.type === 'golem').length;
            if (golemCount < 10) {
                const area = { x: 3000, y: -1600, width: 1000, height: 1500 };
                createHarderMonster(area);
            }
        }, 8000); // 리스폰 시간 약간 길게
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
        player.maxMp += 10; // 레벨업 시 최대 마나 10 증가
        player.mp = player.maxMp;
        player.baseAttackPower += 2;
        player.baseDefense += 1; 
        updateAttackPower();
        updateDefense(); 
        player.element.style.filter = 'brightness(3)';
        setTimeout(() => { player.element.style.filter = 'brightness(1)'; }, 200);
        savePlayerData();
    }

    function updateAttackPower() {
        const weaponPower = player.equippedWeapon ? player.equippedWeapon.power : 0;
        player.attackPower = player.baseAttackPower + weaponPower;
    }

    function updateDefense() {
        const shieldDefense = player.equippedShield ? player.equippedShield.defense : 0;
        player.defense = player.baseDefense + shieldDefense;
    }

    function updatePlayerVisuals() {
        const existingWeapon = player.element.querySelector('.player-weapon');
        if (existingWeapon) existingWeapon.remove();
        const existingSheath = player.element.querySelector('.katana-sheath');
        if (existingSheath) existingSheath.remove();
        const existingShield = player.element.querySelector('.player-shield');
        if (existingShield) existingShield.remove();

        // 무기 처리
        if (player.equippedWeapon) {
            const weaponEl = document.createElement('div');
            weaponEl.className = `player-weapon ${player.equippedWeapon.type}`;
            
            // 방향에 따른 클래스 추가
            if (player.facing === 'left') {
                weaponEl.classList.add('facing-left');
            } else {
                weaponEl.classList.add('facing-right');
            }

            if (player.equippedWeapon.type === 'bow') {
                const bowLimb = document.createElement('div'); bowLimb.className = 'bow-limb';
                const bowGrip = document.createElement('div'); bowGrip.className = 'bow-grip';
                weaponEl.appendChild(bowLimb); weaponEl.appendChild(bowGrip);
            }
            player.element.appendChild(weaponEl);

            // 검사 칼집 처리
            if (player.job === '검사' && player.equippedWeapon.type === 'katana') {
                const sheathEl = document.createElement('div');
                sheathEl.className = 'katana-sheath';
                if (player.facing === 'left') {
                    sheathEl.classList.add('facing-left');
                } else {
                    sheathEl.classList.add('facing-right');
                }
                player.element.appendChild(sheathEl);
            }
        }

        // 방패 처리
        if (player.equippedShield) {
            const shieldEl = document.createElement('div');
            shieldEl.className = 'player-shield';
             if (player.facing === 'left') {
                shieldEl.classList.add('facing-left');
            } else {
                shieldEl.classList.add('facing-right');
            }
            player.element.appendChild(shieldEl);
        }
    }

    function equipBestGear() {
        let bestWeapon = null;
        let bestShield = null;

        // 직업에 맞는 장비만 필터링
        const usableItems = player.inventory
            .map(itemName => shopItems.find(shopItem => shopItem.name === itemName))
            .filter(item => {
                if (!item) return false;
                if (player.job === '없음') return false; // 직업이 없으면 장비 장착 불가

                switch (item.type) {
                    case 'sword': return ['전사', '마검사'].includes(player.job);
                    case 'wand':  return ['마법사', '마검사'].includes(player.job);
                    case 'gun':   return ['건슬링어'].includes(player.job);
                    case 'bow':   return ['궁수'].includes(player.job);
                    case 'katana':return ['검사'].includes(player.job);
                    case 'shield':return ['전사', '검사'].includes(player.job);
                    default:      return false;
                }
            });

        for (const item of usableItems) {
            if (item.power && (!bestWeapon || item.power > bestWeapon.power)) {
                bestWeapon = item;
            }
            if (item.defense && (!bestShield || item.defense > bestShield.defense)) {
                bestShield = item;
            }
        }

        let equippedSomething = false;
        if (bestWeapon) {
            player.equippedWeapon = bestWeapon;
            equippedSomething = true;
        }
        if (bestShield) {
            player.equippedShield = bestShield;
            equippedSomething = true;
        }

        if (equippedSomething) {
            updateAttackPower();
            updateDefense();
            updatePlayerVisuals();
            alert(`최고 장비를 장착했습니다! (공격력: ${player.attackPower}, 방어력: ${player.defense})`);
            savePlayerData();
        } else {
            alert("장착할 수 있는 장비가 없습니다.");
        }
    }

    function handleMonsterKill(monster, giveRewards = true) {
        if (giveRewards) {
            gainXp(monster.xpValue);
            player.gold += monster.goldValue;

            if (player.activeQuest) {
                const quest = questsData[player.activeQuest];
                if (quest.target === monster.type) {
                    player.questProgress[quest.target] = (player.questProgress[quest.target] || 0) + 1;
                    updateQuestUI();
                    savePlayerData(); // 퀘스트 진행도 즉시 저장
                }
            }
        }

        monster.element.remove();
        const index = monsters.indexOf(monster);
        if (index > -1) {
            monsters.splice(index, 1);
        }
        
        if (monster.type === 'slime') {
            respawnMonster();
        } else if (monster.type === 'golem') {
            respawnHarderMonster();
        }
    }

    function takeDamage(monster, damage) {
        let finalDamage = damage;
        const defenseDown = monster.effects.find(e => e.type === 'defense_down');
        if (defenseDown) {
            finalDamage *= 1.5; // 방어력 감소 시 50% 추가 데미지
        }

        monster.hp -= finalDamage;
        
        if (monster.hp <= 0) {
            handleMonsterKill(monster);
        } else {
            monster.healthBar.style.width = `${(monster.hp / monster.maxHp) * 100}%`;
        }
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
                    takeDamage(monster, player.attackPower);
                }
            }
            setTimeout(() => {
                attackEffect.remove();
                player.isAttacking = false;
            }, 200);
        }
    }

    function fireProjectile(skillName = null, options = {}) {
        player.isAttacking = true;
        const projectileEl = document.createElement('div');
        projectileEl.className = 'projectile';
        
        let projectileType = '', 
            speed = 8, 
            range = 300, 
            damage = player.attackPower,
            effect = null,
            duration = 0;

        if (skillName) {
            const skill = skillsData[skillName];
            damage = player.attackPower * skill.damage;
            if (skill.effect) {
                effect = skill.effect;
                duration = skill.duration;
            }

            if (skillName === '파이어볼') projectileType = 'fireball';
            else if (skillName === '파워샷') projectileType = 'power-shot';
            else if (skillName === '퀵샷') projectileType = 'quick-shot';
            else if (skillName === '마나 슬래시') projectileType = 'mana-slash';
            else if (skillName === '속박의 화살') projectileType = 'bind-arrow';
            else if (skillName === '빠른 연사') projectileType = 'bullet';

        } else {
            if (player.job === '건슬링어') projectileType = 'bullet';
            else if (player.job === '마법사') projectileType = 'magic-missile';
            else if (player.job === '궁수') projectileType = 'arrow';
        }

        if (projectileType) projectileEl.classList.add(projectileType);
        
        const projectile = {
            element: projectileEl, 
            x: player.x + player.width / 2 - 5, 
            y: player.y + player.height / 2 - 5,
            direction: player.direction, 
            speed, range, traveled: 0, damage,
            effect, duration,
            ...options
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
        } else if (npc.type === 'hiddenJobMaster') {
            if (player.level < 7 || player.job === '없음' || ['마나 술사', '아이스'].includes(player.job)) {
                dialogueTextEl.textContent = "그대는 아직 운명을 마주할 준비가 되지 않았군... 더 정진하고 오게나. (조건: 레벨 7 이상, 기본 직업 보유)";
            } else {
                dialogueTextEl.textContent = "자질이 보이는군... 그대에게 두 가지의 감춰진 길을 보여주겠네. 어떤 길을 걷겠는가?";
                const btn1 = document.createElement('button');
                btn1.textContent = "[마나 술사] 마나의 근원을 탐구한다.";
                btn1.onclick = () => {
                    if (confirm("진정으로 '마나 술사'의 길을 걷겠습니까? 이 선택은 되돌릴 수 없습니다.")) {
                        player.job = '마나 술사';
                        player.skills = []; // 기존 스킬 초기화
                        player.maxMp = Math.floor(player.maxMp * 1.5); // 최대 마나 50% 증가
                        player.mp = player.maxMp;
                        alert("'마나 술사'로 전직했습니다! 최대 마나가 대폭 상승합니다.");
                        updateUI();
                        savePlayerData();
                        hideDialogue();
                    }
                };
                dialogueActionsEl.appendChild(btn1);

                const btn2 = document.createElement('button');
                btn2.textContent = "[아이스] 혹한의 힘을 지배한다.";
                btn2.onclick = () => {
                     if (confirm("진정으로 '아이스'의 길을 걷겠습니까? 이 선택은 되돌릴 수 없습니다.")) {
                        player.job = '아이스';
                        player.skills = []; // 기존 스킬 초기화
                        alert("'아이스'로 전직했습니다!");
                        updateUI();
                        savePlayerData();
                        hideDialogue();
                    }
                };
                dialogueActionsEl.appendChild(btn2);
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
        if (player.job === '없음') {
            alert("먼저 직업을 선택해야 합니다.");
            return;
        }

        const tier1Skill = Object.entries(skillsData).find(([name, data]) => data.job === player.job && data.tier === 1);
        const tier2Skill = Object.entries(skillsData).find(([name, data]) => data.job === player.job && data.tier === 2);

        const hasTier1 = tier1Skill && player.skills.includes(tier1Skill[0]);
        const hasTier2 = tier2Skill && player.skills.includes(tier2Skill[0]);

        let skillToLearn = null;

        if (!hasTier1 && tier1Skill) {
            skillToLearn = tier1Skill;
        } else if (hasTier1 && !hasTier2 && tier2Skill) {
            skillToLearn = tier2Skill;
        } else {
            alert("이미 모든 스킬을 배웠습니다.");
            return;
        }

        if (!skillToLearn) {
            alert("이 직업은 배울 수 있는 스킬이 없습니다.");
            return;
        }

        const [skillName, skillInfo] = skillToLearn;

        if (player.gold < skillInfo.goldCost) {
            alert(`골드가 부족합니다. (${skillInfo.goldCost} G 필요)`);
            return;
        }

        if (confirm(`'${skillName}' 스킬을 배우시겠습니까?

${skillInfo.description}
가격: ${skillInfo.goldCost} G
마나 소모: ${skillInfo.manaCost}`
)) {
            player.gold -= skillInfo.goldCost;
            player.skills.push(skillName);
            // 티어에 맞게 정렬하여 항상 1티어 스킬이 앞으로 오게 함
            player.skills.sort((a, b) => (skillsData[a].tier || 0) - (skillsData[b].tier || 0));
            alert(`'${skillName}' 스킬을 배웠습니다!`);
            savePlayerData();
            updateUI();
        }
    }

    function applyEffect(monster, effect, duration) {
        // 기존에 같은 효과가 있다면 제거
        const existingEffectIndex = monster.effects.findIndex(e => e.type === effect);
        if (existingEffectIndex > -1) {
            clearTimeout(monster.effects[existingEffectIndex].timeoutId);
            monster.effects.splice(existingEffectIndex, 1);
        }

        const effectIndicator = document.createElement('div');
        effectIndicator.className = `effect-indicator ${effect}`;
        monster.element.appendChild(effectIndicator);

        const timeoutId = setTimeout(() => {
            const effectIndex = monster.effects.findIndex(e => e.type === effect);
            if (effectIndex > -1) {
                monster.effects.splice(effectIndex, 1);
            }
            effectIndicator.remove();
        }, duration);

        monster.effects.push({ type: effect, timeoutId });
    }

    function useSkill(skillSlot) {
        if (player.isConversing || player.skills.length < skillSlot) return;

        const skillName = player.skills[skillSlot - 1];
        if (!skillName) return;

        const skillInfo = skillsData[skillName];
        const now = Date.now();

        if (player.mp < skillInfo.manaCost) {
            // TODO: 마나 부족 시각적 효과 (예: 화면 깜빡임)
            return; // Mana not enough
        }

        if (now - (player.skillCooldowns[skillName] || 0) < skillInfo.cooldown) {
            return; // Cooldown active
        }

        player.mp -= skillInfo.manaCost;
        player.skillCooldowns[skillName] = now;
        updateUI(); // 마나 소모 후 즉시 UI 업데이트

        let attackEffect, playerRect, hitboxRect, backgroundRect;

        playerRect = player.element.getBoundingClientRect();
        backgroundRect = backgroundLayer.getBoundingClientRect();

        switch (skillName) {
            // --- Tier 1 ---
            case '강타':
            case '발도술':
                player.isAttacking = true;
                attackEffect = document.createElement('div');
                attackEffect.className = 'attack-effect';
                let t1_range, t1_duration, t1_effectClass;
                if (skillName === '발도술') { t1_range = 150; t1_duration = 250; t1_effectClass = 'baldosul-slash-effect'; }
                else { t1_range = 80; t1_duration = 200; t1_effectClass = 'gangta-effect'; }
                attackEffect.classList.add(t1_effectClass);
                
                if (player.direction === 'w') hitboxRect = { top: playerRect.top - t1_range, left: playerRect.left - 20, width: playerRect.width + 40, height: t1_range };
                else if (player.direction === 's') hitboxRect = { top: playerRect.bottom, left: playerRect.left - 20, width: playerRect.width + 40, height: t1_range };
                else if (player.direction === 'a') hitboxRect = { top: playerRect.top - 20, left: playerRect.left - t1_range, width: t1_range, height: playerRect.height + 40 };
                else hitboxRect = { top: playerRect.top - 20, left: playerRect.right, width: t1_range, height: playerRect.height + 40 };
                
                Object.assign(attackEffect.style, {
                    left: `${hitboxRect.left - backgroundRect.left}px`, top: `${hitboxRect.top - backgroundRect.top}px`,
                    width: `${hitboxRect.width}px`, height: `${hitboxRect.height}px`
                });
                backgroundLayer.appendChild(attackEffect);

                for (let i = monsters.length - 1; i >= 0; i--) {
                    const monster = monsters[i];
                    if (isColliding(attackEffect, monster.element)) {
                        takeDamage(monster, player.attackPower * skillInfo.damage);
                    }
                }
                setTimeout(() => {
                    attackEffect.remove();
                    player.isAttacking = false;
                }, t1_duration);
                break;

            case '파이어볼': case '파워샷': case '퀵샷': case '마나 슬래시':
                fireProjectile(skillName);
                break;

            // --- Tier 2 ---
            case '약점 찌르기':
            case '차지 슬래셔':
                player.isAttacking = true;
                attackEffect = document.createElement('div');
                attackEffect.className = 'attack-effect';
                let t2_range, t2_duration, t2_effectClass;

                if (skillName === '차지 슬래셔') {
                    t2_range = skillInfo.range; t2_duration = 400; t2_effectClass = 'charge-slasher-effect';
                } else { // 약점 찌르기
                    t2_range = 90; t2_duration = 250; t2_effectClass = 'weakness-poke-effect';
                }
                attackEffect.classList.add(t2_effectClass);

                if (player.direction === 'w') hitboxRect = { top: playerRect.top - t2_range, left: playerRect.left - 30, width: playerRect.width + 60, height: t2_range };
                else if (player.direction === 's') hitboxRect = { top: playerRect.bottom, left: playerRect.left - 30, width: playerRect.width + 60, height: t2_range };
                else if (player.direction === 'a') hitboxRect = { top: playerRect.top - 30, left: playerRect.left - t2_range, width: t2_range, height: playerRect.height + 60 };
                else hitboxRect = { top: playerRect.top - 30, left: playerRect.right, width: t2_range, height: playerRect.height + 60 };

                Object.assign(attackEffect.style, {
                    left: `${hitboxRect.left - backgroundRect.left}px`, top: `${hitboxRect.top - backgroundRect.top}px`,
                    width: `${hitboxRect.width}px`, height: `${hitboxRect.height}px`
                });
                backgroundLayer.appendChild(attackEffect);

                for (let i = monsters.length - 1; i >= 0; i--) {
                    const monster = monsters[i];
                    if (isColliding(attackEffect, monster.element)) {
                        takeDamage(monster, player.attackPower * skillInfo.damage);
                        if (skillInfo.effect) {
                            applyEffect(monster, skillInfo.effect, skillInfo.duration);
                        }
                    }
                }
                setTimeout(() => {
                    attackEffect.remove();
                    player.isAttacking = false;
                }, t2_duration);
                break;

            case '속박의 화살':
                fireProjectile(skillName);
                break;

            case '빠른 연사':
                for (let i = 0; i < skillInfo.shots; i++) {
                    setTimeout(() => {
                        const options = {
                            x: player.x + player.width / 2 - 5 + (Math.random() - 0.5) * 20,
                            y: player.y + player.height / 2 - 5 + (Math.random() - 0.5) * 20,
                        }
                        fireProjectile(skillName, options);
                    }, i * skillInfo.interval);
                }
                break;
            
            case '라이트닝':
                player.isAttacking = true;
                let closestMonster = null;
                let minDistance = Infinity;
                const lightningRange = 400; // 라이트닝 스킬의 최대 사거리

                monsters.forEach(monster => {
                    const dx = player.x - monster.x;
                    const dy = player.y - monster.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < lightningRange && distance < minDistance) {
                        minDistance = distance;
                        closestMonster = monster;
                    }
                });

                if (closestMonster) {
                    attackEffect = document.createElement('div');
                    attackEffect.className = 'attack-effect lightning-effect';
                    
                    Object.assign(attackEffect.style, {
                        left: `${closestMonster.x + closestMonster.element.offsetWidth / 2 - 15}px`,
                        top: `${closestMonster.y - 100}px`, // 몬스터 위에서 떨어지는 효과
                    });
                    backgroundLayer.appendChild(attackEffect);
                    
                    takeDamage(closestMonster, player.attackPower * skillInfo.damage);

                    setTimeout(() => {
                        attackEffect.remove();
                    }, 300);
                }
                
                setTimeout(() => { player.isAttacking = false; }, 300);
                break;

            case '마력 폭발':
                player.isAttacking = true;
                attackEffect = document.createElement('div');
                attackEffect.className = 'attack-effect mana-explosion-effect';
                
                const area = skillInfo.area;
                const effectSize = area * 2;
                
                Object.assign(attackEffect.style, {
                    left: `${player.x + player.width/2 - area}px`, 
                    top: `${player.y + player.height/2 - area}px`,
                    width: `${effectSize}px`, height: `${effectSize}px`
                });
                backgroundLayer.appendChild(attackEffect);

                for (let i = monsters.length - 1; i >= 0; i--) {
                    const monster = monsters[i];
                    const dx = (player.x + player.width/2) - (monster.x + monster.element.offsetWidth/2);
                    const dy = (player.y + player.height/2) - (monster.y + monster.element.offsetHeight/2);
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < area) {
                        takeDamage(monster, player.attackPower * skillInfo.damage);
                    }
                }

                setTimeout(() => {
                    attackEffect.remove();
                    player.isAttacking = false;
                }, 500);
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
            if (player.job === '없음') {
                canBuy = item.type === 'potion' || item.type === 'mana-potion';
            } else {
                switch (item.type) {
                    case 'potion':
                    case 'mana-potion':
                         canBuy = true; break;
                    case 'sword': canBuy = ['전사', '마검사'].includes(player.job); break;
                    case 'wand': canBuy = ['마법사', '마검사'].includes(player.job); break;
                    case 'gun': canBuy = ['건슬링어'].includes(player.job); break;
                    case 'bow': canBuy = ['궁수'].includes(player.job); break;
                    case 'katana': canBuy = ['검사'].includes(player.job); break;
                    case 'shield': canBuy = ['전사'].includes(player.job); break;
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
            if (item.type !== 'potion' && item.type !== 'mana-potion') alert(`${item.name}을(를) 구매했습니다! 'E' 키를 눌러 장비를 장착하세요.`);
            savePlayerData();
        } else {
            alert('골드가 부족합니다!');
        }
    }

    function updateUI() {
        playerHpEl.textContent = Math.ceil(player.hp);
        playerMaxHpEl.textContent = player.maxHp;
        playerHealthBarEl.style.width = `${(player.hp / player.maxHp) * 100}%`;

        playerMpEl.textContent = Math.ceil(player.mp);
        playerMaxMpEl.textContent = player.maxMp;
        playerMpBarEl.style.width = `${(player.mp / player.maxMp) * 100}%`;

        playerLevelEl.textContent = player.level;
        playerXpEl.textContent = player.xp;
        playerXpNeededEl.textContent = player.xpToNextLevel;
        playerXpBarEl.style.width = `${(player.xp / player.xpToNextLevel) * 100}%`;
        playerJobEl.textContent = player.job;
        playerGoldEl.textContent = player.gold;
        playerDefenseEl.textContent = player.defense; 
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
        const prevFacing = player.facing;

        if (!player.isConversing) {
            if (keysPressed['w']) { moveY = -playerSpeed; player.direction = 'w'; }
            if (keysPressed['s']) { moveY = playerSpeed; player.direction = 's'; }
            if (keysPressed['a']) { moveX = -playerSpeed; player.direction = 'a'; player.facing = 'left'; }
            if (keysPressed['d']) { moveX = playerSpeed; player.direction = 'd'; player.facing = 'right'; }
        }

        // 바라보는 방향이 바뀌었을 때만 비주얼 업데이트
        if (player.facing !== prevFacing) {
            updatePlayerVisuals();
        }

        if (moveX !== 0 || moveY !== 0) {
            player.x += moveX;
            player.y += moveY;
            player.element.style.left = `${player.x}px`;
            player.element.style.top = `${player.y}px`;
            if (obstacles.some(obstacle => isColliding(player.element, obstacle))) {
                player.x -= moveX;
                player.y -= moveY;
            }
            player.element.style.left = `${player.x}px`;
            player.element.style.top = `${player.y}px`;
        }

        // 마나 자연 회복
        player.manaRegenTimer++;
        if (player.manaRegenTimer >= 60) { // 60프레임(약 1초)마다 회복
            if (player.mp < player.maxMp) {
                player.mp = Math.min(player.maxMp, player.mp + 1); // 1초에 1씩 회복
            }
            player.manaRegenTimer = 0;
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
            // 상태 효과에 따른 이동 제한
            const isBound = monster.effects.some(e => e.type === 'bind');
            if (isBound) {
                return; // 이동 불가
            }

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
                    takeDamage(monster, p.damage);
                    if (p.effect) {
                        applyEffect(monster, p.effect, p.duration);
                    }
                    p.element.remove(); projectiles.splice(i, 1);
                    break; 
                }
            }
        }

        for (let i = monsters.length - 1; i >= 0; i--) {
            const monster = monsters[i];
            if (isColliding(player.element, monster.element)) {
                const damageTaken = Math.max(1, 10 - player.defense); // 방어력 적용
                player.hp -= damageTaken;
                handleMonsterKill(monster, false); // 보상 없이 몬스터 제거
                if (player.hp <= 0) {
                    player.hp = 0; // HP가 음수가 되지 않도록
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
            const allNpcs = [shopkeeper, jobChanger, skillMaster, jobResetter, levelResetter, questGiver, hiddenJobMaster, ...npcs].filter(Boolean);
            for (const npc of allNpcs) {
                if (npc && npc.element && isColliding(player.element, npc.element)) {
                    showDialogue(npc);
                    break;
                }
            }
        }
        if (key === 'e') equipBestGear();
        if (key === 'q') usePotion();
        if (key === 'r') useManaPotion(); // R키로 마나 포션 사용
        if (key === '1') useSkill(1);
        if (key === '2') useSkill(2);
        if (key === '7') {
            player.gold += 1000;
            alert("1000 골드를 획득했습니다!");
            updateUI();
            savePlayerData();
        }
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

    function useManaPotion() {
        const potionIndex = player.inventory.findIndex(item => item === 'MP 포션');
        if (potionIndex === -1) { alert("MP 포션이 없습니다."); return; }
        if (player.mp >= player.maxMp) { alert("마나가 이미 가득 찼습니다."); return; }
        
        const itemData = shopItems.find(item => item.name === 'MP 포션');
        if (!itemData) return;

        player.inventory.splice(potionIndex, 1);
        player.mp = Math.min(player.maxMp, player.mp + itemData.recovery);
        alert(`MP 포션을 사용하여 ${itemData.recovery}의 마나를 회복했습니다!`);
        updateUI();
        savePlayerData();
    }

    function resetLevel() {
        if (player.level === 1) { alert("이미 레벨 1입니다."); return; }
        if (player.gold < 500) { alert("골드가 부족합니다. (500 G 필요)"); return; }
        if (confirm("500 골드를 사용하여 레벨과 직업을 1로 초기화하시겠습니까? 모든 능력치와 소지품이 초기화됩니다.")) {
            player.gold -= 500;
            Object.assign(player, {
                level: 1, xp: 0, xpToNextLevel: 100, 
                maxHp: 100, hp: 100,
                maxMp: 50, mp: 50, // MP 초기화
                baseAttackPower: 5, baseDefense: 0, 
                job: '없음', inventory: [], 
                equippedWeapon: null, equippedShield: null, 
                skills: [],
                activeQuest: null, questProgress: {}
            });
            updateAttackPower();
            updateDefense();
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
            Object.assign(player, { 
                job: '없음', inventory: [], 
                equippedWeapon: null, equippedShield: null, // 장착 아이템 초기화
                skills: [] 
            });
            updateAttackPower();
            updateDefense();
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

    function spawnHiddenNpc() {
        const pos = hiddenNpcSpawnPoints[Math.floor(Math.random() * hiddenNpcSpawnPoints.length)];
        const npcEl = document.createElement('div');
        npcEl.className = 'hidden-job-master';
        npcEl.style.position = 'absolute'; // 위치 고정을 위한 스타일 추가
        
        const nameTag = document.createElement('div');
        nameTag.className = 'npc-name-tag';
        nameTag.textContent = dialogueData.hiddenJobMaster.name;
        npcEl.appendChild(nameTag);

        hiddenJobMaster = {
            element: npcEl,
            type: 'hiddenJobMaster',
            x: pos.x,
            y: pos.y,
        };
        
        npcEl.style.left = `${pos.x}px`;
        npcEl.style.top = `${pos.y}px`;
        backgroundLayer.appendChild(npcEl);

        // 일정 시간 후 사라짐
        setTimeout(despawnHiddenNpc, 60000); // 1분 후 사라짐
    }

    function despawnHiddenNpc() {
        if (hiddenJobMaster && hiddenJobMaster.element) {
            hiddenJobMaster.element.remove();
        }
        hiddenJobMaster = null;
    }

    function trySpawnHiddenNpc() {
        if (hiddenJobMaster) return; // 이미 소환되어 있으면 시도하지 않음

        if (Math.random() < 0.3) { // 30% 확률로 출현
            spawnHiddenNpc();
        }
    }

    createWorld();
    loadPlayerData();
    updateUI();
    gameLoop();
    setInterval(trySpawnHiddenNpc, 30000); // 30초마다 히든 NPC 출현 시도
}
