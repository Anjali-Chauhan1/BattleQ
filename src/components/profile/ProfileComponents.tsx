"use client";

export function HistoryRow({ result, reward, mode, date, color }: any) {
    const resultColor = color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-500' : 'text-yellow-400';
    return (
        <div className="flex items-center justify-between p-5 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
            <div className="flex items-center gap-6">
                <div className={`text-sm font-black uppercase tracking-tighter ${resultColor}`}>{result}</div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold">{mode}</span>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{date}</span>
                </div>
            </div>
            <div className="text-right">
                <span className={`text-sm font-black ${color === 'green' ? 'text-primary' : 'text-gray-400'}`}>{reward}</span>
            </div>
        </div>
    )
}

export function DashboardStat({ label, value, subValue }: any) {
    return (
        <div className="flex flex-col">
            <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest mb-1">{label}</span>
            <span className="text-sm font-bold text-white uppercase">{value}</span>
            {subValue && <span className="text-[7px] text-primary font-black mt-1 uppercase opacity-70 tracking-widest">{subValue}</span>}
        </div>
    )
}
