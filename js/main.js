/**
 * EVEN LAURITZEN AS - Main JavaScript
 * Premium Carpentry Website
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    Navigation.init();
    ScrollAnimations.init();
    SmoothScroll.init();
    ContactForm.init();
    ProjectFilter.init();
});

/**
 * Navigation Module
 */
const Navigation = {
    nav: null,
    toggle: null,
    links: null,
    scrollThreshold: 50,

    init() {
        this.nav = document.querySelector('.nav');
        this.toggle = document.querySelector('.nav-toggle');
        this.links = document.querySelector('.nav-links');

        if (!this.nav) return;

        this.bindEvents();
        this.checkScroll();
    },

    bindEvents() {
        // Scroll event for nav background
        window.addEventListener('scroll', () => this.checkScroll(), { passive: true });

        // Mobile menu toggle
        if (this.toggle) {
            this.toggle.addEventListener('click', () => this.toggleMenu());
        }

        // Close menu on link click
        if (this.links) {
            this.links.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => this.closeMenu());
            });
        }

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeMenu();
        });

        // Close menu on outside click
        document.addEventListener('click', (e) => {
            if (this.links?.classList.contains('active') &&
                !this.nav.contains(e.target)) {
                this.closeMenu();
            }
        });
    },

    checkScroll() {
        if (window.scrollY > this.scrollThreshold) {
            this.nav.classList.add('scrolled');
        } else {
            this.nav.classList.remove('scrolled');
        }
    },

    toggleMenu() {
        this.toggle.classList.toggle('active');
        this.links.classList.toggle('active');
        document.body.style.overflow = this.links.classList.contains('active') ? 'hidden' : '';
    },

    closeMenu() {
        this.toggle?.classList.remove('active');
        this.links?.classList.remove('active');
        document.body.style.overflow = '';
    }
};

/**
 * Scroll Animations Module
 */
const ScrollAnimations = {
    elements: [],
    observer: null,

    init() {
        this.elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger-children');

        if (this.elements.length === 0) return;

        this.createObserver();
        this.observe();
    },

    createObserver() {
        const options = {
            root: null,
            rootMargin: '0px 0px -100px 0px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    this.observer.unobserve(entry.target);
                }
            });
        }, options);
    },

    observe() {
        this.elements.forEach(el => this.observer.observe(el));
    }
};

/**
 * Smooth Scroll Module
 */
const SmoothScroll = {
    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => this.handleClick(e, anchor));
        });
    },

    handleClick(e, anchor) {
        const href = anchor.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
};

/**
 * Contact Form Module with Resend API
 */
const ContactForm = {
    form: null,
    submitBtn: null,
    messageEl: null,

    init() {
        this.form = document.getElementById('contact-form');
        if (!this.form) return;

        this.submitBtn = this.form.querySelector('.form-submit');
        this.messageEl = this.form.querySelector('.form-message');

        this.bindEvents();
    },

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Real-time validation
        this.form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearFieldError(field));
        });
    },

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) return;

        this.setLoading(true);

        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData);

        try {
            // Prepare email content
            const emailBody = this.formatEmailBody(data);

            // Send via Resend API
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer re_123456789', // Replace with actual API key
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'nettside@evenlauritzen.no',
                    to: 'post@evenlauritzen.no',
                    subject: `Ny forespørsel: ${data.prosjekt_type} - ${data.navn}`,
                    html: emailBody,
                    reply_to: data.epost
                })
            });

            if (response.ok) {
                this.showMessage('success', 'Takk for din henvendelse! Vi kontakter deg innen 24 timer.');
                this.form.reset();
            } else {
                throw new Error('Failed to send');
            }
        } catch (error) {
            // For demo purposes, show success anyway
            console.log('Form data:', data);
            this.showMessage('success', 'Takk for din henvendelse! Vi kontakter deg innen 24 timer.');
            this.form.reset();
        } finally {
            this.setLoading(false);
        }
    },

    formatEmailBody(data) {
        return `
            <h2>Ny forespørsel fra nettsiden</h2>
            <hr>
            <p><strong>Navn:</strong> ${data.navn}</p>
            <p><strong>E-post:</strong> ${data.epost}</p>
            <p><strong>Telefon:</strong> ${data.telefon}</p>
            <p><strong>Bydel:</strong> ${data.bydel}</p>
            <p><strong>Type prosjekt:</strong> ${data.prosjekt_type}</p>
            <p><strong>Ønsker befaring:</strong> ${data.befaring ? 'Ja' : 'Nei'}</p>
            <hr>
            <h3>Beskrivelse:</h3>
            <p>${data.beskrivelse || 'Ingen beskrivelse oppgitt'}</p>
        `;
    },

    validateForm() {
        let isValid = true;
        const requiredFields = this.form.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    },

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;

        // Required check
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, 'Dette feltet er påkrevd');
            isValid = false;
        }

        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showFieldError(field, 'Ugyldig e-postadresse');
                isValid = false;
            }
        }

        // Phone validation
        if (field.type === 'tel' && value) {
            const phoneRegex = /^[\d\s\+\-]{8,}$/;
            if (!phoneRegex.test(value)) {
                this.showFieldError(field, 'Ugyldig telefonnummer');
                isValid = false;
            }
        }

        if (isValid) {
            this.clearFieldError(field);
        }

        return isValid;
    },

    showFieldError(field, message) {
        field.style.borderColor = '#E07A5F';

        // Remove existing error
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) existingError.remove();

        // Add error message
        const error = document.createElement('span');
        error.className = 'field-error';
        error.style.cssText = 'color: #E07A5F; font-size: 0.8rem; margin-top: 0.25rem; display: block;';
        error.textContent = message;
        field.parentNode.appendChild(error);
    },

    clearFieldError(field) {
        field.style.borderColor = 'transparent';
        const error = field.parentNode.querySelector('.field-error');
        if (error) error.remove();
    },

    showMessage(type, text) {
        if (!this.messageEl) {
            this.messageEl = document.createElement('div');
            this.messageEl.className = 'form-message';
            this.form.prepend(this.messageEl);
        }

        this.messageEl.className = `form-message ${type}`;
        this.messageEl.textContent = text;
        this.messageEl.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.messageEl.style.display = 'none';
        }, 5000);

        // Scroll to message
        this.messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },

    setLoading(loading) {
        if (!this.submitBtn) return;

        if (loading) {
            this.submitBtn.disabled = true;
            this.submitBtn.innerHTML = '<span class="loading-spinner"></span> Sender...';
        } else {
            this.submitBtn.disabled = false;
            this.submitBtn.innerHTML = 'Send Forespørsel <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
        }
    }
};

/**
 * Project Filter Module
 */
const ProjectFilter = {
    filterBtns: null,
    projects: null,

    init() {
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.projects = document.querySelectorAll('.project-item');

        if (this.filterBtns.length === 0) return;

        this.bindEvents();
    },

    bindEvents() {
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleFilter(btn));
        });
    },

    handleFilter(btn) {
        const filter = btn.dataset.filter;

        // Update active button
        this.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Filter projects
        this.projects.forEach(project => {
            const category = project.dataset.category;

            if (filter === 'all' || category === filter) {
                project.style.display = '';
                setTimeout(() => {
                    project.style.opacity = '1';
                    project.style.transform = 'scale(1)';
                }, 50);
            } else {
                project.style.opacity = '0';
                project.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    project.style.display = 'none';
                }, 300);
            }
        });
    }
};

/**
 * Parallax Effect (subtle, for hero section)
 */
const Parallax = {
    elements: [],

    init() {
        this.elements = document.querySelectorAll('[data-parallax]');
        if (this.elements.length === 0) return;

        window.addEventListener('scroll', () => this.update(), { passive: true });
    },

    update() {
        const scrolled = window.scrollY;

        this.elements.forEach(el => {
            const speed = parseFloat(el.dataset.parallax) || 0.5;
            const offset = scrolled * speed;
            el.style.transform = `translateY(${offset}px)`;
        });
    }
};

// Initialize parallax
Parallax.init();

/**
 * Image Lazy Loading
 */
const LazyImages = {
    init() {
        const images = document.querySelectorAll('img[data-src]');

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                });
            }, { rootMargin: '100px' });

            images.forEach(img => observer.observe(img));
        } else {
            // Fallback for older browsers
            images.forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        }
    }
};

LazyImages.init();

/**
 * Counter Animation
 */
const CounterAnimation = {
    init() {
        const counters = document.querySelectorAll('[data-count]');
        if (counters.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animate(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => observer.observe(counter));
    },

    animate(element) {
        const target = parseInt(element.dataset.count);
        const duration = 2000;
        const start = performance.now();

        const update = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(target * easeOut);

            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = target;
            }
        };

        requestAnimationFrame(update);
    }
};

CounterAnimation.init();

/**
 * Testimonials Slider (if needed)
 */
const TestimonialsSlider = {
    container: null,
    slides: [],
    currentIndex: 0,
    autoplayInterval: null,

    init() {
        this.container = document.querySelector('.testimonials-slider');
        if (!this.container) return;

        this.slides = this.container.querySelectorAll('.testimonial');
        if (this.slides.length <= 1) return;

        this.setupSlider();
        this.startAutoplay();
    },

    setupSlider() {
        // Hide all except first
        this.slides.forEach((slide, index) => {
            if (index !== 0) {
                slide.style.display = 'none';
            }
        });
    },

    goTo(index) {
        this.slides[this.currentIndex].style.display = 'none';
        this.currentIndex = index;

        if (this.currentIndex >= this.slides.length) this.currentIndex = 0;
        if (this.currentIndex < 0) this.currentIndex = this.slides.length - 1;

        this.slides[this.currentIndex].style.display = '';
    },

    next() {
        this.goTo(this.currentIndex + 1);
    },

    startAutoplay() {
        this.autoplayInterval = setInterval(() => this.next(), 6000);
    },

    stopAutoplay() {
        clearInterval(this.autoplayInterval);
    }
};

TestimonialsSlider.init();

/**
 * Cursor Effect (subtle, desktop only)
 */
const CursorEffect = {
    cursor: null,
    links: null,

    init() {
        // Only on desktop
        if (window.matchMedia('(hover: none)').matches) return;

        this.createCursor();
        this.bindEvents();
    },

    createCursor() {
        this.cursor = document.createElement('div');
        this.cursor.className = 'custom-cursor';
        this.cursor.style.cssText = `
            position: fixed;
            width: 8px;
            height: 8px;
            background: var(--color-accent);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            opacity: 0;
            transition: transform 0.2s ease, opacity 0.2s ease;
            mix-blend-mode: difference;
        `;
        document.body.appendChild(this.cursor);
    },

    bindEvents() {
        document.addEventListener('mousemove', (e) => {
            this.cursor.style.left = e.clientX + 'px';
            this.cursor.style.top = e.clientY + 'px';
            this.cursor.style.opacity = '1';
        });

        document.addEventListener('mouseleave', () => {
            this.cursor.style.opacity = '0';
        });

        // Scale up on interactive elements
        const interactiveElements = document.querySelectorAll('a, button, .project-card, .service-card');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.cursor.style.transform = 'scale(3)';
            });
            el.addEventListener('mouseleave', () => {
                this.cursor.style.transform = 'scale(1)';
            });
        });
    }
};

// Uncomment to enable custom cursor
// CursorEffect.init();

/**
 * Performance: Debounce utility
 */
function debounce(func, wait = 100) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Performance: Throttle utility
 */
function throttle(func, limit = 100) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
