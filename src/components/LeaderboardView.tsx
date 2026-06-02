import React, { useEffect, useState } from 'react';
import { UserProfile, RankingEntry } from '../types';
import { getGeneralLeaderboard } from '../services/store';
import { motion } from 'motion/react';
import { Trophy, Star, Search, Users, ShieldAlert, Award } from 'lucide-react';

interface LeaderboardViewProps {
  user: UserProfile;
}

export default function LeaderboardView({ user }: LeaderboardViewProps) {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('Todos');
  const [loading, setLoading] = useState(true);

  // Load Leaderboard on mount
  useEffect(() => {
    async function loadScoreboard() {
      try {
        const board = await getGeneralLeaderboard();
        setRankings(board);
      } catch (err) {
        console.error('Leaderboard fetch failure:', err);
      } finally {
        setLoading(false);
      }
    }
    loadScoreboard();
  }, [user]);

  // Extract departments for filter
  const departments = ['Todos', ...new Set(rankings.map(r => r.puesto || 'Trabajador').filter(Boolean))];

  // Filter rankings
  const filteredRankings = rankings.filter(rk => {
    const matchesSearch = rk.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'Todos' || rk.puesto === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8" id="leaderboard-view">
      
      {/* Visual Header */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-gray-200 bg-white p-8 text-gray-800 shadow-sm mb-8">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Trophy className="h-40 w-40 text-indigo-600" />
        </div>
        <div className="relative z-10">
          <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-indigo-600">
            Cuadro de Honor
          </span>
          <h1 className="text-3xl font-black mt-4 text-gray-850">Ranking General</h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-550 max-w-lg leading-relaxed font-bold">
            Compite con tus compañeros de empresa acumulando XP en cada uno de los micro-juegos de entrenamiento. ¡Sube tu nivel y lidérate como un experto!
          </p>
        </div>
      </div>

      {/* Leaderboard Management Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* Search */}
        <div className="md:col-span-2 relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
            <Search className="h-4.5 w-4.5" />
          </div>
          <input
            id="leaderboard-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar compañero por nombre..."
            className="block w-full rounded-2xl border-2 border-gray-200 bg-white py-3 pl-11 pr-4 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-hidden transition-all font-bold"
          />
        </div>

        {/* Department Select Filter */}
        <div className="relative">
          <select
            id="leaderboard-dept-filter"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="block w-full rounded-2xl border-2 border-gray-200 bg-white py-3 px-4 text-xs sm:text-sm text-gray-700 outline-hidden focus:border-indigo-500 transition-all cursor-pointer font-bold"
          >
            {departments.map((dept, idx) => (
              <option key={idx} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Leaderboard Rankings List */}
      <div className="rounded-3xl border-2 border-gray-200 bg-white overflow-hidden shadow-sm">
        
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <span className="text-xs text-gray-400 font-bold mt-3 uppercase tracking-wider">Sincronizando podios...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" id="leaderboard-table">
              
              {/* Table Header */}
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-400 w-24 text-center">
                    Posición
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-400">
                    Colaborador
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-400">
                    Puesto / Departamento
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-wider text-gray-400 w-32">
                    XP Acumulado
                  </th>
                </tr>
              </thead>
              
              {/* Table Body */}
              <tbody className="divide-y divide-gray-150 bg-white">
                {filteredRankings.map((rk, idx) => {
                  const isCurrentUser = rk.userId === user.uid;
                  
                  // Top 3 Badge configurations
                  let placementBadge = null;
                  if (idx === 0) {
                    placementBadge = (
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-450 font-black text-white text-xs border-b-2 border-yellow-600" title="1er Lugar">
                        1
                      </span>
                    );
                  } else if (idx === 1) {
                    placementBadge = (
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-450 font-black text-white text-xs border-b-2 border-gray-600" title="2do Lugar">
                        2
                      </span>
                    );
                  } else if (idx === 2) {
                    placementBadge = (
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-450 font-black text-white text-xs border-b-2 border-orange-600" title="3er Lugar">
                        3
                      </span>
                    );
                  } else {
                    placementBadge = (
                      <span className="text-xs font-black text-gray-400 font-mono">{idx + 1}</span>
                    );
                  }

                  return (
                    <tr 
                      key={rk.userId}
                      className={`transition-colors hover:bg-gray-50/50 ${
                        isCurrentUser ? 'bg-indigo-50/60 font-bold border-l-4 border-indigo-600' : ''
                      }`}
                    >
                      {/* Position */}
                      <td className="whitespace-nowrap px-6 py-4 text-center flex justify-center">
                        {placementBadge}
                      </td>
                      
                      {/* Player details */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${
                            isCurrentUser 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {rk.userName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm text-gray-800 font-black block">
                              {rk.userName} {isCurrentUser && <span className="text-[10px] text-indigo-600 font-black font-mono ml-1 uppercase">[TÚ]</span>}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Job title */}
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-500 font-bold">
                        {rk.puesto || 'Trabajador'}
                      </td>

                      {/* Accumulated Score */}
                      <td className="whitespace-nowrap px-6 py-4 text-right text-xs sm:text-sm font-black text-indigo-600">
                        <span className="inline-flex items-center">
                          <Star className="mr-1 h-3.5 w-3.5 fill-indigo-400 text-indigo-500" />
                          {rk.totalXP}
                        </span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
            
            {filteredRankings.length === 0 && (
              <div className="text-center py-16">
                <Users className="mx-auto h-12 w-12 text-gray-250 animate-bounce" />
                <h3 className="mt-3 font-bold text-gray-850 text-sm uppercase tracking-wide">Sin resultados que coincidan</h3>
                <p className="mt-2 text-xs text-gray-400 font-bold max-w-xs mx-auto">Intenta buscar con otra categoría de puesto o nombre de colaborador.</p>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
