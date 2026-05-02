// API Base URL
const API_BASE = 'http://localhost:5000';

// Check if user is logged in
const currentUser = localStorage.getItem('user');
if (currentUser) {
    const user = JSON.parse(currentUser);
    document.getElementById('authLinks').style.display = 'none';
    document.getElementById('userLinks').style.display = 'block';
}

// Signup with OTP Flow
let signupData = {};

if (document.getElementById('signupForm')) {
    const signupForm = document.getElementById('signupForm');
    const emailInput = document.getElementById('email');
    const otpGroup = document.getElementById('otpGroup');
    const submitBtn = document.getElementById('submitBtn');
    let timerInterval = null;
    
    // Step 1: Send OTP when email is entered
    emailInput.addEventListener('blur', async () => {
        const email = emailInput.value;
        if (email && !signupData.emailVerified) {
            await sendOTP(email);
        }
    });
    
    async function sendOTP(email) {
        try {
            const response = await fetch(`${API_BASE}/api/otp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, purpose: 'signup' })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('OTP sent to your email! Check console for OTP');
                otpGroup.style.display = 'block';
                startTimer(300); // 5 minutes timer
                console.log('OTP:', data.otp); // For testing
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Send OTP error:', error);
            alert('Error sending OTP');
        }
    }
    
    function startTimer(seconds) {
        const timerDisplay = document.getElementById('timerDisplay');
        const resendBtn = document.getElementById('resendOtpBtn');
        let timeLeft = seconds;
        
        if (timerInterval) clearInterval(timerInterval);
        
        timerInterval = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            timerDisplay.textContent = `OTP expires in: ${minutes}:${secs.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerDisplay.textContent = 'OTP expired. Request a new one.';
                resendBtn.style.display = 'block';
            }
            timeLeft--;
        }, 1000);
    }
    
    // Resend OTP
    const resendBtn = document.getElementById('resendOtpBtn');
    if (resendBtn) {
        resendBtn.addEventListener('click', async () => {
            const email = emailInput.value;
            await sendOTP(email);
            startTimer(300);
            resendBtn.style.display = 'none';
        });
    }
    
    // Handle form submission
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = emailInput.value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const otp = document.getElementById('otp').value;
        
        if (!otp) {
            alert('Please enter OTP');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/api/otp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, purpose: 'signup' })
            });
            
            const data = await response.json();
            
            if (response.ok && data.verified) {
                // OTP verified, now create user
                const signupResponse = await fetch(`${API_BASE}/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ firstName, lastName, email, phone, password })
                });
                
                const signupData = await signupResponse.json();
                
                if (signupResponse.ok) {
                    alert('Signup successful! Please login.');
                    window.location.href = '/login.html';
                } else {
                    alert(signupData.message);
                }
            } else {
                alert(data.message || 'Invalid OTP');
            }
        } catch (error) {
            console.error('Verify error:', error);
            alert('Error verifying OTP');
        }
    });
}

// Login
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                alert('Login successful!');
                window.location.href = '/user/home.html';
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Error logging in');
        }
    });
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user');
        window.location.href = '/';
    });
}