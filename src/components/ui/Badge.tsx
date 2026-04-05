import { Shield, Star, Coins } from "lucide-react";

interface BadgeProps {
    icon?: React.ReactNode;
    label: string;
    color: 'blue' | 'purple' | 'pink' | 'primary' | 'secondary' | 'accent';
}

export function Badge({ icon, label, color }: BadgeProps) {
    const colorClass = 
        color === 'blue' || color === 'primary' ? 'border-primary text-primary bg-primary/10' : 
        color === 'purple' || color === 'secondary' ? 'border-secondary text-secondary bg-secondary/10' :
        'border-pink-500 text-pink-500 bg-pink-500/10';
        
    return (
        <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${colorClass}`}>
            {icon} {label}
        </div>
    );
}
