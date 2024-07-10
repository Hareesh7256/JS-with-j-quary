/*/Home Screen JS Start/*/////////////////////////////////////////////////////////////////////////////

$(document).ready(function() {
    // Retrieve the saved IP address from local storage
    var savedIP = localStorage.getItem('savedIP');
    
    if (savedIP) {   
        // Make a request to the API endpoint
        $.ajax({
            url: "https://ipc.iotkeystone.com:44"+ savedIP+"/api/getStationInfo",
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                // Check if the response contains the expected structure
                if (!response.error) {
                    // Update the label with the data
                    $('#stationName').text(response.data.station_name);
                    $('#companyName').text(response.data.company_name);
                    $('#email').text(response.data.email);
                    $('#website').text(response.data.website);
                    $('#noOfSP').text(response.data.noOfSP);
                    $('#noOfCP').text(response.data.noOfCP);
                } else {
                    console.error('API returned an error:', response.message);
                }
            },
            error: function(xhr, status, error) {
                // Handle any errors
                console.error('There was a problem with the fetch operation:', error);
            }
        });
    } else {
        // If IP address is not found, show an error message
        showError("IP address not found in local storage.");
    }
});

/*/Home Screen JS End/*/////////////////////////////////////////////////////////////////////////////

/*/Main Screen JS Start/*/////////////////////////////////////////////////////////////////////////////
//Emergency Slide Start//

$(document).ready(function() {
    // Establish WebSocket connection
    var savedIP = localStorage.getItem('savedIP');
    if (savedIP) {
        var ws = new WebSocket("wss://ws.iotkeystone.com:80" + savedIP + "/ws/allDataLive");

        ws.onopen = function() {
            console.log('WebSocket connection established');
        };

        ws.onmessage = function(event) {
            var data = JSON.parse(event.data);
            // Check if received data has Emergency_Stop_IOT and update the toggle button
            if (data.registers && data.registers.Emergency_Stop_IOT !== undefined) {
                var isChecked = data.registers.Emergency_Stop_IOT === 1;
                $('#emergencyStopSwitch').prop('checked', isChecked);
            }
        };

        ws.onerror = function(error) {
            console.error('WebSocket error:', error);
        };
    } else {
        console.error("No saved IP found.");
    }

    // Change event listener for the slider
    $('#emergencyStopSwitch').change(function() {
        var valueToSend = $(this).is(':checked') ? 1 : 0; // Send 1 if checked, otherwise 0
        sendMessageToBackend(valueToSend);
    });

    // Function to send message to the backend
    function sendMessageToBackend(value) {
        const message = {
            registers: [{
                tag: "Emergency_Stop_IOT",
                value: value
            }]
        };

        console.log("Sending message to backend:", JSON.stringify(message)); // Log sending message

        var savedIP = localStorage.getItem('savedIP');
        if (savedIP) {
            var url = "https://ipc.iotkeystone.com:44" + savedIP + "/api/registers";

            $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(message),
                success: function() {
                    console.log('Message sent successfully');
                },
                error: function(xhr, status, error) {
                    console.error('There was a problem sending the message:', error);
                }
            });
        } else {
            console.error("No saved IP found.");
        }
    }

    // Function to fetch the current status of Emergency_Stop_IOT on page load
    function fetchCurrentStatus() {
        var savedIP = localStorage.getItem('savedIP');
        if (savedIP) {
            var url = "https://ipc.iotkeystone.com:44" + savedIP + "/api/registers";

            $.ajax({
                url: url,
                type: 'GET',
                success: function(data) {
                    if (data.registers && data.registers.Emergency_Stop_IOT !== undefined) {
                        var isChecked = data.registers.Emergency_Stop_IOT === 1;
                        $('#emergencyStopSwitch').prop('checked', isChecked);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('There was a problem fetching the current status:', error);
                }
            });
        } else {
            console.error("No saved IP found.");
        }
    }

    // Fetch the current status on page load
    fetchCurrentStatus();
});

//Emergency Slide End//

//Auto-Mannual button Start// 

$(document).ready(function() {
    var savedIP = localStorage.getItem('savedIP');
    if (savedIP) {
        // Connect to WebSocket
        var socket = new WebSocket("wss://ws.iotkeystone.com:80" + savedIP + "/ws/allDataLive");

        // Define WebSocket onmessage event
        socket.onmessage = function(event) {
            var data = JSON.parse(event.data);
            
            // Check if Manual Mode Ready is 1
            if (data["Manual_Mode_Ready"] === 1) {
                $("#manualButton").css("background-color", "yellow");
            } else {
                $("#manualButton").css("background-color", ""); // Reset background color
            }
            
            // Check if Auto Mode Ready is 1
            if (data["Auto_Mode_Ready"] === 1) {
                $("#autoButton").css("background-color", "yellow");
                $("#autoBox").show(); // Show autoBox
            } else {
                $("#autoButton").css("background-color", ""); // Reset background color
                $("#autoBox").hide(); // Hide autoBox
            }

            // Check Operation_Start_stop value
            if (data["Operation_Start_stop"] === 1) {
                $("#startButton").css("background-color", "green");
                // Reset stopButton color
            } else {
                $("#startButton").css("background-color", "red"); // Reset startButton color
            }

         // Check Auto_Cycle_Stop value
            if (data["Auto_Cycle_Stop"] === 1) {
                $("#stopButton").css("background-color", "green");
                // Reset stopButton color
            } else {
                $("#stopButton").css("background-color", "red"); // Reset startButton color
            }
        };

        $("#autoButton").click(function() {
            var message = {
                "registers": [
                    {
                        "tag": "Auto_Mode_Enable",
                        "value": 1
                    }
                ]
            };
            sendMessageHTTP(message, savedIP);
            console.log("Sent message for Auto mode:", JSON.stringify(message));
        });

        $("#manualButton").click(function() {
            var message = {
                "registers": [
                    {
                        "tag": "Manual_Mode_Enable",
                        "value": 1
                    }
                ]
            };
            sendMessageHTTP(message, savedIP);
            console.log("Sent message for Manual mode:", JSON.stringify(message));
        });

        // Start button click event
        var startButtonClicked = false; // Flag to track button state
        $("#startButton").click(function() {
            var message = {
                "registers": [
                    {
                        "tag": "Operation_Start_stop",
                        "value": startButtonClicked ? 0 : 1 // Toggle between 0 and 1
                    }
                ]
            };
            sendMessageHTTP(message, savedIP);
            console.log("Sent message to start/stop auto cycle:", JSON.stringify(message));

            // Toggle button state
            startButtonClicked = !startButtonClicked;
        });

        // Stop button click event
        var stopButtonClicked = false; // Flag to track button state
        $("#stopButton").click(function() {
            var message = {
                "registers": [
                    {
                        "tag": "Auto_Cycle_Stop",
                        "value": stopButtonClicked ? 0 : 1 // Toggle between 0 and 1
                    }
                ]
            };
            sendMessageHTTP(message, savedIP);
            console.log("Sent message to start/stop auto cycle:", JSON.stringify(message));

            // Toggle button state
            stopButtonClicked = !stopButtonClicked;
        });
    }
});

function sendMessageHTTP(message, savedIP) {
    $.ajax({
        type: "POST",
        url: "https://ipc.iotkeystone.com:44" + savedIP + "/api/registers",
        contentType: "application/json",
        data: JSON.stringify(message),
        success: function(response) {
            console.log("HTTP POST successful. Response:", response);
        },
        error: function(xhr, status, error) {
            console.error("HTTP POST error:", error);
        }
    });
}

//Auto-Mannual button End// 

//Svg Pump-pipe-MoV Strat// 

var websocket;
var wsUri;

$(document).ready(function () {
    // Retrieve the saved IP address from local storage
    var savedIP = localStorage.getItem('savedIP');
    if (savedIP) {
        // If IP address is found, construct WebSocket URL
        wsUri = "wss://ws.iotkeystone.com:80"+savedIP+"/ws/liveStationData";
        startWebSocket(); // Start WebSocket connection
    } else {
        // If IP address is not found, show an error message
        showError("IP address not found in local storage.");
    }
});

function startWebSocket() {
    websocket = new WebSocket(wsUri);
    websocket.onopen = function (evt) {
        console.log("WebSocket connection opened");
    };

    websocket.onmessage = function (evt) {
        var responseData = JSON.parse(evt.data);
        // Process the received JSON response here
        console.log("Received JSON response:", responseData);


  var sp1 = responseData.SP1_Run_FB;
         var sp2 = responseData.SP_2_Run_FB;
         var sp3 = 0;
         var sp1trip = responseData.SP1_Trip;
         var sp2trip = responseData.SP_2_Trip;
        var sp3trip = 0;
 var sp1hrs = responseData.SP_1_Run_Hrs;
         var sp2hrs = responseData.SP_2_Run_Hrs;
         var sp3hrs = 0;
 var sp1failtostop = responseData.SP1_Failtostop;
 var sp2failtostop = responseData.SP2_Failtostop;
 var sp3failtostop = 0;
        var cp1 = responseData.CP_1_Run_FB;
        var cp2 = responseData.CP_2_Run_FB;
        var cp3 = responseData.CP_3_Run_FB;
 var cp4 = 0;
       var cp1trip = responseData.CP_1_Trip;
       var cp2trip = responseData.CP_2_Trip;
       var cp3trip = responseData.CP_3_Trip;
       var cp4trip = 0;
 var cp1hrs = responseData.CP_1_Run_Hrs;
         var cp2hrs = responseData.CP_2_Run_Hrs;
         var cp3hrs = responseData.CP_3_Run_Hrs;
         var cp4hrs = 0;
 var cp1failtostop = responseData.CP1_Failtostop;
        var cp2failtostop = responseData.CP2_Failtostop;
        var cp3failtostop = responseData.CP3_Failtostop;
 var cp4failtostop = 0;
 var mov1openfb = responseData.MOV_1_OPEN_FB;
 var mov2openfb = responseData.MOV_2_OPEN_FB;
 var mov3openfb = responseData.MOV_3_OPEN_FB;
 var mov4openfb = responseData.MOV_4_OPEN_FB;
 var mov1trip = responseData.MOV1_TRIP;
 var mov2trip = responseData.MOV2_TRIP;
 var mov3trip = responseData.MOV3_TRIP;
 var mov4trip = responseData.MOV4_TRIP;
 var pressuretxd = responseData.pump_house_Pressure_txd;
 var flowtxd = responseData.pump_house_Flow_Txd;

     
if (sp1trip === 1) {
            $("#sp01Base").addClass("blink-amber");
            $("#sp01Base").css("fill", "#FFBF00");
        } else {
            $("#sp01Base").removeClass("blink-amber");
            $("#sp01Base").css("fill", "gray");
            if (sp1 === 0) {
                $("#sp01Base").css("fill", "red");
            } else if (sp1 === 1) {
                $("#sp01Base").css("fill", "green");
                $("#subPmp01Out").css("fill", "#23AAE2");
            } else {
                $("#sp01Base").css("fill", "gray");
            }
        }

// Update UI based on sp2 response


 if (sp2trip === 1) {
            $("#sp02Base").addClass("blink-amber");
            $("#sp02Base").css("fill", "#FFBF00");
        } else {
            $("#sp02Base").removeClass("blink-amber");
            $("#sp02Base").css("fill", "gray");
            if (sp2 === 0) {
                $("#sp02Base").css("fill", "red");
            } else if (sp2 === 1) {
                $("#sp02Base").css("fill", "green");
                $("#subPmp02Out").css("fill", "#23AAE2");
            } else {
                $("#sp02Base").css("fill", "gray");
            }
        }


// Update UI based on sp3 response


 if (sp3trip === 1) {
            $("#sp02Base_2").addClass("blink-amber");
            $("#sp02Base_2").css("fill", "#FFBF00");
        } else {
            $("#sp02Base_2").removeClass("blink-amber");
            $("#sp02Base_2").css("fill", "gray");
            if (sp3 === 0) {
                $("#sp02Base_2").css("fill", "red");
            } else if (sp3 === 1) {
                $("#sp02Base_2").css("fill", "green");
                $("#subPmp02Out_2").css("fill", "#23AAE2");
            } else {
                $("#sp02Base_2").css("fill", "gray");
            }
        }

 
     
 $("#sp01TotalHrs tspan").text(sp1hrs);  
 $("#sp02TotalHrs tspan").text(sp2hrs);
 $("#sp02TotalHrs_2 tspan").text(sp3hrs);  


if (cp1trip === 1) {
    $("#cp01Base_2").addClass("blink-amber");
    $("#cp01Base_2").css("fill", "#FFBF00");
    
 
} else {
    $("#cp01Base_2").removeClass("blink-amber"); 
    $("#cp01Base_2").css("fill", "gray");
if (cp1 === 0) {
    $("#cp01Base_2").css("fill", "red");
} else if (cp1 === 1) {
    $("#cp01Base_2").css("fill", "green");
    $("#tankOutlet").css("fill", "#23AAE2");
    $("#tank2CP01").css("fill", "#23AAE2");
} else {
    $("#cp01Base_2").css("fill", "gray");
}
}

if (cp2trip === 1) {
    $("#cp02Base").addClass("blink-amber");
    $("#cp02Base").css("fill", "#FFBF00");
} else {
    $("#cp02Base").removeClass("blink-amber"); 
    $("#cp02Base").css("fill", "gray");
if (cp2 === 0) {
    $("#cp02Base").css("fill", "red");
    
} else if (cp2 === 1) {
    $("#cp02Base").css("fill", "green");
    $("#tankOutlet").css("fill", "#23AAE2");
    $("#Tank2CP02").css("fill", "#23AAE2"); 
} else {
    $("#cp02Base").css("fill", "gray");
}

}

if (cp3trip === 1) {
    $("#cp03Base").addClass("blink-amber");
    $("#cp03Base").css("fill", "#FFBF00");
   
} else {
    $("#cp03Base").removeClass("blink-amber"); 
    $("#cp03Base").css("fill", "gray");
if (cp3 === 0) {
    $("#cp03Base").css("fill", "red");
} else if (cp3 === 1) {
    $("#cp03Base").css("fill", "green");
    $("#tankOutlet").css("fill", "#23AAE2");
    $("#tank3CP03Out_2").css("fill", "#23AAE2");
    $("#tank3CP03Out").css("fill", "#23AAE2"); 
} else {
    $("#cp03Base").css("fill", "gray");

}
}

if (cp4trip === 1) {
    $("#cp01Base").addClass("blink-amber");
    $("#cp01Base").css("fill", "#FFBF00");
   
} else {
    $("#cp01Base").removeClass("blink-amber"); 
    $("#cp01Base").css("fill", "gray");
if (cp4 === 0) {
    $("#cp01Base").css("fill", "red");
} else if (cp4 === 1) {
    $("#cp01Base").css("fill", "green");
    $("#tankOutlet").css("fill", "#23AAE2");
    $("#tank2CP04").css("fill", "#23AAE2");
    $("#tank3CP03Out_2").css("fill", "#23AAE2"); 
} else {
    $("#cp01Base").css("fill", "gray");

}
}

 if (mov1trip === 1) {
            $("#MOV02-handle_4").addClass("blink-amber");
     $("#MOV02-pipe_4").addClass("blink-amber");
            $("#MOV02-handle_4").css("fill", "#FFBF00");
     $("#MOV02-pipe_4").css("fill", "#FFBF00"); 
        } else {
            $("#MOV02-handle_4").removeClass("blink-amber");
     $("#MOV02-pipe_4").removeClass("blink-amber");
              if (mov1openfb === 1) {
                $("#MOV02-handle_4").css("fill", "green");
                $("#MOV02-pipe_4").css("fill", "green");
  $("#CP01toOut01").css("fill", "#23AAE2");   
  $("#CP01toOut01_2").css("fill", "#23AAE2");
  $("#outlet-network").css("fill", "#23AAE2");
            } else {
                $("#MOV02-handle_4").css("fill", "D30404");
  $("#MOV02-pipe_4").css("fill", "D30404");
            }
        }

 if (mov2trip === 1) {
            $("#MOV02-handle_3").addClass("blink-amber");
     $("#MOV02-pipe_3").addClass("blink-amber");
            $("#MOV02-handle_3").css("fill", "#FFBF00");
     $("#MOV02-pipe_3").css("fill", "#FFBF00"); 
        } else {
            $("#MOV02-handle_3").removeClass("blink-amber");
     $("#MOV02-pipe_3").removeClass("blink-amber");
              if (mov2openfb === 1) {
                $("#MOV02-handle_3").css("fill", "green");
                $("#MOV02-pipe_3").css("fill", "green");
  $("#CP02toOut").css("fill", "#23AAE2");   
  $("#outlet-network").css("fill", "#23AAE2");
            } else {
                $("#MOV02-handle_3").css("fill", "D30404");
  $("#MOV02-pipe_3").css("fill", "D30404");
            }
        }


 if (mov3trip === 1) {
            $("#MOV02-handle_2").addClass("blink-amber");
     $("#MOV02-pipe_2").addClass("blink-amber");
            $("#MOV02-handle_2").css("fill", "#FFBF00");
     $("#MOV02-pipe_2").css("fill", "#FFBF00"); 
        } else {
            $("#MOV02-handle_2").removeClass("blink-amber");
     $("#MOV02-pipe_2").removeClass("blink-amber");
              if (mov3openfb === 1) {
                $("#MOV02-handle_2").css("fill", "green");
                $("#MOV02-pipe_2").css("fill", "green");
  $("#CP03toOut_2").css("fill", "#23AAE2");  
  $("#CP03toOut").css("fill", "#23AAE2");  
  $("#outlet-network").css("fill", "#23AAE2");
            } else {
                $("#MOV02-handle_2").css("fill", "D30404");
  $("#MOV02-pipe_2").css("fill", "D30404");
            }
        }

 if (mov4trip === 1) {
            $("#MOV02-handle").addClass("blink-amber");
     $("#MOV02-pipe").addClass("blink-amber");
            $("#MOV02-handle").css("fill", "#FFBF00");
     $("#MOV02-pipe").css("fill", "#FFBF00"); 
        } else {
            $("#MOV02-handle").removeClass("blink-amber");
     $("#MOV02-pipe").removeClass("blink-amber");
              if (mov4openfb === 1) {
                $("#MOV02-handle").css("fill", "green");
                $("#MOV02-pipe").css("fill", "green");
  $("#CP04toOut_2").css("fill", "#23AAE2");  
  $("#CP04toOut").css("fill", "#23AAE2");  
  $("#CP03toOut").css("fill", "#23AAE2");
  $("#outlet-network").css("fill", "#23AAE2");
            } else {
                $("#MOV02-handle").css("fill", "D30404");
  $("#MOV02-pipe").css("fill", "D30404");
            }
        }

 $("#cp01TotalHrs_3 tspan").text(cp1hrs);  
 $("#cp02TotalHrs tspan").text(cp2hrs);
 $("#cp01TotalHrs_2 tspan").text(cp3hrs);
 $("#cp01TotalHrs tspan").text(cp4hrs);

 
if (flowtxd !== null && flowtxd !== undefined) {
    $("#flowRateValue tspan").text(flowtxd.toFixed(2));
} else {
    console.error("Error: flowtxd is null or undefined");
}



if (pressuretxd !== null && pressuretxd !== undefined) {
    $("#pressureValue tspan").text(pressuretxd.toFixed(2));
} else {
    console.error("Error: pressuretxd is null or undefined");
}




};

    websocket.onerror = function (evt) {
        console.error("WebSocket error:", evt);
    };
}

function sendEmptyMessage() {
    if (websocket && websocket.readyState === websocket.OPEN) {
        websocket.send(""); // Sending an empty message
    } else {
        console.warn("WebSocket connection is not open. Reconnecting...");
        startWebSocket(); // Attempt to (re)establish WebSocket connection
    }
}

//Svg Pump-pipe-MoV End// 

//Svg Tank Start//

var apiUri;
var websocket;
var wsUri;

$(document).ready(function () {
    // Retrieve the saved IP address from local storage
    var savedIP = localStorage.getItem('savedIP');
    if (savedIP) {
        // If IP address is found, construct WebSocket URL
        apiUri = "https://ipc.iotkeystone.com:44" + savedIP + "/api/getStationInfo";
        wsUri = "wss://ws.iotkeystone.com:80" + savedIP + "/ws/liveStationData";

        console.log("API URL:", apiUri); // Debugging: Log API URL
        startapi(); // Start WebSocket connection
    } else {
        // If IP address is not found, show an error message
        showError("IP address not found in local storage.");
    }
});

function startapi() {
    // Fetch data from API before WebSocket connection
    $.ajax({
        url: apiUri,
        type: "GET",
        success: function (apiData) {
            // Process API response here
            console.log("API response:", apiData);

            // Extract tank value from API response
            var tankvalue = apiData.data.waterTankMaxLvl;
            console.log("Tank Value:", tankvalue); // Debugging: Log tank value

            // Establish WebSocket connection after fetching tank value
            websocket = new WebSocket(wsUri);
            websocket.onopen = function (evt) {
                console.log("WebSocket connection opened");
            };

            websocket.onmessage = function (evt) {
                var responseData = JSON.parse(evt.data);
                // Process the received JSON response here
                console.log("Received JSON response:", responseData);

                var tank = responseData.pump_house_Water_Level_Txd;
                var tankfull = responseData.Water_Tank_Full;
                var tankempty = responseData.Water_Tank_Empty;

                console.log("Tank Level:", tank); // Debugging: Log tank level
                console.log("Tank Full:", tankfull); // Debugging: Log tank full
                console.log("Tank Empty:", tankempty); // Debugging: Log tank empty

                if (tank !== null && tank !== undefined && tankvalue) {
                    var Height, yCoordinate;
                    if  (tank <= tankvalue) {
                        // Adjust calculation for smaller tanks
                        Height = 670; // Adjusted Height
                        var percentageHeight = (parseFloat(tank) / tankvalue) * Height;
                        yCoordinate = 1148.47 - percentageHeight; // Adjusted y-coordinate
                    } else {
                        // For larger tanks
                        Height = 670;
                        yCoordinate = 1148.47 - Height;
                    }

                    // Set the height and y-coordinate of the water level in the tank
                    console.log("Percentage Height:", percentageHeight); // Debugging: Log percentage height
                    console.log("Y Coordinate:", yCoordinate); // Debugging: Log y-coordinate

                    $("#waterHeightInTank").attr("height", percentageHeight);
                    $("#waterHeightInTank").attr("y", yCoordinate);

                    // Format the tank percentage to display only two digits after the decimal point
                    var formattedTank = parseFloat(tank).toFixed(0);

                    // Update the text showing the percentage
                    $("#waterLevelValue tspan").text(formattedTank);

                    // Set the fill color of the water level
                    $("#waterHeightInTank").css("fill", "#23AAE2");

                    // Change colors based on tank percentage
                    if (tankfull === 1) { // Full tank
                        $("#Ellipse43").add("#Ellipse44").css("fill", "green");
                        $("#Ellipse43_2").add("#Ellipse44_2").css("fill", "gray");
                    } else if (tankempty === 1) { // Nearly empty tank
                        $("#Ellipse43").add("#Ellipse44").css("fill", "gray");
                        $("#Ellipse43_2").add("#Ellipse44_2").css("fill", "red");
                    }
                } else {
                    // Handle the case where tank or tankvalue is null or undefined
                    console.error("Error: tank or tankvalue is null or undefined");
                }
            };

            websocket.onerror = function (evt) {
                console.error("WebSocket error:", evt);
            };
        },
        error: function (xhr, status, error) {
            // Handle error fetching API data here
            console.error("Error fetching API data:", error);
        }
    });
}

//Svg Tank End//

//Svg Pump-pipe-mov hide Start//

$(document).ready(function() {
    var savedIP = localStorage.getItem('savedIP');
    
    if (savedIP) { 
        // Fetch data from the API endpoint
        $.getJSON('https://ipc.iotkeystone.com:44' + savedIP + '/api/getStationInfo', function(data) {
            if (!data.error) {
                // Determine which elements to show based on the received data
                const noOfSP = data.data.noOfSP;
                const noOfCP = data.data.noOfCP;

                // Show or hide SP elements based on the conditions
                for (let i = 1; i <= 3; i++) {
                    const spId = `SP0${i}`;
                    
                    // Show SP elements if i is less than or equal to noOfSP, otherwise hide them
                    if (i <= noOfSP) {
                        $(`#${spId}`).show();
                    } else {
                        $(`#${spId}`).hide();
                    }
                }

                // Show or hide CP elements based on the conditions
                for (let i = 1; i <= 4; i++) {
                    const cpId = `CP0${i}`;
                    
                    // Show CP elements if i is less than or equal to noOfCP, otherwise hide them
                    if (i <= noOfCP) {
                        $(`#${cpId}`).show();
                    } else {
                        $(`#${cpId}`).hide();
                    }
                }
            } else {
                console.error(data.message);
            }
        })
        .fail(function(error) {
            console.error('Error fetching data:', error);
        });
    } else {
        // If IP address is not found, show an error message
        showError("IP address not found in local storage.");
    }
});

//Svg Pump-pipe-mov hide END//////////////////////////////////////////////////////////////////////////////
/*/Main Screen JS END/*/

/*/Alarm Screen JS Start/*/////////////////////////////////////////////////////////////////////////////
//Alarm label Start//

var websocket;
var wsUri;

$(document).ready(function () {
    // Retrieve the saved IP address from local storage
    var savedIP = localStorage.getItem('savedIP');
    if (savedIP) {
        // If IP address is found, construct WebSocket URL
        wsUri = "wss://ws.iotkeystone.com:80"+savedIP+"/ws/liveAlarmData";
        startWebSocket(); // Start WebSocket connection
    } else {
        // If IP address is not found, show an error message
        showError("IP address not found in local storage.");
    }
});

function startWebSocket() {
    websocket = new WebSocket(wsUri);
    websocket.onopen = function (evt) {
        console.log("WebSocket connection opened");
    };

    websocket.onmessage = function (evt) {
        var responseData = JSON.parse(evt.data);
        // Process the received JSON response here
        console.log("Received JSON response:", responseData);


 var alarm1 = responseData.E_Stop_PB;
        var alarm2 = responseData.Main_Healthy;
 var alarm3 = responseData.Reverse_Contactor;
 var alarm4 = responseData.SP1_Trip;
 var alarm5 = responseData.SP_2_Trip;
 var alarm25 = responseData.SP_3_Trip;
        var alarm6 = responseData.CP_1_Trip;
 var alarm7 = responseData.CP_2_Trip;
 var alarm8 = responseData.CP_3_Trip;
 var alarm26 = responseData.CP_4_Trip;
 var alarm9 = responseData.SP_1_FailtoRun_FB;
 var alarm10 = responseData.SP_2_FailtoRun_FB;
 var alarm11 = responseData.CP_1_FailtoRun_FB;
 var alarm12 = responseData.CP_2_FailtoRun_FB;
 var alarm13 = responseData.CP_3_FailtoRun_FB;
 var alarm14 = responseData.Both_SP_Pump_Trip;
 var alarm15 = responseData.All_CP_FailtoRun_FB;
 var alarm16 = responseData.MOV_1_Fail_to_open;
 var alarm17 = responseData.MOV_2_Fail_to_open;
 var alarm18 = responseData.MOV_3_Fail_to_open;
 var alarm19 = responseData.MOV_4_Fail_to_open;
 var alarm20 = responseData.SP1_Failtostop;
 var alarm21 = responseData.SP2_Failtostop;
 var alarm22 = responseData.CP1_Failtostop;
 var alarm23 = responseData.CP2_Failtostop;
 var alarm24 = responseData.CP3_Failtostop;
 


 if (alarm1 !== null) {
            
            $("#label1").text(alarm1);
            } else {
            // Clear the text in the p element if the value is null
            $("#label1").text("");
        }

        if (alarm2 !== null) {
            
            $("#label2").text(alarm2);
            } else {
            // Clear the text in the p element if the value is null
            $("#label2").text("");
        }

 if (alarm3 !== null) {
            
            $("#label3").text(alarm3);
            } else {
            // Clear the text in the p element if the value is null
            $("#label3").text("");
        }
 
 if (alarm4 !== null) {
            
            $("#label4").text(alarm4);
            } else {
            // Clear the text in the p element if the value is null
            $("#label4").text("");
        }
 if (alarm5 !== null) {
            
            $("#label5").text(alarm5);
            } else {
            // Clear the text in the p element if the value is null
            $("#label5").text("");
        }
  if (alarm6 !== null) {
            
            $("#label6").text(alarm6);
            } else {
            // Clear the text in the p element if the value is null
            $("#label6").text("");
        }
 if (alarm7 !== null) {
            
            $("#label7").text(alarm7);
            } else {
            // Clear the text in the p element if the value is null
            $("#label7").text("");
        }
 if (alarm8 !== null) {
            
            $("#label8").text(alarm8);
            } else {
            // Clear the text in the p element if the value is null
            $("#label8").text("");
        }

 if (alarm9 !== null) {
            
            $("#label9").text(alarm9);
            } else {
            // Clear the text in the p element if the value is null
            $("#label9").text("");
        }
 if (alarm10 !== null) {
            
            $("#label9").text(alarm10);
            } else {
            // Clear the text in the p element if the value is null
            $("#label10").text("");
        }
 if (alarm11 !== null) {
            
            $("#label11").text(alarm11);
            } else {
            // Clear the text in the p element if the value is null
            $("#label11").text("");
        }
 if (alarm12 !== null) {
            
            $("#label12").text(alarm12);
            } else {
            // Clear the text in the p element if the value is null
            $("#label12").text("");
        }
 if (alarm13 !== null) {
            
            $("#label13").text(alarm13);
            } else {
            // Clear the text in the p element if the value is null
            $("#label13").text("");
        }
 if (alarm14 !== null) {
            
            $("#label14").text(alarm14);
            } else {
            // Clear the text in the p element if the value is null
            $("#label14").text("");
        }
 if (alarm15 !== null) {
            
            $("#label15").text(alarm15);
            } else {
            // Clear the text in the p element if the value is null
            $("#label15").text("");
        }
 if (alarm16 !== null) {
            
            $("#label16").text(alarm16);
            } else {
            // Clear the text in the p element if the value is null
            $("#label16").text("");
        }
 if (alarm17 !== null) {
            
            $("#label17").text(alarm17);
            } else {
            // Clear the text in the p element if the value is null
            $("#label17").text("");
        }
 if (alarm18 !== null) {
            
            $("#label18").text(alarm18);
            } else {
            // Clear the text in the p element if the value is null
            $("#label18").text("");
        }
 if (alarm19 !== null) {
            
            $("#label19").text(alarm19);
            } else {
            // Clear the text in the p element if the value is null
            $("#label19").text("");
        }
 if (alarm20 !== null) {
            
            $("#label20").text(alarm20);
            } else {
            // Clear the text in the p element if the value is null
            $("#label20").text("");
        }
 if (alarm21 !== null) {
            
            $("#label21").text(alarm21);
            } else {
            // Clear the text in the p element if the value is null
            $("#label21").text("");
        }
 if (alarm22 !== null) {
            
            $("#label22").text(alarm22);
            } else {
            // Clear the text in the p element if the value is null
            $("#label22").text("");
        }
 if (alarm23 !== null) {
            
            $("#label23").text(alarm23);
            } else {
            // Clear the text in the p element if the value is null
            $("#label23").text("");
        }
 if (alarm24 !== null) {
            
            $("#label24").text(alarm24);
            } else {
            // Clear the text in the p element if the value is null
            $("#label24").text("");
        }

 if (alarm25 !== null) {
            
            $("#label25").text(alarm25);
            } else {
            // Clear the text in the p element if the value is null
            $("#label25").text("");
        }
         
 if (alarm26 !== null) {
            
            $("#label26").text(alarm26);
            } else {
            // Clear the text in the p element if the value is null
            $("#label26").text("");
        }
 
    };
}



function showError(message) {
    // Show error message to the user
    console.error(message);
    alert(message);
}

//Alarm label End//

//Alarm Reset Start//

$(document).ready(function() {
    $("#resetBtn").click(function() {
        // Retrieve savedIP from local storage
        var savedIP = localStorage.getItem("savedIP");

        if (!savedIP) {
            console.error("No IP address found in local storage");
            return; // Exit if savedIP is not found
        }

        // Create the JSON payload
        var payload = {
            "registers": [
                {
                    "tag": "HMI_Reset_IoT_Reset",
                    "value": 1
                }
            ]
        };

        // Construct the URL
        var url = "https://ipc.iotkeystone.com:44" + savedIP + "/api/registers";

        // Send the request with JSON payload
        $.ajax({
            type: "POST",
            url: url,
            data: JSON.stringify(payload),
            contentType: "application/json",
            success: function(response) {
                console.log("Reset message sent successfully");
                // You can do something with the response if needed
            },
            error: function(xhr, status, error) {
                console.error("Failed to send reset message. Status code: " + xhr.status);
                console.error("Error: " + error);
            }
        });
    });
});

//Alarm Reset End//
/*/Alarm Screen JS End/*/////////////////////////////////////////////////////////////////////////////

/*/Alarm LOG Screen JS Start/*/////////////////////////////////////////////////////////////////////////////
$(document).ready(function() {
    let currentLimit = 10; // Default limit
    let currentPage = 1; // Current page
    let currentSearch = ""; // Current search query

    // Set current date as default for toDate input
    const toDateInput = $('#toDate');
    const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    toDateInput.val(today);

    // Set the first day of the current month as default for fromDate input
    const fromDateInput = $('#fromDate');
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    fromDateInput.val(firstDayOfMonth);

    // Retrieve the saved IP address from local storage
    var savedIP = localStorage.getItem('savedIP');

    if (savedIP) {
        function fetchData(page, limit, search, fromDate, toDate) {
            const postData = {
                "from": `${fromDate}T00:00:00Z`,
                "to": `${toDate}T23:59:59Z`,
                "search": search,
                "start": (page - 1) * limit + 1,
                "limit": limit
            };

            const url = `https://ipc.iotkeystone.com:44${savedIP}/api/getAlertLogs`;

            $('#loading').show();

            $.ajax({
                url: url,
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(postData),
                success: function(response) {
                    $('#loading').hide();
                    if (!response.error) {
                        updateTable(response.data);
                    } else {
                        alert("Error fetching data: " + response.error);
                    }
                },
                error: function(xhr, status, error) {
                    $('#loading').hide();
                    alert("Error with the request: " + error);
                }
            });
        }

        function updateTable(data) {
            $('#table-body25').empty();
            data.forEach((item, index) => {
                const startTime = new Date(item.start).toLocaleString();
                const endTime = item.end ? new Date(item.end).toLocaleString() : "N/A";

                const row = $(`
                    <tr>
                        <td>${(currentPage - 1) * currentLimit + index + 1}</td>
                        <td>${item.descr}</td>
                        <td>${startTime}</td>
                        <td>${endTime}</td>
                        <td>${item.status}</td>
                    </tr>
                `);

                // Calculate dynamic padding based on description length
                const paddingValue = Math.min(20, 10 + item.descr.length / 10); // Example calculation with max limit
                row.find('td:not(:first-child)').css('padding', `${paddingValue}px`);

                // Add click event to toggle 'selected25' class
                row.click(function() {
                    $(this).toggleClass('selected25');
                });

                $('#table-body25').append(row);
            });

            // Update current page display
            $('#currentPage').text(`Page ${currentPage}`);
        }

        // Function to get the selected dates
        function getSelectedDates() {
            const fromDate = $('#fromDate').val();
            const toDate = $('#toDate').val();
            return { fromDate, toDate };
        }

        // Initial fetch with default dates
        const initialDates = getSelectedDates();
        fetchData(currentPage, currentLimit, currentSearch, initialDates.fromDate, initialDates.toDate);

        // Limit select change event handler
        $('#limitSelect').change(function() {
            currentLimit = parseInt($(this).val(), 10);
            currentPage = 1; // Reset to first page when limit changes
            const dates = getSelectedDates();
            fetchData(currentPage, currentLimit, currentSearch, dates.fromDate, dates.toDate);
        });

        // Search button click event handler
        $('#searchButton').click(function() {
            currentSearch = $('#searchInput').val().trim();
            currentPage = 1; // Reset to first page when search changes
            const dates = getSelectedDates();
            fetchData(currentPage, currentLimit, currentSearch, dates.fromDate, dates.toDate);
        });

        // Previous page button click handler
        $('#prevPage').click(function() {
            if (currentPage > 1) {
                currentPage--;
                const dates = getSelectedDates();
                fetchData(currentPage, currentLimit, currentSearch, dates.fromDate, dates.toDate);
            }
        });

        // Next page button click handler
        $('#nextPage').click(function() {
            // Check if there is more data available
            const currentRowCount = $('#table-body25 tr').length;
            if (currentRowCount === currentLimit) {
                currentPage++;
                const dates = getSelectedDates();
                fetchData(currentPage, currentLimit, currentSearch, dates.fromDate, dates.toDate);
            }
        });
    } else {
        // If IP address is not found, show an error message
        alert("IP address not found in local storage.");
    }
});

/*/Alarm LOG Screen JS End/*/////////////////////////////////////////////////////////////////////////////

/*/Manual Screen JS Start/*/////////////////////////////////////////////////////////////////////////////
//Auto-Manual Indication Start//

var websocket;
var wsUri;

$(document).ready(function () {
    // Retrieve the saved IP address from local storage
    var savedIP = localStorage.getItem('savedIP');
    if (savedIP) {
        // If IP address is found, construct WebSocket URL
        wsUri = "wss://ws.iotkeystone.com:80"+ savedIP+"/ws/liveManualOpsData";
        startWebSocket(); // Start WebSocket connection
    } else {
        // If IP address is not found, show an error message
        showError("IP address not found in local storage.");
    }
});

function startWebSocket() {
    websocket = new WebSocket(wsUri); // Create WebSocket connection

    websocket.onopen = function (evt) {
        console.log("WebSocket connection established.");
    };

    websocket.onmessage = function (evt) {
        var responseData = JSON.parse(evt.data);
        // Process the received JSON response here
        console.log("Received JSON response:", responseData);

        var indicator8 = responseData.Manual_Mode_Ready;

        if (indicator8 === 0) {
            $("#indicationButton8").css({
                "background-color": "red",
                "box-shadow": "0 0 20px rgba(255, 0, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.5) inset"
            });
        } else if (indicator8 === 1) {
            $("#indicationButton8").css({
                "background-color": "#52fc03",
                "box-shadow": "0 0 20px rgba(82, 252, 3, 0.5), 0 0 20px rgba(82, 252, 3, 0.5) inset"
            });
        } else {
            $("#indicationButton8").css({
                "background-color": "grey",
            });
        }
    };

    websocket.onerror = function (evt) {
        console.error("WebSocket error:", evt);
    };
}

function sendEmptyMessage() {
    if (websocket && websocket.readyState === websocket.OPEN) {
        websocket.send(""); // Sending an empty message
    } else {
        console.warn("WebSocket connection is not open. Reconnecting...");
        startWebSocket(); // Attempt to (re)establish WebSocket connection
    }
}
//Auto-Manual Indication End//

//Manual Table Control Start//

$(document).ready(function() {
    var savedIP = localStorage.getItem('savedIP');

    // Establish WebSocket connection
    var socket = new WebSocket('wss://ws.iotkeystone.com:80'+savedIP+'/ws/liveManualOpsData');

    // WebSocket on open event listener
    socket.onopen = function(event) {
        console.log('WebSocket connection established');
    };

    // WebSocket on message event listener
    socket.onmessage = function(event) {
        var data = JSON.parse(event.data);

        // Update button colors based on backend data
        updateButtonColor('CP', 1, data.CP_1_Run_FB);
        updateButtonColor('CP', 2, data.CP_2_Run_FB);
        updateButtonColor('CP', 3, data.CP_3_Run_FB);
        updateButtonColor('SP', 1, data.SP1_Run_FB);
        updateButtonColor('SP', 2, data.SP_2_Run_FB);
        updateButtonColor('MOV', 1, data.MOV_1_OPEN_FB);
        updateButtonColor('MOV', 2, data.MOV_2_OPEN_FB);
        updateButtonColor('MOV', 3, data.MOV_3_OPEN_FB);
    };

    // Function to update button color based on backend data
    function updateButtonColor(type, index, value) {
        var startBtn = $(`#${type}_start_${index}`);
        var stopBtn = $(`#${type}_stop_${index}`);
        var openBtn = $(`#${type}_open_${index}`);
        var closeBtn = $(`#${type}_close_${index}`);

        if (type === 'MOV') {
            if (value === 1) {
                // Change open button color to green
                openBtn.css('background-color', 'green');
                // Change close button color to default
                closeBtn.css('background-color', 'gray');
            } else {
                // Change open button color to default
                openBtn.css('background-color', 'gray');
                // Change close button color to red
                closeBtn.css('background-color', 'red');
            }
        }

        if (value === 1) {
            // Change start button color to green
            startBtn.css('background-color', 'green');
            // Change stop button color to default
            stopBtn.css('background-color', 'gray');
        } else {
            // Change start button color to default
            startBtn.css('background-color', 'gray');
            // Change stop button color to red
            stopBtn.css('background-color', 'red');
        }
    }

    // WebSocket on error event listener
    socket.onerror = function(error) {
        console.error('WebSocket error:', error);
    };

    // WebSocket on close event listener
    socket.onclose = function(event) {
        console.log('WebSocket connection closed');
    };

    // Call fetchStationInfo when the page loads
    fetchStationInfo();

    // Function to fetch station info
    function fetchStationInfo() {
        fetch('https://ipc.iotkeystone.com:44' + savedIP + '/api/getStationInfo')
            .then(response => response.json())
            .then(data => {
                if (!data.error) {
                    const noOfSP = data.data.noOfSP;
                    const noOfCP = data.data.noOfCP;

                    // Dynamically create buttons for centrifugal pumps
                    for (let i = 1; i <= noOfCP; i++) {
                        createPumpButtons('CP', i);
                    }

                    // Dynamically create buttons for submersible pumps
                    for (let i = 1; i <= noOfSP; i++) {
                        createPumpButtons('SP', i);
                    }

                    // Dynamically create buttons for MOVs
                    for (let i = 1; i <= 3; i++) { // Assuming there are 3 MOVs
                        createMOVButtons(i);
                    }
                } else {
                    console.error('Error fetching station info:', data.message);
                }
            })
            .catch(error => console.error('Error fetching station info:', error));
    }

    // Function to create pump buttons
    function createPumpButtons(type, index) {
        const container = $('#' + type + 'PumpContainer');
        const pumpInfo = $('<div class="pump-info"></div>');
        
        // Create label on the left side
        const pumpText = $(`<span class="label">${type === 'CP' ? 'Centrifugal' : 'Submersible'} Pump ${index} Manual Start/Stop</span>`);
        
        // Create buttons container on the right side
        const pumpButtons = $('<div class="button-container"></div>');
        
        const startBtn = $(`<button class="button start-btn" id="${type}_start_${index}">Start</button>`);
        const stopBtn = $(`<button class="button stop-btn" id="${type}_stop_${index}">Stop</button>`);

        startBtn.click(() => handleButtonClick(`${type.toUpperCase()}_${index}_Man_Start`));
        stopBtn.click(() => handleButtonClick(`${type.toUpperCase()}_${index}_Man_Stop`));

        pumpButtons.append(startBtn);
        pumpButtons.append(stopBtn);

        pumpInfo.append(pumpText);
        pumpInfo.append(pumpButtons);

        container.append(pumpInfo);
    }

    // Function to create MOV buttons
    function createMOVButtons(index) {
        const movContainer = $('#movContainer');
        const pumpInfo = $('<div class="pump-info"></div>');

        // Create label on the left side
        const pumpText = $(`<span class="label">MOV ${index} Manual Open/Close</span>`);
        
        // Create buttons container on the right side
        const pumpButtons = $('<div class="button-container"></div>');
        
        const openBtn = $(`<button class="button open-btn" id="MOV_open_${index}">Open</button>`);
        const closeBtn = $(`<button class="button close-btn" id="MOV_close_${index}">Close</button>`);

        openBtn.click(() => handleButtonClick(`MOV${index}_man_open`));
        closeBtn.click(() => handleButtonClick(`MOV${index}_man_close`));

        pumpButtons.append(openBtn);
        pumpButtons.append(closeBtn);

        pumpInfo.append(pumpText);
        pumpInfo.append(pumpButtons);

        movContainer.append(pumpInfo);
    }

    // Function to handle button click
    function handleButtonClick(tag) {
        const payload = {
            "registers": [{ "tag": tag, "value": 1 }]
        };

        console.log("payload", payload);

        fetch('https://ipc.iotkeystone.com:44' + savedIP + '/api/registers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to send command to the backend.');
                }
                console.log(`Command sent successfully for tag: ${tag}`);
                // You may update UI or perform additional actions here if needed
            })
            .catch(error => {
                console.error('Error sending command to the backend:', error);
                // Handle error
            });
    }
});


//Manual Table Control End//
/*/Manual Screen JS End/*/////////////////////////////////////////////////////////////////////////////


/*/Schedule Screen JS Start/*/////////////////////////////////////////////////////////////////////////////

$(document).ready(function() {

    var savedIP = localStorage.getItem('savedIP');

    if (savedIP) {
        // Function to fetch data from the API
        $.getJSON('https://ipc.iotkeystone.com:44' + savedIP + '/api/getStationInfo')
            .done(function(data) {
                if (data && data.data) {
                    const noOfSP = data.data.noOfSP;
                    const noOfCP = data.data.noOfCP;

                    // Hide all SP and CP headers and their corresponding start and stop time headers
                    $('.spHeader, .sp1, .sp2, .sp3, .sp4, .sp5, .sp6, .sp7, .sp8, .sp9, .sp9, .sp10, .cpHeader, .cp1, .cp2, .cp3, .cp4 , .cp5 , .cp6, .cp7, .cp8, .cp9, .cp10 ').hide();

                    // Show SP column headers and their start and stop time headers based on noOfSP
                    for (let i = 1; i <= noOfSP; i++) {
                        $('.spHeader:eq(' + (i - 1) + '), .sp' + i).show();
                    }

                    // Show CP column headers and their start and stop time headers based on noOfCP
                    for (let i = 1; i <= noOfCP; i++) {
                        $('.cpHeader:eq(' + (i - 1) + '), .cp' + i).show();
                    }

                    // Create rows for each day
                    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const tableBody = $('#tableBody');
                    daysOfWeek.forEach(day => {
                        const row = $('<tr></tr>');
                        row.append('<td class="schedule-column weekday">' + day + '</td>');

                        // Create cells for SP columns
                        for (let i = 1; i <= noOfSP; i++) {
                            row.append('<td class="time-input sp' + i + '" colspan="2" id="timeInput_SP' + i + '_' + day + '"><input type="text" class="start-hour sp' + i + '" id="Hour_on_Set_for_SP' + i + '_' + day + '" name="start" value="0" readonly style="width: 40px;"><span style="color: white;">:</span><input type="text" class="start-minute sp' + i + '" id="Minutes_on_Set_for_SP' + i + '_' + day + '" name="startminute" value="0" readonly style="width: 40px;">&nbsp;&nbsp;<input type="text" class="end-hour sp' + i + '" id="Hours_off_Set_for_SP' + i + '_' + day + '" name="stop" value="0" readonly style="width: 40px;"><span style="color: white;">:</span><input type="text" class="end-minute sp' + i + '" id="Minutes_off_Set_for_SP' + i + '_' + day + '" name="stopminute" value="0" readonly style="width: 40px;"></td>');
                        }

                        // Create cells for CP columns
                        for (let i = 1; i <= noOfCP; i++) {
                            row.append('<td class="time-input cp' + i + '" colspan="2" id="timeInput_CP' + i + '_' + day + '"><input type="text" class="start-hour cp' + i + '" id="Hour_on_Set_for_CP' + i + '_' + day + '" name="start" value="0"readonly  style="width: 40px;"><span style="color: white;">:</span><input type="text" class="start-minute cp' + i + '" id="Minutes_on_Set_for_CP' + i + '_' + day + '" name="startminute" value="0" readonly style="width: 40px;">&nbsp;&nbsp;<input type="text" class="end-hour cp' + i + '" id="Hours_off_Set_for_CP' + i + '_' + day + '" name="stop" value="0" readonly style="width: 40px;"><span style="color: white;">:</span><input type="text" class="end-minute cp' + i + '" id="Minutes_off_Set_for_CP' + i + '_' + day + '" name="stopminute" value="0"  readonly style="width: 40px;"></td>');
                        }

                        tableBody.append(row);
                    });

                    // Connect to WebSocket when the document is ready
                    connectToWebSocket();
                }
            });

        // Function to connect to WebSocket and receive live schedule data
        function connectToWebSocket() {
            const socket = new WebSocket('wss://ws.iotkeystone.com:80' + savedIP + '/ws/liveScheduleData');

            socket.onopen = function() {
                console.log('WebSocket connection established.');
            };

            socket.onmessage = function(event) {
                const data = JSON.parse(event.data);
                updateInputFields(data);
                console.log("data", data);
            };

            // Function to update input fields with data received from WebSocket
            function updateInputFields(data) {
                // Loop through each key-value pair in the data object
                Object.entries(data).forEach(([key, value]) => {
                    console.log("Received tag: " + key + ", value: " + value);

                    // Update input field based on the key (tag)
                    const inputField = $('#' + key); // Assuming IDs match with WebSocket data
                    if (inputField.length > 0) {
                        // If the value is single-digit, add leading zero
                        if (value < 10) {
                            inputField.val('0' + value);
                        } else {
                            inputField.val(value);
                        }
                    } else {
                        console.log("Input field with ID '" + key + "' not found.");
                    }
                });
            }
        }

        // Set event listener for opening popup when clicking on table cell
        $('body').on('click', '.time-input', function() {
            // Get the row index and column index of the clicked cell
            const rowIndex = $(this).closest('tr').index();
            const colIndex = $(this).index();

            // Determine if it's SP or CP based on the class of the clicked cell
            const spOrCpClass = $(this).attr('class').split(' ')[1]; // Get the second class
            const spOrCp = spOrCpClass.substring(0, 2).toUpperCase(); // Extract 'SP' or 'CP'
            const spOrCpIndex = spOrCpClass.substring(2); // Extract the index

            // Get the day value based on row index
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const day = daysOfWeek[rowIndex];

            // Get the start and stop times from the clicked cell
            const startHour = $(this).find('.start-hour').val();
            const startMinute = $(this).find('.start-minute').val();
            const stopHour = $(this).find('.end-hour').val();
            const stopMinute = $(this).find('.end-minute').val();

            // Show the popup modal with specific SP/CP, day, and time values
            showPopup(spOrCp, spOrCpIndex, day, startHour, startMinute, stopHour, stopMinute);
        });

        // Function to show the popup modal with values from all input fields
        function showPopup(spOrCp, spOrCpIndex, day, startHour, startMinute, stopHour, stopMinute) {
            // Create the popup modal dynamically
            const popup = $(`<div id="timePopup" style="display: block;">
            <p id="scheduleInfo">Editing schedule for ${spOrCp}${spOrCpIndex} on ${day}</p> <br> <!-- Display SP/CP and weekday here -->
            <label>Start Time:</label>
            <input type="text" id="startHour" placeholder="00" pattern="[0-9]{2}" maxlength="2" style="width: 40px;" value="${startHour}" oninput="this.value = this.value.replace(/[^0-9]/g, '').substring(0, 2)"><label> : </label>
            <input type="text" id="startMinute" placeholder="00" pattern="[0-9]{2}" maxlength="2" style="width: 40px;" value="${startMinute}" oninput="this.value = this.value.replace(/[^0-9]/g, '').substring(0, 2)"> 

<br>
<br>
            <label>Stop Time:</label>
            <input type="text" id="stopHour" placeholder="00" pattern="[0-9]{2}" maxlength="2" style="width: 40px;" value="${stopHour}" oninput="this.value = this.value.replace(/[^0-9]/g, '').substring(0, 2)"><label> : </label>
            <input type="text" id="stopMinute" placeholder="00" pattern="[0-9]{2}" maxlength="2" style="width: 40px;" value="${stopMinute}" oninput="this.value = this.value.replace(/[^0-9]/g, '').substring(0, 2)">
            <br>
            <div id="errorMessage" style="color: red;"></div> <!-- Error message element -->
            <button id="setTimes" style="background-color: blue; color: white;">Set Times</button>
            <button id="cancel" style="background-color: gray; color: white;">Cancel</button>
            </div>`);


            // Append the popup modal to the body
            $('body').append(popup);

            // Set event listener for "Set Times" button
            $('#setTimes').click(function() {
                // Retrieve values from the popup modal
                const newStartHour = $('#startHour').val();
                const newStartMinute = $('#startMinute').val();
                const newStopHour = $('#stopHour').val();
                const newStopMinute = $('#stopMinute').val();

                // Validate the time format
                const isValidStartTime = validateTime(newStartHour, newStartMinute);
                const isValidStopTime = validateTime(newStopHour, newStopMinute);

                if (!isValidStartTime || !isValidStopTime) {
                    $('#errorMessage').text('Error: Invalid time format. Time should be in the format HH:mm (00:00 to 23:59).');
                    return; // Exit function if validation fails
                } else {
                    $('#errorMessage').text(''); // Clear error message if validation passes
                }

                // Call the handleFormSubmission function
                handleFormSubmission(newStartHour, newStartMinute, newStopHour, newStopMinute, spOrCp, spOrCpIndex, day);
            });

            // Set event listener for "Cancel" button
            $('#cancel').click(function() {
                // Hide the popup modal
                $('#timePopup').remove();
            });
        }

        // Function to validate time format
        function validateTime(hour, minute) {
            const hourRegex = /^(0?[0-9]|1[0-9]|2[0-3])$/; // Allowing leading zero for single-digit hours
            const minuteRegex = /^[0-5]?[0-9]$/; // Allowing leading zero for single-digit minutes

            return hourRegex.test(hour) && minuteRegex.test(minute);
        }

        // Function to handle form submission
        function handleFormSubmission(newStartHour, newStartMinute, newStopHour, newStopMinute, spOrCp, spOrCpIndex, day) {
            // Convert time inputs to minutes for comparison
            const startTimeMinutes = parseInt(newStartHour) * 60 + parseInt(newStartMinute);
            const stopTimeMinutes = parseInt(newStopHour) * 60 + parseInt(newStopMinute);

            // Check if start time is less than stop time and time format is correct
            if (startTimeMinutes >= stopTimeMinutes) {
                $('#errorMessage').text('Error: Start time must be before stop time.');
                return; // Exit function if validation fails
            } else {
                $('#errorMessage').text(''); // Clear error message if validation passes
            }

            // Send AJAX request to update backend values
            const requestData = {
                registers: [
                    { tag: `Hour_on_Set_for_${spOrCp}${spOrCpIndex}_${day}`, value: parseInt(newStartHour) },
                    { tag: `Minutes_on_Set_for_${spOrCp}${spOrCpIndex}_${day}`, value: parseInt(newStartMinute) },
                    { tag: `Hours_off_Set_for_${spOrCp}${spOrCpIndex}_${day}`, value: parseInt(newStopHour) },
                    { tag: `Minutes_off_Set_for_${spOrCp}${spOrCpIndex}_${day}`, value: parseInt(newStopMinute) }
                ]
            };

            console.log ("requestData",requestData)

            $.ajax({
                url: 'https://ipc.iotkeystone.com:44' + savedIP + '/api/registers',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(requestData),
                success: function(response) {
                    console.log('Values updated successfully:', response);
                    // Update the original input fields with the new values
                    $(`#Hour_on_Set_for_${spOrCp}${spOrCpIndex}_${day}`).val(newStartHour);
                    $(`#Minutes_on_Set_for_${spOrCp}${spOrCpIndex}_${day}`).val(newStartMinute);
                    $(`#Hours_off_Set_for_${spOrCp}${spOrCpIndex}_${day}`).val(newStopHour);
                    $(`#Minutes_off_Set_for_${spOrCp}${spOrCpIndex}_${day}`).val(newStopMinute);
                    // Hide the popup modal
                    $('#timePopup').remove();
                },
                error: function(xhr, status, error) {
                    console.error('Error updating values:', error);
                }
            });
        }
    } else {
        // If IP address is not found, show an error message
        showError("IP address not found in local storage.");
    }
});

/*/Schedule Screen JS End/*/////////////////////////////////////////////////////////////////////////////

/*/Top-bar JS Start/*/////////////////////////////////////////////////////////////////////////////
//Top-bar Indication Start//
var websocket;
var wsUri;

$(document).ready(function () {
    var savedIP = localStorage.getItem('savedIP');
    if (savedIP) {
        // Construct WebSocket URL with saved IP
        wsUri = "wss://ws.iotkeystone.com:80" + savedIP + "/ws/liveStatusBarData";
        startWebSocket();
    } else {
        showError("IP address not found in local storage.");
    }
});

function startWebSocket() {
    websocket = new WebSocket(wsUri);

    websocket.onopen = function (evt) {
        console.log("WebSocket connection established.");
    };

    websocket.onmessage = function (evt) {
        var responseData = JSON.parse(evt.data);
        console.log("Received JSON response:", responseData);
        updateIndicators(responseData);
    };

    websocket.onerror = function (evt) {
        console.error("WebSocket error:", evt);
    };
}

function updateIndicators(responseData) {
    updateIndicator("#indicationButton1", responseData.E_Stop_PB);
    updateIndicator("#indicationButton2", responseData.Main_Healthy);
    updateIndicator("#indicationButton3", responseData.System_in_Auto);
    updateIndicator("#indicationButton4", responseData.Forward_Contactor);
    updateIndicator("#indicationButton5", responseData.Reverse_Contactor);
    updateIndicator("#indicationButton6", responseData.Sys_Rdy);
}

function updateIndicator(buttonId, indicator) {
    var $button = $(buttonId);
    if (indicator === 0) {
        $button.css({
            "background-color": "red",
            "box-shadow": "0 0 20px rgba(255, 0, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.5) inset"
        });
    } else if (indicator === 1) {
        $button.css({
            "background-color": "#52fc03",
            "box-shadow": "0 0 20px rgba(82, 252, 3, 0.5), 0 0 20px rgba(82, 252, 3, 0.5) inset"
        });
    } else {
        $button.css({
            "background-color": "grey",
            "box-shadow": ""
        });
    }
}

function sendEmptyMessage() {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send("");
    } else {
        console.warn("WebSocket connection is not open. Reconnecting...");
        startWebSocket();
    }
}

//Top-bar Indication End//

//Top-bar Alarm Indication Start//

var websocket;
var wsUri;

$(document).ready(function () {
    // Retrieve the saved IP address from local storage
    var savedIP = localStorage.getItem('savedIP');
    if (savedIP) {
        // If IP address is found, construct WebSocket URL
        wsUri = "wss://ws.iotkeystone.com:80" + savedIP + "/ws/liveStatusBarData";
console.log("wsUri", wsUri)
        startWebSocket(); // Start WebSocket connection
    } else {
        // If IP address is not found, show an error message
        showError("IP address not found in local storage.");
    }
});

function startWebSocket() {
    websocket = new WebSocket(wsUri); // Create WebSocket connection

    websocket.onopen = function (evt) {
        console.log("WebSocket connection established.");
    };

    websocket.onmessage = function (evt) {
        var responseData = JSON.parse(evt.data);
        // Process the received JSON response here
        console.log("Received JSON response:", responseData);
        
        updateIndicator(responseData.AlarmsData);
console.log("responseData.AlarmsData", responseData.AlarmsData)
    };

    websocket.onerror = function (evt) {
        console.error("WebSocket error:", evt);
    };
}

function updateIndicator(alarmsData) {
    // Reset button style
    $("#indicationButton7").css({
        "background-color": "gray",
        "animation": "none"
    });

    // Loop through alarm data
    for (var key in alarmsData) {
        if (alarmsData[key] !== null) {
            // If any alarm is active, update button style and exit loop
            $("#indicationButton7").css({
                "background-color": "yellow",
                "animation": "glow 1s infinite alternate, blink 1s infinite"
            });
            return;
        }
    }
}

function showError(message) {
    // Show error message to the user
    console.error(message);
    alert(message);
}

//Top-bar Alarm Indication End//

//Top-bar Time Start//

$(document).ready(function() {
    updateTime();
    setInterval(updateTime, 1000); // Update time every second
  });
  
  function updateTime() {
    var now = new Date();
    var hours = now.getHours();
    var minutes = padZero(now.getMinutes());
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    var time = hours + ":" + minutes + " " + ampm;
    var dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    var date = now.toLocaleDateString(undefined, dateOptions);
    var day = getDayOfWeek(now.getDay());
  
    $('#time').html(time);
    $('#date').html(date);
    $('#day').html(day);
  }
  
  function padZero(num) {
    return (num < 10 ? '0' : '') + num;
  }
  
  function getDayOfWeek(day) {
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  }
//Top-bar Time End//
/*/Top-bar JS End/*/////////////////////////////////////////////////////////////////////////////


/*/Site Screen JS Start/*/////////////////////////////////////////////////////////////////////////////
//Site Selection by localID Start//
$(document).ready(function() {

    var buttons = document.getElementsByClassName("portButton");
    var savedIP = ''; // Initialize savedIP
    var buttonsClicked = false; // Flag to track if buttons are clicked

    // Loop through each button
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("click", function(event) {
            savedIP = this.getAttribute('value'); // Get the attribute value
            savedIP = savedIP.replace("{", "").replace("}", ""); // Remove curly braces
            console.log(savedIP);
            
            // Set the value in local storage
            localStorage.setItem('savedIP', savedIP);

            // Set the flag to true indicating buttons are clicked
            buttonsClicked = true;

        });
    }
});

//Site Selection by localID  End//
/*/Site Screen JS Start/*/////////////////////////////////////////////////////////////////////////////