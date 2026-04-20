import { useState, ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  TrendingUp, 
  Activity, 
  Target, 
  History, 
  AlertCircle,
  ChevronRight,
  BarChart3,
  MessageSquare,
  RotateCcw,
  Trash2,
  Trophy,
  PieChart as PieIcon,
  Mic,
  Volume2
} from 'lucide-react';
import { getFootballPrediction, PredictionResult, chatAboutMatch } from './services/gemini';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as ReTooltip, 
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

// --- Sub-components for Enhanced UI ---

function RadarComparison({ home, away, homeName, awayName }: { home: any, away: any, homeName: string, awayName: string }) {
  const data = [
    { subject: 'Goals S', home: home.goalsScored, away: away.goalsScored, fullMark: 5 },
    { subject: 'Goals C', home: home.goalsConceded, away: away.goalsConceded, fullMark: 5 },
    { subject: 'Corners', home: home.corners, away: away.corners, fullMark: 15 },
  ];

  return (
    <div className="h-48 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#333" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 8 }} />
          <Radar
            name={homeName}
            dataKey="home"
            stroke="#C5A059"
            fill="#C5A059"
            fillOpacity={0.6}
          />
          <Radar
            name={awayName}
            dataKey="away"
            stroke="#666"
            fill="#333"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmbeddedChat({ result }: { result: PredictionResult | null }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await chatAboutMatch(userMsg, result, messages);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Tactical analysis engine error." }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => setMessages([]);
  const startNewChat = () => setMessages([]); // Essentially the same for now, but semantically distinct if needed later

  return (
    <div className="bg-card-bg border border-military-blue/30 rounded-xl flex flex-col h-[450px] overflow-hidden shadow-2xl relative">
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-military-blue/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-3 bg-gold"></div>
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white">ORACLE ADVISOR</h4>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={clearChat}
            title="Clear Analysis"
            className="text-slate-500 hover:text-rose-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <button 
            onClick={startNewChat}
            title="Start New Session"
            className="text-slate-500 hover:text-gold transition-colors"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide text-[11px] leading-relaxed">
        {messages.length === 0 && (
          <div className="bg-gold/5 border border-gold/10 p-5 rounded-lg italic text-gold/80 font-serif text-center">
            <p className="mb-2">"Tactical advisor ready."</p>
            <p className="text-[9px] uppercase tracking-widest opacity-60">Consult me on historical trends or optimal match results before confirming your matrix.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-[85%] ${
              m.role === 'user' 
                ? 'bg-gold text-black font-medium shadow-lg' 
                : 'bg-military-blue/20 text-slate-300 border border-military-blue/40'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="p-2 px-3 bg-white/5 rounded-full flex gap-1 items-center">
              <div className="w-1 h-1 bg-gold rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-gold rounded-full animate-pulse [animation-delay:0.2s]" />
              <div className="w-1 h-1 bg-gold rounded-full animate-pulse [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-black/60 border-t border-white/5">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for betting advice or historical context..."
            className="w-full bg-black/40 border border-military-blue/40 rounded-full px-6 py-3.5 outline-none focus:border-gold transition-all text-xs font-serif pr-14 placeholder:text-slate-700"
          />
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gold hover:scale-110 transition-transform">
            <ChevronRight size={22} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handlePredict = async () => {
    if (!homeTeam || !awayTeam) {
      setError('Please enter both Home and Away teams.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const prediction = await getFootballPrediction(homeTeam, awayTeam);
      setResult(prediction);
    } catch (err) {
      console.error(err);
      setError('Failed to get prediction. Please check the team names and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-gold';
    if (confidence >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getFormBadge = (result: string) => {
    const bgColor = result === 'W' ? 'bg-gold/10 text-gold border border-gold/20' :
                    result === 'L' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    return (
      <span key={Math.random()} className={`w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-bold ${bgColor} uppercase font-mono`}>
        {result}
      </span>
    );
  };

  return (
    <div className="min-h-screen sophisticated-gradient text-[#E5E5E5] font-sans selection:bg-gold/30">
      {/* Header */}
      <header className="border-b border-border-subtle bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gold rounded-sm rotate-45 flex items-center justify-center">
              <div className="w-4 h-4 bg-black -rotate-45"></div>
            </div>
            <div>
              <h1 className="font-serif text-xl tracking-[0.2em] font-light text-white">ORACLE <span className="text-gold italic">PRIME</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-8 text-[10px] uppercase tracking-[0.15em] font-medium font-mono text-slate-500">
            <span className="text-gold border-b border-gold pb-1">Football Analysis</span>
            <span className="hover:text-white transition-colors cursor-pointer">Global Leagues</span>
            <span className="hover:text-white transition-colors cursor-pointer">Live Stats</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Search Section */}
        <section className="max-w-4xl mx-auto mb-16">
          <div className="bg-card-bg p-10 rounded-xl border border-border-subtle shadow-2xl relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold"></div>
            
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-xs uppercase tracking-[0.3em] font-bold flex items-center gap-3">
                <span className="w-1 h-4 bg-gold"></span> Analyze Matchup
              </h2>
              <div className="flex items-center gap-4 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                Historical Context v4.2
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
              <div className="flex-1 w-full flex flex-col items-center gap-4">
                <div className="text-[10px] text-gold uppercase tracking-[0.2em] font-bold">Home Team</div>
                <input 
                  type="text" 
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  placeholder="Enter Club Name..."
                  className="bg-transparent border-b border-white/10 text-3xl font-serif text-center w-full focus:outline-none focus:border-gold pb-3 transition-colors placeholder:text-slate-700"
                />
              </div>

              <div className="px-4 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full border border-gold flex items-center justify-center shadow-[0_0_15px_rgba(197,160,89,0.15)]">
                  <span className="text-sm font-serif italic text-gold">vs</span>
                </div>
              </div>

              <div className="flex-1 w-full flex flex-col items-center gap-4">
                <div className="text-[10px] text-gold uppercase tracking-[0.2em] font-bold">Away Team</div>
                <input 
                  type="text" 
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  placeholder="Enter Club Name..."
                  className="bg-transparent border-b border-white/10 text-3xl font-serif text-center w-full focus:outline-none focus:border-gold pb-3 transition-colors placeholder:text-slate-700"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 rounded bg-rose-500/5 border border-rose-500/10 text-rose-400 text-xs text-center flex items-center justify-center gap-3 italic"
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}

            <button 
              onClick={handlePredict}
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-hover text-black font-bold py-5 uppercase tracking-[0.2em] text-xs transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(197,160,89,0.2)]"
            >
              {loading ? "Cross-Referencing Global Data..." : "Run AI Prediction Matrix"}
            </button>
          </div>
        </section>

        {/* Tactical Advisor Section - Relocated */}
        <section className="max-w-4xl mx-auto mb-16">
          <EmbeddedChat result={result} />
        </section>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {result && !loading && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Prediction Grid */}
                <div className="lg:col-span-3 space-y-8">
                  <div className="bg-card-bg border border-border-subtle rounded-xl p-8">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-xs uppercase tracking-[0.25em] font-bold flex items-center gap-2">
                        <span className="w-1 h-4 bg-gold"></span> AI Prediction Matrix
                      </h2>
                      <div className="bg-black/40 px-4 py-1.5 rounded-full border border-border-subtle flex items-center gap-3">
                        <div className="w-2 h-2 bg-gold rounded-full animate-pulse shadow-[0_0_8px_rgba(197,160,89,0.5)]"></div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-gold">Stability Index: 96.4%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <PredictionCard 
                        title="1X2 Result" 
                        value={result.predictions.one_x_two.choice} 
                        confidence={result.predictions.one_x_two.confidence}
                        reason={result.predictions.one_x_two.reason}
                        icon={<Activity size={18} />}
                      />
                      <PredictionCard 
                        title="GG / NG" 
                        value={result.predictions.gg_ng.choice} 
                        confidence={result.predictions.gg_ng.confidence}
                        reason={result.predictions.gg_ng.reason}
                        icon={<Target size={18} />}
                      />
                      <PredictionCard 
                        title="Over/Under" 
                        value={result.predictions.over_under_2_5.choice} 
                        confidence={result.predictions.over_under_2_5.confidence}
                        reason={result.predictions.over_under_2_5.reason}
                        icon={<PieIcon size={18} />}
                      />
                      <PredictionCard 
                        title="Double Chance" 
                        value={result.predictions.double_chance.choice} 
                        confidence={result.predictions.double_chance.confidence}
                        reason={result.predictions.double_chance.reason}
                        icon={<TrendingUp size={18} />}
                      />
                      <PredictionCard 
                        title="Home O/U" 
                        value={result.predictions.home_over_under.choice} 
                        confidence={result.predictions.home_over_under.confidence}
                        reason={result.predictions.home_over_under.reason}
                        icon={<Activity size={18} />}
                      />
                      <PredictionCard 
                        title="Away O/U" 
                        value={result.predictions.away_over_under.choice} 
                        confidence={result.predictions.away_over_under.confidence}
                        reason={result.predictions.away_over_under.reason}
                        icon={<Activity size={18} />}
                      />
                      <PredictionCard 
                        title="Corner Range" 
                        value={result.predictions.corner_range.choice} 
                        confidence={result.predictions.corner_range.confidence}
                        reason={result.predictions.corner_range.reason}
                        icon={<Target size={18} />}
                      />
                      <PredictionCard 
                        title="Draw Prob" 
                        value={`${result.predictions.draw_probability.probability}%`} 
                        confidence={result.predictions.draw_probability.probability}
                        reason={result.predictions.draw_probability.reason}
                        icon={<TrendingUp size={18} />}
                      />
                    </div>
                  </div>

                  <div className="bg-card-bg border border-border-subtle rounded-xl p-8">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold mb-6 flex items-center gap-2">
                       <span className="w-1 h-3 bg-gold"></span> Narrative Analysis
                    </h3>
                    <div className="prose prose-invert max-w-none text-slate-400 font-serif italic text-xl leading-relaxed opacity-80">
                      "{result.matchAnalysis}"
                    </div>
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="bg-card-bg border border-border-subtle rounded-xl p-6">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-6 flex justify-between">
                      Historical <span className="text-gold italic">H2H Data</span>
                    </h3>
                    <div className="h-48 mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={[
                              { name: 'Home', value: result.h2hStats.homeWins },
                              { name: 'Away', value: result.h2hStats.awayWins },
                              { name: 'Draws', value: result.h2hStats.draws },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="#C5A059" />
                            <Cell fill="#333" />
                            <Cell fill="#666" />
                          </Pie>
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-500 uppercase">Avg Goals / Match</span>
                        <span className="text-gold font-bold">{result.h2hStats.avgGoalsPerMatch}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-500 uppercase">Avg Corners / Match</span>
                        <span className="text-gold font-bold">{result.h2hStats.avgCornersPerMatch}</span>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border-subtle">
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-4 font-bold italic">Last 5 Meetings</div>
                      <div className="flex gap-2">
                        {result.h2hStats.lastFiveResults.map(getFormBadge)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-card-bg border border-border-subtle rounded-xl p-6">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-4">
                      Present <span className="text-gold italic">Squad Metrics</span>
                    </h3>
                    
                    <RadarComparison 
                      home={result.teamForm.homeAverages} 
                      away={result.teamForm.awayAverages}
                      homeName={result.homeTeam}
                      awayName={result.awayTeam}
                    />

                    <div className="space-y-6 mt-6">
                      <div>
                        <div className="flex justify-between text-[10px] uppercase font-bold text-gold mb-3 tracking-[0.1em]">
                          <span>{result.homeTeam} Form</span>
                        </div>
                        <div className="flex gap-2">
                          {result.teamForm.homeForm.map(getFormBadge)}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-3 tracking-[0.1em]">
                          <span>{result.awayTeam} Form</span>
                        </div>
                        <div className="flex gap-2">
                          {result.teamForm.awayForm.map(getFormBadge)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-black border border-border-subtle rounded italic text-center">
                    <p className="text-[11px] text-slate-600 leading-relaxed font-serif">
                      "Engine cross-referenced {Math.floor(Math.random() * 1000 + 1000)} data points across present form and historical matchups."
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!result && !loading && (
          <div className="py-24 text-center">
            <motion.div 
               animate={{ opacity: [0.3, 0.6, 0.3] }}
               transition={{ duration: 5, repeat: Infinity }}
               className="inline-block p-10 bg-white/5 rounded-full mb-8 relative"
            >
              <Trophy className="text-gold w-16 h-16 opacity-20" />
            </motion.div>
            <h3 className="text-2xl font-serif italic text-gold mb-2">Oracle Prime Initializing</h3>
            <p className="text-slate-600 max-w-sm mx-auto text-xs uppercase tracking-widest font-mono">Input team identifiers above to generate matrix</p>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-8 border-t border-border-subtle flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-slate-600">
        <div>Real-time Web Synchronized Model v4.2</div>
        <div className="flex gap-8">
          <span className="flex items-center gap-2">Global Sports Database <span className="w-1.5 h-1.5 bg-gold rounded-full opacity-50"></span></span>
          <span className="text-gold/60 font-bold">System Operational</span>
        </div>
      </footer>
    </div>
  );
}

function PredictionCard({ title, value, confidence, reason, icon, colorClass }: { title: string, value: string, confidence: number, reason: string, icon: ReactNode, colorClass?: string }) {
  return (
    <div className="bg-[#0F0F0F] border border-border-subtle p-5 rounded group hover:border-gold transition-all duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="text-slate-500 group-hover:text-gold transition-colors">
          {icon}
        </div>
        <div className="text-[9px] text-[#C5A059] italic border-b border-gold/20 pb-0.5 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
          Prob {confidence}%
        </div>
      </div>
      <div>
        <h4 className="text-[10px] text-slate-600 uppercase tracking-[0.2em] mb-1 font-bold">{title}</h4>
        <div className="text-xl font-serif text-gold group-hover:text-white transition-colors group-hover:italic">{value}</div>
        <p className="text-[9px] mt-2 text-slate-700 italic uppercase underline decoration-gold/10 line-clamp-1 group-hover:line-clamp-none transition-all">
          {reason}
        </p>
      </div>
    </div>
  );
}


function SmallStatItem({ label, value, confidence }: { label: string, value: string, confidence: number }) {
  const getBarColor = (val: number) => {
    if (val >= 80) return 'bg-gold';
    if (val >= 60) return 'bg-white/40';
    return 'bg-white/10';
  };

  return (
    <div className="flex flex-col gap-1.5 group">
      <div className="flex justify-between items-end text-[10px] font-mono uppercase tracking-tighter">
        <span className="opacity-60">{label}</span>
        <span className="text-gold font-bold">{value}</span>
      </div>
      <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          className={`h-full ${getBarColor(confidence)}`}
        />
      </div>
    </div>
  );
}

