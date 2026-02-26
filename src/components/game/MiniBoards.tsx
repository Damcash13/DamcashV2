import { memo } from 'react';
import CheckerPiece from './CheckerPiece';
import type { PlayerColor } from '../../types';

interface MiniCheckersBoardProps {
    size?: number;
}

export const MiniCheckersBoard = memo(({ size = 200 }: MiniCheckersBoardProps) => {
    // Simplified starting position for checkers (10x10)
    const initialBoard = [
        ['', 'b', '', 'b', '', 'b', '', 'b', '', 'b'],
        ['b', '', 'b', '', 'b', '', 'b', '', 'b', ''],
        ['', 'b', '', 'b', '', 'b', '', 'b', '', 'b'],
        ['b', '', 'b', '', 'b', '', 'b', '', 'b', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
        ['', 'w', '', 'w', '', 'w', '', 'w', '', 'w'],
        ['w', '', 'w', '', 'w', '', 'w', '', 'w', ''],
        ['', 'w', '', 'w', '', 'w', '', 'w', '', 'w'],
        ['w', '', 'w', '', 'w', '', 'w', '', 'w', ''],
    ];

    return (
        <div className="relative w-full aspect-square">
            <div className="board board-10x10 absolute inset-0">
                {initialBoard.map((row, rowIndex) =>
                    row.map((piece, colIndex) => {
                        const isLight = (rowIndex + colIndex) % 2 === 0;

                        return (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`cell ${isLight ? 'cell-light' : 'cell-dark'}`}
                            >
                                {piece && (
                                    <CheckerPiece
                                        color={piece === 'w' ? 'white' : 'black'}
                                        isKing={false}
                                        isSelected={false}
                                    />
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
});

MiniCheckersBoard.displayName = 'MiniCheckersBoard';

interface MiniChessBoardProps {
    size?: number;
}

export const MiniChessBoard = memo(({ size = 200 }: MiniChessBoardProps) => {
    // Chess starting position with Unicode pieces
    const initialPieces: { row: number; col: number; symbol: string; color: PlayerColor }[] = [
        // Black pieces
        { row: 0, col: 0, symbol: '♜', color: 'black' },
        { row: 0, col: 1, symbol: '♞', color: 'black' },
        { row: 0, col: 2, symbol: '♝', color: 'black' },
        { row: 0, col: 3, symbol: '♛', color: 'black' },
        { row: 0, col: 4, symbol: '♚', color: 'black' },
        { row: 0, col: 5, symbol: '♝', color: 'black' },
        { row: 0, col: 6, symbol: '♞', color: 'black' },
        { row: 0, col: 7, symbol: '♜', color: 'black' },
        // Black pawns
        ...Array.from({ length: 8 }, (_, i) => ({ row: 1, col: i, symbol: '♟', color: 'black' as PlayerColor })),
        // White pawns
        ...Array.from({ length: 8 }, (_, i) => ({ row: 6, col: i, symbol: '♟', color: 'white' as PlayerColor })),
        // White pieces
        { row: 7, col: 0, symbol: '♜', color: 'white' },
        { row: 7, col: 1, symbol: '♞', color: 'white' },
        { row: 7, col: 2, symbol: '♝', color: 'white' },
        { row: 7, col: 3, symbol: '♛', color: 'white' },
        { row: 7, col: 4, symbol: '♚', color: 'white' },
        { row: 7, col: 5, symbol: '♝', color: 'white' },
        { row: 7, col: 6, symbol: '♞', color: 'white' },
        { row: 7, col: 7, symbol: '♜', color: 'white' },
    ];

    // Create 8x8 board grid
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));

    return (
        <div className="relative w-full aspect-square">
            <div className="board board-8x8 absolute inset-0">
                {board.map((row, rowIndex) =>
                    row.map((_, colIndex) => {
                        const isLight = (rowIndex + colIndex) % 2 === 0;
                        const piece = initialPieces.find(p => p.row === rowIndex && p.col === colIndex);

                        return (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`cell ${isLight ? 'cell-light' : 'cell-dark'}`}
                            >
                                {piece && (
                                    <div
                                        className={`chess-piece ${piece.color === 'white' ? 'chess-piece-white' : 'chess-piece-black'}`}
                                        style={{
                                            color: piece.color === 'white' ? '#FFFFFF' : '#000000',
                                            textShadow: piece.color === 'white'
                                                ? '0 2px 4px rgba(0,0,0,0.5)'
                                                : '0 1px 2px rgba(255,255,255,0.2)',
                                        }}
                                    >
                                        {piece.symbol}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
});

MiniChessBoard.displayName = 'MiniChessBoard';
