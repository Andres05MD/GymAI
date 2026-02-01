"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { getExercises } from "@/actions/exercise-actions";

interface ExerciseSelectorProps {
    onSelect: (exercise: { id: string; name: string }) => void;
}

export function ExerciseSelector({ onSelect }: ExerciseSelectorProps) {
    const [open, setOpen] = React.useState(false);

    const { data: exercisesResult } = useQuery({
        queryKey: ["exercises"],
        queryFn: async () => await getExercises(),
    });

    const exercises = exercisesResult?.exercises || [];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    Seleccionar ejercicio...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Buscar ejercicio..." />
                    <CommandList>
                        <CommandEmpty>No encontrado.</CommandEmpty>
                        <CommandGroup>
                            {exercises.map((exercise: any) => (
                                <CommandItem
                                    key={exercise.id}
                                    value={exercise.name}
                                    onSelect={() => {
                                        onSelect({ id: exercise.id, name: exercise.name });
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4 opacity-0" // Selección única visual no necesaria aquí, es acción de agregar
                                        )}
                                    />
                                    {exercise.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
