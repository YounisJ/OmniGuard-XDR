"use client";

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Activity, ShieldAlert, ShieldCheck, Database, Server, Cpu, Globe, Lock, Wifi, Smartphone, HardDrive, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const GlobeComponent = dynamic(() => import('react-globe.gl'), { ssr: false });

type TelemetryData = {
  timestamp: number;
  domain: string;
  protocol: string;
  service: string;
  total_bytes: number;
  risk_score: number;
  is_anomalous: boolean;
  label: string;
  lat: number;
  lng: number;
};

type ArcData = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
};

type SystemStatus = {
  engines: {name: string, status: string, load: string}[];
  federated: {active_nodes: number, sync_progress: number};
};

export default function Home() {
  const [logs, setLogs] = useState<TelemetryData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [threatCount, setThreatCount] = useState(0);
  const [chartData, setChartData] = useState<{time: string, safe: number, threat: number}[]>([]);
  const [arcs, setArcs] = useState<ArcData[]>([]);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const globeEl = useRef<any>();
  const serverRing = [{ lat: 40.71, lng: -74.00, color: '#3b82f6' }];
  
  const [sysStatus, setSysStatus] = useState<SystemStatus>({
    engines: [
      { name: 'Network Transformer', status: '99.9%', load: '42%' },
      { name: 'Host LSTM', status: '99.5%', load: '18%' },
      { name: 'Mobile Classifier', status: '98.2%', load: '8%' },
      { name: 'IoT Autoencoder', status: '97.1%', load: '12%' },
    ],
    federated: { active_nodes: 1204, sync_progress: 82 }
  });

  useEffect(() => {
    // Setup 3D Globe spinning and initial camera view
    const checkGlobe = setInterval(() => {
      if (globeEl.current) {
        globeEl.current.controls().autoRotate = true;
        globeEl.current.controls().autoRotateSpeed = 0.8;
        // Point camera exactly at New York (Central Server)
        globeEl.current.pointOfView({ lat: 40.71, lng: -74.00, altitude: 2.2 }, 2000);
        clearInterval(checkGlobe);
      }
    }, 500);
    return () => clearInterval(checkGlobe);
  }, []);

  useEffect(() => {
    const statusInterval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:8000/api/system_status");
        if (res.ok) setSysStatus(await res.json());
      } catch (e) {}
    }, 1000);
    return () => clearInterval(statusInterval);
  }, []);

  useEffect(() => {
    const initialChart = Array.from({length: 20}, (_, i) => ({ time: `-${20-i}s`, safe: 0, threat: 0 }));
    setChartData(initialChart);

    const ws = new WebSocket("ws://localhost:8000/ws/telemetry");

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      
      if (payload.type === 'alert') {
        setAlertMsg(payload.message);
        setTimeout(() => setAlertMsg(null), 5000);
        return;
      }
      
      if (payload.type === 'telemetry') {
        const data: TelemetryData = payload;
        
        setLogs((prev) => [data, ...prev].slice(0, 50));
        setTotalCount((c) => c + 1);
        
        if (data.is_anomalous) {
           setThreatCount((c) => c + 1);
           // Add arc to globe (Central server is roughly at 40, -74)
           setArcs(prev => [...prev.slice(-15), {
             startLat: data.lat, startLng: data.lng, endLat: 40.71, endLng: -74.00, color: '#ef4444'
           }]);
        }

        setChartData(prev => {
          const newData = [...prev];
          const lastIndex = newData.length - 1;
          const last = { ...newData[lastIndex] };
          if (data.is_anomalous) last.threat += 1;
          else last.safe += 1;
          newData[lastIndex] = last;
          return newData;
        });
      }
    };
    
    const interval = setInterval(() => {
      setChartData(prev => {
        const shifted = prev.slice(1);
        shifted.push({ time: new Date().toLocaleTimeString([], {hour12: false, second: '2-digit', minute: '2-digit'}), safe: 0, threat: 0 });
        return shifted;
      });
    }, 1000);

    return () => { ws.close(); clearInterval(interval); };
  }, []);

  const getIcon = (name: string) => {
    if (name.includes('Network')) return <Wifi className="w-4 h-4 text-blue-400"/>;
    if (name.includes('Host')) return <HardDrive className="w-4 h-4 text-emerald-400"/>;
    if (name.includes('Mobile')) return <Smartphone className="w-4 h-4 text-indigo-400"/>;
    return <Cpu className="w-4 h-4 text-purple-400"/>;
  };

  return (
    <main className="min-h-screen bg-[#050a15] text-slate-300 p-4 font-mono overflow-hidden h-screen flex flex-col relative">
      
      {/* Alert Overlay */}
      {alertMsg && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-900/40 backdrop-blur-sm pointer-events-none transition-all">
          <div className="bg-red-950 border-2 border-red-500 rounded-xl p-8 flex flex-col items-center shadow-[0_0_100px_rgba(239,68,68,0.5)] animate-bounce">
            <AlertTriangle className="w-24 h-24 text-red-500 mb-4 animate-pulse" />
            <h1 className="text-4xl font-bold text-red-400 mb-2">BYZANTINE ATTACK DETECTED</h1>
            <p className="text-xl text-red-300">{alertMsg}</p>
          </div>
        </div>
      )}

      <header className="flex justify-between items-center mb-4 px-2 shrink-0">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">OmniGuard XDR</h1>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">FEDERATED CORE:</span>
            <span className="text-green-400 flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> ONLINE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">GLOBAL DEFENSE:</span>
            <span className="text-blue-400">ACTIVE</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        
        {/* LEFT PANEL */}
        <div className="col-span-3 flex flex-col gap-4 min-h-0">
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex-1 flex flex-col min-h-0 transition-all">
            <h2 className="text-sm font-semibold text-slate-400 uppercase mb-4 flex items-center gap-2"><Cpu className="w-4 h-4"/> AI Neural Engines</h2>
            <div className="flex flex-col gap-3 overflow-y-auto pr-1 flex-1">
              {sysStatus.engines.map((engine, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800/50 p-3 rounded flex justify-between items-center transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 bg-slate-900 rounded`}>{getIcon(engine.name)}</div>
                    <div>
                      <div className="text-xs text-slate-300">{engine.name}</div>
                      <div className="text-[10px] text-slate-500">Load: <span className="text-slate-400">{engine.load}</span></div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-green-400">{engine.status}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={`bg-slate-900/80 border ${alertMsg ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'border-slate-800'} rounded-lg p-4 shrink-0 h-48 flex flex-col transition-all`}>
            <h2 className="text-sm font-semibold text-slate-400 uppercase mb-3 flex items-center gap-2"><Globe className="w-4 h-4"/> Federated Edge</h2>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-500">Active Nodes</span>
              <span className="text-sm text-slate-200 font-bold transition-all">{sysStatus.federated.active_nodes.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-500">Aggregation Strategy</span>
              <span className="text-xs text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded border border-indigo-800/50">FedMedian</span>
            </div>
            <div className="mt-auto">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1 transition-all">
                <span>Next Global Sync</span>
                <span>{sysStatus.federated.sync_progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                <div className={`h-1.5 rounded-full transition-all duration-1000 ease-linear ${alertMsg ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${sysStatus.federated.sync_progress}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER PANEL: Globe & Telemetry */}
        <div className="col-span-6 flex flex-col gap-4 min-h-0">
          {/* Globe Container */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg flex-1 overflow-hidden relative flex flex-col">
            <h2 className="absolute top-4 left-4 text-sm font-semibold text-slate-400 uppercase z-10 flex items-center gap-2"><Globe className="w-4 h-4"/> Global Threat Origin</h2>
            <div className="absolute inset-0 flex items-center justify-center mix-blend-screen pointer-events-none mt-4">
              <GlobeComponent
                ref={globeEl}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundColor="rgba(0,0,0,0)"
                arcsData={arcs}
                arcStartLat={(d: any) => d.startLat}
                arcStartLng={(d: any) => d.startLng}
                arcEndLat={(d: any) => d.endLat}
                arcEndLng={(d: any) => d.endLng}
                arcColor={(d: any) => d.color}
                arcDashLength={0.5}
                arcDashGap={0.1}
                arcDashAnimateTime={2000}
                arcAltitudeAutoScale={0.4}
                arcStroke={0.5}
                ringsData={serverRing}
                ringColor={(d: any) => d.color}
                ringMaxRadius={5}
                ringPropagationSpeed={2}
                ringRepeatPeriod={1000}
                width={700}
                height={700}
              />
            </div>
          </div>

          {/* Telemetry Matrix */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg shrink-0 h-64 flex flex-col overflow-hidden z-20">
            <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 shrink-0">
              <h2 className="text-sm font-semibold text-slate-400 uppercase flex items-center gap-2"><Database className="w-4 h-4"/> Telemetry Matrix</h2>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            </div>
            
            <div className="flex-1 overflow-auto p-0">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-950 z-10">
                  <tr className="text-slate-500 text-[10px] uppercase tracking-wider">
                    <th className="px-4 py-2 font-medium border-b border-slate-800">Domain</th>
                    <th className="px-4 py-2 font-medium border-b border-slate-800">Signature</th>
                    <th className="px-4 py-2 font-medium border-b border-slate-800">Threat Score</th>
                    <th className="px-4 py-2 font-medium border-b border-slate-800">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 15).map((log, i) => (
                    <tr key={i} className={`text-xs ${log.is_anomalous ? 'bg-red-950/20' : 'hover:bg-slate-800/30'} border-b border-slate-800/50 transition-colors`}>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-300">{log.domain}</span>
                      </td>
                      <td className="px-4 py-2 font-mono text-slate-400">{log.protocol}:{log.service}</td>
                      <td className="px-4 py-2">
                        <span className={log.is_anomalous ? 'text-red-400 font-bold' : 'text-slate-400'}>
                          {(log.risk_score * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {log.is_anomalous ? (
                          <span className="text-red-500 flex items-center gap-1"><Lock className="w-3 h-3"/> BLOCKED</span>
                        ) : (
                          <span className="text-slate-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> ALLOW</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Stats & Visualizer */}
        <div className="col-span-3 flex flex-col gap-4 min-h-0">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 shrink-0 flex flex-col justify-center relative overflow-hidden h-32">
             <div className="text-xs text-slate-500 mb-1">Packets Scanned</div>
             <div className="text-3xl font-bold text-white">{totalCount.toLocaleString()}</div>
          </div>
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 shrink-0 flex flex-col justify-center relative overflow-hidden h-32">
             <div className="absolute top-0 right-0 p-2"><ShieldAlert className="w-12 h-12 text-red-500/10" /></div>
             <div className="text-xs text-slate-500 mb-1 z-10">Anomalies Blocked</div>
             <div className="text-3xl font-bold text-red-400 z-10">{threatCount.toLocaleString()}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex-1 flex flex-col relative overflow-hidden">
            <h2 className="text-sm font-semibold text-slate-400 uppercase mb-2 flex items-center gap-2 z-10"><Activity className="w-4 h-4"/> Anomaly Density</h2>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent opacity-50"></div>
            <div className="flex-1 w-full z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorThreat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={5} />
                  <YAxis stroke="#475569" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '12px' }} itemStyle={{ color: '#cbd5e1' }} />
                  <Area type="monotone" dataKey="safe" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSafe)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="threat" stroke="#ef4444" fillOpacity={1} fill="url(#colorThreat)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
