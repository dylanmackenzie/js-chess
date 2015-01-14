/* jshint esnext: true */
/* global it */
/* global describe */
/* global before */
/* global require */
/* global beforeEach */
/* global console */

import Board from 'board.js';
var _ = require('lodash');
var assert = require('chai').assert;
var util = require('util');
var pgn = Board.pgntox88;

var fens = {
  squareAttacked: 'r2q1rk1/ppp2pp1/3b1nnp/8/6bB/2N1PN2/PPP1BPPP/R2QK2R w KQ - 5 11',
  'generates pawn moves': '8/4p2P/2p2N2/8/4pP2/p1r4P/1P6/8 b - f3 3 6',
  'generates bishop moves': '7r/8/3r4/4b3/8/8/1R6/8 b - - 1 1',
  'generates knight moves': '3n4/8/8/8/8/3N4/2b2q2/4N3 b - - 1 1',
  'generates rook moves': '2n5/8/2r2B2/2Q5/8/8/8/8 b - - 1 1',
  'generates queen moves': '3N4/6B1/4pQb1/8/5N1n/8/8/8 w - - 1 1',
  'generates castles': 'r3k2r/ppp2ppp/2q5/2b1Q3/8/Pn3P2/6PP/R3K2R b KQkq - 20 10',
  'handles pinned pieces': '8/5q1R/8/2NK4/8/8/3B4/8 w - - 20 10',
  'should move the king out of check': '8/8/8/4K3/6n1/8/7P/8 w - - 20 10',
  'should not allow the king to move into check': '8/2Q5/8/2k5/8/2Q5/8/8 b - - 20 10',
  'should allow the checking piece to be captured': '8/7N/8/3K2q1/8/8/8/8 w - - 20 10',
  'should allow checks to be blocked': '8/4r3/8/8/4K3/8/7B/8 w - - 20 10',

};

assert.containsMove = function (board, from, to) {
  var fromSq = pgn(from);
  var moves = board.legalMoves;
  var explanation = 'board:\n'+board.toString()+'\nmove list for '+from+' did not include ';
  moves = _.filter(moves, { from: fromSq });

  if (!util.isArray(to)) {
    to = [ to ];
  }

  for (var i = 0, len = to.length; i < len; i++) {
    assert.include(_.pluck(moves, 'to'), pgn(to[i]), explanation + to[i]);
  }
};

assert.notContainsMove = function (board, from, to) {
  var fromSq = pgn(from);
  var moves = board.legalMoves;
  var explanation = 'board:\n'+board.toString()+'\nmove list for '+from+' did not include ';
  moves = _.filter(moves, { from: fromSq });

  if (!util.isArray(to)) {
    to = [ to ];
  }

  for (var i = 0, len = to.length; i < len; i++) {
    assert.notInclude(_.pluck(moves, 'to'), pgn(to[i]), explanation + to[i]);
  }
};

describe('Board', function () {
  describe('Board()', function () {
    it('should return a starting board by default', function () {
      assert.ok(new Board());
    });
    it('should create a list containing the location of every piece', function () {

    });
    it('should place the white king at index zero', function () {

    });
    it('should place the black king at index 1', function () {

    });
  });

  describe('.pgntox88()', function () {
    it('should return a 0x88 representation of a pgn string', function () {
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

  describe('.file()', function () {
    it('should return the file of a 0x88 square', function () {
      assert.equal(Board.file(pgn('a6')), 0);
      assert.equal(Board.file(pgn('c4')), 2);
      assert.equal(Board.file(pgn('f1')), 5);
      assert.equal(Board.file(pgn('h8')), 7);
    });
  });

  describe('.rank()', function () {
    it('should return the rank of a 0x88 square', function () {
      assert.equal(Board.rank(pgn('a6')), 5);
      assert.equal(Board.rank(pgn('c4')), 3);
      assert.equal(Board.rank(pgn('f1')), 0);
      assert.equal(Board.rank(pgn('h8')), 7);
    });
  });

  describe('.isWhite()', function () {
    it('should detect if a piece is white', function () {
      assert.ok(Board.isWhite(Board.PIECES.K));
      assert.notOk(Board.isWhite(Board.PIECES.n));
    });
  });

  describe('#makeMove()', function () {
    it('should update the board with the new move', function () {

    });
    it('should move two pieces when castling', function () {

    });
    it('should update the legal castles list when a king is moved', function () {

    });
    it('should update the legal castles list when a rook is moved', function () {

    });
    it('should update the pieceList given a regular move', function () {

    });
    it('should update the pieceList given a caputre', function () {

    });
    it('should update the pieceList given an en passant capture', function () {

    });
  });

  describe('#unmakeMove()', function () {
    it('should reverse the given move', function () {

    });
  });

  describe('#checkMove()', function () {
    it('should return a full move given a full legal move', function () {

    });
    it('should return a full move given a partial legal move (i.e. castle)', function () {

    });

  });

  describe('#generateMoves()', function () {
    var board;

    beforeEach(function () {
      board = new Board(fens[this.currentTest.title] ||
        fens[this.currentTest.parent.title] || null);
    });

    describe('generates pawn moves', function () {
      it('should move a pawn forward one space', function () {
        board.generateMoves(true);
        assert.containsMove(board, 'b2', 'b3');
        board.generateMoves(false);
        assert.containsMove(board, 'e7', 'e6');
      });
      it('should move a pawn forward two spaces', function () {
        board.generateMoves(true);
        assert.containsMove(board, 'b2', 'b4');
        board.generateMoves(false);
        assert.containsMove(board, 'e7', 'e5');
      });
      it('should capture pieces', function () {
        board.generateMoves(true);
        assert.containsMove(board, 'b2', 'c3');
        board.generateMoves(false);
        assert.containsMove(board, 'e7', 'f6');
      });
      it('should capture en passant', function () {
        board.generateMoves(false);
        assert.containsMove(board, 'e4', 'f3');
      });
    });

    describe('generates knight moves', function () {
      it('should not move offboard', function () {

      });
      it('should move to free squares', function () {
        board.generateMoves(false);
        assert.containsMove(board, 'd8', [ 'b7', 'c6', 'e6', 'f7' ]);
      });
      it('should capture pieces', function () {
        board.generateMoves(true);
        assert.containsMove(board, 'e1', [ 'c2', 'f3', 'g2' ]);
      });
    });

    describe('generates bishop moves', function () {
      it('should not move offboard', function () {
        assert.containsMove(board, 'e5', ['f4', 'g3', 'h2']);
      });
      it('should stop at same colored pieces', function () {
        assert.containsMove(board, 'e5', ['f6', 'g7']);
        assert.notContainsMove(board, 'e5', 'h8');
      });
      it('should capture pieces', function () {
        assert.containsMove(board, 'e5', ['d4', 'c3', 'b2']);
        assert.notContainsMove(board, 'e5', 'a1');
      });
    });

    describe('generates rook moves', function () {
      it('should not move offboard', function () {
        assert.containsMove(board, 'c6', ['b6', 'a6']);
      });
      it('should stop at same colored pieces', function () {
        assert.containsMove(board, 'c6', 'c7');
        assert.notContainsMove(board, 'c6', 'c8');
      });
      it('should capture pieces', function () {
        assert.containsMove(board, 'c6', ['d6', 'e6', 'f6']);
        assert.containsMove(board, 'c6', ['c5']);
        assert.notContainsMove(board, 'c6', ['g6', 'h6']);
      });
    });

    describe('generates queen moves', function () {
      it('should not move offboard', function () {
        assert.containsMove(board, 'f6', ['f7', 'f8']);
        assert.containsMove(board, 'f6', ['e5', 'd4', 'c3', 'b2', 'a1']);
      });
      it('should stop at same colored pieces', function () {
        assert.containsMove(board, 'f6', 'e7');
        assert.containsMove(board, 'f6', 'f5');
        assert.notContainsMove(board, 'f6', 'd8');
        assert.notContainsMove(board, 'f6', ['g7', 'h8']);
        assert.notContainsMove(board, 'f6', 'f4');
      });
      it('should capture pieces', function () {
        assert.containsMove(board, 'f6', ['e6', 'g6', 'g5', 'h4']);
        assert.notContainsMove(board, 'f6', ['h6', 'd6']);
      });
    });

    describe('generates castles', function () {
      it('should disallow castles through other pieces', function () {
        assert.notContainsMove(board, 'e1', 'c1');
      });
      it('should disallow castles through check', function () {
        assert.notContainsMove(board, 'e1', 'g1');
      });
      it('should disallow castles out of check', function () {
        assert.notContainsMove(board, 'e8', ['c8', 'g8']);
      });
    });

    describe('handles checks', function () {
      it('should move the king out of check', function () {
        assert.containsMove(board, 'e5', ['f4', 'f5', 'e6', 'd4']);
        assert.notContainsMove(board, 'h2', ['h3', 'h4']);
      });
      it('should not allow the king to move into check', function () {
        assert.containsMove(board, 'c5', ['b5', 'd5']);
        assert.notContainsMove(board, 'c5', ['b4', 'c4', 'd4', 'b6', 'c6', 'd6']);
      });
      it('should allow the checking piece to be captured', function () {
        assert.containsMove(board, 'h7', 'g5');
        assert.notContainsMove(board, 'h7', ['f8', 'f6']);
      });
      it('should allow checks to be blocked', function () {
        assert.containsMove(board, 'h2', ['e5']);
        assert.notContainsMove(board, 'h2', ['f4', 'g3']);
      });
    });

    describe('handles pinned pieces', function () {
      it('should do something', function () {

      });

    });
  });

  describe('#squareOccupied()', function () {
    it('should detect if a square is occupied', function () {

    });
  });

  describe('#squareAttacked()', function () {
    var board;
    before(function () {
      board = new Board(fens.squareAttacked);
    });
    it('should return false if a square is not attacked', function () {
      assert.notOk(board.squareAttacked(pgn('b7')));
      assert.notOk(board.squareAttacked(pgn('g2')));

      assert.notOk(board.squareAttacked(pgn('b7'), false));
      assert.notOk(board.squareAttacked(pgn('a5'), false));
    });
    it('should return a truthy value if the square is attacked', function () {
      assert.ok(board.squareAttacked(pgn('d6')));
      assert.ok(board.squareAttacked(pgn('f6')));

      assert.ok(board.squareAttacked(pgn('h4'), false));
    });
    it('should return the square of the attacking piece if the square is attacked', function () {
      assert.equal(pgn('d1'), board.squareAttacked(pgn('d6')));
      assert.equal(pgn('h4'), board.squareAttacked(pgn('f6')));

      assert.equal(pgn('g6'), board.squareAttacked(pgn('h4'), false));
    });
  });
});

