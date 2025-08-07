document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const introScreen = document.getElementById('intro-screen');
    const gameContainer = document.getElementById('game-container');

    startButton.addEventListener('click', () => {
        introScreen.style.opacity = '0';
        setTimeout(() => {
            introScreen.classList.add('hidden');
            gameContainer.classList.remove('hidden');
            // 게임 시작 로직 실행
            startGame();
        }, 1000);
    });
});

function startGame() {
    const backgroundLayer = document.getElementById('background-layer');

    // 월드 크기 및 중심 좌표
    const world = { width: 3000, height: 3000 };
    const villageCenter = { x: world.width / 2, y: world.height / 2 };

    // 배경 위치와 플레이어 속도 변수
    let backgroundX = 0;
    let backgroundY = 0;
    const playerSpeed = 5;

    // 현재 눌린 키를 추적하는 객체
    const keysPressed = {};

    // 장애물(집)과 NPC 정보를 담을 배열
    const obstacles = [];
    const npcs = [];

    // 잡초 생성 함수
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

    // 마을 생성 함수
    function generateVillage() {
        const housePositions = [
            { x: villageCenter.x - 350, y: villageCenter.y - 250 },
            { x: villageCenter.x + 150, y: villageCenter.y - 250 },
            { x: villageCenter.x - 350, y: villageCenter.y + 150 },
            { x: villageCenter.x + 150, y: villageCenter.y + 150 },
        ];

        const houseSize = { width: 180, height: 120 }; // 지붕 포함 대략적인 크기

        housePositions.forEach((pos, index) => {
            const house = document.createElement('div');
            house.className = 'house';
            
            const wall = document.createElement('div');
            wall.className = 'wall';
            
            const roof = document.createElement('div');
            roof.className = 'roof';

            const door = document.createElement('div');
            door.className = 'door';

            const window1 = document.createElement('div');
            window1.className = 'window';
            
            const window2 = document.createElement('div');
            window2.className = 'window right';

            wall.appendChild(door);
            wall.appendChild(window1);
            if (index % 2 === 0) {
                wall.appendChild(window2);
            }

            house.appendChild(roof);
            house.appendChild(wall);

            house.style.left = `${pos.x}px`;
            house.style.top = `${pos.y}px`;

            backgroundLayer.appendChild(house);
            
            // 장애물 정보 추가 (위치와 크기)
            obstacles.push({ x: pos.x, y: pos.y, width: houseSize.width, height: houseSize.height });
        });
    }

    // NPC 생성 함수
    function generateNPCs(count) {
        const npcSize = 30; // NPC 크기 (스타일과 맞춤)
        for (let i = 0; i < count; i++) {
            const npc = {
                element: document.createElement('div'),
                x: 0,
                y: 0,
                dx: 0, // x 방향
                dy: 0, // y 방향
                speed: 1 + Math.random(), // NPC마다 다른 속도
                moveTimer: 0, // 다음 움직임까지의 타이머
            };
            npc.element.className = 'npc';

            // NPC마다 랜덤 색상 지정 (너무 밝지 않게)
            const r = Math.floor(Math.random() * 200);
            const g = Math.floor(Math.random() * 200);
            const b = Math.floor(Math.random() * 200);
            npc.element.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

            // 장애물과 겹치지 않는 초기 위치 설정
            do {
                npc.x = villageCenter.x - 250 + Math.random() * 500;
                npc.y = villageCenter.y - 250 + Math.random() * 500;
            } while (isColliding({ x: npc.x, y: npc.y, width: npcSize, height: npcSize }));

            npc.element.style.left = `${npc.x}px`;
            npc.element.style.top = `${npc.y}px`;
            
            npcs.push(npc);
            backgroundLayer.appendChild(npc.element);
        }
    }

    // 충돌 감지 함수
    function isColliding(rect1) {
        for (const rect2 of obstacles) {
            if (rect1.x < rect2.x + rect2.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.y + rect1.height > rect2.y) {
                return true; // 충돌
            }
        }
        return false; // 충돌 안함
    }

    // NPC 움직임 업데이트 함수
    function updateNPCs() {
        const npcSize = 30;
        npcs.forEach(npc => {
            npc.moveTimer--;
            if (npc.moveTimer <= 0) {
                // 새로운 방향 랜덤 설정 (상하좌우 대각선 또는 정지)
                npc.dx = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
                npc.dy = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
                // 1~5초 동안 해당 방향으로 움직임
                npc.moveTimer = 60 + Math.random() * 240;
            }

            const nextX = npc.x + npc.dx * npc.speed;
            const nextY = npc.y + npc.dy * npc.speed;

            // 다음 위치가 장애물과 충돌하는지 확인
            if (!isColliding({ x: nextX, y: nextY, width: npcSize, height: npcSize })) {
                npc.x = nextX;
                npc.y = nextY;
                npc.element.style.left = `${npc.x}px`;
                npc.element.style.top = `${npc.y}px`;
            } else {
                // 충돌하면 즉시 방향 전환
                npc.moveTimer = 0;
            }
        });
    }

    // 월드 생성
    generateGrass(200);
    generateVillage();
    generateNPCs(5); // 5명의 NPC 생성

    document.addEventListener('keydown', (event) => {
        keysPressed[event.key.toLowerCase()] = true;
    });

    document.addEventListener('keyup', (event) => {
        keysPressed[event.key.toLowerCase()] = false;
    });

    // 게임 루프
    function gameLoop() {
        // 키 입력에 따른 배경 위치 변경
        if (keysPressed['w']) backgroundY += playerSpeed;
        if (keysPressed['s']) backgroundY -= playerSpeed;
        if (keysPressed['a']) backgroundX += playerSpeed;
        if (keysPressed['d']) backgroundX -= playerSpeed;

        // NPC 위치 업데이트
        updateNPCs();

        // 배경 레이어의 위치를 업데이트
        backgroundLayer.style.transform = `translate(${backgroundX}px, ${backgroundY}px)`;

        requestAnimationFrame(gameLoop);
    }

    // 게임 루프 시작
    gameLoop();
}

// 초기 배경 위치 설정
const backgroundLayer = document.getElementById('background-layer');
backgroundLayer.style.transform = 'translate(0, 0)';
