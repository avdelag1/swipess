#!/usr/bin/env node
/**
 * Fetch Xcode Cloud build run details + failing action issues/logs
 * via App Store Connect API.
 *
 * Usage:
 *   ASC_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
 *   ASC_KEY_ID=SS64MZ8TVF \
 *   ASC_KEY_PATH=~/.swipess-secrets/AuthKey_SS64MZ8TVF.p8 \
 *   node scripts/fetch-xccloud-build.mjs 496
 *
 * Optional:
 *   WORKFLOW_NAME="Swipess App Store Build"
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import http from 'http';

const buildNumber = parseInt(process.argv[2] || '', 10);
if (!Number.isFinite(buildNumber)) {
  console.error('Usage: node scripts/fetch-xccloud-build.mjs <buildNumber>');
  process.exit(1);
}

const issuer = process.env.ASC_ISSUER_ID;
const keyId = process.env.ASC_KEY_ID || 'SS64MZ8TVF';
const keyPath = path.resolve(
  (process.env.ASC_KEY_PATH || '~/.swipess-secrets/AuthKey_SS64MZ8TVF.p8').replace(/^~/, process.env.HOME),
);
const preferWorkflow = (process.env.WORKFLOW_NAME || 'Swipess App Store Build').toLowerCase();

if (!issuer) {
  console.error('Missing ASC_ISSUER_ID (App Store Connect → Users and Access → Integrations → Issuer ID)');
  process.exit(1);
}
if (!fs.existsSync(keyPath)) {
  console.error('Missing private key at', keyPath);
  process.exit(1);
}

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function makeJwt() {
  const privateKey = fs.readFileSync(keyPath, 'utf8');
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({
      iss: issuer,
      iat: now,
      exp: now + 15 * 60,
      aud: 'appstoreconnect-v1',
    }),
  );
  const data = `${header}.${payload}`;
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  sign.end();
  // ASC requires ECDSA signature in IEEE P1363 (r||s), not DER
  const der = sign.sign(privateKey);
  const sig = derToJose(der);
  return `${data}.${sig}`;
}

function derToJose(der) {
  // Minimal DER ECDSA → raw r||s (32+32) for P-256
  let offset = 2;
  if (der[1] & 0x80) offset += der[1] & 0x7f;
  if (der[offset] !== 0x02) throw new Error('Bad DER');
  const rLen = der[offset + 1];
  let r = der.subarray(offset + 2, offset + 2 + rLen);
  offset = offset + 2 + rLen;
  if (der[offset] !== 0x02) throw new Error('Bad DER');
  const sLen = der[offset + 1];
  let s = der.subarray(offset + 2, offset + 2 + sLen);
  const size = 32;
  if (r.length > size) r = r.subarray(r.length - size);
  if (s.length > size) s = s.subarray(s.length - size);
  const out = Buffer.alloc(size * 2);
  r.copy(out, size - r.length);
  s.copy(out, size * 2 - s.length);
  return out
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function api(pathname) {
  const token = makeJwt();
  const url = `https://api.appstoreconnect.apple.com/v1${pathname}`;
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { Authorization: `Bearer ${token}` } }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          if (res.statusCode >= 400) {
            reject(new Error(`${res.statusCode} ${pathname}: ${body.slice(0, 500)}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const lib = url.startsWith('http://') ? http : https;
    lib
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          try {
            fs.unlinkSync(dest);
          } catch {
            /* ignore */
          }
          return download(res.headers.location, dest).then(resolve, reject);
        }
        if (res.statusCode >= 400) {
          file.close();
          reject(new Error(`Download failed ${res.statusCode} ${url}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve(dest)));
      })
      .on('error', reject);
  });
}

(async () => {
  const outDir = path.join(process.cwd(), `.xccloud-build-${buildNumber}`);
  fs.mkdirSync(outDir, { recursive: true });

  const products = await api('/ciProducts?limit=50');
  fs.writeFileSync(path.join(outDir, 'ciProducts.json'), JSON.stringify(products, null, 2));

  let found = null;
  let preferred = null;
  for (const product of products.data || []) {
    const workflows = await api(`/ciProducts/${product.id}/workflows`);
    for (const wf of workflows.data || []) {
      const name = (wf.attributes?.name || '').toLowerCase();
      const runs = await api(`/ciWorkflows/${wf.id}/buildRuns?limit=50&sort=-number`);
      const match = (runs.data || []).find((r) => r.attributes?.number === buildNumber);
      if (match) {
        const hit = { product, workflow: wf, run: match };
        if (!found) found = hit;
        if (name.includes(preferWorkflow.replace(/\.$/, ''))) preferred = hit;
      }
    }
  }
  if (preferred) found = preferred;

  if (!found) {
    console.error(`Build #${buildNumber} not found in any CI workflow`);
    process.exit(2);
  }

  const { product, workflow, run } = found;
  console.log('Product:', product.attributes?.name, product.id);
  console.log('Workflow:', workflow.attributes?.name, workflow.id);
  console.log('Run:', run.id, 'number', run.attributes?.number, run.attributes?.completionStatus);

  fs.writeFileSync(path.join(outDir, 'buildRun.json'), JSON.stringify(run, null, 2));
  fs.writeFileSync(path.join(outDir, 'workflow.json'), JSON.stringify(workflow, null, 2));

  const actions = await api(`/ciBuildRuns/${run.id}/actions`);
  fs.writeFileSync(path.join(outDir, 'actions.json'), JSON.stringify(actions, null, 2));

  console.log('\nActions:');
  for (const a of actions.data || []) {
    console.log(
      '-',
      a.attributes?.name,
      '|',
      a.attributes?.actionType,
      '|',
      a.attributes?.completionStatus,
      '|',
      a.id,
    );
  }

  const failing =
    (actions.data || []).find((a) =>
      /prepare build for app store connect/i.test(a.attributes?.name || ''),
    ) ||
    (actions.data || []).find((a) => a.attributes?.completionStatus === 'FAILED') ||
    (actions.data || []).find((a) => a.attributes?.actionType === 'ARCHIVE');

  if (!failing) {
    console.error('No failing / Prepare App Store action found');
    process.exit(3);
  }

  console.log('\nInvestigating action:', failing.attributes?.name, failing.id);
  const issues = await api(`/ciBuildActions/${failing.id}/issues`);
  fs.writeFileSync(path.join(outDir, 'issues.json'), JSON.stringify(issues, null, 2));
  console.log('\nIssues:');
  console.log(JSON.stringify(issues, null, 2));

  const artifacts = await api(`/ciBuildActions/${failing.id}/artifacts`);
  fs.writeFileSync(path.join(outDir, 'artifacts.json'), JSON.stringify(artifacts, null, 2));
  for (const art of artifacts.data || []) {
    const meta = await api(`/ciArtifacts/${art.id}`);
    const url = meta.data?.attributes?.downloadUrl;
    const fileName = meta.data?.attributes?.fileName || `${art.id}.zip`;
    const fileType = meta.data?.attributes?.fileType;
    console.log('Artifact', fileType, fileName);
    if (url) {
      const dest = path.join(outDir, fileName);
      await download(url, dest);
      console.log('Downloaded', dest);
    }
  }

  console.log('\nSaved under', outDir);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
