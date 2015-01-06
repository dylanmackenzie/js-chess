import Board from 'board.js'

/*********************************************************************
 *                            BoardView                              *
 *********************************************************************/

export default function BoardView(canvas, board, theme) {
  this.canvas = canvas;
  this.theme = theme;
  this.ctx = canvas.getContext('2d');
  this.boardWidth = canvas.getAttribute('width');
  this.boardHeight = canvas.getAttribute('height');
  this.squareWidth = this.boardWidth / 8;
  this.squareHeight = this.boardHeight / 8;
  this.boardPrimaryColor = theme.primaryColor || '#FFFFFF'; // light square color
  this.boardSecondaryColor = theme.secondaryColor || '#CD853F';
  this.board = board;
  this.loop = this.loop.bind(this);
}

/*********************************************************************
 *                    BoardView instance methods                     *
 *********************************************************************/

BoardView.prototype.draw = function () {
  var squareWidth = this.squareWidth;
  var squareHeight = this.squareHeight;
  var ctx = this.ctx;
  var theme = this.theme;
  var curPiece, curSprite;
  var pieceList = this.board.pieceList;

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
};

BoardView.prototype.init = function () {
  window.requestAnimationFrame(this.loop);
};

BoardView.prototype.loop = function () {
  this.draw();
  window.requestAnimationFrame(this.loop);
};
