<?php
    //JSON Credentials is available via $_POST['credentials']
    $cred = $_POST['credentials'];
    $c = json_decode($cred);
    
    //talk to mid.php via cURL and send a POST request with the (plaintext) credentials JSON string
    //and receive a result JSON string
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, "http://1fourone.io/webgrader/mid/login.php");
    curl_setopt($ch, CURLOPT_POST, TRUE);
    curl_setopt($ch, CURLOPT_POSTFIELDS, "credentials=" . $cred);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);

    $output = curl_exec($ch);
    curl_close($ch);

    if($output === false)
        echo 'Curl error: ' . curl_error($ch);
    else
        echo $output;
?>