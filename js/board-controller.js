import Board from './board.js';

export default function BoardController(board, view) {
  var canvas = view.canvas;
  this.view = view;
  this.board = board;

  this.heldPiece = null;

  canvas.addEventListener('mousemove', this.pointerMove.bind(this));
  canvas.addEventListener('mousedown', this.pointerDown.bind(this));
  canvas.addEventListener('mouseup', this.pointerUp.bind(this));
}

BoardController.prototype.pointerMove = function (e) {
  var pointer = this.view.calcPointer(e.clientX, e.clientY);

  if (this.heldPiece == null) {
    if (this.board.squareOccupied(pointer.rank, pointer.file)) {
      this.view.setCursorStyle('grab');
    } else {
      this.view.setCursorStyle('default');
    }
  } else {
    this.view.setHeldPiece(this.heldPiece, pointer);
  }
};

BoardController.prototype.pointerDown = function (e) {
  var pointer = this.view.calcPointer(e.clientX, e.clientY);

  if (this.board.squareOccupied(pointer.rank, pointer.file)) {
    this.view.setCursorStyle('grabbing');
    this.heldPiece = Board.sq(pointer.rank, pointer.file);
    this.view.setHeldPiece(this.heldPiece, pointer);
  }
};

BoardController.prototype.pointerUp = function (e) {
  var pointer = this.view.calcPointer(e.clientX, e.clientY);

  if (this.heldPiece != null) {
    try {
      this.board.move({from: this.heldPiece, to: Board.sq(pointer.rank, pointer.file)});
    } catch (e) {
      if (e.name === 'IllegalMoveException'){
        console.log('Illegal Move');
      } else {
        throw e;
      }
    }
    this.heldPiece = null;
    this.view.setHeldPiece(null);
  } else {
    this.view.setHeldPiece(null);
  }

  this.pointerMove(e.clientX, e.clientY);
};
