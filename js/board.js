/* jshint esnext: true */
/* global Board */
/* global Uint8Array */
/* global Int8Array */
/*********************************************************************
 *                          Private Methods                          *
 *********************************************************************/

function Move(from, to, opts) {
  this.to = to;
  this.from = from;
  this.castle = opts ? opts.castle : undefined;
  this.promoteTo = opts ? opts.promoteTo : undefined;
}

/*********************************************************************
 *                               Board                               *
 *********************************************************************/

export default function Board(fen) {

  this.boardx88 = new Uint8Array(128);
  this.legalMoves = []; //new Uint32Array(256);
  this.pieceList = new Uint8Array(128);
  this.pieceList.len = 0;

  if (fen == null)
     fen = DEFAULT_FEN;

  if (/(\/[\d\w]{0, 8}{8}) [wb] ([kqKQ]+|-) ([\w\d]+|-) \d+ \d+/.test(fen))
    throw new TypeError('Invalid FEN');

  var fields = fen.split(' ');
  var castles = { Q: 0, K: 1, q: 2, k: 3 };

  this.whiteToMove = fields[1].toLowerCase() === 'w';
  this.legalCastles = [ 0x0, 0x07, 0x70, 0x77 ];

  for (var castle in castles) {
    if (fields[2].indexOf(castle) === -1) {
      this.legalCastles[castles[castle]] = 0xff;
    }
  }

  this.enPassant = fields[3];
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

Board.sq = sq;
Board.file = file;
Board.rank = rank;
Board.pgntox88 = pgntox88;
Board.isWhite = isWhite;

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

  this.pieceList.len = j - 1;
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

Board.prototype.move = function (move) {
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

Board.prototype.generatePieceMoves = function (sq, pieceCode, deltas) {
  switch (pieceCode) {
    case PIECES.P: case PIECES.p:
      return this.generatePawnMoves(sq);
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
      throw Error('invalid piece code');
  }
};

Board.prototype.generateMoves = function (whiteToMove) {
  var board = this.boardx88;
  var pieceList = this.pieceList;
  var pieceCode, moves;

  this.legalMoves = [];

  if (whiteToMove == null) {
    whiteToMove = this.whiteToMove;
  }

  for (var i = 0, len = pieceList.len; i < len; i++) {
    pieceCode = board[pieceList[i]];

    if (whiteToMove !== isWhite(pieceCode)) {
      continue;
    }

    moves = this.generatePieceMoves(pieceList[i], pieceCode);
    this.legalMoves = this.legalMoves.concat(moves);
  }

  this.legalMoves = this.legalMoves.concat(this.generateCastles());
};

Board.prototype.generatePawnMoves = function (sq) {
  var board = this.boardx88;
  var ep = this.enPassant;
  var pieceCode = board[sq];
  var whitePawn = isWhite(pieceCode);
  var pmul = whitePawn ? 1 : -1;
  var moves = [];
  var doubleMove = false;
  var tmp, tmpCode;

  // Forward
  tmp = pmul * 16 + sq;
  if (!(tmp & 0x88) && board[tmp] === PIECES.x) {
    moves.push(new Move(sq, tmp));
    doubleMove = true;
  }

  // Capture
  for (tmp = sq + 15*pmul; tmp !== 19*pmul + sq; tmp += 2*pmul) {
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
  if (rank(sq) === (iswhite ? 1 : 6)) {
    tmp = pmul * 32 + sq;
    if (doubleMove && !(tmp & 0x88) && board[tmp] === PIECES.x) {
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
      } else if (isWhite(tmpCode) ^ iswhite) { // capturable piece
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
    if (!(tmp & 0x88) && isWhite(board[tmp]) ^ iswhite) {
      moves.push(new Move(sq, tmp));
    }
  }

  return moves;
};

Board.prototype.generateCastles = function (whiteToMove) {
  var legalCastles = this.legalCastles;
  var moves = [];
  var delta, goodLen, rookTo, rookSq;

  if (whiteToMove == null) {
    whiteToMove = this.whiteToMove;
  }

  for (var i = 0, len = legalCastles.length; i < len; i++) {
    rookSq = legalCastles[i];

    if (rookSq === 0xff || whiteToMove === legalCastles[i] > 0x55) {
      continue;
    }

    delta = (file(rookSq) > 3) ? -1 : 1;
    goodLen = (file(rookSq) > 3) ? 2 : 3;
    rookTo = rookSq + delta * goodLen;
    if (this.generateSliderMoves(rookSq, [delta]).length === goodLen) {
      moves.push(new Move(
        rookTo + delta,
        rookTo - delta,
        { castle: { from: rookSq, to: rookTo } }
      ));
    }
  }

  return moves;
};

Board.prototype.squareOccupied = function (rank, file) {
  if (this.boardx88[sq(rank, file)] !== PIECES.x) {
    return true;
  } else {
    return false;
  }
};

Board.prototype.isSliderAttacking = function (from, to, deltas, xray) {
  var board = this.boardx88;
  var delta, pinnedSq;
  var offset = to - from;

  // checks if a delta can arrive at an offset given an empty board
  function isValidDelta(offset, delta) {
    return (
      (offset > 0) === (delta > 0) && // delta headed in same direction
      offset / delta < 8 && // delta takes less than 8 squares to get to dest
      offset % delta === 0 // delta arrives at dest
    );
  }

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
        return (pinnedSq != null) ? pinnedSq : true;
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
};

Board.prototype.isPieceAttacking = function (from, to, pieceCode, deltas) {
  var isSlider = !!(pieceCode & 0x4);

  if (deltas) {
    deltas = deltas;
  } else if (pieceCode === PIECES.p) {
    deltas = [-15, -17];
  } else if (pieceCode === PIECES.P) {
    deltas = [15, 17];
  } else {
    deltas = DELTAS[pieceCode];
  }

  if (!isSlider) {
    return deltas.indexOf(to - from) > -1;
  } else {
    return this.isSliderAttacking(to, from, pieceCode, deltas);
  }
};

Board.prototype.squareAttacked = function (sq, whiteToMove) {
  var board = this.boardx88;
  var pieceList = this.pieceList;
  var attackSq, attackPiece;

  for (var i = 0, len = pieceList.len; i < len; i++) {
    attackSq = pieceList[i];
    attackPiece = board[attackSq];

    if (whiteToMove !== isWhite(attackPiece)) {
      continue;
    }

    if (this.isPieceAttacking(attackSq, sq, attackPiece)) {
      return true;
    }
  }

  return false;

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
