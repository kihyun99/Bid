import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format, subDays, isWithinInterval, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Calendar,
    Key,
    AlertCircle,
    ExternalLink,
    Clock,
    Building2,
    Tag,
    Loader2,
    RefreshCw,
    LayoutDashboard,
    Bell,
    Settings,
    Menu,
    X,
    ChevronRight,
    TrendingUp,
    FileText,
    Filter,
    Download,
    Copy,
    Check
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for Tailwind classes
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const API_BASE_URL = 'http://apis.data.go.kr/1230000/ao/PubDataOpnStdService/getDataSetOpnStdBidPblancInfo';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 rounded-2xl relative overflow-hidden group"
    >
        <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-10 group-hover:scale-110 transition-transform duration-500", color)} />
        <div className="flex justify-between items-start mb-4">
            <div className={cn("p-3 rounded-xl", color.replace('bg-', 'bg-opacity-20 text-'))}>
                <Icon size={24} />
            </div>
            {trend && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <TrendingUp size={12} /> {trend}
                </span>
            )}
        </div>
        <div className="flex flex-col">
            <span className="text-slate-400 text-sm font-medium">{title}</span>
            <span className="text-3xl font-bold mt-1 tracking-tight">{value}</span>
        </div>
    </motion.div>
);

function App() {
    console.log("App Rendering...");
    const [apiKey, setApiKey] = useState(localStorage.getItem('pps_api_key') || '');
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 3), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [bidList, setBidList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [copied, setCopied] = useState(null);

    // Persistence
    useEffect(() => {
        localStorage.setItem('pps_api_key', apiKey);
    }, [apiKey]);

    const fetchBids = async () => {
        if (!apiKey) {
            setError('API 인증키가 필요합니다. 상단 설정에서 입력해주세요.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const bgnDt = startDate.replace(/-/g, '') + '0000';
            const endDt = endDate.replace(/-/g, '') + '2359';

            const response = await axios.get(API_BASE_URL, {
                params: {
                    ServiceKey: apiKey,
                    type: 'json',
                    bidNtceBgnDt: bgnDt,
                    bidNtceEndDt: endDt,
                    numOfRows: 50,
                    pageNo: 1,
                }
            });

            const data = response.data.response;

            if (data?.header?.resultCode !== '00') {
                setError(`${data?.header?.resultMsg || '인증 오류가 발생했습니다. 키를 확인해주세요.'}`);
                setBidList([]);
            } else {
                const items = data?.body?.items || [];
                setBidList(items);
                if (items.length === 0) setError('검색 결과가 없습니다.');
            }
        } catch (err) {
            setError('데이터를 불러오는 중 오류가 발생했습니다. CORS 설정을 확인하거나 나중에 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const total = bidList.length;
        const urgent = bidList.filter(b => b.bidNtceNm.includes('긴급')).length;
        const closingToday = bidList.filter(b => {
            if (!b.bidClseDate) return false;
            return b.bidClseDate === format(new Date(), 'yyyyMMdd');
        }).length;

        return [
            { title: '전체 공고', value: total, icon: FileText, color: 'bg-sky-500', trend: '+12%' },
            { title: '긴급 공고', value: urgent, icon: AlertCircle, color: 'bg-amber-500', trend: '주의' },
            { title: '오늘 마감', value: closingToday, icon: Clock, color: 'bg-rose-500', trend: '임박' },
        ];
    }, [bidList]);

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
            <div className="bg-blob blob-1" />
            <div className="bg-blob blob-2" />

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: sidebarOpen ? 280 : 80 }}
                className="glass-panel border-r border-white/5 h-screen relative z-20 hidden md:flex flex-col transition-all duration-300"
            >
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/20">
                        <LayoutDashboard className="text-white" size={24} />
                    </div>
                    {sidebarOpen && (
                        <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            BidDash
                        </span>
                    )}
                </div>

                <nav className="flex-1 px-4 mt-4 flex flex-col gap-2">
                    <div className="nav-item active">
                        <LayoutDashboard size={20} />
                        {sidebarOpen && <span>대시보드</span>}
                    </div>
                    <div className="nav-item">
                        <Bell size={20} />
                        {sidebarOpen && <span>실시간 알림</span>}
                    </div>
                    <div className="nav-item">
                        <FileText size={20} />
                        {sidebarOpen && <span>나의 공고</span>}
                    </div>
                    <div className="nav-item">
                        <Settings size={20} />
                        {sidebarOpen && <span>시스템 설정</span>}
                    </div>
                </nav>

                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center hover:bg-sky-500 transition-colors"
                >
                    <ChevronRight size={14} className={cn("transition-transform", sidebarOpen && "rotate-180")} />
                </button>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10">
                {/* Top Header */}
                <header className="sticky top-0 z-20 glass-panel border-b border-white/5 px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button className="md:hidden p-2 hover:bg-white/5 rounded-lg"><Menu size={20} /></button>
                        <h2 className="text-xl font-bold">나라장터 입찰 실시간 통계</h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={16} />
                            <input
                                type="password"
                                placeholder="API Key 입력"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm w-48 focus:w-64 focus:border-sky-500 transition-all outline-none"
                            />
                        </div>

                        <div className="flex items-center bg-slate-900/50 border border-slate-700 rounded-xl px-2">
                            <Calendar className="text-slate-500 ml-2" size={16} />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none py-2 px-2 text-sm outline-none"
                            />
                            <span className="text-slate-600">~</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none py-2 px-2 text-sm outline-none"
                            />
                        </div>

                        <button
                            onClick={fetchBids}
                            disabled={loading}
                            className="px-6 py-2 premium-gradient rounded-xl font-bold flex items-center gap-2 hover:opacity-90 active:scale-95 disabled:grayscale transition-all shadow-xl shadow-sky-500/10"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                            검색
                        </button>
                    </div>
                </header>

                <div className="p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
                    </div>

                    {/* List Section */}
                    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col flex-1 min-h-[500px]">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/20">
                            <div className="flex items-center gap-2">
                                <FileText size={20} className="text-sky-400" />
                                <h3 className="font-bold">입찰 공고 리스트</h3>
                                <span className="text-xs bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full border border-sky-500/20 ml-2">
                                    {bidList.length}건
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400"><Filter size={18} /></button>
                                <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400"><Download size={18} /></button>
                            </div>
                        </div>

                        {error ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                    <AlertCircle className="text-rose-500/50 mb-4 mx-auto" size={64} />
                                    <h4 className="text-xl font-bold mb-2 text-slate-300">데이터 조회 실패</h4>
                                    <p className="text-slate-500 max-w-sm">{error}</p>
                                </motion.div>
                            </div>
                        ) : bidList.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-900/40 text-slate-400 text-xs uppercase tracking-wider sticky top-0">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">구분 / 공고번호</th>
                                            <th className="px-6 py-4 font-semibold">입찰공고명</th>
                                            <th className="px-6 py-4 font-semibold">공고기관</th>
                                            <th className="px-6 py-4 font-semibold">입찰마감</th>
                                            <th className="px-6 py-4 font-semibold">기타</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        <AnimatePresence mode="popLayout">
                                            {bidList.map((bid, i) => {
                                                const isUrgent = bid.bidNtceNm.includes('긴급');
                                                const isClose = bid.bidClseDate === format(new Date(), 'yyyyMMdd');

                                                return (
                                                    <motion.tr
                                                        key={`${bid.bidNtceNo}-${i}`}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        className="hover:bg-sky-500/[0.03] group transition-colors"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-xs font-bold text-sky-400 opacity-80 uppercase">{bid.bsnsDivNm}</span>
                                                                <div className="flex items-center gap-2 group/id">
                                                                    <span className="text-sm font-mono text-slate-500">{bid.bidNtceNo}</span>
                                                                    <button
                                                                        onClick={() => copyToClipboard(bid.bidNtceNo, bid.bidNtceNo)}
                                                                        className="opacity-0 group-hover/id:opacity-100 transition-opacity"
                                                                    >
                                                                        {copied === bid.bidNtceNo ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-600 hover:text-white" />}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 w-[40%]">
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex gap-2">
                                                                    {isUrgent && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">긴급</span>}
                                                                    {isClose && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">오늘마감</span>}
                                                                </div>
                                                                <a
                                                                    href={bid.bidNtceUrl}
                                                                    target="_blank"
                                                                    className="text-sm font-semibold hover:text-sky-400 transition-colors line-clamp-2 leading-relaxed"
                                                                >
                                                                    {bid.bidNtceNm}
                                                                </a>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                                <Building2 size={14} className="text-slate-500" />
                                                                <span>{bid.ntceInsttNm}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className={cn("flex flex-col text-sm", isClose ? "text-rose-400 font-bold" : "text-slate-300")}>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Clock size={14} className={isClose ? "animate-pulse" : "text-slate-500"} />
                                                                    <span>{bid.bidClseDate?.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}</span>
                                                                </div>
                                                                <span className="text-xs opacity-60 ml-5">{bid.bidClseTm?.replace(/(\d{2})(\d{2})/, '$1:$2')}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <a
                                                                href={bid.bidNtceUrl}
                                                                target="_blank"
                                                                className="p-2 hover:bg-sky-500/20 rounded-lg text-sky-400 opacity-0 group-hover:opacity-100 transition-all inline-block"
                                                            >
                                                                <ExternalLink size={18} />
                                                            </a>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center text-slate-500">
                                <Search className="mb-4 opacity-20" size={64} />
                                <p>상단에서 검색 조건을 설정하고 조회 버튼을 눌러주세요.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
