import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon({ children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

const wash = "currentColor";

const washOpacity = 0.14;

export function DocumentIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M14.2 2.8H7.4a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h9.2a2 2 0 0 0 2-2V7.2z"
        fill={wash}
        fillOpacity={washOpacity}
        stroke="none"
      />
      <path d="M14.2 2.8H7.4a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h9.2a2 2 0 0 0 2-2V7.2z" />
      <path d="M14.2 2.8V7.2h4.4" />
      <path d="M8.6 12.4h6.8M8.6 15.6h4.8M8.6 9.2h2.4" />
    </BaseIcon>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M3.8 14.6v3.6a2.2 2.2 0 0 0 2.2 2.2h12a2.2 2.2 0 0 0 2.2-2.2v-3.6z"
        fill={wash}
        fillOpacity={washOpacity}
        stroke="none"
      />
      <path d="M12 15.4V3.4" />
      <path d="m7.8 7.6 4.2-4.2 4.2 4.2" />
      <path d="M3.8 14.6v3.6a2.2 2.2 0 0 0 2.2 2.2h12a2.2 2.2 0 0 0 2.2-2.2v-3.6" />
    </BaseIcon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9.2" fill={wash} fillOpacity={washOpacity} stroke="none" />
      <circle cx="12" cy="12" r="9.2" />
      <path d="m7.8 12.3 2.9 2.9 5.5-6.1" />
    </BaseIcon>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M10.3 3.9 2.6 17.3a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
        fill={wash}
        fillOpacity={washOpacity}
        stroke="none"
      />
      <path d="M10.3 3.9 2.6 17.3a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.2v4.6" />
      <circle cx="12" cy="16.9" r="0.9" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

export function ProblemIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9.2" fill={wash} fillOpacity={washOpacity} stroke="none" />
      <circle cx="12" cy="12" r="9.2" />
      <path d="m15.3 8.7-6.6 6.6M8.7 8.7l6.6 6.6" />
    </BaseIcon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9.2" fill={wash} fillOpacity={washOpacity} stroke="none" />
      <circle cx="12" cy="12" r="9.2" />
      <path d="M12 11.2v5" />
      <circle cx="12" cy="8.1" r="0.9" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

export function PendingIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9.2" strokeDasharray="1.6 3.2" />
      <circle cx="12" cy="12" r="2.2" fill={wash} fillOpacity={washOpacity} stroke="none" />
    </BaseIcon>
  );
}

export function SpinnerIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" strokeOpacity={0.2} />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </BaseIcon>
  );
}

export function ScaleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m5 7.6-2.6 6.2a3.1 3.1 0 0 0 5.2 0Z" fill={wash} fillOpacity={washOpacity} stroke="none" />
      <path d="m19 7.6-2.6 6.2a3.1 3.1 0 0 0 5.2 0Z" fill={wash} fillOpacity={washOpacity} stroke="none" />
      <path d="M12 3.2v17.6" />
      <path d="M7.4 20.8h9.2" />
      <path d="M4.6 7.6h14.8" />
      <path d="M12 5.4 5 7.6M12 5.4l7 2.2" />
      <path d="m5 7.6-2.6 6.2a3.1 3.1 0 0 0 5.2 0Z" />
      <path d="m19 7.6-2.6 6.2a3.1 3.1 0 0 0 5.2 0Z" />
      <circle cx="12" cy="3.9" r="1.1" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="10.6" cy="10.6" r="6.6" fill={wash} fillOpacity={washOpacity} stroke="none" />
      <circle cx="10.6" cy="10.6" r="6.6" />
      <path d="m15.4 15.4 4.8 4.8" />
      <path d="M8.2 10.6a2.4 2.4 0 0 1 2.4-2.4" strokeOpacity={0.55} />
    </BaseIcon>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M10.1 13.6a4.1 4.1 0 0 0 5.8 0l3-3a4.1 4.1 0 1 0-5.8-5.8l-1.5 1.5"
        fill={wash}
        fillOpacity={washOpacity}
        stroke="none"
      />
      <path d="M10.1 13.6a4.1 4.1 0 0 0 5.8 0l3-3a4.1 4.1 0 1 0-5.8-5.8l-1.5 1.5" />
      <path d="M13.9 10.4a4.1 4.1 0 0 0-5.8 0l-3 3a4.1 4.1 0 1 0 5.8 5.8l1.5-1.5" />
    </BaseIcon>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7.4 16.4V11h2.6v5.4zM12.7 16.4V7.2h2.6v9.2z" fill={wash} fillOpacity={washOpacity} stroke="none" />
      <path d="M4 3.6v16.8h16" />
      <path d="M7.4 16.4V11M10 16.4V11M12.7 16.4V7.2M15.3 16.4V7.2M18 16.4v-3.2" />
      <path d="M7.4 11h2.6M12.7 7.2h2.6" strokeOpacity={0.5} />
    </BaseIcon>
  );
}

export function FlaskIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M9.6 14.4h4.8l4.2 4.2a1.9 1.9 0 0 1-1.6 2.8H7a1.9 1.9 0 0 1-1.6-2.8Z"
        fill={wash}
        fillOpacity={washOpacity}
        stroke="none"
      />
      <path d="M9.8 3.4v6L4.6 18.2a2 2 0 0 0 1.7 3h11.4a2 2 0 0 0 1.7-3L14.2 9.4v-6" />
      <path d="M8.4 3.4h7.2" />
      <path d="M7.3 14.4h9.4" />
      <circle cx="10.4" cy="17.6" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="13.6" cy="18.6" r="0.6" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

export function BranchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="6.8" cy="5.2" r="2.6" fill={wash} fillOpacity={washOpacity} stroke="none" />
      <circle cx="6.8" cy="18.8" r="2.6" fill={wash} fillOpacity={washOpacity} stroke="none" />
      <circle cx="17.2" cy="12" r="2.6" fill={wash} fillOpacity={washOpacity} stroke="none" />
      <circle cx="6.8" cy="5.2" r="2.6" />
      <circle cx="6.8" cy="18.8" r="2.6" />
      <circle cx="17.2" cy="12" r="2.6" />
      <path d="M6.8 7.8v8.4" />
      <path d="M9.4 5.2h2.6a2.6 2.6 0 0 1 2.6 2.6v2" />
    </BaseIcon>
  );
}

export function CoinIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9.2" fill={wash} fillOpacity={washOpacity} stroke="none" />
      <circle cx="12" cy="12" r="9.2" />
      <circle cx="12" cy="12" r="6.4" strokeOpacity={0.4} />
      <path d="M14.4 9.4a3 3 0 0 0-2.4-1.1c-1.4 0-2.5.8-2.5 1.9s1.1 1.9 2.5 1.9 2.5.8 2.5 1.9-1.1 1.9-2.5 1.9a3 3 0 0 1-2.4-1.1" />
      <path d="M12 6.6v10.8" />
    </BaseIcon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3.8 12h16.4" />
      <path d="m14.4 6.2 5.8 5.8-5.8 5.8" />
    </BaseIcon>
  );
}

export function QuoteIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M4.4 15.4c0-4.2 2.2-7.2 5.6-8.6l.9 1.8c-2 1-3.2 2.6-3.4 4.4h2.7v6H4.4Z"
        fill={wash}
        fillOpacity={washOpacity}
        stroke="none"
      />
      <path d="M4.4 15.4c0-4.2 2.2-7.2 5.6-8.6l.9 1.8c-2 1-3.2 2.6-3.4 4.4h2.7v6H4.4Z" />
      <path d="M13.4 15.4c0-4.2 2.2-7.2 5.6-8.6l.9 1.8c-2 1-3.2 2.6-3.4 4.4h2.7v6h-5.8Z" />
    </BaseIcon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M12 2.8 4.6 6v6c0 4.4 3.1 8.2 7.4 9.2 4.3-1 7.4-4.8 7.4-9.2V6Z"
        fill={wash}
        fillOpacity={washOpacity}
        stroke="none"
      />
      <path d="M12 2.8 4.6 6v6c0 4.4 3.1 8.2 7.4 9.2 4.3-1 7.4-4.8 7.4-9.2V6Z" />
      <path d="m8.9 11.9 2.2 2.2 4-4.4" />
    </BaseIcon>
  );
}
