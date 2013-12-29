var gMyScrollArea = null;
var rbCommand = null;

function setup()
{
	if(window.widget)
	{
		var gMyScrollbar = new AppleVerticalScrollbar(
	        document.getElementById("myScrollbar")
	    );
	 
	    gMyScrollArea = new AppleScrollArea(
	        document.getElementById("myScrollArea")
	    );
	 
	    gMyScrollArea.addScrollbar(gMyScrollbar);

		var apiKey = widget.preferenceForKey("asanaDailyTasksApiKey");
		var status = widget.preferenceForKey("asanaDailyTasksStatus");

		if (apiKey && apiKey.length > 0) {
			document.getElementById("api_key").value = apiKey;
		}

		if (status == "upcoming" ) {
			document.getElementById("status").selectedIndex = 1;
		} else if (status != "today") {
			widget.setPreferenceForKey("today","asanaDailyTasksStatus");
		}

		refresh();
	} else {
		var hidden = document.getElementById('hidden_json');	
		hidden.innerHTML = '{"tasks":[{"id":"123456789","name":"Test","parent":"Test parent","workspace_id":"987654321","workspace":"My workspace","projects":["Test project"],"due_on":"2014-01-03"}]}';

		refreshEnded(null);
	}
}

function changeApiKey(elem)
{	
	var apiKey = document.getElementById("api_key").value;
	
	if(window.widget)
	{
		widget.setPreferenceForKey(apiKey, "asanaDailyTasksApiKey");
	}
} 

function changeStatus(elem)
{	
	var status = document.getElementById("status");
	
	switch(status.selectedIndex)
	{
		case 0: 
			if(window.widget)
			{
				widget.setPreferenceForKey("today","asanaDailyTasksStatus");
			}
			break;
		case 1:
			if(window.widget)
			{
				widget.setPreferenceForKey("upcoming","asanaDailyTasksStatus");
			}
			break;
	}
} 

function refreshEnded(x)
{
	rbCommand = null;

	var hidden = document.getElementById('hidden_json');	
	var area = document.getElementById('myScrollArea');	
	area.innerHTML = "";
	try {
		var result = JSON.parse(hidden.innerHTML);
	} catch (e) {
		area.innerHTML = "Error: " + e + " -> " + hidden.innerHTML;
	}
	hidden.innerHTML = "";

	for (var i in result.tasks) {
	    var task = result.tasks[i];
		var tdiv = document.createElement("div");
		tdiv.className = "task";
		tdiv.onclick = openTask;

		var tidiv = document.createElement("div");
		tidiv.className = "task_id";
		tidiv.innerText = task.id;
		tdiv.appendChild(tidiv);

		var twidiv = document.createElement("div");
		twidiv.className = "task_workspace_id";
		twidiv.innerText = task.workspace_id;
		tdiv.appendChild(twidiv);

		var tndiv = document.createElement("div");
		tndiv.className = "task_name";
		tndiv.innerText = task.name;
		if (task.parent.length > 0) {
			var tpnspan = document.createElement("span");
			tpnspan.className = "task_parent_name";
			tpnspan.innerText = "(" + task.parent + ")";
			tndiv.appendChild(tpnspan);
		}
		tdiv.appendChild(tndiv);

		var twpdiv = document.createElement("div");
		twpdiv.className = "task_workspace_project";
		var twspan = document.createElement("span");
		twspan.className = "task_workspace";
		twspan.innerText = task.workspace;
		var tpspan = document.createElement("span");
		tpspan.className = "task_projects";
		tpspan.innerText = "";
		for (var j in task.projects) {
	    	var proj = task.projects[j];
	    	if (j == 0)
		    	tpspan.innerText = proj;
		    else
		    	tpspan.innerText = tpspan.innerText + ", " + proj;
		}
		twpdiv.appendChild(twspan);
		twpdiv.appendChild(tpspan);
		tdiv.appendChild(twpdiv);

		var tddiv = document.createElement("div");
		tddiv.className = "task_due_on";
		tddiv.innerText = task.due_on;
		tdiv.appendChild(tddiv);

		area.appendChild(tdiv);
	}

	if (gMyScrollArea)
		gMyScrollArea.refresh();

	var update = document.getElementById('front_header_update');
	var currentdate = new Date();
	update.innerText = "Last update: " + currentdate.getFullYear() + "-" + (currentdate.getMonth()+1) + "-" + currentdate.getDate() + " " +
		+ currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();
}

function refreshOutput(out)
{
	var hidden = document.getElementById('hidden_json');

	hidden.innerHTML = hidden.innerHTML + out;
}

function refresh()
{
	area = document.getElementById('myScrollArea');	
	area.innerHTML = "";
	var hidden = document.getElementById('hidden_json');
	hidden.innerHTML = "";
	gMyScrollArea.refresh();
	var update = document.getElementById('front_header_update');
	update.innerText = "Refreshing...";

	if(window.widget)
	{
		var apiKey = widget.preferenceForKey("asanaDailyTasksApiKey");
		var status = widget.preferenceForKey("asanaDailyTasksStatus");

		if (rbCommand != null) {
			rbCommand.cancel();
			rbCommand = null;
		}

		var rbCommand = widget.system("AsanaDailyTasks.rb " + apiKey + " " + status, refreshEnded);
		rbCommand.onreadoutput = refreshOutput;

	}
}

function openTask(ev)
{
	var target = ev.target;
	var ws_id = 0;
	var task_id = 0;
	var target_task = null;

	if (target.className == "task")
		target_task = target;
	else if (target.parentNode.className == "task")
		target_task = target.parentNode;
	else if (target.parentNode.parentNode.className == "task")
		target_task = target.parentNode.parentNode;

	for (var i in target_task.childNodes) {
	    if (target_task.childNodes[i].className == "task_id") {
    		task_id = target_task.childNodes[i].innerText;
    	} else if (target_task.childNodes[i].className == "task_workspace_id") {
    		ws_id = target_task.childNodes[i].innerText;
    	}
    } 

	if(window.widget)
	{
		if (task_id != 0 && ws_id != 0)
			widget.openURL("https://app.asana.com/0/" + ws_id + "/" + task_id);
	} else {
		console.log(ev.target.className + " -> https://app.asana.com/0/" + ws_id + "/" + task_id);
	}
}

/*********************************/
// HIDING AND SHOWING PREFERENCES
/*********************************/

// showPrefs() is called when the preferences flipper is clicked upon.  It freezes the front of the widget,
// hides the front div, unhides the back div, and then flips the widget over.

function showPrefs()
{
	var front = document.getElementById("front");
	var back = document.getElementById("back");
	
	if (window.widget)
		widget.prepareForTransition("ToBack");		// freezes the widget so that you can change it without the user noticing
	
	front.style.display="none";		// hide the front
	back.style.display="block";		// show the back
	
	if (window.widget)
		setTimeout ('widget.performTransition();', 0);		// and flip the widget over	

	document.getElementById('fliprollie').style.display = 'none';  // clean up the front side - hide the circle behind the info button
	document.getElementById('flip').onclick = hidePrefs;
}


// hidePrefs() is called by the done button on the back side of the widget.  It performs the opposite transition
// as showPrefs() does.

function hidePrefs()
{
	var front = document.getElementById("front");
	var back = document.getElementById("back");
	
	if (window.widget)
		widget.prepareForTransition("ToFront");		// freezes the widget and prepares it for the flip back to the front
	
	back.style.display="none";			// hide the back
	front.style.display="block";		// show the front
	
	if (window.widget)
		setTimeout ('widget.performTransition();', 0);		// and flip the widget back to the front

	document.getElementById('fliprollie').style.display = 'none'; 
	document.getElementById('flip').onclick = showPrefs;
}


// PREFERENCE BUTTON ANIMATION (- the pref flipper fade in/out)

var flipShown = false;		// a flag used to signify if the flipper is currently shown or not.


// A structure that holds information that is needed for the animation to run.
var animation = {duration:0, starttime:0, to:1.0, now:0.0, from:0.0, firstElement:null, timer:null};


// mousemove() is the event handle assigned to the onmousemove property on the front div of the widget. 
// It is triggered whenever a mouse is moved within the bounds of your widget.  It prepares the
// preference flipper fade and then calls animate() to performs the animation.

function mousemove (event)
{
	if (!flipShown)			// if the preferences flipper is not already showing...
	{
		if (animation.timer != null)			// reset the animation timer value, in case a value was left behind
		{
			clearInterval (animation.timer);
			animation.timer  = null;
		}
		
		var starttime = (new Date).getTime() - 13; 		// set it back one frame
		
		animation.duration = 500;												// animation time, in ms
		animation.starttime = starttime;										// specify the start time
		animation.firstElement = document.getElementById ('flip');		// specify the element to fade
		animation.timer = setInterval ("animate();", 13);						// set the animation function
		animation.from = animation.now;											// beginning opacity (not ness. 0)
		animation.to = 1.0;														// final opacity
		animate();																// begin animation
		flipShown = true;														// mark the flipper as animated
	}
}

// mouseexit() is the opposite of mousemove() in that it preps the preferences flipper
// to disappear.  It adds the appropriate values to the animation data structure and sets the animation in motion.

function mouseexit (event)
{
	if (flipShown)
	{
		// fade in the flip widget
		if (animation.timer != null)
		{
			clearInterval (animation.timer);
			animation.timer  = null;
		}
		
		var starttime = (new Date).getTime() - 13;
		
		animation.duration = 500;
		animation.starttime = starttime;
		animation.firstElement = document.getElementById ('flip');
		animation.timer = setInterval ("animate();", 13);
		animation.from = animation.now;
		animation.to = 0.0;
		animate();
		flipShown = false;
	}
}


// animate() performs the fade animation for the preferences flipper. It uses the opacity CSS property to simulate a fade.

function animate()
{
	var T;
	var ease;
	var time = (new Date).getTime();
		
	
	T = limit_3(time-animation.starttime, 0, animation.duration);
	
	if (T >= animation.duration)
	{
		clearInterval (animation.timer);
		animation.timer = null;
		animation.now = animation.to;
	}
	else
	{
		ease = 0.5 - (0.5 * Math.cos(Math.PI * T / animation.duration));
		animation.now = computeNextFloat (animation.from, animation.to, ease);
	}
	
	animation.firstElement.style.opacity = animation.now;
}


// these functions are utilities used by animate()

function limit_3 (a, b, c)
{
    return a < b ? b : (a > c ? c : a);
}

function computeNextFloat (from, to, ease)
{
    return from + (to - from) * ease;
}

// these functions are called when the info button itself receives onmouseover and onmouseout events

function enterflip(event)
{
	document.getElementById('fliprollie').style.display = 'block';
}

function exitflip(event)
{
	document.getElementById('fliprollie').style.display = 'none';
}
