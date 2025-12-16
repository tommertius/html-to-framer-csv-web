import { JSDOM } from 'jsdom';
import fs from 'fs';

const html = fs.readFileSync('/home/ubuntu/upload/Article27VijfmiljardtegendeklokwaaromNederlan.html', 'utf-8');
const dom = new JSDOM(html);
const document = dom.window.document;

// Find the HR separator
const hrs = document.querySelectorAll('hr');
console.log('Found', hrs.length, 'HR elements');

if (hrs.length > 0) {
  const hr = hrs[0];
  const sourcesElements = [];
  let current = hr.nextElementSibling;
  
  while (current) {
    sourcesElements.push(current);
    current = current.nextElementSibling;
  }
  
  console.log('\nSources elements:', sourcesElements.length);
  console.log('\nFirst source element:');
  console.log('Tag:', sourcesElements[0]?.tagName);
  console.log('HTML:', sourcesElements[0]?.outerHTML.substring(0, 300));
  
  // Check if it has links
  const links = sourcesElements[0]?.querySelectorAll('a');
  console.log('\nLinks in first element:', links?.length);
  if (links && links.length > 0) {
    console.log('First link href:', links[0].getAttribute('href'));
    console.log('First link text:', links[0].textContent);
  }
}
