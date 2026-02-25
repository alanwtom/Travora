# Travora Jira Workflow - Grading Best Practices

**Project:** Travora (TM07)
**Purpose:** Ensure all Jira work follows course grading criteria for maximum points

## CRITICAL: Workflow Rule (25% of grade)

```
To Do → In Progress (minimum 5 minutes work) → Done
```

**NEVER** skip "In Progress". **NEVER** go directly To Do → Done.

---

## When Starting Work on a Story

### Step 1: Move to In Progress
Before writing a single line of code, open the story in Jira and move it to "In Progress" status.

### Step 2: Log Time as You Work
Track time continuously. Don't batch it all at the end.

### Step 3: Write Detailed Worklogs
Every worklog must include:
- **What you did** - specific technical details
- **Results/Outcomes** - tests added, bugs fixed, features completed
- **GitHub commit or PR link** - for all non-code work, link to /artifacts or /docs

#### Example Excellent Worklog (90-100 points):
```
Implemented JWT token generation and validation for user authentication API. Added 12 unit tests achieving 95% coverage. Fixed bug where tokens expired after 1 hour — changed to 24-hour expiration. All tests passing. Commit: https://github.com/org/repo/commit/abc1234
```

#### Mediocre Worklog (75-89 points):
```
Completed auth API with JWT tokens. Fixed expiration bug. PR: https://github.com/org/repo/pull/123
```

#### Bad Worklog (0-49 points - AVOID):
```
"worked on story"
(empty)
```

### Step 4: When Fully Done → Move to "Done"

---

## SCRUM Meeting Updates (2x per sprint)

When filling SCRUM tables in Jira, use this format:

| Team Member | Have Done | Plan To Do | Roadblocks |
|-------------|-----------|------------|------------|
| Your Full Name | Specific work done (story IDs) | Specific next steps | Real blockers or "None" |

### Example Excellent SCRUM Update (90-100 points):
```
Have Done: Completed user auth API (PROJ-15). Implemented JWT token generation with 24h expiration. Added 12 unit tests with 95% coverage. Fixed token expiry bug found during testing.
Plan To Do: Start password reset feature (PROJ-20). Will integrate SendGrid email service and design email templates first.
Roadblocks: Waiting on SendGrid API key from Bob — he requested it Monday, expected by Wednesday. Will pivot to UI components if delayed.
```

### Poor Update (0-49 points - AVOID):
```
Have Done: worked on my story
Plan To Do: keep working
Roadblocks: none
```

**Important:** Use your real full name exactly as it appears on the class roster.

---

## Story Creation Standards (Team Grade - 15 points)

Every story MUST have:
- **Assignee** - one team member explicitly assigned
- **Story Points** - use Fibonacci numbers (1, 2, 3, 5, 8, 13)
- **Description** - what is being built and why
- **Acceptance Criteria** - specific, testable conditions in the dedicated AC field

### Example Good Acceptance Criteria:
```
POST /api/auth/login accepts email and password
Returns JWT token with 24-hour expiration on success
Returns 401 with error message for invalid credentials
Unit tests achieve at least 90% coverage for auth module
```

### Bad Acceptance Criteria (AVOID):
```
"It works"
"UI looks good"
```

---

## End of Sprint Checklist (Before Tuesday 11:59 PM ET)

- [ ] All your stories are in "Done" (or have Jira comment explaining rollover)
- [ ] Every story has time logged with detailed descriptions + GitHub/artifact links
- [ ] You appear in both SCRUM 1 and SCRUM 2 tables with complete updates
- [ ] Sprint Review written (accomplishments, highlights, rolled-over explanations)
- [ ] Retrospective table filled (Went Well / Could Be Better / How to Fix / Specific Actions)
- [ ] Attendance listed in Sprint Review and Retrospective (real full names)
- [ ] All subtasks (SCRUM 1, SCRUM 2, Sprint Review, Retrospective) marked Done
- [ ] Sprint Report story marked Done (after all subtasks)
- [ ] Sprint closed in Jira by Tuesday 11:59 PM ET

---

## Collaboration Points (15% of grade)

To maximize collaboration:
1. **Attend both SCRUMs** with real full name and detailed updates (60% of collaboration score)
2. **Log time on teammate stories** when you help them - even 30 minutes counts:
   - Logged time on 2+ teammate stories → +20 points
   - Logged time on 1 teammate story → +12 points
3. **Leave helpful Jira comments** with specific technical detail:
   - 3+ helpful comments → +20 points

---

## Common Mistakes to AVOID

| Mistake | Consequence |
|---------|-------------|
| Story goes To Do → Done without In Progress | Workflow violation (25% of grade) |
| Empty worklog descriptions | Low documentation score (30% of grade) |
| No GitHub commits during sprint | Lose all GitHub contribution points |
| Missing from one SCRUM table | -30 on collaboration |
| Using nickname instead of full name | Automated parser won't find you — 0 for that meeting |
| Sprint Report rolls over to next sprint | Graded as incomplete |
| Closing subtasks after parent story | Subtask ordering penalty |
| Uploading SCRUM notes as PDF/screenshot | Tables must be in Jira directly — screenshots don't count |
| No rolled-over story explanation | Penalty per unexplained rollover |

---

## Priority Actions (80% of Individual Grade)

Focus on these three things above all else:

1. **Document everything (30%)** - detailed worklogs with links, complete SCRUM updates
2. **Follow the workflow (25%)** - To Do → In Progress (5+ min) → Done, every time
3. **Complete your stories (25%)** - finish what's assigned, explain what rolls over

---

## Jira Cloud Info
- **Project:** TM07 (Travora)
- **Cloud ID:** c1f31043-5388-4b56-a7cd-b1a02b30970e
- **Base URL:** https://travora.atlassian.net
