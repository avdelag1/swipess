
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./index.html",
		"./src/**/*.{ts,tsx}",
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
	],
	// Safelist for dynamically applied classes
	safelist: [
		// Theme classes
		'dark',
		'amber',
		'red',
		'grey-matte',
		'black-matte',
		'white-matte',
		'red-matte',
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
		fontFamily: {
			'brand': ['Quicksand', 'Poppins', 'system-ui', 'sans-serif'],
			'inter': ['Inter', 'system-ui', 'sans-serif'],
		},
			colors: {
				// Modern theme system with CSS variables - using HSL format
				'theme-primary': 'hsl(var(--bg-primary))',
				'theme-secondary': 'hsl(var(--bg-secondary))',
				'theme-tertiary': 'hsl(var(--bg-tertiary))',
				'theme-text-primary': 'hsl(var(--text-primary))',
				'theme-text-secondary': 'hsl(var(--text-secondary))',
				'theme-text-tertiary': 'hsl(var(--text-tertiary))',
				'theme-border-primary': 'hsl(var(--border-primary))',
				'theme-border-secondary': 'hsl(var(--border-secondary))',
				'theme-accent-primary': 'hsl(var(--accent-primary))',
				'theme-accent-secondary': 'hsl(var(--accent-secondary))',
				
				// Keep existing shadcn colors for compatibility
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			backgroundImage: {
				'theme-accent-gradient': 'var(--accent-gradient)',
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-button': 'var(--gradient-button)',
			},
			boxShadow: {
				'theme-sm': 'var(--shadow-sm)',
				'theme-md': 'var(--shadow-md)',
				'theme-lg': 'var(--shadow-lg)',
				'glow': 'var(--shadow-glow)',
				'card': 'var(--shadow-card)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'float-slow': {
					'0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.3' },
					'33%': { transform: 'translate(30px, -30px) scale(1.1)', opacity: '0.4' },
					'66%': { transform: 'translate(-20px, 20px) scale(0.9)', opacity: '0.35' }
				},
				'float-slower': {
					'0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.25' },
					'33%': { transform: 'translate(-40px, 30px) scale(1.15)', opacity: '0.3' },
					'66%': { transform: 'translate(25px, -25px) scale(0.95)', opacity: '0.28' }
				},
				'float-slowest': {
					'0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.2' },
					'33%': { transform: 'translate(35px, 40px) scale(1.2)', opacity: '0.25' },
					'66%': { transform: 'translate(-30px, -35px) scale(0.85)', opacity: '0.22' }
				},
				'float-medium': {
					'0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.25' },
					'33%': { transform: 'translate(-25px, -20px) scale(1.1)', opacity: '0.3' },
					'66%': { transform: 'translate(30px, 25px) scale(0.9)', opacity: '0.27' }
				},
				'bounce-gentle': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' }
				},
				'fade-in-up': {
					'0%': { opacity: '0', transform: 'translateY(20px) translateZ(0)' },
					'100%': { opacity: '1', transform: 'translateY(0) translateZ(0)' }
				},
				'slide-in-smooth': {
					'0%': { opacity: '0', transform: 'translateX(-30px) translateZ(0)' },
					'100%': { opacity: '1', transform: 'translateX(0) translateZ(0)' }
				},
				'elastic-bounce': {
					'0%': { transform: 'scale(1) translateZ(0)' },
					'30%': { transform: 'scale(1.15) translateZ(0)' },
					'40%': { transform: 'scale(0.95) translateZ(0)' },
					'60%': { transform: 'scale(1.05) translateZ(0)' },
					'80%': { transform: 'scale(0.98) translateZ(0)' },
					'100%': { transform: 'scale(1) translateZ(0)' }
				},
				'shimmer': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' }
				},
				'particle-burst': {
					'0%': { transform: 'scale(0) translateZ(0)', opacity: '1' },
					'100%': { transform: 'scale(2) translateZ(0)', opacity: '0' }
				},
				'glow-pulse': {
					'0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' },
					'50%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.8)' }
				},
				'skeleton-glow': {
					'0%, 100%': {
						boxShadow: '0 0 15px 3px rgba(255, 255, 255, 0.05)',
						opacity: '0.3'
					},
					'50%': {
						boxShadow: '0 0 30px 6px rgba(255, 255, 255, 0.15)',
						opacity: '0.6'
					}
				},
				'skeleton-shimmer': {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
				'fade-in-up': 'fade-in-up 0.6s ease-out',
				'slide-in-smooth': 'slide-in-smooth 0.5s ease-out',
				'elastic-bounce': 'elastic-bounce 0.6s ease-out',
				'shimmer': 'shimmer 1.2s ease-in-out infinite',
				'particle-burst': 'particle-burst 0.6s ease-out',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
				'skeleton-glow': 'skeleton-glow 2s ease-in-out infinite',
				'skeleton-shimmer': 'skeleton-shimmer 1.5s ease-in-out infinite',
				'float-slow': 'float-slow 20s ease-in-out infinite',
				'float-slower': 'float-slower 25s ease-in-out infinite',
				'float-slowest': 'float-slowest 30s ease-in-out infinite',
				'float-medium': 'float-medium 22s ease-in-out infinite'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
