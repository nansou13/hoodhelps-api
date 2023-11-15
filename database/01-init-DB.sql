-- Active l'extension pour générer des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TYPE IF EXISTS groups;
CREATE TABLE groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    address TEXT, -- ou tu pourrais diviser en plusieurs champs comme street, city, postal_code, etc.
    cp VARCHAR(10),
    city VARCHAR(100),
    description TEXT,
    background_url TEXT
);

DROP TYPE IF EXISTS users;
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email LIKE '%@%'), -- vérifie que l'e-mail a un format valide
    password_hash VARCHAR(255) NOT NULL, -- stocke le hash du mot de passe, jamais le mot de passe en clair
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(100),
    image_url VARCHAR(255),
    date_of_birth DATE,
    date_registered TIMESTAMP DEFAULT current_timestamp,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')) -- rôles possibles pour gérer les permissions
);

DROP TYPE IF EXISTS user_groups;
CREATE TABLE user_groups (
    user_id UUID REFERENCES users(id),
    group_id UUID REFERENCES groups(id),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')), -- rôles possibles pour gérer les permissions
    joined_date TIMESTAMP DEFAULT current_timestamp,
    PRIMARY KEY (user_id, group_id)
);


-- Table des catégories de métiers
DROP TYPE IF EXISTS categories;
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Table des métiers
DROP TYPE IF EXISTS professions;
CREATE TABLE professions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category_id UUID REFERENCES categories(id)
);

DROP TYPE IF EXISTS user_professions;
CREATE TABLE user_professions (
    user_id UUID REFERENCES users(id),
    profession_id UUID REFERENCES professions(id),
    description TEXT,
    experience_years INTEGER,
    PRIMARY KEY (user_id, profession_id)
);

DROP TYPE IF EXISTS password_resets;
CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id), 
    reset_token_hash VARCHAR(255) NOT NULL,
    reset_token_expires TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp
);

