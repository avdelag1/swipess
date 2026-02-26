import { memo } from 'react';
import { cn } from '@/lib/utils';

interface LogoSymbolProps {
    className?: string;
    size?: number | string;
}

export const LogoSymbol = memo(function LogoSymbol({ className, size = 24 }: LogoSymbolProps) {
    return (
        <svg
            viewBox="0 0 1024 1024"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("select-none", className)}
            style={{ width: size, height: size }}
        >
            <defs>
                <linearGradient id="sGradientLogo" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#FF8E53', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#F97316', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#EA580C', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            <path
                d="M610 180
           C590 164 556 148 526 140
           C496 132 470 130 440 130
           Q350 130 290 180
           Q230 230 230 310
           Q230 380 270 430
           Q310 480 390 520
           L510 572
           Q600 608 648 660
           Q696 712 696 784
           Q696 862 642 910
           Q588 958 510 958
           Q440 958 386 924
           Q332 890 306 840
           L220 876
           Q252 940 316 980
           Q380 1020 460 1020
           Q462 1020 510 1020
           Q610 1016 680 964
           Q750 912 770 840
           Q790 768 778 700
           Q766 644 720 600
           Q674 556 628 536
           L508 484
           Q428 452 392 416
           Q356 380 356 332
           Q356 278 400 244
           Q444 210 502 210
           Q548 210 588 234
           Q612 248 630 268
           L630 268
           C646 240 666 208 686 186
           C706 164 726 148 742 142
           C758 136 770 140 770 154
           C770 168 756 188 736 210
           C716 232 686 252 660 268
           L630 268
           L610 180
           Z
           M660 268
           C686 228 716 186 738 162
           C754 146 766 144 772 150
           C778 156 774 170 762 188
           C742 214 714 240 688 258
           C672 266 662 268 660 268
           Z"
                fill="url(#sGradientLogo)"
                fillRule="evenodd"
                className="drop-shadow-[0_4px_12px_rgba(249,115,22,0.4)]"
            />
        </svg>
    );
});
