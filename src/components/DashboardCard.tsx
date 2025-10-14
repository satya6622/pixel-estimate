import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  className?: string;
}

export const DashboardCard = ({
  title,
  description,
  icon,
  onClick,
  className,
}: DashboardCardProps) => {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-border",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center p-8 text-center gap-4">
        <div className="p-4 rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};
