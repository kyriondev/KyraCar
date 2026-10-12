import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 24, strokeWidth = 1.6, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function GaugeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 17a8.5 8.5 0 1 1 15 0" />
      <path d="M12 16.5l3.6-5" />
      <circle cx="12" cy="16.5" r="1" />
    </Icon>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </Icon>
  );
}

export function PulseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12h4l2.2-6 4 12 2.3-6H21" />
    </Icon>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 4h11a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2V4z" />
      <path d="M6 18a2 2 0 0 1 2-2h11" />
    </Icon>
  );
}

export function CarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 14.5l1.8-5.2A2 2 0 0 1 7.2 8h9.6a2 2 0 0 1 1.9 1.3l1.8 5.2V18h-3v-1.5H6.5V18h-3z" />
      <circle cx="7.5" cy="13" r="0.8" />
      <circle cx="16.5" cy="13" r="0.8" />
    </Icon>
  );
}
