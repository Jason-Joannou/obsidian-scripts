module.exports = async function(tp) {
        try {
            const app = this.app || window.app;
    
            // Get list of files/folders in Projects directory
            const projectItems = app.vault.getAbstractFileByPath('Projects');
            if (!projectItems || !projectItems.children) {
                new Notice("No items found in Projects directory");
                return;
            }

            // Create a list of project items for selection
            const projectNames = projectItems.children.map(item => item.name);

            // Prompt user to select item to archive
            const projectName = await tp.system.suggester(
                projectNames, 
                projectNames, 
                false, 
                "Select the project where this milestone will be created:"
            );

            if (!projectName) {
                new Notice("No item selected. Aborting operation.");
                return;
            }
            let basePath = `Projects/${projectName}`;
            const projectFolder = app.vault.getAbstractFileByPath(basePath);
            if (!projectFolder) {
                new Notice(`Project folder not found for ${projectName}. Please initialize the project first.`);
                return;
            }
            basePath = `Projects/${projectName}/`;
    
            // Prompt for task description and milestone
            const milestoneName = await tp.system.prompt("Enter Milestone Name:");

            const milestonePath = `${basePath}Milestones/${milestoneName}.md`;
    
            // Check if the milestone exists, or create a new one
            let milestoneFile = app.vault.getAbstractFileByPath(milestonePath);
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
    
        } catch (err) {
            new Notice(`Error: ${err.message}`);
            console.error("Error creating task:", err);
        }
    };
    