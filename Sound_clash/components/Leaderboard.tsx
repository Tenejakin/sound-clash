
import React from 'react';
import { ScoreEntry } from '../types';
import { S } from '../strings';

interface LeaderboardProps {
  scores: ScoreEntry[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ scores }) => {
  const sortedScores = [...scores].sort((a, b) => (b.score ?? b.duration) - (a.score ?? a.duration)).slice(0, 10);

  return (
    <div className="w-full max-w-xl mx-auto bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/20 p-10 shadow-2xl relative overflow-hidden">
      <h2 className="text-2xl font-black mb-10 flex items-center justify-between text-white">
        <span className="flex items-center gap-4">
          <div className="w-1 h-6 bg-white/20 rounded-full"></div>
          {S.LB_TITLE}
        </span>
        <span className="text-[10px] opacity-40 uppercase tracking-[0.4em]">{S.LB_LIVE}</span>
      </h2>
      
      {sortedScores.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <p className="text-white/30 font-bold uppercase tracking-widest text-xs">{S.LB_EMPTY}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedScores.map((score, index) => {
            const isRed = score.team === 'red';
            return (
              <div 
                key={score.id} 
                className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-center gap-5">
                  <span className="text-[10px] font-black text-white/30 w-6">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  
                  <div className={`w-14 h-14 flex-shrink-0 bg-black/40 rounded-xl overflow-hidden border border-white/10 shadow-lg relative`}>
                    {score.imageUrl ? (
                      <img src={score.imageUrl} alt="Rank" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className={`w-1.5 h-1.5 rounded-full ${isRed ? 'bg-red-400' : 'bg-blue-400'} animate-pulse`}></div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  </div>

                  <div>
                    <p className={`font-black text-[10px] uppercase tracking-[0.2em] ${isRed ? 'text-red-400' : 'text-blue-400'}`}>
                      {S.lbTeamLabel(score.team)}
                    </p>
                    {score.nickname && (
                      <p className="text-sm font-black text-white uppercase tracking-wide leading-tight">{score.nickname}</p>
                    )}
                    <p className="text-[9px] text-white/30 font-bold uppercase mt-1">{new Date(score.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black tabular-nums text-white">
                    {score.score != null ? score.score.toLocaleString('de-DE') : (score.duration / 1000).toFixed(2) + 's'}
                  </p>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">
                    {score.score != null ? `${Math.round(score.maxDb)}dB · ${(score.duration / 1000).toFixed(2)}s` : `MAX_${Math.round(score.maxDb)}dB`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
