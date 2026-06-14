const db = require('./db');
const bcrypt = require('bcryptjs');

function seed() {
  const count = db.prepare('SELECT COUNT(*) as c FROM volunteers').get().c;
  if (count > 0) return; // Already seeded

  const hash = bcrypt.hashSync('password123', 10);
  const now = new Date().toISOString();

  // Helper: date N days ago
  const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

  // --- ADMIN ---
  db.prepare(`INSERT INTO volunteers (name, email, password_hash, phone, age, city, skills, availability, role, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    'Prashant Shukla', 'admin@nayepankh.org', hash, '8318500748', 28, 'Noida',
    'Event Coordination, Fundraising', 'Flexible', 'admin', 'active', daysAgo(180)
  );

  // --- 10 VOLUNTEERS (last 2 months) ---
  const vols = [
    ['Aarav Sharma', 'aarav@example.com', '9876543210', 20, 'Kanpur', 'Education & Teaching, Content Writing', 'Weekends', 3],
    ['Ishita Verma', 'ishita@example.com', '9812345678', 22, 'Ghaziabad', 'Graphic Design, Social Media Outreach', 'Flexible', 7],
    ['Rohit Kumar', 'rohit@example.com', '9711223344', 19, 'Kanpur', 'Education & Teaching', 'Weekdays', 14],
    ['Ananya Singh', 'ananya@example.com', '9611223344', 21, 'Noida', 'Food Drive & Distribution, Event Coordination', 'Weekends', 18],
    ['Priya Patel', 'priya@example.com', '9511223344', 24, 'Ghaziabad', 'Fundraising, Content Writing', 'Flexible', 25],
    ['Vikash Yadav', 'vikash@example.com', '9411223344', 18, 'Kanpur', 'Education & Teaching, Social Media Outreach', 'Weekends', 32],
    ['Neha Gupta', 'neha@example.com', '9311223344', 23, 'Noida', 'Graphic Design, Education & Teaching', 'Weekdays', 40],
    ['Siddharth Mishra', 'siddharth@example.com', '9211223344', 26, 'Ghaziabad', 'Food Drive & Distribution', 'Weekends', 48],
    ['Kavya Reddy', 'kavya@example.com', '9111223344', 17, 'Kanpur', 'Education & Teaching', 'Flexible', 55],
    ['Arjun Tiwari', 'arjun@example.com', '9011223344', 20, 'Noida', 'Event Coordination, Fundraising', 'Weekends', 60],
  ];

  const insertVol = db.prepare(`INSERT INTO volunteers (name, email, password_hash, phone, age, city, skills, availability, role, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'volunteer', 'pending', ?)`);
  for (const v of vols) {
    insertVol.run(v[0], v[1], hash, v[2], v[3], v[4], v[5], v[6], daysAgo(v[7]));
  }
  console.log('✅ Seeded: 1 admin + 10 volunteers');

  // --- BRANCHES ---
  const insertBranch = db.prepare(`INSERT INTO branches (name, city, state, contact_email, contact_phone, founded_at) VALUES (?, ?, ?, ?, ?, ?)`);
  insertBranch.run('Kanpur HQ', 'Kanpur', 'Uttar Pradesh', 'kanpur@nayepankh.org', '9876500001', daysAgo(730));
  insertBranch.run('Ghaziabad Chapter', 'Ghaziabad', 'Uttar Pradesh', 'ghaziabad@nayepankh.org', '9876500002', daysAgo(730));
  insertBranch.run('Noida Chapter', 'Noida', 'Uttar Pradesh', 'noida@nayepankh.org', '9876500003', daysAgo(730));
  console.log('✅ Seeded: 3 branches');

  // --- EVENTS ---
  const insertEvent = db.prepare(`INSERT INTO events (title, description, type, event_date, location, city, max_capacity, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`);
  const futureDate = (days) => new Date(Date.now() + days * 86400000).toISOString();
  insertEvent.run('Weekend Teaching Drive - Math', 'Free math tutoring for Class 6-8 students', 'education', futureDate(7), 'Shivaji Nagar Community Center', 'Kanpur', 20, 'upcoming');
  insertEvent.run('Food Distribution Drive', 'Monthly ration distribution to 50 families', 'food_drive', futureDate(14), 'Sector 62 Park', 'Noida', 15, 'upcoming');
  insertEvent.run('Health Awareness Camp', 'Basic health checkup for children', 'health_camp', futureDate(21), 'Government School Campus', 'Ghaziabad', 25, 'upcoming');
  insertEvent.run('English Speaking Workshop', 'Spoken English for interview prep', 'education', daysAgo(10), 'NayePankh Office', 'Kanpur', 12, 'completed');
  insertEvent.run('Cleanliness Drive - Ganga Ghat', 'Community cleanliness initiative', 'cleanliness', daysAgo(20), 'Sarsaiya Ghat', 'Kanpur', 30, 'completed');
  console.log('✅ Seeded: 5 events');

  // --- EVENT REGISTRATIONS ---
  const insertReg = db.prepare(`INSERT INTO event_registrations (event_id, volunteer_id, status, hours_logged) VALUES (?, ?, ?, ?)`);
  // Completed events: mark attendance
  for (let i = 2; i <= 5; i++) insertReg.run(4, i, 'attended', 2.5);
  for (let i = 4; i <= 8; i++) insertReg.run(5, i, 'attended', 3.0);
  // Upcoming event registrations
  for (let i = 2; i <= 7; i++) insertReg.run(1, i, 'registered', null);
  console.log('✅ Seeded: Event registrations');

  // --- STUDENTS ---
  const insertStudent = db.prepare(`INSERT INTO students (name, age, school, grade, city, guardian_name, guardian_phone) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertStudent.run('Ravi Kumar', 12, 'Govt. Primary School', '6th', 'Kanpur', 'Suresh Kumar', '9800011001');
  insertStudent.run('Sunita Devi', 11, 'Govt. Primary School', '5th', 'Kanpur', 'Ramesh Prasad', '9800011002');
  insertStudent.run('Mohit Pal', 13, 'Sarvodaya Vidyalaya', '7th', 'Ghaziabad', 'Dinesh Pal', '9800011003');
  insertStudent.run('Aarti Kumari', 10, 'Municipal School', '4th', 'Noida', 'Geeta Devi', '9800011004');
  insertStudent.run('Rahul Kashyap', 14, 'Govt. Inter College', '8th', 'Kanpur', 'Mohan Kashyap', '9800011005');
  console.log('✅ Seeded: 5 students');

  // --- DONATIONS ---
  const insertDon = db.prepare(`INSERT INTO donations (donor_name, donor_email, amount, campaign, payment_method, receipt_number, donation_date) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertDon.run('Rajesh Agarwal', 'rajesh.ag@gmail.com', 25000, 'education', 'upi', 'NP-10001', daysAgo(5));
  insertDon.run('Meera Foundation Trust', 'info@meeratrust.org', 100000, 'general', 'bank_transfer', 'NP-10002', daysAgo(15));
  insertDon.run('Sunil Kapoor', 'sunil.k@yahoo.com', 5000, 'food_drive', 'upi', 'NP-10003', daysAgo(22));
  insertDon.run('Anonymous Donor', null, 10000, 'health', 'cash', 'NP-10004', daysAgo(35));
  insertDon.run('Priya Sharma', 'priya.sh@outlook.com', 15000, 'education', 'online', 'NP-10005', daysAgo(45));
  console.log('✅ Seeded: 5 donations');

  // --- FAQs ---
  const insertFaq = db.prepare(`INSERT INTO faqs (question, answer, category) VALUES (?, ?, ?)`);
  insertFaq.run('How do I register as a volunteer?', 'You can sign up on our homepage by clicking the Register button and filling in your details like name, email, city, skills, and availability.', 'Registration');
  insertFaq.run('Is there an age requirement to volunteer?', 'Volunteers of all age groups are welcome! We suggest a minimum age of 16 for independent tasks. Younger volunteers can assist with guardian consent.', 'General');
  insertFaq.run('How can I check my volunteer application status?', 'Once you log in, your profile and status will be displayed on your dashboard. Admins will review and update your status.', 'Account');
  insertFaq.run('What kind of volunteering opportunities are available?', 'We offer opportunities in teaching, content writing, social media, graphic design, fundraising, and event coordination.', 'Events');
  insertFaq.run('How do I contact NayePankh Foundation?', 'Email us at contact@nayepankh.org or call +91 8318500748. Visit us in Noida, Uttar Pradesh.', 'Support');
  insertFaq.run('What is NayePankh Foundation?', 'NayePankh Foundation is one of the leading student-led NGOs in India working towards empowering underprivileged children with education, food, and healthcare.', 'General');
  console.log('✅ Seeded: 6 FAQs');

  console.log('\n🌱 DATABASE SEEDING COMPLETE — System ready for demo!');
}

module.exports = seed;
