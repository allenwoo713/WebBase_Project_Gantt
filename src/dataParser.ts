/**
 * Data Parser Module
 * Handles parsing and migration of project data loaded from JSON.
 * Converts serialized date strings back to Date objects.
 */

import { Task, TaskStatus, Priority } from './types';

/**
 * Parses raw task data from JSON, converting date strings to Date objects.
 * This function handles data migration and ensures type safety when loading
 * projects from localStorage or files.
 * 
 * @param tasks - Raw task array from parsed JSON (dates are strings)
 * @returns Task[] with proper Date objects
 */
export const parseTasks = (tasks: any[]): Task[] => {
    return (tasks || []).map(t => ({
        ...t,
        // Convert date strings to Date objects
        start: new Date(t.start),
        end: new Date(t.end),
        actualStart: t.actualStart ? new Date(t.actualStart) : undefined,
        actualEnd: t.actualEnd ? new Date(t.actualEnd) : undefined,
        // Ensure new fields exist with defaults
        assignments: t.assignments || [],
        ownerEffort: t.ownerEffort ?? 100,
        baselineScore: t.baselineScore,
        score: t.score,
        deliverable: t.deliverable,
        role: t.role,
        description: t.description,
        // Ensure required fields have defaults
        status: t.status || TaskStatus.NotStarted,
        priority: t.priority || Priority.Medium,
        type: t.type || 'task'
    }));
};
