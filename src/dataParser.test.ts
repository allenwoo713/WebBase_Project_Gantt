/**
 * Data Parser Tests
 * Tests for the parseTasks function to ensure proper date conversion
 * from JSON strings to Date objects.
 */

import { parseTasks } from './dataParser';
import { TaskStatus, Priority } from './types';

async function runTests() {
    console.log('Running Data Parser Tests...');
    let passed = 0;
    let failed = 0;

    const assert = (condition: boolean, message: string) => {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${message}`);
            failed++;
        }
    };

    // Test 1: Basic date parsing
    {
        const rawTasks = [{
            id: '1',
            name: 'Test Task',
            start: '2024-01-01T00:00:00.000Z',
            end: '2024-01-05T00:00:00.000Z',
            duration: 5,
            progress: 50,
            type: 'task'
        }];

        const parsed = parseTasks(rawTasks);
        assert(parsed[0].start instanceof Date, 'Basic: start is Date object');
        assert(parsed[0].end instanceof Date, 'Basic: end is Date object');
        assert(!isNaN(parsed[0].start.getTime()), 'Basic: start.getTime() works');
        assert(!isNaN(parsed[0].end.getTime()), 'Basic: end.getTime() works');
    }

    // Test 2: actualStart and actualEnd string conversion (THE BUG FIX)
    {
        const rawTasks = [{
            id: '2',
            name: 'Task with Actuals',
            start: '2024-01-01T00:00:00.000Z',
            end: '2024-01-05T00:00:00.000Z',
            actualStart: '2024-01-02T00:00:00.000Z',
            actualEnd: '2024-01-06T00:00:00.000Z',
            duration: 5,
            progress: 100,
            type: 'task'
        }];

        const parsed = parseTasks(rawTasks);
        assert(parsed[0].actualStart instanceof Date, 'Actuals: actualStart is Date object');
        assert(parsed[0].actualEnd instanceof Date, 'Actuals: actualEnd is Date object');
        assert(!isNaN(parsed[0].actualStart!.getTime()), 'Actuals: actualStart.getTime() works');
        assert(!isNaN(parsed[0].actualEnd!.getTime()), 'Actuals: actualEnd.getTime() works');
    }

    // Test 3: undefined actualStart/actualEnd (should remain undefined)
    {
        const rawTasks = [{
            id: '3',
            name: 'No Actuals',
            start: '2024-01-01T00:00:00.000Z',
            end: '2024-01-05T00:00:00.000Z',
            duration: 5,
            progress: 0,
            type: 'task'
        }];

        const parsed = parseTasks(rawTasks);
        assert(parsed[0].actualStart === undefined, 'No Actuals: actualStart is undefined');
        assert(parsed[0].actualEnd === undefined, 'No Actuals: actualEnd is undefined');
    }

    // Test 4: Empty tasks array
    {
        const parsed = parseTasks([]);
        assert(parsed.length === 0, 'Empty: returns empty array');
    }

    // Test 5: Null/undefined input safety
    {
        const parsed = parseTasks(null as any);
        assert(parsed.length === 0, 'Null input: returns empty array');
    }

    // Test 6: Default field values
    {
        const rawTasks = [{
            id: '6',
            name: 'Minimal Task',
            start: '2024-01-01T00:00:00.000Z',
            end: '2024-01-05T00:00:00.000Z',
            duration: 5,
            progress: 0
        }];

        const parsed = parseTasks(rawTasks);
        assert(parsed[0].status === TaskStatus.NotStarted, 'Defaults: status has default');
        assert(parsed[0].priority === Priority.Medium, 'Defaults: priority has default');
        assert(parsed[0].type === 'task', 'Defaults: type has default');
        assert(Array.isArray(parsed[0].assignments), 'Defaults: assignments is array');
        assert(parsed[0].ownerEffort === 100, 'Defaults: ownerEffort has default');
    }

    console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) process.exit(1);
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
