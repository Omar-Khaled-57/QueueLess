-- Clear existing data
TRUNCATE TABLE queue_logs, tickets, queues, businesses, users RESTART IDENTITY CASCADE;

-- Insert Mock Users
-- Password is 'password123'
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User', 'admin@queueless.com', '$2b$10$L30ZG1Y5vfGJE9PWAna5V.WoLRazA5LckuJs77NcYTiQ3l7ubsWHO', 'admin'),
('John Doe', 'john@example.com', '$2b$10$L30ZG1Y5vfGJE9PWAna5V.WoLRazA5LckuJs77NcYTiQ3l7ubsWHO', 'user'),
('Jane Smith', 'jane@example.com', '$2b$10$L30ZG1Y5vfGJE9PWAna5V.WoLRazA5LckuJs77NcYTiQ3l7ubsWHO', 'user');

-- Insert Mock Businesses
INSERT INTO businesses (owner_id, name, description, category, address, image_url, is_active) VALUES
(1, 'Central Bank', 'Your trusted financial partner for all your banking needs. We offer personal and corporate banking services.', 'bank', '123 Finance Avenue, Downtown', '/res/bank.jpg', true),
(1, 'City Health Clinic', 'Providing top-notch medical consultations and health checkups without the long wait.', 'clinic', '45 Wellness Boulevard, Midtown', '/res/clinic.jpg', true),
(1, 'PharmaCare Plus', '24/7 pharmacy and health supplies. Fast prescription fulfillment and over-the-counter medicines.', 'pharmacy', '88 Cure Street, Uptown', '/res/pharmacy.jpg', true),
(1, 'State Department of Motor Vehicles', 'Driver licenses, vehicle registration, and state ID services.', 'government', '101 State Plaza, Civic Center', NULL, true),
(1, 'City Diagnostic Lab', 'Comprehensive laboratory testing and imaging services with rapid results.', 'lab', '200 Medical Way, Eastside', NULL, true),
(1, 'QuickFix Electronics', 'Expert repairing for phones, laptops, and more.', 'general', '42 Tech Lane, Suburbia', NULL, true);

-- Insert Mock Queues
INSERT INTO queues (business_id, name, is_open, avg_service_time_min) VALUES
-- Bank Queues
(1, 'Teller Services', true, 5),
(1, 'Loan Consultations', true, 20),
-- Clinic Queues
(2, 'General Walk-in', true, 15),
(2, 'Specialist Appointments', true, 30),
-- Pharmacy Queues
(3, 'Prescription Drop-off', true, 3),
(3, 'Prescription Pick-up', true, 2),
-- DMV
(4, 'License Renewal', true, 12),
(4, 'Vehicle Registration', true, 18),
-- Lab
(5, 'Blood Test', true, 5),
-- Repair
(6, 'Drop-off & Inspection', true, 10);

-- Insert Mock Tickets (for John Doe & Jane Smith)
-- Active waiting tickets
INSERT INTO tickets (queue_id, user_id, ticket_number, status) VALUES
(1, 2, 1, 'waiting'),
(1, 3, 2, 'waiting'),
(3, 2, 1, 'waiting');

-- Historical tickets for John Doe (user_id = 2)
INSERT INTO tickets (queue_id, user_id, ticket_number, status, joined_at, called_at, completed_at) VALUES
(1, 2, 101, 'done', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '10 minutes', NOW() - INTERVAL '2 days' + INTERVAL '15 minutes'),
(2, 2, 50, 'cancelled', NOW() - INTERVAL '5 days', NULL, NULL),
(3, 2, 202, 'skipped', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '8 minutes', NULL);

-- Log the ticket creations
INSERT INTO queue_logs (queue_id, ticket_id, action, actor_id) VALUES
(1, 1, 'join', 2),
(1, 2, 'join', 3),
(3, 3, 'join', 2),
(1, 4, 'join', 2),
(1, 4, 'done', 1),
(2, 5, 'join', 2),
(2, 5, 'cancel', 2),
(3, 6, 'join', 2),
(3, 6, 'skip', 1);
