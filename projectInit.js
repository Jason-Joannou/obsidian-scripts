module.exports = async function(tp) {
    try{
        const app = this.app || window.app;

        const projectName = await tp.system.prompt("Enter Project Name:");
        const basePath = `Projects/${projectName}/`;

        // 1. Create the folder structure
        await app.vault.createFolder(basePath);
        await app.vault.createFolder(`${basePath}Tasks`);
        await app.vault.createFolder(`${basePath}Milestones`);
        await app.vault.createFolder(`${basePath}Progress Logs`);
        await app.vault.createFolder(`${basePath}Notes`);
        await app.vault.createFolder(`${basePath}References`);


        // 2. Create Dashboard.md
        const dashboardContent = `
# ${projectName} Dashboard

## Milestones
\`\`\`dataview
table due-date as "Due Date", status, file.tasks.length as "Number of Tasks"
from "${basePath}Milestones"
sort due-date asc
\`\`\`

## Tasks
\`\`\`dataview
table due-date as "Due Date", status, priority, milestone
from "${basePath}Tasks"
where status != "done"
sort due-date asc
\`\`\`

## Progress
\`\`\`dataview
table due-date as "Date", update-summary as "Summary", milestones, tasks, status
from "${basePath}Progress Logs"
sort due-date desc
\`\`\``;
        await app.vault.create(`${basePath}Dashboard.md`, dashboardContent);

        // 3. Create starter templates
        const taskTemplate = `---
due-date: 
status: todo
priority: 
project: ${projectName}
milestone:
---

Feel free to delete this template! This is merely to display the structure of a task.

# Task Template
- [ ] Task Description:`;

        await app.vault.create(`${basePath}Tasks/Task Template.md`, taskTemplate);

        const milestoneTemplate = `---
due-date: 
status: not-started
project: ${projectName}
tasks: []
---

Feel free to delete this template! This is merely to display the structure of a milestone.

# Milestone Description
- Description of the milestone.`;
        
        await app.vault.create(`${basePath}Milestones/Milestone Template.md`, milestoneTemplate);

        const progressTemplate = `---
status: in-progress
milestones: [ ]
tasks: [ ]
update-summary: 
due-date: ${tp.date.now('YYYY-MM-DD')}
---

# Progress Log Template
- Details of the update or progress related to the milestones/tasks.`;

        await app.vault.create(`${basePath}Progress Logs/Progress Template.md`, progressTemplate);

        // 4. Initialize Kanban.md
        const kanbanContent = `---
kanban-plugin: basic
---

## To Do

## In Progress

## Done`;
        await app.vault.create(`${basePath}Kanban.md`, kanbanContent);

        new Notice(`Project ${projectName} initialized successfully!`);



    }
    catch(error){
        new Notice(`Error: ${err.message}`);
        console.error("Error Initializing the project:", err);
    }
}