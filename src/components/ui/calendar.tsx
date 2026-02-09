"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4 w-full",
                month_caption: "flex justify-center pt-1 relative items-center mb-4",
                caption_label: "text-sm font-medium text-white",
                nav: "space-x-1 flex items-center",
                button_previous: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white border-neutral-800 hover:bg-neutral-800 absolute left-1 z-10"
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white border-neutral-800 hover:bg-neutral-800 absolute right-1 z-10"
                ),
                month_grid: "w-full border-collapse",
                weekdays: "grid grid-cols-7 mb-2",
                weekday: "text-neutral-500 rounded-md w-full font-normal text-[0.8rem] text-center",
                week: "grid grid-cols-7 w-full mt-1",
                day: "h-9 w-full text-center text-sm p-0 m-0 relative flex items-center justify-center",
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-8 w-8 p-0 font-normal aria-selected:opacity-100 text-white hover:bg-neutral-800 hover:text-white rounded-md transition-colors"
                ),
                range_end: "day-range-end",
                selected: "bg-red-600 text-white hover:bg-red-600 hover:text-white focus:bg-red-600 focus:text-white rounded-md",
                today: "bg-neutral-800 text-white border border-neutral-700",
                outside: "text-neutral-500 opacity-50 aria-selected:bg-neutral-800/50 aria-selected:text-neutral-500 aria-selected:opacity-30",
                disabled: "text-neutral-500 opacity-50",
                range_middle: "aria-selected:bg-neutral-800 aria-selected:text-white",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ ...props }) => {
                    if (props.orientation === "left") {
                        return <ChevronLeft className="h-4 w-4" />
                    }
                    return <ChevronRight className="h-4 w-4" />
                }
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
