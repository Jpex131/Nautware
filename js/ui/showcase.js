export function initShowcase() {
    // Specs panel accordion
    const specsToggle = document.getElementById('specs-toggle');
    const specsBody = document.getElementById('specs-body');
    if (specsToggle && specsBody) {
        specsToggle.addEventListener('click', () => {
            const expanded = specsToggle.getAttribute('aria-expanded') === 'true';
            specsToggle.setAttribute('aria-expanded', !expanded);
            specsBody.classList.toggle('open');
        });
    }

    // --- Category data ---
    const categoryData = {
        'inventory': {
            desc: 'Product Manejo — The asset tracking system for managing physical goods, raw materials, and product sales.<br><br>Features real-time stock level monitoring, dynamic cost of goods sold calculations, and automated supplier orders.',
            image: 'assets/images/inventory_module.png',
            specs: [
                { label: 'Feature',  value: 'Real-time Stock' },
                { label: 'Integration',  value: 'Finance Module' },
                { label: 'Capacity',      value: 'Unlimited SKUs' },
                { label: 'Platform',     value: 'Cloud Native' },
                { label: 'Security',        value: 'End-to-end Encryption' },
                { label: 'Automation',    value: 'Supplier API Sync' }
            ]
        },
        'services': {
            desc: 'Service Management — The operational scheduling engine designed to manage logistical booking and provider assignments.<br><br>Includes interactive calendars for blocking dates, managing recurring operations, and deep integration with our ledger system.',
            image: 'assets/images/service_module.png',
            specs: [
                { label: 'Feature',  value: 'Interactive Calendar' },
                { label: 'Logistics',  value: 'Provider Assignment' },
                { label: 'Integration',      value: 'Inventory Deductions' },
                { label: 'Platform',     value: 'Cloud Native' },
                { label: 'Time Tracking',        value: 'Automated Billing' },
                { label: 'Scale', value: 'Enterprise Level' }
            ]
        },
        'finance': {
            desc: 'Finance Analitica — The financial heartbeat of the platform. A passive aggregator that listens to activities across the ecosystem to generate real-time financial insights.<br><br>Track operating income, expenditure, and calculate net profit dynamically.',
            image: 'assets/images/finance_module.png',
            specs: [
                { label: 'Feature',  value: 'Real-time Dashboards' },
                { label: 'Automation',  value: 'Ledger Updates' },
                { label: 'Analytics',      value: 'Cash Flow Trends' },
                { label: 'Compliance',     value: 'Enterprise Grade' },
                { label: 'Scale',     value: 'Multi-Entity Support' },
                { label: 'Export',    value: 'Automated Reporting' }
            ]
        },
        'ai': {
            desc: 'AI Implementation — Our advanced predictive engine that analyzes historical data to forecast trends and optimize workflows.<br><br>From anticipating inventory shortages to dynamically adjusting service schedules, the AI core brings true autonomy to your business operations.',
            image: 'assets/images/ai_module.png',
            specs: [
                { label: 'Core',  value: 'Predictive Modeling' },
                { label: 'Optimization',  value: 'Dynamic Scheduling' },
                { label: 'Analysis',      value: 'Pattern Recognition' },
                { label: 'Processing',     value: 'Quantum-Ready' },
                { label: 'Security',        value: 'Isolated Instances' },
                { label: 'Learning',    value: 'Continuous Feedback' }
            ]
        }
    };

    // Tag switching
    const tags = document.querySelectorAll('#showcase-tags li');
    const descEl = document.getElementById('showcase-desc');

    if (tags.length && descEl) {
        tags.forEach(tag => {
            tag.addEventListener('click', () => {
                // Update active class
                tags.forEach(t => t.classList.remove('active'));
                tag.classList.add('active');

                const cat = tag.dataset.category;
                const data = categoryData[cat];
                if (!data) return;

                // Update description
                descEl.innerHTML = data.desc;

                // Update Image with animation
                const imgEl = document.getElementById('showcase-img');
                if (imgEl && data.image && !imgEl.src.endsWith(data.image)) {
                    imgEl.classList.add('fade-out');
                    setTimeout(() => {
                        imgEl.src = data.image;
                        setTimeout(() => imgEl.classList.remove('fade-out'), 50);
                    }, 300); // Wait for fade out transition
                }

                // Update spec rows
                data.specs.forEach((spec, i) => {
                    const labelEl = document.getElementById('spec-label-' + i);
                    const valueEl = document.getElementById('spec-value-' + i);
                    if (labelEl && valueEl) {
                        labelEl.textContent = spec.label;
                        valueEl.textContent = spec.value;
                    }
                });
            });
        });
    }
}
