/* jshint esnext: true */
/*********************************************************************
 *                          Private Methods                          *
 *********************************************************************/

function parseMove(move) {
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
    castles: false
  };
}

function Move(from, to) {
  this.to = to;
  this.from = from;
}

/*********************************************************************
 *                               Board                               *
 *********************************************************************/

export default function Board(fen) {

  this.boardx88 = new Uint8Array(128);
  this.legalMoves = []; //new Uint32Array(256);
  this.pieceList = {};

  if (fen == null)
     fen = DEFAULT_FEN;

  if (/(\/[\d\w]{0, 8}{8}) [wb] ([kqKQ]+|-) ([\w\d]+|-) \d+ \d+/.test(fen))
    throw new TypeError('Invalid FEN');

  var fields = fen.split(' ');
  this.whiteToMove = fields[1].toLowerCase() === 'w';
  this.legalCastles = fields[2];
  this.enPassantSq = fields[3];
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
  P: [15, 16, 17, 32],
  p: [-15, -16, -17, -32],
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
function isWhite(pieceCode) { return (pieceCode & 0x8); }

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

Board.prototype.move = function (pgnMove) {
  var move = parseMove(pgnMove);

  if (!this.isLegalMove(move))
    throw new IllegalMoveException(pgnMove);

};

Board.prototype.updatePieceList = function (move) {

};

Board.prototype.initPieceList = function () {
  var piece;

  for (var code in DELTAS) {
    this.pieceList[code] = [];
  }

  for (var i = 0; i < 128; i++) {
    if (i & 0x88) {
      i += 0x7;
      continue;
    }

    piece = this.boardx88[i];

    if (piece !== PIECES.x)
      this.pieceList[piece].push(i);
  }
};


Board.prototype.isLegalMove = function (move) {
  return true;
};

Board.prototype.generateMoves = function () {
  var squares, moves;

  this.legalMoves = [];

  for (var pieceCode in this.pieceList) {
    squares = this.pieceList[pieceCode];
    piece = CODES[pieceCode];
    for (var i = 0, len = squares.length; i < len; i++) {
      switch (piece) {
      case 'P': case 'p':
        moves = this.generatePawnMoves(squares[i]);
        break;
      case 'N': case 'n':
        moves = this.generateKnightMoves(squares[i]);
        break;
      case 'K': case 'k':
        moves = this.generateKingMoves(squares[i]);
        break;
      case 'B': case 'b':
        moves = this.generateBishopMoves(squares[i]);
        break;
      case 'R': case 'r':
        moves = this.generateRookMoves(squares[i]);
        break;
      case 'Q': case 'q':
        moves = this.generateQueenMoves(squares[i]);
        break;
      default:
        throw Error('invalid piece code');
      }

      this.legalMoves = this.legalMoves.concat(moves);
    }
  }
};

Board.prototype.generatePawnMoves = function (sq) {
  var board = this.boardx88;
  var ep = this.ep;
  var pieceCode = board[sq];
  var iswhite = isWhite(pieceCode);
  var pmul = iswhite ? 1 : -1;
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
        if (isWhite(tmpCode) ^ iswhite) { // piece opposite color
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
      moves.push(new Move(sq, tmp));
    }

  }

  return moves;

};

Board.prototype.generateKnightMoves = function (sq) {
  var board = this.boardx88;
  var pieceCode = board[sq];
  var iswhite = isWhite(pieceCode);
  var deltas = PIECE_DELTAS.n;
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

function generateSlidingMoves(board, sq, deltas) {
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
}

Board.prototype.generateKingMoves = function (sq) {
  var board = this.boardx88;
  var pieceCode = board[sq];
  var iswhite = isWhite(pieceCode);
  var deltas = PIECE_DELTAS.k;
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

Board.prototype.generateBishopMoves = function (sq) {
  return generateSlidingMoves(this.boardx88, sq, PIECE_DELTAS.b);
};

Board.prototype.generateRookMoves = function (sq) {
  return generateSlidingMoves(this.boardx88, sq, PIECE_DELTAS.r);
};

Board.prototype.generateQueenMoves = function (sq) {
  return generateSlidingMoves(this.boardx88, sq, PIECE_DELTAS.q);
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
