let currentTurn = "Player";
let currentIter = 0;   // кількість напівходів гравця
let currentDirection = 'horizontal';
let difficulty;  // встановити складність гри

displayBoard();


document.getElementById("directStr").innerHTML = "Напрямок розташування: " + currentDirection;

// встановити складність гри
if (localStorage.getItem('difficulty') === 'null') {
   difficulty = 'medium';
} else {
    difficulty = localStorage.getItem('difficulty');
}
document.getElementById("levelStr").innerHTML = "Рівень складності: " + difficulty;
//difficulty check
let firstCheck;
firstCheck = (difficulty === 'easy') ? 2 : (difficulty === 'medium') ? 7 : 11;

let board = [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0]
];

let scores = {
    "Player": -1,               // Min
    "Indefinite": 0,
    "Opponent": 1               // Max
};

function displayBoard() {
    let divSquare = '<div class="square" id="$coordinates" onmouseover="squareHover(id)" onmouseout="squareOut(id)" onclick="humanMove(id)">' +
        '<div class="square-bg"></div>' +
        '</div>';
    for (let i = 0; i<6; i++) {
        for (let j=0; j<6; j++){
            let coords = i + '-' + j;
            // заповнити дошку клітинками з id = coords (X-Y)
            document.querySelector('.board')
                .insertAdjacentHTML('beforeend', divSquare.replace('$coordinates', coords));
        }
    }
}

// якщо гра закінчилась, поточний гравець - реальний ПЕРЕМОЖЕЦЬ, якщо ні - null
function getWinner() {
    let possibleActions = getPossibleActions();
    if (possibleActions == false) {
        return currentTurn;
    }
    return null;					// гра не закінчилась
}

// якщо альфа-бета алг-м досяг дна (термінального стану) - поточний гравець (потенцінйий переможець), від якого можна розрахувати score,
// якщо не досяг - null
function getPossibleWinner() {
    let possibleActions = getPossibleActions();
    if (possibleActions == false) {
        return currentTurn;
    }
    return null;					// гра не закінчилась
}

// mix
function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
}

// список доступних блоків
function getPossibleActions() {
    let possibleActions = [];
    let available = 0;

    // перевірка horizontal
    for (let i = 0; i < 6; i++) {       // rows
        for (let j = 0; j < 5; j++) {   // cols
            if ((board[i][j] == 0) && (board[i][j + 1] == 0)) {
                let direct = 'horizontal';
                possibleActions.push({i, j, direct});
                available++;
            }
        }
    }

    // перевірка vertical
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 6; j++) {
            if ((board[i][j] == 0) && (board[i + 1][j] == 0)) {
                let direct = 'vertical';
                possibleActions.push({i, j, direct});
                available++;
            }
        }
    }

    if (available === 0) {
        return false;               // для getWinner() - гра закінчилась, повернути переможця
    }

    if (currentIter < 5) {  // перемішати для того, щоб хід АІ був несподіваним для гравця
        shuffle(possibleActions);
    }
    return possibleActions;
}


// Гравець встановлює доміношку (руцями)
function humanMove(id) {
    currentIter++;
    // отримати координати з id 1-ї клітинки
    let new_X = Number(id.slice(2, 3));    // id = X-Y     id.slice(2,3) поверене елементи з 2 по 3(викл) тобто 2-й - Х
    let new_Y = Number(id.slice(0, 1));

    // розрахувати координати 2-ї доданої клітинки
    let new_X2 = 0;
    let new_Y2 = 0;
    if (currentDirection === 'vertical') {
        // для вертикальної - знизу від заданої
        new_X2 = new_X;
        new_Y2 = new_Y + 1;
        if (new_Y2 == 6) {
            new_Y2 = 4;
        }
        // для горизонтальної - справа від заданої
    } else {
        new_X2 = new_X + 1;
        new_Y2 = new_Y;
        if (new_X2 == 6) {
            new_X2 = 4;
        }
    }

    // перевірити чи не зайняте місце
    if (board[new_Y][new_X] === 1 || board[new_Y][new_X] === 2 || board[new_Y2][new_X2] === 1 || board[new_Y2][new_X2] === 2) {
        alert('Цей блок уже зайнятий!');
        return;
    } else {
        board[new_Y][new_X] = 1;                 // одиничкою кодуємо доміношку гравця
        board[new_Y2][new_X2] = 1;

        // замальовуємо зеленим кольором доміношку гравця
        document.getElementById(id).style.backgroundColor = "green";
        document.getElementById((new_Y2) + "-" + (new_X2)).style.backgroundColor = "green";
    }

    let winner = getWinner();
    if (winner === null) {
        currentTurn = "Opponent";
        opponentMove();
    } else {
        finishGame(winner);
    }
}

// опонент встановлює доміношку (АІ)
function opponentMove() {
    let depth = difficulty;
    if (currentIter < 5) {
        depth = 3;
    }

    let bestScore = -Infinity;
    let move;

    let possibleActions = getPossibleActions();

    if (possibleActions !== false) {
        // в циклі знаходимо в possibleActions найкращий стан для переходу (на одному рівні)
        for (let i = 0; i < possibleActions.length; i++) {
            const action = possibleActions[i];
            let alpha = -Infinity;
            let beta = Infinity;

            board[action.i][action.j] = 2;                  // тимчасово позначити доміношку - хід АІ
            if (action.direct === 'horizontal') {          // 2 - код АІ
                board[action.i][action.j + 1] = 2;        // горизонтальн - друга права клітинка
            } else {
                board[action.i + 1][action.j] = 2;        // вертикальн - друга нижня клітинка
            }

            let score = alphaBetaPruning(board, depth, false, alpha, beta); // min - Гравець

            board[action.i][action.j] = 0;                // відновити місце, де тимчасово розміщали доміношку, для розрахунку нової
            if (action.direct === 'horizontal') {
                board[action.i][action.j + 1] = 0;
            } else {
                board[action.i + 1][action.j] = 0;
            }

            if (score > bestScore) {            // запам'ятали найкращий хід - позицію доміношки
                bestScore = score;
                let i = action.i;
                let j = action.j;
                let direct = action.direct;
                move = {i, j, direct};         // найкращий стан для комп опонента

                // для цієї гри можна було б оптимізувати час обчислень - if (score == 1) {break;}
                // але при цому не буде в повному обсязі задіяний алгоритм альфа-бета відсікання
            }
        }

        // задіяти найкращий хід
        if (move.direct === 'horizontal') {
            board[move.i][move.j] = 2;       // позначаємо клітинки відзнакою опонента (2)
            board[move.i][move.j + 1] = 2;
            // позначаємо кольором елементи на дошці
            document.getElementById((move.i) + "-" + (move.j)).style.backgroundColor = "red";
            document.getElementById((move.i) + "-" + (move.j + 1)).style.backgroundColor = "red";
        } else {                              // вертикально
            board[move.i][move.j] = 2;
            board[move.i + 1][move.j] = 2;
            document.getElementById((move.i) + "-" + (move.j)).style.backgroundColor = "red";
            document.getElementById((move.i + 1) + "-" + (move.j)).style.backgroundColor = "red";
        }
        let winner = getWinner();
        if (winner !== null) {				// гра закінчилась
            finishGame(winner)
        }
        currentTurn = "Player";     // якщо продовжуємо - передаємо хід гравцю
    }
}

function setElementDouble(area, i, j, direction, value) {       // визначити доміношку
    area[i][j] = value;
    if (direction === 'horizontal') {
        area[i][j + 1] = value;
    } else {
        area[i + 1][j] = value;
    }
}

function alphaBetaPruning(area, depth, isMaximizing, alpha, beta) {
    let possibleWinner = getPossibleWinner();
    if (possibleWinner !== null) {      // альфа-бета досягла дна (термінальний стан)
        return scores[possibleWinner];  // 1 або -1
    } else if (depth === 0) {
        return scores["Indefinite"];            // якщо дна не досягли, але встановлена глибина закінчилася
    }

    if (isMaximizing) {                              // max - Опонент (АІ)
        let bestValue = -Infinity;
        let possibleActions = getPossibleActions();
        if (possibleActions !== false) {
            for (let i = 0; i < possibleActions.length; i++) {
                const element = possibleActions[i];
                setElementDouble(area, element.i, element.j, element.direct, 2);
                let score = alphaBetaPruning(area, depth - 1, false, alpha, beta);   // min
                setElementDouble(area, element.i, element.j, element.direct, 0);
                bestValue = Math.max(bestValue, score);
                alpha = Math.max(alpha, bestValue);
                if (beta <= alpha) {                // можна припинити пошук, на піддереві від МАКС вершини, де alpha >=beta усіх її батьківських МІН вершин
                    break;
                }
            }
            console.log(currentTurn + ": " + bestValue);
            currentTurn = "Opponent";               // передати хід
            return bestValue;
        }
    } else {                                                // min (гравець)
        let bestValue = Infinity;
        let possibleActions = getPossibleActions();
        if (possibleActions !== false) {                        // якщо є місця для доміношки
            for (let i = 0; i < possibleActions.length; i++) {
                const possibleAction = possibleActions[i];
                setElementDouble(area, possibleAction.i, possibleAction.j, possibleAction.direct, 1);   // встановити доміношку гравця (1)
                let score = alphaBetaPruning(area, depth - 1, true, alpha, beta);    // запускаємо для max (гравця) з depth-1
                setElementDouble(area, possibleAction.i, possibleAction.j, possibleAction.direct, 0);   // відновити для наступного тестування на тому ж рівні
                bestValue = Math.min(bestValue, score);
                beta = Math.min(beta, bestValue);
                if (beta <= alpha) {                    // можна припинити пошук, на піддереві  від МІН вершини, де beta <= alpha усіх її батьківських МАКС вершин
                    break;
                }
            }
            console.log(currentTurn + ": " + bestValue);
            currentTurn = "Player";                             // передати хід
            return bestValue;
        }
    }
}

function changeLevel() {
    let lev = document.getElementById('level').value;
    if (lev !== localStorage.getItem('difficulty')) {
        let conf = confirm('Це перезавантажить гру. Продовжити?');
        if (conf) {
            if (lev === 'medium') {
                difficulty = 'medium';
            } else if (lev === 'hard') {
                difficulty = 'hard';
            } else {
                difficulty = 'easy';
            }
            localStorage.setItem('difficulty', difficulty);
            document.location.reload();
        }
    }
}

function pickVertical() {
    currentDirection = 'vertical';
    document.getElementById("directStr").innerHTML = "Напрямок розташування: " + currentDirection;
}

function pickHorizontal() {
    currentDirection = 'horizontal';
    document.getElementById("directStr").innerHTML = "Напрямок розташування: " + currentDirection;
}


function finishGame(winner) {
    let result = null;
    let gameRes = document.getElementById('game-result');
    if (winner === "Opponent") {
        result = "Перемога комп'ютерного розуму!";
        gameRes.style.color = 'red';
    } else {
        gameRes.style.color = 'green';
        result = "Ви перемогли!";
    }
    gameRes.innerHTML = result;
    document.getElementById('endgame').style.display = 'block';
}

// показати доміношку на дошці до встановлення (тінь)
function visualBorder(id, direct, inout) {
    let square = document.getElementById(id).querySelector(".square-bg");

    if (direct === 'vertical') {
        let new_idX = Number(id.slice(2, 3));
        let new_idY = Number(id.slice(0, 1)) + 1;
        if (new_idY == 6) {
            new_idY = 4;
        }
        if (inout == 'in') {
            square.style.display = "block";
            document.getElementById(new_idY + "-" + new_idX).querySelector(".square-bg").style.display = "block";
        } else {
            square.style.display = "none";
            document.getElementById(new_idY + "-" + new_idX).querySelector(".square-bg").style.display = "none";
        }
    } else {
        let new_idX = Number(id.slice(2, 3)) + 1;
        let new_idY = Number(id.slice(0, 1));
        if (new_idX == 6) {
            new_idX = 4;
        }
        if (inout == 'in') {
            square.style.display = "block";
            document.getElementById(new_idY + "-" + new_idX).querySelector(".square-bg").style.display = "block";
        } else {
            square.style.display = "none";
            document.getElementById(new_idY + "-" + new_idX).querySelector(".square-bg").style.display = "none";
        }
    }
}

// навели на клітинку
function squareHover(id) {
    visualBorder(id, currentDirection, 'in');
}

// вийшли з клітинки
function squareOut(id) {
    visualBorder(id, currentDirection, 'out');
}


