import type React from "react";
import type { IconName } from "./schema";

const paths: Record<IconName, React.ReactNode> = {
  focus: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  streak: (
    <path d="M12 2.5c.5 3.2 4.5 5.4 4.5 10a4.5 4.5 0 0 1-9 0c0-2 1-3.4 2.2-4.4.2 1.6 1 2.6 2 3 0-3.2-.6-5.8.3-8.6Z" />
  ),
  tasks: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="m8 12.2 2.8 2.8L16.5 9.3" />
    </>
  ),
  bolt: <path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12l1-8Z" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 2.8v4M16 2.8v4" />
    </>
  ),
  chart: <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />,
  sparkle: (
    <path d="M12 3c.7 4.4 2.6 6.3 7 7-4.4.7-6.3 2.6-7 7-.7-4.4-2.6-6.3-7-7 4.4-.7 6.3-2.6 7-7Z" />
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6L12 3Z" />
      <path d="m8.8 12 2.2 2.2 4.2-4.4" />
    </>
  ),
};

export const Icon: React.FC<{
  readonly name: IconName;
  readonly size: number;
  readonly color: string;
}> = ({ name, size, color }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ color }}
  >
    {paths[name]}
  </svg>
);
