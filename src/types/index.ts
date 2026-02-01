import { z } from "zod";
import {
    UserSchema,
    ExerciseSchema,
    RoutineSchema,
    RoutineDaySchema,
    RoutineExerciseSchema,
    RoutineSetSchema,
    TrainingLogSchema
} from "@/lib/schemas";

export type User = z.infer<typeof UserSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Routine = z.infer<typeof RoutineSchema>;
export type RoutineDay = z.infer<typeof RoutineDaySchema>;
export type RoutineExercise = z.infer<typeof RoutineExerciseSchema>;
export type RoutineSet = z.infer<typeof RoutineSetSchema>;
export type TrainingLog = z.infer<typeof TrainingLogSchema>;

// Tipos de Rol y Género para uso directo
export type UserRole = "athlete" | "coach";
export type Gender = "male" | "female" | "other";
