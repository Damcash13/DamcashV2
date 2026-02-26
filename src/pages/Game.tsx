import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Hand, Share2, Trophy, Volume2, VolumeX } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSeries } from '../contexts/SeriesContext';
import { useToast } from '../contexts/ToastContext';
import { useGameSounds } from '../hooks/useGameSounds';
import { useGameTimer } from '../hooks/useGameTimer';
import { useGameNetwork } from '../hooks/useGameNetwork';
import { useGameEngine } from '../hooks/useGameEngine';
import CheckersBoard from '../components/game/CheckersBoard';
import ChessBoard from '../components/game/ChessBoard';
import VideoPanel from '../components/game/VideoPanel';
import GameSidebar from '../components/game/GameSidebar';
import Username from '../components/Username';
import CoinAnimation from '../components/game/CoinAnimation';
import ExitConfirmModal from '../components/game/ExitConfirmModal';
import GameEndOverlay from '../components/game/GameEndOverlay';
import type { AIDifficulty, ChatMessage } from '../types';
import { supabase } from '../lib/supabase';

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { gameType, themeColors } = useTheme();
  const { user, updateWallet } = useAuth();
  const { currentSeries, reportGameResult } = useSeries();
  const { showToast } = useToast();
  const { playGameStart, playVictory, playDefeat, toggleMute, isMuted: soundMuted } = useGameSounds();

  const mode = searchParams.get('mode') || 'ai';
  const difficulty = (searchParams.get('difficulty') || 'medium') as AIDifficulty;
  const timeControl = searchParams.get('time') || 'blitz';
  const tournamentId = searchParams.get('tournament');
  const berserk = searchParams.get('berserk') === 'true';

  // --- UI State ---
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [showDrawOffer, setShowDrawOffer] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'moves' | 'video' | 'info' | 'spectators'>('chat');

  // Coin Animation
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [coinAnimationAmount, setCoinAnimationAmount] = useState(0);
  const [coinAnimationIsVictory, setCoinAnimationIsVictory] = useState(false);
  const [rewardsProcessed, setRewardsProcessed] = useState(false);

  // Video State
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [mockSpectators] = useState([
    { id: '1', username: 'ChessFan123', elo: 1400 },
    { id: '2', username: 'Watcher99', elo: 1650 },
  ]);
  const [materialScore] = useState({ white: 0, black: 0 });

  // --- Core Hooks ---
  const {
    whiteTime, blackTime, isWhiteTurn,
    gameStarted, gameOver, winner,
    setGameStarted, setGameOver, setWinner,
    switchTurn, formatTime
  } = useGameTimer(timeControl, berserk);

  // Sound Start Only Once
  const [hasPlayedStartSound, setHasPlayedStartSound] = useState(false);

  const handleGameEndTrigger = useCallback((result: 'white' | 'black' | 'draw') => {
    setGameOver(true);
    setWinner(result);

    const isWin = (result === 'white' && mode === 'ai') || (result === 'black' && mode !== 'ai'); // simplified, depends on color

    if (result === 'white' && mode === 'ai') playVictory();
    else if (result === 'black' && mode !== 'ai') playVictory();
    else if (result !== 'draw') playDefeat();

    if (result === 'draw') showToast('Match nul !', 'info', 'La partie s\'est terminée.');
    else if (isWin) showToast('Victoire !', 'success', 'Félicitations !');
    else showToast('Défaite', 'error', 'Vous avez perdu.');

    // Save online result
    if (mode === 'online' && gameId) {
      supabase.from('games').update({ status: 'finished', result: result }).eq('id', gameId).then();
    }
  }, [mode, playVictory, playDefeat, showToast, setGameOver, setWinner, gameId]);

  const {
    remoteMove, localChatMessages, playerColor, wagerAmount, poolAmount,
    sendMove, sendChatMessage, sendResign, sendDrawOffer
  } = useGameNetwork(
    gameId, mode, user,
    () => {
      if (!hasPlayedStartSound) {
        playGameStart();
        setHasPlayedStartSound(true);
      }
      setGameStarted(true);
    },
    handleGameEndTrigger
  );

  const {
    moveHistory, currentMoveIndex, setCurrentMoveIndex,
    boardStates, replayLoaded, handleLocalMove
  } = useGameEngine(mode, gameId, gameType, gameStarted, setGameStarted, switchTurn, sendMove);


  // Initial AI Game Start Sound
  useEffect(() => {
    if (mode === 'ai' && !hasPlayedStartSound) {
      playGameStart();
      setHasPlayedStartSound(true);
      setGameStarted(true);
    }
  }, [mode, hasPlayedStartSound, playGameStart, setGameStarted]);

  // Prevent Navigation
  useEffect(() => {
    if (!gameStarted || gameOver || mode === 'analysis') return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; return ''; };
    const handlePopState = (e: PopStateEvent) => { window.history.pushState(null, '', window.location.href); setShowExitConfirm(true); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', window.location.href);
    return () => { window.removeEventListener('beforeunload', handleBeforeUnload); window.removeEventListener('popstate', handlePopState); };
  }, [gameStarted, gameOver, mode]);

  // Process Rewards
  useEffect(() => {
    if (!gameOver || !winner || winner === 'draw' || rewardsProcessed) return;
    setRewardsProcessed(true);

    const isWin = (winner === 'white' && playerColor === 'white') || (winner === 'black' && playerColor === 'black');

    if (currentSeries && currentSeries.isActive) {
      reportGameResult(gameId || 'game', isWin ? 'win' : 'loss');
      return;
    }

    if (poolAmount > 0) {
      setCoinAnimationAmount(poolAmount);
      setCoinAnimationIsVictory(isWin);
      setShowCoinAnimation(true);
      setTimeout(() => {
        if (isWin) {
          updateWallet(poolAmount, poolAmount);
          showToast(`Vous remportez ${poolAmount} coins !`, 'success', 'La cagnotte est à vous.');
        } else {
          showToast(`Vous perdez ${wagerAmount} coins`, 'error', 'Meilleure chance.');
        }
      }, 5000);
    } else {
      const VICTORY_REWARD = 50;
      const DEFEAT_PENALTY = -20;
      if (isWin) updateWallet(VICTORY_REWARD, VICTORY_REWARD);
      else updateWallet(DEFEAT_PENALTY, DEFEAT_PENALTY);
    }
  }, [gameOver, winner, poolAmount, mode, updateWallet, showToast, rewardsProcessed, wagerAmount, currentSeries, reportGameResult, gameId, playerColor]);


  // Handlers
  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    sendResign();
    handleGameEndTrigger(playerColor === 'white' ? 'black' : 'white');
    setTimeout(() => navigate('/'), 100);
  };

  const handleResign = () => {
    setShowResignConfirm(false);
    sendResign();
    handleGameEndTrigger(playerColor === 'white' ? 'black' : 'white');
  };

  const opponent = mode === 'ai'
    ? { username: `IA ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`, elo: 1200 }
    : { username: 'Adversaire', elo: 1500 };

  return (
    <div className="min-h-full pb-8 pt-4 px-4 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-100px)] lg:min-h-[600px]">

        {/* Board Column */}
        <div className="lg:col-span-6 flex flex-col items-center lg:justify-center relative order-1 lg:order-2">
          {/* Opponent Timer */}
          <div className="w-full max-w-[500px] flex items-center justify-between mb-2 px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">
                {opponent.username[0]}
              </div>
              <Username userId="opponent" username={opponent.username} elo={opponent.elo} className={`${themeColors.text} font-medium`} />
            </div>
            <div className={`px-3 py-1 rounded text-xl font-mono font-bold transition-all ${!isWhiteTurn ? 'bg-white text-black shadow-lg ring-2 ring-red-500' : `${themeColors.card} ${themeColors.textMuted}`}`}>
              {formatTime(blackTime)}
            </div>
          </div>

          <div className="w-full max-w-[85vh] aspect-square flex items-center justify-center">
            {gameType === 'checkers' ? (
              <CheckersBoard
                onMove={(move, notation) => handleLocalMove(notation, move, (move.captured?.length || 0) > 0)}
                onGameEnd={(res) => handleGameEndTrigger(res as any)}
                aiDifficulty={difficulty}
                vsAI={mode === 'ai' && !replayLoaded}
                playerColor={playerColor}
                remoteMove={remoteMove}
                board={mode === 'replay' ? boardStates[currentMoveIndex === -1 ? 0 : currentMoveIndex + 1] : undefined}
              />
            ) : (
              <ChessBoard
                onMove={(f, t, notation) => handleLocalMove(notation || 'move', { from: f, to: t }, false)}
                onGameEnd={handleGameEndTrigger}
                aiDifficulty={difficulty}
                vsAI={mode === 'ai'}
                playerColor={playerColor}
                remoteMove={remoteMove}
              />
            )}
          </div>

          {/* Player Timer */}
          <div className="w-full max-w-[500px] flex items-center justify-between mt-4 px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-xs text-white">
                {user?.username[0] || 'Me'}
              </div>
              <Username userId={user?.id || 'me'} username={user?.username || 'You'} elo={1500} className={`${themeColors.text} font-medium`} />
            </div>
            <div className={`px-3 py-1 rounded text-xl font-mono font-bold transition-all ${isWhiteTurn ? 'bg-white text-black shadow-lg ring-2 ring-green-500' : `${themeColors.card} ${themeColors.textMuted}`}`}>
              {formatTime(whiteTime)}
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button onClick={() => setShowResignConfirm(true)} className="p-3 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
              <Flag className="w-5 h-5" />
            </button>
            <button onClick={() => setShowDrawOffer(true)} className={`p-3 rounded-full ${themeColors.card} ${themeColors.text} transition-colors border ${themeColors.border}`}>
              <Hand className="w-5 h-5" />
            </button>
            <button onClick={toggleMute} className={`p-3 rounded-full ${themeColors.card} ${themeColors.text} transition-colors border ${themeColors.border}`}>
              {soundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Tabs Selector */}
          <div className="lg:hidden flex w-full max-w-[500px] mt-6 bg-black/20 rounded-lg p-1">
            {(['chat', 'moves', 'video', 'info', 'spectators'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === tab ? themeColors.buttonPrimary : 'text-gray-400 hover:text-white'}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Video Column */}
        <div className={`lg:col-span-3 flex flex-col gap-4 h-full order-2 lg:order-1 ${activeTab === 'video' || activeTab === 'info' ? 'flex' : 'hidden lg:flex'}`}>
          <div className={`w-full ${activeTab === 'video' ? 'block' : 'hidden lg:block'}`}>
            <VideoPanel
              gameId={gameId || ''}
              opponentId={undefined}
              opponentName={opponent.username}
              userName={user?.username || 'You'}
              isMuted={isMuted}
              isVideoOff={isVideoOff}
              onToggleMute={() => setIsMuted(!isMuted)}
              onToggleVideo={() => setIsVideoOff(!isVideoOff)}
            />
          </div>
          <div className={`flex-1 ${themeColors.card} rounded-xl border ${themeColors.border} p-4 flex flex-col ${activeTab === 'info' ? 'block' : 'hidden lg:flex'}`}>
            <h3 className={`text-sm font-bold ${themeColors.text}`}>Material Advantage</h3>
            {/* Stub info */}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className={`lg:col-span-3 h-full order-3 ${activeTab === 'chat' || activeTab === 'moves' || activeTab === 'spectators' ? 'flex' : 'hidden lg:block'}`}>
          <GameSidebar
            chatMessages={localChatMessages.map((m) => ({ sender: m.senderName, content: m.content, isSelf: m.senderId === user?.id }))}
            spectators={mockSpectators}
            moveHistory={moveHistory}
            onSendMessage={sendChatMessage}
            currentMoveIndex={currentMoveIndex}
            onNavigateMove={setCurrentMoveIndex}
            activeTab={activeTab as any}
          />
        </div>
      </div>

      <AnimatePresence>
        {mode === 'online' && !gameStarted && !gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-md w-full bg-[#2a2a2a] p-8 rounded-2xl">
              <div className="w-20 h-20 mx-auto border-4 border-t-amber-500 border-white/10 rounded-full animate-spin"></div>
              <h2 className="text-2xl font-bold text-white">En attente d'un adversaire...</h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ExitConfirmModal isOpen={showExitConfirm} onConfirm={handleConfirmExit} onCancel={() => setShowExitConfirm(false)} themeColors={themeColors} />
      {showCoinAnimation && <CoinAnimation show={showCoinAnimation} amount={coinAnimationAmount} isVictory={coinAnimationIsVictory} onComplete={() => setShowCoinAnimation(false)} />}
      <GameEndOverlay
        show={gameOver}
        winner={winner || 'draw'}
        isSelfWinner={(winner === 'white' && playerColor === 'white') || (winner === 'black' && playerColor === 'black')}
        onRematch={() => { }}
        onExit={() => navigate('/')}
        themeColors={themeColors}
        series={currentSeries}
      />
    </div>
  );
}
