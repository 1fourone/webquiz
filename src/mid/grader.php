<?php

    /*  
        populateSubmissionFile($submission) - will prepare the contents of `submission.py`
        the grader will then take advantage of the file to run checks against it
        populating this file should NEVER fail as grading depends on it
        thus, if this fails, throw error and die.
    */
    function populateSubmissionFile($q) {
        $file = fopen("/tmp/submission.py", "w") or die ("unable to open submissions file");
        fwrite($file, rawurldecode($q->{'studentInput'}) . "\n");
        foreach($q->{'testCases'} as $tc) {
            fwrite($file, "print(" . $q->{'functionName'} . "(");
            
            /* print arrays/tuples 'as is' */
            if($tc[0][0] == "(" || $tc[0][0] == "[")
                fwrite($file, $tc[0]);
            else
            {
                $args = explode(" ", rawurldecode($tc[0]));
                for($i = 0; $i < count($args); $i++) {
                    fwrite($file, $args[$i]);
                    if($i != (count ($args) - 1))
                        fwrite($file, ",");
                }
            }
            fwrite($file, "))\n");
        }
        pclose($file);
    }

    /*  
        evaluateQuestion(q) - evaluates a single question/submission *object*
        returns a JSON string for a graderQuestionOutput object
    */
    function evaluateQuestion($q) {
        populateSubmissionFile($q);
        $outputString = shell_exec("python3.8 /tmp/submission.py 2>&1 ");
        $outputLines = explode("\n", $outputString);
        $result = (object)[];
        //var_dump(shell_exec("cat /tmp/submission.py"));
        //var_dump($outputString);

        /* Error handling */
        $errors = array("Error", "Interrupt", "Traceback");
        $errorFound = false;
        foreach($errors as $err) {
            if(!(strpos($outputString, $err) === FALSE ))
                $errorFound = true;
        }
        //var_dump("ERROR: " . $errorFound);
        //var_dump($outputString);
        /* Evaluate test cases/output */
        $testResults = array();
        $numOfTests = count($q->{'testCases'});
        $maxPoints = $q->{'maxPoints'};
        $conditions = 3 + $numOfTests;
        $takeOffPoints = floor(($maxPoints/$conditions));
        
        $result->{'qid'} = $q->{'qid'};
        $result->{'sid'} = $q->{'sid'};
        $result->{'maxPoints'} = $q->{'maxPoints'};
        
        

        if($errorFound == true) {
            for($i = 0; $i < $numOfTests; $i++)
                array_push($testResults, $takeOffPoints);
        }
        else {
            //check tests
            for($i = 0 ; $i < $numOfTests; $i++) {
                $trueLine = ($q->{'constraintName'} == "print") ? 2 * $i : $i;
                if($outputLines[$trueLine] != $q->{'testCases'}[$i][1])
                    array_push($testResults, $takeOffPoints);
                else
                    array_push($testResults, 0);
            }
        }
        $result->{'tests'} = $testResults;

        /* Evaluate remaining criteria */
        //var_dump(($q->{'studentInput'} . "(", $q->{'functionName'}));
        //var_dump("Q IS " . $q);
         //var_dump($q->{"functionName"});
        //var_dump(rawurlencode($q->{'studentInput'}));
        //var_dump(strpos($q->{'studentInput'}, $q->{'functionName'} . "("));
        if(strpos(rawurldecode($q->{'studentInput'}), $q->{'functionName'} . "(") === FALSE)
            $result->{'name'} = $takeOffPoints;
        else 
            $result->{'name'} = 0;

        $studentLines = explode("\n", rawurldecode($q->{'studentInput'}));
        if($studentLines[0][strlen($studentLines[0])-1] != ":") 
            $result->{'colon'} = $takeOffPoints;
        else
            $result->{'colon'} = 0;

        if(strpos(rawurldecode($q->{'studentInput'}), $q->{'constraintName'}) === FALSE)
            $result->{'constraintName'} = $takeOffPoints;
        else
            $result->{'constraintName'} = 0;
            
        return json_encode($result);
    }
    
    /*  
        If the request is from the tester, just do specific question 
        Otherwise, return the array with every question's graded output 
    */
    $type = $_GET['type'];
    //echo "hi";
    if($type === "test")
        echo evaluateQuestion(json_decode($_GET['question']));
    else {
        //var_dump($_POST['data']);
        //file_get_contents("php://input");
        //$data = json_decode($_POST['data']);
        $content = file_get_contents("php://input");
        $data = json_decode(strstr($content, "["));
        //var_dump($content);
        //var_dump($data);
        $output = array();
        //var_dump("hi");
        foreach ($data as $q) {
            array_push($output, evaluateQuestion($q));
        }
        
        echo json_encode($output);
    }
?>