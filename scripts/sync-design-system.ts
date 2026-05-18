/// <reference lib="dom" />
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const STORYBOOK_URL = 'https://banco.bradesco/cdn/design-system/dist/storybook-1.33.6/?path=/docs/design-system-liquid-bradesco--docs&args=backgroundColor:no-background-color';
const OUTPUT_DIR = path.join(__dirname, '..', 'catalog', 'design-systems');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'bradesco-liquid.md');

async function scrapeStorybook() {
    console.log('Iniciando sincronização do Design System...');
    
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log(`Acessando: ${STORYBOOK_URL}`);
        await page.goto(STORYBOOK_URL, { waitUntil: 'networkidle' });

        // Wait for the docs to load (Storybook uses iframes usually, or a main preview panel)
        // Adjust selectors based on actual Storybook structure. This is a generic starting point.
        await page.waitForSelector('#storybook-preview-iframe', { timeout: 15000 }).catch(() => console.log('Iframe not found, attempting direct read.'));
        
        let contentMarkdown = '# Bradesco Liquid Design System\n\n';
        contentMarkdown += `*Sincronizado em: ${new Date().toLocaleString()}*\n\n`;

        // Extracting basic text from the body for now
        // A complete extraction would iterate over sidebar items, click them, and extract Docs tab contents.
        const pageText = await page.evaluate(() => {
            return document.body.innerText;
        });

        contentMarkdown += '## Resumo do Conteúdo\n\n';
        contentMarkdown += pageText.substring(0, 5000) + '\n\n...(Conteúdo extraído via automação local)';

        fs.writeFileSync(OUTPUT_FILE, contentMarkdown, 'utf-8');
        console.log(`Sucesso: Design System atualizado em ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Erro ao sincronizar o Design System:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

scrapeStorybook();
