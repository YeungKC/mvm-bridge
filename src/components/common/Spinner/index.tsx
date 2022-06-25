import { memo } from 'react';

interface PropsType {
  className?: string;
  size?: number;
}

export const Spinner = memo(({ className, size }: PropsType) => (
  <svg
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    stroke="currentColor"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`animate-spin ${className || 'stroke-primary'}`}
  >
    <path
      d="M21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));

export const FullSpinner = memo((props: PropsType) => (
  <div className="container flex h-screen w-screen items-center justify-center">
    <Spinner {...props} />
  </div>
));
