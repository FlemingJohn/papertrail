import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon({ children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M14.5 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
      <path d="M14.5 2.5V7H19" />
      <path d="M9 12.5h6M9 16h4" />
    </BaseIcon>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 15.5V3.5" />
      <path d="m8 7.5 4-4 4 4" />
      <path d="M4 15v3.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V15" />
    </BaseIcon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </BaseIcon>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20.5h15.6a2 2 0 0 0 1.7-3.1L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4.5M12 17h.01" />
    </BaseIcon>
  );
}

export function ProblemIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-7 7M8.5 8.5l7 7" />
    </BaseIcon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </BaseIcon>
  );
}

export function PendingIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" strokeDasharray="2 3" />
    </BaseIcon>
  );
}

export function SpinnerIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3.5a8.5 8.5 0 1 1-8.5 8.5" />
    </BaseIcon>
  );
}

export function ScaleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3.5v17" />
      <path d="M7 20.5h10" />
      <path d="M5 7.5h14" />
      <path d="m5 7.5-2.5 6a3 3 0 0 0 5 0Z" />
      <path d="m19 7.5-2.5 6a3 3 0 0 0 5 0Z" />
    </BaseIcon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </BaseIcon>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5" />
      <path d="M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" />
    </BaseIcon>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 16v-5M12.5 16V7M17 16v-3" />
    </BaseIcon>
  );
}

export function FlaskIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M10 3.5v6L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9.5v-6" />
      <path d="M8.5 3.5h7" />
      <path d="M7.5 14.5h9" />
    </BaseIcon>
  );
}

export function BranchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="7" cy="5" r="2.5" />
      <circle cx="7" cy="19" r="2.5" />
      <circle cx="17" cy="12" r="2.5" />
      <path d="M7 7.5v9" />
      <path d="M9.5 5h2.5a2.5 2.5 0 0 1 2.5 2.5v2" />
    </BaseIcon>
  );
}

export function CoinIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.2a3 3 0 0 0-2.5-1.2c-1.4 0-2.5.8-2.5 2s1.1 2 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2a3 3 0 0 1-2.5-1.2" />
      <path d="M12 6v12" />
    </BaseIcon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4.5 12h15" />
      <path d="m14 6.5 5.5 5.5-5.5 5.5" />
    </BaseIcon>
  );
}
