import React, { ReactNode, KeyboardEvent } from "react";

interface KeyboardAccessibleProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  tabIndex?: number; // optional, defaults to 0
  role?: string; // optional, defaults to "button"
  style?: React.CSSProperties;
}

const KeyboardAccessible: React.FC<KeyboardAccessibleProps> = ({
  onClick,
  children,
  className,
  tabIndex = 0,
  role = "button",
  style,
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault(); // prevent scroll on Space
      onClick();
    }
  };

  return (
    <div
      role={role}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
};

export default KeyboardAccessible;
