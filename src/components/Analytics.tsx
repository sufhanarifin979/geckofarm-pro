import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  PieChart,
  Pie
} from 'recharts';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { UserProfile, Clutch, Gecko } from '../types';
import { format, subMonths, startOfMonth, isAfter } from 'date-fns';
import { Activity, TrendingUp, PieChart as PieChartIcon, Target } from 'lucide-react';

interface AnalyticsProps {
  profile: UserProfile | null;
}

export default function Analytics({ profile }: AnalyticsProps) {
  const [populationData, setPopulationData] = useState<any[]>([]);
  const [successRateData, setSuccessRateData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Population Trend (Geckos added over last 6 months)
        const geckosSnap = await getDocs(query(
          collection(db, 'geckos'),
          where('ownerId', '==', profile.uid),
          orderBy('createdAt', 'asc')
        ));
        
        const geckos = geckosSnap.docs.map(doc => doc.data() as Gecko);
        
        // Group by month
        const monthlyPopulation: { [key: string]: number } = {};
        const months = Array.from({ length: 6 }).map((_, i) => {
          const d = subMonths(new Date(), 5 - i);
          return format(d, 'MMM yyyy');
        });
        
        months.forEach(m => monthlyPopulation[m] = 0);
        
        let cumulative = 0;
        // This is a bit tricky since we want cumulative but only for the last 6 months displayed
        // We'll calculate cumulative starting from the beginning
        
        const allMonths: { [key: string]: number } = {};
        geckos.forEach(g => {
          if (g.createdAt) {
            const date = g.createdAt.toDate ? g.createdAt.toDate() : new Date(g.createdAt);
            const m = format(date, 'MMM yyyy');
            allMonths[m] = (allMonths[m] || 0) + 1;
          }
        });

        // Filter and calculate cumulative for the last 6 months
        const sortedMonths = Object.keys(allMonths).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        
        const popTrend = months.map(m => {
          // Calculate total up to this month
          let total = 0;
          geckos.forEach(g => {
             if (g.createdAt) {
                const date = g.createdAt.toDate ? g.createdAt.toDate() : new Date(g.createdAt);
                if (date <= startOfMonth(new Date(m).getTime() + 86400000 * 32)) { // roughly end of month
                   total++;
                }
             }
          });
          return { name: m, total };
        });
        
        setPopulationData(popTrend);

        // 2. Breeding Success Rate (Hatched vs Failed eggs)
        const clutchesSnap = await getDocs(query(
          collection(db, 'clutches'),
          where('ownerId', '==', profile.uid)
        ));
        
        const clutches = clutchesSnap.docs.map(doc => doc.data() as Clutch);
        
        const successData = [
          { name: 'Hatched', value: clutches.reduce((sum, c) => sum + (c.hatchedCount || 0), 0) },
          { name: 'Failed', value: clutches.reduce((sum, c) => sum + (c.eggCount - (c.hatchedCount || 0)), 0) }
        ];
        
        setSuccessRateData(successData);

        // 3. Status Distribution
        const statuses = geckos.reduce((acc: any, g) => {
          acc[g.status] = (acc[g.status] || 0) + 1;
          return acc;
        }, {});
        
        setStatusData(Object.entries(statuses).map(([name, value]) => ({ name: name.toUpperCase(), value })));

      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Calculating Metrics...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b'];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between px-1 md:px-0">
        <h2 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
          <Activity className="text-emerald-500" size={20} />
          Business Analytics
        </h2>
        <div className="hidden sm:block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
          Live Insights
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Population Trend */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" />
            <h3 className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Population Growth</h3>
          </div>
          <div className="h-[200px] md:h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={populationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breeding Success */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-emerald-500" />
            <h3 className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Breeding Success Rate</h3>
          </div>
          <div className="h-[200px] md:h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={successRateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {successRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '10px',
                    fontWeight: 700
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 md:col-span-2">
          <div className="flex items-center gap-2">
            <PieChartIcon size={16} className="text-amber-500" />
            <h3 className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Inventory Status Distibution</h3>
          </div>
          <div className="h-[200px] md:h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
