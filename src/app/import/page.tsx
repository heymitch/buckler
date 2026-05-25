'use client';
import { useState } from 'react';
export default function ImportPage() {
  const [result, setResult] = useState<string>('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await fetch('/api/import', { method: 'POST', body: new FormData(e.currentTarget) });
    const json = await res.json();
    setResult(res.ok ? `Imported ${json.imported}, skipped ${json.skipped}` : `Error: ${json.error}`);
  }
  return (
    <form onSubmit={submit}>
      <select name="source"><option value="shield_csv">Shield CSV</option><option value="linkedin_xlsx">LinkedIn XLSX</option></select>
      <input name="profileId" placeholder="profile id" required />
      <input name="file" type="file" accept=".csv,.xlsx" required />
      <button type="submit">Import</button>
      {result && <p>{result}</p>}
    </form>
  );
}
