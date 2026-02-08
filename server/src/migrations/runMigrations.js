const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigrations() {
  try {
    const migrations = [
      '001_initial_schema.sql',
      '002_user_profiles.sql',
      '003_add_type_to_issues.sql',
      '004_make_location_optional.sql',
      '005_create_suggestions_table.sql',
      '006_add_under_review_status.sql',
      '007_add_case_id_to_issues_and_suggestions.sql',
      '008_add_terms_accepted.sql',
      '009_add_county_to_profiles_and_submissions.sql',
      '010_add_terms_version.sql',
      '011_add_visibility_to_issues_and_suggestions.sql',
      '012_create_appraisals_table.sql',
      '013_add_view_count_to_issues_and_suggestions.sql',
      '014_create_admin_locations.sql',
      '015_add_theme_preference.sql',
      '016_add_user_bans.sql',
      '017_create_admin_messages.sql',
      '018_add_viewed_at_to_admin_messages.sql',
      '019_add_admin_notes_to_issues_and_suggestions.sql',
      '020_enforce_one_admin_per_county.sql',
      '021_add_accepted_rejected_to_issues.sql',
      '022_add_accepted_in_progress_resolved_to_suggestions.sql'
    ];

    console.log('Running migrations...');
    
    for (const migration of migrations) {
      const migrationFile = path.join(__dirname, migration);
      if (fs.existsSync(migrationFile)) {
        console.log(`Running ${migration}...`);
        const sql = fs.readFileSync(migrationFile, 'utf8');
        await pool.query(sql);
        console.log(`✅ ${migration} completed`);
      }
    }
    
    console.log('✅ All migrations completed successfully');

    // Create a default admin user (optional - remove password in production!)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@civicfix.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (process.env.CREATE_ADMIN === 'true') {
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      
      await pool.query(
        `INSERT INTO users (email, password_hash, role) 
         VALUES ($1, $2, 'admin') 
         ON CONFLICT (email) DO NOTHING`,
        [adminEmail, passwordHash]
      );
      console.log(`✅ Admin user created: ${adminEmail} / ${adminPassword}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
