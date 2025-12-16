import { AIService } from './AIService';
import { Task, AISettings, TaskStatus, Priority } from '../types';

// Simple Assertion Helper
function assert(condition: boolean, message: string) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
    } else {
        console.error(`❌ FAIL: ${message}`);
        process.exit(1);
    }
}

// Mock Data
const mockTasks: Task[] = [
    { id: '1', name: 'Task 1', start: new Date(), end: new Date(), duration: 1, progress: 0, type: 'task', status: TaskStatus.NotStarted, priority: Priority.Medium },
    { id: '2', name: 'Task 2', start: new Date(), end: new Date(), duration: 1, progress: 0, type: 'task', status: TaskStatus.NotStarted, priority: Priority.Medium }
];

const mockSettings: AISettings = {
    provider: 'openai',
    apiKey: 'test-key',
    model: 'gpt-test'
};

const mockOpenAIResponse = {
    choices: [{
        message: {
            content: JSON.stringify({
                summary: 'Test Analysis',
                suggestions: [
                    { sourceId: '1', targetId: '2', reason: 'Test Reason', confidence: 'High' }
                ],
                issues: []
            })
        }
    }]
};

async function runTests() {
    console.log('Running AIService Tests...');

    // Test 1: Generate Dummy Project
    console.log('\nTest: generateDummyProject');
    {
        const service = new AIService(mockSettings);
        const project = service.generateDummyProject();
        assert(project.tasks.length > 0, 'Tasks should be generated');
        assert(project.settings.projectFilename === 'Dummy_Construction_Project', 'Filename should be correct');
        assert(!!project.tasks[0].id, 'Tasks should have IDs');
    }

    // Test 2: Scan Dependencies (Mock Fetch)
    console.log('\nTest: scanDependencies');
    {
        const originalFetch = global.fetch;
        let fetchCalled = false;
        let requestBody: any = null;

        // Mock Fetch
        global.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
            fetchCalled = true;
            if (init && init.body) {
                requestBody = JSON.parse(init.body as string);
            }
            return {
                ok: true,
                json: async () => mockOpenAIResponse
            } as Response;
        };

        const service = new AIService(mockSettings);
        const report = await service.scanDependencies(mockTasks);

        assert(fetchCalled, 'Fetch should be called');
        assert(requestBody.model === 'gpt-test', 'Model should be passed correctly');
        assert(report.suggestions.length === 1, 'Should return 1 suggestion');
        assert(report.suggestions[0].sourceName === 'Task 1', 'Suggestion source name correct');

        // Restore Fetch
        global.fetch = originalFetch;
    }

    // Test 3: API Error Handling
    console.log('\nTest: API Error Handling');
    {
        const originalFetch = global.fetch;
        global.fetch = async () => {
            return {
                ok: false,
                statusText: 'Unauthorized'
            } as Response;
        };

        const service = new AIService(mockSettings);
        try {
            await service.scanDependencies(mockTasks);
            assert(false, 'Should have thrown error');
        } catch (e: any) {
            assert(e.message.includes('Unauthorized'), 'Error message should match');
        }

        global.fetch = originalFetch;
    }

    // Test 4: Zhipu (OpenAI Format - Bearer)
    console.log('\nTest: Zhipu Provider');
    {
        const originalFetch = global.fetch;
        let requestHeaders: any = null;
        let fetchUrl: string = '';

        global.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
            fetchUrl = url.toString();
            if (init) requestHeaders = init.headers;
            return {
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                summary: 'Zhipu Test',
                                suggestions: [],
                                issues: []
                            })
                        }
                    }]
                })
            } as Response;
        };

        const service = new AIService({
            provider: 'zhipu',
            apiKey: 'zhipu-key',
            model: 'glm-4.6'
        });

        const report = await service.scanDependencies(mockTasks);

        assert(fetchUrl.includes('open.bigmodel.cn/api/coding/paas/v4/chat/completions'), 'URL should point to Zhipu Coding V4 endpoint');
        assert(requestHeaders['Authorization'] === 'Bearer zhipu-key', 'Should use Bearer token header');
        assert(report.summary === 'Zhipu Test', 'Should parse Zhipu response');

        global.fetch = originalFetch;
    }

    console.log('\nAll Tests Passed!');
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
