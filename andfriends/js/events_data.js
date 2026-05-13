// &FRIENDS — Central Events Data Store
// All events are managed here; Admin system will extend this via API

const EVENTS_DATA = [
    {
        id: "bongeziwe-mabandla-march2026",
        title: "Bongeziwe Mabandla",
        tag: "Live Music",
        date: "Sat, 15 March 2026",
        time: "19:00 – 22:00",
        image: "Resources/Bongeziwe.webp",
        description: "An intimate evening with one of South Africa's most captivating voices. Bongeziwe Mabandla brings his folk-rooted, soul-stirring sound to 5 De Beer — stories woven from the Eastern Cape, performed close enough to feel every breath. This is the kind of night you don't plan for. You just find yourself changed by it.",
        lineup: [
            { name: "Bongeziwe Mabandla", role: "Headline" },
            { name: "Opening Act TBA", role: "Support" }
        ],
        tickets: [
            { tier: "General Admission", price: 180, available: true },
            { tier: "VIP (Front Section)", price: 350, available: true },
            { tier: "Table for 2", price: 600, available: true }
        ],
        status: "upcoming"
    },
    {
        id: "chef-jes-march2026",
        title: "Chef Jes",
        tag: "Food & Culture",
        date: "Sun, 16 March 2026",
        time: "12:00 – 16:00",
        image: "Resources/Chef doveton.jpg",
        description: "Cooking as creative expression. Chef Jes brings bold flavours, warm hospitality, and a full afternoon of culinary storytelling. Expect a curated tasting menu, live cooking demonstrations, and conversations about food as a cultural force. This is not just a meal. It's a philosophy on a plate.",
        lineup: [],
        tickets: [
            { tier: "Tasting Experience", price: 250, available: true },
            { tier: "Workshop + Tasting", price: 480, available: true }
        ],
        status: "upcoming"
    },
    {
        id: "vuyo-vive-march2026",
        title: "Vuyo Vive",
        tag: "Afro Soul",
        date: "Fri, 21 March 2026",
        time: "20:00 – 23:00",
        image: "Resources/vuyo viwe.jpg",
        description: "Pure afro-soul energy. Vuyo Vive delivers rhythm, melody, and spirit colliding in real time. A night of pure connection where the music does not just fill the room — it fills you. Come ready to move, to feel, to lose track of everything except the present moment.",
        lineup: [
            { name: "Vuyo Vive", role: "Headline" },
            { name: "DJ Set – Warm Up", role: "Opening" }
        ],
        tickets: [
            { tier: "General Admission", price: 150, available: true },
            { tier: "VIP", price: 300, available: true }
        ],
        status: "upcoming"
    },
    {
        id: "words-of-azia-march2026",
        title: "Words of Azia",
        tag: "Poetry & Spoken Word",
        date: "Sat, 22 March 2026",
        time: "18:00 – 21:00",
        image: "Resources/words of azia.jpg",
        description: "Verses that sting, heal, challenge, and elevate. Words of Azia brings spoken word poetry as rebellion and medicine to the &FRIENDS stage. Raw, honest, and unforgettable — this is an evening for those who believe language can shift something fundamental inside you. Come open. Leave different.",
        lineup: [
            { name: "Words of Azia", role: "Headline" },
            { name: "Open Mic Collective", role: "Support Poets" }
        ],
        tickets: [
            { tier: "General Admission", price: 120, available: true },
            { tier: "Poet's Circle (Front Row)", price: 200, available: true }
        ],
        status: "upcoming"
    },
    {
        id: "nandi-april2026",
        title: "Nandi",
        tag: "Afro Jazz",
        date: "Sat, 5 April 2026",
        time: "19:30 – 22:30",
        image: "Resources/nandi.webp",
        description: "Afro jazz meeting contemporary soul. Nandi's voice carries the weight of tradition and the freedom of improvisation. An evening that bridges heritage and innovation, performed in one of Johannesburg's most intimate creative spaces.",
        lineup: [
            { name: "Nandi", role: "Headline" },
            { name: "Full Band", role: "Live Ensemble" }
        ],
        tickets: [
            { tier: "General Admission", price: 160, available: true },
            { tier: "VIP Table (seats 4)", price: 800, available: true }
        ],
        status: "upcoming"
    }
];

// Get event by ID
function getEventById(id) {
    return EVENTS_DATA.find(e => e.id === id) || null;
}

// Get upcoming events
function getUpcomingEvents() {
    return EVENTS_DATA.filter(e => e.status === "upcoming");
}

// Auth state (simulated — replace with real backend)
const AUTH_STATE = {
    user: JSON.parse(localStorage.getItem('af_user') || 'null'),
    isLoggedIn() { return !!this.user; },
    login(name, email) {
        this.user = { name, email, role: 'resident', id: 'u_' + Math.random().toString(36).slice(2) };
        localStorage.setItem('af_user', JSON.stringify(this.user));
    },
    logout() {
        this.user = null;
        localStorage.removeItem('af_user');
    }
};

// Ticket store (simulated)
const TICKET_STORE = {
    getAll() { return JSON.parse(localStorage.getItem('af_tickets') || '[]'); },
    save(ticket) {
        const tickets = this.getAll();
        tickets.push(ticket);
        localStorage.setItem('af_tickets', JSON.stringify(tickets));
    }
};