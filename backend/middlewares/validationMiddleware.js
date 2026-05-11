// Registration validation middleware
export function validateRegistration(req, res, next) {
    const { fullName, email, password, gender, date_of_birth } = req.body;
    if (!fullName || !email || !password || !gender || !date_of_birth) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    const validGenders = ['Male', 'Female', 'Prefer not to say'];
    if (!validGenders.includes(gender)) {
        return res.status(400).json({ message: 'Invalid gender.' });
    }
    if (isNaN(Date.parse(date_of_birth))) {
        return res.status(400).json({ message: 'Invalid date of birth.' });
    }
    next();
}

// Login validation middleware
export function validateLogin(req, res, next) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    next();
} 