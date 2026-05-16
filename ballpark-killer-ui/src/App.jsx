import React, { useState, useEffect } from 'react';
import { Wind, Thermometer, Droplet, Gauge, Activity, Sliders, RefreshCw, Zap, Award, Target, User, Clock, ChevronRight } from 'lucide-react';

export default function App() {
  const [gamesSlate, setGamesSlate] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [weatherOverride, setWeatherOverride] = useState({
    tempF: 75,
    humidity: 50,
    windMph: 10,
    windDir: 180
  });

  useEffect(() => {
    fetchLiveSlateData();
  }, []);

  const fetchLiveSlateData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/slate');
      if (!response.ok) throw new Error("Lineup link down.");
      const data = await response.json();
      setGamesSlate(data);
      if (data.length > 0) {
        handleGameChange(data[0]);
      }
    } catch (err) {
      setError("Active slate tracking fallback active.");
      const todayStr = new Date().toLocaleDateString();
      const mockFullLineup = [];
      for(let i=1; i<=9; i++) {
        mockFullLineup.push({ player: `Away Star ${i}`, team_side: "Away", batting_order: i, home_run_probability_pct: (22.4 - i*1.2).toFixed(1), average_projected_distance_ft: 385, maximum_projected_distance_ft: 440 });
        mockFullLineup.push({ player: `Home Crusher ${i}`, team_side: "Home", batting_order: i, home_run_probability_pct: (24.1 - i*1.4).toFixed(1), average_projected_distance_ft: 390, maximum_projected_distance_ft: 452 });
      }
      const fallbackData = [
        {
          game_id: 9501, start_time: "07:05 PM", venue: "Yankee Stadium",
          away_club: "Dodgers", home_club: "Yankees", away_pitcher: "Tyler Glasnow", home_pitcher: "Gerrit Cole",
          weather: { air_temp_c: 22, relative_humidity_pct: 45, wind_velocity_kph: 12, wind_azimuth_degrees: 180 },
          simulations: mockFullLineup
        }
      ];
      setGamesSlate(fallbackData);
      setSelectedGame(fallbackData[0]);
      setActivePlayerIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const handleGameChange = (game) => {
    setSelectedGame(game);
    setActivePlayerIndex(0);
    const tempF = Math.round((game.weather.air_temp_c * 9/5) + 32);
    const windMph = Math.round(game.weather.wind_velocity_kph * 0.621371);
    setWeatherOverride({
      tempF: tempF,
      humidity: Math.round(game.weather.relative_humidity_pct),
      windMph: windMph,
      windDir: Math.round(game.weather.wind_azimuth_degrees)
    });
  };

  const activePlayer = selectedGame?.simulations?.[activePlayerIndex] || null;

  const currentTempC = ((weatherOverride.tempF - 32) * 5/9);
  const baselineDensity = 1.225;
  const calculatedDensity = baselineDensity - (currentTempC * 0.002) - (weatherOverride.humidity * 0.0005);
  const dragShift = ((calculatedDensity / baselineDensity) - 1) * 100;
  const tailwindVectorMph = (weatherOverride.windMph * Math.cos((weatherOverride.windDir - 45) * Math.PI / 180)).toFixed(1);

  // Filter full lineup array into left and right side columns for display lookups
  const awayLineup = selectedGame?.simulations?.filter(p => p.team_side === "Away") || [];
  const homeLineup = selectedGame?.simulations?.filter(p => p.team_side === "Home") || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <header className="border-b border-slate-900 bg-slate-900/30 backdrop-blur-xl sticky top-0 z-50 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-400 p-2.5 rounded-xl text-slate-950 font-black tracking-tighter text-xl">VP</div>
          <div>
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">VECTOR PARK ANALYTICS</h1>
            <p className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">PRO LIVE BOXSCORE LINEUP GRID</p>
          </div>
        </div>
        <button onClick={fetchLiveSlateData} className="flex items-center gap-2 text-xs font-bold bg-slate-900 hover:bg-slate-850 border border-slate-800 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white cursor-pointer transition-all">
          <RefreshCw size={14} className={loading ? "animate-spin text-emerald-400" : "text-emerald-400"} /> Sync Live Orders
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <h2 className="text-xs font-black text-slate-400 tracking-widest mb-4 uppercase flex items-center gap-2">
              <Activity size={14} className="text-emerald-400" /> Live Matchup Slates
            </h2>
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
              {gamesSlate.map((game) => (
                <button
                  key={game.game_id}
                  onClick={() => handleGameChange(game)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedGame?.game_id === game.game_id
                      ? 'bg-gradient-to-r from-emerald-950/40 to-teal-950/20 border-emerald-500/30 text-emerald-300 shadow-lg shadow-emerald-950/50'
                      : 'bg-slate-950/40 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1">
                    <span>{game.venue}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {game.start_time}</span>
                  </div>
                  <div className="font-extrabold text-sm tracking-tight mb-2">
                    {game.away_club} <span className="opacity-30 font-normal text-xs px-0.5">vs</span> {game.home_club}
                  </div>
                  <div className="border-t border-slate-900/60 pt-2 grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-500">
                    <div className="truncate">Away P: <span className="text-slate-300 font-bold">{game.away_pitcher.split(' ').pop()}</span></div>
                    <div className="truncate">Home P: <span className="text-slate-300 font-bold">{game.home_pitcher.split(' ').pop()}</span></div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <h2 className="text-xs font-black text-slate-400 tracking-widest mb-6 uppercase flex items-center gap-2">
              <Sliders size={14} className="text-emerald-400" /> Microclimate Shifts
            </h2>
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2.5">
                  <span className="text-slate-400 flex items-center gap-2"><Thermometer size={14} className="text-amber-500" /> Ambient Temp</span>
                  <span className="text-slate-200 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">{weatherOverride.tempF}°F</span>
                </div>
                <input type="range" min="32" max="110" value={weatherOverride.tempF} onChange={(e) => setWeatherOverride({...weatherOverride, tempF: parseInt(e.target.value)})} className="w-full accent-emerald-400 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2.5">
                  <span className="text-slate-400 flex items-center gap-2"><Wind size={14} className="text-teal-400" /> Wind Velocity</span>
                  <span className="text-slate-200 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">{weatherOverride.windMph} MPH</span>
                </div>
                <input type="range" min="0" max="30" value={weatherOverride.windMph} onChange={(e) => setWeatherOverride({...weatherOverride, windMph: parseInt(e.target.value)})} className="w-full accent-emerald-400 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main Calculation Readout Core Display */}
          <div className="bg-gradient-to-b from-slate-900/60 to-slate-950/40 border border-slate-900 rounded-3xl p-6 lg:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            {activePlayer ? (
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-900/80 pb-6 mb-6">
                  <div>
                    <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase flex items-center gap-1.5">
                      <Target size={12} /> Spot Flight Simulator • Order #{activePlayer.batting_order}
                    </span>
                    <h2 className="text-3xl font-black text-white mt-1.5 tracking-tight">{activePlayer.player}</h2>
                  </div>
                  <div className="flex gap-3 bg-slate-950/60 border border-slate-900 p-2 rounded-2xl text-[11px]">
                    <div className="px-3 py-1">
                      <div className="text-slate-500 font-bold uppercase">Vs. Away Pitcher</div>
                      <div className="text-slate-300 font-extrabold mt-0.5">{selectedGame.away_pitcher}</div>
                    </div>
                    <div className="px-3 py-1 border-l border-slate-900">
                      <div className="text-slate-500 font-bold uppercase">Vs. Home Pitcher</div>
                      <div className="text-slate-300 font-extrabold mt-0.5">{selectedGame.home_pitcher}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-7 bg-gradient-to-br from-slate-900/90 via-slate-900 to-slate-950 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between shadow-inner">
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><Zap size={12} className="inline text-emerald-400 mr-1" /> Dynamic HR Probability</div>
                      <div className="text-5xl font-black tracking-tighter text-white mt-3">
                        {Math.min(Math.max((parseFloat(activePlayer.home_run_probability_pct) + (parseFloat(tailwindVectorMph) * 0.5) - (dragShift * 0.8)), 0.3), 99.1).toFixed(1)}%
                      </div>
                    </div>
                    <div className="mt-6">
                      <div className="w-full bg-slate-950 border border-slate-900 h-2.5 rounded-full overflow-hidden p-0.5">
                        <div className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 h-full rounded-full"
                             style={{ width: `${Math.min(Math.max((parseFloat(activePlayer.home_run_probability_pct) + (parseFloat(tailwindVectorMph) * 0.5) - (dragShift * 0.8)), 2), 98)}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-5 flex flex-col gap-3 text-xs">
                    <div className="bg-slate-900/40 border border-slate-900 p-3.5 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase">Mean Flight Carry</div>
                        <div className="text-lg font-black text-slate-100 mt-0.5">{(parseFloat(activePlayer.average_projected_distance_ft) + (parseFloat(tailwindVectorMph) * 0.9) - (dragShift * 1.2)).toFixed(1)} ft</div>
                      </div>
                      <Award size={18} className="text-slate-700" />
                    </div>
                    <div className="bg-slate-900/40 border border-slate-900 p-3.5 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase">Peak Trajectory</div>
                        <div className="text-lg font-black text-slate-100 mt-0.5">{(parseFloat(activePlayer.maximum_projected_distance_ft) + (parseFloat(tailwindVectorMph) * 1.3)).toFixed(1)} ft</div>
                      </div>
                      <Target size={18} className="text-slate-700" />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* DYNAMIC TWO-COLUMN FULL LINEUP ORDER SHEET */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* AWAY TEAM BATTING PANEL */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xs font-black text-slate-400 tracking-wider mb-3 uppercase flex items-center gap-2 border-b border-slate-900 pb-2">
                <span className="text-amber-500">▲</span> {selectedGame?.away_club || "Away"} Lineup Card
              </h3>
              <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-1">
                {awayLineup.map((p) => {
                  const trueIdx = selectedGame.simulations.findIndex(s => s.player === p.player && s.team_side === "Away");
                  const adjustedProb = Math.min(Math.max((parseFloat(p.home_run_probability_pct) + (parseFloat(tailwindVectorMph) * 0.5) - (dragShift * 0.8)), 0.3), 99.1).toFixed(1);
                  return (
                    <button
                      key={p.player}
                      onClick={() => setActivePlayerIndex(trueIdx)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer group ${
                        activePlayerIndex === trueIdx
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-bold'
                          : 'bg-slate-950/30 border-slate-900/60 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span className="w-5 h-5 flex items-center justify-center bg-slate-900 rounded-md font-mono text-[10px] text-slate-500 group-hover:text-emerald-400">{p.batting_order}</span>
                        <span className="truncate font-medium">{p.player}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono font-bold text-slate-300">
                        <span>{adjustedProb}%</span>
                        <ChevronRight size={12} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* HOME TEAM BATTING PANEL */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xs font-black text-slate-400 tracking-wider mb-3 uppercase flex items-center gap-2 border-b border-slate-900 pb-2">
                <span className="text-emerald-400">▼</span> {selectedGame?.home_club || "Home"} Lineup Card
              </h3>
              <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-1">
                {homeLineup.map((p) => {
                  const trueIdx = selectedGame.simulations.findIndex(s => s.player === p.player && s.team_side === "Home");
                  const adjustedProb = Math.min(Math.max((parseFloat(p.home_run_probability_pct) + (parseFloat(tailwindVectorMph) * 0.5) - (dragShift * 0.8)), 0.3), 99.1).toFixed(1);
                  return (
                    <button
                      key={p.player}
                      onClick={() => setActivePlayerIndex(trueIdx)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer group ${
                        activePlayerIndex === trueIdx
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-bold'
                          : 'bg-slate-950/30 border-slate-900/60 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span className="w-5 h-5 flex items-center justify-center bg-slate-900 rounded-md font-mono text-[10px] text-slate-500 group-hover:text-emerald-400">{p.batting_order}</span>
                        <span className="truncate font-medium">{p.player}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono font-bold text-slate-300">
                        <span>{adjustedProb}%</span>
                        <ChevronRight size={12} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}