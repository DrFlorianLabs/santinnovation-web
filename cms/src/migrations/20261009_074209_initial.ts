import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`users_sessions\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`created_at\` text,
    \`expires_at\` text NOT NULL,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`nom\` text NOT NULL,
    \`role\` text DEFAULT 'editor' NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`email\` text NOT NULL,
    \`reset_password_token\` text,
    \`reset_password_expiration\` text,
    \`salt\` text,
    \`hash\` text,
    \`reset_password_requested_at\` text,
    \`login_attempts\` numeric DEFAULT 0,
    \`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`medias\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`alt\` text NOT NULL,
    \`credit\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`url\` text,
    \`thumbnail_u_r_l\` text,
    \`filename\` text,
    \`mime_type\` text,
    \`filesize\` numeric,
    \`width\` numeric,
    \`height\` numeric,
    \`focal_x\` numeric,
    \`focal_y\` numeric
  );
  `)
  await db.run(sql`CREATE INDEX \`medias_updated_at_idx\` ON \`medias\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`medias_created_at_idx\` ON \`medias\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`medias_filename_idx\` ON \`medias\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`professionnels_horaires_par_lieu\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`lieu_id\` integer,
    \`horaires\` text,
    FOREIGN KEY (\`lieu_id\`) REFERENCES \`lieux\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`professionnels\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`professionnels_horaires_par_lieu_order_idx\` ON \`professionnels_horaires_par_lieu\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`professionnels_horaires_par_lieu_parent_id_idx\` ON \`professionnels_horaires_par_lieu\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`professionnels_horaires_par_lieu_lieu_idx\` ON \`professionnels_horaires_par_lieu\` (\`lieu_id\`);`)
  await db.run(sql`CREATE TABLE \`professionnels_domaines\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`libelle\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`professionnels\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`professionnels_domaines_order_idx\` ON \`professionnels_domaines\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`professionnels_domaines_parent_id_idx\` ON \`professionnels_domaines\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`professionnels_activites\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`libelle\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`professionnels\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`professionnels_activites_order_idx\` ON \`professionnels_activites\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`professionnels_activites_parent_id_idx\` ON \`professionnels_activites\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`professionnels\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`prenom\` text,
    \`nom\` text,
    \`titre_affiche\` text,
    \`profession\` text,
    \`profession_label\` text,
    \`telephone\` text,
    \`email\` text,
    \`doctolib_url\` text,
    \`photo_id\` integer,
    \`accepte_nouveaux_patients\` integer DEFAULT false,
    \`soins_a_domicile\` integer DEFAULT false,
    \`slug\` text,
    \`visible\` integer DEFAULT true,
    \`archive\` integer DEFAULT false,
    \`ordre\` numeric DEFAULT 99,
    \`debut_affichage\` text,
    \`fin_affichage\` text,
    \`corps\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`_status\` text DEFAULT 'draft',
    FOREIGN KEY (\`photo_id\`) REFERENCES \`medias\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`professionnels_photo_idx\` ON \`professionnels\` (\`photo_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`professionnels_slug_idx\` ON \`professionnels\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`professionnels_updated_at_idx\` ON \`professionnels\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`professionnels_created_at_idx\` ON \`professionnels\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`professionnels__status_idx\` ON \`professionnels\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`professionnels_rels\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`order\` integer,
    \`parent_id\` integer NOT NULL,
    \`path\` text NOT NULL,
    \`lieux_id\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`professionnels\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`lieux_id\`) REFERENCES \`lieux\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`professionnels_rels_order_idx\` ON \`professionnels_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`professionnels_rels_parent_idx\` ON \`professionnels_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`professionnels_rels_path_idx\` ON \`professionnels_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`professionnels_rels_lieux_id_idx\` ON \`professionnels_rels\` (\`lieux_id\`);`)
  await db.run(sql`CREATE TABLE \`_professionnels_v_version_horaires_par_lieu\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`lieu_id\` integer,
    \`horaires\` text,
    \`_uuid\` text,
    FOREIGN KEY (\`lieu_id\`) REFERENCES \`lieux\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_professionnels_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_professionnels_v_version_horaires_par_lieu_order_idx\` ON \`_professionnels_v_version_horaires_par_lieu\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_professionnels_v_version_horaires_par_lieu_parent_id_idx\` ON \`_professionnels_v_version_horaires_par_lieu\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_professionnels_v_version_horaires_par_lieu_lieu_idx\` ON \`_professionnels_v_version_horaires_par_lieu\` (\`lieu_id\`);`)
  await db.run(sql`CREATE TABLE \`_professionnels_v_version_domaines\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`libelle\` text,
    \`_uuid\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_professionnels_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_professionnels_v_version_domaines_order_idx\` ON \`_professionnels_v_version_domaines\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_professionnels_v_version_domaines_parent_id_idx\` ON \`_professionnels_v_version_domaines\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_professionnels_v_version_activites\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`libelle\` text,
    \`_uuid\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_professionnels_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_professionnels_v_version_activites_order_idx\` ON \`_professionnels_v_version_activites\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_professionnels_v_version_activites_parent_id_idx\` ON \`_professionnels_v_version_activites\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_professionnels_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`parent_id\` integer,
    \`version_prenom\` text,
    \`version_nom\` text,
    \`version_titre_affiche\` text,
    \`version_profession\` text,
    \`version_profession_label\` text,
    \`version_telephone\` text,
    \`version_email\` text,
    \`version_doctolib_url\` text,
    \`version_photo_id\` integer,
    \`version_accepte_nouveaux_patients\` integer DEFAULT false,
    \`version_soins_a_domicile\` integer DEFAULT false,
    \`version_slug\` text,
    \`version_visible\` integer DEFAULT true,
    \`version_archive\` integer DEFAULT false,
    \`version_ordre\` numeric DEFAULT 99,
    \`version_debut_affichage\` text,
    \`version_fin_affichage\` text,
    \`version_corps\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`version__status\` text DEFAULT 'draft',
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`latest\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`professionnels\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`version_photo_id\`) REFERENCES \`medias\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_professionnels_v_parent_idx\` ON \`_professionnels_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_professionnels_v_version_version_photo_idx\` ON \`_professionnels_v\` (\`version_photo_id\`);`)
  await db.run(sql`CREATE INDEX \`_professionnels_v_version_version_slug_idx\` ON \`_professionnels_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_professionnels_v_version_version_updated_at_idx\` ON \`_professionnels_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_professionnels_v_version_version_created_at_idx\` ON \`_professionnels_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_professionnels_v_version_version__status_idx\` ON \`_professionnels_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_professionnels_v_created_at_idx\` ON \`_professionnels_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_professionnels_v_updated_at_idx\` ON \`_professionnels_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_professionnels_v_latest_idx\` ON \`_professionnels_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`_professionnels_v_rels\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`order\` integer,
    \`parent_id\` integer NOT NULL,
    \`path\` text NOT NULL,
    \`lieux_id\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`_professionnels_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`lieux_id\`) REFERENCES \`lieux\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_professionnels_v_rels_order_idx\` ON \`_professionnels_v_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_professionnels_v_rels_parent_idx\` ON \`_professionnels_v_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_professionnels_v_rels_path_idx\` ON \`_professionnels_v_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`_professionnels_v_rels_lieux_id_idx\` ON \`_professionnels_v_rels\` (\`lieux_id\`);`)
  await db.run(sql`CREATE TABLE \`lieux_photos\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`image_id\` integer,
    \`legende\` text,
    FOREIGN KEY (\`image_id\`) REFERENCES \`medias\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`lieux\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`lieux_photos_order_idx\` ON \`lieux_photos\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`lieux_photos_parent_id_idx\` ON \`lieux_photos\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`lieux_photos_image_idx\` ON \`lieux_photos\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`lieux\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`nom\` text,
    \`adresse\` text,
    \`code_postal\` text,
    \`ville\` text,
    \`secteur\` text,
    \`telephone\` text,
    \`email\` text,
    \`horaires\` text,
    \`infos_pratiques\` text,
    \`acces_transport\` text,
    \`acces_p_m_r\` integer,
    \`accessibilite\` text,
    \`latitude\` numeric,
    \`longitude\` numeric,
    \`coordonnees_verifiees\` integer DEFAULT false,
    \`itineraire_url\` text,
    \`photo_id\` integer,
    \`slug\` text,
    \`visible\` integer DEFAULT true,
    \`archive\` integer DEFAULT false,
    \`ordre\` numeric DEFAULT 99,
    \`debut_affichage\` text,
    \`fin_affichage\` text,
    \`corps\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`_status\` text DEFAULT 'draft',
    FOREIGN KEY (\`photo_id\`) REFERENCES \`medias\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`lieux_photo_idx\` ON \`lieux\` (\`photo_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`lieux_slug_idx\` ON \`lieux\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`lieux_updated_at_idx\` ON \`lieux\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`lieux_created_at_idx\` ON \`lieux\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`lieux__status_idx\` ON \`lieux\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_lieux_v_version_photos\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`image_id\` integer,
    \`legende\` text,
    \`_uuid\` text,
    FOREIGN KEY (\`image_id\`) REFERENCES \`medias\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_lieux_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_lieux_v_version_photos_order_idx\` ON \`_lieux_v_version_photos\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_lieux_v_version_photos_parent_id_idx\` ON \`_lieux_v_version_photos\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_lieux_v_version_photos_image_idx\` ON \`_lieux_v_version_photos\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_lieux_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`parent_id\` integer,
    \`version_nom\` text,
    \`version_adresse\` text,
    \`version_code_postal\` text,
    \`version_ville\` text,
    \`version_secteur\` text,
    \`version_telephone\` text,
    \`version_email\` text,
    \`version_horaires\` text,
    \`version_infos_pratiques\` text,
    \`version_acces_transport\` text,
    \`version_acces_p_m_r\` integer,
    \`version_accessibilite\` text,
    \`version_latitude\` numeric,
    \`version_longitude\` numeric,
    \`version_coordonnees_verifiees\` integer DEFAULT false,
    \`version_itineraire_url\` text,
    \`version_photo_id\` integer,
    \`version_slug\` text,
    \`version_visible\` integer DEFAULT true,
    \`version_archive\` integer DEFAULT false,
    \`version_ordre\` numeric DEFAULT 99,
    \`version_debut_affichage\` text,
    \`version_fin_affichage\` text,
    \`version_corps\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`version__status\` text DEFAULT 'draft',
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`latest\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`lieux\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`version_photo_id\`) REFERENCES \`medias\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_lieux_v_parent_idx\` ON \`_lieux_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_lieux_v_version_version_photo_idx\` ON \`_lieux_v\` (\`version_photo_id\`);`)
  await db.run(sql`CREATE INDEX \`_lieux_v_version_version_slug_idx\` ON \`_lieux_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_lieux_v_version_version_updated_at_idx\` ON \`_lieux_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_lieux_v_version_version_created_at_idx\` ON \`_lieux_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_lieux_v_version_version__status_idx\` ON \`_lieux_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_lieux_v_created_at_idx\` ON \`_lieux_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_lieux_v_updated_at_idx\` ON \`_lieux_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_lieux_v_latest_idx\` ON \`_lieux_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`actualites\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`titre\` text,
    \`date\` text,
    \`resume\` text,
    \`categorie\` text DEFAULT 'Actualité',
    \`image_id\` integer,
    \`epingle\` integer DEFAULT false,
    \`debut_evenement\` text,
    \`fin_evenement\` text,
    \`slug\` text,
    \`visible\` integer DEFAULT true,
    \`archive\` integer DEFAULT false,
    \`ordre\` numeric DEFAULT 99,
    \`debut_affichage\` text,
    \`fin_affichage\` text,
    \`corps\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`_status\` text DEFAULT 'draft',
    FOREIGN KEY (\`image_id\`) REFERENCES \`medias\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`actualites_image_idx\` ON \`actualites\` (\`image_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`actualites_slug_idx\` ON \`actualites\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`actualites_updated_at_idx\` ON \`actualites\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`actualites_created_at_idx\` ON \`actualites\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`actualites__status_idx\` ON \`actualites\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_actualites_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`parent_id\` integer,
    \`version_titre\` text,
    \`version_date\` text,
    \`version_resume\` text,
    \`version_categorie\` text DEFAULT 'Actualité',
    \`version_image_id\` integer,
    \`version_epingle\` integer DEFAULT false,
    \`version_debut_evenement\` text,
    \`version_fin_evenement\` text,
    \`version_slug\` text,
    \`version_visible\` integer DEFAULT true,
    \`version_archive\` integer DEFAULT false,
    \`version_ordre\` numeric DEFAULT 99,
    \`version_debut_affichage\` text,
    \`version_fin_affichage\` text,
    \`version_corps\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`version__status\` text DEFAULT 'draft',
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`latest\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`actualites\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`version_image_id\`) REFERENCES \`medias\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_actualites_v_parent_idx\` ON \`_actualites_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_actualites_v_version_version_image_idx\` ON \`_actualites_v\` (\`version_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_actualites_v_version_version_slug_idx\` ON \`_actualites_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_actualites_v_version_version_updated_at_idx\` ON \`_actualites_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_actualites_v_version_version_created_at_idx\` ON \`_actualites_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_actualites_v_version_version__status_idx\` ON \`_actualites_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_actualites_v_created_at_idx\` ON \`_actualites_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_actualites_v_updated_at_idx\` ON \`_actualites_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_actualites_v_latest_idx\` ON \`_actualites_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`activites_liens\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`libelle\` text,
    \`url\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`activites\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`activites_liens_order_idx\` ON \`activites_liens\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`activites_liens_parent_id_idx\` ON \`activites_liens\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`activites\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`titre\` text,
    \`resume\` text,
    \`image_id\` integer,
    \`slug\` text,
    \`visible\` integer DEFAULT true,
    \`archive\` integer DEFAULT false,
    \`ordre\` numeric DEFAULT 99,
    \`debut_affichage\` text,
    \`fin_affichage\` text,
    \`corps\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`_status\` text DEFAULT 'draft',
    FOREIGN KEY (\`image_id\`) REFERENCES \`medias\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`activites_image_idx\` ON \`activites\` (\`image_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`activites_slug_idx\` ON \`activites\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`activites_updated_at_idx\` ON \`activites\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`activites_created_at_idx\` ON \`activites\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`activites__status_idx\` ON \`activites\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_activites_v_version_liens\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`libelle\` text,
    \`url\` text,
    \`_uuid\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_activites_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_activites_v_version_liens_order_idx\` ON \`_activites_v_version_liens\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_activites_v_version_liens_parent_id_idx\` ON \`_activites_v_version_liens\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_activites_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`parent_id\` integer,
    \`version_titre\` text,
    \`version_resume\` text,
    \`version_image_id\` integer,
    \`version_slug\` text,
    \`version_visible\` integer DEFAULT true,
    \`version_archive\` integer DEFAULT false,
    \`version_ordre\` numeric DEFAULT 99,
    \`version_debut_affichage\` text,
    \`version_fin_affichage\` text,
    \`version_corps\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`version__status\` text DEFAULT 'draft',
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`latest\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`activites\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`version_image_id\`) REFERENCES \`medias\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_activites_v_parent_idx\` ON \`_activites_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_activites_v_version_version_image_idx\` ON \`_activites_v\` (\`version_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_activites_v_version_version_slug_idx\` ON \`_activites_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_activites_v_version_version_updated_at_idx\` ON \`_activites_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_activites_v_version_version_created_at_idx\` ON \`_activites_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_activites_v_version_version__status_idx\` ON \`_activites_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_activites_v_created_at_idx\` ON \`_activites_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_activites_v_updated_at_idx\` ON \`_activites_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_activites_v_latest_idx\` ON \`_activites_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`innovations_liens\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`libelle\` text,
    \`url\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`innovations\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`innovations_liens_order_idx\` ON \`innovations_liens\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`innovations_liens_parent_id_idx\` ON \`innovations_liens\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`innovations\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`titre\` text,
    \`resume\` text,
    \`image_id\` integer,
    \`slug\` text,
    \`visible\` integer DEFAULT true,
    \`archive\` integer DEFAULT false,
    \`ordre\` numeric DEFAULT 99,
    \`debut_affichage\` text,
    \`fin_affichage\` text,
    \`corps\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`_status\` text DEFAULT 'draft',
    FOREIGN KEY (\`image_id\`) REFERENCES \`medias\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`innovations_image_idx\` ON \`innovations\` (\`image_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`innovations_slug_idx\` ON \`innovations\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`innovations_updated_at_idx\` ON \`innovations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`innovations_created_at_idx\` ON \`innovations\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`innovations__status_idx\` ON \`innovations\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_innovations_v_version_liens\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`libelle\` text,
    \`url\` text,
    \`_uuid\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_innovations_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_innovations_v_version_liens_order_idx\` ON \`_innovations_v_version_liens\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_innovations_v_version_liens_parent_id_idx\` ON \`_innovations_v_version_liens\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_innovations_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`parent_id\` integer,
    \`version_titre\` text,
    \`version_resume\` text,
    \`version_image_id\` integer,
    \`version_slug\` text,
    \`version_visible\` integer DEFAULT true,
    \`version_archive\` integer DEFAULT false,
    \`version_ordre\` numeric DEFAULT 99,
    \`version_debut_affichage\` text,
    \`version_fin_affichage\` text,
    \`version_corps\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`version__status\` text DEFAULT 'draft',
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`latest\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`innovations\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`version_image_id\`) REFERENCES \`medias\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_innovations_v_parent_idx\` ON \`_innovations_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_innovations_v_version_version_image_idx\` ON \`_innovations_v\` (\`version_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_innovations_v_version_version_slug_idx\` ON \`_innovations_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_innovations_v_version_version_updated_at_idx\` ON \`_innovations_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_innovations_v_version_version_created_at_idx\` ON \`_innovations_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_innovations_v_version_version__status_idx\` ON \`_innovations_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_innovations_v_created_at_idx\` ON \`_innovations_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_innovations_v_updated_at_idx\` ON \`_innovations_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_innovations_v_latest_idx\` ON \`_innovations_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`partenaires\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`nom\` text,
    \`description\` text,
    \`url\` text,
    \`logo_id\` integer,
    \`slug\` text,
    \`visible\` integer DEFAULT true,
    \`archive\` integer DEFAULT false,
    \`ordre\` numeric DEFAULT 99,
    \`debut_affichage\` text,
    \`fin_affichage\` text,
    \`corps\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`_status\` text DEFAULT 'draft',
    FOREIGN KEY (\`logo_id\`) REFERENCES \`medias\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`partenaires_logo_idx\` ON \`partenaires\` (\`logo_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`partenaires_slug_idx\` ON \`partenaires\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`partenaires_updated_at_idx\` ON \`partenaires\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`partenaires_created_at_idx\` ON \`partenaires\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`partenaires__status_idx\` ON \`partenaires\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_partenaires_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`parent_id\` integer,
    \`version_nom\` text,
    \`version_description\` text,
    \`version_url\` text,
    \`version_logo_id\` integer,
    \`version_slug\` text,
    \`version_visible\` integer DEFAULT true,
    \`version_archive\` integer DEFAULT false,
    \`version_ordre\` numeric DEFAULT 99,
    \`version_debut_affichage\` text,
    \`version_fin_affichage\` text,
    \`version_corps\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`version__status\` text DEFAULT 'draft',
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`latest\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`partenaires\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`version_logo_id\`) REFERENCES \`medias\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_partenaires_v_parent_idx\` ON \`_partenaires_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_partenaires_v_version_version_logo_idx\` ON \`_partenaires_v\` (\`version_logo_id\`);`)
  await db.run(sql`CREATE INDEX \`_partenaires_v_version_version_slug_idx\` ON \`_partenaires_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_partenaires_v_version_version_updated_at_idx\` ON \`_partenaires_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_partenaires_v_version_version_created_at_idx\` ON \`_partenaires_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_partenaires_v_version_version__status_idx\` ON \`_partenaires_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_partenaires_v_created_at_idx\` ON \`_partenaires_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_partenaires_v_updated_at_idx\` ON \`_partenaires_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_partenaires_v_latest_idx\` ON \`_partenaires_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`pages\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`titre\` text,
    \`resume\` text,
    \`image_id\` integer,
    \`validation_legale\` integer DEFAULT false,
    \`slug\` text,
    \`visible\` integer DEFAULT true,
    \`archive\` integer DEFAULT false,
    \`ordre\` numeric DEFAULT 99,
    \`debut_affichage\` text,
    \`fin_affichage\` text,
    \`corps\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`_status\` text DEFAULT 'draft',
    FOREIGN KEY (\`image_id\`) REFERENCES \`medias\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_image_idx\` ON \`pages\` (\`image_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_slug_idx\` ON \`pages\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`pages_updated_at_idx\` ON \`pages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`pages_created_at_idx\` ON \`pages\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`pages__status_idx\` ON \`pages\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`parent_id\` integer,
    \`version_titre\` text,
    \`version_resume\` text,
    \`version_image_id\` integer,
    \`version_validation_legale\` integer DEFAULT false,
    \`version_slug\` text,
    \`version_visible\` integer DEFAULT true,
    \`version_archive\` integer DEFAULT false,
    \`version_ordre\` numeric DEFAULT 99,
    \`version_debut_affichage\` text,
    \`version_fin_affichage\` text,
    \`version_corps\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`version__status\` text DEFAULT 'draft',
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`latest\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`version_image_id\`) REFERENCES \`medias\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_parent_idx\` ON \`_pages_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_image_idx\` ON \`_pages_v\` (\`version_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_slug_idx\` ON \`_pages_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_updated_at_idx\` ON \`_pages_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_created_at_idx\` ON \`_pages_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version__status_idx\` ON \`_pages_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_created_at_idx\` ON \`_pages_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_updated_at_idx\` ON \`_pages_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_latest_idx\` ON \`_pages_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`informations_secteurs\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`libelle\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`informations\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`informations_secteurs_order_idx\` ON \`informations_secteurs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`informations_secteurs_parent_id_idx\` ON \`informations_secteurs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`informations_liens\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`libelle\` text,
    \`url\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`informations\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`informations_liens_order_idx\` ON \`informations_liens\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`informations_liens_parent_id_idx\` ON \`informations_liens\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`informations\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`nom\` text,
    \`nom_court\` text,
    \`baseline\` text,
    \`description\` text,
    \`ville\` text,
    \`telephone\` text,
    \`email\` text,
    \`adresse\` text,
    \`horaires\` text,
    \`contact_general\` text,
    \`contact_secretariat\` text,
    \`contact_coordination\` text,
    \`contacts_verifies\` integer DEFAULT false,
    \`doctolib_url\` text,
    \`slug\` text DEFAULT 'general',
    \`visible\` integer DEFAULT true,
    \`archive\` integer DEFAULT false,
    \`ordre\` numeric DEFAULT 99,
    \`debut_affichage\` text,
    \`fin_affichage\` text,
    \`corps\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`informations_slug_idx\` ON \`informations\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`informations_updated_at_idx\` ON \`informations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`informations_created_at_idx\` ON \`informations\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`informations__status_idx\` ON \`informations\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_informations_v_version_secteurs\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`libelle\` text,
    \`_uuid\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_informations_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_informations_v_version_secteurs_order_idx\` ON \`_informations_v_version_secteurs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_informations_v_version_secteurs_parent_id_idx\` ON \`_informations_v_version_secteurs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_informations_v_version_liens\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`libelle\` text,
    \`url\` text,
    \`_uuid\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_informations_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_informations_v_version_liens_order_idx\` ON \`_informations_v_version_liens\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_informations_v_version_liens_parent_id_idx\` ON \`_informations_v_version_liens\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_informations_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`parent_id\` integer,
    \`version_nom\` text,
    \`version_nom_court\` text,
    \`version_baseline\` text,
    \`version_description\` text,
    \`version_ville\` text,
    \`version_telephone\` text,
    \`version_email\` text,
    \`version_adresse\` text,
    \`version_horaires\` text,
    \`version_contact_general\` text,
    \`version_contact_secretariat\` text,
    \`version_contact_coordination\` text,
    \`version_contacts_verifies\` integer DEFAULT false,
    \`version_doctolib_url\` text,
    \`version_slug\` text DEFAULT 'general',
    \`version_visible\` integer DEFAULT true,
    \`version_archive\` integer DEFAULT false,
    \`version_ordre\` numeric DEFAULT 99,
    \`version_debut_affichage\` text,
    \`version_fin_affichage\` text,
    \`version_corps\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`version__status\` text DEFAULT 'draft',
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`latest\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`informations\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_informations_v_parent_idx\` ON \`_informations_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_informations_v_version_version_slug_idx\` ON \`_informations_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_informations_v_version_version_updated_at_idx\` ON \`_informations_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_informations_v_version_version_created_at_idx\` ON \`_informations_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_informations_v_version_version__status_idx\` ON \`_informations_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_informations_v_created_at_idx\` ON \`_informations_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_informations_v_updated_at_idx\` ON \`_informations_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_informations_v_latest_idx\` ON \`_informations_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`key\` text NOT NULL,
    \`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`global_slug\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`order\` integer,
    \`parent_id\` integer NOT NULL,
    \`path\` text NOT NULL,
    \`users_id\` integer,
    \`medias_id\` integer,
    \`professionnels_id\` integer,
    \`lieux_id\` integer,
    \`actualites_id\` integer,
    \`activites_id\` integer,
    \`innovations_id\` integer,
    \`partenaires_id\` integer,
    \`pages_id\` integer,
    \`informations_id\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`medias_id\`) REFERENCES \`medias\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`professionnels_id\`) REFERENCES \`professionnels\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`lieux_id\`) REFERENCES \`lieux\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`actualites_id\`) REFERENCES \`actualites\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`activites_id\`) REFERENCES \`activites\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`innovations_id\`) REFERENCES \`innovations\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`partenaires_id\`) REFERENCES \`partenaires\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`informations_id\`) REFERENCES \`informations\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_medias_id_idx\` ON \`payload_locked_documents_rels\` (\`medias_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_professionnels_id_idx\` ON \`payload_locked_documents_rels\` (\`professionnels_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_lieux_id_idx\` ON \`payload_locked_documents_rels\` (\`lieux_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_actualites_id_idx\` ON \`payload_locked_documents_rels\` (\`actualites_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_activites_id_idx\` ON \`payload_locked_documents_rels\` (\`activites_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_innovations_id_idx\` ON \`payload_locked_documents_rels\` (\`innovations_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_partenaires_id_idx\` ON \`payload_locked_documents_rels\` (\`partenaires_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_informations_id_idx\` ON \`payload_locked_documents_rels\` (\`informations_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`key\` text,
    \`value\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`order\` integer,
    \`parent_id\` integer NOT NULL,
    \`path\` text NOT NULL,
    \`users_id\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`name\` text,
    \`batch\` numeric,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`medias\`;`)
  await db.run(sql`DROP TABLE \`professionnels_horaires_par_lieu\`;`)
  await db.run(sql`DROP TABLE \`professionnels_domaines\`;`)
  await db.run(sql`DROP TABLE \`professionnels_activites\`;`)
  await db.run(sql`DROP TABLE \`professionnels\`;`)
  await db.run(sql`DROP TABLE \`professionnels_rels\`;`)
  await db.run(sql`DROP TABLE \`_professionnels_v_version_horaires_par_lieu\`;`)
  await db.run(sql`DROP TABLE \`_professionnels_v_version_domaines\`;`)
  await db.run(sql`DROP TABLE \`_professionnels_v_version_activites\`;`)
  await db.run(sql`DROP TABLE \`_professionnels_v\`;`)
  await db.run(sql`DROP TABLE \`_professionnels_v_rels\`;`)
  await db.run(sql`DROP TABLE \`lieux_photos\`;`)
  await db.run(sql`DROP TABLE \`lieux\`;`)
  await db.run(sql`DROP TABLE \`_lieux_v_version_photos\`;`)
  await db.run(sql`DROP TABLE \`_lieux_v\`;`)
  await db.run(sql`DROP TABLE \`actualites\`;`)
  await db.run(sql`DROP TABLE \`_actualites_v\`;`)
  await db.run(sql`DROP TABLE \`activites_liens\`;`)
  await db.run(sql`DROP TABLE \`activites\`;`)
  await db.run(sql`DROP TABLE \`_activites_v_version_liens\`;`)
  await db.run(sql`DROP TABLE \`_activites_v\`;`)
  await db.run(sql`DROP TABLE \`innovations_liens\`;`)
  await db.run(sql`DROP TABLE \`innovations\`;`)
  await db.run(sql`DROP TABLE \`_innovations_v_version_liens\`;`)
  await db.run(sql`DROP TABLE \`_innovations_v\`;`)
  await db.run(sql`DROP TABLE \`partenaires\`;`)
  await db.run(sql`DROP TABLE \`_partenaires_v\`;`)
  await db.run(sql`DROP TABLE \`pages\`;`)
  await db.run(sql`DROP TABLE \`_pages_v\`;`)
  await db.run(sql`DROP TABLE \`informations_secteurs\`;`)
  await db.run(sql`DROP TABLE \`informations_liens\`;`)
  await db.run(sql`DROP TABLE \`informations\`;`)
  await db.run(sql`DROP TABLE \`_informations_v_version_secteurs\`;`)
  await db.run(sql`DROP TABLE \`_informations_v_version_liens\`;`)
  await db.run(sql`DROP TABLE \`_informations_v\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
}
