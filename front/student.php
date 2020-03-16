<!DOCTYPE html>
<?php
    if(isset($_COOKIE['userType']) && $_COOKIE['userType'] != "student") {
        echo "You're not authorized/logged in to see this page.\n\nPlease log in as a student first.";
        header("Location: http://1fourone.io/webgrader/front/index.php");
    }
?>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebQuiz Student Home</title>
</head>
<body>
    <h1 id="header">Welcome, student!</h1>
    <p><b>Username:</b> <?php echo $_COOKIE['userName'];?></p>
    <p><b>ID:</b> <?php echo $_COOKIE['dbID'];?></p>
    <button><a href="login.php?logout=true">Log Out</a></button>
</body>
</html>