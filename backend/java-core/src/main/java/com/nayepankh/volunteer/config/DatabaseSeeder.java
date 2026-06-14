package com.nayepankh.volunteer.config;

import com.nayepankh.volunteer.model.*;
import com.nayepankh.volunteer.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private VolunteerRepository volunteerRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private EventRegistrationRepository eventRegistrationRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private DonationRepository donationRepository;

    @Override
    public void run(String... args) throws Exception {
        if (volunteerRepository.count() == 0) {
            // BCrypt hash of "password123"
            String defaultHash = "$2a$10$BPC7Wwc19K.HbKZmofMdV.3lQ9PO9wJ6rvQPqcAss.oBZ.aOCvVoa";

            // ========== ADMIN ==========
            Volunteer admin = new Volunteer(
                    null, "Prashant Shukla", "admin@nayepankh.org", defaultHash,
                    "8318500748", 28, "Noida",
                    "Event Coordination, Fundraising", "Flexible", "admin",
                    LocalDateTime.now().minusMonths(6)
            );
            volunteerRepository.save(admin);

            // ========== 10 VOLUNTEERS (Last 2 months) ==========
            List<Volunteer> volunteers = Arrays.asList(
                    // Week 1 (most recent)
                    new Volunteer(null, "Aarav Sharma", "aarav@example.com", defaultHash,
                            "9876543210", 20, "Kanpur",
                            "Education & Teaching, Content Writing", "Weekends", "volunteer",
                            LocalDateTime.now().minusDays(3)),

                    new Volunteer(null, "Ishita Verma", "ishita@example.com", defaultHash,
                            "9812345678", 22, "Ghaziabad",
                            "Graphic Design, Social Media Outreach", "Flexible", "volunteer",
                            LocalDateTime.now().minusDays(7)),

                    // Week 2
                    new Volunteer(null, "Rohit Kumar", "rohit@example.com", defaultHash,
                            "9711223344", 19, "Kanpur",
                            "Education & Teaching", "Weekdays", "volunteer",
                            LocalDateTime.now().minusDays(14)),

                    new Volunteer(null, "Ananya Singh", "ananya@example.com", defaultHash,
                            "9611223344", 21, "Noida",
                            "Food Drive & Distribution, Event Coordination", "Weekends", "volunteer",
                            LocalDateTime.now().minusDays(18)),

                    // Week 3-4
                    new Volunteer(null, "Priya Patel", "priya@example.com", defaultHash,
                            "9511223344", 24, "Ghaziabad",
                            "Fundraising, Content Writing", "Flexible", "volunteer",
                            LocalDateTime.now().minusDays(25)),

                    new Volunteer(null, "Vikash Yadav", "vikash@example.com", defaultHash,
                            "9411223344", 18, "Kanpur",
                            "Education & Teaching, Social Media Outreach", "Weekends", "volunteer",
                            LocalDateTime.now().minusDays(32)),

                    // Month 2 (older)
                    new Volunteer(null, "Neha Gupta", "neha@example.com", defaultHash,
                            "9311223344", 23, "Noida",
                            "Graphic Design, Education & Teaching", "Weekdays", "volunteer",
                            LocalDateTime.now().minusDays(40)),

                    new Volunteer(null, "Siddharth Mishra", "siddharth@example.com", defaultHash,
                            "9211223344", 26, "Ghaziabad",
                            "Food Drive & Distribution", "Weekends", "volunteer",
                            LocalDateTime.now().minusDays(48)),

                    new Volunteer(null, "Kavya Reddy", "kavya@example.com", defaultHash,
                            "9111223344", 17, "Kanpur",
                            "Education & Teaching", "Flexible", "volunteer",
                            LocalDateTime.now().minusDays(55)),

                    new Volunteer(null, "Arjun Tiwari", "arjun@example.com", defaultHash,
                            "9011223344", 20, "Noida",
                            "Event Coordination, Fundraising", "Weekends", "volunteer",
                            LocalDateTime.now().minusDays(60))
            );
            volunteerRepository.saveAll(volunteers);
            System.out.println("✅ Seeded: 1 admin + 10 volunteers (last 2 months)");

            // ========== BRANCHES ==========
            List<Branch> branches = Arrays.asList(
                    createBranch("Kanpur HQ", "Kanpur", "Uttar Pradesh", "kanpur@nayepankh.org", "9876500001"),
                    createBranch("Ghaziabad Chapter", "Ghaziabad", "Uttar Pradesh", "ghaziabad@nayepankh.org", "9876500002"),
                    createBranch("Noida Chapter", "Noida", "Uttar Pradesh", "noida@nayepankh.org", "9876500003")
            );
            branchRepository.saveAll(branches);
            System.out.println("✅ Seeded: 3 branches (Kanpur, Ghaziabad, Noida)");

            // ========== EVENTS ==========
            List<Event> events = Arrays.asList(
                    createEvent("Weekend Teaching Drive - Math", "Free math tutoring for Class 6-8 students in Kanpur slums",
                            "education", LocalDateTime.now().plusDays(7), "Shivaji Nagar Community Center", "Kanpur", 20),
                    createEvent("Food Distribution Drive", "Monthly ration distribution to 50 families in Sector 62",
                            "food_drive", LocalDateTime.now().plusDays(14), "Sector 62 Park", "Noida", 15),
                    createEvent("Health Awareness Camp", "Basic health checkup and awareness for underprivileged children",
                            "health_camp", LocalDateTime.now().plusDays(21), "Government School Campus", "Ghaziabad", 25),
                    createEvent("English Speaking Workshop", "Spoken English classes for students preparing for interviews",
                            "education", LocalDateTime.now().minusDays(10), "NayePankh Office", "Kanpur", 12),
                    createEvent("Cleanliness Drive - Ganga Ghat", "Community cleanliness initiative near Ganga riverside",
                            "cleanliness", LocalDateTime.now().minusDays(20), "Sarsaiya Ghat", "Kanpur", 30)
            );
            // Mark past events as completed
            events.get(3).setStatus("completed");
            events.get(4).setStatus("completed");
            eventRepository.saveAll(events);
            System.out.println("✅ Seeded: 5 events (3 upcoming, 2 completed)");

            // ========== EVENT REGISTRATIONS ==========
            // Register some volunteers for past events with attendance
            List<Volunteer> savedVols = volunteerRepository.findAll();
            List<Event> savedEvents = eventRepository.findAll();

            if (savedEvents.size() >= 5 && savedVols.size() >= 5) {
                // Completed events - mark attendance
                Event completedEvent1 = savedEvents.get(3);
                Event completedEvent2 = savedEvents.get(4);

                for (int i = 1; i <= 4; i++) {
                    EventRegistration reg = new EventRegistration();
                    reg.setEventId(completedEvent1.getId());
                    reg.setVolunteerId(savedVols.get(i).getId());
                    reg.setStatus("attended");
                    reg.setHoursLogged(2.5);
                    eventRegistrationRepository.save(reg);
                }

                for (int i = 3; i <= 7; i++) {
                    EventRegistration reg = new EventRegistration();
                    reg.setEventId(completedEvent2.getId());
                    reg.setVolunteerId(savedVols.get(i).getId());
                    reg.setStatus("attended");
                    reg.setHoursLogged(3.0);
                    eventRegistrationRepository.save(reg);
                }

                // Upcoming events - some registrations
                Event upcomingEvent = savedEvents.get(0);
                for (int i = 1; i <= 6; i++) {
                    EventRegistration reg = new EventRegistration();
                    reg.setEventId(upcomingEvent.getId());
                    reg.setVolunteerId(savedVols.get(i).getId());
                    reg.setStatus("registered");
                    eventRegistrationRepository.save(reg);
                }
            }
            System.out.println("✅ Seeded: Event registrations + attendance records");

            // ========== STUDENTS ==========
            List<Student> students = Arrays.asList(
                    createStudent("Ravi Kumar", 12, "Govt. Primary School", "6th", "Kanpur", "Suresh Kumar", "9800011001"),
                    createStudent("Sunita Devi", 11, "Govt. Primary School", "5th", "Kanpur", "Ramesh Prasad", "9800011002"),
                    createStudent("Mohit Pal", 13, "Sarvodaya Vidyalaya", "7th", "Ghaziabad", "Dinesh Pal", "9800011003"),
                    createStudent("Aarti Kumari", 10, "Municipal School", "4th", "Noida", "Geeta Devi", "9800011004"),
                    createStudent("Rahul Kashyap", 14, "Govt. Inter College", "8th", "Kanpur", "Mohan Kashyap", "9800011005")
            );
            studentRepository.saveAll(students);
            System.out.println("✅ Seeded: 5 students (beneficiaries)");

            // ========== DONATIONS ==========
            List<Donation> donations = Arrays.asList(
                    createDonation("Rajesh Agarwal", "rajesh.ag@gmail.com", 25000.0, "education", "upi", LocalDateTime.now().minusDays(5)),
                    createDonation("Meera Foundation Trust", "info@meeratrust.org", 100000.0, "general", "bank_transfer", LocalDateTime.now().minusDays(15)),
                    createDonation("Sunil Kapoor", "sunil.k@yahoo.com", 5000.0, "food_drive", "upi", LocalDateTime.now().minusDays(22)),
                    createDonation("Anonymous Donor", null, 10000.0, "health", "cash", LocalDateTime.now().minusDays(35)),
                    createDonation("Priya Sharma", "priya.sh@outlook.com", 15000.0, "education", "online", LocalDateTime.now().minusDays(45))
            );
            donationRepository.saveAll(donations);
            System.out.println("✅ Seeded: 5 donations (₹1,55,000 total)");

            System.out.println("\n🌱 DATABASE SEEDING COMPLETE — System ready for demo!");
        }
    }

    // Helper methods
    private Branch createBranch(String name, String city, String state, String email, String phone) {
        Branch b = new Branch();
        b.setName(name);
        b.setCity(city);
        b.setState(state);
        b.setContactEmail(email);
        b.setContactPhone(phone);
        b.setFoundedAt(LocalDateTime.now().minusYears(2));
        return b;
    }

    private Event createEvent(String title, String desc, String type, LocalDateTime date, String location, String city, int capacity) {
        Event e = new Event();
        e.setTitle(title);
        e.setDescription(desc);
        e.setType(type);
        e.setEventDate(date);
        e.setLocation(location);
        e.setCity(city);
        e.setMaxCapacity(capacity);
        e.setCreatedBy(1L); // admin
        return e;
    }

    private Student createStudent(String name, int age, String school, String grade, String city, String guardian, String phone) {
        Student s = new Student();
        s.setName(name);
        s.setAge(age);
        s.setSchool(school);
        s.setGrade(grade);
        s.setCity(city);
        s.setGuardianName(guardian);
        s.setGuardianPhone(phone);
        return s;
    }

    private Donation createDonation(String name, String email, double amount, String campaign, String method, LocalDateTime date) {
        Donation d = new Donation();
        d.setDonorName(name);
        d.setDonorEmail(email);
        d.setAmount(amount);
        d.setCampaign(campaign);
        d.setPaymentMethod(method);
        d.setDonationDate(date);
        d.setReceiptNumber("NP-" + (int)(Math.random() * 99999));
        return d;
    }
}
