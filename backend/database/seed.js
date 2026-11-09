/**
 * Seeds demo data for local development. Safe to re-run.
 * Usage: npm run seed
 */
const { pool } = require('../src/config/database');

const users = [
  ['demo-admin', 'admin@sitego.dev', 'Asha Admin', 'admin'],
  ['demo-manager', 'manager@sitego.dev', 'Mohan Manager', 'manager'],
  ['demo-supervisor', 'supervisor@sitego.dev', 'Sara Supervisor', 'supervisor'],
  ['demo-worker', 'worker@sitego.dev', 'Wasim Worker', 'worker'],
];

const sites = [
  ['Riverside Towers', 'Phase 2, Riverside Road, Chennai', 12.9716, 80.2209, 45000000],
  ['Green Valley Villas', 'Green Valley Layout, Coimbatore', 11.0168, 76.9558, 28000000],
];

const square = (lat, lng, d = 0.0009) => [
  { lat: lat + d, lng: lng - d },
  { lat: lat + d, lng: lng + d },
  { lat: lat - d, lng: lng + d },
  { lat: lat - d, lng: lng - d },
];

(async () => {
  try {
    const ids = [];
    for (const [gid, email, name, role] of users) {
      const { rows } = await pool.query(
        `INSERT INTO users (google_id, email, name, role, status)
         VALUES ($1,$2,$3,$4,'active')
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role
         RETURNING id`,
        [gid, email, name, role]
      );
      ids.push(rows[0].id);
    }
    for (const [name, address, lat, lng, budget] of sites) {
      const exists = await pool.query('SELECT id FROM sites WHERE name = $1', [name]);
      let siteId = exists.rows[0]?.id;
      if (!siteId) {
        const { rows } = await pool.query(
          `INSERT INTO sites (name, address, geofence, created_by, status, start_date, budget)
           VALUES ($1,$2,$3,$4,'active',CURRENT_DATE,$5) RETURNING id`,
          [name, address, JSON.stringify(square(lat, lng)), ids[0], budget]
        );
        siteId = rows[0].id;
      }
      for (const uid of ids) {
        await pool.query(
          'INSERT INTO site_users (site_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
          [siteId, uid]
        );
      }
    }
    console.log(`Seeded ${users.length} users and ${sites.length} sites.`);
  } catch (e) {
    console.error('Seed failed:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
