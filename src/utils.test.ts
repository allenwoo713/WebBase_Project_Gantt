import { calculateCriticalPath, diffProjectDays, addProjectDays, getTaskX, getTaskWidth, calculateColumnWidth } from './utils';
import { Task, Dependency, ProjectSettings, DependencyType, TaskStatus, Priority, TimeScale } from './types';

// Mock Data Helpers
const createDate = (day: number) => new Date(2024, 0, day); // Jan 2024

const mockSettings: ProjectSettings = {
    showDependencies: true,
    includeWeekends: false, // Standard working days (Mon-Fri)
    holidays: [],
    makeUpDays: [],
    workingDayHours: 8
};

const createMockTask = (id: string, startDay: number, endDay: number): Task => ({
    id,
    name: `Task ${id}`,
    start: createDate(startDay),
    end: createDate(endDay),
    duration: endDay - startDay + 1,
    progress: 0,
    type: 'task',
    status: TaskStatus.NotStarted,
    priority: Priority.Medium
});

const createDep = (source: string, target: string): Dependency => ({
    id: `${source}-${target}`,
    sourceId: source,
    targetId: target,
    type: DependencyType.FS
});

// Tests
async function runTests() {
    console.log('Running Critical Path Tests...');
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

    const assertCloseTo = (actual: number, expected: number, message: string) => {
        if (Math.abs(actual - expected) < 0.1) {
            console.log(`✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${message} (Expected ${expected}, got ${actual})`);
            failed++;
        }
    };

    // Test 1: Simple Linear Path
    {
        const tasks = [
            createMockTask('A', 1, 2),
            createMockTask('B', 3, 4),
            createMockTask('C', 5, 6)
        ];
        const deps = [
            createDep('A', 'B'),
            createDep('B', 'C')
        ];

        const critical = calculateCriticalPath(tasks, deps, mockSettings);
        assert(critical.has('A') && critical.has('B') && critical.has('C'), 'Simple Linear Path: All tasks critical');
    }

    // Test 2: Branching Path
    {
        const tasks = [
            createMockTask('A', 1, 2),
            createMockTask('B', 3, 4),
            createMockTask('C', 3, 6),
            createMockTask('D', 7, 8)
        ];
        const deps = [
            createDep('A', 'B'),
            createDep('A', 'C'),
            createDep('B', 'D'),
            createDep('C', 'D')
        ];

        const critical = calculateCriticalPath(tasks, deps, mockSettings);
        assert(critical.has('A'), 'Branching: A is critical');
        assert(!critical.has('B'), 'Branching: B is NOT critical (has float)');
        assert(critical.has('C'), 'Branching: C is critical');
        assert(critical.has('D'), 'Branching: D is critical');
    }

    // Test 3: Weekend Handling
    {
        const tasks = [
            createMockTask('A', 5, 5), // Friday Jan 5, 2024
            createMockTask('B', 8, 8)  // Monday Jan 8, 2024
        ];
        const deps = [createDep('A', 'B')];

        const critical = calculateCriticalPath(tasks, deps, mockSettings);
        assert(critical.has('A'), 'Weekend: A is critical');
        assert(critical.has('B'), 'Weekend: B is critical');
    }

    // Test 4: Disconnected Tasks
    {
        const tasks = [
            createMockTask('A', 1, 5),
            createMockTask('B', 1, 2)
        ];
        const deps: Dependency[] = [];

        const critical = calculateCriticalPath(tasks, deps, mockSettings);
        assert(critical.has('A'), 'Disconnected: Longest task A is critical');
        assert(!critical.has('B'), 'Disconnected: Short task B is NOT critical');
    }

    console.log('\nRunning Gantt Rendering Tests...');
    const columnWidth = 50;
    const gridStart = new Date(2024, 0, 1); // Jan 1 2024 (Monday)

    // Test 5: Day View X
    {
        const date = new Date(2024, 0, 3); // Jan 3 (+2 days)
        const x = getTaskX(date, gridStart, TimeScale.Day, columnWidth);
        assert(x === 2 * columnWidth, 'Day View: X coordinate correct');
    }

    // Test 6: Week View X (Start of Week)
    {
        const date = new Date(2024, 0, 8); // Jan 8 (+1 week)
        const x = getTaskX(date, gridStart, TimeScale.Week, columnWidth);
        assert(x === 1 * columnWidth, 'Week View: X coordinate (Start of Week)');
    }

    // Test 7: Week View X (Mid Week)
    {
        const date = new Date(2024, 0, 4); // Jan 4 (Thursday, +3 days)
        const x = getTaskX(date, gridStart, TimeScale.Week, columnWidth);
        // 3 days / 7 days = 0.428...
        assertCloseTo(x, (3 / 7) * columnWidth, 'Week View: X coordinate (Mid Week)');
    }

    // Test 8: Month View X
    {
        const date = new Date(2024, 1, 1); // Feb 1 (+1 Month)
        const x = getTaskX(date, gridStart, TimeScale.Month, columnWidth);
        assert(x === 1 * columnWidth, 'Month View: X coordinate');
    }

    // Test 9: Year View X
    {
        const date = new Date(2025, 0, 1); // Jan 1 2025 (+1 Year)
        const x = getTaskX(date, gridStart, TimeScale.Year, columnWidth);
        assert(x === 1 * columnWidth, 'Year View: X coordinate');
    }

    // Test 10: Day View Width
    {
        const start = new Date(2024, 0, 1);
        const end = new Date(2024, 0, 3); // 3 days
        const w = getTaskWidth(start, end, TimeScale.Day, columnWidth);
        assert(w === 3 * columnWidth, 'Day View: Width correct');
    }

    console.log('\nRunning Column Width Calculation Tests...');
    // Test 11: Calculate Column Width (Day View)
    {
        const containerWidth = 1040; // 1000 available
        const viewDays = 50;
        const w = calculateColumnWidth(TimeScale.Day, viewDays, containerWidth);
        // 1000 / 50 = 20
        assert(w === 20, 'Column Width: Day View (Exact)');
    }

    // Test 12: Calculate Column Width (Day View - Min Width)
    {
        const containerWidth = 1040; // 1000 available
        const viewDays = 100; // 1000 / 100 = 10 < 20
        const w = calculateColumnWidth(TimeScale.Day, viewDays, containerWidth);
        assert(w === 20, 'Column Width: Day View (Min Width)');
    }

    // Test 13: Calculate Column Width (Week View)
    {
        const containerWidth = 1040; // 1000 available
        const viewDays = 70; // 10 weeks
        const w = calculateColumnWidth(TimeScale.Week, viewDays, containerWidth);
        // (1000 * 7) / 70 = 100
        assert(w === 100, 'Column Width: Week View');
    }

    // Test 14: Calculate Column Width (Month View)
    {
        const containerWidth = 1040; // 1000 available
        const viewDays = 300; // 10 months
        const w = calculateColumnWidth(TimeScale.Month, viewDays, containerWidth);
        // (1000 * 30) / 300 = 100
        assert(w === 100, 'Column Width: Month View');
    }

    // Test 15: Calculate Column Width (Year View)
    {
        const containerWidth = 1040; // 1000 available
        const viewDays = 3650; // 10 years
        const w = calculateColumnWidth(TimeScale.Year, viewDays, containerWidth);
        // (1000 * 365) / 3650 = 100
        assert(w === 100, 'Column Width: Year View');
    }

    console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) process.exit(1);
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
