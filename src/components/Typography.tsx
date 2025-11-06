import { cn } from "@/lib/utils";

const Header: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <p className={cn("text-xl font-semibold", className)}>{children}</p>;
};

export { Header };

