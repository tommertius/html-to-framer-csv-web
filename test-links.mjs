import { JSDOM } from 'jsdom';
import fs from 'fs';

const html = fs.readFileSync('/home/ubuntu/upload/Article27VijfmiljardtegendeklokwaaromNederlan.html', 'utf-8');
const dom = new JSDOM(html);
const document = dom.window.document;

// Find a link in the references section
const links = document.querySelectorAll('a');
console.log('Total links found:', links.length);
console.log('\nFirst 3 links:');
for (let i = 0; i < Math.min(3, links.length); i++) {
  const link = links[i];
  console.log(`\nLink ${i + 1}:`);
  console.log('  href:', link.getAttribute('href'));
  console.log('  text:', link.textContent);
  console.log('  HTML:', link.outerHTML.substring(0, 200));
}
