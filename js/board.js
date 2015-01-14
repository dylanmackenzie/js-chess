/* jshint esnext: true */
/* global Board */
/* global Uint8Array */
/*********************************************************************
 *                          Private Methods                          *
 *********************************************************************/

function Move(from, to, opts) {
  this.to = to;
  this.from = from;
  this.castle = opts ? opts.castle : undefined;
  this.promoteTo = opts ? opts.promoteTo : undefined;
}
Move.prototype.inspect = function () {
  var val, str = '{ ';

  for (var prop in this) {
    if (!this.hasOwnProperty(prop)) {
      continue
    }

    val = this[prop];

    if (prop === 'to' || prop === 'from') {
      val = x88topgn(val);
    }

    str += prop+': '+val+', ';
  }

  return str + '}'
}

/*********************************************************************
 *                               Board                               *
 *********************************************************************/

export default function Board(fen) {

  this.boardx88 = new Uint8Array(128);
  this.legalMoves = []; //new Uint32Array(256);
  this.pieceList = new Uint8Array(64);
  this.pieceList.len = 0;

  if (fen == null)
     fen = DEFAULT_FEN;

  if (!/[1-8pbnrqk\/]{15,} [wb] ([kq]+|-) ([\w\d]+|-) \d+ \d+/i.test(fen))
    throw new TypeError('Invalid FEN:' + fen);

  var fields = fen.split(' ');
  var castles = { Q: 0, K: 1, q: 2, k: 3 };

  this.whiteToMove = fields[1].toLowerCase() === 'w';
  this.legalCastles = [ 0x0, 0x07, 0x70, 0x77 ];

  for (var castle in castles) {
    if (fields[2].indexOf(castle) === -1) {
      this.legalCastles[castles[castle]] = 0xff;
    }
  }

  this.enPassant = fields[3] == '-' ? 0xff : pgntox88(fields[3]);
  this.halfMoves = fields[4];
  this.fullMoves = fields[5];

  this.initBoardFromFEN(fields[0]);
  this.initPieceList();
  this.generateMoves();
}

/*********************************************************************
 *                          Board Constants                          *
 *********************************************************************/

var DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

var PIECES = {
  x: 0x0, // empty square
  p: 0x1,
  n: 0x2,
  k: 0x3,
  b: 0x5,
  r: 0x6,
  q: 0x7,
  P: 0x9,
  N: 0xa,
  K: 0xb,
  B: 0xd,
  R: 0xe,
  Q: 0xf
};

var PIECE_DELTAS = {
  P: [15, 16, 17],
  p: [-15, -16, -17],
  N: [14, 31, 33, 18, -18, -33, -31, -14],
  n: [14, 31, 33, 18, -18, -33, -31, -14],
  K: [15, 16, 17, 1, -17, -16, -15, -1],
  k: [15, 16, 17, 1, -17, -16, -15, -1],
  B: [15, 17, -17, -15],
  b: [15, 17, -17, -15],
  R: [16, 1, -16, -1],
  r: [16, 1, -16, -1],
  Q: [15, 16, 17, 1, -17, -16, -15, -1],
  q: [15, 16, 17, 1, -17, -16, -15, -1]
};

var CODES = {};
for (var piece in PIECES) {
  CODES[PIECES[piece]] = piece;
}

var DELTAS = {};
for (piece in PIECES) {
  if (!(piece in PIECE_DELTAS))
    continue;

  DELTAS[PIECES[piece]] = PIECE_DELTAS[piece];
}

Board.PIECES = PIECES;
Board.CODES = CODES;
Board.DELTAS = DELTAS;
Board.PIECE_DELTAS = PIECE_DELTAS;

/*********************************************************************
 *                       Board Static Methods                        *
 *********************************************************************/

function sq(rank, file) { return (rank << 4) + file; }
function file(square)   { return square & 0x7; }
function rank(square)   { return square >> 4; }
function pgntox88(pgn)  { return sq(parseInt(pgn[1]) - 1, 'abcdefgh'.indexOf(pgn[0])); }
function isWhite(pieceCode) { return !!(pieceCode & 0x8); }
function isSlider(pieceCode) { return !!(pieceCode & 0x4); }
function x88topgn(sq) { return 'abcdefgh'[file(sq)] + '12345678'[rank(sq)]; }

// checks if a delta can arrive at an offset given an empty board
function isValidDelta(offset, delta) {
  return (
    (offset > 0) === (delta > 0) && // delta headed in same direction
    offset / delta < 8 && // delta takes less than 8 squares to get to dest
    offset % delta === 0 // delta arrives at dest
  );
}


Board.sq = sq;
Board.file = file;
Board.rank = rank;
Board.pgntox88 = pgntox88;
Board.isWhite = isWhite;
Board.isValidDelta = isValidDelta;
Board.isSlider = isSlider;

/*********************************************************************
 *                      Board Instance Methods                       *
 *********************************************************************/

Board.prototype.toString = function () {
  var ranks = ['┌─┬─┬─┬─┬─┬─┬─┬─┐\n│'];
  var cur, piece;
  for (var r = 7; r >= 0; r--) {
    cur = [];
    for (var f = 0; f < 8; f++) {
      piece = CODES[this.boardx88[sq(r, f)]];
      cur.push((piece === 'x') ? ' ' : piece);
    }
    ranks.push(cur.join('│') + ((r > 0) ? '│\n├─┼─┼─┼─┼─┼─┼─┼─┤\n│' : ''));
  }

  ranks.push('│\n└─┴─┴─┴─┴─┴─┴─┴─┘');
  return ranks.join('');
};

Board.prototype.initBoardFromFEN = function(ranks) {
  var ch, cur;
  ranks = ranks.split('/');

  for (var rank = 0; rank < 8; rank++) {
    cur = ranks[7 - rank];
    for (var i = 0, file = 0; i < cur.length; i++) {
      ch = cur[i];
      if ('12345678'.indexOf(ch) !== -1) {
        file += parseInt(ch, 10);
      } else if ('pPnNbBrRqQkK'.indexOf(ch) !== -1) {
        this.boardx88[sq(rank, file)] = PIECES[cur[i]];
        file++;
      } else {
        throw new TypeError('Invalid FEN String');
      }
    }
  }
};

Board.prototype.initPieceList = function () {
  var board = this.boardx88;
  var kings = 0;
  var pieceCode;

  // initialize two kings to invalid squares
  this.pieceList[0] = 0xff; // white king
  this.pieceList[1] = 0xff; // black king

  for (var i = 0, j = 2; i < 128; i++) {
    pieceCode = board[i];

    if (i & 0x88) {
      i += 0x7;
      continue;
    }

    if (pieceCode === PIECES.K) {
      this.pieceList[0] = i;
      kings += 2;
    } else if (pieceCode === PIECES.k) {
      this.pieceList[1] = i;
      kings += 3;
    } else if (pieceCode !== PIECES.x) {
      this.pieceList[j++] = i;
    }
  }

  /*
   *if (kings !== 5) {
   *  throw new TypeError('invalid FEN string: Board requires exactly two oppositely colored kings');
   *}
   */

  this.pieceList.len = j;
};

Board.prototype.parsePGN = function (move) {
  if (move === 'O-O')
    return { castles: 'K' };

  if (move === 'O-O-O')
    return { castles: 'Q' };

  var re = /([NBRKQ])?([abcdefgh12345678])?(x)?([abcdefgh][12345678])(=[NBRKQ])?([#+])?/;
  var matches = re.exec(move);

  return {
    piece: (matches[1] == null) ? 'P' : matches[1],
    piecePos: matches[2],
    capture: !!matches[3],
    dest: pgntox88(matches[4]),
    promoteTo: (matches[5] == null) ? undefined : matches[5][1],
    check: matches[6] === '+',
    checkMate: matches[6] === '#',
    castles: undefined
  };
};

Board.prototype.makeMove = function (move) {
  var fullMove;

  if (typeof move === 'string') {
    move = this.parsePGN(move);
  }

  fullMove = this.checkMove(move);

  if (!fullMove)
    throw new IllegalMoveException(move);

  this.whiteToMove = !this.whiteToMove;
  this.updatePieceList(fullMove); // must be done before updating board
  this.updateBoard(fullMove);
  this.updateLegalCastles(fullMove);
  this.generateMoves();
};

Board.prototype.updateBoard = function (move) {
  var board = this.boardx88;
  var from = move.from, to = move.to;
  var pieceCode = board[from];

  if (move.castle) {
    board[move.castle.to] = board[move.castle.from];
    board[move.castle.from] = PIECES.x;
  }

  board[from] = PIECES.x;
  board[to] = pieceCode;

};

Board.prototype.filterLegalMoves = function (checkers, whiteToMove) {
  var board = this.boardx88;
  var pieceList = this.pieceList;
  var kingSq, checkingSq;
  var kingOffset, checkingOffset;
  var that = this;

  kingSq = pieceList[ whiteToMove ? 0 : 1 ];

  if (checkers.length >= 2) { // double check
    return this.legalMoves.filter(function (move) {
      if (move.from === kingSq) {
        return !that.squareAttacked(move.to, !whiteToMove);
      } else {
        return false;
      }
    });
  } else if (checkers.length === 1) { // check
    checkingSq = checkers[0];

    return this.legalMoves.filter(function (move) {
      if (move.from === kingSq) { // king move
        return !that.squareAttacked(move.to, !whiteToMove);
      }

      if (move.to === checkingSq) { // capture checking piece
        return true;
      }

      if (!isSlider(board[checkingSq])) { // unblockable checking piece
        return false;
      }

      kingOffset = move.to - kingSq;
      checkingOffset = move.to - checkingSq;

      if (kingOffset > 0 === checkingOffset > 0) { // dest not between pieces
        return false;
      }

      for (var i = 0, len = PIECE_DELTAS.q.length; i < len; i++) {
        if (isValidDelta(checkingOffset, PIECE_DELTAS.q[i])) {
          if (isValidDelta(-1 * kingOffset, PIECE_DELTAS.q[i])) {
            return true;
          } else {
            return false;
          }
        }
      }

      return false;
    });
  }
};

Board.prototype.updateLegalCastles = function (move) {
  var pieceList = this.pieceList;
  var legalCastles = this.legalCastles;
  var from = move.from;

  if (legalCastles.indexOf(from) > -1) {
    legalCastles[legalCastles.indexOf(from)] = 0xff;
  }

  if (from === pieceList[0]) {
    legalCastles[0] = 0xff;
    legalCastles[1] = 0xff;
  }

  if (from === pieceList[1]) {
    legalCastles[2] = 0xff;
    legalCastles[3] = 0xff;
  }
};

Board.prototype.updatePieceList = function (move) {
  var pieceList = this.pieceList;

  for (var i = 0, len = pieceList.len; i < len; i++) {
    if (pieceList[i] === move.to) { // captured piece
      pieceList.len--;
      len--;
      pieceList[i] = pieceList[len];
    }

    if (pieceList[i] === move.from) { // moved piece
      pieceList[i] = move.to;
    }

    if (move.castle && pieceList[i] === move.castle.from) {
      pieceList[i] = move.castle.to;
    }
  }
};

Board.prototype.checkMove = function (move) {
  var legalMoves = this.legalMoves;

  for (var i = 0, len = legalMoves.length; i < len; i++) {
    if (legalMoves[i].from === move.from &&
        legalMoves[i].to === move.to) {
      return legalMoves[i];
    }
  }

  return false;
};

Board.prototype.generateMoves = function (whiteToMove) {
  var board = this.boardx88;
  var pieceList = this.pieceList;
  var that = this;
  var pieceCode, moves, sq, pins, kingSq, delta, pinnedDeltas;
  var checkers;

  this.legalMoves = [];

  if (whiteToMove == null) {
    whiteToMove = this.whiteToMove;
  }

  kingSq = this.pieceList[ whiteToMove ? 0 : 1 ];

  if (kingSq !== 0xff) {
    pins = this.calculatePins(kingSq, whiteToMove);
  }

  for (var i = 0, len = pieceList.len; i < len; i++) {
    sq = pieceList[i];

    if (sq === 0xff) {
      continue;
    }

    pieceCode = board[sq];

    if (whiteToMove !== isWhite(pieceCode)) {
      continue;
    }

    if (pins == null || pins.indexOf(sq) === -1) {
      moves = this.generatePieceMoves(sq, pieceCode);
      if (pieceCode === PIECES.k || pieceCode === PIECES.K) {
        moves = moves.filter(function (move) {
          return !that.squareAttacked(move.to, !whiteToMove);
        });
      }
    } else {
      moves = [];
      for (var j = 0, len2 = DELTAS[pieceCode].length; j < len2; j++) {
        delta = DELTAS[pieceCode][j];

        if (isValidDelta(kingSq - sq, delta)) {
          pinnedDeltas = [delta, -1 * delta];
          moves = this.generatePieceMoves(sq, pieceCode, pinnedDeltas);
          break;
        }
      }
    }

    if (moves.length > 0) {
      this.legalMoves = this.legalMoves.concat(moves);
    }
  }

  checkers = this.squareAttacked(kingSq, !whiteToMove, true);

  if (checkers === false) { // no check
    this.legalMoves = this.legalMoves.concat(this.generateCastles());
  } else {
    this.legalMoves = this.filterLegalMoves(checkers, whiteToMove);
  }

};

Board.prototype.calculatePins = function (sq, whiteToMove) {
  var board = this.boardx88;
  var pieceList = this.pieceList;
  var pieceSq, pieceCode, pinnedSq;
  var pins = [];

  if (whiteToMove == null) {
    whiteToMove = this.whiteToMove;
  }

  for (var i = 2, len = pieceList.len; i < len; i++) {
    pieceSq = pieceList[i];
    pieceCode = board[pieceCode];

    if (isWhite(pieceCode) === whiteToMove || !isSlider(pieceCode)) {
      continue;
    }

    pinnedSq = this.isSliderAttacking(pieceSq, sq, DELTAS[pieceCode], 1);

    if (!pinnedSq || pinnedSq === true || isWhite(board[pinnedSq]) !== whiteToMove) {
      continue;
    }

    pins.push(pinnedSq);
  }

  return pins;
};

Board.prototype.generatePieceMoves = function (sq, pieceCode, deltas) {
  switch (pieceCode) {
    case PIECES.P: case PIECES.p:
      return this.generatePawnMoves(sq, deltas || DELTAS[pieceCode]);
    case PIECES.N: case PIECES.n:
      return this.generateJumperMoves(sq, deltas || PIECE_DELTAS.n);
    case PIECES.K: case PIECES.k:
      return this.generateJumperMoves(sq, deltas || PIECE_DELTAS.k);
    case PIECES.B: case PIECES.b:
      return this.generateSliderMoves(sq, deltas || PIECE_DELTAS.b);
    case PIECES.R: case PIECES.r:
      return this.generateSliderMoves(sq, deltas || PIECE_DELTAS.r);
    case PIECES.Q: case PIECES.q:
      return this.generateSliderMoves(sq, deltas || PIECE_DELTAS.q);
    default:
      throw Error('invalid piece code: ' + pieceCode);
  }
};

Board.prototype.generatePawnMoves = function (sq, deltas) {
  var board = this.boardx88;
  var ep = this.enPassant;
  var pieceCode = board[sq];
  var whitePawn = isWhite(pieceCode);
  var pmul = whitePawn ? 1 : -1;
  var moves = [];
  var doubleMove = false;
  var tmp, tmpCode;

  // Forward
  if (deltas.indexOf(pmul * 16) > -1) {
    tmp = pmul * 16 + sq;
    if (!(tmp & 0x88) && board[tmp] === PIECES.x) {
        moves.push(new Move(sq, tmp));
      doubleMove = true;
    }
  }

  // Capture
  for (var delta = 15*pmul; delta !== 19*pmul; delta += 2*pmul) {
    if (deltas.indexOf(delta) === -1) {
      continue
    }

    tmp = sq + delta;

    if (!(tmp & 0x88)) { // move on board
      tmpCode = board[tmp];
      if (tmpCode !== PIECES.x) { // square not empty
        if (isWhite(tmpCode) !== whitePawn) { // piece opposite color
          moves.push(new Move(sq, tmp));
        }
      } else if (tmp === ep) { // e.p.
        moves.push(new Move(sq, tmp));
      }
    }
  }

  // Double Move
  if (doubleMove && rank(sq) === (whitePawn ? 1 : 6)) {
    tmp = pmul * 32 + sq;
    if (!(tmp & 0x88) && board[tmp] === PIECES.x) {
      moves.push(new Move(sq, tmp, { enPassant: tmp - pmul * 16 }));
    }

  }

  return moves;

};

Board.prototype.generateJumperMoves = function (sq, deltas) {
  var board = this.boardx88;
  var pieceCode = board[sq];
  var iswhite = isWhite(pieceCode);
  var moves = [];
  var tmp, tmpCode;

  for (var i = 0, len = deltas.length; i < len; i++) {
    tmp = sq + deltas[i];
    if (!(tmp & 0x88)) { // move on board
      tmpCode = board[tmp];
      if (tmpCode === PIECES.x) { // square empty
        moves.push(new Move(sq, tmp));
      } else if (isWhite(tmpCode) !== iswhite) { // capturable piece
        moves.push(new Move(sq, tmp));
      }
    }
  }

  return moves;
};

Board.prototype.generateSliderMoves = function (sq, deltas) {
  var board = this.boardx88;
  var pieceCode = board[sq];
  var iswhite = isWhite(pieceCode);
  var moves = [];
  var tmp, delta;

  for (var i = 0, len = deltas.length; i < len; i++) {
    delta = deltas[i];

    // free squares
    for (tmp = sq + delta; !(tmp & 0x88 || board[tmp] !== PIECES.x); tmp += delta) {
      moves.push(new Move(sq, tmp));
    }

    // capture
    if (!(tmp & 0x88) && isWhite(board[tmp]) !== iswhite) {
      moves.push(new Move(sq, tmp));
    }
  }

  return moves;
};

Board.prototype.generateCastles = function (whiteToMove) {
  var pieceList = this.pieceList;
  var legalCastles = this.legalCastles;
  var moves = [];
  var kingSq, rookSq, offset, delta, flag;

  if (whiteToMove == null) {
    whiteToMove = this.whiteToMove;
  }

  kingSq = pieceList[ whiteToMove ? 0 : 1 ];

  if (kingSq === 0xff) {
    return moves;
  }

  if (this.squareAttacked(kingSq, whiteToMove)) {
    return moves;
  }

  for (var i = 0, len = legalCastles.length; i < len; i++) {
    rookSq = legalCastles[i];
    flag = true;

    if (rookSq === 0xff || whiteToMove === legalCastles[i] > 0x55) {
      continue;
    }

    offset = rookSq - kingSq;
    delta = offset > 0 ? 1 : -1;

    for (var j = 0, tmp = kingSq + delta; j < 2 ; j++, tmp += delta) {
      if (!this.squareOccupied(tmp) || this.squareAttacked(tmp, !whiteToMove)) {
        flag = false;
        break;
      }
    }

    if (flag) {
      moves.push(new Move(kingSq, tmp - delta, { castles: rookSq }));
    }
  }

  return moves;
};

Board.prototype.squareOccupied = function (rank, file) {
  var sq;

  if (file == null) {
    sq = rank;
  } else {
    sq = Board.sq(rank, file);
  }

  return this.boardx88[sq] !== PIECES.x;
};

Board.prototype.isSliderAttacking = function (from, to, deltas, xray) {
  var board = this.boardx88;
  var delta, pinnedSq;
  var offset = to - from;

  xray = xray || 0;

  // iterate over valid deltas
  for (var i = 0, len = deltas.length; i < len; i++) {
    delta = deltas[i];

    // skip if delta can never get to a given square
    if (!isValidDelta(offset, delta)) {
      continue;
    }

    // once we are here, we know we have found the only possibly correct delta
    for (var tmp = from + delta; !(tmp & 0x88); tmp += delta) {

      // we have reached the destination so return affirmative
      if (tmp === to) {
        return pinnedSq || true;
      }

      // a square on the way is occupied so the destination is unreachable
      if (board[tmp] !== PIECES.x) {

        // if we aren't calculating xray attacks we can stop
        if (!xray) {
          return false;
        }

        xray--;
        pinnedSq = tmp;
      }
    }

    return false;
  }

  return false;
};

Board.prototype.isPieceAttacking = function (from, to, pieceCode, deltas) {
  if (deltas != null) {
    deltas = deltas;
  } else if (pieceCode === PIECES.p) {
    deltas = [-15, -17];
  } else if (pieceCode === PIECES.P) {
    deltas = [15, 17];
  } else {
    deltas = DELTAS[pieceCode];
  }

  if (!isSlider(pieceCode)) {
    return deltas.indexOf(to - from) > -1;
  } else {
    return this.isSliderAttacking(from, to, deltas);
  }
};

Board.prototype.squareAttacked = function (sq, whiteToMove, doubleAttack) {
  var board = this.boardx88;
  var pieceList = this.pieceList;
  var attackingSq, attackingPiece;
  var attacks = [];

  if (whiteToMove == null) {
    whiteToMove = this.whiteToMove;
  }

  if (doubleAttack == null) {
    doubleAttack = false;
  }

  for (var i = 0, len = pieceList.len; i < len; i++) {
    attackingSq = pieceList[i];

    if (attackingSq === 0xff) {
      continue;
    }

    attackingPiece = board[attackingSq];

    if (whiteToMove !== isWhite(attackingPiece)) {
      continue;
    }

    if (this.isPieceAttacking(attackingSq, sq, attackingPiece)) {
      if (!doubleAttack) {
        return attackingSq;
      } else {
        attacks.push(attackingSq);
      }
    }
  }

  return attacks.length === 0 ? false : attacks;
};

/*********************************************************************
 *                            Exceptions                             *
 *********************************************************************/

export function IllegalMoveException(pgn, reason) {
  this.name = 'IllegalMoveException';
  this.message = pgn + ' illegal' + (reason ? ': ' + reason : '');
  this.pgn = pgn;
  this.reason = reason;
}
IllegalMoveException.prototype = new Error();
IllegalMoveException.prototype.constructor = IllegalMoveException;
