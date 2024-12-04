module.exports = async function(tp) {
    try {
        // Get the Obsidian app object
        const app = this.app || window.app;

        // Get list of files/folders in Archive directory
        const archivedItems = app.vault.getAbstractFileByPath('Archived');
        if (!archivedItems || !archivedItems.children) {
            new Notice("No items found in Archive directory");
            return;
        }

        // Create a list of archived items for selection
        const archivedNames = archivedItems.children.map(item => item.name);
        
        // Prompt user to select item to unarchive
        const input = await tp.system.suggester(
            archivedNames, 
            archivedNames, 
            false, 
            "Select item to unarchive"
        );

        if (!input) {
            new Notice("No item selected. Aborting operation.");
            return;
        }

        // Construct paths
        const currentPath = `Archived/${input}`;
        const destinationPath = `Projects/${input}`;

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

        // Unarchive the item
        await app.vault.rename(sourceFile, destinationPath);
        new Notice(`Successfully unarchived "${input}" to "Projects/"`);
        
    } catch (err) {
        new Notice(`Error: ${err.message}`);
        console.error("Error unarchiving the item:", err);
    }
}