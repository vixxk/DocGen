const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

async function generateSample() {
    const templatePath = path.join(__dirname, 'template.html');
    const signaturePath = path.join(__dirname, 'public', 'signature.png');
    
    // Read template and signature
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    const signatureImage = fs.readFileSync(signaturePath).toString('base64');
    const signatureUrl = `data:image/png;base64,${signatureImage}`;

    const template = handlebars.compile(templateHtml);

    const data = {
        docType: 'QUOTATION',
        to: 'Dr. Amar Sharma',
        toAddress: 'Director, City Hospital & Research Centre\nOpposite Gandhi Maidan, Patna- 800001',
        date: '31/01/26',
        signatureUrl: signatureUrl,
        showQty: true,
        showPrice: true,
        showAmount: true,
        items: [
            { description: 'OT Table Hydraulic (Advanced Model with SS 304)', qty: 1, price: '45000', amount: '45000' },
            { description: 'D.D. Autoclave (Vertical)', qty: 1, price: '13000', amount: '13000' },
            { description: 'Ambu bag (Silicon Adult)', qty: 1, price: '1250', amount: '1250' },
            { description: 'Syringe Pump (Touch Screen)', qty: 1, price: '18000', amount: '18000' },
            { description: '3 Para Monitor with ECG/NIBP/SPO2', qty: 3, price: '12500', amount: '37500' },
            { description: 'General Bed (Deluxe with MS Frame)', qty: 8, price: '6000', amount: '48000' },
            { description: 'ICU Bed (Single Handle Manual)', qty: 4, price: '15000', amount: '60000' },
            { description: 'Monitor Stand (Adjustable Height)', qty: 5, price: '1500', amount: '7500' },
            { description: 'Cloth Streture (Standard)', qty: 1, price: '3000', amount: '3000' },
            { description: 'Medical Ventilator (Portable)', qty: 1, price: '150000', amount: '150000' },
            { description: 'Patient Monitor Pro (High Definition)', qty: 2, price: '25000', amount: '50000' },
            { description: 'Defibrillator (Biphasic)', qty: 1, price: '85000', amount: '85000' },
            { description: 'Surgical Light LED (7 Petal)', qty: 1, price: '40000', amount: '40000' },
            { description: 'Anesthesia Machine (Workstation)', qty: 1, price: '120000', amount: '120000' },
            { description: 'ECG Machine 12 Channel', qty: 1, price: '35000', amount: '35000' },
            { description: 'Oxygen Concentrator (5LPM)', qty: 2, price: '45000', amount: '90000' },
            { description: 'Suction Machine (Electric)', qty: 3, price: '8000', amount: '24000' },
            { description: 'Medical Gas Pipeline System Setup', qty: 1, price: '200000', amount: '200000' },
            { description: 'Infusion Pump (Continuous)', qty: 5, price: '12000', amount: '60000' },
            { description: 'Wheelchair Foldable (Heavy Duty)', qty: 10, price: '4500', amount: '45000' },
            { description: 'Stretcher Trolley (ABS Top)', qty: 5, price: '15000', amount: '75000' },
            { description: 'Nebulizer Machine (Compressor)', qty: 20, price: '1500', amount: '30000' }
        ],
        subtotal: '12,50,000',
        gstPercent: '12',
        gst: '1,50,000',
        finalAmount: '14,00,000',
        advancePayment: '5,00,000',
        paymentDone: '2,00,000',
        paymentRemaining: '7,00,000',
        terms: [
            'Payment 100% advance against invoice',
            'Delivery charges and GST extra as applicable',
            'Warranty one year from date of delivery',
            'Subject to Patna Jurisdiction'
        ]
    };

    const html = template(data);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfPath = path.join(__dirname, 'sample.pdf');
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();
    console.log(`Sample PDF generated at: ${pdfPath}`);
}

generateSample().catch(error => {
    console.error('Error generating sample:', error);
    process.exit(1);
});
