import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg bg-muted/20", className)}>
            {Icon && (
                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                </div>
            )}
            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mb-4">
                {description}
            </p>
            {action && (
                <Button onClick={action.onClick} variant="default">
                    {action.label}
                </Button>
            )}
        </div>
    );
}
