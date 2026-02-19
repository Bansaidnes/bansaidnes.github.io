document.addEventListener("DOMContentLoaded", function() {
    const selectionView = document.getElementById("selection-view");
    const signupView = document.getElementById("signup-view");
    const successView = document.getElementById("success-view"); 
    const showSignupBtn = document.getElementById("show-signup-btn");
    const backBtn = document.getElementById("back-btn");
    const signupForm = document.getElementById("signup-form");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("toggle-password");
    const errorPopup = document.getElementById("error-popup");

    showSignupBtn.addEventListener("click", () => {
        selectionView.classList.add("fade-out");
        setTimeout(() => {
            selectionView.classList.add("hidden");
            selectionView.classList.remove("fade-out", "active");
            signupView.classList.remove("hidden");
            signupView.classList.add("active");
        }, 300);
    });

    backBtn.addEventListener("click", () => {
        signupView.classList.remove("active");
        signupView.classList.add("fade-out");
        setTimeout(() => {
            signupView.classList.add("hidden");
            signupView.classList.remove("fade-out");
            selectionView.classList.remove("hidden");
            selectionView.classList.add("active");
        }, 300);
    });

    togglePassword.addEventListener("click", function() {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);
        this.classList.toggle("fa-eye");
        this.classList.toggle("fa-eye-slash");
    });

    signupForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        
        const username = document.getElementById("username").value;
        const password = passwordInput.value;
        const submitBtn = document.getElementById("submit-btn");

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        
        if (!passwordRegex.test(password)) {
            showError("Password is too weak. Check requirements.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerText = "Creating...";

        try {
            const response = await fetch('/api/create_vpn_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                signupView.classList.remove("active");
                signupView.classList.add("fade-out");
                
                setTimeout(() => {
                    signupView.classList.add("hidden");
                    signupView.classList.remove("fade-out");
                    
                    successView.classList.remove("hidden");
                    successView.classList.add("active");
                }, 300);
                
            } else {
                showError(data.error || "Failed to create account.");
                submitBtn.disabled = false;
                submitBtn.innerText = "Create";
            }
        } catch (error) {
            console.error("Error:", error);
            showError("Network error occurred.");
            submitBtn.disabled = false;
            submitBtn.innerText = "Create";
        }
    });

    function showError(message) {
        errorPopup.innerText = message;
        errorPopup.classList.add("show");
        
        setTimeout(() => {
            errorPopup.classList.remove("show");
        }, 3000);
    }
});