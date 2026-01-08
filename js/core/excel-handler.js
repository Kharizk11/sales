// Excel Handler - Import/Export functionality using SheetJS

/**
 * Import products from Excel file
 * Automatically detects unit ID based on unit name
 */
async function importProductsFromExcel(file) {
    return new Promise(async (resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first sheet
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                // Get current units to match names
                const units = await getUnits();

                // Map to product structure
                const products = jsonData.map(row => {
                    const unitName = row['الوحدة'] || row['unit'] || '';

                    // Find unit by name (case-insensitive)
                    let unitId = '';
                    if (unitName) {
                        const matchedUnit = units.find(u =>
                            u.name.toLowerCase().trim() === unitName.toLowerCase().trim()
                        );
                        if (matchedUnit) {
                            unitId = matchedUnit.id;
                        }
                    }

                    return {
                        id: generateId(),
                        code: row['كود المنتج'] || row['code'] || '',
                        name: row['اسم المنتج'] || row['name'] || '',
                        unitId: unitId
                    };
                }).filter(p => p.code && p.name); // Filter out empty rows

                resolve(products);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = function (error) {
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Export products to Excel file
 */
function exportProductsToExcel(products, units) {
    try {
        // Map products with unit names
        const data = products.map(product => {
            const unit = units.find(u => u.id === product.unitId);
            return {
                'كود المنتج': product.code,
                'اسم المنتج': product.name,
                'الوحدة': unit ? unit.name : ''
            };
        });

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'المنتجات');

        // Generate file
        const fileName = `المنتجات_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        return true;
    } catch (error) {
        console.error('Error exporting products:', error);
        return false;
    }
}

/**
 * Export list to Excel file
 */
function exportListToExcel(list) {
    try {
        // Prepare data
        const data = list.items.map((item, index) => ({
            '#': index + 1,
            'كود المنتج': item.productCode,
            'اسم المنتج': item.productName,
            'الوحدة': item.unitName,
            'الكمية': item.quantity
        }));

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, list.name);

        // Generate file
        const fileName = `${list.name}_${list.date}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        return true;
    } catch (error) {
        console.error('Error exporting list:', error);
        return false;
    }
}

/**
 * Generate unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Export to window
window.importProductsFromExcel = importProductsFromExcel;
window.exportProductsToExcel = exportProductsToExcel;
window.exportListToExcel = exportListToExcel;
window.generateId = generateId;
