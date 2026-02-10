import { motion } from 'framer-motion';

interface FrequencyDialProps {
  frequency: string; // e.g., "101.9 FM"
  stationName: string;
  min?: number;
  max?: number;
  className?: string;
  theme?: 'light' | 'dark';
}

export function FrequencyDial({
  frequency,
  stationName,
  min = 88,
  max = 108,
  className = '',
  theme = 'light'
}: FrequencyDialProps) {
  // Parse frequency to get the number
  const freqNum = parseFloat(frequency) || 101.9;

  // Calculate angle for the indicator (arc from -90deg to 90deg)
  const percentage = (freqNum - min) / (max - min);
  const angle = -90 + (percentage * 180);

  // Generate tick marks for the dial
  const ticks = [];
  for (let i = min; i <= max; i++) {
    if (i % 2 === 0) { // Show every 2 MHz
      const tickAngle = -90 + ((i - min) / (max - min)) * 180;
      ticks.push({
        value: i,
        angle: tickAngle,
        isMajor: i % 4 === 0
      });
    }
  }

  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const dialColor = theme === 'dark' ? 'stroke-white/30' : 'stroke-gray-300';
  const indicatorColor = theme === 'dark' ? 'stroke-red-500' : 'stroke-red-600';

  return (
    <div className={`relative ${className}`}>
      {/* Frequency Arc */}
      <svg
        viewBox="0 0 200 120"
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
      >
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={dialColor}
          opacity="0.3"
        />

        {/* Tick marks */}
        {ticks.map((tick) => {
          const tickRad = (tick.angle * Math.PI) / 180;
          const innerRadius = 75;
          const outerRadius = tick.isMajor ? 85 : 82;
          const x1 = 100 + innerRadius * Math.cos(tickRad);
          const y1 = 100 + innerRadius * Math.sin(tickRad);
          const x2 = 100 + outerRadius * Math.cos(tickRad);
          const y2 = 100 + outerRadius * Math.sin(tickRad);

          return (
            <g key={tick.value}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeWidth={tick.isMajor ? "2" : "1"}
                className={dialColor}
              />
              {tick.isMajor && (
                <text
                  x={100 + 95 * Math.cos(tickRad)}
                  y={100 + 95 * Math.sin(tickRad)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-[8px] font-medium ${textColor}`}
                  opacity="0.7"
                >
                  {tick.value}
                </text>
              )}
            </g>
          );
        })}

        {/* Frequency indicator line */}
        <motion.line
          x1="100"
          y1="100"
          x2={100 + 70 * Math.cos((angle * Math.PI) / 180)}
          y2={100 + 70 * Math.sin((angle * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className={indicatorColor}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Center dot */}
        <circle
          cx="100"
          cy="100"
          r="3"
          fill="currentColor"
          className={indicatorColor}
        />
      </svg>

      {/* Frequency Display */}
      <motion.div
        className="text-center mt-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        key={frequency}
      >
        <div className={`text-sm font-medium ${textColor} opacity-70`}>
          {frequency}
        </div>
        <div className={`text-lg font-bold ${textColor}`}>
          {stationName}
        </div>
      </motion.div>
    </div>
  );
}
