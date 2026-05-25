// Run: node fixtures/gen-linkedin.mjs
// Generates fixtures/linkedin-sample.xlsx

import * as XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const rows = [
  { 'Post URL': 'urn:li:activity:7200000000000000000', 'Created date': '2026-04-01', 'Post title': 'The silent killer of AI projects is bad data, not bad prompts.', 'Post type': 'Text',       'Impressions': 24600, 'Unique impressions': 17200, 'Reactions': 980,  'Comments': 74, 'Reposts': 32, 'Shares': 11, 'Engagement rate': 0.058 },
  { 'Post URL': 'urn:li:activity:7200000000000000001', 'Created date': '2026-04-05', 'Post title': 'How I turned one podcast ep into 40 pieces of content with Claude.', 'Post type': 'Image',    'Impressions': 19400, 'Unique impressions': 13800, 'Reactions': 740,  'Comments': 55, 'Reposts': 22, 'Shares':  8, 'Engagement rate': 0.052 },
  { 'Post URL': 'urn:li:activity:7200000000000000002', 'Created date': '2026-04-10', 'Post title': 'My honest review of GPT-4o after 60 days of daily use.', 'Post type': 'Video',    'Impressions': 31200, 'Unique impressions': 22100, 'Reactions': 1450, 'Comments': 118, 'Reposts': 58, 'Shares': 19, 'Engagement rate': 0.071 },
  { 'Post URL': 'urn:li:activity:7200000000000000003', 'Created date': '2026-04-17', 'Post title': 'A simple prompt template for better meeting summaries (steal this).', 'Post type': 'Document', 'Impressions': 16800, 'Unique impressions': 11900, 'Reactions': 620,  'Comments': 41, 'Reposts': 17, 'Shares':  6, 'Engagement rate': 0.048 },
  { 'Post URL': 'urn:li:activity:7200000000000000004', 'Created date': '2026-04-24', 'Post title': 'The 10x operator mindset: AI amplifies judgment, not effort.', 'Post type': 'Text',       'Impressions': 22300, 'Unique impressions': 15700, 'Reactions': 890,  'Comments': 68, 'Reposts': 29, 'Shares': 10, 'Engagement rate': 0.063 },
  { 'Post URL': 'urn:li:activity:7200000000000000005', 'Created date': '2026-05-02', 'Post title': 'Building in public: week 4 of shipping my AI coaching product.', 'Post type': 'Image',    'Impressions': 18100, 'Unique impressions': 12700, 'Reactions': 680,  'Comments': 48, 'Reposts': 19, 'Shares':  7, 'Engagement rate': 0.055 },
  { 'Post URL': 'urn:li:activity:7200000000000000006', 'Created date': '2026-05-09', 'Post title': 'What nobody tells you about AI workflows at scale.', 'Post type': 'Text',       'Impressions': 14200, 'Unique impressions':  9900, 'Reactions': 510,  'Comments': 35, 'Reposts': 13, 'Shares':  5, 'Engagement rate': 0.045 },
  { 'Post URL': 'urn:li:activity:7200000000000000007', 'Created date': '2026-05-15', 'Post title': 'Live demo: I rebuilt my proposal process with one Claude skill.', 'Post type': 'Video',    'Impressions': 27800, 'Unique impressions': 19600, 'Reactions': 1180, 'Comments': 92, 'Reposts': 44, 'Shares': 15, 'Engagement rate': 0.066 },
];

const ws = XLSX.utils.json_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Engagement');

const outPath = join(__dirname, 'linkedin-sample.xlsx');
XLSX.writeFile(wb, outPath);
console.log('Written:', outPath);
