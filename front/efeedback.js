/* Check whether user is instructor; if not, redirect */
var _uname = getCookie("userName");
var _utype = getCookie("userType");
var _uid = getCookie("dbID");
var _eid = getCookie("activeReviewExam");

if(_utype != "instructor")
    window.location.href = "login.html";
if(_eid == "")
    window.location.href = "instructor.html";

/* Now that user is authorized to see the page, render header */
window.onload = function() 
{
    if(this.parent == this)
        renderHeader(_uname);
    getPageRenderData();
}

var examInfoList = null; /* list of exam info */


/* getPageRenderData() - will collect necessary class and exam information */
function getPageRenderData()
{
    console.log("called!");
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() 
    {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) 
        {
            /* Received the questionList array */
            //console.log(this.responseText);
            examInfoList = JSON.parse(this.responseText);
            renderPageElement('exams');
        }
    };
    xhr.open("GET", 'data.php?data=exams&id=' + _eid, true);
    xhr.send();
}

/* renderPageElement() - will render the specified element(s) on the page */
function renderPageElement(type)
{
    if(type === "exams")
    {   
        let listBox = document.getElementById("submission-list-box");

        /* first clear all the elements in the div */
        while(listBox.childElementCount)
            listBox.firstChild.remove();
        
        /* then draw each of the appropriate exam visual elements */
        for(let i=0; i < examInfoList.length; i++)
        {
            /* TODO: add exam elements to right flexbox here */
            let visualExam = document.createElement("div");
            visualExam.setAttribute("id", "vq"+i);
            visualExam.setAttribute("class", "visual-question");
            let p = document.createElement("p");
            p.innerHTML = '<b>Prompt:</b> ' + examInfoList[i]['prompt'];
            let ta1 = document.createElement("textarea");
            ta1.setAttribute("id", "ta1" + i);
            ta1.setAttribute("readOnly", "");
            ta1.value = examInfoList[i]['submissionText'];
            ta1.setAttribute("cols", "80");
            ta1.setAttribute("rows", "6");
            let p1 = document.createElement("p");
            p1.innerHTML = "<b>Student Submission</b>";
            let p2 = document.createElement("p");
            p2.innerHTML = "<b>Grader Feedback</b>";
            let ta2 = document.createElement("textarea");
            ta2.setAttribute("id", "ta2" + i);
            ta2.setAttribute("readOnly", "");
            ta2.setAttribute("cols", "80");
            ta2.setAttribute("rows", "6");
            /* get the auto feedback and present it in a nice way */
            let feedback = '';
            let autoFeedback = JSON.parse(examInfoList[i]['autoFeedback']);
            //console.log(autoFeedback);
            if(autoFeedback['firstPassed'] == "false")
                feedback += 'Program did not pass the first testcase (-' + parseFloat(autoFeedback['pointsLost'][0]).toFixed(2) + ')\n';
            if(autoFeedback['secondPassed'] == "false")
                feedback += 'Program did not pass the second testcase (-' + parseFloat(autoFeedback['pointsLost'][1]).toFixed(2) + ')\n';
            if(autoFeedback['ranSuccessfully'] == "false")
                feedback += 'Program did not run successfully (-' + parseFloat(autoFeedback['pointsLost'][2]).toFixed(2) + ')\n';
            if(autoFeedback['correctSignature'] == "false")
                feedback += 'Program did not have the correct function signature (-' + parseFloat(autoFeedback['pointsLost'][3]).toFixed(2) + ')\n';
            if(autoFeedback['hasReturn'] == "false")
                feedback += 'Program did not return from function (-' + parseFloat(autoFeedback['pointsLost'][4]).toFixed(2) + ')\n';

            feedback = (feedback == '') ? 'none' : feedback;
            ta2.value = "Points Lost:\n" + feedback;

            let p3 = document.createElement("p");
            p3.innerHTML = "<b>Max Points:</b> " + examInfoList[i]['maxPoints'] + "<br><b>Total Points Lost:</b> " + parseFloat(autoFeedback['pointsLost'].reduce((a,b) => a + b, 0)).toFixed(2) + '<br><b>Instructor Feedback:</b> ';

            let ta3 = document.createElement("textarea");
            ta3.setAttribute("id", "ta3" + i);
            ta3.setAttribute("cols", "80");
            ta3.setAttribute("rows", "6");
            
            let p4 = document.createElement("p");
            p4.innerHTML = "<b>Override Points Lost</b>";
            
            let override = document.createElement("input");
            override.setAttribute("id", "o"+i);


            visualExam.appendChild(p);
            visualExam.appendChild(p1);
            visualExam.appendChild(ta1);
            visualExam.appendChild(p2);
            visualExam.appendChild(ta2);
            visualExam.appendChild(p3);
            visualExam.appendChild(ta3);
            visualExam.appendChild(p4);
            visualExam.appendChild(override);

            listBox.appendChild(visualExam);
        }
    }
}

function validateInput()
{
    let submissionsBox = document.getElementById("submission-list-box");
    let errorLabel = document.getElementById("error-label");
    var updateInfo = [];

    errorLabel.innerHTML = "";

    for(let i=0; i < submissionsBox.childElementCount; i++)
    {
        let instructorFeedback = document.getElementById('ta3'+i).value;
        let overridePoints = document.getElementById('o'+i).value;
        overridePoints = (overridePoints == '') ? JSON.parse(examInfoList[i]['autoFeedback'])['pointsLost'].reduce((a,b) => a + b, 0) : overridePoints;
        let resultingPoints = parseFloat(overridePoints).toFixed(2);

        if(isNaN(resultingPoints))
            errorLabel.innerHTML = "You cannot have non-float input for overriding lost points.";
        else if(resultingPoints > parseFloat(examInfoList[i]['maxPoints']).toFixed(2))
            errorLabel.innerHTML = "You cannot have a question have a greater amount of points lost than it's worth.";
        else 
        {
            /* is valid */
            //console.log(resultingPoints);
            //console.log("EID: " + _eid + "\tQID: " + examInfoList[i]['qid'] + "\tSID: " + examInfoList[i]['sid']);
            var examUpdate = {
                "id": _eid,
                "qid": examInfoList[i]['qid'],
                "sid": examInfoList[i]['sid'],
                "instructorFeedback": instructorFeedback,
                "pointsReceived": parseFloat(examInfoList[i]['maxPoints']).toFixed(2) - resultingPoints
            };
            updateInfo.push(examUpdate);
        }
        
    }

    if(errorLabel.innerHTML == "")
    {
        /* no errors, submit feedback */
        submitFeedback(updateInfo);
    }
    
}

function submitFeedback(updateInfo)
{  
    console.log("attempting to submit feedback for exam ID " + _eid);
    //console.log(JSON.stringify(updateInfo));
    /* try to insert the valid question into database */
    var xhr = new XMLHttpRequest();
    xhr.open("POST", 'data.php', true);

    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); //We're sending JSON data in a string
    xhr.onreadystatechange = function() 
    {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) 
        {
            console.log(this.responseText);
            if(this.responseText == 'success')
                window.location.href = 'instructor.html';
            else
                document.getElementById("error-label").innerHTML = "There was an error submitting the feedback.";
        }
    };

    xhr.send("data=exams&id=" + _eid + "&content=" + JSON.stringify(updateInfo)); //send the JSON
}