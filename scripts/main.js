$(function () {
  let rows, cols, mines;
  let board = [];
  let timerInterval;
  let time = 0;
  let revealedCells = 0;
  let gameOverFlag = false;

  const difficultySettings = {
    easy: { rows: 8, cols: 8, mines: 10 },
    medium: { rows: 12, cols: 12, mines: 20 },
    hard: { rows: 16, cols: 16, mines: 40 },
    expert: { rows: 20, cols: 20, mines: 80 },
  };

  // Abrir/cerrar opciones con fadeToggle
  $(".custom-select .selected").on("click", function (e) {
    e.stopPropagation();
    $(this)
      .closest(".custom-select")
      .find(".options")
      .stop(true, true)
      .slideToggle(300);
  });

  // Seleccionar opción
  $(".custom-select .option").on("click", function () {
    let value = $(this).data("value");
    let text = $(this).text();
    const $custom = $(this).closest(".custom-select");

    $custom.attr("data-selected", value);
    $custom.find(".selected").text(text);
    $custom.find(".options").stop(true, true).slideUp(300);

    $(".difficulty-select").val(value).trigger("change");
  });

  // Cerrar al hacer click fuera
  $(document).on("click", function (e) {
    if (!$(e.target).closest(".custom-select").length) {
      $(".custom-select .options").stop(true, true).slideUp(300);
    }
  });

  $(".difficulty-select").on("change", function () {
    initGame();
  });

  $(".restart-btn").on("click", function () {
    initGame();
  });

  function initGame() {
    clearInterval(timerInterval);
    time = 0;
    $(".timer").text(time);
    revealedCells = 0;
    gameOverFlag = false;

    let difficulty = $(".difficulty-select").val();
    rows = difficultySettings[difficulty].rows;
    cols = difficultySettings[difficulty].cols;
    mines = difficultySettings[difficulty].mines;

    $(".mines-count").text(mines);

    let boardMaxWidth = Math.min(window.innerWidth - 40, 600);
    let cellSize = Math.floor(boardMaxWidth / cols) - 2;

    $(".board")
      .empty()
      .css({
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
      });

    board = [];
    for (let y = 0; y < rows; y++) {
      board[y] = [];
      for (let x = 0; x < cols; x++) {
        board[y][x] = {
          mine: false,
          revealed: false,
          flagged: false,
          count: 0,
        };
        $(".board").append(
          `<div class="cell" data-x="${x}" data-y="${y}"></div>`
        );
      }
    }

    placeMines();
    calculateNumbers();
    startTimer();
  }

  function placeMines() {
    let placed = 0;
    while (placed < mines) {
      let x = Math.floor(Math.random() * cols);
      let y = Math.floor(Math.random() * rows);
      if (!board[y][x].mine) {
        board[y][x].mine = true;

       //$(`.cell[data-x=${x}][data-y=${y}]`).addClass("bomb");

        placed++;
      }
    }
  }

  function calculateNumbers() {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (board[y][x].mine) continue;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            let ny = y + dy,
              nx = x + dx;
            if (
              ny >= 0 &&
              ny < rows &&
              nx >= 0 &&
              nx < cols &&
              board[ny][nx].mine
            ) {
              count++;
            }
          }
        }
        board[y][x].count = count;
      }
    }
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      time++;
      $(".timer").text(time);
    }, 1000);
  }

  function revealCell(x, y) {
    if (gameOverFlag) return;
    let cell = board[y][x];
    if (cell.revealed || cell.flagged) return;

    cell.revealed = true;
    revealedCells++;

    let $cell = $(`.cell[data-x=${x}][data-y=${y}]`);
    $cell.addClass("revealed");

    if (cell.mine) {
      $cell.addClass("mine").text("💣");
      gameOver(false);
      return;
    }

    if (cell.count > 0) {
      $cell.text(cell.count);
      $cell.addClass(`num-${cell.count}`);
    } else {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          let ny = y + dy,
            nx = x + dx;
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
            revealCell(nx, ny);
          }
        }
      }
    }

    checkWin();
  }

  $(".board").on("contextmenu", ".cell", function (e) {
    e.preventDefault();
    if (gameOverFlag) return;

    let x = +$(this).data("x");
    let y = +$(this).data("y");
    let cell = board[y][x];
    if (cell.revealed) return;

    cell.flagged = !cell.flagged;
    if (cell.flagged) {
      $(this).addClass("flagged").text("🚩");
    } else {
      $(this).removeClass("flagged").text("");
    }
  });

  $(".board").on("click", ".cell", function () {
    if (gameOverFlag) return;

    let x = +$(this).data("x");
    let y = +$(this).data("y");

    revealCell(x, y);
  });

  function gameOver(win) {
    gameOverFlag = true;
    clearInterval(timerInterval);

    if (!win) {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (board[y][x].mine && !board[y][x].revealed) {
            let $cell = $(`.cell[data-x=${x}][data-y=${y}]`);
            $cell.addClass("mine").text("💣");
          }
        }
      }
    }
  }

  function checkWin() {
    if (revealedCells === rows * cols - mines) {
      // Mostrar las minas que quedaron
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (board[y][x].mine && !board[y][x].revealed) {
            let $cell = $(`.cell[data-x=${x}][data-y=${y}]`);
            $cell.addClass("mine").text("💣");
          }
        }
      }

      gameOver(true);
    }
  }

  $(window).on("resize", function () {
    initGame();
  });

  let initialValue = $(".difficulty-select").val();
  let initialText = $(
    `.difficulty-select option[value="${initialValue}"]`
  ).text();
  $(".custom-select").attr("data-selected", initialValue);
  $(".custom-select .selected").text(initialText);
  initGame();
});
