import Board from 'board.js'

/*********************************************************************
 *                            BoardView                              *
 *********************************************************************/

export default function BoardView(canvas, board, theme) {
  this.canvas = canvas;
  this.theme = theme;
  this.ctx = canvas.getContext('2d');
  this.cursorStyle = 'default';
  this.boardWidth = canvas.getAttribute('width');
  this.boardHeight = canvas.getAttribute('height');
  this.squareWidth = this.boardWidth / 8;
  this.squareHeight = this.boardHeight / 8;
  this.boardPrimaryColor = theme.primaryColor || '#FFFFFF'; // light square color
  this.boardSecondaryColor = theme.secondaryColor || '#CD853F';
  this.board = board;
  this.loop = this.loop.bind(this);
  this.heldPiece = null;
  this.heldPiecePos = {x: 0, y: 0};
}

/*********************************************************************
 *                    BoardView instance methods                     *
 *********************************************************************/

BoardView.prototype.draw = function () {
  var squareWidth = this.squareWidth;
  var squareHeight = this.squareHeight;
  var ctx = this.ctx;
  var theme = this.theme;
  var pieceList = this.board.pieceList;
  var curPiece, curSprite, activeSprite;

  // Draw primary squares
  ctx.fillStyle = this.boardSecondaryColor;
  ctx.fillRect(0, 0, this.boardWidth, this.boardWidth);

  // Draw secondary squares
  ctx.fillStyle = this.boardPrimaryColor;
  for (var y = 0; y < 8; y++) {
    for (var x = y & 1; x < 8; x += 2) {
      ctx.fillRect(x * squareWidth, y * squareHeight, squareWidth, squareHeight);
    }
  }

  // Draw pieces
  for (var pieceCode in pieceList) {
    curPiece = pieceList[pieceCode];
    curSprite = theme[Board.CODES[pieceCode]];
    for (var i = 0; i < curPiece.length; i++) {
      if (curPiece[i] === this.heldPiece) {
        activeSprite = curSprite;
      } else {
        ctx.drawImage(
          theme.sprite,
          curSprite.x,
          curSprite.y,
          theme.pieceSize,
          theme.pieceSize,
          Board.file(curPiece[i]) * squareWidth,
          (7 - Board.rank(curPiece[i]))* squareHeight,
          squareWidth,
          squareHeight
        );
      }
    }
  }

  if (this.heldPiece != null) {
    ctx.drawImage(
      theme.sprite,
      activeSprite.x,
      activeSprite.y,
      theme.pieceSize,
      theme.pieceSize,
      this.heldPiecePos.x - .5 * squareWidth,
      this.heldPiecePos.y - .5 * squareHeight,
      squareWidth,
      squareHeight
    );
  }
};

BoardView.prototype.init = function () {
  window.requestAnimationFrame(this.loop);
};

BoardView.prototype.loop = function () {
  this.draw();
  window.requestAnimationFrame(this.loop);
};

BoardView.prototype.calcPointer = function (mx, my) {
  var rect = this.canvas.getBoundingClientRect();
  var x = mx - rect.left;
  var y = my - rect.top;
  var sqheight = rect.height / 8;
  var sqwidth = rect.width / 8;
  return {
    x: x,
    y: y,
    rank: 7 - Math.floor(y / sqheight),
    file: Math.floor(x / sqwidth)
  };
};

BoardView.prototype.setCursorStyle = function (style) {
  this.canvas.classList.remove('board-cursor-' + this.cursorStyle);
  this.cursorStyle = style;
  this.canvas.classList.add('board-cursor-' + style);
};

BoardView.prototype.setHeldPiece = function (fromSquare, pointer) {
  this.heldPiece = fromSquare;

  if (fromSquare == null) {
    return;
  }

  this.heldPiecePos.x = pointer.x;
  this.heldPiecePos.y = pointer.y;
}
