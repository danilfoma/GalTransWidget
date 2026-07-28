import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function BotIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <rect x="4" y="8" width="16" height="11" rx="3" />
      <path d="M12 8V4" />
      <circle cx="12" cy="3" r="1" />
      <path d="M9 13h.01" />
      <path d="M15 13h.01" />
      <path d="M9.5 16.5a3 3 0 0 0 5 0" />
    </svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <path d="M8 12h.01" />
      <path d="M12 12h.01" />
      <path d="M16 12h.01" />
    </svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={2.4} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function MinimizeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={2.4} {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  );
}

export function TicketIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M2 9a2 2 0 0 0 2-2V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2Z" />
      <path d="M10 4v13" />
    </svg>
  );
}

export function PriceIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm5.8 14.18c-.25.69-1.44 1.32-1.98 1.36-.53.05-.53.42-3.33-.7-2.8-1.1-4.55-3.96-4.69-4.15-.14-.19-1.12-1.49-1.12-2.84s.71-2.01.96-2.29c.25-.28.55-.35.73-.35.18 0 .37 0 .53.01.17.01.4-.07.62.48.25.6.83 2.07.9 2.22.07.14.12.32.02.51-.09.19-.14.31-.28.48-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.28.72 1.18 1.54 1.92 1.06.94 1.95 1.24 2.23 1.38.28.14.44.12.6-.07.16-.19.69-.8.87-1.08.18-.28.37-.23.62-.14.25.09 1.6.75 1.87.89.28.14.46.21.53.32.07.11.07.65-.18 1.34Z" />
    </svg>
  );
}

export function TelegramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.94 4.63 18.9 19.1c-.23 1.02-.84 1.27-1.7.79l-4.7-3.46-2.27 2.18c-.25.25-.46.46-.94.46l.34-4.78 8.7-7.86c.38-.34-.08-.53-.59-.19L6.7 13.2l-4.63-1.45c-1.01-.31-1.03-1.01.21-1.5L20.63 3.2c.84-.31 1.57.19 1.31 1.43Z" />
    </svg>
  );
}

export function ViberIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.02 2C9.2 2 5.6 2.4 3.9 4.4 2.6 5.9 2.4 8 2.4 10.9c0 2.9.2 5 1.5 6.5.5.6 1.3 1.1 2 1.4v2.6c0 .5.6.8 1 .5l2.3-2c.9.1 1.8.1 2.8.1 2.8 0 6.4-.4 8.1-2.4 1.3-1.5 1.5-3.6 1.5-6.5s-.2-5-1.5-6.5C18.4 2.4 14.8 2 12.02 2Zm5.1 12.5c-.2.6-1.1 1.2-1.6 1.3-.4.1-.9.2-2.6-.5-2.2-.9-3.6-3.1-3.7-3.2-.1-.1-.9-1.1-.9-2.1 0-1 .5-1.5.7-1.7.2-.2.4-.2.5-.2h.4c.1 0 .3-.05.5.4.2.5.6 1.6.7 1.7.05.1.08.25.02.4-.06.14-.1.23-.2.36l-.3.35c-.1.1-.2.2-.09.4.12.2.5.85 1.1 1.37.76.68 1.4.89 1.6.99.2.1.32.08.44-.05l.62-.72c.13-.16.26-.13.44-.07.18.07 1.14.54 1.34.64.2.1.33.14.38.22.05.09.05.47-.15 1.03Z" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M14 9h3l.5-3H14V4.5c0-.9.3-1.5 1.6-1.5H18V.2C17.6.1 16.4 0 15.1 0 12.3 0 10.5 1.7 10.5 4.8V6H8v3h2.5v9H14V9Z" />
    </svg>
  );
}
