module.exports = async function(tp) {
        try {
            const app = this.app || window.app;
    
            // Prompt for project name and validate project
            const projectName = await tp.system.prompt("Enter Project Name:");
            let basePath = `Projects/${projectName}`;
            const projectFolder = app.vault.getAbstractFileByPath(basePath);
            if (!projectFolder) {
                new Notice(`Project folder not found for ${projectName}. Please initialize the project first.`);
                return;
            }
            basePath = `Projects/${projectName}/`;
    
            // Prompt for task description and milestone
            const taskName = await tp.system.prompt("Enter Task Name:");
            const taskDescription = await tp.system.prompt("Enter Task Description:");
            const milestoneName = await tp.system.prompt("Enter Milestone Name:");
            const milestonePath = `${basePath}Milestones/${milestoneName}.md`;
    
            // Check if the milestone exists, or create a new one
            let milestoneFile = app.vault.getAbstractFileByPath(milestonePath);
            if (!milestoneFile) {
                const milestoneTemplate = `---
due-date: 
status: not-started
project: ${projectName}
tasks: []
---

### Tasks Assigned to this Milestone:
No tasks assigned yet.
- [ ] Description of the milestone.`;
    
                // Create the milestone if it doesn't exist
                milestoneFile = await app.vault.create(milestonePath, milestoneTemplate);
                new Notice(`Milestone '${milestoneName}' created.`);
            }
    
            // Read milestone content and update the task list
            const milestoneContent = await app.vault.read(milestoneFile);
            const fileCache = app.metadataCache.getFileCache(milestoneFile);
            const milestoneTasks = fileCache?.frontmatter?.tasks || [];
    
            // Add the task to the milestone metadata
            milestoneTasks.push(taskName);
    
            // Create the task file
            const dueDate = await tp.system.prompt("Enter Task Due Date (YYYY-MM-DD):");
            const taskPath = `${basePath}Tasks/${taskName}.md`;
            const taskContent = `---
due-date: ${dueDate}
status: todo
priority: 
milestone: ${milestoneName}
project: ${projectName}
--- 

# Task: ${taskName}
- [ ] ${taskDescription}`;
    
            await app.vault.create(taskPath, taskContent);
    
            // Use the hook handler to ensure dependent updates
            tp.hooks.on_all_templates_executed(async () => {
                // Read the current milestone content
                const milestoneContent = await app.vault.read(milestoneFile);

                // Dynamically build the updated task list
                const taskListSection = milestoneTasks
                        .map(task => {
                        const taskFilePath = `[[${basePath}Tasks/${task}|${task}]]`;
                        return `- ${taskFilePath}`;
                        })
                        .join("\n");

                console.log(taskListSection, " THIS IS LIST SECTION");
    
                let updatedMilestoneContent 
                let metaDataReplacement = milestoneContent.replace(
                    /tasks: \[.*?\]/,
                    `tasks: [${milestoneTasks.map(t => `"${t}"`).join(", ")}]`
                )
                
                const taskSectionRegex = /### Tasks Assigned to this Milestone:[\s\S]*?- \[ \] Description of the milestone\./;
                const totalTasksAndBacklinksRegex = /\*\*Total Tasks\*\*: \d+\n\n## Backlinks\n\n[\s\S]*?(?=\n\n##|$)/;

                if (taskSectionRegex.test(milestoneContent)) {
                        // If the section exists, update it
                        updatedMilestoneContent = metaDataReplacement.replace(
                            taskSectionRegex,
                            `\n**Total Tasks**: ${milestoneTasks.length}\n\n## Backlinks\n\n${taskListSection}\n\n## Milestone Description\n\nDescription of the milestone.`
                        );
                } else {
                        updatedMilestoneContent = metaDataReplacement.replace(
                                totalTasksAndBacklinksRegex,
                                `**Total Tasks**: ${milestoneTasks.length}\n\n## Backlinks\n\n${taskListSection}`
                            );
                }
    
                // Save updated milestone
                await app.vault.modify(milestoneFile, updatedMilestoneContent);
    
                // Update Kanban board
                const kanbanPath = `${basePath}Kanban.md`;
                const kanbanFile = app.vault.getAbstractFileByPath(kanbanPath);
                if (kanbanFile) {
                    const kanbanContent = await app.vault.read(kanbanFile);
                    const updatedKanban = kanbanContent.replace(
                        /## To Do[\s\S]*?(- \[ \] .*)?/,
                        `## To Do\n- [ ] ${taskName}\n$1`
                    );
                    await app.vault.modify(kanbanFile, updatedKanban);
                }
    
                new Notice(`Task '${taskName}' added to milestone '${milestoneName}' and Kanban board updated.`);
            });
    
        } catch (err) {
            new Notice(`Error: ${err.message}`);
            console.error("Error creating task:", err);
        }
    };
    