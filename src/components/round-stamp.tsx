/**
 * Круглый «печать»-штамп: надпись по кругу + свежесть в центре.
 * Чистый SVG, без картинок и клиентского JS. Медленно вращается,
 * если пользователь не просил сократить анимацию.
 */

interface RoundStampProps {
  className?: string;
}

export function RoundStamp({ className }: RoundStampProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label="Свежая обжарка: зерно у вас на 1–3 день после обжарки"
      className={className}
    >
      <defs>
        <path
          id="round-stamp-circle"
          d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0"
          fill="none"
        />
      </defs>

      <circle cx="60" cy="60" r="58" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.35" />

      <g className="spin-slow" style={{ transformOrigin: "60px 60px", transformBox: "view-box" }}>
        <text
          fill="currentColor"
          fontFamily="var(--font-sans)"
          fontSize="8.2"
          fontWeight="600"
          letterSpacing="2.2"
        >
          <textPath href="#round-stamp-circle" startOffset="0%">
            СВЕЖАЯ ОБЖАРКА · КВАРТА · МИНСК ·
          </textPath>
        </text>
      </g>

      <text
        x="60"
        y="58"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="var(--font-display)"
        fontSize="18"
      >
        1–3
      </text>
      <text
        x="60"
        y="72"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="var(--font-sans)"
        fontSize="6.4"
        fontWeight="600"
        letterSpacing="1"
      >
        ДЕНЬ ПОСЛЕ
      </text>
      <text
        x="60"
        y="81"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="var(--font-sans)"
        fontSize="6.4"
        fontWeight="600"
        letterSpacing="1"
      >
        ОБЖАРКИ
      </text>
    </svg>
  );
}
