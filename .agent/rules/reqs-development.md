---
trigger: model_decision
description: if there is new requiremnts and bug, follow below workflow
---

# Development Workflow Rules

You must follow this 3-step process for every feature or significant code change.

## Step 1: Requirements Documentation
**Goal**: Convert vague ideas into concrete, testable requirements.
**Action**:
- Analyze the user's request.
- List specific functional and non-functional requirements.
- Define edge cases and boundary conditions.
- **Example**: Instead of 'User System', specify 'Email validation regex', 'Password complexity (8+ chars, 1 special)', 'Session timeout 15 mins'.

## Step 2: Design Documentation
**Goal**: Create technical specifications *before* writing code.
**Action**:
- Analyze existing code to understand impact.
- Create **Mermaid Data Flow Diagrams** to visualize logic.
- Define **TypeScript Interfaces** for data structures.
- Define **Database Schemas** (if applicable).
- Define **API Endpoints** (if applicable).
- **Constraint**: This must be done BEFORE any implementation code is written.

## Step 3: Tasks Decomposition
**Goal**: Break down the work into manageable, verifiable units.
**Action**:
- Create a list of atomic tasks.
- Define **Verification Criteria** for each task (how to prove it works).
- Identify **Dependencies** between tasks.
- Update 	ask.md with these items.