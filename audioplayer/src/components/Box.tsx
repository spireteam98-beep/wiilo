import { cn } from "@/lib/utils";

interface BoxProps {
  children: React.ReactNode;
  className?: string;
}

export const Box: React.FC<BoxProps> = ({ children, className }) => {
  return (
    <div className={cn("bg-neutral-900 rounded-lg h-fit w-full", className)}>
      {children}
    </div>
  );
};
