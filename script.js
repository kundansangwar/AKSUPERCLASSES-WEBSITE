document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // All Courses dropdown - click to toggle
    const dropdown = document.querySelector('.dropdown');
    const allCoursesBtn = document.querySelector('.all-courses-btn');

    if (allCoursesBtn && dropdown) {
        allCoursesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });

        // Close after selecting an option
        dropdown.querySelectorAll('.dropdown-menu a').forEach(link => {
            link.addEventListener('click', () => {
                dropdown.classList.remove('open');
            });
        });
    }
});

// Slider dots interactive
const dots = document.querySelectorAll('.dot');
let currentSlide = 0;

dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        dots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        currentSlide = index;
    });
});

// Auto-rotate slider dots
setInterval(() => {
    dots.forEach(d => d.classList.remove('active'));
    currentSlide = (currentSlide + 1) % dots.length;
    dots[currentSlide].classList.add('active');
}, 3500);

// Smooth scroll for CTA
document.querySelector('.cta-btn')?.addEventListener('click', () => {
    document.querySelector('.courses-section')?.scrollIntoView({
        behavior: 'smooth'
    });
});

// Enroll buttons feedback
document.querySelectorAll('.enroll-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const card = e.target.closest('.course-card');
        const courseName = card.querySelector('h3').textContent;
        alert(`Thanks for your interest in "${courseName}"! Redirecting to enrollment...`);
    });
});

// Login button
document.querySelector('.login-btn')?.addEventListener('click', () => {
    alert('Login/Register page coming soon!');
});

// Book a Demo button (navbar)
document.querySelectorAll('.book-demo-nav').forEach(btn => {
    btn.addEventListener('click', () => {
        // If we're on the contact page, scroll to the form. Otherwise navigate there.
        if (window.location.pathname.endsWith('contact.html')) {
            document.querySelector('#contactForm')?.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.location.href = 'contact.html#contactForm';
        }
    });
});

// Floating call button
document.querySelector('.floating-call')?.addEventListener('click', () => {
    alert('Call us at: 1800-123-4567');
});

// Contact form
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const success = document.getElementById('formSuccess');
        if (success) success.hidden = false;
        contactForm.reset();
    });
}

// Scroll header shadow effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 10) {
        navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
    } else {
        navbar.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04)';
    }
});
