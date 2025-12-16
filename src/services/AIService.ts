import { Task, AISettings, DependencySuggestion, AIAnalysisReport, ProjectData, TaskStatus, Priority, TimeScale, ViewMode, DependencyType } from '../types';

export class AIService {
    private settings: AISettings;

    constructor(settings: AISettings) {
        this.settings = settings;
    }

    private async callOpenAI(prompt: string): Promise<string> {
        const url = `${this.settings.baseUrl || 'https://api.openai.com/v1'}/chat/completions`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.settings.apiKey}`
            },
            body: JSON.stringify({
                model: this.settings.model || 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2
            })
        });
        if (!response.ok) throw new Error(`OpenAI API Error: ${response.statusText}`);
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }

    private async callAnthropic(prompt: string): Promise<string> {
        const url = `${this.settings.baseUrl || 'https://api.anthropic.com/v1'}/messages`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.settings.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.settings.model || 'claude-3-opus-20240229',
                max_tokens: 4096,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        if (!response.ok) throw new Error(`Anthropic API Error: ${response.statusText}`);
        const data = await response.json();
        return data.content[0]?.text || '';
    }

    private async callGemini(prompt: string): Promise<string> {
        const url = `${this.settings.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/models'}/${this.settings.model || 'gemini-pro'}:generateContent?key=${this.settings.apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        if (!response.ok) throw new Error(`Gemini API Error: ${response.statusText}`);
        const data = await response.json();
        return data.candidates[0]?.content?.parts[0]?.text || '';
    }

    private async callZhipu(prompt: string): Promise<string> {
        // Zhipu AI (GLM) OpenAI-compatible interface
        // Docs: https://open.bigmodel.cn/dev/api#glm-4
        // Default Base: https://open.bigmodel.cn/api/coding/paas/v4
        const baseUrl = this.settings.baseUrl || 'https://open.bigmodel.cn/api/coding/paas/v4';
        const url = `${baseUrl}/chat/completions`;

        // Simple Bearer Auth (Direct API Key)
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.settings.apiKey}`
            },
            body: JSON.stringify({
                model: this.settings.model || 'glm-4.6',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Zhipu API Error Body:', errText);
            throw new Error(`Zhipu API Error: ${response.statusText} (${response.status})`);
        }

        const data = await response.json();
        console.log('Zhipu Raw Response:', JSON.stringify(data, null, 2));

        // OpenAI format response extraction
        return data.choices?.[0]?.message?.content || '';
    }

    async scanDependencies(tasks: Task[]): Promise<AIAnalysisReport> {
        if (!this.settings.apiKey) throw new Error("API Key is missing");

        const taskList = tasks.map(t => `- ID: ${t.id}, Name: "${t.name}"`).join('\n');

        const prompt = `
You are a Project Management AI Assistant. Analyze the following list of tasks for a project. 
Identify logical dependencies where one task should logically follow another based on standard industry practices (e.g., Construction, Software, Event Planning).
Look for "Missing Dependencies" where Task B likely cannot start until Task A is finished, but no dependency exists (assume no dependencies are provided in this list, just infer from names).

Input Tasks:
${taskList}

Return a JSON object with the following structure:
{
    "summary": "Brief summary of the analysis",
    "suggestions": [
        { "sourceId": "ID_OF_PREDECESSOR", "targetId": "ID_OF_SUCCESSOR", "reason": "Why this dependency is needed", "confidence": "High" }
    ],
    "issues": ["List of potential circular logic or gaps if any"]
}
Only return valid JSON. Do not include markdown code blocks.
`;

        let rawResponse = '';
        try {
            switch (this.settings.provider) {
                case 'openai': rawResponse = await this.callOpenAI(prompt); break;
                case 'anthropic': rawResponse = await this.callAnthropic(prompt); break;
                case 'gemini': rawResponse = await this.callGemini(prompt); break;
                case 'zhipu': rawResponse = await this.callZhipu(prompt); break;
                default: throw new Error("Invalid Provider");
            }

            if (!rawResponse || !rawResponse.trim()) {
                console.error("AI returned empty response. Raw:", rawResponse);
                throw new Error("AI returned empty response");
            }

            // Attempt to extract JSON if embedded in text
            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
            const cleanJson = jsonMatch ? jsonMatch[0] : rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();

            let result;
            try {
                result = JSON.parse(cleanJson);
            } catch (e) {
                console.error("Failed to parse JSON:", cleanJson);
                throw new Error("AI returned invalid JSON format");
            }

            // Map IDs back to names
            const suggestions: DependencySuggestion[] = (result.suggestions || []).map((s: any) => ({
                sourceId: s.sourceId,
                targetId: s.targetId,
                sourceName: tasks.find(t => t.id === s.sourceId)?.name || 'Unknown',
                targetName: tasks.find(t => t.id === s.targetId)?.name || 'Unknown',
                reason: s.reason,
                confidence: s.confidence || 'Medium'
            }));

            return {
                summary: result.summary || "Analysis complete.",
                suggestions,
                issues: result.issues || [],
                timestamp: Date.now()
            };

        } catch (error) {
            console.error("AI Scan Error:", error);
            throw error;
        }
    }

    generateDummyProject(): ProjectData {
        const today = new Date();
        const createDate = (offset: number) => {
            const d = new Date(today);
            d.setDate(today.getDate() + offset);
            return d;
        };

        // Construction Project with Missing Dependencies
        const tasks: Task[] = [
            { id: 't1', name: 'Site Preparation', start: createDate(0), end: createDate(5), duration: 6, progress: 0, type: 'task', status: TaskStatus.NotStarted, priority: Priority.High },
            { id: 't2', name: 'Dig Foundation', start: createDate(0), end: createDate(5), duration: 6, progress: 0, type: 'task', status: TaskStatus.NotStarted, priority: Priority.High }, // Should depend on Site Prep
            { id: 't3', name: 'Pour Concrete Foundation', start: createDate(6), end: createDate(10), duration: 5, progress: 0, type: 'task', status: TaskStatus.NotStarted, priority: Priority.High }, // Should depend on Dig
            { id: 't4', name: 'Build Exterior Walls', start: createDate(2), end: createDate(10), duration: 9, progress: 0, type: 'task', status: TaskStatus.NotStarted, priority: Priority.Medium }, // Illogical start
            { id: 't5', name: 'Install Roof', start: createDate(11), end: createDate(15), duration: 5, progress: 0, type: 'task', status: TaskStatus.NotStarted, priority: Priority.Medium }, // Depends on Walls
            { id: 't6', name: 'Interior Plumbing', start: createDate(12), end: createDate(18), duration: 7, progress: 0, type: 'task', status: TaskStatus.NotStarted, priority: Priority.Medium },
            { id: 't7', name: 'Electrical Wiring', start: createDate(12), end: createDate(18), duration: 7, progress: 0, type: 'task', status: TaskStatus.NotStarted, priority: Priority.Medium },
            { id: 't8', name: 'Install Windows', start: createDate(8), end: createDate(10), duration: 3, progress: 0, type: 'task', status: TaskStatus.NotStarted, priority: Priority.Low }, // Should be after walls?
        ];

        return {
            tasks,
            dependencies: [], // Intentionally empty to test AI
            members: [],
            settings: {
                showDependencies: true,
                includeWeekends: false,
                holidays: [],
                makeUpDays: [],
                workingDayHours: 8,
                projectFilename: 'Dummy_Construction_Project'
            }
        };
    }

    generateMarkdownReport(report: AIAnalysisReport): string {
        return `
# AI Dependency Analysis Report
**Generated:** ${new Date(report.timestamp).toLocaleString()}

## Summary
${report.summary}

## Issues Identified
${report.issues.length > 0 ? report.issues.map(i => `- ${i}`).join('\n') : "No critical issues identified."}

## Suggested Dependencies
| Predecessor (Source) | Successor (Target) | Confidence | Reasoning |
|----------------------|--------------------|------------|-----------|
${report.suggestions.map(s => `| **${s.sourceName}** | **${s.targetName}** | ${s.confidence} | ${s.reason} |`).join('\n')}

---
*Generated by ProGantt AI Assistant*
`;
    }
}
