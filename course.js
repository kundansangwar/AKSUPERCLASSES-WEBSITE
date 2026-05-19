const SUBJECTS = {
    mathematics: {
        name: 'Maths Learning',
        tagline: "Unlock your child's Math super powers! Solve complex Math calculations in just seconds.",
        curriculum: 'Math-based curriculum for enhanced mental abilities',
        image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=900&q=80',
        duration: '6 Days',
        learners: '10-15'
    },
    physics: {
        name: 'Physics Mastery',
        tagline: 'Discover the rules behind motion, energy, and the universe through hands-on experiments and visual learning.',
        curriculum: 'Concept-based Physics with real-world experiments',
        image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=900&q=80',
        duration: '6 Days',
        learners: '10-15'
    },
    chemistry: {
        name: 'Chemistry Lab',
        tagline: 'From atoms to reactions — learn how everything around us is built, in fun and interactive sessions.',
        curriculum: 'Lab-based Chemistry curriculum with visual experiments',
        image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=900&q=80',
        duration: '6 Days',
        learners: '10-15'
    },
    biology: {
        name: 'Biology Explorer',
        tagline: 'Explore the living world — from cells to ecosystems — and develop a lifelong love for science.',
        curriculum: 'Story-driven Biology curriculum with interactive visuals',
        image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=900&q=80',
        duration: '6 Days',
        learners: '10-15'
    }
};

const CLASS_NAMES = {
    '1': '1st', '2': '2nd', '3': '3rd', '4': '4th',
    '5': '5th', '6': '6th', '7': '7th', '8': '8th', '9': '9th'
};

function renderCourse() {
    const params = new URLSearchParams(window.location.search);
    const subjectKey = (params.get('subject') || 'mathematics').toLowerCase();
    const classKey = params.get('class') || '5';

    const subject = SUBJECTS[subjectKey] || SUBJECTS.mathematics;
    const className = CLASS_NAMES[classKey] || '5th';

    document.getElementById('courseImage').src = subject.image;
    document.getElementById('courseImage').alt = `${subject.name} — Class ${className}`;
    document.getElementById('courseTitle').textContent = subject.name;
    document.getElementById('courseTagline').textContent = subject.tagline;
    document.getElementById('courseClass').textContent = `Class ${className}`;
    document.getElementById('courseDuration').textContent = subject.duration;
    document.getElementById('courseLearners').textContent = subject.learners;
    document.getElementById('courseCurriculum').textContent = subject.curriculum;
    document.title = `${subject.name} — Class ${className} | AK SUPER CLASSES`;

    document.getElementById('bookDemoBtn').addEventListener('click', () => {
        alert(`Demo request received for ${subject.name} (Class ${className}). We’ll contact you soon!`);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderCourse);
} else {
    renderCourse();
}
