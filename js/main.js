import Board from 'board.js';
import BoardView from 'board-view.js';
import BoardController from 'board-controller.js';

window.onload = function () {
  var canvas = document.querySelector('canvas');
  var board = window.board = new Board();
  var sprite = document.querySelector('.sprite');
  var theme = {
    sprite: sprite,
    pieceSize: 45,
    K: { x: 0, y: 0 },
    Q: { x: 45, y: 0 },
    B: { x: 90, y: 0 },
    N: { x: 135, y: 0 },
    R: { x: 180, y: 0 },
    P: { x: 225, y: 0 },
    k: { x: 0, y: 45 },
    q: { x: 45, y: 45 },
    b: { x: 90, y: 45 },
    n: { x: 135, y: 45 },
    r: { x: 180, y: 45 },
    p: { x: 225, y: 45 }
  };
  window.view = new BoardView(canvas, board, theme);
  var ctrl = new BoardController(board, view);
  view.init();
};
