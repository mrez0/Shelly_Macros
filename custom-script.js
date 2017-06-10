var recording = false;
var running = false;
var commands = new Array();

jQuery(document).ready( function () {
    init_event_handlers();
    var record_mode = get_cookie_value( "shelly_macros_record_mode" );
    record_mode = ( record_mode == "true" ) ? true : false;
    var run_mode = get_cookie_value( "shelly_macros_run_mode" );
    run_mode = ( run_mode == "true" ) ? true : false;

    if( record_mode ) {
        set_mode( "record" );
        commands = get_commands_from_cookies();
        return;
    } else if( run_mode ) {
        set_mode( "run" );
        commands = get_commands_from_cookies();
        do_commands();
        return;
    }

    set_mode( "default" );
} );

function set_mode( mode ) {
    if( mode == "record" ) {
        recording = true;
        document.cookie ="shelly_macros_record_mode=true";
        running = false;
        document.cookie ="shelly_macros_run_mode=false";
        commands = new Array();
    } else if( mode == "run" ) {
        recording = false;
        document.cookie ="shelly_macros_record_mode=false";
        running = true;
        document.cookie ="shelly_macros_run_mode=true";
        commands = new Array();
    } else { // default mode
        recording = false;
        document.cookie ="shelly_macros_record_mode=false";
        running = false;
        document.cookie ="shelly_macros_run_mode=false";
        commands = new Array();
        document.cookie = "shelly_macros_commands="; // @todo change to save_commands_to_cookies
    }
}

function init_event_handlers()
{
    jQuery(document).keydown(function ( e ) {
        if( e.ctrlKey && e.shiftKey && e.key == "U" ) {
            jQuery( '#shelly-console' ).slideToggle();  // slideToggle alternate between show / hide
            jQuery( '#shelly-console input' ).select();
        } else if() {
            
        }
    });

    jQuery("a:not(#shelly-macro-console-start-recording, #shelly-macro-console-stop-recording, #shelly-macro-console-do-macro)").click( function ( e ) {
        if( ! recording ) {
            return;
        }
        commands.push( new Shelly_Macros_Element( jQuery( this ) ) );
    } );

    jQuery("input, textarea, select").change( function ( e ) {
        if( ! recording ) {
            return;
        }
        commands.push( new Shelly_Macros_Element( jQuery( this ) ) );
    } );

    jQuery("#shelly-macro-console-start-recording").click(function (e) {
        set_mode( "record" );
    });

    jQuery("#shelly-macro-console-stop-recording").click(function (e) {
        var recorded_commands = commands.slice();
        set_mode( "default" );
        save_commands_to_database( recorded_commands );
    });

    jQuery("#shelly-macro-console-do-macro").click(function (e) {
        set_mode( "run" );
        jQuery.when( get_commands_from_database() ).done( function () {
            do_commands();
        } );

    });
}

function do_commands()
{
    var commands_copy = commands.slice();

    for( var i = 0; i < commands_copy.length; i++ ) {
        if (commands_copy[i].is_link == true) {
            commands.shift();

            if( commands.length == 0 ) {
                set_mode( "default" );
            } else {
                save_commands_to_cookies( commands );
            }

            window.location = commands_copy[i].value;
            return;
        }

        var element = jQuery(commands_copy[i].element);
        element.prev("label").text(""); // To remove any placeholder placed on input
        element.val(commands_copy[i].value);

        commands.shift();
    }

    if( commands.length == 0 ) {
        set_mode( "default" );
    }
}


function get_cookie_value( cookie_name )
{
    var cookiesArray = document.cookie.split(';');
    for( var i = 0; i < cookiesArray.length; i++ ) {
        var name = cookiesArray[i].split('=')[0];
        name = name.trim();
        var value = cookiesArray[i].split('=')[1];
        if( name == cookie_name ) {
            return value.trim();
        }
    }
    return null;
}

function save_commands_to_cookies( commands )
{
    var commands_array = commands.map( function (item) {
        return JSON.stringify( item );
    } );
    document.cookie = "shelly_macros_commands=" + commands_array.join( "sm#sm" );
}

function get_commands_from_cookies()
{
    var commands_string_array = get_cookie_value( "shelly_macros_commands" ).split( "sm#sm" );
    var commands_array = commands_string_array.map( function ( item ) {
        return JSON.parse( item );
    } );
    return commands_array;
}

function save_commands_to_database( commands )
{
    jQuery.post(my_ajax_obj.ajax_url, {
        "_ajax_nonce": my_ajax_obj.nonce,
        "action": "shelly_macros_save_commands",
        "commands":  JSON.stringify(commands)
    }, function(data) {
        console.log(data);
    });
}

function get_commands_from_database()
{
    return jQuery.post(my_ajax_obj.ajax_url, {
        "_ajax_nonce": my_ajax_obj.nonce,
        "action": "shelly_macros_get_commands"
    }, function(data) {
        commands = data; // @todo try to return from outer function not set commands through ajax
    });
}

// Check if we are in record mode, save recorded commands to cookies
window.onunload = function() {

    if( recording ) {
        save_commands_to_cookies( commands );
    }
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