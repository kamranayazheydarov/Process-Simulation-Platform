document.addEventListener('DOMContentLoaded', () => {
    const components = document.querySelectorAll('.component');
    const workspace = document.querySelector('.workspace');
    const propertiesPanel = document.querySelector('.properties-panel');
    let componentData = {};
    let zIndexCounter = 1;
    let selectedPoint = null;
    const arrows = new Set();
    const connections = new Map(); // Store connections between points

    const catalysts = ['H2SO4', 'NaOH', 'Zeolite', 'Platinum', 'Palladium'];
    let selectedArrow = null;
    let componentDataFromCSV = new Map();
    let rawMaterialsMap = new Map();
    let outputMaterialsMap = new Map();
    let feedstockData = new Map();

    // Add at the top with other variables
    const selectedComponents = new Set();

    // Add after workspace declaration
    const workspaceWrapper = document.createElement('div');
    workspaceWrapper.className = 'workspace-wrapper';
    workspace.parentNode.insertBefore(workspaceWrapper, workspace);
    workspaceWrapper.appendChild(workspace);

    let scale = 1;
    let panning = false;
    let pointX = 0;
    let pointY = 0;
    let start = { x: 0, y: 0 };

    // Add zoom and pan functions
    function setTransform() {
        workspace.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
    }

    function zoom(event) {
        event.preventDefault();
        
        const xs = (event.clientX - pointX) / scale;
        const ys = (event.clientY - pointY) / scale;
        const delta = event.deltaY;
        
        // Restrict scale
        scale = Math.min(Math.max(0.5, scale + (delta > 0 ? -0.1 : 0.1)), 2);
        
        pointX = event.clientX - xs * scale;
        pointY = event.clientY - ys * scale;
        
        setTransform();
    }

    function fitAll() {
        const components = workspace.querySelectorAll('.workspace-component');
        if (!components.length) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        components.forEach(comp => {
            const rect = comp.getBoundingClientRect();
            minX = Math.min(minX, rect.left);
            minY = Math.min(minY, rect.top);
            maxX = Math.max(maxX, rect.right);
            maxY = Math.max(maxY, rect.bottom);
        });

        const padding = 50;
        const workspaceRect = workspaceWrapper.getBoundingClientRect();
        const scaleX = workspaceRect.width / (maxX - minX + padding * 2);
        const scaleY = workspaceRect.height / (maxY - minY + padding * 2);
        
        scale = Math.min(scaleX, scaleY, 1);
        pointX = (workspaceRect.width - (maxX - minX) * scale) / 2;
        pointY = (workspaceRect.height - (maxY - minY) * scale) / 2;
        
        setTransform();
    }

    // Add workspace pan functionality
    workspace.addEventListener('mousedown', (e) => {
        if (e.target === workspace || e.target === workspaceWrapper) {
            panning = true;
            start = { x: e.clientX - pointX, y: e.clientY - pointY };
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (panning) {
            pointX = e.clientX - start.x;
            pointY = e.clientY - start.y;
            setTransform();
        }
    });

    document.addEventListener('mouseup', () => {
        panning = false;
    });

    // Add zoom event listeners
    workspace.addEventListener('wheel', zoom);

    // Add toolbar buttons
    const toolbarHtml = `
        <div class="workspace-controls">
            <button type="button" onclick="window.fitAll()" title="Fit All (Ctrl/Cmd + F)">
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M15,3L13,5L17,9L13,13H21V5L19,7L15,3M9,3L5,7L3,5V13H11L7,9L11,5L9,3M9,21L13,17L17,21L19,19V11H11L15,15L11,19L9,21M3,19L5,21L9,17L5,13H3V19Z"/>
                </svg>
            </button>
            <button type="button" onclick="window.resetZoom()" title="Reset Zoom (Ctrl/Cmd + 0)">
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9A3,3 0 0,1 15,12Z"/>
                </svg>
            </button>
            <button type="button" id="helpButton" title="How to Use">
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M15.07,11.25L14.17,12.17C13.45,12.89 13,13.5 13,15H11V14.5C11,13.39 11.45,12.39 12.17,11.67L13.41,10.41C13.78,10.05 14,9.55 14,9C14,7.89 13.1,7 12,7A2,2 0 0,0 10,9H8A4,4 0 0,1 12,5A4,4 0 0,1 16,9C16,9.88 15.64,10.67 15.07,11.25M13,19H11V17H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z"/>
                </svg>
            </button>
            <button type="button" id="faqButton" title="FAQ">
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M15.07,11.25L14.17,12.17C13.45,12.89 13,13.5 13,15H11V14.5C11,13.39 11.45,12.39 12.17,11.67L13.41,10.41C13.78,10.05 14,9.55 14,9C14,7.89 13.1,7 12,7A2,2 0 0,0 10,9H8A4,4 0 0,1 12,5A4,4 0 0,1 16,9C16,9.88 15.64,10.67 15.07,11.25M13,19H11V17H13M12,2"/>
            </svg>
        </button>
        <button type="button" id="exportPDF" title="Export as PDF (Ctrl/Cmd + P)">
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M19,3H5C3.9,3 3,3.9 3,5V19C3,20.1 3.9,21 5,21H19C20.1,21 21,20.1 21,19V5C21,3.9 20.1,3 19,3M9.5,11.5C9.5,12.3 8.8,13 8,13H7V15H5.5V9H8C8.8,9 9.5,9.7 9.5,10.5V11.5M14.5,13.5C14.5,14.3 13.8,15 13,15H10.5V9H13C13.8,9 14.5,9.7 14.5,10.5V13.5M18.5,10.5H17V11.5H18.5V13H17V15H15.5V9H18.5V10.5Z"/>
            </svg>
        </button>
    </div>
`;

    workspace.insertAdjacentHTML('beforebegin', toolbarHtml);

    window.fitAll = fitAll;  // Make fitAll globally accessible
    window.resetZoom = resetZoom;  // Make resetZoom globally accessible

    function resetZoom() {
        scale = 1;
        pointX = 0;
        pointY = 0;
        setTransform();
    }

    // Add modal functionality
    const helpButton = document.getElementById('helpButton');
    const faqButton = document.getElementById('faqButton');
    const howToModal = document.getElementById('howToModal');
    const faqModal = document.getElementById('faqModal');
    const closeButtons = document.querySelectorAll('.close-modal');

    // Add click handlers for buttons
    helpButton.addEventListener('click', () => {
        howToModal.style.display = 'block';
    });

    faqButton.addEventListener('click', () => {
        faqModal.style.display = 'block';
    });

    // Add close handlers
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            howToModal.style.display = 'none';
            faqModal.style.display = 'none';
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === howToModal) {
            howToModal.style.display = 'none';
        }
        if (e.target === faqModal) {
            faqModal.style.display = 'none';
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });

    // Load CSV data
    fetch('/static/data/components.csv')
        .then(response => response.text())
        .then(csv => {
            const lines = csv.split('\n');
            const headers = lines[0].split(',');
            
            for(let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                const id = values[0];
                componentData[id] = {
                    name: values[1],
                    temperature: values[2],
                    pressure: values[3],
                    rawMaterials: values[4].replace(/"/g, '').split(';'),
                    outputMaterials: values[5].replace(/"/g, '').split(';')
                };
            }
        });

    async function loadComponentData() {
        try {
            const response = await fetch('/static/data/components.csv');
            const csv = await response.text();
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            lines.slice(1).forEach(line => {
                if (!line.trim()) return; // Skip empty lines
                
                const values = line.split(',').map(v => v.trim());
                const id = values[0];
                const component = {};
                
                headers.forEach((header, index) => {
                    let value = values[index];
                    if (!value) {
                        // Handle empty value, e.g., set to null or default
                        component[header] = null;
                        return;
                    }

                    // Handle special fields
                    if (header === 'raw_materials' || header === 'output_materials') {
                        component[header] = value.replace(/"/g, '').split(';');
                    } else {
                        component[header] = value;
                    }
                });
                
                componentDataFromCSV.set(id, component);
            });
            
            console.log('Loaded components:', componentDataFromCSV);
            console.log('Raw materials map:', rawMaterialsMap);
            console.log('Output materials map:', outputMaterialsMap);
        } catch (error) {
            console.error('Error loading component data:', error);
        }
    }

    async function loadFeedstockData() {
        try {
            const response = await fetch('/static/data/feedstocks.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csv = await response.text();
            console.log('Loading feedstock CSV data:', csv);
            
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            feedstockData.clear(); // Clear existing data
            
            lines.slice(1).forEach(line => {
                if (!line.trim()) return; // Skip empty lines
                
                const values = line.split(',').map(v => v.trim());
                const id = values[0];
                const feedstock = {};
                
                headers.forEach((header, index) => {
                    if (values[index] && values[index] !== '-') {
                        feedstock[header] = values[index];
                    }
                });
                
                console.log(`Loading feedstock ${id}:`, feedstock);
                feedstockData.set(id, feedstock);
            });
            
            console.log('Loaded feedstocks:', feedstockData);
        } catch (error) {
            console.error('Error loading feedstock data:', error);
        }
    }

    components.forEach(component => {
        component.addEventListener('dragstart', dragStart);
        const img = component.querySelector('img');
        if (img) {
            img.addEventListener('dragstart', (e) => {
                // Instead of stopping propagation, handle the drag from image
                dragStart(e);
            });
        }
    });

    workspace.addEventListener('dragover', dragOver);
    workspace.addEventListener('drop', drop);

    function dragStart(e) {
        // Get the component whether dragging started from image or component
        const component = e.target.closest('.component');
        const imgElement = component.querySelector('img');
        const componentId = component.id;
        
        e.dataTransfer.setData('application/json', JSON.stringify({
            id: componentId,
            name: component.querySelector('span').textContent,
            imgSrc: imgElement.src,
            originalWidth: imgElement.width,
            originalHeight: imgElement.height
        }));
    }

    function dragOver(e) {
        e.preventDefault();
    }

    // Fix component data references - change 'components' to 'componentTypes'
    function drop(e) {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        
        // Get component data based on type
        let componentData = getComponentDataFromTypes(data.id);

        if (!componentData) {
            console.warn('No component data found for:', data.id);
            return;
        }

        const node = document.createElement('div');
        node.classList.add('workspace-component');
        node.style.position = 'absolute';
        node.style.left = `${e.offsetX}px`;
        node.style.top = `${e.offsetY}px`;
        node.draggable = true;
        node.dataset.componentId = data.id;
        node.dataset.properties = JSON.stringify(componentData);

        const img = document.createElement('img');
        img.src = data.imgSrc;
        img.width = data.originalWidth;
        img.height = data.originalHeight;
        
        const span = document.createElement('span');
        span.textContent = data.name;
        
        node.appendChild(img);
        node.appendChild(span);
        workspace.appendChild(node);

        node.style.zIndex = zIndexCounter++;
        addConnectionPoints(node, data.id);

        // Add movement functionality to the workspace component
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        node.addEventListener('dragstart', (e) => {
            // Only allow drag if no connection point is selected
            if (selectedPoint) {
                e.preventDefault();
                return;
            }
            isDragging = true;
            initialX = e.clientX - node.offsetLeft;
            initialY = e.clientY - node.offsetTop;
            
            // Add selection when starting to drag
            document.querySelectorAll('.workspace-component').forEach(comp => {
                comp.classList.remove('selected');
            });
            node.classList.add('selected');
            selectedComponents.add(node);
        });

        node.addEventListener('dragend', (e) => {
            if (isDragging) {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                node.style.left = `${currentX}px`;
                node.style.top = `${currentY}px`;
                isDragging = false;
                // Maintain selection after dropping
                node.classList.add('selected');
                updateAllArrows(); // Update arrows after movement
            }
        });

        // Fix click handler in the drop function
        node.addEventListener('click', (e) => {
            // If not holding Ctrl/Cmd or Shift, deselect all other components
            if (!e.ctrlKey && !e.shiftKey) {
                document.querySelectorAll('.workspace-component').forEach(comp => {
                    comp.classList.remove('selected');
                });
                selectedComponents.clear();
            }

            // Handle Shift selection
            if (e.shiftKey && selectedComponents.size > 0) {
                const components = Array.from(workspace.querySelectorAll('.workspace-component'));
                const lastSelected = Array.from(selectedComponents)[selectedComponents.size - 1];
                if (lastSelected) {
                    const currentIndex = components.indexOf(node);
                    const lastIndex = components.indexOf(lastSelected);
                    const [start, end] = currentIndex > lastIndex ? [lastIndex, currentIndex] : [currentIndex, lastIndex];
                    for (let i = start; i <= end; i++) {
                        selectedComponents.add(components[i]);
                        components[i].classList.add('selected');
                    }
                }
            } else {
                // Toggle selection for Ctrl/Cmd click
                if (e.ctrlKey && node.classList.contains('selected')) {
                    node.classList.remove('selected');
                    selectedComponents.delete(node);
                } else {
                    node.classList.add('selected');
                    selectedComponents.add(node);
                }
            }

            // Show properties for last selected component
            if (selectedComponents.size === 1) {
                const selectedNode = Array.from(selectedComponents)[0];
                showProperties(selectedNode.dataset.componentId);
            } else if (selectedComponents.size > 1) {
                propertiesPanel.classList.add('visible');
                propertiesForm.innerHTML = '<h3>Multiple Components Selected</h3>';
            }
            
            e.stopPropagation();
        });

        node.addEventListener('mousedown', () => {
            node.style.zIndex = zIndexCounter++;
        });
    }

    function addConnectionPoints(node, componentId) {
        if (componentId.startsWith('sugar') || componentId.startsWith('ligno') || componentId.startsWith('waste')) {
            // Feedstock components only get right connection point
            const rightPoint = document.createElement('div');
            rightPoint.className = 'connection-point right middle';
            rightPoint.addEventListener('click', (e) => handleConnectionPoint(e, node));
            node.appendChild(rightPoint);
        } else {
            // All other components get both left and right points in the middle
            const leftPoint = document.createElement('div');
            leftPoint.className = 'connection-point left middle';
            
            const rightPoint = document.createElement('div');
            rightPoint.className = 'connection-point right middle';
            
            [leftPoint, rightPoint].forEach(point => {
                point.addEventListener('click', (e) => handleConnectionPoint(e, node));
                node.appendChild(point);
            });
        }
    }

    const connectionPoints = new Map(); // Track connected points

    function handleConnectionPoint(e, node) {
        e.stopPropagation();
        const point = e.target;

        if (!selectedPoint) {
            selectedPoint = point;
            point.style.backgroundColor = '#e74c3c';
        } else if (selectedPoint !== point) {
            // Check if either point is already connected
            if (isPointConnected(selectedPoint) || isPointConnected(point)) {
                selectedPoint.style.backgroundColor = '#3498db';
                selectedPoint = null;
                return;
            }
            
            drawArrow(selectedPoint, point);
            // Track the connection
            connectionPoints.set(selectedPoint, point);
            connectionPoints.set(point, selectedPoint);
            
            selectedPoint.style.backgroundColor = '#3498db';
            selectedPoint = null;
        }
    }

    function isPointConnected(point) {
        return connectionPoints.has(point);
    }

    function drawArrow(start, end) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.classList.add('arrow-line');
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.classList.add('arrow-text');
        text.textContent = 'Select Catalyst';
        
        // Add click handlers for both line and text
        line.addEventListener('click', (e) => {
            e.stopPropagation();
            handleArrowSelection(line, group);
        });
        
        text.addEventListener('click', (e) => {
            e.stopPropagation();
            handleArrowSelection(line, group);
            showCatalystProperties(group);
        });
        
        group.appendChild(line);
        group.appendChild(text);
        
        connections.set(group, { start, end, line, text });
        updateArrowPosition(group);
        workspace.querySelector('svg').appendChild(group);
    }

    function handleArrowSelection(line, group) {
        // Deselect all other arrows
        document.querySelectorAll('.arrow-line').forEach(arrow => {
            arrow.classList.remove('selected');
        });
        
        // Select this arrow
        line.classList.add('selected');
        selectedArrow = group;
        
        // Show properties panel with catalyst selection
        showCatalystProperties(group);
    }

    function updateArrowPosition(group) {
        const connection = connections.get(group);
        const startRect = connection.start.getBoundingClientRect();
        const endRect = connection.end.getBoundingClientRect();
        const workspaceRect = workspace.getBoundingClientRect();
        
        // Calculate circle centers
        const x1 = startRect.left - workspaceRect.left + connection.start.offsetWidth/2;
        const y1 = startRect.top - workspaceRect.top + connection.start.offsetHeight/2;
        const x2 = endRect.left - workspaceRect.left + connection.end.offsetWidth/2;
        const y2 = endRect.top - workspaceRect.top + connection.end.offsetHeight/2;
        
        // Calculate angle and distances
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);
        const circleRadius = 6; // Half of connection point width/height
        
        // Calculate points where line should start and end (at circle edges)
        const startX = x1 + Math.cos(angle) * circleRadius;
        const startY = y1 + Math.sin(angle) * circleRadius;
        const endX = x2 - Math.cos(angle) * (circleRadius + 1); // Add 1px offset for cleaner look
        const endY = y2 - Math.sin(angle) * (circleRadius + 1);
        
        // Update line position
        connection.line.setAttribute('x1', startX);
        connection.line.setAttribute('y1', startY);
        connection.line.setAttribute('x2', endX);
        connection.line.setAttribute('y2', endY);
        
        // Update text position (middle of the line)
        const textX = (startX + endX) / 2;
        const textY = (startY + endY) / 2 - 10; // Offset text above line
        connection.text.setAttribute('x', textX);
        connection.text.setAttribute('y', textY);
        connection.text.setAttribute('text-anchor', 'middle');
    }

    function updateAllArrows() {
        connections.forEach((value, arrow) => {
            updateArrowPosition(arrow);
        });
    }

    function showProperties(componentId) {
        console.log('Showing properties for:', componentId);
        const component = document.querySelector(`[data-component-id="${componentId}"]`);
        let data;

        // Get data based on component type
        if (componentId.startsWith('sugar') || 
            componentId.startsWith('ligno') || 
            componentId.startsWith('waste')) {
            data = feedstockData.get(componentId);
            console.log('Feedstock data:', data);
        } else {
            // For non-feedstock components
            const typeData = getComponentDataFromTypes(componentId);
            const csvData = componentDataFromCSV.get(componentId);
            data = { ...typeData, ...csvData };
            console.log('Component data:', data);
        }

        // If no data found, try getting from componentTypes directly
        if (!data || Object.keys(data).length === 0) {
            for (const category of Object.values(components)) {
                for (const type of Object.values(category)) {
                    const comp = type.find(item => item.id === componentId);
                    if (comp) {
                        data = comp;
                        break;
                    }
                }
                if (data) break;
            }
        }

        if (!data) {
            console.warn('No data found for component:', componentId);
            return;
        }

        // Get the properties panel and form
        const propertiesPanel = document.querySelector('.properties-panel');
        const propertiesForm = document.getElementById('propertiesForm');

        // Create the properties form HTML
        let formHTML = `
            <div class="properties-group">
                <h3>${data.name || 'Component Properties'}</h3>`;

        // Add all available properties
        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'id' && key !== 'img' && key !== 'name') {
                formHTML += createPropertyInputWithUnit(key, value, getUnit(key));
            }
        });

        formHTML += '</div>';
        propertiesForm.innerHTML = formHTML;
        propertiesPanel.classList.add('visible');

        // Add event listeners to inputs
        addPropertyEventListeners(propertiesForm, componentId);

        // Make sure the panel is visible
        propertiesPanel.style.display = 'block';
    }

    // Update the CSS styles to ensure proper display
    document.head.insertAdjacentHTML('beforeend', `
        <style>
            .properties-panel.visible {
                display: block !important;
                z-index: 1000;
            }
        </style>
    `);

    function createFeedstockPropertiesHTML(data, componentId) {
        if (componentId.startsWith('sugar') || 
            componentId.startsWith('ligno') || 
            componentId.startsWith('waste')) {
            
            const feedstockProperties = [
                {key: 'mass', label: 'Mass', unit: 'kg'},
                {key: 'density', label: 'Density', unit: 'g/cm³'},
                {key: 'molecular_weight', label: 'Molecular Weight', unit: 'g/mol'},
                {key: 'purity', label: 'Purity', unit: 'wt%'},
                {key: 'physical_form', label: 'Physical Form', unit: ''},
                {key: 'price', label: 'Price', unit: 'USD/kg'}
            ];

            return feedstockProperties.map(prop => {
                const value = data[prop.key];
                if (value === undefined || value === '') return '';
                
                return `
                    <div class="property-item">
                        <label>${prop.label}:</label>
                        <input type="text" 
                               value="${value}" 
                               class="property-input" 
                               data-property="${prop.key}">
                        <span class="property-unit">${prop.unit}</span>
                    </div>`;
            }).join('');
        }
        
        // For non-feedstock components, use the existing createPropertiesHTML
        return createPropertiesHTML(data, componentId);
    }

    function addPropertyEventListeners(form, componentId) {
        form.querySelectorAll('.property-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const property = e.target.dataset.property;
                const value = e.target.value;
                
                if (componentId.startsWith('sugar') || 
                    componentId.startsWith('ligno') || 
                    componentId.startsWith('waste')) {
                    // Update feedstock data
                    const feedstock = feedstockData.get(componentId) || {};
                    feedstock[property] = value;
                    feedstockData.set(componentId, feedstock);
                } else {
                    // Update component data
                    const component = componentDataFromCSV.get(componentId) || {};
                    component[property] = !isNaN(value) ? parseFloat(value) : value;
                    componentDataFromCSV.set(componentId, component);
                }
                
                console.log(`Updated ${componentId}.${property} to:`, value);
            });
        });
    }

    function createPropertyInput(key, value) {
        if (Array.isArray(value)) {
            return `
                <div class="property-item">
                    <label>${formatLabel(key)}:</label>
                    <textarea readonly class="property-textarea">${value.join('\n')}</textarea>
                </div>`;
        } else {
            return `
                <div class="property-item">
                    <label>${formatLabel(key)}:</label>
                    <input type="text" 
                           value="${value}" 
                           class="property-input" 
                           data-property="${key}">
                    <span class="property-unit">${getUnit(key)}</span>
                </div>`;
        }
    }

    function createPropertyInputWithUnit(key, value, unit) {
        if (Array.isArray(value)) {
            return `
                <div class="property-item">
                    <label>${formatLabel(key)}:</label>
                    <textarea readonly class="property-textarea">${value.join('\n')}</textarea>
                </div>`;
        } else {
            return `
                <div class="property-item">
                    <label>${formatLabel(key)}:</label>
                    <input type="text" 
                           value="${value}" 
                           class="property-input" 
                           data-property="${key}">
                    <span class="property-unit">${unit}</span>
                </div>`;
        }
    }

    function getComponentDataFromTypes(componentId) {
        // Check each category and type for the component
        for (const categoryKey in componentTypes) {
            const category = componentTypes[categoryKey];
            for (const typeKey in category) {
                const typeArray = category[typeKey];
                const component = typeArray.find(item => item.id === componentId);
                if (component) {
                    return component;
                }
            }
        }
        return null;
    }

    function formatLabel(key) {
        const specialLabels = {
            turndown_ratio: 'Turndown Ratio',
            material_construction: 'Construction Material',
            control_type: 'Control System Type',
            power_consumption: 'Power Consumption',
            maintenance_interval: 'Maintenance Interval',
            max_capacity: 'Maximum Capacity',
            min_capacity: 'Minimum Capacity',
            heat_duty: 'Heat Duty',
            catalyst_life: 'Catalyst Lifetime',
            powder_types: 'Powder Types'
        };
        
        return specialLabels[key] || key.split(/[_-]/).map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    function getUnit(key) {
        const units = {
            temperature: '°C',
            pressure: 'bar',
            flow_rate: 'm³/h',
            volume: 'm³',
            capacity: 't/h',
            power: 'kW',
            rpm: 'rpm',
            mesh: 'mm',
            pore_size: 'μm',
            power_consumption: 'kW',
            maintenance_interval: 'months',
            max_capacity: 'L/h',
            min_capacity: 'L/h',
            heat_duty: 'kW',
            catalyst_life: 'months',
            turndown_ratio: '',
            efficiency: '%',
            mass: 'kg',
            density: 'g/cm³',
            molecular_weight: 'g/mol',
            purity: 'wt%',
            price: 'USD/kg',
            powder_types: 'g/L'
        };
        return units[key] || '';
    }

    function showCatalystProperties(arrow) {
        selectedArrow = arrow;
        const propertiesForm = document.getElementById('propertiesForm');
        propertiesForm.innerHTML = `
            <div>
                <label>Select Catalyst:</label>
                <select id="catalystSelect" class="catalyst-select">
                    <option value="">Choose a catalyst</option>
                    ${catalysts.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
            </div>
        `;

        const select = propertiesForm.querySelector('#catalystSelect');
        select.addEventListener('change', (e) => {
            const connection = connections.get(selectedArrow);
            connection.text.textContent = e.target.value || 'Select Catalyst';
        });

        propertiesPanel.classList.add('visible');
    }

    function hideProperties() {
        propertiesPanel.classList.remove('visible');
    }

    // Update the workspace click event listener
    workspace.addEventListener('click', (e) => {
        // Only trigger if clicking directly on workspace, not its children
        if (e.target === workspace || e.target === workspaceWrapper) {
            selectedComponents.clear();
            // Remove selection from all components
            document.querySelectorAll('.workspace-component').forEach(comp => {
                comp.classList.remove('selected');
            });
            
            // Remove selection from all arrows
            document.querySelectorAll('.arrow-line').forEach(arrow => {
                arrow.classList.remove('selected');
            });

            // Hide properties panel
            const propertiesPanel = document.querySelector('.properties-panel');
            propertiesPanel.classList.remove('visible');
            propertiesPanel.style.display = 'none';

            // Reset any selected points
            if (selectedPoint) {
                selectedPoint.style.backgroundColor = '#3498db';
                selectedPoint = null;
            }
            selectedArrow = null;
        }
    });

    // Update styles for smooth transitions
    document.head.insertAdjacentHTML('beforeend', `
        <style>
            .properties-panel {
                transition: all 0.3s ease;
                transform: translateX(100%);
            }
            .properties-panel.visible {
                transform: translateX(0);
                display: block !important;
            }
        </style>
    `);

    // Add delete keyboard handler
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === '0') { // Ctrl/Cmd + 0
                e.preventDefault();
                scale = 1;
                pointX = 0;
                pointY = 0;
                setTransform();
            } else if (e.key === 'f') { // Ctrl/Cmd + F
                e.preventDefault();
                fitAll();
            }
        }
        
        // Update existing delete handler
        if (e.key === 'Delete') {
            if (selectedComponents.size > 0) {
                deleteSelectedComponents();
                return;
            }
            const selectedArrow = workspace.querySelector('.arrow-line.selected');
            if (selectedArrow) {
                const group = selectedArrow.closest('g');
                const connection = connections.get(group);
                // Handle arrow deletion
                if (connection) {
                    const { start, end } = connection;
                    connectionPoints.delete(start);
                    connectionPoints.delete(end);
                    connections.delete(group);
                    group.remove();
                }
            }
        }
    });

    const componentTypes = {
        feedstock: {
            sugar: [
                { id: 'sugar1', name: 'Glucose', img: '/static/images/glucose2.png', mass: 1, mass_unit: 'kg' },
                { id: 'sugar2', name: 'Sucrose', img: '/static/images/sucrose.png', mass: 1, mass_unit: 'kg' },
                { id: 'sugar3', name: 'Starch', img: '/static/images/starch.png', mass: 1, mass_unit: 'kg' }
            ],
            ligno: [
                { id: 'ligno1', name: 'Cellulose', img: '/static/images/cellulose.png', mass: 1, mass_unit: 'kg' },
                { id: 'ligno2', name: 'Hemicellulose', img: '/static/images/hemicellulose.png', mass: 1, mass_unit: 'kg' },
                { id: 'ligno3', name: 'Lignin', img: '/static/images/lignin.png', mass: 1, mass_unit: 'kg' }
            ],
            waste: [
                { id: 'waste1', name: 'Plastic Waste', img: '/static/images/components/feedstock/plastic.png', mass: 1, mass_unit: 'kg' },
                { id: 'waste2', name: 'Food Waste', img: '/static/images/components/feedstock/food.png', mass: 1, mass_unit: 'kg' },
                { id: 'waste3', name: 'Chemical Waste', img: '/static/images/components/feedstock/chemical.png', mass: 1, mass_unit: 'kg' }
            ]
        },
        // Existing feedstock types...
        reactor: {
            batch: [
                { id: 'batch1', name: 'Batch Reactor', img: '/static/images/bath_reactor.jpg', temperature: '80-150', pressure: '1-10' },
                { id: 'batch2', name: 'Jacketed Batch', img: '/static/images/components/reactors/jacketed.png', temperature: '60-120', pressure: '1-5' }
            ],
            cstr: [
                { id: 'cstr1', name: 'CSTR', img: '/static/images/cstr.jpg', temperature: '70-200', pressure: '1-20' }
            ],
            pfr: [
                { id: 'pfr1', name: 'Tubular PFR', img: '/static/images/components/reactors/pfr.png', temperature: '100-300', pressure: '5-50' }
            ],
            fbr: [
                { id: 'fbr1', name: 'Fluidized Bed', img: '/static/images/components/reactors/fbr.png', temperature: '200-900', pressure: '1-70' }
            ]
        },
        exchanger: {
            shell: [
                { id: 'shell1', name: 'Shell & Tube', img: '/static/images/components/exchangers/shell.png', temperature: '20-500', pressure: '1-300' }
            ],
            plate: [
                { id: 'plate1', name: 'Plate HE', img: '/static/images/components/exchangers/plate.png', temperature: '20-200', pressure: '1-25' }
            ],
            spiral: [
                { id: 'spiral1', name: 'Spiral HE', img: '/static/images/components/exchangers/spiral.png', temperature: '20-400', pressure: '1-100' }
            ],
            air: [
                { id: 'air1', name: 'Air Cooled', img: '/static/images/components/exchangers/air.png', temperature: '40-200', pressure: '1-50' }
            ]
        },
        pump: {
            centrifugal: [
                { id: 'pump1', name: 'Centrifugal', img: '/static/images/components/pumps/centrifugal.png', pressure: '1-50', flow: '1-1000' }
            ],
            positive: [
                { id: 'pump2', name: 'Reciprocating', img: '/static/images/components/pumps/reciprocating.png', pressure: '10-1000', flow: '0.1-100' }
            ],
            gear: [
                { id: 'pump3', name: 'Gear Pump', img: '/static/images/components/pumps/gear_pump.png', pressure: '1-120', flow: '0.1-50' }
            ],
            screw: [
                { id: 'pump4', name: 'Screw Pump', img: '/static/images/components/pumps/screw_pump.png', pressure: '1-100', flow: '1-200' }
            ]
        },
        separator: {
            distillation: [
                { id: 'dist1', name: 'Distillation Column', img: '/static/images/components/separators/distillation.png', temperature: '50-150', pressure: '1-3' },
                { id: 'dist2', name: 'Vacuum Distillation', img: '/static/images/components/separators/vacuum_dist.png', temperature: '40-100', pressure: '0.1-0.5' }
            ],
            filter: [
                { id: 'filter1', name: 'Pressure Filter', img: '/static/images/components/separators/press_filter.png', pressure: '2-10', flow: '1-50' },
                { id: 'filter2', name: 'Vacuum Filter', img: '/static/images/components/separators/vac_filter.png', pressure: '0.1-0.9', flow: '1-30' }
            ],
            centrifuge: [
                { id: 'cent1', name: 'Decanter Centrifuge', img: '/static/images/components/separators/decanter.png', rpm: '3000-4500', capacity: '1-10' }
            ],
            membrane: [
                { id: 'memb1', name: 'Ultrafiltration', img: '/static/images/components/separators/uf.png', pressure: '2-10', pore_size: '0.01-0.1' }
            ]
        },
        preprocess: {
            grinder: [
                { id: 'grind1', name: 'Hammer Mill', img: '/static/images/components/preprocess/hammer.png', capacity: '0.5-5', power: '10-50' }
            ],
            dryer: [
                { id: 'dry1', name: 'Rotary Dryer', img: '/static/images/components/preprocess/rotary.png', temperature: '80-200', capacity: '1-10' }
            ],
            screener: [
                { id: 'screen1', name: 'Vibrating Screen', img: '/static/images/components/preprocess/vibscreen.png', mesh: '10-100', capacity: '1-5' }
            ],
            steamer: [
                { id: 'steam1', name: 'Steam Reactor', img: '/static/images/components/preprocess/steam.png', temperature: '100-180', pressure: '5-15' }
            ]
        },
        storage: {
            tank: [
                { id: 'tank1', name: 'Storage Tank', img: '/static/images/components/storage/tank.png', volume: '10-100', pressure: '1-3' }
            ],
            silo: [
                { id: 'silo1', name: 'Biomass Silo', img: '/static/images/components/storage/silo.png', volume: '50-500', material: 'Solid' }
            ],
            bin: [
                { id: 'bin1', name: 'Waste Bin', img: '/static/images/components/storage/bin.png', volume: '5-50', material: 'Waste' }
            ],
            hopper: [
                { id: 'hopper1', name: 'Feed Hopper', img: '/static/images/components/storage/hopper.png', volume: '1-10', material: 'Feed' }
            ]
        },
        fermenter: {
            batch: [
                { 
                    id: 'ferm1', 
                    name: 'Batch Fermenter', 
                    img: '/static/images/bath_fermenter.jpeg', 
                    temperature: '30-37', 
                    pressure: '1-2',
                    powder_types: ['agar-agar', 'triptone', 'yeast extract']
                }
            ],
            continuous: [
                { 
                    id: 'ferm2', 
                    name: 'Continuous Fermenter', 
                    img: '/static/images/bath_fermenter.jpeg', 
                    temperature: '32-35', 
                    pressure: '1-3',
                    powder_types: ['peptone', 'malt extract', 'triptone']
                }
            ],
            airlift: [
                { 
                    id: 'ferm3', 
                    name: 'Airlift Fermenter', 
                    img: '/static/images/bath_fermenter.jpeg', 
                    temperature: '28-34', 
                    pressure: '1-2',
                    powder_types: ['yeast extract', 'peptone', 'glucose']
                }
            ],
            packed: [
                { 
                    id: 'ferm4', 
                    name: 'Packed Bed Fermenter', 
                    img: '/static/images/bath_fermenter.jpeg', 
                    temperature: '30-36', 
                    pressure: '1-2',
                    powder_types: ['alginate', 'carrageenan', 'cellulose']
                }
            ]
        }
    };

    // Add event listeners for all component type selectors
    ['reactor', 'exchanger', 'pump', 'feedstock', 'separator', 'preprocess', 'storage', 'fermenter'].forEach(type => {
        const selector = document.getElementById(`${type}Type`);
        const container = document.getElementById(`${type}Components`);
        
        selector.addEventListener('change', (e) => {
            const selectedType = e.target.value;
            container.innerHTML = '';
            
            if (selectedType && componentTypes[type] && componentTypes[type][selectedType]) {
                container.classList.add('active');
                
                componentTypes[type][selectedType].forEach(item => {
                    const component = document.createElement('div');
                    component.className = 'component';
                    component.draggable = true;
                    component.id = item.id;
                    
                    component.innerHTML = `
                        <img src="${item.img}" 
                             alt="${item.name}" 
                             width="180" 
                             height="100">
                        <span>${item.name}</span>
                    `;
                    
                    // Add drag event listeners
                    component.addEventListener('dragstart', dragStart);
                    const img = component.querySelector('img');
                    if (img) {
                        img.addEventListener('dragstart', (e) => dragStart(e));
                    }
                    
                    container.appendChild(component);
                });
            } else {
                container.classList.remove('active');
            }
        });
    });

    loadComponentData();
    loadFeedstockData();
    
    function deleteSelectedComponents() {
        selectedComponents.forEach(component => {
            // Remove any connections associated with this component
            const points = component.querySelectorAll('.connection-point');
            points.forEach(point => {
                if (connectionPoints.has(point)) {
                    const connectedPoint = connectionPoints.get(point);
                    // Find and remove the arrow
                    connections.forEach((value, group) => {
                        if (value.start === point || value.end === point) {
                            connectionPoints.delete(value.start);
                            connectionPoints.delete(value.end);
                            connections.delete(group);
                            group.remove();
                        }
                    });
                }
            });
            // Remove the component itself
            component.remove();
        });
        selectedComponents.clear();
        hideProperties();
    }

    // Update the keyboard event listener
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === '0') {
                e.preventDefault();
                resetZoom();
            } else if (e.key === 'f') {
                e.preventDefault();
                fitAll();
            }
        }
        
        if (e.key === 'Delete') {
            if (selectedComponents.size > 0) {
                deleteSelectedComponents();
            } else {
                const selectedArrow = workspace.querySelector('.arrow-line.selected');
                if (selectedArrow) {
                    const group = selectedArrow.closest('g');
                    const connection = connections.get(group);
                    if (connection) {
                        connectionPoints.delete(connection.start);
                        connectionPoints.delete(connection.end);
                        connections.delete(group);
                        group.remove();
                    }
                }
            }
        }
    });

    // Add PDF export function
    async function exportToPDF() {
        // Reset zoom and position temporarily
        const originalScale = scale;
        const originalX = pointX;
        const originalY = pointY;
        
        scale = 1;
        pointX = 0;
        pointY = 0;
        setTransform();

        try {
            // Create canvas from workspace
            const canvas = await html2canvas(workspace, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher quality
                logging: false,
                allowTaint: true,
                useCORS: true
            });

            // Calculate dimensions
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Create PDF
            const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
            
            // Add title
            pdf.setFontSize(16);
            pdf.text('Process Flow Diagram', 105, 15, { align: 'center' });
            
            // Add timestamp
            const timestamp = new Date().toLocaleString();
            pdf.setFontSize(10);
            pdf.text(`Generated: ${timestamp}`, 105, 22, { align: 'center' });

            // Add the workspace image
            pdf.addImage(
                canvas.toDataURL('image/jpeg', 1.0),
                'JPEG',
                0,
                30, // Start after title
                imgWidth,
                imgHeight
            );

            // Page 2: Components Table
            pdf.addPage();
            pdf.setFontSize(14);
            pdf.text('Components Data', 105, 15, { align: 'center' });

            // Get all components
            const components = workspace.querySelectorAll('.workspace-component');
            
            // Table headers
            const headers = ['Component', 'Type', 'Properties'];
            let yPos = 30;
            const lineHeight = 7;
            
            // Style for headers
            pdf.setFillColor(44, 62, 80); // #2c3e50
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(11);
            
            // Draw header cells
            pdf.rect(10, yPos, 50, 8, 'F');
            pdf.rect(60, yPos, 40, 8, 'F');
            pdf.rect(100, yPos, 90, 8, 'F');
            
            // Add header texts
            pdf.text('Component', 12, yPos + 5.5);
            pdf.text('Type', 62, yPos + 5.5);
            pdf.text('Properties', 102, yPos + 5.5);
            
            // Reset text color for data
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(10);
            
            yPos += lineHeight + 1;

            // Add component data
            components.forEach(component => {
                const id = component.dataset.componentId;
                const props = JSON.parse(component.dataset.properties);
                const name = component.querySelector('span').textContent;
                
                // Determine component type
                let type = 'Unknown';
                if (id.startsWith('sugar') || id.startsWith('ligno') || id.startsWith('waste')) {
                    type = 'Feedstock';
                } else if (id.startsWith('batch') || id.startsWith('cstr') || id.startsWith('pfr')) {
                    type = 'Reactor';
                } else if (id.startsWith('pump')) {
                    type = 'Pump';
                } // ... add more types as needed

                // Format properties
                const propsText = Object.entries(props)
                    .filter(([key]) => !['id', 'name', 'img'].includes(key))
                    .map(([key, value]) => `${formatLabel(key)}: ${value}${getUnit(key) ? ' ' + getUnit(key) : ''}`)
                    .join('\n');

                // Add row
                pdf.text(name, 12, yPos);
                pdf.text(type, 62, yPos);
                
                // Handle multiline properties text
                const lines = pdf.splitTextToSize(propsText, 85);
                pdf.text(lines, 102, yPos);
                
                // Update position for next row
                yPos += Math.max(lines.length * 5, lineHeight);
                
                // Add new page if needed
                if (yPos > 270) {
                    pdf.addPage();
                    yPos = 20;
                }
            });

            // Save PDF
            pdf.save('process-diagram.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            // Restore original zoom and position
            scale = originalScale;
            pointX = originalX;
            pointY = originalY;
            setTransform();
        }
    }

    // Add click handler for export button
    document.getElementById('exportPDF').addEventListener('click', exportToPDF);
});