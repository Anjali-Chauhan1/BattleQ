"use client";

interface ActionButtonProps {
    id?: string;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    color: 'blue' | 'purple' | 'pink';
    onClick?: () => void;
}

export function ActionButton({ id, icon, label, active, color, onClick }: ActionButtonProps) {
    const colorClass = color === 'blue' ? 'border-primary' : color === 'purple' ? 'border-secondary' : 'border-pink-500';
    return (
        <button 
          id={id}
          onClick={onClick}
          className={`flex flex-col items-center justify-center p-5 px-8 glass-panel transition-all hover:scale-110 ${active ? colorClass : 'border-white/5 opacity-50 hover:opacity-100'}`}
        >
            <div className={active ? `text-${color}` : 'text-white'}>{icon}</div>
            <span className="text-[10px] font-black uppercase mt-2 tracking-[0.2em]">{label}</span>
        </button>
    )
}
