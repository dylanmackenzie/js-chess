import Board from 'board.js'
var _ = require('lodash');
var assert = require('chai').assert;
var util = require('util');
var pgn = Board.pgntox88;

assert.containsMove = function (moves, to) {
  if (!util.isArray(to)) {
    to = [ to ];
  }

  for (var i = 0, len = to.length; i < len; i++) {
    assert.include(_.pluck(moves, 'to'), pgn(to[i]));
  }
};

assert.notContainsMove = function (moves, to) {
  if (!util.isArray(to)) {
    to = [ to ];
  }

  for (var i = 0, len = to.length; i < len; i++) {
    assert.notInclude(_.pluck(moves, 'to'), pgn(to[i]));
  }
};

describe('Board', function () {
  describe('Board()', function () {
    it('should return a starting board by default', function () {
      assert.ok(new Board());
    });
    it('should initialize a board with a valid FEN string', function () {
      assert.ok(new Board('8/4p2P/2p2N2/8/4pP2/p1r4P/1P6/8 w e6 - 1 2'));
    });
  });

  describe('.pgntox88()', function () {
    it('should return a 0x88 representation of a string', function () {
      assert.equal(Board.pgntox88('a1'), 0x0);
      assert.equal(Board.pgntox88('a8'), 0x70);
      assert.equal(Board.pgntox88('h8'), 0x77);
      assert.equal(Board.pgntox88('h1'), 0x07);
      assert.equal(Board.pgntox88('c5'), 0x42);
    });
  });

  describe('.sq()', function () {
    it('should convert a rank and file to a 0x88 square', function () {
      assert.equal(Board.sq(1, 1), 0x11);
    });
  });

  describe('.isWhite()', function () {
    it('should detect if a piece is white', function () {
      assert.ok(Board.isWhite(Board.PIECES.K));
      assert.notOk(Board.isWhite(Board.PIECES.n));
    });
  });

  describe('#generatePawnMoves()', function () {
    var board, b2, e7;
    before(function () {
      board = new Board('8/4p2P/2p2N2/8/4pP2/p1r4P/1P6/8 w - e3 3 6');
      console.log(board.toString());
      b2= board.generatePawnMoves(pgn('b2'));
      e7= board.generatePawnMoves(pgn('e7'));
    });
    it('should move a pawn forward one space', function () {
      assert.containsMove(b2, 'b3');
      assert.containsMove(e7, 'e6');
    });
    it('should move a pawn forward two spaces', function () {
      assert.containsMove(b2, 'b4');
      assert.containsMove(e7, 'e5');
    });
    it('should capture pieces', function () {
      assert.containsMove(b2, 'c3');
      assert.containsMove(e7, 'f6');

    });
    it.skip('should capture en passant', function () {

    });
  });

  describe('#generateKnightMoves', function () {
    var board, d8, e1;
    before(function () {
      board = new Board('3n4/8/8/8/8/3N4/2b3q1/4N3 w - - 3 6');
      console.log(board.toString());
      d8 = board.generateKnightMoves(pgn('d8'));
      e1 = board.generateKnightMoves(pgn('e1'));
    });
    it('should move a knight to free squares', function () {
      assert.containsMove(d8, [ 'b7', 'c6', 'e6', 'f7' ]);
      assert.lengthOf(d8, 4, 'Knight can only move to exactly 4 squares');
    });
    it('should capture pieces', function () {
      assert.containsMove(e1, [ 'c2', 'f3', 'g2' ]);
      assert.lengthOf(e1, 3, 'Knight can move to exactly 3 squares');
    });
  });

  describe('#generateBishopMoves()', function () {
    var board, e5;
    before(function () {
      board = new Board('7r/8/3r4/4b3/8/8/1R6/8 b - - 1 1');
      e5 = board.generateBishopMoves(pgn('e5'));
    });
    it('should not move offboard', function () {
      assert.containsMove(e5, ['f4', 'g3', 'h2']);
    });
    it('should stop at same colored pieces', function () {
      assert.containsMove(e5, ['f6', 'g7']);
      assert.notContainsMove(e5, 'h8');
    });
    it('should capture pieces', function () {
      assert.containsMove(e5, ['d4', 'c3', 'b2']);
      assert.notContainsMove(e5, 'a1');
    });
  });

  describe('#generateRookMoves()', function () {
    var board, c6;
    before(function () {
      board = new Board('2n5/8/2r2B2/2Q5/8/8/8/8 - - 1 1');
      console.log(board.toString());
      c6 = board.generateRookMoves(pgn('c6'));
    });
    it('should not move offboard', function () {
      assert.containsMove(c6, ['b6', 'a6']);
    });
    it('should stop at same colored pieces', function () {
      assert.containsMove(c6, 'c7');
      assert.notContainsMove(c6, 'c8');
    });
    it('should capture pieces', function () {
      assert.containsMove(c6, ['d6', 'e6', 'f6']);
      assert.containsMove(c6, ['c5']);
      assert.notContainsMove(c6, ['g6', 'h6']);
    });
  });

  describe('#generateQueenMoves()', function () {
    var board, f6;
    before(function () {
      board = new Board('3N4/6B1/4pQb1/8/5N1n/8/8/8 - - 1 1');
      console.log(board.toString());
      f6 = board.generateQueenMoves(pgn('f6'));
    });
    it('should not move offboard', function () {
      assert.containsMove(f6, ['f7', 'f8']);
      assert.containsMove(f6, ['e5', 'd4', 'c3', 'b2', 'a1']);
    });
    it('should stop at same colored pieces', function () {
      assert.containsMove(f6, 'e7');
      assert.containsMove(f6, 'f5');
      assert.notContainsMove(f6, 'd8');
      assert.notContainsMove(f6, ['g7', 'h8']);
      assert.notContainsMove(f6, 'f4');
    });
    it('should capture pieces', function () {
      assert.containsMove(f6, ['e6', 'g6', 'g5', 'h4']);
      assert.notContainsMove(f6, ['h6', 'd6']);
    });
  });

  describe('#generateKingMoves()', function () {

  });

  describe('#generateMoves()', function () {
    var board;
    before(function () {
      board = new Board();
    });
    it('should generate proper moves for a starting position', function () {

    });
  });
});

