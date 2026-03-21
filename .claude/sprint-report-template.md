# Sprint Report Template & Reference

## Overview
This document serves as a reference for creating and completing Sprint Reports in Jira for the Travora project (TM07).

---

## Sprint Report Story Structure

Every sprint requires a **Sprint Report** story with the following subtasks:
1. **SCRUM 1** - First sprint meeting
2. **SCRUM 2** - Second sprint meeting
3. **Sprint Review** - Outcomes and worklogs
4. **Retrospective** - Team reflection

---

## 1. SCRUM Meetings (Required: 2 per sprint)

### SCRUM Meeting Table Format
Copy this exact table into each SCRUM subtask description:

| Team Member | Have Done | Plan To Do | Roadblocks |
|-------------|-----------|------------|------------|
| [Full Name] | [Completed tasks] | [Planned tasks] | [None or specific blockers] |
| [Full Name] | [Completed tasks] | [Planned tasks] | [None or specific blockers] |
| [Full Name] | [Completed tasks] | [Planned tasks] | [None or specific blockers] |

**Rules:**
- Hold at least **2 SCRUMs per sprint**
- Use **tables directly in Jira** (no screenshots/attachments)
- Document attendance
- Mark SCRUM 1 and SCRUM 2 subtasks as Done separately

---

## 2. Sprint Review

### Review Content
Document in the Sprint Review subtask:
- **Outcomes**: What was accomplished
- **Major Events**: Important milestones, blockers, or changes
- **Rolled-over Stories**: Explanation of why any stories moved to next sprint

### Worklog Requirements
- **Log time directly in Jira worklogs** (no separate Time Log subtask)
- Each story should have **at least one worklog** (can have multiple)
- **Last worklog** must include artifact link aligned with acceptance criteria
- Every worklog must include:
  - Work description
  - GitHub commit/PR link OR `/artifacts` link OR `/docs` link

### Worklog Example
```
Time Spent: 2h
Work Description: Implemented video upload functionality with progress indicator
Artifact: https://github.com/owner/repo/commit/abc123
```

---

## 3. Retrospective

### Retrospective Table Format
**Required** - Use this exact header and order:

| Team Member | Went Well? | Could be Better? | How could be fixed? | Specific Actions |
|-------------|------------|------------------|---------------------|------------------|
| [Full Name] | [Positive outcomes] | [Areas for improvement] | [Suggested solutions] | [Actionable items] |
| [Full Name] | [Positive outcomes] | [Areas for improvement] | [Suggested solutions] | [Actionable items] |
| [Full Name] | [Positive outcomes] | [Areas for improvement] | [Suggested solutions] | [Actionable items] |

**Important:**
- Use each student's **real full name** (matching Jira display names)
- No nicknames, abbreviations, or initials
- Document attendance

---

## 4. Acceptance Criteria Field Setup

Every story must have a dedicated **Acceptance Criteria** field:

### Setup Instructions (One-time)
1. Jira Settings → Work items → Fields
2. Create custom field → Choose **Paragraph** (supports rich text)
3. Name it: **Acceptance Criteria**
4. Project settings → Fields → Add the Acceptance Criteria field
5. Project settings → Work types → **Story**
   - Place after Description
   - Mark as **required**
   - Save
6. (Optional) Repeat for Task and Subtask

**Rule:** Use the Acceptance Criteria field for every story. Do not hide acceptance criteria only in the Description.

---

## 5. SCRUM Master Schedule (Required)

Create a backlog story titled **"SCRUM Master Schedule"** (exact title).

### Schedule Table Format
Use this exact header:

| Sprint | Scrum Master |
|--------|--------------|
| 1 | [Full Name] |
| 2 | [Full Name] |
| 3 | [Full Name] |
| 4 | [Full Name] |
| 5 | [Full Name] |
| 6 | [Full Name] |
| 7 | [Full Name] |
| 8 | [Full Name] |
| 9 | [Full Name] |
| 10 | [Full Name] |
| 11 | [Full Name] |

**Rules:**
- One row per sprint (1-11)
- Use **full names** matching Jira display names
- Keep this story in the backlog (do not add to any sprint)

---

## 6. Backlog Refinement (Required)

- During **Sprint N**, prepare **Sprint N+1** stories before Sprint N+1 starts
- Each eligible next-sprint story must have:
  - **Assignee** assigned
  - **Story points** estimated (Fibonacci: 1, 2, 3, 5, 8, 13)
- Stories created **after** next sprint starts do not count
- Rolled-over stories do **not** count as backlog refinement

---

## 7. Story and Workflow Rules

### Every Story Must Have:
- [ ] Description
- [ ] Acceptance Criteria (in dedicated field)
- [ ] Story points (Fibonacci: 1, 2, 3, 5, 8, 13)
- [ ] Assignee

### Workflow
```
To Do → In Progress → Done
```

**Critical Rules:**
- **NEVER skip "In Progress"** - must spend at least 5 minutes
- Subtasks must be **Done** before parent story closes
- Log time **daily** on stories you work on

---

## 8. End-of-Sprint Checklist

Before marking a sprint complete:

- [ ] **SCRUM 1** table completed with attendance
- [ ] **SCRUM 2** table completed with attendance
- [ ] **Sprint Review** written with worklogs including GitHub/PR/artifacts/docs links
- [ ] **Retrospective** filled out with attendance
- [ ] All subtasks marked **Done**
- [ ] **Sprint Report** story closed
- [ ] Do NOT roll Sprint Report to next sprint - all subtasks must be Done

---

## 9. Common Mistakes to Avoid

| Don't Do | Do This Instead |
|----------|-----------------|
| Attach screenshots of SCRUM notes | Use tables directly in Jira |
| Attach retrospective as Word/PDF | Enter table in Retrospective description |
| Forget to log time | Use Jira worklogs on each story |
| Skip "In Progress" | Use proper workflow: To Do → In Progress → Done |
| Leave story points blank | Assign Fibonacci points (1,2,3,5,8,13) |
| Leave stories unassigned | Assign to a responsible team member |
| Mark Sprint Report Done early | Close only after all subtasks complete |

---

## Quick Reference: Story Points (Fibonacci)

| Points | Estimation |
|--------|------------|
| 1 | Very small, trivial |
| 2 | Small, straightforward |
| 3 | Medium, some complexity |
| 5 | Medium-high, complex |
| 8 | Large, very complex |
| 13 | Very large, may need breaking down |

---

## Jira Project Info

- **Project Key**: TM07
- **URL**: https://travora.atlassian.net
- **Cloud ID**: c1f31043-5388-4b56-a7cd-b1a02b30970e
