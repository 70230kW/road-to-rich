import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'gradient' | 'ghost' | 'danger' | 'success';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function NeonButton({ variant = 'primary', children, className = '', ...rest }: NeonButtonProps) {
  if (variant === 'gradient') {
    return (
      <button
        {...rest}
        className={`relative group overflow-hidden rounded-2xl disabled:opacity-40 disabled:pointer-events-none ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-600 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0)_0%,rgba(255,255,255,0.3)_50%,rgba(255,255,255,0)_100%)] -skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
        <div className="relative flex items-center justify-center py-5 md:py-6 font-black text-lg md:text-xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] tracking-[0.1em] md:tracking-[0.15em] px-4">
          {children}
        </div>
      </button>
    );
  }

  if (variant === 'ghost') {
    return (
      <button
        {...rest}
        className={`px-6 py-3.5 rounded-2xl font-bold border-2 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white transition-all tracking-wider disabled:opacity-40 disabled:pointer-events-none ${className}`}
      >
        {children}
      </button>
    );
  }

  if (variant === 'success') {
    return (
      <button
        {...rest}
        className={`relative group overflow-hidden rounded-2xl disabled:opacity-40 disabled:pointer-events-none ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0)_0%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0)_100%)] -skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
        <div className="relative flex items-center justify-center py-4 md:py-5 font-black text-lg md:text-xl text-white drop-shadow-md tracking-widest px-4">
          {children}
        </div>
      </button>
    );
  }

  if (variant === 'danger') {
    return (
      <button
        {...rest}
        className={`px-5 py-3 rounded-xl font-bold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-all disabled:opacity-40 disabled:pointer-events-none ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      {...rest}
      className={`relative group overflow-hidden rounded-2xl disabled:opacity-40 disabled:pointer-events-none ${className}`}
    >
      <div className="absolute inset-0 bg-[#0a192f] border-2 border-cyan-700/50 group-hover:border-cyan-400 transition-colors duration-300 rounded-2xl" />
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      <div className="relative flex items-center justify-center py-4 md:py-5 font-black text-base md:text-lg text-cyan-300 group-hover:text-cyan-100 tracking-widest drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] px-4">
        {children}
      </div>
    </button>
  );
}
