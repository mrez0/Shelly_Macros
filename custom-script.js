/*
 * Define global variables
 */
var commands = new Array();
var is_recording = false;            //
var is_running = false;

jQuery( "document" ).ready( function () {
    // var commands_recorded = new Array(); //
// var commands_running = new Array(); //


//
    window.onload = function() {
        check_if_recording_running();
    }

    function check_if_recording_running() {
        jQuery.post(my_ajax_obj.ajax_url, {
            "action": "shelly_macros_check_if_recording_running",
        }, function(data) {

            is_recording =  (data[0] == true) ;
            is_running = (data[1] == true) ;

            // if( is_recording ) {
            //     commands_recorded = data["commands"];
            // } else if( is_running ) {
            //     commands_running = data["commands"];
            // }

            if( is_recording || is_running ) {
                commands = data["commands"];
            }

            if( is_running ) {
                do_commands();
            }
        });
    }

    /*
     * Events
     */

// Display / hide the console for Shelly Macros once CTRL+SHiFT+U is pressed
    jQuery(document).keydown(function ( e ) {
        if( e.ctrlKey && e.shiftKey && e.key == "U" ) {
            jQuery( '#shelly-console' ).slideToggle();  // slideToggle alternate between show / hide
            jQuery( '#shelly-console input' ).select();
        }
    });

//
    jQuery("a:not(#shelly-macro-console-start-recording, #shelly-macro-console-stop-recording, #shelly-macro-console-do-macro)").click( function ( e ) {
        if( ! is_recording ) {
            return;
        }
        //commands_recorded.push( new Shelly_Macros_Element( jQuery( this ) ) );
        commands.push( new Shelly_Macros_Element( jQuery( this ) ) );
    } );

    jQuery("input, textarea, select").change( function ( e ) {
        if( ! is_recording ) {
            return;
        }
        //commands_recorded.push( new Shelly_Macros_Element( jQuery( this ) ) );
        commands.push( new Shelly_Macros_Element( jQuery( this ) ) );
    } );

    jQuery("#shelly-macro-console-start-recording").click(function (e) {
        is_recording = true;
        commands = new Array();
    });

    jQuery("#shelly-macro-console-stop-recording").click(function (e) {
        is_recording = false;
        save_commands();
        //commands_recorded = new Array();
        commands = new Array();
    });

    jQuery("#shelly-macro-console-do-macro").click(function (e) {
        // if( commands.length ) {
        //     is_running = true;
        //     return do_commands();
        // }

        // Get commands from wordpress database using AJAX
        jQuery.post(my_ajax_obj.ajax_url, {
            "_ajax_nonce": my_ajax_obj.nonce,
            "action": "shelly_macros_get_commands"
        }, function(data) {
            if( data.length == 0 ) {
                return;
            }
            //commands_running = data;
            commands = data;
            do_commands();

        });
    });

    function do_commands() {
        //var commands_copy = commands_running.slice();
        var commands_copy = commands.slice();
        for( var i = 0; i < commands_copy.length; i++ ) {
            if (commands_copy[i].is_link == true) {
                //commands_running.shift();
                commands.shift();
                if( commands.length ) {
                    is_running = true;
                }
                window.location = commands_copy[i].value;
                return;
            }

            var element = jQuery(commands_copy[i].element);
            element.prev("label").text("");
            element.val(commands_copy[i].value);
            //commands_running.shift();
            commands.shift();
        }

        if( commands.length == 0 ) {
            is_running = false;
            save_running_commands();
        }
    }
    /*
     * Save array of commands before leaving page
     */

    function save_running_commands() {
        jQuery.post(my_ajax_obj.ajax_url, {
            "_ajax_nonce": my_ajax_obj.nonce,
            "action": "shelly_macros_save_running_commands",
            //"commands":  JSON.stringify(commands_running)
            "commands":  JSON.stringify(commands),
            "is_running": is_running
        }, function(data) {
            console.log(data);
        });
    }
    window.onunload = function() {
        // if( commands_recorded.length ) {
        //     save_commands( commands_recorded );
        //     commands_recorded = new Array();
        // } else if( commands_running.length ) {
        //     save_running_commands( commands_recorded );
        //     commands_running = new Array();
        // }
        if( is_recording ) {
            save_commands();
        } else if( is_running ) {
            save_running_commands();
        }
    }

    function save_commands() {

        jQuery.post(my_ajax_obj.ajax_url, {
            "_ajax_nonce": my_ajax_obj.nonce,
            "action": "shelly_macros_save_commands",
            //"commands":  JSON.stringify(commands_recorded),
            "commands":  JSON.stringify(commands),
            "is_recording": is_recording
        }, function(data) {
            console.log(data);
        });
    }

    function Shelly_Macros_Element( element ) {
        var elementName = element.prop("tagName");
        var id = ( element.attr("id") ) ? "#" + element.attr("id") : "";
        var className = ( element.attr("className") ) ? "." + element.attr("className") : "";
        this.element = elementName + id + className;

        if( "A" == elementName ) {
            this.value = element.attr("href");
            this.is_link = true;
        } else {
            this.value = element.val();
        }
    }
} );
