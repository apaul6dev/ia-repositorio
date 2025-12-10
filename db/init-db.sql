-- Crea las bases parcels y parcels_test si no existen
SELECT 'CREATE DATABASE parcels'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'parcels')\gexec

SELECT 'CREATE DATABASE parcels_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'parcels_test')\gexec
