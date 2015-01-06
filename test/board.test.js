import Board from 'board.js'
var _ = require('lodash');
var assert = require('chai').assert;
var pgn = Board.pgntox88;

assert.containsMove = function (moves, to) {
  assert.include(_.pluck(moves, 'to'), pgn(to));
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

  describe('generatePawnMoves()', function () {
    var board, b2result, e7result;
    before(function () {
      board = new Board('8/4p2P/2p2N2/8/4pP2/p1r4P/1P6/8 w - e3 3 6');
      console.log(board.toString());
      b2result = board.generatePawnMoves(pgn('b2'));
      e7result = board.generatePawnMoves(pgn('e7'));
    });
    it('should move a pawn forward one space', function () {
      assert.containsMove(b2result, 'b3');
      assert.containsMove(e7result, 'e6');
    });
    it('should move a pawn forward two spaces', function () {
      assert.containsMove(b2result, 'b4');
      assert.containsMove(e7result, 'e5');
    });
    it('should capture pieces', function () {
      assert.containsMove(b2result, 'c3');
      assert.containsMove(e7result, 'f6');

    });
    it.skip('should capture en passant', function () {

    });
  });
});

