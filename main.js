document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const submitRegisterButton = document.getElementById('submit-register-button');
    const backToLoginButton = document.getElementById('back-to-login-button');

    const usernameInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');
    const newUsernameInput = document.getElementById('new-username-input');
    const newPasswordInput = document.getElementById('new-password-input');

    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const nameInputContainer = document.getElementById('name-input-container');
    
    const confirmButton = document.getElementById('confirm-name-button');
    const playerNameInput = document.getElementById('player-name-input');
    const introScreen = document.getElementById('intro-screen');
    const gameContainer = document.getElementById('game-container');

    // Dummy user for testing
    if (!localStorage.getItem('users')) {
        const users = {};
        users['user'] = '1234';
        localStorage.setItem('users', JSON.stringify(users));
    }

    registerButton.addEventListener('click', () => {
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
    });

    backToLoginButton.addEventListener('click', () => {
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    });

    submitRegisterButton.addEventListener('click', () => {
        const newUsername = newUsernameInput.value;
        const newPassword = newPasswordInput.value;

        if (!newUsername || !newPassword) {
            alert('아이디와 비밀번호를 모두 입력해주세요.');
            return;
        }

        let users = JSON.parse(localStorage.getItem('users')) || {};

        if (users[newUsername]) {
            alert('이미 존재하는 아이디입니다.');
        } else {
            users[newUsername] = newPassword;
            localStorage.setItem('users', JSON.stringify(users));
            alert('회원가입이 완료되었습니다.');
            registerContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
        }
    });

    loginButton.addEventListener('click', () => {
        const username = usernameInput.value;
        const password = passwordInput.value;
        const users = JSON.parse(localStorage.getItem('users')) || {};

        if (users[username] && users[username] === password) {
            loginContainer.classList.add('hidden');
            nameInputContainer.classList.remove('hidden');
        } else {
            alert('아이디 또는 비밀번호가 잘못되었습니다.');
        }
    });

    confirmButton.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim() || '모험가';

        introScreen.style.opacity = '0';
        setTimeout(() => {
            introScreen.classList.add('hidden');
            gameContainer.classList.remove('hidden');
            startGame(playerName);
        }, 1000);
    }, { once: true });
});

function startGame(playerName) {
    // DOM 요소
    const playerNameEl = document.getElementById('player-name');
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
    const playerDefenseEl = document.getElementById('player-defense');
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
    const inventoryButton = document.getElementById('inventory-button');
    const inventoryWindow = document.getElementById('inventory-window');
    const inventoryListEl = document.getElementById('inventory-list');
    const screenFlashEl = document.getElementById('screen-flash');
    const fishingMinigameEl = document.getElementById('fishing-minigame');
    const catchZoneEl = document.getElementById('catch-zone');
    const fishIconEl = document.getElementById('fish-icon');
    const fishingProgressBarEl = document.getElementById('fishing-progress-bar');
    const fishingTextEl = document.getElementById('fishing-text');
    const aquariumLayer = document.getElementById('aquarium-layer');
    const tankUI = document.getElementById('tank-ui');
    const tankStatusEl = document.getElementById('tank-status');
    const tankInventoryListEl = document.getElementById('tank-inventory-list');
    const closeTankUIButton = document.getElementById('close-tank-ui-button');

    // 게임 설정
    const playerSpeed = 5;
    let isGameOver = false;

    // 플레이어 DOM 요소
    const playerEl = document.createElement('div');
    playerEl.id = 'player';
    const nameTag = document.createElement('div');
    nameTag.className = 'player-name-tag';
    playerEl.appendChild(nameTag);
    backgroundLayer.appendChild(playerEl);

    // 게임 객체
    const monsters = [];
    const obstacles = [];
    const aquariumObstacles = [];
    const projectiles = [];
    const npcs = [];
    let shopkeeper, jobChanger, jobResetter, levelResetter, skillMaster, questGiver, hiddenMerchant, titleShrine, appearanceMirror, fishingSpot, aquariumBuilding, aquariumKeeper, aquariumExit;
    let hiddenJobMaster = null;
    let currentMap = 'overworld'; // 현재 맵 상태 (overworld, aquarium)
    let overworldPosition = { x: 0, y: 0 }; // 오버월드 위치 저장
    let fishTanks = []; // 수조 DOM 요소와 데이터를 저장하는 배열
    let currentTankIndex = -1; // 현재 상호작용 중인 수조 인덱스

    const hiddenNpcSpawnPoints = [
        { x: 1200, y: 1050 }, { x: 1800, y: 1050 },
        { x: 1100, y: 1950 }, { x: 1900, y: 1950 },
        { x: 1575, y: 2050 },
    ];

    const player = {
        name: playerName,
        element: playerEl,
        nameTagElement: nameTag,
        x: 1500, y: 1700,
        width: 30, height: 30,
        hp: 100, maxHp: 100,
        mp: 50, maxMp: 50,
        gold: 0,
        inventory: [],
        direction: 'w',
        baseAttackPower: 5,
        attackPower: 5,
        baseDefense: 0,
        defense: 0,
        isAttacking: false,
        isConversing: false,
        isFishing: false,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        job: '없음',
        facing: 'right',
        equippedWeapon: null,
        equippedShield: null,
        skills: [],
        skillCooldowns: {},
        activeQuest: null,
        questProgress: { slimeKills: 0 },
        manaRegenTimer: 0,
        nameColor: '#FFD700',
        unlockedNameColors: ['#FFD700'],
        bodyColor: 'linear-gradient(to bottom right, #3a7bd5, #00d2ff)',
        unlockedBodyColors: ['linear-gradient(to bottom right, #3a7bd5, #00d2ff)'],
        heldItemElement: null,
        aquariumTanks: [], // 수조 데이터. 예: [{ fish: '붕어' }, { fish: null }],
        justExited: false, // 맵을 방금 나갔는지 확인하는 플래그
    };

    const nameColorsData = [
        { name: '기본', color: '#FFD700', cost: 0 },
        { name: '순백색', color: '#FFFFFF', cost: 1000 },
        { name: '하늘색', color: '#87CEEB', cost: 1000 },
        { name: '분홍색', color: '#FFC0CB', cost: 1000 },
        { name: '에메랄드', color: '#50C878', cost: 2500 },
        { name: '루비', color: '#E0115F', cost: 5000 },
    ];

    const bodyColorsData = [
        { name: '기본', color: 'linear-gradient(to bottom right, #3a7bd5, #00d2ff)', cost: 0 },
        { name: '에메랄드', color: 'linear-gradient(to bottom right, #00F260, #0575E6)', cost: 2000 },
        { name: '루비', color: 'linear-gradient(to bottom right, #e52d27, #b31217)', cost: 2000 },
        { name: '골드', color: 'linear-gradient(to bottom right, #FDB813, #F27022)', cost: 5000 },
        { name: '그림자', color: 'linear-gradient(to bottom right, #434343, #000000)', cost: 10000 },
    ];

    const fishData = [
        { name: '피라미', rarity: 'common', value: 10, emoji: '🐟' },
        { name: '붕어', rarity: 'common', value: 15, emoji: '🐠' },
        { name: '잉어', rarity: 'uncommon', value: 50, emoji: '🎏' },
        { name: '메기', rarity: 'uncommon', value: 75, emoji: '🐡' },
        { name: '황금 잉어', rarity: 'rare', value: 300, emoji: '🐠' },
        { name: '상어', rarity: 'epic', value: 1200, emoji: '🦈' },
        { name: '보물이 든 병', rarity: 'epic', value: 1000, emoji: '🍾' },
    ];

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
        '강타': { job: '전사', goldCost: 500, manaCost: 10, damage: 2.5, cooldown: 3000, description: '전방의 적에게 강력한 일격을 날립니다.', tier: 1 },
        '파워샷': { job: '궁수', goldCost: 500, manaCost: 8, damage: 2.0, cooldown: 2000, description: '강화된 화살을 발사합니다.', tier: 1 },
        '파이어볼': { job: '마법사', goldCost: 500, manaCost: 15, damage: 3.0, cooldown: 4000, description: '화염구를 날려 적을 공격합니다.', tier: 1 },
        '발도술': { job: '검사', goldCost: 500, manaCost: 12, damage: 3.5, cooldown: 5000, description: '순간적으로 전방을 빠르게 벱니다.', tier: 1 },
        '퀵샷': { job: '건슬링어', goldCost: 500, manaCost: 5, damage: 1.8, cooldown: 1500, description: '빠르게 총을 발사합니다.', tier: 1 },
        '마나 슬래시': { job: '마검사', goldCost: 500, manaCost: 20, damage: 4.0, cooldown: 6000, description: '마나가 담긴 검기를 날립니다.', tier: 1 },
        '약점 찌르기': { job: '전사', goldCost: 1000, manaCost: 20, damage: 1.5, cooldown: 5000, description: '적의 약점을 찔러 5초간 방어력을 감소시킵니다.', tier: 2, effect: 'defense_down', duration: 5000 },
        '속박의 화살': { job: '궁수', goldCost: 1000, manaCost: 18, damage: 1.2, cooldown: 7000, description: '적을 3초간 이동 불가 상태로 만듭니다.', tier: 2, effect: 'bind', duration: 3000 },
        '라이트닝': { job: '마법사', goldCost: 1000, manaCost: 40, damage: 5.0, cooldown: 8000, description: '강력한 번개를 소환하여 주변의 적들을 공격합니다.', tier: 2, area: 150 },
        '차지 슬래셔': { job: '검사', goldCost: 1000, manaCost: 30, damage: 6.0, cooldown: 10000, description: '기를 모아 전방으로 강력한 참격을 날립니다.', tier: 2, range: 200 },
        '빠른 연사': { job: '건슬링어', goldCost: 1000, manaCost: 15, damage: 1.0, cooldown: 6000, description: '3발의 총알을 빠르게 연사합니다.', tier: 2, shots: 3, interval: 200 },
        '마력 폭발': { job: '마검사', goldCost: 1000, manaCost: 50, damage: 7.0, cooldown: 12000, description: '자신 주변으로 마력을 폭발시켜 모든 적에게 피해를 줍니다.', tier: 2, area: 200 },
        '마나 애로우': { job: '마나 술사', goldCost: 500, manaCost: 15, damage: 2.8, cooldown: 3000, description: '응축된 마나 화살을 발사합니다.', tier: 1 },
        '마나 블래스터': { job: '마나 술사', goldCost: 1000, manaCost: 45, damage: 6.5, cooldown: 9000, description: '전방으로 강력한 마나 포를 발사하여 경로상의 모든 적을 관통합니다.', tier: 2, piercing: true },
    };
    
    const dialogueData = {
        'shopkeeper': { name: '상점 주인', lines: ["어서오세요! 없는 것 빼고 다 있답니다.", "오늘은 뭐가 필요하신가요?"], action: { text: '상점 열기', handler: openShop } },
        'jobChanger': { name: '전직 교관', lines: ["자네의 잠재력이 보이는군. 새로운 길을 개척해보겠나?", "강해지고 싶다면 언제든지 찾아오게."], action: { text: '전직하기', handler: changeJob } },
        'skillMaster': { name: '스킬 마스터', lines: ["기술이야말로 자신을 지키는 최고의 무기지.", "자네의 직업에 맞는 기술을 알려줄 수 있네."], action: { text: '스킬 배우기', handler: learnSkill } },
        'jobResetter': { name: '망각의 현자', lines: ["과거의 선택을 후회하는가...?", "새로운 시작에는 대가가 따르는 법."], action: { text: '직업 초기화', handler: resetJob } },
        'levelResetter': { name: '윤회의 석공', lines: ["그대의 여정은 너무 멀리 와버렸군.", "처음의 열정을 되찾고 싶다면 나를 찾아오게."], action: { text: '레벨 초기화', handler: resetLevel } },
        'questGiver': { name: '모험가 길드장', lines: ["마을을 위해 힘써줄 모험가를 찾고 있네.", "자네, 모험에 관심 있나?"] },
        'hiddenJobMaster': { name: '가려진 현자', lines: ["세상에는 보편적인 길 말고도... 운명에 감춰진 길이 있다네.", "그대는... 그 길을 마주할 자격이 있는가?"] },
        'hiddenMerchant': { name: '그림자 상인', lines: ["...특별한 물건을 찾나?", "가치는... 지불할 수 있는 자만이 아는 법."], action: { text: '거래한다', handler: openHiddenShop } },
        'aquariumKeeper': { name: '수족관 관리인', lines: ["어서오세요! 신비한 물고기들의 세계입니다."], action: { text: '입장하기', handler: enterAquarium } },
        'npc': { name: '마을 주민', lines: ["요즘 몬스터들 때문에 걱정이 이만저만이 아니에요.", "저기 사냥터 쪽으로는 가지 않는 게 좋을 거예요.", "전설에 따르면 이 땅 어딘가에 푸른 보석이 잠들어 있대요."] }
    };

    function savePlayerData() {
        const playerData = {
            name: player.name,
            level: player.level, xp: player.xp, xpToNextLevel: player.xpToNextLevel,
            gold: player.gold, inventory: player.inventory, 
            equippedWeapon: player.equippedWeapon, equippedShield: player.equippedShield,
            maxHp: player.maxHp, maxMp: player.maxMp,
            baseAttackPower: player.baseAttackPower, baseDefense: player.baseDefense, 
            job: player.job, skills: player.skills,
            activeQuest: player.activeQuest, questProgress: player.questProgress,
            nameColor: player.nameColor, unlockedNameColors: player.unlockedNameColors,
            bodyColor: player.bodyColor, unlockedBodyColors: player.unlockedBodyColors,
            aquariumTanks: player.aquariumTanks,
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
                mp: playerData.maxMp,
                skills: playerData.skills || [],
                activeQuest: playerData.activeQuest || null,
                questProgress: playerData.questProgress || { slimeKills: 0 },
                equippedShield: playerData.equippedShield || null, 
                nameColor: playerData.nameColor || '#FFD700',
                unlockedNameColors: playerData.unlockedNameColors || ['#FFD700'],
                bodyColor: playerData.bodyColor || 'linear-gradient(to bottom right, #3a7bd5, #00d2ff)',
                unlockedBodyColors: playerData.unlockedBodyColors || ['linear-gradient(to bottom right, #3a7bd5, #00d2ff)'],
                aquariumTanks: playerData.aquariumTanks || Array(8).fill({ fish: null }),
            });

            // 데이터 로드 후 수조 비주얼 업데이트
            updateAllTankVisuals();

            if (player.name) {
                updatePlayerNameDisplay();
            }
            playerEl.style.backgroundImage = player.bodyColor;

            if (player.maxMp !== 50) {
                player.maxMp = 50;
                player.mp = 50;
            }

            updateAttackPower();
            updateDefense(); 
            updatePlayerVisuals();
            updateQuestUI();
        }
    }

    const shopItems = [
        { name: 'HP 포션', price: 50, type: 'potion' }, { name: 'MP 포션', price: 70, type: 'mana-potion', recovery: 20 },
        { name: '낚싯대', price: 300, type: 'rod' },
        { name: '낡은 검', price: 100, type: 'sword', power: 5 },
        { name: '낡은 방패', price: 80, type: 'shield', defense: 5 },
        { name: '낡은 지팡이', price: 150, type: 'wand', power: 7 }, { name: '낡은 권총', price: 75, type: 'gun', power: 4 },
        { name: '낡은 활', price: 120, type: 'bow', power: 6 }, { name: '카타나', price: 110, type: 'katana', power: 5 },
    ];

    const hiddenShopItems = [
        { name: '월광 대검', price: 5000, type: 'sword', power: 25 },
        { name: '속삭이는 활', price: 4500, type: 'bow', power: 22 },
        { name: '멸망의 오브', price: 6000, type: 'wand', power: 30 },
        { name: '마나 지팡이', price: 6500, type: 'wand', power: 35, exclusive: '마나 술사' },
        { name: '그림자 단검', price: 4000, type: 'katana', power: 20 },
        { name: '드래곤 슬레이어', price: 7500, type: 'gun', power: 28 },
    ];

    function isColliding(el1, el2) {
        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();
        return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);
    }

    function createWorld() {
        const housePositions = [
            { x: 1300, y: 1100 }, { x: 1300, y: 1350 }, { x: 1300, y: 1600 }, { x: 1300, y: 1850 },
            { x: 1700, y: 1100 }, { x: 1700, y: 1350 }, { x: 1700, y: 1600 }, { x: 1700, y: 1850 },
            { x: 1050, y: 1250 }, { x: 1950, y: 1250 }
        ];

        const wallColors = [
            'linear-gradient(to bottom, #F5DEB3, #D2B48C)', // Wheat to Tan
            'linear-gradient(to bottom, #B0C4DE, #8494A8)', // LightSteelBlue to a darker shade
            'linear-gradient(to bottom, #FFDAB9, #E6A48D)', // PeachPuff to a darker shade
            'linear-gradient(to bottom, #98FB98, #66B266)', // PaleGreen to a darker shade
            'linear-gradient(to bottom, #E6E6FA, #C8C8E0)'  // Lavender to a darker shade
        ];
        const roofColors = [
            'repeating-linear-gradient(45deg, #A52A2A, #A52A2A 10px, #800000 10px, #800000 20px)', // Red tile
            'repeating-linear-gradient(45deg, #4682B4, #4682B4 10px, #2E6184 10px, #2E6184 20px)', // Blue tile
            'repeating-linear-gradient(45deg, #228B22, #228B22 10px, #1A661A 10px, #1A661A 20px)', // Green tile
            '#6B4226' // Simple Brown
        ];
        const roofShapes = [
            'polygon(0% 100%, 0% 20%, 50% 0%, 100% 20%, 100% 100%)', // Standard Gable
            'polygon(0 100%, 0 0, 100% 0, 100% 100%)', // Flat roof
            'polygon(50% 0%, 100% 100%, 0% 100%)', // Triangle / A-frame
            'polygon(0% 100%, 0% 30%, 20% 0%, 80% 0%, 100% 30%, 100% 100%)' // Mansard-like
        ];

        housePositions.forEach(pos => {
            const house = document.createElement('div');
            house.className = 'house';
            house.style.left = `${pos.x}px`; house.style.top = `${pos.y}px`;
            
            const wall = document.createElement('div'); 
            wall.className = 'wall';
            wall.style.background = wallColors[Math.floor(Math.random() * wallColors.length)];

            const roof = document.createElement('div'); 
            roof.className = 'roof';
            roof.style.background = roofColors[Math.floor(Math.random() * roofColors.length)];
            roof.style.clipPath = roofShapes[Math.floor(Math.random() * roofShapes.length)];

            const door = document.createElement('div'); door.className = 'door';
            const window1 = document.createElement('div'); window1.className = 'window window-left';
            const window2 = document.createElement('div'); window2.className = 'window window-right';
            
            

            wall.appendChild(door); wall.appendChild(window1); wall.appendChild(window2);
            house.appendChild(roof); house.appendChild(wall);
            
            // Only add a chimney if the roof is not flat or A-frame
            if (!roof.style.clipPath.includes('polygon(0 100%, 0 0, 100% 0, 100% 100%)') && !roof.style.clipPath.includes('polygon(50% 0%, 100% 100%, 0% 100%)')) {
                const chimney = document.createElement('div');
                chimney.className = 'chimney';
                house.appendChild(chimney);
            }

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

        titleShrine = { element: document.createElement('div') };
        titleShrine.element.id = 'title-shrine';
        titleShrine.element.style.left = '1970px';
        titleShrine.element.style.top = '1520px';
        backgroundLayer.appendChild(titleShrine.element);

        appearanceMirror = { element: document.createElement('div') };
        appearanceMirror.element.id = 'appearance-mirror';
        appearanceMirror.element.style.left = '1920px';
        appearanceMirror.element.style.top = '1520px';
        backgroundLayer.appendChild(appearanceMirror.element);

        fishingSpot = { element: document.createElement('div') };
        fishingSpot.element.id = 'fishing-spot';
        fishingSpot.element.style.left = '200px';
        fishingSpot.element.style.top = '1000px';
        backgroundLayer.appendChild(fishingSpot.element);

        aquariumBuilding = { element: document.createElement('div') };
        aquariumBuilding.element.className = 'aquarium-building';
        aquariumBuilding.element.style.left = '500px';
        aquariumBuilding.element.style.top = '700px';
        backgroundLayer.appendChild(aquariumBuilding.element);
        obstacles.push(aquariumBuilding.element);

        aquariumKeeper = { element: document.createElement('div'), type: 'aquariumKeeper' };
        aquariumKeeper.element.className = 'aquarium-keeper'; // CSS 스타일링을 위해 클래스 추가
        aquariumKeeper.element.style.left = `${500 + (200 / 2) - 16}px`; // 수족관 중앙 하단
        aquariumKeeper.element.style.top = `${700 + 160 + 20}px`; // 건물과 겹치지 않게 20px 추가
        const aquariumKeeperNameTag = document.createElement('div');
        aquariumKeeperNameTag.className = 'npc-name-tag';
        aquariumKeeperNameTag.textContent = dialogueData.aquariumKeeper.name;
        aquariumKeeper.element.appendChild(aquariumKeeperNameTag);
        backgroundLayer.appendChild(aquariumKeeper.element);

        const pathSegments = [
            { x: 1475, y: 1050, width: 200, height: 1000 },
            { x: 1425, y: 1050, width: 300, height: 100 },
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
            // 마을 오른쪽 숲 (재배치)
            { x: 1900, y: 1050 }, { x: 1800, y: 1150 }, { x: 2050, y: 1350 },
            { x: 2050, y: 1550 }, { x: 2050, y: 1750 }, { x: 1800, y: 1850 },
        ];
        treePositions.forEach(pos => createTree(pos.x, pos.y));

        for (let i = 0; i < 20; i++) {
            const grassEl = document.createElement('div');
            grassEl.className = 'grass-patch';
            grassEl.textContent = '^^';
            grassEl.style.left = `${1000 + Math.random() * 1200}px`;
            grassEl.style.top = `${900 + Math.random() * 1300}px`;
            backgroundLayer.appendChild(grassEl);
        }

        for (let i = 0; i < 4; i++) createNpc();

        const area = { x: 3000, y: 500, width: 1000, height: 2000 };
        for (let i = 0; i < 15; i++) createMonster(area);
        
        const fenceSegments = [
            { x: area.x, y: area.y, width: (area.width / 2) - 50, height: 20 },
            { x: area.x + (area.width / 2) + 50, y: area.y, width: (area.width / 2) - 50, height: 20 },
            { x: area.x, y: area.y + area.height - 20, width: area.width, height: 20 },
            { x: area.x, y: area.y, width: 20, height: (area.height / 2) - 75 },
            { x: area.x, y: area.y + (area.height / 2) + 75, width: 20, height: (area.height / 2) - 75 },
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

        const hiddenShopEl = document.createElement('div');
        hiddenShopEl.className = 'hidden-shop';
        hiddenShopEl.style.left = '1050px';
        hiddenShopEl.style.top = '1600px';
        backgroundLayer.appendChild(hiddenShopEl);
        obstacles.push(hiddenShopEl);

        hiddenMerchant = { element: document.createElement('div'), type: 'hiddenMerchant' };
        hiddenMerchant.element.className = 'hidden-merchant';
        hiddenMerchant.element.style.left = '1083px';
        hiddenMerchant.element.style.top = '1680px';
        const hiddenMerchantNameTag = document.createElement('div');
        hiddenMerchantNameTag.className = 'npc-name-tag';
        hiddenMerchantNameTag.textContent = dialogueData.hiddenMerchant.name;
        hiddenMerchant.element.appendChild(hiddenMerchantNameTag);
        backgroundLayer.appendChild(hiddenMerchant.element);

        const harderArea = { x: 3000, y: -1600, width: 1000, height: 1500 };
        for (let i = 0; i < 10; i++) createHarderMonster(harderArea);

        const harderFenceSegments = [
            { x: harderArea.x, y: harderArea.y, width: harderArea.width, height: 20 },
            { x: harderArea.x, y: harderArea.y + harderArea.height - 20, width: (harderArea.width / 2) - 50, height: 20 },
            { x: harderArea.x + (harderArea.width / 2) + 50, y: harderArea.y + harderArea.height - 20, width: (harderArea.width / 2) - 50, height: 20 },
            { x: harderArea.x, y: harderArea.y, width: 20, height: harderArea.height },
            { x: harderArea.x + harderArea.width - 20, y: harderArea.y, width: 20, height: harderArea.height },
        ];
        harderFenceSegments.forEach(seg => {
            const fenceEl = document.createElement('div');
            fenceEl.className = 'fence';
            fenceEl.style.left = `${seg.x}px`; fenceEl.style.top = `${seg.y}px`;
            fenceEl.style.width = `${seg.width}px`; fenceEl.style.height = `${seg.height}px`;
            fenceEl.style.backgroundColor = '#A0522D';
            backgroundLayer.appendChild(fenceEl);
            obstacles.push(fenceEl);
        });

        // 꾸미기 공간 울타리
        const decorationFenceSegments = [
            { x: 1980, y: 1480, width: 70, height: 20 }, // Top
            { x: 1980, y: 1850, width: 70, height: 20 }, // Bottom
            { x: 2050, y: 1480, width: 20, height: 390 }, // Right
        ];
        decorationFenceSegments.forEach(seg => {
            const fenceEl = document.createElement('div');
            fenceEl.className = 'fence';
            fenceEl.style.left = `${seg.x}px`; fenceEl.style.top = `${seg.y}px`;
            fenceEl.style.width = `${seg.width}px`; fenceEl.style.height = `${seg.height}px`;
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
        const villageArea = { x: 1475, y: 1250, width: 200, height: 750 };
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
        const thingsToAvoid = [...obstacles, shopkeeper.element, jobChanger.element, jobResetter.element, levelResetter.element, skillMaster.element, questGiver.element, aquariumKeeper.element, ...npcs.map(n => n.element)];
        if (thingsToAvoid.some(thing => thing && isColliding(npc.element, thing))) {
            npc.element.remove();
            createNpc();
            return;
        }
        npcs.push(npc);
    }

    function respawnMonster() {
        setTimeout(() => {
            if (monsters.filter(m => m.type === 'slime').length < 15) {
                createMonster({ x: 3000, y: 500, width: 1000, height: 2000 });
            }
        }, 5000);
    }

    function respawnHarderMonster() {
        setTimeout(() => {
            if (monsters.filter(m => m.type === 'golem').length < 10) {
                createHarderMonster({ x: 3000, y: -1600, width: 1000, height: 1500 });
            }
        }, 8000);
    }

    function createFloatingText(text, type, x, y) {
        const textEl = document.createElement('div');
        textEl.className = `floating-text ${type}`;
        textEl.textContent = text;
        textEl.style.left = `${x}px`;
        textEl.style.top = `${y}px`;
        backgroundLayer.appendChild(textEl);
        setTimeout(() => textEl.remove(), 1000);
    }

    function gainXp(amount) {
        player.xp += amount;
        createFloatingText(`+${amount} XP`, 'xp', player.x, player.y - 20);
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
        player.maxMp += 10;
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

        if (player.equippedWeapon) {
            const weaponEl = document.createElement('div');
            weaponEl.className = `player-weapon ${player.equippedWeapon.type}`;
            
            if (player.equippedWeapon.name === '마나 지팡이') weaponEl.classList.add('mana-staff');
            else if (player.equippedWeapon.name === '멸망의 오브') weaponEl.classList.add('orb-of-destruction');
            else if (player.equippedWeapon.name === '그림자 단검') weaponEl.classList.add('shadow-dagger');
            else if (player.equippedWeapon.name === '월광 대검') weaponEl.classList.add('moonlight-greatsword');
            else if (player.equippedWeapon.name === '속삭이는 활') weaponEl.classList.add('whispering-bow');
            else if (player.equippedWeapon.name === '드래곤 슬레이어') weaponEl.classList.add('dragon-slayer');

            if (player.facing === 'left') weaponEl.classList.add('facing-left');
            else weaponEl.classList.add('facing-right');

            if (player.equippedWeapon.type === 'bow') {
                const bowLimb = document.createElement('div'); bowLimb.className = 'bow-limb';
                const bowGrip = document.createElement('div'); bowGrip.className = 'bow-grip';
                weaponEl.appendChild(bowLimb); weaponEl.appendChild(bowGrip);
            }
            player.element.appendChild(weaponEl);

            if (player.job === '검사' && player.equippedWeapon.type === 'katana') {
                const sheathEl = document.createElement('div');
                sheathEl.className = 'katana-sheath';
                if (player.facing === 'left') sheathEl.classList.add('facing-left');
                else sheathEl.classList.add('facing-right');
                player.element.appendChild(sheathEl);
            }
        }

        if (player.equippedShield) {
            const shieldEl = document.createElement('div');
            shieldEl.className = 'player-shield';
             if (player.facing === 'left') shieldEl.classList.add('facing-left');
            else shieldEl.classList.add('facing-right');
            player.element.appendChild(shieldEl);
        }
        
        if (player.heldItemElement) {
            updateHeldItemPosition();
        }
    }

    function equipBestGear() {
        let bestWeapon = null;
        let bestShield = null;
        const allItems = [...shopItems, ...hiddenShopItems];

        const usableItems = player.inventory
            .map(itemName => allItems.find(shopItem => shopItem.name === itemName))
            .filter(item => {
                if (!item || player.job === '없음' || item.type === 'rod') return false;
                if (item.exclusive) return player.job === item.exclusive;
                switch (item.type) {
                    case 'sword': return ['전사', '마검사'].includes(player.job);
                    case 'wand':  return ['마법사', '마검사', '아이스'].includes(player.job);
                    case 'gun':   return ['건슬링어'].includes(player.job);
                    case 'bow':   return ['궁수'].includes(player.job);
                    case 'katana':return ['검사'].includes(player.job);
                    case 'shield':return ['전사', '검사'].includes(player.job);
                    default:      return false;
                }
            });

        for (const item of usableItems) {
            if (item.power && (!bestWeapon || item.power > bestWeapon.power)) bestWeapon = item;
            if (item.defense && (!bestShield || item.defense > bestShield.defense)) bestShield = item;
        }

        let equippedSomething = false;
        if (bestWeapon) { player.equippedWeapon = bestWeapon; equippedSomething = true; }
        if (bestShield) { player.equippedShield = bestShield; equippedSomething = true; }

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
            createFloatingText(`+${monster.goldValue} G`, 'gold', player.x, player.y);

            if (monster.type === 'slime') {
                player.questProgress.slimeKills = (player.questProgress.slimeKills || 0) + 1;
            }

            if (player.activeQuest) {
                const quest = questsData[player.activeQuest];
                if (quest.target === monster.type) {
                    player.questProgress[quest.target] = (player.questProgress[quest.target] || 0) + 1;
                    updateQuestUI();
                    savePlayerData();
                }
            }
        }

        monster.element.remove();
        const index = monsters.indexOf(monster);
        if (index > -1) monsters.splice(index, 1);
        
        if (monster.type === 'slime') respawnMonster();
        else if (monster.type === 'golem') respawnHarderMonster();
    }

    function takeDamage(monster, damage) {
        let finalDamage = damage;
        const isCritical = Math.random() < 0.1; // 10% 확률
        if (isCritical) {
            finalDamage *= 1.5;
            createFloatingText('CRITICAL!', 'critical', monster.x, monster.y - 20);
        }
        finalDamage = Math.ceil(finalDamage);

        const defenseDown = monster.effects.find(e => e.type === 'defense_down');
        if (defenseDown) {
            finalDamage *= 1.5;
        }

        monster.hp -= finalDamage;
        monster.element.classList.add('hit');
        setTimeout(() => monster.element.classList.remove('hit'), 200);
        
        if (monster.hp <= 0) {
            handleMonsterKill(monster);
        } else {
            monster.healthBar.style.width = `${(monster.hp / monster.maxHp) * 100}%`;
        }
    }

    function playerAttack() {
        removeHeldItem();
        if (player.isAttacking || player.isConversing || (player.equippedWeapon && player.equippedWeapon.type === 'rod')) return;
        if (['건슬링어', '마법사', '궁수', '마나 술사'].includes(player.job)) {
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
            monsters.forEach(monster => {
                if (isColliding(attackEffect, monster.element)) takeDamage(monster, player.attackPower);
            });
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
        
        let projectileType = '', speed = 8, range = 300, damage = player.attackPower, effect = null, duration = 0;
        let skillInfo = {};

        if (skillName) {
            skillInfo = skillsData[skillName];
            damage = player.attackPower * skillInfo.damage;
            if (skillInfo.effect) {
                effect = skillInfo.effect;
                duration = skillInfo.duration;
            }
            if (skillName === '파이어볼') projectileType = 'fireball';
            else if (skillName === '파워샷') projectileType = 'power-shot';
            else if (skillName === '퀵샷') projectileType = 'quick-shot';
            else if (skillName === '마나 슬래시') projectileType = 'mana-slash';
            else if (skillName === '속박의 화살') projectileType = 'bind-arrow';
            else if (skillName === '빠른 연사') projectileType = 'bullet';
            else if (skillName === '마나 애로우') projectileType = 'mana-arrow';
            else if (skillName === '마나 블래스터') projectileType = 'mana-blaster';
        } else {
            if (player.job === '건슬링어') projectileType = 'bullet';
            else if (player.job === '마법사') projectileType = 'magic-missile';
            else if (player.job === '마나 술사') projectileType = 'mana-bolt';
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
            piercing: !!skillInfo.piercing,
            hitMonsters: [],
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
                        player.skills = [];
                        player.maxMp = Math.floor(player.maxMp * 1.5);
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
                        player.skills = [];
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

        if (!hasTier1 && tier1Skill) skillToLearn = tier1Skill;
        else if (hasTier1 && !hasTier2 && tier2Skill) skillToLearn = tier2Skill;
        else { alert("이미 모든 스킬을 배웠습니다."); return; }

        if (!skillToLearn) { alert("이 직업은 배울 수 있는 스킬이 없습니다."); return; }

        const [skillName, skillInfo] = skillToLearn;

        if (player.gold < skillInfo.goldCost) {
            alert(`골드가 부족합니다. (${skillInfo.goldCost} G 필요)`);
            return;
        }

        if (confirm(`'${skillName}' 스킬을 배우시겠습니까?

${skillInfo.description}
가격: ${skillInfo.goldCost} G
마나 소모: ${skillInfo.manaCost}`)) {
            player.gold -= skillInfo.goldCost;
            player.skills.push(skillName);
            player.skills.sort((a, b) => (skillsData[a].tier || 0) - (skillsData[b].tier || 0));
            alert(`'${skillName}' 스킬을 배웠습니다!`);
            savePlayerData();
            updateUI();
        }
    }

    function applyEffect(monster, effect, duration) {
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
            if (effectIndex > -1) monster.effects.splice(effectIndex, 1);
            effectIndicator.remove();
        }, duration);

        monster.effects.push({ type: effect, timeoutId });
    }

    function useSkill(skillSlot) {
        removeHeldItem();
        if (player.isConversing || player.skills.length < skillSlot) return;

        const skillName = player.skills[skillSlot - 1];
        if (!skillName) return;

        const skillInfo = skillsData[skillName];
        const now = Date.now();

        if (player.mp < skillInfo.manaCost) return;
        if (now - (player.skillCooldowns[skillName] || 0) < skillInfo.cooldown) return;

        player.mp -= skillInfo.manaCost;
        player.skillCooldowns[skillName] = now;
        updateUI();

        let attackEffect, playerRect, hitboxRect, backgroundRect;
        playerRect = player.element.getBoundingClientRect();
        backgroundRect = backgroundLayer.getBoundingClientRect();

        switch (skillName) {
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

                monsters.forEach(monster => {
                    if (isColliding(attackEffect, monster.element)) takeDamage(monster, player.attackPower * skillInfo.damage);
                });
                setTimeout(() => {
                    attackEffect.remove();
                    player.isAttacking = false;
                }, t1_duration);
                break;

            case '파이어볼': case '파워샷': case '퀵샷': case '마나 슬래시':
            case '마나 애로우': case '마나 블래스터':
                fireProjectile(skillName);
                break;

            case '약점 찌르기':
            case '차지 슬래셔':
                player.isAttacking = true;
                attackEffect = document.createElement('div');
                attackEffect.className = 'attack-effect';
                let t2_range, t2_duration, t2_effectClass;

                if (skillName === '차지 슬래셔') {
                    t2_range = skillInfo.range; t2_duration = 400; t2_effectClass = 'charge-slasher-effect';
                } else {
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

                monsters.forEach(monster => {
                    if (isColliding(attackEffect, monster.element)) {
                        takeDamage(monster, player.attackPower * skillInfo.damage);
                        if (skillInfo.effect) applyEffect(monster, skillInfo.effect, skillInfo.duration);
                    }
                });
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
                const lightningRange = 400;

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
                        top: `${closestMonster.y - 100}px`,
                    });
                    backgroundLayer.appendChild(attackEffect);
                    
                    takeDamage(closestMonster, player.attackPower * skillInfo.damage);

                    setTimeout(() => { attackEffect.remove(); }, 300);
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

                monsters.forEach(monster => {
                    const dx = (player.x + player.width/2) - (monster.x + monster.element.offsetWidth/2);
                    const dy = (player.y + player.height/2) - (monster.y + monster.element.offsetHeight/2);
                    if (Math.sqrt(dx * dx + dy * dy) < area) {
                        takeDamage(monster, player.attackPower * skillInfo.damage);
                    }
                });

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
            let canBuy = true;
            if (item.type !== 'potion' && item.type !== 'mana-potion' && item.type !== 'rod' && player.job === '없음') {
                canBuy = false;
            } else {
                switch (item.type) {
                    case 'sword': canBuy = ['전사', '마검사'].includes(player.job); break;
                    case 'wand': canBuy = ['마법사', '마검사', '마나 술사', '아이스'].includes(player.job); break;
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
            if (item.type !== 'potion' && item.type !== 'mana-potion') alert(`${item.name}을(를) 구매했습니다!`);
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

        if (!player.isConversing && !player.isFishing) {
            if (keysPressed['w']) { moveY = -playerSpeed; player.direction = 'w'; }
            if (keysPressed['s']) { moveY = playerSpeed; player.direction = 's'; }
            if (keysPressed['a']) { moveX = -playerSpeed; player.direction = 'a'; player.facing = 'left'; }
            if (keysPressed['d']) { moveX = playerSpeed; player.direction = 'd'; player.facing = 'right'; }
        }

        if (player.facing !== prevFacing) updatePlayerVisuals();

        if (moveX !== 0 || moveY !== 0) {
            removeHeldItem();
            player.x += moveX;
            player.y += moveY;
            player.element.style.left = `${player.x}px`;
            player.element.style.top = `${player.y}px`;

            const currentObstacles = currentMap === 'overworld' ? obstacles : aquariumObstacles;
            if (currentObstacles.some(obstacle => isColliding(player.element, obstacle))) {
                player.x -= moveX;
                player.y -= moveY;
            }

            // 맵 나가기 체크
            if (currentMap === 'aquarium' && isColliding(player.element, aquariumExit)) {
                exitAquarium();
            }
        }

        // 플레이어 DOM 요소 위치를 한 프레임당 한 번만 업데이트합니다.
        player.element.style.left = `${player.x}px`;
        player.element.style.top = `${player.y}px`;

        player.manaRegenTimer++;
        if (player.manaRegenTimer >= 60) {
            if (player.mp < player.maxMp) player.mp = Math.min(player.maxMp, player.mp + 1);
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
                const collidables = [...obstacles, player.element, shopkeeper.element, jobChanger.element, jobResetter.element, levelResetter.element, skillMaster.element, questGiver.element, aquariumKeeper.element, ...npcs.filter(other => other !== npc).map(o => o.element)];
                if (collidables.some(item => item && isColliding(npc.element, item))) {
                    npc.x = originalX; npc.y = originalY;
                    npc.element.style.left = `${npc.x}px`; npc.element.style.top = `${npc.y}px`;
                    npc.direction = null;
                }
            }
        });

        monsters.forEach(monster => {
            if (monster.effects.some(e => e.type === 'bind')) return;
            const dx = player.x - monster.x, dy = player.y - monster.y;
            if (Math.sqrt(dx * dx + dy * dy) < 250) {
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
                if (p.hitMonsters.includes(monster)) continue;
                if (isColliding(p.element, monster.element)) {
                    takeDamage(monster, p.damage);
                    if (p.effect) applyEffect(monster, p.effect, p.duration);
                    if (p.piercing) p.hitMonsters.push(monster);
                    else { p.element.remove(); projectiles.splice(i, 1); break; }
                }
            }
        }

        for (let i = monsters.length - 1; i >= 0; i--) {
            const monster = monsters[i];
            if (isColliding(player.element, monster.element)) {
                player.hp -= Math.max(1, 10 - player.defense);
                screenFlashEl.style.opacity = '0.5';
                setTimeout(() => screenFlashEl.style.opacity = '0', 100);
                handleMonsterKill(monster, false);
                if (player.hp <= 0) {
                    player.hp = 0;
                    isGameOver = true;
                    savePlayerData();
                    gameOverScreen.classList.remove('hidden');
                }
                break;
            }
        }

        updateUI();

        // 현재 맵과 상관없이 두 레이어의 위치를 모두 업데이트합니다.
        let camX = player.x;
        let camY = player.y;

        // 방금 맵을 나갔다면, 저장된 위치를 기준으로 카메라를 설정합니다.
        if (player.justExited) {
            camX = overworldPosition.x;
            camY = overworldPosition.y;
            player.justExited = false;
        }

        const transformValue = `translate(${-camX + window.innerWidth / 2}px, ${-camY + window.innerHeight / 2}px)`;
        backgroundLayer.style.transform = transformValue;
        aquariumLayer.style.transform = transformValue;

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
            removeHeldItem();
            let interacted = false;
            const allNpcs = [shopkeeper, jobChanger, skillMaster, jobResetter, levelResetter, questGiver, hiddenJobMaster, hiddenMerchant, aquariumKeeper, ...npcs].filter(Boolean);
            for (const npc of allNpcs) {
                if (npc && npc.element && isColliding(player.element, npc.element)) {
                    showDialogue(npc);
                    interacted = true;
                    break;
                }
            }

            if (!interacted) {
                if (currentMap === 'aquarium') {
                    for (let i = 0; i < fishTanks.length; i++) {
                        if (isColliding(player.element, fishTanks[i].element)) {
                            openTankUI(i);
                            interacted = true;
                            break;
                        }
                    }
                }

                if (!interacted) {
                    if (titleShrine && isColliding(player.element, titleShrine.element)) {
                        openNameDecorator();
                    } else if (appearanceMirror && isColliding(player.element, appearanceMirror.element)) {
                        openBodyColorChanger();
                    } else if (fishingSpot && isColliding(player.element, fishingSpot.element)) {
                        startFishing();
                    }
                }
            }
        }
        if (key === 'enter') {
            playerAttack();
        }
        if (key === 'e') equipBestGear();
        if (key === 'q') usePotion();
        if (key === 'r') useManaPotion();
        if (key === '1') useSkill(1);
        if (key === '2') useSkill(2);
        if (key === '7') {
            player.gold += 1000;
            alert("1000 골드를 획득했습니다!");
            updateUI();
            savePlayerData();
        }
    });

    function usePotion(itemName = 'HP 포션') {
        const potionIndex = player.inventory.findIndex(item => item === itemName);
        if (potionIndex === -1) { alert("HP 포션이 없습니다."); return; }
        if (player.hp >= player.maxHp) { alert("체력이 이미 가득 찼습니다."); return; }
        player.inventory.splice(potionIndex, 1);
        player.hp = Math.min(player.maxHp, player.hp + 30);
        alert("HP 포션을 사용하여 30의 체력을 회복했습니다!");
        updateUI();
        savePlayerData();
    }

    function useManaPotion(itemName = 'MP 포션') {
        const potionIndex = player.inventory.findIndex(item => item === itemName);
        if (potionIndex === -1) { alert("MP 포션이 없습니다."); return; }
        if (player.mp >= player.maxMp) { alert("마나가 이미 가득 찼습니다."); return; }
        
        const itemData = shopItems.find(item => item.name === itemName);
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
                maxMp: 50, mp: 50,
                baseAttackPower: 5, baseDefense: 0, 
                job: '없음', inventory: [], 
                equippedWeapon: null, equippedShield: null, 
                skills: [],
                activeQuest: null, questProgress: { slimeKills: 0 }
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
            if (player.job === '마나 술사') {
                player.maxMp = Math.ceil(player.maxMp / 1.5);
                player.mp = player.maxMp;
            }
            Object.assign(player, { job: '없음', inventory: [], equippedWeapon: null, equippedShield: null, skills: [] });
            updateAttackPower();
            updateDefense();
            updatePlayerVisuals();
            alert("직업과 소지품이 초기화되었습니다.");
            savePlayerData();
            updateUI();
        }
    }

    document.addEventListener('keyup', (event) => { keysPressed[event.key.toLowerCase()] = false; });
    document.addEventListener('mousedown', (event) => { if (!isGameOver && shopWindow.classList.contains('hidden') && !player.isConversing && event.button === 0) playerAttack(); });
    restartButton.addEventListener('click', () => location.reload());
    closeShopButton.addEventListener('click', closeShop);
    const hiddenShopWindow = document.getElementById('hidden-shop-window');
    const closeHiddenShopButton = document.getElementById('close-hidden-shop-button');
    closeHiddenShopButton.addEventListener('click', () => hiddenShopWindow.classList.add('hidden'));
    closeDialogueButton.addEventListener('click', hideDialogue);
    closeTankUIButton.addEventListener('click', closeTankUI);

    const nameDecoratorWindow = document.getElementById('title-window');
    const nameColorListEl = document.getElementById('title-list');
    const closeNameDecoratorWindowButton = document.getElementById('close-title-window-button');
    closeNameDecoratorWindowButton.addEventListener('click', () => nameDecoratorWindow.classList.add('hidden'));

    const bodyColorWindow = document.getElementById('body-color-window');
    const bodyColorListEl = document.getElementById('body-color-list');
    const closeBodyColorWindowButton = document.getElementById('close-body-color-window-button');
    closeBodyColorWindowButton.addEventListener('click', () => bodyColorWindow.classList.add('hidden'));

    inventoryButton.addEventListener('click', () => {
        inventoryWindow.classList.toggle('hidden');
        if (!inventoryWindow.classList.contains('hidden')) {
            updateInventoryUI();
        }
        inventoryButton.blur(); // 버튼에서 포커스 제거
    });

    function updatePlayerNameDisplay() {
        playerNameEl.textContent = player.name;
        playerNameEl.style.color = player.nameColor;
        player.nameTagElement.textContent = player.name;
        player.nameTagElement.style.color = player.nameColor;
    }

    function openNameDecorator() {
        nameColorListEl.innerHTML = '';
        nameColorsData.forEach(colorData => {
            const li = document.createElement('li');
            const colorSwatch = `<div style="width: 20px; height: 20px; background-color: ${colorData.color}; border: 1px solid #fff;"></div>`;
            const isUnlocked = player.unlockedNameColors.includes(colorData.color);
            
            li.innerHTML = `${colorSwatch}<span>${colorData.name}</span>`;

            const button = document.createElement('button');
            if (isUnlocked) {
                if (player.nameColor === colorData.color) {
                    button.textContent = '적용중';
                    button.disabled = true;
                } else {
                    button.textContent = '적용';
                    button.onclick = () => {
                        player.nameColor = colorData.color;
                        updatePlayerNameDisplay();
                        savePlayerData();
                        openNameDecorator();
                    };
                }
            } else {
                button.textContent = `구매 (${colorData.cost} G)`;
                if (player.gold < colorData.cost) button.disabled = true;
                button.onclick = () => {
                    if (player.gold >= colorData.cost) {
                        player.gold -= colorData.cost;
                        player.unlockedNameColors.push(colorData.color);
                        player.nameColor = colorData.color;
                        updatePlayerNameDisplay();
                        savePlayerData();
                        openNameDecorator();
                    }
                };
            }
            li.appendChild(button);
            nameColorListEl.appendChild(li);
        });
        nameDecoratorWindow.classList.remove('hidden');
    }

    function openBodyColorChanger() {
        bodyColorListEl.innerHTML = '';
        bodyColorsData.forEach(colorData => {
            const li = document.createElement('li');
            const colorSwatch = `<div style="width: 20px; height: 20px; background-image: ${colorData.color}; border: 1px solid #fff;"></div>`;
            const isUnlocked = player.unlockedBodyColors.includes(colorData.color);
            
            li.innerHTML = `${colorSwatch}<span>${colorData.name}</span>`;

            const button = document.createElement('button');
            if (isUnlocked) {
                if (player.bodyColor === colorData.color) {
                    button.textContent = '적용중';
                    button.disabled = true;
                } else {
                    button.textContent = '적용';
                    button.onclick = () => {
                        player.bodyColor = colorData.color;
                        player.element.style.backgroundImage = player.bodyColor;
                        savePlayerData();
                        openBodyColorChanger();
                    };
                }
            } else {
                button.textContent = `구매 (${colorData.cost} G)`;
                if (player.gold < colorData.cost) button.disabled = true;
                button.onclick = () => {
                    if (player.gold >= colorData.cost) {
                        player.gold -= colorData.cost;
                        player.unlockedBodyColors.push(colorData.color);
                        player.bodyColor = colorData.color;
                        player.element.style.backgroundImage = player.bodyColor;
                        savePlayerData();
                        openBodyColorChanger();
                    }
                };
            }
            li.appendChild(button);
            bodyColorListEl.appendChild(li);
        });
        bodyColorWindow.classList.remove('hidden');
    }

    function updateInventoryUI() {
        inventoryListEl.innerHTML = '';
        if (player.inventory.length === 0) {
            inventoryListEl.innerHTML = '<li>비어있음</li>';
            return;
        }

        const itemCounts = player.inventory.reduce((acc, item) => {
            acc[item] = (acc[item] || 0) + 1;
            return acc;
        }, {});

        Object.entries(itemCounts).forEach(([itemName, count]) => {
            const li = document.createElement('li');
            const itemData = [...shopItems, ...hiddenShopItems, ...fishData].find(i => i.name === itemName);
            
            li.innerHTML = `<span>${itemName} (${count})</span>`;
            
            const buttonContainer = document.createElement('div');

            if (itemData.type === 'potion' || itemData.type === 'mana-potion') {
                const useButton = document.createElement('button');
                useButton.textContent = '사용';
                useButton.onclick = () => {
                    if (itemData.type === 'potion') usePotion(itemName);
                    else useManaPotion(itemName);
                    updateInventoryUI();
                };
                buttonContainer.appendChild(useButton);
            } else if (itemData.rarity) { // Fish
                const holdButton = document.createElement('button');
                holdButton.textContent = '들기';
                holdButton.onclick = () => holdFish(itemData);
                buttonContainer.appendChild(holdButton);

                const sellButton = document.createElement('button');
                sellButton.textContent = `판매 (${itemData.value} G)`;
                sellButton.onclick = () => {
                    player.gold += itemData.value;
                    const itemIndex = player.inventory.indexOf(itemName);
                    player.inventory.splice(itemIndex, 1);
                    updateUI();
                    updateInventoryUI();
                    savePlayerData();
                };
                buttonContainer.appendChild(sellButton);
            } else { // Equipment
                const equipButton = document.createElement('button');
                if ((player.equippedWeapon && player.equippedWeapon.name === itemName) || (player.equippedShield && player.equippedShield.name === itemName)) {
                    equipButton.textContent = '해제';
                    equipButton.onclick = () => unequipItem(itemData.type.includes('shield') ? 'shield' : 'weapon');
                } else {
                    equipButton.textContent = '장착';
                    equipButton.onclick = () => equipItem(itemData);
                }
                buttonContainer.appendChild(equipButton);
            }
            li.appendChild(buttonContainer);
            inventoryListEl.appendChild(li);
        });
    }

    function holdFish(fishData) {
        removeHeldItem(); // Remove any currently held item

        const fishEl = document.createElement('div');
        fishEl.className = 'held-item';
        fishEl.textContent = fishData.emoji;

        player.heldItemElement = fishEl;
        player.element.appendChild(fishEl);

        updateHeldItemPosition();
        inventoryWindow.classList.add('hidden'); // Close inventory
    }

    function equipItem(itemData) {
        removeHeldItem();
        if (itemData.type.includes('shield')) {
            player.equippedShield = itemData;
        } else {
            player.equippedWeapon = itemData;
        }
        updateAttackPower();
        updateDefense();
        updatePlayerVisuals();
        savePlayerData();
        alert(`${itemData.name}을(를) 장착했습니다.`);
        updateInventoryUI();
    }

    function unequipItem(itemType) {
        if (itemType === 'weapon') {
            player.equippedWeapon = null;
            updateAttackPower();
        } else if (itemType === 'shield') {
            player.equippedShield = null;
            updateDefense();
        }
        updatePlayerVisuals();
        savePlayerData();
        updateInventoryUI();
    }

    function removeHeldItem() {
        if (player.heldItemElement) {
            player.heldItemElement.remove();
            player.heldItemElement = null;
        }
    }

    function updateHeldItemPosition() {
        if (!player.heldItemElement) return;
        player.heldItemElement.classList.remove('facing-left', 'facing-right');
        player.heldItemElement.classList.add(player.facing === 'left' ? 'facing-left' : 'facing-right');
    }

    function startFishing() {
        if (player.isFishing) return;
        if (!player.equippedWeapon || player.equippedWeapon.type !== 'rod') {
            alert('낚싯대를 장착해야 낚시를 할 수 있습니다.');
            return;
        }
        player.isFishing = true;
        fishingTextEl.textContent = '낚시 중...';
        fishingMinigameEl.classList.remove('hidden');

        setTimeout(() => {
            fishingTextEl.textContent = '입질이 왔다!';
            runFishingMinigame();
        }, 1000 + Math.random() * 2000);
    }

    function runFishingMinigame() {
        let progress = 10;
        let catchZonePosition = 125;
        const catchZoneHeight = 60;
        const barHeight = 250;
        let minigameInterval;
        let timeoutId;

        const gameLogic = () => {
            const fishPosition = fishIconEl.offsetTop;
            
            if (keysPressed['x']) { // x key
                catchZonePosition = Math.max(0, catchZonePosition - 7);
            } else {
                catchZonePosition = Math.min(barHeight - catchZoneHeight, catchZonePosition + 7);
            }
            catchZoneEl.style.top = `${catchZonePosition}px`;

            if (fishPosition > catchZonePosition && fishPosition < catchZonePosition + catchZoneHeight) {
                progress = Math.min(100, progress + 2.5);
            } else {
                progress = Math.max(0, progress - 1);
            }
            
            fishingProgressBarEl.style.width = `${progress}%`;

            if (progress >= 100) {
                clearInterval(minigameInterval);
                clearTimeout(timeoutId);
                endFishing(true);
            } else if (progress <= 0) {
                clearInterval(minigameInterval);
                clearTimeout(timeoutId);
                endFishing(false);
            }
        };

        minigameInterval = setInterval(gameLogic, 50);

        timeoutId = setTimeout(() => {
            clearInterval(minigameInterval);
            if (player.isFishing) { // Check if still fishing before failing
                endFishing(false);
            }
        }, 8000); // 8초 제한
    }

    function endFishing(success) {
        fishingMinigameEl.classList.add('hidden');
        player.isFishing = false;
        if (success) {
            const rand = Math.random() * 100;
            let caughtFish;
            if (rand < 50) caughtFish = fishData.find(f => f.rarity === 'common');
            else if (rand < 85) caughtFish = fishData.find(f => f.rarity === 'uncommon');
            else if (rand < 98) caughtFish = fishData.find(f => f.rarity === 'rare');
            else caughtFish = fishData.find(f => f.rarity === 'epic');
            
            alert(`${caughtFish.name}을(를) 낚았다!`);
            player.inventory.push(caughtFish.name);
            savePlayerData();
        } else {
            alert('물고기를 놓쳤다...');
        }
    }

    function openHiddenShop() {
        const hiddenItemListEl = document.getElementById('hidden-item-list');
        const playerInventoryHiddenEl = document.getElementById('player-inventory-hidden');
        hiddenShopWindow.classList.remove('hidden');
        hiddenItemListEl.innerHTML = '';
        hiddenShopItems.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.name} (+${item.power})</span><span>${item.price} G</span><button>구매</button>`;
            const button = li.querySelector('button');
            
            let canBuy = false;
            if (player.job !== '없음') {
                if (item.exclusive) canBuy = player.job === item.exclusive;
                else {
                    switch (item.type) {
                        case 'sword': canBuy = ['전사', '마검사'].includes(player.job); break;
                        case 'wand':  canBuy = ['마법사', '마검사', '아이스'].includes(player.job); break;
                        case 'gun':   canBuy = ['건슬링어'].includes(player.job); break;
                        case 'bow':   canBuy = ['궁수'].includes(player.job); break;
                        case 'katana':canBuy = ['검사'].includes(player.job); break;
                    }
                }
            }
            if (!canBuy) { button.disabled = true; li.style.color = '#888'; }

            button.addEventListener('click', () => buyItem(item, true));
            hiddenItemListEl.appendChild(li);
        });
        playerInventoryHiddenEl.textContent = player.inventory.join(', ') || '없음';
    }

    function buyItem(item, isHidden = false) {
        if (player.gold >= item.price) {
            player.gold -= item.price;
            player.inventory.push(item.name);
            if (isHidden) {
                 document.getElementById('player-inventory-hidden').textContent = player.inventory.join(', ') || '없음';
            }
            updateUI();
            if (item.type !== 'potion' && item.type !== 'mana-potion') alert(`${item.name}을(를) 구매했습니다!`);
            savePlayerData();
        } else {
            alert('골드가 부족합니다!');
        }
    }

    function spawnHiddenNpc() {
        const pos = hiddenNpcSpawnPoints[Math.floor(Math.random() * hiddenNpcSpawnPoints.length)];
        const npcEl = document.createElement('div');
        npcEl.className = 'hidden-job-master';
        npcEl.style.position = 'absolute';
        
        const nameTag = document.createElement('div');
        nameTag.className = 'npc-name-tag';
        nameTag.textContent = dialogueData.hiddenJobMaster.name;
        npcEl.appendChild(nameTag);

        hiddenJobMaster = { element: npcEl, type: 'hiddenJobMaster', x: pos.x, y: pos.y };
        
        npcEl.style.left = `${pos.x}px`;
        npcEl.style.top = `${pos.y}px`;
        backgroundLayer.appendChild(npcEl);

        setTimeout(despawnHiddenNpc, 60000);
    }

    function despawnHiddenNpc() {
        if (hiddenJobMaster && hiddenJobMaster.element) {
            hiddenJobMaster.element.remove();
        }
        hiddenJobMaster = null;
    }

    function trySpawnHiddenNpc() {
        if (hiddenJobMaster) return;
        if (Math.random() < 0.3) spawnHiddenNpc();
    }

    function createAquariumMap() {
        const mapWidth = 1000;
        const mapHeight = 800;
        const wallThickness = 20;

        // Walls
        const walls = [
            { x: 0, y: 0, width: mapWidth, height: wallThickness }, // Top
            { x: 0, y: mapHeight - wallThickness, width: mapWidth, height: wallThickness }, // Bottom
            { x: 0, y: 0, width: wallThickness, height: mapHeight }, // Left
            { x: mapWidth - wallThickness, y: 0, width: wallThickness, height: mapHeight } // Right
        ];

        walls.forEach(w => {
            const wallEl = document.createElement('div');
            wallEl.className = 'aquarium-wall';
            wallEl.style.left = `${w.x}px`;
            wallEl.style.top = `${w.y}px`;
            wallEl.style.width = `${w.width}px`;
            wallEl.style.height = `${w.height}px`;
            aquariumLayer.appendChild(wallEl);
            aquariumObstacles.push(wallEl);
        });

        // Fish Tanks
        const tankPositions = [
            { x: 100, y: 100 }, { x: 300, y: 100 }, { x: 500, y: 100 }, { x: 700, y: 100 },
            { x: 100, y: 550 }, { x: 300, y: 550 }, { x: 500, y: 550 }, { x: 700, y: 550 },
        ];

        tankPositions.forEach((pos, index) => {
            const tankEl = document.createElement('div');
            tankEl.className = 'fish-tank-object';
            tankEl.style.left = `${pos.x}px`;
            tankEl.style.top = `${pos.y}px`;
            tankEl.style.width = '150px';
            tankEl.style.height = '150px';
            aquariumLayer.appendChild(tankEl);
            fishTanks.push({ element: tankEl, index: index }); // 수조 정보를 배열에 저장
        });

        // Exit
        aquariumExit = document.createElement('div');
        aquariumExit.className = 'aquarium-exit';
        aquariumExit.style.left = `${mapWidth / 2 - 50}px`;
        aquariumExit.style.top = `${wallThickness + 10}px`; // 위쪽 벽 근처로 이동
        aquariumExit.style.width = '100px';
        aquariumExit.style.height = '30px';
        const exitText = document.createElement('p');
        exitText.textContent = '나가기';
        aquariumExit.appendChild(exitText);
        aquariumLayer.appendChild(aquariumExit);
    }

    function enterAquarium() {
        hideDialogue();
        currentMap = 'aquarium';

        // 현재 위치 저장
        overworldPosition = { x: player.x, y: player.y };

        // 맵 전환
        backgroundLayer.classList.add('hidden');
        backgroundLayer.style.transform = ''; // 이전 맵 위치 초기화
        aquariumLayer.classList.remove('hidden');
        aquariumLayer.appendChild(player.element); // 플레이어를 수족관 레이어로 이동

        // 수족관 입구 위치로 플레이어 이동
        player.x = 500;
        player.y = 700;

        // 플레이어와 카메라 위치 즉시 업데이트
        player.element.style.left = `${player.x}px`;
        player.element.style.top = `${player.y}px`;
    }

    function exitAquarium() {
        currentMap = 'overworld';
        player.justExited = true;

        // 맵 전환
        aquariumLayer.classList.add('hidden');
        aquariumLayer.style.transform = ''; // 이전 맵 위치 초기화
        backgroundLayer.classList.remove('hidden');
        backgroundLayer.appendChild(player.element); // 플레이어를 월드 레이어로 이동

        // 저장된 위치로 복귀
        player.x = overworldPosition.x;
        player.y = overworldPosition.y;
        
        // 플레이어와 카메라 위치 즉시 업데이트
        player.element.style.left = `${player.x}px`;
        player.element.style.top = `${player.y}px`;

        // 맵 전환 시 원치 않는 움직임을 막기 위해 키 입력 상태를 초기화합니다.
        for (const key in keysPressed) {
            keysPressed[key] = false;
        }
    }

    function openTankUI(tankIndex) {
        currentTankIndex = tankIndex;
        player.isConversing = true; // UI가 열려있는 동안 움직임 방지
        updateTankUI();
        tankUI.classList.remove('hidden');
    }

    function closeTankUI() {
        currentTankIndex = -1;
        player.isConversing = false;
        tankUI.classList.add('hidden');
    }

    function updateTankUI() {
        if (currentTankIndex === -1) return;

        const tankData = player.aquariumTanks[currentTankIndex];
        tankStatusEl.innerHTML = '';
        tankInventoryListEl.innerHTML = '';

        // 수조 상태 표시
        if (tankData && tankData.fish) {
            const fishInfo = fishData.find(f => f.name === tankData.fish);
            tankStatusEl.innerHTML = `<p>${fishInfo.emoji} ${fishInfo.name}이(가) 있습니다.</p>`;
            const takeOutButton = document.createElement('button');
            takeOutButton.textContent = '꺼내기';
            takeOutButton.onclick = () => {
                player.inventory.push(tankData.fish);
                player.aquariumTanks[currentTankIndex] = { fish: null };
                updateTankVisual(currentTankIndex);
                updateTankUI();
                savePlayerData();
            };
            tankStatusEl.appendChild(takeOutButton);
        } else {
            tankStatusEl.innerHTML = '<p>이 수조는 비어있습니다.</p>';
        }

        // 인벤토리의 물고기 목록 표시
        const inventoryFish = player.inventory.filter(itemName => fishData.some(f => f.name === itemName));
        if (inventoryFish.length > 0) {
            inventoryFish.forEach(fishName => {
                const fishInfo = fishData.find(f => f.name === fishName);
                const li = document.createElement('div');
                li.innerHTML = `<span>${fishInfo.emoji} ${fishInfo.name}</span>`;
                const displayButton = document.createElement('button');
                displayButton.textContent = '전시하기';
                // 현재 수조가 비어있을 때만 전시 가능
                if (tankData && !tankData.fish) {
                    displayButton.onclick = () => {
                        const itemIndex = player.inventory.indexOf(fishName);
                        player.inventory.splice(itemIndex, 1);
                        player.aquariumTanks[currentTankIndex] = { fish: fishName };
                        updateTankVisual(currentTankIndex);
                        updateTankUI();
                        savePlayerData();
                    };
                } else {
                    displayButton.disabled = true;
                }
                li.appendChild(displayButton);
                tankInventoryListEl.appendChild(li);
            });
        } else {
            tankInventoryListEl.innerHTML = '<div>가진 물고기가 없습니다.</div>';
        }
    }

    function updateTankVisual(tankIndex) {
        const tank = fishTanks[tankIndex];
        const tankData = player.aquariumTanks[tankIndex];
        tank.element.innerHTML = ''; // 기존 내용 삭제

        if (tankData && tankData.fish) {
            const fishInfo = fishData.find(f => f.name === tankData.fish);
            const fishEmoji = document.createElement('div');
            fishEmoji.style.fontSize = '3rem';
            fishEmoji.style.animation = 'tank-swim 8s infinite ease-in-out';
            fishEmoji.textContent = fishInfo.emoji;
            tank.element.style.display = 'flex';
            tank.element.style.justifyContent = 'center';
            tank.element.style.alignItems = 'center';
            tank.element.appendChild(fishEmoji);
        }
    }

    function updateAllTankVisuals() {
        for (let i = 0; i < fishTanks.length; i++) {
            updateTankVisual(i);
        }
    }

    createWorld();
    createAquariumMap();
    loadPlayerData();
    updateUI();
    gameLoop();
    setInterval(trySpawnHiddenNpc, 30000);
}