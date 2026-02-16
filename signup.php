
<?php
// Database connection
$host = "localhost";
$username = "root";
$password = "";
$database = "";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Insert Data
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $age = $_POST['age'];
    $name = !empty($_POST['name']) ? $_POST['name'] : "Learner";
    $email = $_POST['email'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO users (age, name, email, password) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("isss", $age, $name, $email, $password);

    if ($stmt->execute()) {
        echo "<script>alert('Account Created Successfully!'); window.location='index.html';</script>";
    } else {
        echo "Error: " . $stmt->error;
    }

    $stmt->close();
}

$conn->close();
?>


<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Omni-Learn | Join the Adventure</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f0f0f0;
            background-image: radial-gradient(var(--color-gray-200) 1px, transparent 1px);
            background-size: 20px 20px;
        }

        .auth-container {
            width: 100%;
            max-width: 400px;
            background: white;
            padding: 40px;
            border-radius: var(--radius-lg);
            border: 2px solid var(--color-gray-100);
            box-shadow: 0 4px 0 var(--color-gray-200);
            text-align: center;
        }

        .auth-logo {
            font-size: 40px;
            font-weight: 800;
            color: var(--color-primary);
            margin-bottom: 8px;
            display: block;
        }

        .auth-subtitle {
            font-size: 18px;
            color: var(--color-text-light);
            margin-bottom: 32px;
            font-weight: 600;
        }

        .form-group {
            margin-bottom: 20px;
            text-align: left;
        }

        .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 700;
            color: var(--color-text-main);
            font-size: 14px;
            text-transform: uppercase;
        }

        .form-input {
            width: 100%;
            height: 48px;
            padding: 0 16px;
            border: 2px solid var(--color-gray-100);
            border-radius: var(--radius-md);
            background-color: #f7f7f7;
            font-family: inherit;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.2s;
        }

        .form-input:focus {
            outline: none;
            border-color: var(--color-electric);
            background-color: white;
        }

        .btn-submit {
            width: 100%;
            margin-top: 16px;
        }

        .login-link {
            margin-top: 24px;
            font-weight: 700;
            color: var(--color-electric);
            text-decoration: none;
            display: inline-block;
            text-transform: uppercase;
            font-size: 14px;
            letter-spacing: 0.5px;
        }

        .login-link:hover {
            text-decoration: underline;
        }
    </style>
</head>

<body>

    <div class="auth-container">
        <span class="auth-logo">Omni</span>
        <p class="auth-subtitle">Create your profile to start learning</p>

        
           <form method="POST" action="" id="signup-form">
    <div class="form-group">
        <label class="form-label">Age</label>
        <input type="number" name="age" class="form-input" required min="3" max="120">
    </div>

    <div class="form-group">
        <label class="form-label">Name (Optional)</label>
        <input type="text" name="name" class="form-input">
    </div>

    <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" name="email" class="form-input" required>
    </div>

    <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" name="password" class="form-input" required minlength="6">
    </div>

    <button type="submit" class="btn btn-primary btn-submit">Create Account</button>
</form>

        </form>

        <a href="index.html" class="login-link">Already have an account?</a>
    </div>

    <script>
        document.getElementById('signup-form').addEventListener('submit', function (e) {
            e.preventDefault();
            const nameInput = this.querySelector('input[type="text"]');
            const name = nameInput.value.trim() || "Learner";
            
          
            const btn = this.querySelector('.btn-submit');
            btn.textContent = 'Creating...';
            
            localStorage.setItem('omniUser', JSON.stringify({
                name: name,
                joined: new Date().toISOString()
            }));

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        });
    </script>
</body>

</html>