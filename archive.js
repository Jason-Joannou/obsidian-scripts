module.exports = async function(tp) {
    try {
        // Get the Obsidian app object
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
        const input = await tp.system.suggester(
            projectNames, 
            projectNames, 
            false, 
            "Select item to archive"
        );

        if (!input) {
            new Notice("No item selected. Aborting operation.");
            return;
        }

        // Construct paths
        const currentPath = `Projects/${input}`;
        const destinationPath = `Archived/${input}`;

        // Check if the specified item exists
        const sourceFile = app.vault.getAbstractFileByPath(currentPath);
        if (!sourceFile) {
            new Notice(`"${currentPath}" does not exist.`);
            return;
        }

        // Check if destination already exists
        const destFile = app.vault.getAbstractFileByPath(destinationPath);
        if (destFile) {
            new Notice(`Destination "${destinationPath}" already exists.`);
            return;
        }

        // Create the destination folder if it doesn't exist
        const destFolder = destinationPath.split('/').slice(0, -1).join('/');
        if (destFolder) {
            try {
                await app.vault.createFolder(destFolder);
            } catch (e) {
                // Folder might already exist, that's okay
            }
        }

        // Archive the item using the full paths
        await app.vault.rename(sourceFile, destinationPath);
        new Notice(`Successfully archived "${input}" to "Archived/"`);
        
    } catch (err) {
        new Notice(`Error: ${err.message}`);
        console.error("Error archiving the item:", err);
    }
}