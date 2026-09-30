// JWT Client JavaScript for HCMUTE Web Programming - ThS. Nguyen Huu Trung
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const profileContainer = document.getElementById('profileContainer');
    const logoutBtn = document.getElementById('logoutBtn');

    // 1. Handle Login Form Submit (Slide 28, 32, 33)
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            hideAlert();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showAlert('Vui lòng nhập đầy đủ Email và Mật khẩu', 'danger');
                return;
            }

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.token) {
                    // Save JWT token in localStorage
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('expiresIn', data.expiresIn);
                    showAlert('Đăng nhập thành công! Đang chuyển hướng...', 'success');
                    setTimeout(() => {
                        window.location.href = '/profile';
                    }, 800);
                } else {
                    const message = data.description || data.detail || 'Email hoặc mật khẩu không chính xác';
                    showAlert(message, 'danger');
                }
            } catch (err) {
                showAlert('Không thể kết nối đến máy chủ. Vui lòng thử lại!', 'danger');
            }
        });
    }

    // 2. Handle Register Form Submit (Slide 28, 32, 33)
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            hideAlert();

            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!fullName || !email || !password) {
                showAlert('Vui lòng điền đầy đủ các thông tin', 'danger');
                return;
            }

            try {
                const response = await fetch('/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    showAlert('Đăng ký tài khoản thành công! Đang chuyển đến trang đăng nhập...', 'success');
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 1200);
                } else {
                    const message = data.description || data.detail || 'Đăng ký thất bại. Email có thể đã tồn tại.';
                    showAlert(message, 'danger');
                }
            } catch (err) {
                showAlert('Lỗi khi gửi dữ liệu đăng ký. Vui lòng thử lại!', 'danger');
            }
        });
    }

    // 3. Handle Profile Load (Slide 29, 32, 33)
    if (profileContainer) {
        loadUserProfile();
    }

    // 4. Handle Logout (Slide 33)
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('token');
            localStorage.removeItem('expiresIn');
            window.location.href = '/login';
        });
    }
});

// Load profile data from /users/me using Bearer token
async function loadUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        const response = await fetch('/users/me', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
        }

        const user = await response.json();

        // Populate User Info
        document.getElementById('userId').textContent = user.id || 'N/A';
        document.getElementById('userName').textContent = user.fullName || 'N/A';
        document.getElementById('userEmail').textContent = user.email || 'N/A';
        document.getElementById('headerUserName').textContent = user.fullName || user.email;
        
        if (user.createdAt) {
            const date = new Date(user.createdAt);
            document.getElementById('userCreatedAt').textContent = date.toLocaleString('vi-VN');
        } else {
            document.getElementById('userCreatedAt').textContent = 'N/A';
        }

        const tokenDisplay = document.getElementById('tokenDisplay');
        if (tokenDisplay) {
            tokenDisplay.textContent = token;
        }

        // Load all users list (Slide 29: GET /users/)
        loadAllUsers(token);

    } catch (err) {
        console.error('Failed to load profile:', err);
    }
}

// Load list of all users from /users/
async function loadAllUsers(token) {
    try {
        const response = await fetch('/users/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const users = await response.json();
            const tbody = document.getElementById('userTableBody');
            if (tbody) {
                tbody.innerHTML = '';
                users.forEach(u => {
                    const tr = document.createElement('tr');
                    const createdDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'N/A';
                    tr.innerHTML = `
                        <td>${u.id}</td>
                        <td><strong>${escapeHtml(u.fullName)}</strong></td>
                        <td>${escapeHtml(u.email)}</td>
                        <td>${createdDate}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }
    } catch (e) {
        console.error('Failed to fetch user list:', e);
    }
}

function showAlert(message, type) {
    const alertBox = document.getElementById('alertBox');
    if (!alertBox) return;
    alertBox.className = 'alert alert-' + type;
    alertBox.textContent = message;
    alertBox.style.display = 'block';
}

function hideAlert() {
    const alertBox = document.getElementById('alertBox');
    if (!alertBox) return;
    alertBox.style.display = 'none';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
