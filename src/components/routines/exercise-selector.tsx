import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Plus, Search, Dumbbell } from "lucide-react";

interface ExerciseSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (exercise: { id?: string; name: string }) => void;
    availableExercises: { id: string; name: string }[];
}

export function ExerciseSelector({ open, onOpenChange, onSelect, availableExercises }: ExerciseSelectorProps) {
    // We rely on Command's internal filtering for simplicity with small lists
    // If list is huge, we'd manage filtered state manually
    const [searchValue, setSearchValue] = useState("");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 gap-0 bg-neutral-950 border-neutral-800 text-white sm:max-w-[500px] w-full max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader className="px-4 py-3 border-b border-neutral-800 bg-neutral-900">
                    <DialogTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-neutral-400">
                        <Search className="w-4 h-4" />
                        Seleccionar Ejercicio
                    </DialogTitle>
                </DialogHeader>

                <Command className="bg-transparent flex-1 overflow-hidden" shouldFilter={true}>
                    <div className="p-2">
                        <CommandInput
                            placeholder="Buscar ejercicios..."
                            className="bg-neutral-900 border-none rounded-lg h-12 text-base"
                            value={searchValue}
                            onValueChange={setSearchValue}
                        />
                    </div>

                    <CommandList className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-neutral-700">
                        <CommandEmpty className="py-10 text-center text-sm text-neutral-500 flex flex-col items-center gap-3">
                            <Dumbbell className="w-10 h-10 opacity-20" />
                            <p>No encontramos "{searchValue}"</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 border-dashed border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 hover:text-white"
                                onClick={() => {
                                    onSelect({ name: searchValue });
                                    onOpenChange(false);
                                }}
                            >
                                <Plus className="w-3 h-3 mr-2" />
                                Crear archivo para "{searchValue}"
                            </Button>
                        </CommandEmpty>

                        <CommandGroup heading="Biblioteca" className="text-neutral-500">
                            {availableExercises.map((ex) => (
                                <CommandItem
                                    key={ex.id}
                                    value={ex.name}
                                    onSelect={() => {
                                        onSelect(ex);
                                        onOpenChange(false);
                                    }}
                                    className="data-[selected='true']:bg-red-600 data-[selected='true']:text-white text-neutral-300 py-3 px-3 rounded-lg mb-1 cursor-pointer transition-colors"
                                >
                                    <span className="font-medium text-base">{ex.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
